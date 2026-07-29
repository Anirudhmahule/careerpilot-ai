-- Validation Phase 2: Atomic Finalization Boundary

-- 1. Helper function to derive deterministic advisory lock keys
CREATE OR REPLACE FUNCTION _validation_family_lock_keys(
    p_analysis_snapshot_id uuid,
    p_role_id uuid,
    p_prompt_version text,
    p_schema_version text,
    OUT lock1 int,
    OUT lock2 int
) AS $$
BEGIN
    lock1 := hashtext(p_analysis_snapshot_id::text || p_prompt_version);
    lock2 := hashtext(p_role_id::text || p_schema_version);
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp;

-- 2. Atomic claim RPC
CREATE OR REPLACE FUNCTION claim_validation_generation_attempt(
    p_analysis_snapshot_id uuid,
    p_role_id uuid,
    p_prompt_version text,
    p_schema_version text,
    p_model text,
    p_stale_threshold_ms integer
) RETURNS jsonb AS $$
DECLARE
    v_lock1 int;
    v_lock2 int;
    v_completed_id uuid;
    v_latest_record record;
    v_new_attempt integer;
    v_new_id uuid;
BEGIN
    SELECT * INTO v_lock1, v_lock2 FROM _validation_family_lock_keys(
        p_analysis_snapshot_id, p_role_id, p_prompt_version, p_schema_version
    );
    
    PERFORM pg_advisory_xact_lock(v_lock1, v_lock2);
    
    SELECT id INTO v_completed_id
    FROM validation_generations
    WHERE analysis_snapshot_id = p_analysis_snapshot_id
      AND role_id = p_role_id
      AND prompt_version = p_prompt_version
      AND schema_version = p_schema_version
      AND status = 'completed'
    ORDER BY attempt_number DESC
    LIMIT 1;
    
    IF v_completed_id IS NOT NULL THEN
        RETURN jsonb_build_object('status', 'completed', 'generationId', v_completed_id);
    END IF;
    
    SELECT id, status, attempt_number, created_at INTO v_latest_record
    FROM validation_generations
    WHERE analysis_snapshot_id = p_analysis_snapshot_id
      AND role_id = p_role_id
      AND prompt_version = p_prompt_version
      AND schema_version = p_schema_version
    ORDER BY attempt_number DESC
    LIMIT 1;
    
    IF v_latest_record IS NOT NULL THEN
        IF v_latest_record.status = 'pending' THEN
            IF EXTRACT(EPOCH FROM (now() - v_latest_record.created_at)) * 1000 < p_stale_threshold_ms THEN
                RETURN jsonb_build_object('status', 'pending', 'generationId', v_latest_record.id);
            END IF;
        END IF;
        v_new_attempt := v_latest_record.attempt_number + 1;
    ELSE
        v_new_attempt := 1;
    END IF;
    
    INSERT INTO validation_generations (
        analysis_snapshot_id, role_id, prompt_version, schema_version, model, status, attempt_number
    ) VALUES (
        p_analysis_snapshot_id, p_role_id, p_prompt_version, p_schema_version, p_model, 'pending', v_new_attempt
    ) RETURNING id INTO v_new_id;
    
    RETURN jsonb_build_object('status', 'claimed', 'generationId', v_new_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Revoke public execute
REVOKE EXECUTE ON FUNCTION claim_validation_generation_attempt FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_validation_generation_attempt TO service_role;

-- 3. Atomic finalize RPC
CREATE OR REPLACE FUNCTION finalize_validation_generation(
    p_generation_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_record record;
    v_lock1 int;
    v_lock2 int;
    v_max_attempt integer;
BEGIN
    SELECT * INTO v_record FROM validation_generations WHERE id = p_generation_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'not_found');
    END IF;
    
    IF v_record.status != 'pending' THEN
        RETURN jsonb_build_object('status', 'invalid_state', 'current_status', v_record.status);
    END IF;
    
    SELECT * INTO v_lock1, v_lock2 FROM _validation_family_lock_keys(
        v_record.analysis_snapshot_id, v_record.role_id, v_record.prompt_version, v_record.schema_version
    );
    
    PERFORM pg_advisory_xact_lock(v_lock1, v_lock2);
    
    SELECT MAX(attempt_number) INTO v_max_attempt
    FROM validation_generations
    WHERE analysis_snapshot_id = v_record.analysis_snapshot_id
      AND role_id = v_record.role_id
      AND prompt_version = v_record.prompt_version
      AND schema_version = v_record.schema_version;
      
    IF v_max_attempt > v_record.attempt_number THEN
        UPDATE validation_generations 
        SET status = 'failed', error_message = 'Superseded by newer attempt' 
        WHERE id = p_generation_id;
        
        RETURN jsonb_build_object('status', 'superseded');
    END IF;
    
    UPDATE validation_generations
    SET status = 'completed', completed_at = now()
    WHERE id = p_generation_id;
    
    RETURN jsonb_build_object('status', 'finalized');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION finalize_validation_generation FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finalize_validation_generation TO service_role;

-- 4. Defense in depth: Unique Completed Index
CREATE UNIQUE INDEX validation_generations_unique_completed_idx
ON validation_generations (analysis_snapshot_id, role_id, prompt_version, schema_version)
WHERE status = 'completed';

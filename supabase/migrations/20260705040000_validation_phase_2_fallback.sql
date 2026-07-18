-- Migration: 20260705040000_validation_phase_2_fallback.sql
-- Validation Phase 2: Add Model Fallback Persistence to Finalize RPC

-- 0. Alter table to allow NULL model (representing no-AI completion like zero-candidate fast path)
ALTER TABLE public.validation_generations ALTER COLUMN model DROP NOT NULL;

-- 1. Create new finalize_validation_generation signature
CREATE OR REPLACE FUNCTION public.finalize_validation_generation(
    p_generation_id uuid,
    p_model text
) RETURNS jsonb AS $$
DECLARE
    v_record record;
    v_lock1 int;
    v_lock2 int;
    v_max_attempt integer;
BEGIN
    -- Validate allowed models explicitly inside SECURITY DEFINER block
    IF p_model IS NOT NULL AND (trim(p_model) = '' OR p_model NOT IN ('gemini-3.5-flash')) THEN
        RETURN jsonb_build_object('status', 'invalid_model');
    END IF;

    SELECT * INTO v_record FROM public.validation_generations WHERE id = p_generation_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'not_found');
    END IF;
    
    IF v_record.status != 'pending' THEN
        RETURN jsonb_build_object('status', 'invalid_state', 'current_status', v_record.status);
    END IF;
    
    -- Acquire family lock using existing helper
    SELECT * INTO v_lock1, v_lock2 FROM public._validation_family_lock_keys(
        v_record.analysis_snapshot_id, v_record.role_id, v_record.prompt_version, v_record.schema_version
    );
    
    PERFORM pg_advisory_xact_lock(v_lock1, v_lock2);
    
    SELECT MAX(attempt_number) INTO v_max_attempt
    FROM public.validation_generations
    WHERE analysis_snapshot_id = v_record.analysis_snapshot_id
      AND role_id = v_record.role_id
      AND prompt_version = v_record.prompt_version
      AND schema_version = v_record.schema_version;
      
    IF v_max_attempt > v_record.attempt_number THEN
        UPDATE public.validation_generations 
        SET status = 'failed', error_message = 'Superseded by newer attempt' 
        WHERE id = p_generation_id;
        
        RETURN jsonb_build_object('status', 'superseded');
    END IF;
    
    -- Atomically finalize and persist actual successful model
    UPDATE public.validation_generations
    SET status = 'completed', 
        model = p_model,
        completed_at = now()
    WHERE id = p_generation_id;
    
    RETURN jsonb_build_object('status', 'finalized');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Security configuration for NEW signature
REVOKE EXECUTE ON FUNCTION public.finalize_validation_generation(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_validation_generation(uuid, text) TO service_role;

-- 3. Drop old signature safely
REVOKE EXECUTE ON FUNCTION public.finalize_validation_generation(uuid) FROM PUBLIC;
DROP FUNCTION public.finalize_validation_generation(uuid);

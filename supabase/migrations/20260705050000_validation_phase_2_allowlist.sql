-- Migration: 20260705050000_validation_phase_2_allowlist.sql
-- Validation Phase 2: Expand finalize RPC allowlist to include verified fallback model.
--
-- Runtime-verified via probe against deployed GEMINI_API_KEY project:
--   models/gemini-3.1-flash-lite -> generateContent -> HTTP 200
--
-- This migration replaces the two-argument finalize RPC with an expanded allowlist.
-- Signature (uuid, text) is preserved; no overload change is required.
-- No table alterations.
-- No unique index changes.

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
    -- NULL is valid (no-AI zero-candidate path).
    -- Non-null model must be a known verified allowlisted value.
    IF p_model IS NOT NULL AND (
        trim(p_model) = ''
        OR p_model NOT IN (
            'gemini-3.5-flash',
            'gemini-3.1-flash-lite'
        )
    ) THEN
        RETURN jsonb_build_object('status', 'invalid_model');
    END IF;

    SELECT * INTO v_record FROM public.validation_generations WHERE id = p_generation_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'not_found');
    END IF;

    IF v_record.status != 'pending' THEN
        RETURN jsonb_build_object('status', 'invalid_state', 'current_status', v_record.status);
    END IF;

    -- Acquire family advisory lock using existing helper
    SELECT * INTO v_lock1, v_lock2 FROM public._validation_family_lock_keys(
        v_record.analysis_snapshot_id, v_record.role_id, v_record.prompt_version, v_record.schema_version
    );
    PERFORM pg_advisory_xact_lock(v_lock1, v_lock2);

    -- Supersession check under lock
    SELECT MAX(attempt_number) INTO v_max_attempt
    FROM public.validation_generations
    WHERE analysis_snapshot_id = v_record.analysis_snapshot_id
      AND role_id = v_record.role_id
      AND prompt_version = v_record.prompt_version
      AND schema_version = v_record.schema_version;

    IF v_max_attempt > v_record.attempt_number THEN
        -- Mark superseded attempt as failed; do NOT overwrite model
        UPDATE public.validation_generations
        SET status = 'failed', error_message = 'Superseded by newer attempt'
        WHERE id = p_generation_id;
        RETURN jsonb_build_object('status', 'superseded');
    END IF;

    -- Atomically finalize: persist actual successful model (or NULL for no-AI)
    UPDATE public.validation_generations
    SET status = 'completed',
        model = p_model,
        completed_at = now()
    WHERE id = p_generation_id;

    RETURN jsonb_build_object('status', 'finalized');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.finalize_validation_generation(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_validation_generation(uuid, text) TO service_role;

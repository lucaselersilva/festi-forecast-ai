-- Adicionar campos de controle de job para processamento em background
ALTER TABLE public.import_staging 
ADD COLUMN IF NOT EXISTS job_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS job_progress integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS job_error text,
ADD COLUMN IF NOT EXISTS job_result jsonb,
ADD COLUMN IF NOT EXISTS job_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS job_completed_at timestamp with time zone;

-- Index para consultas de status
CREATE INDEX IF NOT EXISTS idx_import_staging_session_job_status 
ON public.import_staging(session_id, job_status);
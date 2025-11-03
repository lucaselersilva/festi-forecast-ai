-- Add indexes to improve import performance for duplicate checking

-- Index for valle_clientes duplicate checks (telefone + tenant_id)
CREATE INDEX IF NOT EXISTS idx_valle_clientes_telefone_tenant 
ON public.valle_clientes(telefone, tenant_id);

-- Index for valle_clientes name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_valle_clientes_nome_lower 
ON public.valle_clientes(LOWER(nome), tenant_id);

-- Index for customers duplicate checks (cpf + tenant_id)
CREATE INDEX IF NOT EXISTS idx_customers_cpf_tenant 
ON public.customers(cpf, tenant_id);

-- Index for customers email searches
CREATE INDEX IF NOT EXISTS idx_customers_email_tenant 
ON public.customers(email, tenant_id);

-- Index for import_staging session lookups
CREATE INDEX IF NOT EXISTS idx_import_staging_session 
ON public.import_staging(session_id);

-- Index for import_staging cleanup (job_status + job_started_at)
CREATE INDEX IF NOT EXISTS idx_import_staging_cleanup 
ON public.import_staging(job_status, job_started_at);
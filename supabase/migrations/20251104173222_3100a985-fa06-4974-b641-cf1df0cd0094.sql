-- Re-enable RLS on valle_clientes table
-- This table was explicitly disabled for testing but must be protected in production
-- Note: Policies already exist, we just need to enable RLS
ALTER TABLE public.valle_clientes ENABLE ROW LEVEL SECURITY;
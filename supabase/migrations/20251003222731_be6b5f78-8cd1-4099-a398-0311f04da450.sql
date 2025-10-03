-- Fix: Function search_path for update_updated_at_column
-- Drop the function without proper search_path and recreate with security
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Recreate triggers
CREATE TRIGGER update_analysis_runs_updated_at
  BEFORE UPDATE ON public.analysis_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON public.strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
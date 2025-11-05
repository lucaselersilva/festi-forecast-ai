-- Create temporary function with SECURITY DEFINER to apply GRANT permissions
-- This ensures the GRANTs are executed with sufficient privileges
CREATE OR REPLACE FUNCTION apply_valle_view_grants()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Grant USAGE on schema
  GRANT USAGE ON SCHEMA public TO authenticated, anon;
  
  -- Grant SELECT on valle views
  GRANT SELECT ON public.vw_valle_rfm TO authenticated, anon;
  GRANT SELECT ON public.vw_valle_cluster_analysis TO authenticated, anon;
  GRANT SELECT ON public.vw_valle_demographic TO authenticated, anon;
  GRANT SELECT ON public.vw_valle_digital_engagement TO authenticated, anon;
  GRANT SELECT ON public.vw_valle_multi_segment TO authenticated, anon;
  GRANT SELECT ON public.vw_valle_rfm_customer TO authenticated, anon;
END;
$$;

-- Execute the function to apply permissions
SELECT apply_valle_view_grants();

-- Drop the temporary function
DROP FUNCTION apply_valle_view_grants();
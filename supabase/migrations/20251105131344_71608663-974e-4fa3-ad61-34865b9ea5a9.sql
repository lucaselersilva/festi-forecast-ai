-- Grant SELECT permissions on valle views to authenticated and anon roles
-- This allows the clustering edge function to read data from these views
-- while still respecting RLS policies on the underlying tables

GRANT SELECT ON public.vw_valle_rfm TO authenticated;
GRANT SELECT ON public.vw_valle_rfm TO anon;

GRANT SELECT ON public.vw_valle_cluster_analysis TO authenticated;
GRANT SELECT ON public.vw_valle_cluster_analysis TO anon;

GRANT SELECT ON public.vw_valle_demographic TO authenticated;
GRANT SELECT ON public.vw_valle_demographic TO anon;

GRANT SELECT ON public.vw_valle_digital_engagement TO authenticated;
GRANT SELECT ON public.vw_valle_digital_engagement TO anon;

GRANT SELECT ON public.vw_valle_multi_segment TO authenticated;
GRANT SELECT ON public.vw_valle_multi_segment TO anon;
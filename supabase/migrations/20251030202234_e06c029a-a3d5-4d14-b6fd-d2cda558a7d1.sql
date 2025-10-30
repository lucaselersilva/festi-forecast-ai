-- Create the missing vw_valle_rfm_customer view
CREATE OR REPLACE VIEW public.vw_valle_rfm_customer AS
SELECT 
  c.id as customer_id,
  c.tenant_id,
  COALESCE(
    EXTRACT(EPOCH FROM (NOW() - c.ultima_visita)) / 86400,
    999
  )::numeric as recency_days,
  COALESCE(c.presencas, 0) as frequency_interactions,
  COALESCE(c.consumo, 0) as monetary_total,
  c.ultima_visita as last_interaction_at,
  CASE 
    WHEN COALESCE(c.ultima_visita, '1900-01-01'::timestamp) >= NOW() - INTERVAL '30 days' THEN 5
    WHEN COALESCE(c.ultima_visita, '1900-01-01'::timestamp) >= NOW() - INTERVAL '90 days' THEN 4
    WHEN COALESCE(c.ultima_visita, '1900-01-01'::timestamp) >= NOW() - INTERVAL '180 days' THEN 3
    WHEN COALESCE(c.ultima_visita, '1900-01-01'::timestamp) >= NOW() - INTERVAL '365 days' THEN 2
    ELSE 1
  END as r,
  CASE 
    WHEN COALESCE(c.presencas, 0) >= 10 THEN 5
    WHEN COALESCE(c.presencas, 0) >= 7 THEN 4
    WHEN COALESCE(c.presencas, 0) >= 4 THEN 3
    WHEN COALESCE(c.presencas, 0) >= 2 THEN 2
    ELSE 1
  END as f,
  CASE 
    WHEN COALESCE(c.consumo, 0) >= 1000 THEN 5
    WHEN COALESCE(c.consumo, 0) >= 500 THEN 4
    WHEN COALESCE(c.consumo, 0) >= 200 THEN 3
    WHEN COALESCE(c.consumo, 0) >= 50 THEN 2
    ELSE 1
  END as m,
  (CASE 
    WHEN COALESCE(c.ultima_visita, '1900-01-01'::timestamp) >= NOW() - INTERVAL '30 days' THEN 5
    WHEN COALESCE(c.ultima_visita, '1900-01-01'::timestamp) >= NOW() - INTERVAL '90 days' THEN 4
    WHEN COALESCE(c.ultima_visita, '1900-01-01'::timestamp) >= NOW() - INTERVAL '180 days' THEN 3
    WHEN COALESCE(c.ultima_visita, '1900-01-01'::timestamp) >= NOW() - INTERVAL '365 days' THEN 2
    ELSE 1
  END +
  CASE 
    WHEN COALESCE(c.presencas, 0) >= 10 THEN 5
    WHEN COALESCE(c.presencas, 0) >= 7 THEN 4
    WHEN COALESCE(c.presencas, 0) >= 4 THEN 3
    WHEN COALESCE(c.presencas, 0) >= 2 THEN 2
    ELSE 1
  END +
  CASE 
    WHEN COALESCE(c.consumo, 0) >= 1000 THEN 5
    WHEN COALESCE(c.consumo, 0) >= 500 THEN 4
    WHEN COALESCE(c.consumo, 0) >= 200 THEN 3
    WHEN COALESCE(c.consumo, 0) >= 50 THEN 2
    ELSE 1
  END) as rfm_score
FROM public.customers c;

-- Grant permissions
GRANT SELECT ON public.vw_valle_rfm_customer TO authenticated;
GRANT SELECT ON public.vw_valle_rfm_customer TO anon;
GRANT SELECT ON public.vw_valle_rfm_customer TO service_role;
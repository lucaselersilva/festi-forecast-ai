-- Drop and recreate vw_valle_rfm_customer to use valle_clientes instead of customers
DROP VIEW IF EXISTS public.vw_valle_rfm_customer;

CREATE VIEW public.vw_valle_rfm_customer AS
SELECT 
  -- Convert UUID to integer hash for customer_id
  ('x' || substring(c.id::text, 1, 8))::bit(32)::integer as customer_id,
  c.tenant_id,
  COALESCE(EXTRACT(EPOCH FROM (NOW() - c.ultima_visita)) / 86400, 999)::numeric as recency_days,
  COALESCE(c.presencas, 0)::integer as frequency_interactions,
  COALESCE(c.consumo, 0)::numeric as monetary_total,
  c.ultima_visita as last_interaction_at,
  -- Calculate RFM scores (1-5 scale)
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - c.ultima_visita)) / 86400 <= 30 THEN 5
    WHEN EXTRACT(EPOCH FROM (NOW() - c.ultima_visita)) / 86400 <= 60 THEN 4
    WHEN EXTRACT(EPOCH FROM (NOW() - c.ultima_visita)) / 86400 <= 90 THEN 3
    WHEN EXTRACT(EPOCH FROM (NOW() - c.ultima_visita)) / 86400 <= 180 THEN 2
    ELSE 1
  END as r,
  CASE 
    WHEN c.presencas >= 20 THEN 5
    WHEN c.presencas >= 10 THEN 4
    WHEN c.presencas >= 5 THEN 3
    WHEN c.presencas >= 2 THEN 2
    ELSE 1
  END as f,
  CASE 
    WHEN c.consumo >= 1000 THEN 5
    WHEN c.consumo >= 500 THEN 4
    WHEN c.consumo >= 200 THEN 3
    WHEN c.consumo >= 50 THEN 2
    ELSE 1
  END as m,
  0 as rfm_score
FROM public.valle_clientes c
WHERE c.ultima_visita IS NOT NULL;
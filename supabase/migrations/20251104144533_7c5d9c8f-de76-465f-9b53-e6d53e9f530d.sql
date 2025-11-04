-- Create Valle-specific demographic view
CREATE OR REPLACE VIEW vw_valle_demographic AS
SELECT
  vc.id::text as customer_id,
  vc.tenant_id,
  vc.nome as name,
  vc.genero as gender,
  CASE 
    WHEN vc.aniversario IS NOT NULL 
    THEN EXTRACT(YEAR FROM age(vc.aniversario))::integer 
    ELSE NULL 
  END as age,
  CASE 
    WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 25 THEN '18-24'
    WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 35 THEN '25-34'
    WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 45 THEN '35-44'
    WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 55 THEN '45-54'
    ELSE '55+'
  END as age_segment,
  NULL::character varying as city
FROM public.valle_clientes vc
WHERE vc.aniversario IS NOT NULL;

-- Create Valle-specific digital engagement view
CREATE OR REPLACE VIEW vw_valle_digital_engagement AS
SELECT
  vc.id::text as customer_id,
  vc.tenant_id,
  COALESCE(vc.presencas, 0) as total_purchases,
  CASE 
    WHEN vc.presencas > 1 AND vc.ultima_visita IS NOT NULL AND vc.primeira_entrada IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (vc.ultima_visita - vc.primeira_entrada)) / 86400 / NULLIF(vc.presencas - 1, 0)
    ELSE NULL
  END as avg_days_between_purchases,
  CASE 
    WHEN vc.presencas > 0 
    THEN vc.consumo / NULLIF(vc.presencas, 0)
    ELSE 0
  END as avg_purchase_value,
  CASE
    WHEN vc.presencas >= 10 THEN 'frequent'
    WHEN vc.presencas >= 3 THEN 'regular'
    WHEN vc.presencas = 1 THEN 'one-time'
    ELSE 'inactive'
  END as engagement_segment
FROM public.valle_clientes vc;

-- Create Valle-specific multi-dimensional view
CREATE OR REPLACE VIEW vw_valle_multi_segment AS
SELECT
  vc.id::text as customer_id,
  vc.tenant_id,
  vc.nome as name,
  
  -- RFM metrics
  CASE 
    WHEN vc.ultima_visita IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (now() - vc.ultima_visita)) / 86400 
    ELSE NULL 
  END as recency_days,
  COALESCE(vc.presencas, 0) as frequency,
  COALESCE(vc.consumo, 0) as monetary_total,
  
  -- Demographic data
  vc.genero as gender,
  CASE 
    WHEN vc.aniversario IS NOT NULL 
    THEN EXTRACT(YEAR FROM age(vc.aniversario))::integer 
    ELSE NULL 
  END as age,
  CASE 
    WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 25 THEN '18-24'
    WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 35 THEN '25-34'
    WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 45 THEN '35-44'
    WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 55 THEN '45-54'
    ELSE '55+'
  END as age_segment,
  NULL::character varying as city,
  
  -- Behavioral metrics
  COALESCE(vc.presencas, 0) as total_purchases,
  CASE 
    WHEN vc.presencas > 1 AND vc.ultima_visita IS NOT NULL AND vc.primeira_entrada IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (vc.ultima_visita - vc.primeira_entrada)) / 86400 / NULLIF(vc.presencas - 1, 0)
    ELSE NULL
  END as avg_days_between_purchases,
  CASE 
    WHEN vc.presencas > 0 
    THEN vc.consumo / NULLIF(vc.presencas, 0)
    ELSE 0
  END as avg_purchase_value,
  
  -- Engagement segment
  CASE
    WHEN vc.presencas >= 10 THEN 'frequent'
    WHEN vc.presencas >= 3 THEN 'regular'
    WHEN vc.presencas = 1 THEN 'one-time'
    ELSE 'inactive'
  END as engagement_segment,
  
  -- RFM segment (simplified)
  CASE
    WHEN vc.presencas >= 5 AND vc.consumo >= 200 THEN 'champions'
    WHEN vc.presencas >= 3 AND vc.consumo >= 100 THEN 'loyal'
    WHEN vc.presencas = 1 THEN 'new'
    ELSE 'at_risk'
  END as rfm_segment,
  
  -- Placeholder for genre interaction (Valle doesn't have this data yet)
  NULL::text as preferred_genre,
  0::bigint as genre_interaction_count,
  
  -- Derived scores (placeholders for compatibility)
  NULL::integer as rfm_r,
  NULL::integer as rfm_f,
  NULL::integer as rfm_m,
  NULL::numeric as segment_priority_score
  
FROM public.valle_clientes vc;
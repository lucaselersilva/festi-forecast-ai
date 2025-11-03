-- Drop existing views to ensure clean recreation
DROP VIEW IF EXISTS vw_multi_segment CASCADE;
DROP VIEW IF EXISTS vw_digital_engagement CASCADE;
DROP VIEW IF EXISTS vw_demographic_profile CASCADE;

-- Create vw_demographic_profile using valle_clientes
CREATE VIEW vw_demographic_profile AS
SELECT 
  c.id::text::integer AS customer_id,
  c.tenant_id,
  c.nome AS name,
  c.genero AS gender,
  NULL::varchar AS city,
  EXTRACT(YEAR FROM age(c.aniversario))::numeric AS age,
  CASE
    WHEN EXTRACT(YEAR FROM age(c.aniversario)) < 25 THEN '18-24'
    WHEN EXTRACT(YEAR FROM age(c.aniversario)) BETWEEN 25 AND 34 THEN '25-34'
    WHEN EXTRACT(YEAR FROM age(c.aniversario)) BETWEEN 35 AND 44 THEN '35-44'
    WHEN EXTRACT(YEAR FROM age(c.aniversario)) BETWEEN 45 AND 54 THEN '45-54'
    ELSE '55+'
  END AS age_segment
FROM valle_clientes c
WHERE c.aniversario IS NOT NULL;

-- Create vw_digital_engagement using valle_clientes
CREATE VIEW vw_digital_engagement AS
SELECT 
  c.id::text::integer AS customer_id,
  c.tenant_id,
  COALESCE(c.presencas, 0)::bigint AS total_purchases,
  CASE 
    WHEN c.primeira_entrada IS NOT NULL AND c.ultima_visita IS NOT NULL AND c.presencas > 1
    THEN (EXTRACT(EPOCH FROM (c.ultima_visita - c.primeira_entrada)) / 86400 / NULLIF(c.presencas - 1, 0))::numeric
    ELSE NULL
  END AS avg_days_between_purchases,
  CASE 
    WHEN c.presencas > 0 
    THEN (c.consumo / c.presencas)::numeric
    ELSE 0 
  END AS avg_purchase_value,
  CASE
    WHEN c.presencas >= 10 THEN 'high_engagement'
    WHEN c.presencas >= 5 THEN 'medium_engagement'
    WHEN c.presencas >= 1 THEN 'low_engagement'
    ELSE 'inactive'
  END AS engagement_segment
FROM valle_clientes c;

-- Create vw_multi_segment combining all dimensions
CREATE VIEW vw_multi_segment AS
SELECT 
  r.customer_id,
  r.tenant_id,
  r.recency_days,
  r.frequency_interactions AS frequency,
  r.monetary_total,
  r.r AS rfm_r,
  r.f AS rfm_f,
  r.m AS rfm_m,
  CASE
    WHEN r.r >= 4 AND r.f >= 4 AND r.m >= 4 THEN 'Champions'
    WHEN r.r >= 3 AND r.f >= 3 THEN 'Loyal'
    WHEN r.r >= 4 AND r.f <= 2 THEN 'Potential'
    WHEN r.r <= 2 THEN 'At Risk'
    ELSE 'Regular'
  END AS rfm_segment,
  d.name,
  d.gender,
  d.age,
  d.age_segment,
  NULL::varchar AS city,
  e.total_purchases,
  e.avg_days_between_purchases,
  e.avg_purchase_value,
  e.engagement_segment,
  NULL::text AS preferred_genre,
  0::bigint AS genre_interaction_count,
  (r.r * 0.3 + r.f * 0.3 + r.m * 0.4)::numeric AS segment_priority_score
FROM vw_valle_rfm_customer r
LEFT JOIN vw_demographic_profile d ON r.customer_id = d.customer_id AND r.tenant_id = d.tenant_id
LEFT JOIN vw_digital_engagement e ON r.customer_id = e.customer_id AND r.tenant_id = e.tenant_id;
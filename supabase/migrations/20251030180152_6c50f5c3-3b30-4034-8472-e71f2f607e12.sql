-- Recreate views with tenant_id for multi-tenancy support

-- Drop existing views in correct order (respecting dependencies)
DROP VIEW IF EXISTS vw_multi_segment CASCADE;
DROP VIEW IF EXISTS vw_musical_preference CASCADE;
DROP VIEW IF EXISTS vw_digital_engagement CASCADE;
DROP VIEW IF EXISTS vw_demographic_profile CASCADE;
DROP VIEW IF EXISTS vw_rfm_customer CASCADE;

-- 1. vw_rfm_customer with tenant_id and partitioned NTILE
CREATE OR REPLACE VIEW vw_rfm_customer AS
WITH customer_metrics AS (
  SELECT 
    c.id AS customer_id,
    c.tenant_id,
    MAX(i.created_at) AS last_interaction_at,
    EXTRACT(DAY FROM (CURRENT_DATE - MAX(i.created_at))) AS recency_days,
    COUNT(DISTINCT i.id) AS frequency_interactions,
    COALESCE(SUM(i.value), 0) AS monetary_total
  FROM customers c
  LEFT JOIN interactions i ON i.customer_id = c.id AND i.tenant_id = c.tenant_id
  GROUP BY c.id, c.tenant_id
),
ranked_metrics AS (
  SELECT 
    customer_id,
    tenant_id,
    last_interaction_at,
    recency_days,
    frequency_interactions,
    monetary_total,
    NTILE(5) OVER (PARTITION BY tenant_id ORDER BY recency_days DESC NULLS LAST) AS r,
    NTILE(5) OVER (PARTITION BY tenant_id ORDER BY frequency_interactions) AS f,
    NTILE(5) OVER (PARTITION BY tenant_id ORDER BY monetary_total) AS m
  FROM customer_metrics
)
SELECT 
  customer_id,
  tenant_id,
  last_interaction_at,
  recency_days,
  frequency_interactions,
  monetary_total,
  r,
  f,
  m,
  (r + f + m) AS rfm_score
FROM ranked_metrics;

-- 2. vw_demographic_profile with tenant_id
CREATE OR REPLACE VIEW vw_demographic_profile AS
SELECT 
  c.id AS customer_id,
  c.tenant_id,
  c.name,
  c.gender,
  c.city,
  EXTRACT(YEAR FROM AGE(c.birthdate)) AS age,
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(c.birthdate)) < 25 THEN '18-24'
    WHEN EXTRACT(YEAR FROM AGE(c.birthdate)) BETWEEN 25 AND 34 THEN '25-34'
    WHEN EXTRACT(YEAR FROM AGE(c.birthdate)) BETWEEN 35 AND 44 THEN '35-44'
    WHEN EXTRACT(YEAR FROM AGE(c.birthdate)) BETWEEN 45 AND 54 THEN '45-54'
    ELSE '55+'
  END AS age_segment
FROM customers c;

-- 3. vw_digital_engagement with tenant_id
CREATE OR REPLACE VIEW vw_digital_engagement AS
WITH interaction_intervals AS (
  SELECT 
    c.id AS customer_id,
    c.tenant_id,
    i.created_at,
    LAG(i.created_at) OVER (PARTITION BY c.id ORDER BY i.created_at) AS prev_interaction,
    i.value
  FROM customers c
  LEFT JOIN interactions i ON i.customer_id = c.id AND i.tenant_id = c.tenant_id
)
SELECT 
  customer_id,
  tenant_id,
  COUNT(*) AS total_purchases,
  AVG(EXTRACT(DAY FROM (created_at - prev_interaction))) AS avg_days_between_purchases,
  AVG(value) AS avg_purchase_value,
  CASE 
    WHEN COUNT(*) >= 10 THEN 'high'
    WHEN COUNT(*) >= 5 THEN 'medium'
    ELSE 'low'
  END AS engagement_segment
FROM interaction_intervals
WHERE created_at IS NOT NULL
GROUP BY customer_id, tenant_id;

-- 4. vw_musical_preference with tenant_id
CREATE OR REPLACE VIEW vw_musical_preference AS
WITH genre_stats AS (
  SELECT 
    c.id AS customer_id,
    c.tenant_id,
    i.metadata->>'genre' AS genre,
    COUNT(*) AS interaction_count,
    SUM(i.value) AS total_spent
  FROM customers c
  LEFT JOIN interactions i ON i.customer_id = c.id AND i.tenant_id = c.tenant_id
  WHERE i.metadata->>'genre' IS NOT NULL
  GROUP BY c.id, c.tenant_id, i.metadata->>'genre'
),
ranked_genres AS (
  SELECT 
    customer_id,
    tenant_id,
    genre,
    interaction_count,
    total_spent,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY interaction_count DESC) AS rank
  FROM genre_stats
)
SELECT 
  customer_id,
  tenant_id,
  genre AS preferred_genre,
  interaction_count,
  total_spent
FROM ranked_genres
WHERE rank = 1;

-- 5. vw_multi_segment with tenant_id (combining all views)
CREATE OR REPLACE VIEW vw_multi_segment AS
SELECT 
  rfm.customer_id,
  rfm.tenant_id,
  demo.name,
  demo.gender,
  demo.city,
  demo.age,
  demo.age_segment,
  rfm.recency_days,
  rfm.frequency_interactions AS frequency,
  rfm.monetary_total,
  rfm.r AS rfm_r,
  rfm.f AS rfm_f,
  rfm.m AS rfm_m,
  CASE
    WHEN rfm.r >= 4 AND rfm.f >= 4 AND rfm.m >= 4 THEN 'Champions'
    WHEN rfm.r >= 4 AND rfm.f >= 3 THEN 'Loyal Customers'
    WHEN rfm.r >= 4 AND rfm.m >= 4 THEN 'Big Spenders'
    WHEN rfm.r >= 3 AND rfm.f >= 3 THEN 'Potential Loyalists'
    WHEN rfm.r >= 4 THEN 'Recent Customers'
    WHEN rfm.f >= 4 THEN 'Frequent Visitors'
    WHEN rfm.r <= 2 AND rfm.f <= 2 THEN 'At Risk'
    WHEN rfm.r <= 2 THEN 'Need Attention'
    ELSE 'Regular'
  END AS rfm_segment,
  eng.total_purchases,
  eng.avg_days_between_purchases,
  eng.avg_purchase_value,
  eng.engagement_segment,
  mus.preferred_genre,
  mus.interaction_count AS genre_interaction_count,
  COALESCE(eng.total_purchases, 0) * COALESCE(rfm.monetary_total, 0) / NULLIF(COALESCE(rfm.recency_days, 365), 0) AS segment_priority_score
FROM vw_rfm_customer rfm
LEFT JOIN vw_demographic_profile demo ON demo.customer_id = rfm.customer_id AND demo.tenant_id = rfm.tenant_id
LEFT JOIN vw_digital_engagement eng ON eng.customer_id = rfm.customer_id AND eng.tenant_id = rfm.tenant_id
LEFT JOIN vw_musical_preference mus ON mus.customer_id = rfm.customer_id AND mus.tenant_id = rfm.tenant_id;
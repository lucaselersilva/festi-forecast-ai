-- Recriar views com CASCADE para dependências
DROP VIEW IF EXISTS vw_segment_intersections CASCADE;
DROP VIEW IF EXISTS vw_multi_segment CASCADE;
DROP VIEW IF EXISTS vw_digital_engagement CASCADE;
DROP VIEW IF EXISTS vw_musical_preference CASCADE;

-- Recriar vw_digital_engagement corrigida
CREATE VIEW vw_digital_engagement AS
WITH purchase_dates AS (
  SELECT 
    i.customer_id,
    i.created_at,
    e.date as event_date,
    i.value,
    LAG(i.created_at) OVER (PARTITION BY i.customer_id ORDER BY i.created_at) as prev_purchase_date
  FROM interactions i
  LEFT JOIN events e ON i.event_id = e.id
  WHERE i.interaction_type = 'ticket_purchase'
),
purchase_metrics AS (
  SELECT 
    customer_id,
    COUNT(*) as total_purchases,
    AVG(EXTRACT(EPOCH FROM (created_at - prev_purchase_date)) / 86400.0) as avg_days_between_purchases,
    AVG(EXTRACT(EPOCH FROM (event_date::timestamp - created_at)) / 86400.0) as avg_days_before_event,
    AVG(value) as avg_purchase_value
  FROM purchase_dates
  GROUP BY customer_id
)
SELECT 
  customer_id,
  total_purchases,
  COALESCE(avg_days_between_purchases, 30) as avg_days_between_purchases,
  COALESCE(avg_days_before_event, 7) as avg_days_before_event,
  COALESCE(avg_purchase_value, 0) as avg_purchase_value,
  CASE 
    WHEN COALESCE(avg_days_before_event, 7) <= 1 THEN 'Impulsivo'
    WHEN COALESCE(avg_days_before_event, 7) BETWEEN 1 AND 7 THEN 'Planejador'
    ELSE 'Antecipado'
  END as engagement_segment
FROM purchase_metrics;

-- Recriar vw_musical_preference corrigida
CREATE VIEW vw_musical_preference AS
WITH genre_interactions AS (
  SELECT 
    i.customer_id,
    e.genre,
    COUNT(*) as interaction_count,
    SUM(i.value) as total_spent
  FROM interactions i
  INNER JOIN events e ON i.event_id = e.id
  WHERE i.interaction_type IN ('ticket_purchase', 'bar_purchase')
    AND e.genre IS NOT NULL
  GROUP BY i.customer_id, e.genre
),
ranked_genres AS (
  SELECT 
    customer_id,
    genre as preferred_genre,
    interaction_count,
    total_spent,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY interaction_count DESC, total_spent DESC) as rn
  FROM genre_interactions
)
SELECT 
  customer_id,
  preferred_genre,
  interaction_count,
  total_spent
FROM ranked_genres
WHERE rn = 1;

-- Recriar vw_multi_segment
CREATE VIEW vw_multi_segment AS
SELECT 
  c.id as customer_id,
  c.name,
  c.email,
  c.city,
  c.gender,
  dp.age,
  dp.age_segment,
  rfm.recency_days,
  rfm.freq_tx as frequency,
  rfm.monetary_total,
  rfm.r as rfm_r,
  rfm.f as rfm_f,
  rfm.m as rfm_m,
  rfm.segment as rfm_segment,
  cp.consumption_segment,
  cp.dominant_category_pct,
  de.total_purchases,
  de.avg_days_between_purchases,
  de.avg_days_before_event,
  de.engagement_segment,
  mp.preferred_genre,
  mp.interaction_count as genre_interaction_count,
  CASE 
    WHEN sp.customer_id IS NOT NULL THEN 'Premium'
    WHEN rfm.monetary_total > 500 THEN 'Alto Valor'
    ELSE 'Standard'
  END as sponsorship_cluster,
  (COALESCE(rfm.m, 0) * 0.4 + COALESCE(rfm.f, 0) * 0.3 + COALESCE(rfm.r, 0) * 0.3) as segment_priority_score
FROM customers c
LEFT JOIN vw_demographic_profile dp ON c.id = dp.customer_id
LEFT JOIN vw_customer_rfm rfm ON c.id = rfm.customer_id
LEFT JOIN vw_consumption_profile cp ON c.id = cp.customer_id
LEFT JOIN vw_digital_engagement de ON c.id = de.customer_id
LEFT JOIN vw_musical_preference mp ON c.id = mp.customer_id
LEFT JOIN vw_sponsorship_potential sp ON c.id = sp.customer_id;

-- Recriar vw_segment_intersections
CREATE VIEW vw_segment_intersections AS
SELECT 
  rfm_segment,
  age_segment,
  consumption_segment,
  engagement_segment,
  sponsorship_cluster,
  COUNT(*) as customer_count,
  AVG(monetary_total) as avg_monetary,
  AVG(frequency) as avg_frequency,
  AVG(segment_priority_score) as avg_priority_score
FROM vw_multi_segment
WHERE rfm_segment IS NOT NULL
GROUP BY rfm_segment, age_segment, consumption_segment, engagement_segment, sponsorship_cluster;
-- Create view for consumption profile segmentation (Beer Lovers, Drinkers, Energy Seekers, etc.)
CREATE OR REPLACE VIEW vw_consumption_profile AS
WITH item_categories AS (
  SELECT 
    customerid,
    CASE 
      WHEN LOWER(item) LIKE '%cerveja%' OR LOWER(item) LIKE '%beer%' OR LOWER(item) LIKE '%chopp%' THEN 'beer'
      WHEN LOWER(item) LIKE '%drink%' OR LOWER(item) LIKE '%vodka%' OR LOWER(item) LIKE '%whisky%' OR LOWER(item) LIKE '%gin%' THEN 'drinks'
      WHEN LOWER(item) LIKE '%energetico%' OR LOWER(item) LIKE '%energy%' OR LOWER(item) LIKE '%red bull%' OR LOWER(item) LIKE '%monster%' THEN 'energy'
      WHEN LOWER(item) LIKE '%agua%' OR LOWER(item) LIKE '%suco%' OR LOWER(item) LIKE '%refrigerante%' OR LOWER(item) LIKE '%soft%' THEN 'soft'
      ELSE 'other'
    END as category,
    SUM(quantity) as total_quantity,
    SUM(totalvalue) as total_value
  FROM consumptions
  GROUP BY customerid, category
),
customer_totals AS (
  SELECT 
    customerid,
    SUM(total_quantity) as overall_quantity,
    SUM(total_value) as overall_value
  FROM item_categories
  GROUP BY customerid
),
dominant_category AS (
  SELECT 
    ic.customerid,
    ic.category,
    ic.total_quantity,
    ic.total_value,
    (ic.total_quantity::numeric / ct.overall_quantity) as category_pct,
    ROW_NUMBER() OVER (PARTITION BY ic.customerid ORDER BY ic.total_quantity DESC) as rn
  FROM item_categories ic
  JOIN customer_totals ct ON ic.customerid = ct.customerid
)
SELECT 
  customerid as customer_id,
  CASE category
    WHEN 'beer' THEN 'Beer Lovers'
    WHEN 'drinks' THEN 'Drinkers'
    WHEN 'energy' THEN 'Energy Seekers'
    WHEN 'soft' THEN 'Soft/Low Alcohol'
    ELSE 'Mixed'
  END as consumption_segment,
  category_pct as dominant_category_pct,
  total_quantity,
  total_value
FROM dominant_category
WHERE rn = 1 AND category_pct < 0.6
UNION ALL
SELECT 
  customerid as customer_id,
  'Mixed' as consumption_segment,
  category_pct as dominant_category_pct,
  total_quantity,
  total_value
FROM dominant_category
WHERE rn = 1 AND category_pct >= 0.6;

-- Create view for demographic segmentation
CREATE OR REPLACE VIEW vw_demographic_profile AS
SELECT 
  id as customer_id,
  name,
  gender,
  city,
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birthdate)) BETWEEN 18 AND 24 THEN '18-24'
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birthdate)) BETWEEN 25 AND 34 THEN '25-34'
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birthdate)) >= 35 THEN '35+'
    ELSE 'Unknown'
  END as age_segment,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, birthdate)) as age
FROM customers;

-- Create view for digital engagement segmentation
CREATE OR REPLACE VIEW vw_digital_engagement AS
WITH purchase_interactions AS (
  SELECT 
    customer_id,
    created_at,
    value,
    LAG(created_at) OVER (PARTITION BY customer_id ORDER BY created_at) as prev_purchase
  FROM interactions
  WHERE interaction_type = 'purchase'
),
engagement_metrics AS (
  SELECT 
    customer_id,
    COUNT(*) as total_purchases,
    AVG(EXTRACT(EPOCH FROM (created_at - prev_purchase)) / 86400) as avg_days_between_purchases,
    MIN(created_at) as first_purchase,
    MAX(created_at) as last_purchase,
    AVG(value) as avg_purchase_value,
    SUM(value) as total_value
  FROM purchase_interactions
  WHERE prev_purchase IS NOT NULL
  GROUP BY customer_id
),
event_timing AS (
  SELECT 
    i.customer_id,
    e.date as event_date,
    MIN(i.created_at) as first_interaction,
    MAX(EXTRACT(EPOCH FROM (e.date::timestamp - i.created_at)) / 86400) as days_before_event
  FROM interactions i
  JOIN events e ON i.event_id = e.id
  WHERE i.interaction_type = 'purchase'
  GROUP BY i.customer_id, e.date
)
SELECT 
  em.customer_id,
  CASE 
    WHEN em.total_purchases > 5 AND et.days_before_event > 14 THEN 'Early Buyers'
    WHEN em.total_purchases > 5 AND et.days_before_event <= 7 THEN 'Late Buyers'
    WHEN em.total_purchases <= 3 THEN 'Silent Audience'
    ELSE 'Promoters'
  END as engagement_segment,
  em.total_purchases,
  em.avg_days_between_purchases,
  em.avg_purchase_value,
  COALESCE(AVG(et.days_before_event), 0) as avg_days_before_event
FROM engagement_metrics em
LEFT JOIN event_timing et ON em.customer_id = et.customer_id
GROUP BY em.customer_id, em.total_purchases, em.avg_days_between_purchases, 
         em.avg_purchase_value, et.days_before_event;

-- Create view for musical preference segmentation
CREATE OR REPLACE VIEW vw_musical_preference AS
WITH genre_interactions AS (
  SELECT 
    i.customer_id,
    e.genre,
    COUNT(*) as interaction_count,
    SUM(i.value) as total_spent
  FROM interactions i
  JOIN events e ON i.event_id = e.id
  WHERE i.interaction_type IN ('purchase', 'view')
  GROUP BY i.customer_id, e.genre
),
ranked_genres AS (
  SELECT 
    customer_id,
    genre,
    interaction_count,
    total_spent,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY interaction_count DESC) as rank
  FROM genre_interactions
)
SELECT 
  customer_id,
  genre as preferred_genre,
  interaction_count,
  total_spent
FROM ranked_genres
WHERE rank = 1;

-- Create view for sponsorship potential
CREATE OR REPLACE VIEW vw_sponsorship_potential AS
SELECT 
  c.id as customer_id,
  c.name,
  c.city,
  d.age_segment,
  cp.consumption_segment,
  rfm.segment as rfm_segment,
  rfm.monetary_total,
  CASE 
    WHEN cp.consumption_segment = 'Energy Seekers' THEN 'Energy Cluster'
    WHEN cp.consumption_segment = 'Beer Lovers' THEN 'Beer Cluster'
    WHEN rfm.segment IN ('Champions', 'Loyal Customers') AND rfm.monetary_total > 500 THEN 'Luxury Cluster'
    WHEN d.age_segment = '18-24' THEN 'Student Cluster'
    WHEN rfm.monetary_total > 300 THEN 'Fashion Cluster'
    ELSE 'General Cluster'
  END as sponsorship_cluster
FROM customers c
LEFT JOIN vw_demographic_profile d ON c.id = d.customer_id
LEFT JOIN vw_consumption_profile cp ON c.id = cp.customer_id
LEFT JOIN vw_customer_rfm rfm ON c.id = rfm.customer_id;

-- Create comprehensive multi-dimensional segmentation view
CREATE OR REPLACE VIEW vw_multi_segment AS
SELECT 
  c.id as customer_id,
  c.name,
  c.email,
  c.city,
  c.gender,
  d.age_segment,
  d.age,
  rfm.segment as rfm_segment,
  rfm.recency_days,
  rfm.freq_tx as frequency,
  rfm.monetary_total,
  rfm.r as rfm_r,
  rfm.f as rfm_f,
  rfm.m as rfm_m,
  cp.consumption_segment,
  cp.dominant_category_pct,
  de.engagement_segment,
  de.total_purchases,
  de.avg_days_between_purchases,
  de.avg_days_before_event,
  mp.preferred_genre,
  mp.interaction_count as genre_interaction_count,
  sp.sponsorship_cluster,
  -- Combined segment score for prioritization
  (COALESCE(rfm.m, 0) * 0.4 + 
   COALESCE(rfm.f, 0) * 0.3 + 
   COALESCE(rfm.r, 0) * 0.3) as segment_priority_score
FROM customers c
LEFT JOIN vw_demographic_profile d ON c.id = d.customer_id
LEFT JOIN vw_customer_rfm rfm ON c.id = rfm.customer_id
LEFT JOIN vw_consumption_profile cp ON c.id = cp.customer_id
LEFT JOIN vw_digital_engagement de ON c.id = de.customer_id
LEFT JOIN vw_musical_preference mp ON c.id = mp.customer_id
LEFT JOIN vw_sponsorship_potential sp ON c.id = sp.customer_id;

-- Create view for segment intersections
CREATE OR REPLACE VIEW vw_segment_intersections AS
SELECT 
  rfm_segment,
  consumption_segment,
  age_segment,
  engagement_segment,
  sponsorship_cluster,
  COUNT(*) as customer_count,
  AVG(monetary_total) as avg_monetary,
  AVG(frequency) as avg_frequency,
  AVG(segment_priority_score) as avg_priority_score
FROM vw_multi_segment
WHERE rfm_segment IS NOT NULL
GROUP BY rfm_segment, consumption_segment, age_segment, engagement_segment, sponsorship_cluster
ORDER BY customer_count DESC;
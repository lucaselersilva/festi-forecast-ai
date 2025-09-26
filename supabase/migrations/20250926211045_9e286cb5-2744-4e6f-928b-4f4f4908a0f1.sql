-- Fix vw_customer_rfm to use correct interaction types
DROP VIEW IF EXISTS vw_customer_rfm CASCADE;

CREATE VIEW vw_customer_rfm AS
WITH base AS (
  SELECT 
    i.customer_id,
    MAX(i.created_at) AS last_tx,
    COUNT(*) AS freq_tx,
    SUM(COALESCE(i.value, 0)) AS monetary_tickets,
    COALESCE((
      SELECT SUM(c.totalvalue) 
      FROM consumptions c 
      WHERE c.customerid = i.customer_id
    ), 0) AS monetary_bar
  FROM interactions i
  WHERE i.interaction_type IN ('ticket_purchase', 'bar_purchase')  -- Fix: include both purchase types
  GROUP BY i.customer_id
),
recency AS (
  SELECT 
    customer_id,
    EXTRACT(EPOCH FROM now() - last_tx) / 86400.0 AS recency_days,
    freq_tx,
    monetary_tickets,
    monetary_bar,
    monetary_tickets + monetary_bar AS monetary_total
  FROM base
),
percentiles AS (
  SELECT 
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY monetary_total) AS p50,
    PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY monetary_total) AS p80
  FROM recency
)
SELECT 
  r.customer_id,
  r.recency_days,
  r.freq_tx,
  r.monetary_tickets,
  r.monetary_bar,
  r.monetary_total,
  NTILE(5) OVER (ORDER BY r.recency_days) AS r,
  NTILE(5) OVER (ORDER BY r.freq_tx DESC) AS f,
  NTILE(5) OVER (ORDER BY r.monetary_total DESC) AS m,
  CASE 
    WHEN r.monetary_total >= p.p80 THEN 'Heavy'
    WHEN r.monetary_total >= p.p50 THEN 'Medium'
    ELSE 'Light'
  END AS segment
FROM recency r
CROSS JOIN percentiles p;

-- Recreate dependent views
CREATE VIEW vw_segment_consumption AS
SELECT 
  rfm.segment,
  'All' as genre,  -- Simplified for now since we don't have genre data in interactions
  'All' as city,   -- Simplified for now since we don't have city data in interactions  
  COUNT(DISTINCT rfm.customer_id) as customers,
  AVG(freq_tx) as avg_frequency,
  AVG(monetary_tickets) as avg_ticket_spend,
  AVG(monetary_bar) as avg_bar_spend,
  AVG(monetary_total) as avg_monetary_total
FROM vw_customer_rfm rfm
GROUP BY rfm.segment;

CREATE VIEW vw_segment_demographics AS
SELECT 
  rfm.segment,
  AVG(EXTRACT(YEAR FROM age(CURRENT_DATE, c.birthdate))) as avg_age,
  COUNT(DISTINCT rfm.customer_id) as total_customers,
  COUNT(DISTINCT c.city) as cities_reached,
  (COUNT(CASE WHEN c.gender = 'M' THEN 1 END) * 100.0 / COUNT(*)) as male_pct,
  (COUNT(CASE WHEN c.gender = 'F' THEN 1 END) * 100.0 / COUNT(*)) as female_pct
FROM vw_customer_rfm rfm
JOIN customers c ON c.id = rfm.customer_id
GROUP BY rfm.segment;

CREATE VIEW vw_segment_forecast AS
SELECT 
  sc.segment,
  sc.genre,
  sc.city,
  sc.customers,
  sc.avg_ticket_spend,
  sc.avg_bar_spend,
  sc.avg_monetary_total,
  sc.avg_monetary_total * 0.8 as expected_spend_per_customer,  -- Conservative estimate
  sc.customers as data_quality_score,  -- Use customer count as data quality indicator
  CASE 
    WHEN sc.segment = 'Heavy' THEN 0.15
    WHEN sc.segment = 'Medium' THEN 0.10
    ELSE 0.05
  END as estimated_conversion_rate
FROM vw_segment_consumption sc;
-- Create optimized RFM customer view
CREATE OR REPLACE VIEW vw_rfm_customer AS
WITH customer_metrics AS (
  SELECT 
    c.id as customer_id,
    MAX(i.created_at) as last_interaction_at,
    EXTRACT(DAY FROM CURRENT_DATE - MAX(i.created_at)) as recency_days,
    COUNT(DISTINCT i.id) as frequency_interactions,
    COALESCE(SUM(i.value), 0) as monetary_total,
    NTILE(5) OVER (ORDER BY EXTRACT(DAY FROM CURRENT_DATE - MAX(i.created_at)) DESC) as r_rank,
    NTILE(5) OVER (ORDER BY COUNT(DISTINCT i.id)) as f_rank,
    NTILE(5) OVER (ORDER BY COALESCE(SUM(i.value), 0)) as m_rank
  FROM customers c
  LEFT JOIN interactions i ON i.customer_id = c.id
  GROUP BY c.id
)
SELECT 
  customer_id,
  last_interaction_at,
  recency_days,
  frequency_interactions,
  monetary_total,
  r_rank as r,
  f_rank as f,
  m_rank as m,
  (r_rank * f_rank * m_rank) as rfm_score
FROM customer_metrics;

-- Create event performance view
CREATE OR REPLACE VIEW vw_event_perf AS
SELECT 
  e.id as event_id,
  e.city,
  e.genre,
  e.date,
  e.capacity,
  e.sold_tickets,
  e.revenue,
  CASE 
    WHEN e.sold_tickets > 0 THEN ROUND(e.revenue / e.sold_tickets, 2)
    ELSE 0 
  END as avg_ticket_price,
  CASE 
    WHEN e.sold_tickets > 0 THEN ROUND(e.sold_tickets::numeric / e.capacity, 4)
    ELSE 0 
  END as conversion_rate,
  COALESCE((
    SELECT AVG(cons.totalvalue / NULLIF(cons.quantity, 0))
    FROM consumptions cons
    JOIN interactions i ON i.customer_id = cons.customerid
    WHERE i.event_id = e.id
  ), 0) as avg_basket_value
FROM events e;

-- Create customer-event features view
CREATE OR REPLACE VIEW vw_customer_event_features AS
WITH customer_event_history AS (
  SELECT 
    c.id as customer_id,
    e.id as event_id,
    COUNT(DISTINCT i.id) FILTER (WHERE i.event_id IS NOT NULL) as prev_attendance_count,
    AVG(i.value) FILTER (WHERE i.created_at >= CURRENT_DATE - INTERVAL '90 days') as avg_spend_last_90d,
    EXTRACT(DAY FROM MIN(e.date - i.created_at)) as avg_days_before_event,
    CASE WHEN c.city = e.city THEN 1 ELSE 0 END as city_match,
    EXTRACT(DAY FROM CURRENT_DATE - MAX(i.created_at)) as days_since_last_event
  FROM customers c
  CROSS JOIN events e
  LEFT JOIN interactions i ON i.customer_id = c.id
  GROUP BY c.id, e.id, c.city, e.city
)
SELECT 
  customer_id,
  event_id,
  COALESCE(prev_attendance_count, 0) as prev_attendance_count,
  COALESCE(avg_spend_last_90d, 0) as avg_spend_last_90d,
  COALESCE(avg_days_before_event, 0) as avg_days_before_event,
  city_match,
  COALESCE(days_since_last_event, 0) as days_since_last_event
FROM customer_event_history;
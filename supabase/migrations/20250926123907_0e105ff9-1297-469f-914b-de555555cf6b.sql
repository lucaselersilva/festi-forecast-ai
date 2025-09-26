-- Views para insights de patrocínio (simplificadas e corrigidas)

-- 1) RFM e Consumo Histórico por Cliente (ticket + bar)
CREATE OR REPLACE VIEW vw_customer_rfm AS
WITH base AS (
  SELECT
    i.customer_id,
    MAX(i.created_at) as last_tx,
    COUNT(*) as freq_tx,
    SUM(COALESCE(i.value, 0)) as monetary_tickets,
    COALESCE((
      SELECT SUM(c.totalvalue) 
      FROM consumptions c 
      WHERE c.customerid = i.customer_id
    ), 0) as monetary_bar
  FROM interactions i
  WHERE i.interaction_type = 'purchase'
  GROUP BY i.customer_id
),
recency AS (
  SELECT
    customer_id,
    EXTRACT(epoch FROM (NOW() - last_tx))/86400.0 AS recency_days,
    freq_tx,
    monetary_tickets,
    monetary_bar,
    (monetary_tickets + monetary_bar) AS monetary_total
  FROM base
),
percentiles AS (
  SELECT
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY monetary_total) as p50,
    PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY monetary_total) as p80
  FROM recency
)
SELECT
  r.customer_id,
  r.recency_days,
  r.freq_tx,
  r.monetary_tickets,
  r.monetary_bar,
  r.monetary_total,
  NTILE(5) OVER(ORDER BY r.recency_days ASC) AS R,
  NTILE(5) OVER(ORDER BY r.freq_tx DESC) AS F,
  NTILE(5) OVER(ORDER BY r.monetary_total DESC) AS M,
  CASE
    WHEN r.monetary_total >= p.p80 THEN 'Heavy'
    WHEN r.monetary_total >= p.p50 THEN 'Medium'
    ELSE 'Light'
  END AS segment
FROM recency r
CROSS JOIN percentiles p;

-- 2) Context de eventos para análise
CREATE OR REPLACE VIEW vw_event_context AS
SELECT
  e.id as event_id,
  e.genre,
  e.city,
  e.venue,
  e.capacity,
  e.date as event_date,
  EXTRACT(dow FROM e.date) as dow,
  DATE_TRUNC('month', e.date) as month_bucket,
  e.sold_tickets,
  e.revenue
FROM events e;

-- 3) Consumo Médio por Segmento por gênero/cidade
CREATE OR REPLACE VIEW vw_segment_consumption AS
SELECT
  c.segment,
  ec.genre,
  ec.city,
  COUNT(DISTINCT c.customer_id) as customers,
  AVG(c.monetary_total)::NUMERIC(10,2) as avg_monetary_total,
  AVG(c.monetary_tickets)::NUMERIC(10,2) as avg_ticket_spend,
  AVG(c.monetary_bar)::NUMERIC(10,2) as avg_bar_spend,
  AVG(c.freq_tx)::NUMERIC(10,2) as avg_frequency
FROM vw_customer_rfm c
JOIN interactions i ON i.customer_id = c.customer_id AND i.interaction_type = 'purchase'
JOIN vw_event_context ec ON ec.event_id = i.event_id
GROUP BY c.segment, ec.genre, ec.city;

-- 4) Eventos Análogos para previsão
CREATE OR REPLACE VIEW vw_event_analogs AS
SELECT
  e.id as event_id,
  e.genre,
  e.city,
  e.venue,
  e.capacity,
  EXTRACT(dow FROM e.date) as dow,
  DATE_TRUNC('month', e.date) as month_bucket,
  e.sold_tickets,
  e.revenue,
  e.ticket_price as avg_price,
  CASE 
    WHEN e.capacity > 0 THEN (e.sold_tickets::FLOAT / e.capacity::FLOAT)
    ELSE 0 
  END as occupancy_rate,
  CASE 
    WHEN e.sold_tickets > 0 THEN (e.revenue::FLOAT / e.sold_tickets::FLOAT)
    ELSE 0 
  END as revenue_per_person
FROM events e
WHERE e.date >= NOW() - INTERVAL '12 months'
  AND e.sold_tickets > 0;

-- 5) Previsão de Consumo por Segmento
CREATE OR REPLACE VIEW vw_segment_forecast AS
WITH recent_performance AS (
  SELECT
    a.genre,
    a.city,
    AVG(a.occupancy_rate) as avg_occupancy,
    AVG(a.revenue_per_person) as avg_revenue_per_person,
    COUNT(*) as sample_size
  FROM vw_event_analogs a
  WHERE a.event_id IS NOT NULL
  GROUP BY a.genre, a.city
  HAVING COUNT(*) >= 2
)
SELECT
  sc.genre,
  sc.city,
  sc.segment,
  sc.customers,
  sc.avg_monetary_total,
  sc.avg_ticket_spend,
  sc.avg_bar_spend,
  sc.avg_monetary_total * 
    (1.0 + COALESCE(rp.avg_occupancy * 0.2, 0.1)) as expected_spend_per_customer,
  CASE sc.segment
    WHEN 'Heavy' THEN 0.35
    WHEN 'Medium' THEN 0.25
    ELSE 0.15
  END as estimated_conversion_rate,
  rp.sample_size as data_quality_score
FROM vw_segment_consumption sc
LEFT JOIN recent_performance rp ON rp.genre = sc.genre AND rp.city = sc.city;

-- 6) Demografia por segmento
CREATE OR REPLACE VIEW vw_segment_demographics AS
SELECT
  rfm.segment,
  COUNT(*) as total_customers,
  AVG(EXTRACT(year FROM age(NOW(), c.birthdate)))::INTEGER as avg_age,
  COUNT(CASE WHEN c.gender = 'M' THEN 1 END)::FLOAT / COUNT(*)::FLOAT as male_pct,
  COUNT(CASE WHEN c.gender = 'F' THEN 1 END)::FLOAT / COUNT(*)::FLOAT as female_pct,
  COUNT(DISTINCT c.city) as cities_reached
FROM vw_customer_rfm rfm
JOIN customers c ON c.id = rfm.customer_id
WHERE c.birthdate IS NOT NULL
GROUP BY rfm.segment;
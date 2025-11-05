-- Drop dependent views first
DROP VIEW IF EXISTS vw_all_customers_birthdays CASCADE;
DROP VIEW IF EXISTS vw_valle_cluster_analysis CASCADE;
DROP VIEW IF EXISTS vw_valle_rfm CASCADE;

-- Recreate vw_valle_rfm with CTE optimization
CREATE OR REPLACE VIEW vw_valle_rfm AS
WITH tenant_percentiles AS (
  SELECT 
    tenant_id,
    percentile_cont(0.9) WITHIN GROUP (ORDER BY consumo::double precision) AS p90_consumo,
    percentile_cont(0.8) WITHIN GROUP (ORDER BY presencas::double precision) AS p80_presencas
  FROM valle_clientes
  WHERE consumo > 0 OR presencas > 0
  GROUP BY tenant_id
),
customer_data AS (
  SELECT 
    vc.id,
    vc.tenant_id,
    vc.nome,
    vc.email,
    vc.telefone,
    vc.aniversario,
    CASE 
      WHEN vc.aniversario IS NOT NULL 
      THEN EXTRACT(YEAR FROM age(vc.aniversario))::integer 
      ELSE NULL 
    END AS idade,
    vc.consumo,
    vc.presencas,
    CASE 
      WHEN vc.ultima_visita IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (now() - vc.ultima_visita))/86400 
      ELSE NULL 
    END AS recency_days,
    vc.ultima_visita,
    vc.primeira_entrada,
    vc.genero,
    vc.cpf,
    vc.aplicativo_ativo,
    tp.p90_consumo,
    tp.p80_presencas
  FROM valle_clientes vc
  LEFT JOIN tenant_percentiles tp ON vc.tenant_id = tp.tenant_id
)
SELECT 
  cd.id,
  cd.tenant_id,
  cd.nome,
  cd.email,
  cd.telefone,
  cd.aniversario,
  cd.idade,
  cd.consumo,
  cd.presencas,
  cd.recency_days,
  cd.ultima_visita,
  cd.primeira_entrada,
  cd.genero,
  cd.cpf,
  cd.aplicativo_ativo,
  cd.presencas AS frequency,
  cd.consumo AS monetary,
  CASE 
    WHEN cd.recency_days IS NULL THEN 'Sem Dados'
    WHEN cd.recency_days <= 30 THEN 'Ativos'
    WHEN cd.recency_days <= 90 THEN 'Em Risco'
    WHEN cd.recency_days <= 180 THEN 'Dormentes'
    ELSE 'Inativos'
  END AS cluster_comportamental,
  CASE 
    WHEN cd.consumo >= cd.p90_consumo THEN 'Top 10% faturamento'
    WHEN cd.presencas >= cd.p80_presencas THEN 'Top 20% frequência'
    WHEN cd.consumo > 0 OR cd.presencas > 0 THEN 'Base'
    ELSE 'Sem Transações'
  END AS cluster_valor,
  CASE 
    WHEN cd.idade < 25 THEN '18-24'
    WHEN cd.idade < 35 THEN '25-34'
    WHEN cd.idade < 45 THEN '35-44'
    WHEN cd.idade < 55 THEN '45-54'
    WHEN cd.idade >= 55 THEN '55+'
    ELSE 'Não Informada'
  END AS faixa_etaria,
  CASE 
    WHEN cd.recency_days IS NULL THEN 0.1
    WHEN cd.recency_days <= 30 THEN 0.8
    WHEN cd.recency_days <= 90 THEN 0.5
    WHEN cd.recency_days <= 180 THEN 0.3
    ELSE 0.1
  END AS propensity_score,
  CASE 
    WHEN cd.presencas = 1 THEN 'Novos'
    WHEN cd.presencas <= 3 THEN 'Iniciantes'
    WHEN cd.presencas <= 10 THEN 'Regulares'
    ELSE 'VIPs'
  END AS cluster_jornada
FROM customer_data cd;

-- Recreate vw_valle_cluster_analysis
CREATE OR REPLACE VIEW vw_valle_cluster_analysis AS
SELECT 
  tenant_id,
  cluster_comportamental,
  COUNT(*) AS total_clientes,
  ROUND(AVG(consumo), 2) AS consumo_medio,
  ROUND(AVG(presencas), 2) AS presencas_media,
  ROUND(AVG(propensity_score), 2) AS propensity_media,
  COUNT(DISTINCT CASE WHEN aplicativo_ativo = true THEN id END) AS com_app_ativo,
  ARRAY_AGG(DISTINCT faixa_etaria) FILTER (WHERE faixa_etaria IS NOT NULL) AS faixas_etarias,
  ARRAY_AGG(DISTINCT genero) FILTER (WHERE genero IS NOT NULL) AS generos
FROM vw_valle_rfm
GROUP BY tenant_id, cluster_comportamental;

-- Recreate vw_all_customers_birthdays
CREATE OR REPLACE VIEW vw_all_customers_birthdays AS
SELECT 
  id::text AS customer_id,
  nome,
  email,
  telefone,
  aniversario,
  idade,
  consumo,
  presencas,
  recency_days,
  ultima_visita,
  primeira_entrada,
  cluster_comportamental,
  cluster_valor,
  faixa_etaria,
  propensity_score,
  genero,
  aplicativo_ativo,
  cluster_jornada,
  frequency,
  monetary,
  'vw_valle_rfm' AS source_table,
  tenant_id
FROM vw_valle_rfm
WHERE aniversario IS NOT NULL;
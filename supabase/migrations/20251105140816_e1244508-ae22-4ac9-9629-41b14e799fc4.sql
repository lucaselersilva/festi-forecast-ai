-- Drop and recreate vw_valle_cluster_analysis with recency_media
DROP VIEW IF EXISTS vw_valle_cluster_analysis CASCADE;

CREATE OR REPLACE VIEW vw_valle_cluster_analysis AS
SELECT 
  tenant_id,
  cluster_comportamental,
  COUNT(*) AS total_clientes,
  ROUND(AVG(consumo), 2) AS consumo_medio,
  ROUND(AVG(presencas), 2) AS presencas_media,
  ROUND(AVG(recency_days), 2) AS recency_media,
  ROUND(AVG(propensity_score), 2) AS propensity_media,
  COUNT(DISTINCT CASE WHEN aplicativo_ativo = true THEN id END) AS com_app_ativo,
  ARRAY_AGG(DISTINCT faixa_etaria) FILTER (WHERE faixa_etaria IS NOT NULL) AS faixas_etarias,
  ARRAY_AGG(DISTINCT genero) FILTER (WHERE genero IS NOT NULL) AS generos
FROM vw_valle_rfm
GROUP BY tenant_id, cluster_comportamental;
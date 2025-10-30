-- Recreate vw_valle_cluster_analysis with tenant_id support
CREATE OR REPLACE VIEW public.vw_valle_cluster_analysis AS
SELECT 
    tenant_id,
    cluster_comportamental,
    COUNT(*) AS total_clientes,
    AVG(consumo) AS consumo_medio,
    AVG(presencas) AS presencas_media,
    AVG(recency_days) AS recency_media,
    AVG(propensity_score) AS propensity_media,
    COUNT(*) FILTER (WHERE aplicativo_ativo = true) AS com_app_ativo,
    array_agg(DISTINCT faixa_etaria) FILTER (WHERE faixa_etaria IS NOT NULL) AS faixas_etarias,
    array_agg(DISTINCT genero) FILTER (WHERE genero IS NOT NULL) AS generos
FROM vw_valle_rfm
WHERE cluster_comportamental IS NOT NULL
GROUP BY tenant_id, cluster_comportamental;
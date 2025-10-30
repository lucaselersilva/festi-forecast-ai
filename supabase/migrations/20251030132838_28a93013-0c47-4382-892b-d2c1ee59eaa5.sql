-- Add tenant_id to vw_valle_rfm view
DROP VIEW IF EXISTS public.vw_valle_rfm CASCADE;

CREATE OR REPLACE VIEW public.vw_valle_rfm AS
SELECT 
    vc.id,
    vc.tenant_id,  -- ADICIONAR tenant_id
    vc.nome,
    vc.cpf,
    vc.email,
    vc.genero,
    vc.telefone,
    vc.aniversario,
    vc.aplicativo_ativo,
    vc.presencas,
    vc.primeira_entrada,
    vc.ultima_visita,
    vc.consumo,
    EXTRACT(day FROM now() - vc.ultima_visita) AS recency_days,
    vc.presencas AS frequency,
    vc.consumo AS monetary,
    CASE
        WHEN vc.aniversario IS NOT NULL THEN EXTRACT(year FROM age(vc.aniversario::timestamp with time zone))::integer
        ELSE NULL::integer
    END AS idade,
    CASE
        WHEN vc.presencas >= 5 AND vc.consumo >= 500::numeric THEN 'VIPs / High Rollers'::text
        WHEN vc.presencas >= 5 AND vc.consumo < 500::numeric THEN 'Frequentes Econômicos'::text
        WHEN vc.presencas < 5 AND vc.consumo >= 500::numeric THEN 'Ocasional Premium'::text
        WHEN EXTRACT(day FROM now() - vc.ultima_visita) > 90::numeric THEN 'Dormientes / Risco de churn'::text
        WHEN vc.primeira_utilizacao = true AND EXTRACT(day FROM now() - vc.primeira_entrada) <= 30::numeric THEN 'Novatos'::text
        ELSE 'Ocasional Regular'::text
    END AS cluster_comportamental,
    CASE
        WHEN EXTRACT(day FROM now() - vc.primeira_entrada) < 30::numeric THEN 'Recém-entrantes'::text
        WHEN EXTRACT(day FROM now() - vc.ultima_visita) < 30::numeric THEN 'Ativos recentes'::text
        WHEN EXTRACT(day FROM now() - vc.ultima_visita) > 90::numeric THEN 'Inativos'::text
        ELSE 'Intermitentes'::text
    END AS cluster_jornada,
    CASE
        WHEN vc.consumo::double precision >= (
            SELECT percentile_cont(0.9::double precision) WITHIN GROUP (ORDER BY (consumo::double precision)) 
            FROM valle_clientes 
            WHERE consumo > 0::numeric AND tenant_id = vc.tenant_id
        ) THEN 'Top 10% faturamento'::text
        WHEN vc.presencas::double precision >= (
            SELECT percentile_cont(0.8::double precision) WITHIN GROUP (ORDER BY (presencas::double precision)) 
            FROM valle_clientes 
            WHERE presencas > 0 AND tenant_id = vc.tenant_id
        ) THEN 'Top 20% frequência'::text
        WHEN vc.consumo < 100::numeric AND vc.presencas <= 2 THEN 'Baixo valor potencial'::text
        ELSE 'Valor Médio'::text
    END AS cluster_valor,
    CASE
        WHEN vc.aniversario IS NULL THEN 'Não informado'::text
        WHEN EXTRACT(year FROM age(vc.aniversario::timestamp with time zone)) < 25::numeric THEN '18-24'::text
        WHEN EXTRACT(year FROM age(vc.aniversario::timestamp with time zone)) < 35::numeric THEN '25-34'::text
        WHEN EXTRACT(year FROM age(vc.aniversario::timestamp with time zone)) < 45::numeric THEN '35-44'::text
        WHEN EXTRACT(year FROM age(vc.aniversario::timestamp with time zone)) < 55::numeric THEN '45-54'::text
        ELSE '55+'::text
    END AS faixa_etaria,
    CASE
        WHEN EXTRACT(day FROM now() - vc.ultima_visita) > 90::numeric THEN 0.2
        WHEN vc.presencas >= 5 AND EXTRACT(day FROM now() - vc.ultima_visita) < 30::numeric THEN 0.9
        WHEN vc.presencas >= 3 THEN 0.7
        WHEN vc.presencas >= 1 THEN 0.5
        ELSE 0.3
    END AS propensity_score
FROM valle_clientes vc;
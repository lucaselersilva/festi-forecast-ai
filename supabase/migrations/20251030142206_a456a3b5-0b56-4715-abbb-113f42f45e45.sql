-- Fix column types in vw_all_customers_birthdays
DROP VIEW IF EXISTS public.vw_all_customers_birthdays CASCADE;

CREATE OR REPLACE VIEW public.vw_all_customers_birthdays AS
-- Parte 1: Customers table with explicit casts
SELECT 
  c.id::text AS customer_id,
  c.tenant_id,
  c.name::text AS nome,
  c.email::text AS email,
  c.phone::text AS telefone,
  c.birthdate AS aniversario,
  EXTRACT(YEAR FROM AGE(c.birthdate::timestamp with time zone))::integer AS idade,
  0::numeric AS consumo,
  0 AS presencas,
  999::numeric AS recency_days,
  NULL::timestamp with time zone AS ultima_visita,
  NULL::timestamp with time zone AS primeira_entrada,
  NULL::text AS cluster_comportamental,
  NULL::text AS cluster_valor,
  NULL::text AS faixa_etaria,
  0::numeric AS propensity_score,
  c.gender::text AS genero,
  false AS aplicativo_ativo,
  NULL::text AS cluster_jornada,
  0 AS frequency,
  0::numeric AS monetary,
  'customers'::text AS source_table
FROM public.customers c
WHERE c.birthdate IS NOT NULL

UNION ALL

-- Parte 2: Valle Clientes via vw_valle_rfm
SELECT 
  vr.id::text AS customer_id,
  vr.tenant_id,
  vr.nome::text,
  vr.email::text,
  vr.telefone::text,
  vr.aniversario,
  vr.idade,
  vr.consumo,
  vr.presencas,
  vr.recency_days,
  vr.ultima_visita,
  vr.primeira_entrada,
  vr.cluster_comportamental::text,
  vr.cluster_valor::text,
  vr.faixa_etaria::text,
  vr.propensity_score,
  vr.genero::text,
  vr.aplicativo_ativo,
  vr.cluster_jornada::text,
  vr.frequency,
  vr.monetary,
  'valle_clientes'::text AS source_table
FROM public.vw_valle_rfm vr
WHERE vr.aniversario IS NOT NULL;

-- Recreate get_birthday_customers_unified
CREATE OR REPLACE FUNCTION public.get_birthday_customers_unified(
  target_month integer,
  cluster_filter text[] DEFAULT NULL,
  age_range_filter text[] DEFAULT NULL
)
RETURNS TABLE (
  customer_id text,
  nome text,
  email text,
  telefone text,
  aniversario date,
  idade integer,
  consumo numeric,
  presencas integer,
  recency_days numeric,
  ultima_visita timestamp with time zone,
  primeira_entrada timestamp with time zone,
  cluster_comportamental text,
  cluster_valor text,
  faixa_etaria text,
  propensity_score numeric,
  genero text,
  aplicativo_ativo boolean,
  cluster_jornada text,
  frequency integer,
  monetary numeric,
  source_table text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (vw.customer_id)
    vw.customer_id,
    vw.nome,
    vw.email,
    vw.telefone,
    vw.aniversario,
    vw.idade,
    vw.consumo,
    vw.presencas,
    vw.recency_days,
    vw.ultima_visita,
    vw.primeira_entrada,
    vw.cluster_comportamental,
    vw.cluster_valor,
    vw.faixa_etaria,
    vw.propensity_score,
    vw.genero,
    vw.aplicativo_ativo,
    vw.cluster_jornada,
    vw.frequency,
    vw.monetary,
    vw.source_table
  FROM public.vw_all_customers_birthdays vw
  WHERE 
    vw.tenant_id = get_user_tenant_id()
    AND EXTRACT(MONTH FROM vw.aniversario) = target_month
    AND (
      cluster_filter IS NULL 
      OR cluster_filter = '{}' 
      OR vw.cluster_comportamental = ANY(cluster_filter)
    )
    AND (
      age_range_filter IS NULL 
      OR age_range_filter = '{}' 
      OR vw.faixa_etaria = ANY(age_range_filter)
    )
  ORDER BY vw.customer_id, vw.aniversario;
END;
$$;
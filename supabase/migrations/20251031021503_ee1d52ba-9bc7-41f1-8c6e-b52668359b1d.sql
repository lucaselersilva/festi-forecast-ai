-- Optimize the get_birthday_customers_unified function
-- Remove DISTINCT ON and simplify the query
DROP FUNCTION IF EXISTS public.get_birthday_customers_unified(integer, text[], text[]);

CREATE OR REPLACE FUNCTION public.get_birthday_customers_unified(
  target_month integer,
  cluster_filter text[] DEFAULT NULL,
  age_range_filter text[] DEFAULT NULL
)
RETURNS TABLE(
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
  SELECT 
    vc.id::text as customer_id,
    vc.nome,
    vc.email,
    vc.telefone,
    vc.aniversario,
    CASE 
      WHEN vc.aniversario IS NOT NULL 
      THEN EXTRACT(YEAR FROM age(vc.aniversario))::integer 
      ELSE NULL 
    END as idade,
    COALESCE(vc.consumo, 0) as consumo,
    COALESCE(vc.presencas, 0) as presencas,
    CASE 
      WHEN vc.ultima_visita IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (now() - vc.ultima_visita))/86400 
      ELSE NULL 
    END as recency_days,
    vc.ultima_visita,
    vc.primeira_entrada,
    CAST(NULL AS text) as cluster_comportamental,
    CAST(NULL AS text) as cluster_valor,
    CASE 
      WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 25 THEN '18-24'
      WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 35 THEN '25-34'
      WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 45 THEN '35-44'
      WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 55 THEN '45-54'
      ELSE '55+'
    END as faixa_etaria,
    0.5 as propensity_score,
    vc.genero,
    COALESCE(vc.aplicativo_ativo, false) as aplicativo_ativo,
    CAST(NULL AS text) as cluster_jornada,
    COALESCE(vc.presencas, 0) as frequency,
    COALESCE(vc.consumo, 0) as monetary,
    'valle_clientes' as source_table
  FROM public.valle_clientes vc
  WHERE 
    vc.tenant_id = get_user_tenant_id()
    AND vc.aniversario IS NOT NULL
    AND EXTRACT(MONTH FROM vc.aniversario) = target_month
    AND (
      cluster_filter IS NULL 
      OR cluster_filter = '{}'
    )
    AND (
      age_range_filter IS NULL 
      OR age_range_filter = '{}'
      OR (
        CASE 
          WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 25 THEN '18-24'
          WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 35 THEN '25-34'
          WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 45 THEN '35-44'
          WHEN EXTRACT(YEAR FROM age(vc.aniversario))::integer < 55 THEN '45-54'
          ELSE '55+'
        END
      ) = ANY(age_range_filter)
    )
  ORDER BY vc.aniversario;
END;
$$;
-- Drop and recreate get_birthday_customers_unified with correct types
DROP FUNCTION IF EXISTS public.get_birthday_customers_unified(integer, text[], text[]);

CREATE FUNCTION public.get_birthday_customers_unified(
  target_month integer, 
  cluster_filter text[] DEFAULT NULL::text[], 
  age_range_filter text[] DEFAULT NULL::text[]
)
RETURNS TABLE(
  customer_id text,
  nome character varying,
  email character varying,
  telefone character varying,
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
  genero character varying,
  aplicativo_ativo boolean,
  cluster_jornada text,
  frequency integer,
  monetary numeric,
  source_table text
)
LANGUAGE plpgsql
STABLE
AS $function$
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
  FROM vw_all_customers_birthdays vw
  WHERE 
    EXTRACT(MONTH FROM vw.aniversario) = target_month
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
$function$;
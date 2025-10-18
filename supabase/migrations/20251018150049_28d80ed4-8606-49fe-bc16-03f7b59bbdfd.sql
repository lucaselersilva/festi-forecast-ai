-- Atualizar função get_birthday_customers para evitar duplicatas e melhorar filtros
DROP FUNCTION IF EXISTS get_birthday_customers(INTEGER, TEXT[], TEXT[]);

CREATE OR REPLACE FUNCTION get_birthday_customers(
  target_month INTEGER,
  cluster_filter TEXT[] DEFAULT NULL,
  age_range_filter TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  aniversario DATE,
  idade INTEGER,
  consumo NUMERIC,
  presencas INTEGER,
  recency_days NUMERIC,
  ultima_visita TIMESTAMP WITH TIME ZONE,
  primeira_entrada TIMESTAMP WITH TIME ZONE,
  cluster_comportamental TEXT,
  cluster_valor TEXT,
  faixa_etaria TEXT,
  propensity_score NUMERIC,
  genero TEXT,
  cpf TEXT,
  aplicativo_ativo BOOLEAN,
  cluster_jornada TEXT,
  frequency INTEGER,
  monetary NUMERIC
)
LANGUAGE SQL
STABLE
AS $$
  SELECT DISTINCT ON (vw_valle_rfm.id)
    vw_valle_rfm.id, 
    vw_valle_rfm.nome, 
    vw_valle_rfm.email, 
    vw_valle_rfm.telefone, 
    vw_valle_rfm.aniversario, 
    vw_valle_rfm.idade, 
    vw_valle_rfm.consumo, 
    vw_valle_rfm.presencas, 
    vw_valle_rfm.recency_days, 
    vw_valle_rfm.ultima_visita, 
    vw_valle_rfm.primeira_entrada,
    vw_valle_rfm.cluster_comportamental, 
    vw_valle_rfm.cluster_valor, 
    vw_valle_rfm.faixa_etaria,
    vw_valle_rfm.propensity_score, 
    vw_valle_rfm.genero, 
    vw_valle_rfm.cpf, 
    vw_valle_rfm.aplicativo_ativo,
    vw_valle_rfm.cluster_jornada, 
    vw_valle_rfm.frequency, 
    vw_valle_rfm.monetary
  FROM vw_valle_rfm
  WHERE 
    vw_valle_rfm.aniversario IS NOT NULL
    AND EXTRACT(MONTH FROM vw_valle_rfm.aniversario) = target_month
    AND (
      cluster_filter IS NULL 
      OR cluster_filter = '{}' 
      OR vw_valle_rfm.cluster_comportamental = ANY(cluster_filter)
    )
    AND (
      age_range_filter IS NULL 
      OR age_range_filter = '{}' 
      OR vw_valle_rfm.faixa_etaria = ANY(age_range_filter)
    )
  ORDER BY 
    vw_valle_rfm.id,
    EXTRACT(DAY FROM vw_valle_rfm.aniversario) ASC,
    vw_valle_rfm.consumo DESC
$$;
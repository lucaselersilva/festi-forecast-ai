-- Create function to get birthday customers filtering by month correctly
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
  SELECT 
    id, nome, email, telefone, aniversario, idade, consumo, 
    presencas, recency_days, ultima_visita, primeira_entrada,
    cluster_comportamental, cluster_valor, faixa_etaria,
    propensity_score, genero, cpf, aplicativo_ativo,
    cluster_jornada, frequency, monetary
  FROM vw_valle_rfm
  WHERE 
    aniversario IS NOT NULL
    AND EXTRACT(MONTH FROM aniversario) = target_month
    AND (cluster_filter IS NULL OR cluster_comportamental = ANY(cluster_filter))
    AND (age_range_filter IS NULL OR faixa_etaria = ANY(age_range_filter))
  ORDER BY 
    EXTRACT(DAY FROM aniversario) ASC,
    consumo DESC
$$;
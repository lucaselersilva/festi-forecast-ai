-- Create unified view for all customers with birthdays
CREATE OR REPLACE VIEW vw_all_customers_birthdays AS
SELECT 
  -- Basic data
  COALESCE(c.id::text, vr.id::text) as customer_id,
  COALESCE(c.name, vr.nome) as nome,
  COALESCE(c.email, vr.email) as email,
  COALESCE(c.phone, vr.telefone) as telefone,
  COALESCE(c.birthdate, vr.aniversario) as aniversario,
  COALESCE(EXTRACT(YEAR FROM AGE(c.birthdate))::INTEGER, vr.idade) as idade,
  
  -- Behavioral data from vw_valle_rfm (has calculated fields)
  vr.consumo,
  vr.presencas,
  vr.recency_days,
  vr.ultima_visita,
  vr.primeira_entrada,
  vr.cluster_comportamental,
  vr.cluster_valor,
  vr.faixa_etaria,
  vr.propensity_score,
  vr.genero,
  vr.aplicativo_ativo,
  vr.cluster_jornada,
  vr.frequency,
  vr.monetary,
  
  -- Data source
  CASE 
    WHEN vr.id IS NOT NULL THEN 'valle_clientes'
    ELSE 'customers'
  END as source_table
  
FROM customers c
FULL OUTER JOIN vw_valle_rfm vr ON c.email = vr.email OR c.phone = vr.telefone
WHERE COALESCE(c.birthdate, vr.aniversario) IS NOT NULL;

-- Create improved RPC function for unified birthday customers
CREATE OR REPLACE FUNCTION get_birthday_customers_unified(
  target_month INTEGER,
  cluster_filter TEXT[] DEFAULT NULL,
  age_range_filter TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  customer_id TEXT,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  aniversario DATE,
  idade INTEGER,
  consumo NUMERIC,
  presencas INTEGER,
  recency_days NUMERIC,
  ultima_visita TIMESTAMPTZ,
  primeira_entrada TIMESTAMPTZ,
  cluster_comportamental TEXT,
  cluster_valor TEXT,
  faixa_etaria TEXT,
  propensity_score NUMERIC,
  genero TEXT,
  aplicativo_ativo BOOLEAN,
  cluster_jornada TEXT,
  frequency INTEGER,
  monetary NUMERIC,
  source_table TEXT
)
LANGUAGE plpgsql
STABLE
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
$$;

-- Create table for birthday cluster actions
CREATE TABLE birthday_cluster_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  cluster_name TEXT NOT NULL,
  cluster_size INTEGER NOT NULL,
  
  -- AI-generated strategies
  actions JSONB NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(month, year, cluster_name)
);

-- Create index for performance
CREATE INDEX idx_birthday_actions_month_year ON birthday_cluster_actions(month, year);

-- Enable RLS
ALTER TABLE birthday_cluster_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies for birthday_cluster_actions
CREATE POLICY "Anyone can view birthday cluster actions" 
ON birthday_cluster_actions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage birthday cluster actions" 
ON birthday_cluster_actions 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_birthday_cluster_actions_updated_at
BEFORE UPDATE ON birthday_cluster_actions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
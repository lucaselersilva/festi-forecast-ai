-- Tabela para armazenar clientes do Valle (Zig Casas)
CREATE TABLE IF NOT EXISTS public.valle_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT,
  email TEXT,
  genero TEXT,
  telefone TEXT,
  aniversario DATE,
  aplicativo_ativo BOOLEAN DEFAULT false,
  presencas INTEGER DEFAULT 0,
  primeira_entrada TIMESTAMP WITH TIME ZONE,
  ultima_visita TIMESTAMP WITH TIME ZONE,
  consumo NUMERIC(10, 2) DEFAULT 0,
  id_evento TEXT,
  primeira_interacao TIMESTAMP WITH TIME ZONE,
  primeira_utilizacao BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_valle_cpf ON public.valle_clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_valle_email ON public.valle_clientes(email);
CREATE INDEX IF NOT EXISTS idx_valle_ultima_visita ON public.valle_clientes(ultima_visita);
CREATE INDEX IF NOT EXISTS idx_valle_presencas ON public.valle_clientes(presencas);
CREATE INDEX IF NOT EXISTS idx_valle_consumo ON public.valle_clientes(consumo);

-- View para RFM (Recência, Frequência, Monetário)
CREATE OR REPLACE VIEW public.vw_valle_rfm AS
SELECT 
  id,
  nome,
  cpf,
  email,
  genero,
  telefone,
  aniversario,
  aplicativo_ativo,
  presencas,
  primeira_entrada,
  ultima_visita,
  consumo,
  -- Recência (dias desde última visita)
  EXTRACT(DAY FROM (NOW() - ultima_visita)) as recency_days,
  -- Frequência (número de presenças)
  presencas as frequency,
  -- Monetário (consumo total)
  consumo as monetary,
  -- Idade calculada
  CASE 
    WHEN aniversario IS NOT NULL 
    THEN EXTRACT(YEAR FROM AGE(aniversario))::INTEGER
    ELSE NULL
  END as idade,
  -- Cluster Comportamental
  CASE
    WHEN presencas >= 5 AND consumo >= 500 THEN 'VIPs / High Rollers'
    WHEN presencas >= 5 AND consumo < 500 THEN 'Frequentes Econômicos'
    WHEN presencas < 5 AND consumo >= 500 THEN 'Ocasional Premium'
    WHEN EXTRACT(DAY FROM (NOW() - ultima_visita)) > 90 THEN 'Dormientes / Risco de churn'
    WHEN primeira_utilizacao = true AND EXTRACT(DAY FROM (NOW() - primeira_entrada)) <= 30 THEN 'Novatos'
    ELSE 'Ocasional Regular'
  END as cluster_comportamental,
  -- Cluster de Jornada
  CASE
    WHEN EXTRACT(DAY FROM (NOW() - primeira_entrada)) < 30 THEN 'Recém-entrantes'
    WHEN EXTRACT(DAY FROM (NOW() - ultima_visita)) < 30 THEN 'Ativos recentes'
    WHEN EXTRACT(DAY FROM (NOW() - ultima_visita)) > 90 THEN 'Inativos'
    ELSE 'Intermitentes'
  END as cluster_jornada,
  -- Cluster de Valor
  CASE
    WHEN consumo >= (SELECT PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY consumo) FROM valle_clientes WHERE consumo > 0) THEN 'Top 10% faturamento'
    WHEN presencas >= (SELECT PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY presencas) FROM valle_clientes WHERE presencas > 0) THEN 'Top 20% frequência'
    WHEN consumo < 100 AND presencas <= 2 THEN 'Baixo valor potencial'
    ELSE 'Valor Médio'
  END as cluster_valor,
  -- Faixa Etária
  CASE 
    WHEN aniversario IS NULL THEN 'Não informado'
    WHEN EXTRACT(YEAR FROM AGE(aniversario)) < 25 THEN '18-24'
    WHEN EXTRACT(YEAR FROM AGE(aniversario)) < 35 THEN '25-34'
    WHEN EXTRACT(YEAR FROM AGE(aniversario)) < 45 THEN '35-44'
    WHEN EXTRACT(YEAR FROM AGE(aniversario)) < 55 THEN '45-54'
    ELSE '55+'
  END as faixa_etaria,
  -- Score de Propensão (simplificado)
  CASE
    WHEN EXTRACT(DAY FROM (NOW() - ultima_visita)) > 90 THEN 0.2
    WHEN presencas >= 5 AND EXTRACT(DAY FROM (NOW() - ultima_visita)) < 30 THEN 0.9
    WHEN presencas >= 3 THEN 0.7
    WHEN presencas >= 1 THEN 0.5
    ELSE 0.3
  END as propensity_score
FROM public.valle_clientes;

-- View para análise de clusters agregada
CREATE OR REPLACE VIEW public.vw_valle_cluster_analysis AS
SELECT 
  cluster_comportamental,
  COUNT(*) as total_clientes,
  AVG(consumo) as consumo_medio,
  AVG(presencas) as presencas_media,
  AVG(recency_days) as recency_media,
  COUNT(CASE WHEN aplicativo_ativo THEN 1 END) as com_app_ativo,
  AVG(propensity_score) as propensity_media,
  ARRAY_AGG(DISTINCT genero) as generos,
  ARRAY_AGG(DISTINCT faixa_etaria) as faixas_etarias
FROM public.vw_valle_rfm
GROUP BY cluster_comportamental
ORDER BY total_clientes DESC;

-- Tabela para armazenar estratégias de reativação por cluster
CREATE TABLE IF NOT EXISTS public.valle_reactivation_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_comportamental TEXT NOT NULL,
  strategy_title TEXT NOT NULL,
  strategy_description TEXT,
  message_template TEXT,
  recommended_channel TEXT,
  expected_conversion_rate NUMERIC(5, 4),
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.valle_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valle_reactivation_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage valle_clientes"
  ON public.valle_clientes FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage strategies"
  ON public.valle_reactivation_strategies FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_valle_clientes_updated_at
  BEFORE UPDATE ON public.valle_clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_valle_strategies_updated_at
  BEFORE UPDATE ON public.valle_reactivation_strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
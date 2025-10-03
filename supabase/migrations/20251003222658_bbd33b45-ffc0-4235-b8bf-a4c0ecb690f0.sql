-- Tabela de execuções de análise
CREATE TABLE IF NOT EXISTS public.analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id),
  goal TEXT NOT NULL,
  constraints_json JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de perfis de dados
CREATE TABLE IF NOT EXISTS public.data_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de descobertas/findings
CREATE TABLE IF NOT EXISTS public.findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de estratégias
CREATE TABLE IF NOT EXISTS public.strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  payload_json JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'saved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de validações de estratégias
CREATE TABLE IF NOT EXISTS public.strategy_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE,
  ok BOOLEAN NOT NULL,
  reasons_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de benchmarks
CREATE TABLE IF NOT EXISTS public.benchmarks (
  key TEXT PRIMARY KEY,
  value NUMERIC NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir benchmarks iniciais
INSERT INTO public.benchmarks (key, value, description) VALUES
  ('open_rate_whatsapp', 0.45, 'Taxa de abertura média WhatsApp'),
  ('open_rate_email', 0.22, 'Taxa de abertura média Email'),
  ('open_rate_sms', 0.98, 'Taxa de abertura média SMS'),
  ('conversion_rate_vip_upgrade', 0.15, 'Taxa de conversão para upgrade VIP'),
  ('reactivation_rate_win_back', 0.12, 'Taxa de reativação win-back'),
  ('cross_sell_rate', 0.18, 'Taxa de cross-sell'),
  ('churn_rate_high_value', 0.08, 'Taxa de churn clientes alto valor')
ON CONFLICT (key) DO NOTHING;

-- RLS Policies
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage analysis_runs"
  ON public.analysis_runs FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view data_profiles"
  ON public.data_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert data_profiles"
  ON public.data_profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view findings"
  ON public.findings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert findings"
  ON public.findings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage strategies"
  ON public.strategies FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage strategy_validations"
  ON public.strategy_validations FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Everyone can view benchmarks"
  ON public.benchmarks FOR SELECT
  USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analysis_runs_updated_at
  BEFORE UPDATE ON public.analysis_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON public.strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
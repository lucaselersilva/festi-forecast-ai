-- Criar tabela para planos de marketing
CREATE TABLE marketing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_city TEXT NOT NULL,
  event_venue TEXT,
  event_genre TEXT,
  target_audience TEXT,
  budget NUMERIC,
  ticket_price NUMERIC,
  capacity INTEGER,
  description TEXT,
  
  -- Dados do plano gerado
  marketing_plan JSONB NOT NULL,
  general_strategy JSONB,
  cluster_strategies JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft',
  
  -- Relacionamento opcional com eventos existentes
  event_id UUID REFERENCES events(id)
);

-- Índices para busca rápida
CREATE INDEX idx_marketing_plans_event_name ON marketing_plans(event_name);
CREATE INDEX idx_marketing_plans_event_date ON marketing_plans(event_date);
CREATE INDEX idx_marketing_plans_city ON marketing_plans(event_city);
CREATE INDEX idx_marketing_plans_status ON marketing_plans(status);

-- RLS
ALTER TABLE marketing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage marketing_plans"
ON marketing_plans FOR ALL
USING (auth.uid() IS NOT NULL);

-- Trigger de updated_at
CREATE TRIGGER update_marketing_plans_updated_at
BEFORE UPDATE ON marketing_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
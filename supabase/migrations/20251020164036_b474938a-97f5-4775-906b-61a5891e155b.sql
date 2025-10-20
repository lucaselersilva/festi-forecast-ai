-- FASE 1: Ajustar birthday_cluster_actions para usar ano atual por padrão
ALTER TABLE birthday_cluster_actions 
  ALTER COLUMN year SET DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER;

-- Adicionar comentário explicativo
COMMENT ON COLUMN birthday_cluster_actions.year IS 'Ano do aniversário - preenchido automaticamente com o ano atual se não especificado';

-- FASE 2: Criar estrutura de importação flexível

-- Tabela de staging para dados temporários durante importação
CREATE TABLE IF NOT EXISTS import_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  source_name TEXT,
  file_name TEXT,
  total_rows INTEGER,
  raw_data JSONB NOT NULL,
  mapped_data JSONB,
  validation_results JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'importing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de templates de mapeamento reutilizáveis
CREATE TABLE IF NOT EXISTS import_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_name TEXT NOT NULL,
  description TEXT,
  column_mappings JSONB NOT NULL,
  field_transformations JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_staging_session ON import_staging(session_id);
CREATE INDEX IF NOT EXISTS idx_staging_status ON import_staging(status);
CREATE INDEX IF NOT EXISTS idx_templates_source ON import_templates(source_name);
CREATE INDEX IF NOT EXISTS idx_templates_default ON import_templates(is_default) WHERE is_default = true;

-- RLS Policies
ALTER TABLE import_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage their imports"
  ON import_staging FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all templates"
  ON import_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create templates"
  ON import_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their templates"
  ON import_templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Inserir templates pré-configurados
INSERT INTO import_templates (name, source_name, description, column_mappings, field_transformations, is_default)
VALUES (
  'Valle Padrão',
  'valle',
  'Template para planilhas do Valle no formato padrão atual',
  '{
    "Nome": "nome",
    "CPF": "cpf",
    "E-mail": "email",
    "Gênero": "genero",
    "Telefone": "telefone",
    "Aniversário": "aniversario",
    "Aplicativo ativo": "aplicativo_ativo",
    "Presenças": "presencas",
    "Primeira entrada no local": "primeira_entrada",
    "Última visita": "ultima_visita",
    "Consumo": "consumo",
    "ID do evento": "id_evento",
    "Primeira interação": "primeira_interacao",
    "É a primeira utilização?": "primeira_utilizacao"
  }'::jsonb,
  '{
    "cpf": "remove_non_digits",
    "telefone": "remove_non_digits",
    "aniversario": "parse_date",
    "primeira_entrada": "parse_datetime",
    "ultima_visita": "parse_datetime",
    "primeira_interacao": "parse_datetime",
    "consumo": "parse_currency",
    "aplicativo_ativo": "parse_boolean",
    "primeira_utilizacao": "parse_boolean"
  }'::jsonb,
  true
) ON CONFLICT (name) DO NOTHING;

INSERT INTO import_templates (name, source_name, description, column_mappings, field_transformations, is_default)
VALUES (
  'Mínimo Essencial',
  'generic_minimal',
  'Template mínimo com apenas campos obrigatórios: Nome e pelo menos um contato (email ou telefone)',
  '{
    "Nome": "nome",
    "Email": "email",
    "Telefone": "telefone",
    "Aniversário": "aniversario"
  }'::jsonb,
  '{
    "telefone": "remove_non_digits",
    "aniversario": "parse_date"
  }'::jsonb,
  false
) ON CONFLICT (name) DO NOTHING;

INSERT INTO import_templates (name, source_name, description, column_mappings, field_transformations, is_default)
VALUES (
  'Completo com RFM',
  'complete_rfm',
  'Template completo incluindo dados comportamentais e RFM',
  '{
    "Nome": "nome",
    "CPF": "cpf",
    "Email": "email",
    "Telefone": "telefone",
    "Aniversário": "aniversario",
    "Idade": "idade",
    "Gênero": "genero",
    "Consumo Total": "consumo",
    "Número de Visitas": "presencas",
    "Primeira Visita": "primeira_entrada",
    "Última Visita": "ultima_visita"
  }'::jsonb,
  '{
    "cpf": "remove_non_digits",
    "telefone": "remove_non_digits",
    "aniversario": "parse_date",
    "primeira_entrada": "parse_datetime",
    "ultima_visita": "parse_datetime",
    "consumo": "parse_currency"
  }'::jsonb,
  false
) ON CONFLICT (name) DO NOTHING;

-- Adicionar comentários explicativos
COMMENT ON TABLE import_staging IS 'Armazena dados temporários durante o processo de importação antes de serem normalizados e movidos para valle_clientes';
COMMENT ON TABLE import_templates IS 'Templates reutilizáveis de mapeamento de colunas para facilitar importações recorrentes';
COMMENT ON COLUMN import_templates.column_mappings IS 'Mapeamento de colunas da planilha para campos do banco: {"Nome Coluna Excel": "campo_db"}';
COMMENT ON COLUMN import_templates.field_transformations IS 'Transformações a aplicar em cada campo: {"campo": "tipo_transformacao"}';
-- Adicionar coluna dias_semana_visitas em valle_clientes
ALTER TABLE valle_clientes 
ADD COLUMN dias_semana_visitas jsonb DEFAULT '{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}'::jsonb;

-- Adicionar coluna dias_semana_visitas em customers
ALTER TABLE customers 
ADD COLUMN dias_semana_visitas jsonb DEFAULT '{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}'::jsonb;

-- Criar índice para queries eficientes
CREATE INDEX idx_valle_clientes_dias_semana ON valle_clientes USING gin(dias_semana_visitas);
CREATE INDEX idx_customers_dias_semana ON customers USING gin(dias_semana_visitas);

-- Popular dados históricos baseado em ultima_visita
UPDATE valle_clientes
SET dias_semana_visitas = jsonb_build_object(
  EXTRACT(DOW FROM ultima_visita)::text, 
  COALESCE(presencas, 1)
)
WHERE ultima_visita IS NOT NULL;

-- Mesmo para customers
UPDATE customers
SET dias_semana_visitas = jsonb_build_object(
  EXTRACT(DOW FROM ultima_visita)::text, 
  COALESCE(presencas, 1)
)
WHERE ultima_visita IS NOT NULL;

-- Criar view para dias preferidos
CREATE OR REPLACE VIEW vw_customer_preferred_days AS
SELECT 
  c.id as customer_id,
  c.nome,
  c.tenant_id,
  c.dias_semana_visitas,
  (SELECT key FROM jsonb_each_text(c.dias_semana_visitas) ORDER BY value::int DESC LIMIT 1) as dia_preferido,
  (SELECT SUM(value::int) FROM jsonb_each_text(c.dias_semana_visitas)) as total_visitas_tracked,
  CASE (SELECT key FROM jsonb_each_text(c.dias_semana_visitas) ORDER BY value::int DESC LIMIT 1)
    WHEN '0' THEN 'Domingo'
    WHEN '1' THEN 'Segunda'
    WHEN '2' THEN 'Terça'
    WHEN '3' THEN 'Quarta'
    WHEN '4' THEN 'Quinta'
    WHEN '5' THEN 'Sexta'
    WHEN '6' THEN 'Sábado'
  END as dia_preferido_nome
FROM valle_clientes c
WHERE c.dias_semana_visitas IS NOT NULL;

-- Mesma view para customers
CREATE OR REPLACE VIEW vw_customers_preferred_days AS
SELECT 
  c.id as customer_id,
  c.name as nome,
  c.tenant_id,
  c.dias_semana_visitas,
  (SELECT key FROM jsonb_each_text(c.dias_semana_visitas) ORDER BY value::int DESC LIMIT 1) as dia_preferido,
  (SELECT SUM(value::int) FROM jsonb_each_text(c.dias_semana_visitas)) as total_visitas_tracked,
  CASE (SELECT key FROM jsonb_each_text(c.dias_semana_visitas) ORDER BY value::int DESC LIMIT 1)
    WHEN '0' THEN 'Domingo'
    WHEN '1' THEN 'Segunda'
    WHEN '2' THEN 'Terça'
    WHEN '3' THEN 'Quarta'
    WHEN '4' THEN 'Quinta'
    WHEN '5' THEN 'Sexta'
    WHEN '6' THEN 'Sábado'
  END as dia_preferido_nome
FROM customers c
WHERE c.dias_semana_visitas IS NOT NULL;
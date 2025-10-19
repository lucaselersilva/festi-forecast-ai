-- Drop and recreate vw_all_customers_birthdays using UNION ALL instead of FULL JOIN
DROP VIEW IF EXISTS vw_all_customers_birthdays;

CREATE VIEW vw_all_customers_birthdays AS
-- Clientes da tabela customers
SELECT 
  c.id::text as customer_id,
  c.name as nome,
  c.email,
  c.phone as telefone,
  c.birthdate as aniversario,
  EXTRACT(YEAR FROM AGE(c.birthdate))::INTEGER as idade,
  0::NUMERIC as consumo,
  0::INTEGER as presencas,
  999::NUMERIC as recency_days,
  NULL::TIMESTAMPTZ as ultima_visita,
  NULL::TIMESTAMPTZ as primeira_entrada,
  NULL::TEXT as cluster_comportamental,
  NULL::TEXT as cluster_valor,
  NULL::TEXT as faixa_etaria,
  0::NUMERIC as propensity_score,
  c.gender as genero,
  false::BOOLEAN as aplicativo_ativo,
  NULL::TEXT as cluster_jornada,
  0::INTEGER as frequency,
  0::NUMERIC as monetary,
  'customers' as source_table
FROM customers c
WHERE c.birthdate IS NOT NULL

UNION ALL

-- Clientes da view vw_valle_rfm
SELECT 
  vr.id::text as customer_id,
  vr.nome,
  vr.email,
  vr.telefone,
  vr.aniversario,
  vr.idade,
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
  'valle_clientes' as source_table
FROM vw_valle_rfm vr
WHERE vr.aniversario IS NOT NULL;
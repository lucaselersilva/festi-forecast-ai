-- Create unified view for all customers with birthday data
CREATE OR REPLACE VIEW public.vw_all_customers_birthdays AS
SELECT 
  id::text as customer_id,
  nome,
  email,
  telefone,
  aniversario,
  idade,
  consumo,
  presencas,
  recency_days,
  ultima_visita,
  primeira_entrada,
  cluster_comportamental,
  cluster_valor,
  faixa_etaria,
  propensity_score,
  genero,
  aplicativo_ativo,
  cluster_jornada,
  frequency,
  monetary,
  'valle_clientes' as source_table,
  tenant_id
FROM public.vw_valle_rfm
WHERE aniversario IS NOT NULL;
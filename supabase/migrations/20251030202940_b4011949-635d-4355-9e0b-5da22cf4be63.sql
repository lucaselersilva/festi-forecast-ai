-- Final migration of ALL data from valle_clientes to customers
INSERT INTO public.customers (
  valle_id, name, email, phone, gender, birthdate, city, tenant_id,
  cpf, presencas, consumo, primeira_entrada, ultima_visita,
  aplicativo_ativo, id_evento, primeira_interacao, primeira_utilizacao
)
SELECT 
  v.id,
  v.nome,
  v.email,
  v.telefone,
  v.genero,
  v.aniversario,
  NULL as city,
  v.tenant_id,
  v.cpf,
  COALESCE(v.presencas, 0),
  COALESCE(v.consumo, 0),
  v.primeira_entrada,
  v.ultima_visita,
  COALESCE(v.aplicativo_ativo, false),
  v.id_evento,
  v.primeira_interacao,
  COALESCE(v.primeira_utilizacao, false)
FROM public.valle_clientes v
WHERE NOT EXISTS (
  SELECT 1 FROM public.customers c 
  WHERE c.valle_id = v.id
);
-- Remove constraint antiga de CPF único
ALTER TABLE public.valle_clientes 
DROP CONSTRAINT IF EXISTS valle_clientes_cpf_unique;

-- Adiciona nova constraint: CPF único por tenant
ALTER TABLE public.valle_clientes 
ADD CONSTRAINT valle_clientes_cpf_tenant_unique 
UNIQUE (cpf, tenant_id);

-- Também atualizar a tabela customers para consistência
ALTER TABLE public.customers 
DROP CONSTRAINT IF EXISTS customers_cpf_key;

ALTER TABLE public.customers 
ADD CONSTRAINT customers_cpf_tenant_unique 
UNIQUE (cpf, tenant_id);

-- Criar índice para melhor performance nas buscas por CPF
CREATE INDEX IF NOT EXISTS idx_valle_clientes_cpf_tenant 
ON public.valle_clientes(cpf, tenant_id) 
WHERE cpf IS NOT NULL;
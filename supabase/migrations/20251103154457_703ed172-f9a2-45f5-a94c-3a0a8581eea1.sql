-- Primeiro: remover duplicados mantendo apenas o registro mais recente
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY telefone, tenant_id 
      ORDER BY created_at DESC, id DESC
    ) as rn
  FROM valle_clientes
  WHERE telefone IS NOT NULL
)
DELETE FROM valle_clientes
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Agora criar constraint único
ALTER TABLE valle_clientes 
ADD CONSTRAINT valle_clientes_telefone_tenant_key 
UNIQUE (telefone, tenant_id);

-- Também limpar duplicados de customers por email
WITH duplicates_customers AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY email, tenant_id 
      ORDER BY id DESC
    ) as rn
  FROM customers
  WHERE email IS NOT NULL
)
DELETE FROM customers
WHERE id IN (
  SELECT id FROM duplicates_customers WHERE rn > 1
);

-- Criar constraint único para customers
ALTER TABLE customers 
ADD CONSTRAINT customers_email_tenant_key 
UNIQUE (email, tenant_id);
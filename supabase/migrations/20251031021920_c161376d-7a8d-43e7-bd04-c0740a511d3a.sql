-- Remover TODOS os duplicados de uma vez mantendo apenas o mais recente
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, LOWER(TRIM(nome)), TRIM(telefone)
      ORDER BY created_at DESC, id DESC
    ) as row_num
  FROM valle_clientes
  WHERE telefone IS NOT NULL AND telefone != ''
)
DELETE FROM valle_clientes
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Também limpar duplicados por email+nome (quando não há telefone)
WITH email_duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, LOWER(TRIM(nome)), LOWER(TRIM(email))
      ORDER BY created_at DESC, id DESC
    ) as row_num
  FROM valle_clientes
  WHERE (telefone IS NULL OR telefone = '')
    AND email IS NOT NULL 
    AND email != ''
)
DELETE FROM valle_clientes
WHERE id IN (
  SELECT id FROM email_duplicates WHERE row_num > 1
);
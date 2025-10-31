-- Remover índices temporariamente para permitir limpeza
DROP INDEX IF EXISTS valle_clientes_telefone_nome_unique;
DROP INDEX IF EXISTS valle_clientes_email_nome_unique;

-- Fazer limpeza completa dos duplicados
DELETE FROM valle_clientes a
WHERE telefone IS NOT NULL AND telefone != ''
  AND EXISTS (
    SELECT 1 FROM valle_clientes b
    WHERE b.tenant_id = a.tenant_id
      AND LOWER(TRIM(b.nome)) = LOWER(TRIM(a.nome))
      AND TRIM(b.telefone) = TRIM(a.telefone)
      AND b.created_at > a.created_at
  );

-- Limpar duplicados por email também
DELETE FROM valle_clientes a
WHERE (telefone IS NULL OR telefone = '')
  AND email IS NOT NULL AND email != ''
  AND EXISTS (
    SELECT 1 FROM valle_clientes b
    WHERE b.tenant_id = a.tenant_id
      AND LOWER(TRIM(b.nome)) = LOWER(TRIM(a.nome))
      AND LOWER(TRIM(b.email)) = LOWER(TRIM(a.email))
      AND b.created_at > a.created_at
  );

-- Recriar índices únicos
CREATE UNIQUE INDEX valle_clientes_telefone_nome_unique 
ON valle_clientes (tenant_id, LOWER(TRIM(nome)), TRIM(telefone))
WHERE telefone IS NOT NULL AND telefone != '';

CREATE UNIQUE INDEX valle_clientes_email_nome_unique 
ON valle_clientes (tenant_id, LOWER(TRIM(nome)), LOWER(TRIM(email)))
WHERE (telefone IS NULL OR telefone = '') 
  AND email IS NOT NULL 
  AND email != '';
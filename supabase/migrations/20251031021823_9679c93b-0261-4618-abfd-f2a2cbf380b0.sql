-- Passo 1: Remover duplicados mantendo o registro mais recente
-- Criar tabela temporária com os IDs a manter
CREATE TEMP TABLE ids_to_keep AS
SELECT DISTINCT ON (tenant_id, LOWER(TRIM(nome)), TRIM(telefone))
  id
FROM valle_clientes
WHERE telefone IS NOT NULL AND telefone != ''
ORDER BY tenant_id, LOWER(TRIM(nome)), TRIM(telefone), created_at DESC;

-- Deletar registros duplicados
DELETE FROM valle_clientes
WHERE telefone IS NOT NULL 
  AND telefone != ''
  AND id NOT IN (SELECT id FROM ids_to_keep);

-- Passo 2: Criar índice único para prevenir duplicações futuras
-- Normalizar telefone e nome (lowercase, trim)
CREATE UNIQUE INDEX IF NOT EXISTS valle_clientes_telefone_nome_unique 
ON valle_clientes (tenant_id, LOWER(TRIM(nome)), TRIM(telefone))
WHERE telefone IS NOT NULL AND telefone != '';

-- Passo 3: Para clientes sem telefone, usar email como alternativa
CREATE UNIQUE INDEX IF NOT EXISTS valle_clientes_email_nome_unique 
ON valle_clientes (tenant_id, LOWER(TRIM(nome)), LOWER(TRIM(email)))
WHERE (telefone IS NULL OR telefone = '') 
  AND email IS NOT NULL 
  AND email != '';
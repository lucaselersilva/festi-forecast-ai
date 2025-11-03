-- Fix unique constraint on birthday_cluster_actions to include tenant_id
-- This allows proper upsert with tenant isolation

-- Drop the old constraint that doesn't include tenant_id
ALTER TABLE public.birthday_cluster_actions 
DROP CONSTRAINT IF EXISTS birthday_cluster_actions_month_year_cluster_name_key;

-- Add new constraint including tenant_id for proper tenant isolation
ALTER TABLE public.birthday_cluster_actions 
ADD CONSTRAINT birthday_cluster_actions_month_year_cluster_tenant_key 
UNIQUE (month, year, cluster_name, tenant_id);
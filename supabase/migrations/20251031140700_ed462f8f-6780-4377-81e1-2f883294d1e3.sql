-- Atualizar RLS policies para permitir super admins verem dados de todas as tenants

-- Valle Clientes
DROP POLICY IF EXISTS "Users can view valle_clientes from their tenant" ON public.valle_clientes;
CREATE POLICY "Users can view valle_clientes from their tenant"
  ON public.valle_clientes
  FOR SELECT
  USING (tenant_id = get_user_tenant_id() OR is_super_admin(auth.uid()));

-- Customers
DROP POLICY IF EXISTS "Users can view customers from their tenant" ON public.customers;
CREATE POLICY "Users can view customers from their tenant"
  ON public.customers
  FOR SELECT
  USING (tenant_id = get_user_tenant_id() OR is_super_admin(auth.uid()));

-- Events
DROP POLICY IF EXISTS "Users can view events from their tenant" ON public.events;
CREATE POLICY "Users can view events from their tenant"
  ON public.events
  FOR SELECT
  USING (tenant_id = get_user_tenant_id() OR is_super_admin(auth.uid()));

-- Consumptions
DROP POLICY IF EXISTS "Users can view consumptions from their tenant" ON public.consumptions;
CREATE POLICY "Users can view consumptions from their tenant"
  ON public.consumptions
  FOR SELECT
  USING (tenant_id = get_user_tenant_id() OR is_super_admin(auth.uid()));

-- Marketing Plans
DROP POLICY IF EXISTS "Users can view marketing_plans from their tenant" ON public.marketing_plans;
CREATE POLICY "Users can view marketing_plans from their tenant"
  ON public.marketing_plans
  FOR SELECT
  USING (tenant_id = get_user_tenant_id() OR is_super_admin(auth.uid()));

-- Birthday Cluster Actions
DROP POLICY IF EXISTS "Users can view birthday_cluster_actions from their tenant" ON public.birthday_cluster_actions;
CREATE POLICY "Users can view birthday_cluster_actions from their tenant"
  ON public.birthday_cluster_actions
  FOR SELECT
  USING (tenant_id = get_user_tenant_id() OR is_super_admin(auth.uid()));

-- Import Staging
DROP POLICY IF EXISTS "Users can view import_staging from their tenant" ON public.import_staging;
CREATE POLICY "Users can view import_staging from their tenant"
  ON public.import_staging
  FOR SELECT
  USING (tenant_id = get_user_tenant_id() OR is_super_admin(auth.uid()));

-- Analysis Runs
DROP POLICY IF EXISTS "Users can view analysis_runs from their tenant" ON public.analysis_runs;
CREATE POLICY "Users can view analysis_runs from their tenant"
  ON public.analysis_runs
  FOR SELECT
  USING (tenant_id = get_user_tenant_id() OR is_super_admin(auth.uid()));
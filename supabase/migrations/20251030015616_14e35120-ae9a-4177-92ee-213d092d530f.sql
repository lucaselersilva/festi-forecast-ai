-- =====================================================
-- FASE 1: ASSOCIAR DADOS LEGADOS AO TENANT DO eler.lucas@gmail.com
-- =====================================================

-- Atualizar valle_clientes
UPDATE valle_clientes 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar events
UPDATE events 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar customers
UPDATE customers 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar consumptions
UPDATE consumptions 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar marketing_plans
UPDATE marketing_plans 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar scoring_snapshots
UPDATE scoring_snapshots 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar analysis_runs
UPDATE analysis_runs 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar data_profiles
UPDATE data_profiles 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar findings
UPDATE findings 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar strategies
UPDATE strategies 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar strategy_validations
UPDATE strategy_validations 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar import_staging
UPDATE import_staging 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar import_templates
UPDATE import_templates 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar birthday_cluster_actions
UPDATE birthday_cluster_actions 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar valle_reactivation_strategies
UPDATE valle_reactivation_strategies 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- Atualizar interactions
UPDATE interactions 
SET tenant_id = '338b73a1-7dd3-4bd9-b978-b48c91a85ebe'
WHERE tenant_id IS NULL;

-- =====================================================
-- FASE 2: REMOVER POLÍTICAS RLS ANTIGAS E PERMISSIVAS
-- =====================================================

-- valle_clientes
DROP POLICY IF EXISTS "Authenticated users can manage valle_clientes" ON valle_clientes;

-- events
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Events can be inserted by authenticated users" ON events;
DROP POLICY IF EXISTS "Events can be updated by authenticated users" ON events;

-- customers
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;

-- consumptions
DROP POLICY IF EXISTS "Authenticated users can manage consumptions" ON consumptions;
DROP POLICY IF EXISTS "Authenticated users can view consumptions" ON consumptions;

-- interactions
DROP POLICY IF EXISTS "Authenticated users can manage interactions" ON interactions;
DROP POLICY IF EXISTS "Authenticated users can view interactions" ON interactions;

-- marketing_plans
DROP POLICY IF EXISTS "Anyone can view marketing_plans" ON marketing_plans;
DROP POLICY IF EXISTS "Anyone can create marketing_plans" ON marketing_plans;
DROP POLICY IF EXISTS "Users can update their own marketing_plans" ON marketing_plans;
DROP POLICY IF EXISTS "Users can delete their own marketing_plans" ON marketing_plans;

-- scoring_snapshots
DROP POLICY IF EXISTS "Authenticated users can manage scoring_snapshots" ON scoring_snapshots;
DROP POLICY IF EXISTS "Authenticated users can view scoring_snapshots" ON scoring_snapshots;

-- analysis_runs
DROP POLICY IF EXISTS "Authenticated users can manage analysis_runs" ON analysis_runs;

-- data_profiles
DROP POLICY IF EXISTS "Authenticated users can insert data_profiles" ON data_profiles;
DROP POLICY IF EXISTS "Authenticated users can view data_profiles" ON data_profiles;

-- findings
DROP POLICY IF EXISTS "Authenticated users can insert findings" ON findings;
DROP POLICY IF EXISTS "Authenticated users can view findings" ON findings;

-- strategies
DROP POLICY IF EXISTS "Authenticated users can manage strategies" ON strategies;

-- strategy_validations
DROP POLICY IF EXISTS "Authenticated users can manage strategy_validations" ON strategy_validations;

-- import_staging
DROP POLICY IF EXISTS "Authenticated users can manage their imports" ON import_staging;

-- import_templates
DROP POLICY IF EXISTS "Authenticated users can create templates" ON import_templates;
DROP POLICY IF EXISTS "Authenticated users can update their templates" ON import_templates;
DROP POLICY IF EXISTS "Authenticated users can view all templates" ON import_templates;

-- birthday_cluster_actions
DROP POLICY IF EXISTS "Anyone can view birthday cluster actions" ON birthday_cluster_actions;
DROP POLICY IF EXISTS "Authenticated users can manage birthday cluster actions" ON birthday_cluster_actions;

-- valle_reactivation_strategies
DROP POLICY IF EXISTS "Anyone can view strategies" ON valle_reactivation_strategies;
DROP POLICY IF EXISTS "Authenticated users can manage strategies" ON valle_reactivation_strategies;

-- =====================================================
-- FASE 3: CORRIGIR POLÍTICAS SELECT (REMOVER OR tenant_id IS NULL)
-- =====================================================

-- valle_clientes
DROP POLICY IF EXISTS "Users can view valle_clientes from their tenant" ON valle_clientes;
CREATE POLICY "Users can view valle_clientes from their tenant"
  ON valle_clientes FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- events
DROP POLICY IF EXISTS "Users can view events from their tenant" ON events;
CREATE POLICY "Users can view events from their tenant"
  ON events FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- customers
DROP POLICY IF EXISTS "Users can view customers from their tenant" ON customers;
CREATE POLICY "Users can view customers from their tenant"
  ON customers FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- consumptions
DROP POLICY IF EXISTS "Users can view consumptions from their tenant" ON consumptions;
CREATE POLICY "Users can view consumptions from their tenant"
  ON consumptions FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- interactions
DROP POLICY IF EXISTS "Users can view interactions from their tenant" ON interactions;
CREATE POLICY "Users can view interactions from their tenant"
  ON interactions FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- marketing_plans
DROP POLICY IF EXISTS "Users can view marketing_plans from their tenant" ON marketing_plans;
CREATE POLICY "Users can view marketing_plans from their tenant"
  ON marketing_plans FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- scoring_snapshots
DROP POLICY IF EXISTS "Users can view scoring_snapshots from their tenant" ON scoring_snapshots;
CREATE POLICY "Users can view scoring_snapshots from their tenant"
  ON scoring_snapshots FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- analysis_runs
DROP POLICY IF EXISTS "Users can view analysis_runs from their tenant" ON analysis_runs;
CREATE POLICY "Users can view analysis_runs from their tenant"
  ON analysis_runs FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- data_profiles
DROP POLICY IF EXISTS "Users can view data_profiles from their tenant" ON data_profiles;
CREATE POLICY "Users can view data_profiles from their tenant"
  ON data_profiles FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- findings
DROP POLICY IF EXISTS "Users can view findings from their tenant" ON findings;
CREATE POLICY "Users can view findings from their tenant"
  ON findings FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- strategies
DROP POLICY IF EXISTS "Users can view strategies from their tenant" ON strategies;
CREATE POLICY "Users can view strategies from their tenant"
  ON strategies FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- strategy_validations
DROP POLICY IF EXISTS "Users can view strategy_validations from their tenant" ON strategy_validations;
CREATE POLICY "Users can view strategy_validations from their tenant"
  ON strategy_validations FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- import_staging
DROP POLICY IF EXISTS "Users can view import_staging from their tenant" ON import_staging;
CREATE POLICY "Users can view import_staging from their tenant"
  ON import_staging FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- import_templates
DROP POLICY IF EXISTS "Users can view import_templates from their tenant" ON import_templates;
CREATE POLICY "Users can view import_templates from their tenant"
  ON import_templates FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- birthday_cluster_actions
DROP POLICY IF EXISTS "Users can view birthday_cluster_actions from their tenant" ON birthday_cluster_actions;
CREATE POLICY "Users can view birthday_cluster_actions from their tenant"
  ON birthday_cluster_actions FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- valle_reactivation_strategies
DROP POLICY IF EXISTS "Users can view valle_reactivation_strategies from their tenant" ON valle_reactivation_strategies;
CREATE POLICY "Users can view valle_reactivation_strategies from their tenant"
  ON valle_reactivation_strategies FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- =====================================================
-- FASE 4: TORNAR tenant_id NOT NULL
-- =====================================================

-- valle_clientes
ALTER TABLE valle_clientes ALTER COLUMN tenant_id SET NOT NULL;

-- events
ALTER TABLE events ALTER COLUMN tenant_id SET NOT NULL;

-- customers
ALTER TABLE customers ALTER COLUMN tenant_id SET NOT NULL;

-- consumptions
ALTER TABLE consumptions ALTER COLUMN tenant_id SET NOT NULL;

-- marketing_plans
ALTER TABLE marketing_plans ALTER COLUMN tenant_id SET NOT NULL;

-- scoring_snapshots
ALTER TABLE scoring_snapshots ALTER COLUMN tenant_id SET NOT NULL;

-- analysis_runs
ALTER TABLE analysis_runs ALTER COLUMN tenant_id SET NOT NULL;

-- data_profiles
ALTER TABLE data_profiles ALTER COLUMN tenant_id SET NOT NULL;

-- findings
ALTER TABLE findings ALTER COLUMN tenant_id SET NOT NULL;

-- strategies
ALTER TABLE strategies ALTER COLUMN tenant_id SET NOT NULL;

-- strategy_validations
ALTER TABLE strategy_validations ALTER COLUMN tenant_id SET NOT NULL;

-- import_staging
ALTER TABLE import_staging ALTER COLUMN tenant_id SET NOT NULL;

-- import_templates
ALTER TABLE import_templates ALTER COLUMN tenant_id SET NOT NULL;

-- birthday_cluster_actions
ALTER TABLE birthday_cluster_actions ALTER COLUMN tenant_id SET NOT NULL;

-- valle_reactivation_strategies
ALTER TABLE valle_reactivation_strategies ALTER COLUMN tenant_id SET NOT NULL;

-- interactions
ALTER TABLE interactions ALTER COLUMN tenant_id SET NOT NULL;
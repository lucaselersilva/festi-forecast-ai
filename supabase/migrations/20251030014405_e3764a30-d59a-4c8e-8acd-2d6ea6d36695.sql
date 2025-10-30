-- ============================================
-- MULTI-TENANCY IMPLEMENTATION
-- ============================================

-- 1. Criar tabela de Tenants (Organizações)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true
);

-- 2. Criar tabela de Profiles (vinculada a auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Criar enum de Roles
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- 4. Criar tabela de User Roles (separada para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tenant_id, role)
);

-- 5. Função helper para verificar roles (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role_in_tenant(
  _user_id UUID, 
  _tenant_id UUID, 
  _role app_role
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role = _role
  );
$$;

-- 6. Função para obter tenant_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- 7. Trigger para criar profile automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  IF NEW.raw_user_meta_data->>'tenant_id' IS NULL THEN
    INSERT INTO public.tenants (name, slug)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
      'tenant-' || substring(NEW.id::text, 1, 8)
    )
    RETURNING id INTO new_tenant_id;
    
    INSERT INTO public.profiles (id, tenant_id, full_name)
    VALUES (
      NEW.id,
      new_tenant_id,
      NEW.raw_user_meta_data->>'full_name'
    );
    
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (NEW.id, new_tenant_id, 'owner');
  ELSE
    INSERT INTO public.profiles (id, tenant_id, full_name)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'tenant_id')::UUID,
      NEW.raw_user_meta_data->>'full_name'
    );
    
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'tenant_id')::UUID, 'member');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Habilitar RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS para profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 10. Políticas RLS para tenants
CREATE POLICY "Users can view their tenant"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (id = public.get_user_tenant_id());

CREATE POLICY "Owners can update their tenant"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (public.has_role_in_tenant(auth.uid(), id, 'owner'))
  WITH CHECK (public.has_role_in_tenant(auth.uid(), id, 'owner'));

-- 11. Políticas RLS para user_roles
CREATE POLICY "Users can view roles in their tenant"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Owners can manage roles in their tenant"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role_in_tenant(auth.uid(), tenant_id, 'owner'))
  WITH CHECK (public.has_role_in_tenant(auth.uid(), tenant_id, 'owner'));

-- ============================================
-- ADICIONAR tenant_id A TODAS AS TABELAS
-- ============================================

-- Events
ALTER TABLE public.events ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_events_tenant_id ON public.events(tenant_id);

-- Customers
ALTER TABLE public.customers ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_customers_tenant_id ON public.customers(tenant_id);

-- Valle Clientes
ALTER TABLE public.valle_clientes ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_valle_clientes_tenant_id ON public.valle_clientes(tenant_id);

-- Consumptions
ALTER TABLE public.consumptions ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_consumptions_tenant_id ON public.consumptions(tenant_id);

-- Interactions
ALTER TABLE public.interactions ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_interactions_tenant_id ON public.interactions(tenant_id);

-- Marketing Plans
ALTER TABLE public.marketing_plans ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_marketing_plans_tenant_id ON public.marketing_plans(tenant_id);

-- Scoring Snapshots
ALTER TABLE public.scoring_snapshots ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_scoring_snapshots_tenant_id ON public.scoring_snapshots(tenant_id);

-- Analysis Runs
ALTER TABLE public.analysis_runs ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_analysis_runs_tenant_id ON public.analysis_runs(tenant_id);

-- Data Profiles
ALTER TABLE public.data_profiles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_data_profiles_tenant_id ON public.data_profiles(tenant_id);

-- Findings
ALTER TABLE public.findings ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_findings_tenant_id ON public.findings(tenant_id);

-- Strategies
ALTER TABLE public.strategies ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_strategies_tenant_id ON public.strategies(tenant_id);

-- Strategy Validations
ALTER TABLE public.strategy_validations ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_strategy_validations_tenant_id ON public.strategy_validations(tenant_id);

-- Import Staging
ALTER TABLE public.import_staging ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_import_staging_tenant_id ON public.import_staging(tenant_id);

-- Import Templates
ALTER TABLE public.import_templates ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_import_templates_tenant_id ON public.import_templates(tenant_id);

-- Birthday Cluster Actions
ALTER TABLE public.birthday_cluster_actions ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_birthday_cluster_actions_tenant_id ON public.birthday_cluster_actions(tenant_id);

-- Valle Reactivation Strategies
ALTER TABLE public.valle_reactivation_strategies ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_valle_reactivation_strategies_tenant_id ON public.valle_reactivation_strategies(tenant_id);

-- ============================================
-- POLÍTICAS RLS PARA ISOLAMENTO DE DADOS
-- ============================================

-- Events
CREATE POLICY "Users can view events from their tenant"
  ON public.events FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "Users can insert events in their tenant"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update events in their tenant"
  ON public.events FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete events in their tenant"
  ON public.events FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- Customers
CREATE POLICY "Users can view customers from their tenant"
  ON public.customers FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "Users can insert customers in their tenant"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update customers in their tenant"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete customers in their tenant"
  ON public.customers FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- Valle Clientes
CREATE POLICY "Users can view valle_clientes from their tenant"
  ON public.valle_clientes FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "Users can insert valle_clientes in their tenant"
  ON public.valle_clientes FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update valle_clientes in their tenant"
  ON public.valle_clientes FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete valle_clientes in their tenant"
  ON public.valle_clientes FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- Consumptions
CREATE POLICY "Users can view consumptions from their tenant"
  ON public.consumptions FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "Users can insert consumptions in their tenant"
  ON public.consumptions FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update consumptions in their tenant"
  ON public.consumptions FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete consumptions in their tenant"
  ON public.consumptions FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- Marketing Plans  
CREATE POLICY "Users can view marketing_plans from their tenant"
  ON public.marketing_plans FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "Users can insert marketing_plans in their tenant"
  ON public.marketing_plans FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update marketing_plans in their tenant"
  ON public.marketing_plans FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete marketing_plans in their tenant"
  ON public.marketing_plans FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- Analysis Runs
CREATE POLICY "Users can view analysis_runs from their tenant"
  ON public.analysis_runs FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "Users can insert analysis_runs in their tenant"
  ON public.analysis_runs FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update analysis_runs in their tenant"
  ON public.analysis_runs FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete analysis_runs in their tenant"
  ON public.analysis_runs FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- Import Staging
CREATE POLICY "Users can view import_staging from their tenant"
  ON public.import_staging FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "Users can insert import_staging in their tenant"
  ON public.import_staging FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update import_staging in their tenant"
  ON public.import_staging FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete import_staging in their tenant"
  ON public.import_staging FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- Birthday Cluster Actions
CREATE POLICY "Users can view birthday_cluster_actions from their tenant"
  ON public.birthday_cluster_actions FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "Users can insert birthday_cluster_actions in their tenant"
  ON public.birthday_cluster_actions FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update birthday_cluster_actions in their tenant"
  ON public.birthday_cluster_actions FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete birthday_cluster_actions in their tenant"
  ON public.birthday_cluster_actions FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
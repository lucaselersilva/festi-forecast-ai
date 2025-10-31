-- Adicionar role 'admin' ao enum se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'admin') THEN
    ALTER TYPE app_role ADD VALUE 'admin';
  END IF;
END $$;

-- Criar tabela de features habilitadas por tenant
CREATE TABLE IF NOT EXISTS public.tenant_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, feature_key)
);

-- Enable RLS
ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies para tenant_features
CREATE POLICY "Users can view features for their tenant"
  ON public.tenant_features
  FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Apenas admins podem gerenciar features
CREATE POLICY "Admins can manage all tenant features"
  ON public.tenant_features
  FOR ALL
  USING (has_role_in_tenant(auth.uid(), (SELECT tenant_id FROM profiles WHERE id = auth.uid()), 'admin'))
  WITH CHECK (has_role_in_tenant(auth.uid(), (SELECT tenant_id FROM profiles WHERE id = auth.uid()), 'admin'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tenant_features_updated_at
  BEFORE UPDATE ON public.tenant_features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Atribuir role admin ao usuário Lucas Eler
INSERT INTO public.user_roles (user_id, tenant_id, role)
VALUES (
  '6c983ec0-9a82-423e-80a3-48535bd1f19a',
  '338b73a1-7dd3-4bd9-b978-b48c91a85ebe',
  'admin'
) ON CONFLICT (user_id, tenant_id, role) DO NOTHING;

-- Criar features iniciais para todas as tenants existentes
INSERT INTO public.tenant_features (tenant_id, feature_key, enabled)
SELECT t.id, 'dashboard', true FROM public.tenants t
ON CONFLICT (tenant_id, feature_key) DO NOTHING;

INSERT INTO public.tenant_features (tenant_id, feature_key, enabled)
SELECT t.id, 'import', true FROM public.tenants t
ON CONFLICT (tenant_id, feature_key) DO NOTHING;

INSERT INTO public.tenant_features (tenant_id, feature_key, enabled)
SELECT t.id, feature_key, false 
FROM public.tenants t
CROSS JOIN (VALUES 
  ('forecast'),
  ('events'),
  ('segments'),
  ('birthdays'),
  ('clustering'),
  ('insights'),
  ('marketing'),
  ('sponsors'),
  ('orchestrator'),
  ('settings'),
  ('zig-casas')
) AS features(feature_key)
ON CONFLICT (tenant_id, feature_key) DO NOTHING;

-- Trigger para criar features padrão quando um novo tenant é criado
CREATE OR REPLACE FUNCTION public.create_default_tenant_features()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Features habilitadas por padrão
  INSERT INTO public.tenant_features (tenant_id, feature_key, enabled)
  VALUES 
    (NEW.id, 'dashboard', true),
    (NEW.id, 'import', true);
  
  -- Features desabilitadas por padrão
  INSERT INTO public.tenant_features (tenant_id, feature_key, enabled)
  VALUES 
    (NEW.id, 'forecast', false),
    (NEW.id, 'events', false),
    (NEW.id, 'segments', false),
    (NEW.id, 'birthdays', false),
    (NEW.id, 'clustering', false),
    (NEW.id, 'insights', false),
    (NEW.id, 'marketing', false),
    (NEW.id, 'sponsors', false),
    (NEW.id, 'orchestrator', false),
    (NEW.id, 'settings', false),
    (NEW.id, 'zig-casas', false);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_tenant_created
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_tenant_features();
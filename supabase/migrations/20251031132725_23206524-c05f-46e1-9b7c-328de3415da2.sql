-- Dropar policy antiga
DROP POLICY IF EXISTS "Users can view their tenant" ON public.tenants;

-- Criar novas policies para tenants
-- Super admins podem ver todas as tenants
CREATE POLICY "Super admins can view all tenants"
  ON public.tenants
  FOR SELECT
  USING (is_super_admin(auth.uid()));

-- Usuários comuns podem ver apenas sua tenant
CREATE POLICY "Users can view their own tenant"
  ON public.tenants
  FOR SELECT
  USING (id = get_user_tenant_id());
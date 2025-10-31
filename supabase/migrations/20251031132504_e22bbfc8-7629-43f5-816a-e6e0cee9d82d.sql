-- Criar função para verificar se usuário é admin em qualquer tenant
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  );
$$;

-- Dropar policies antigas
DROP POLICY IF EXISTS "Users can view features for their tenant" ON public.tenant_features;
DROP POLICY IF EXISTS "Admins can manage all tenant features" ON public.tenant_features;

-- Criar novas policies
-- Usuários comuns podem ver features da sua tenant
CREATE POLICY "Users can view their tenant features"
  ON public.tenant_features
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id()
    OR is_super_admin(auth.uid())
  );

-- Super admins podem gerenciar features de todas as tenants
CREATE POLICY "Super admins can manage all tenant features"
  ON public.tenant_features
  FOR ALL
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Usuários comuns podem gerenciar apenas features da sua própria tenant se forem owners
CREATE POLICY "Owners can manage their tenant features"
  ON public.tenant_features
  FOR ALL
  USING (
    tenant_id = get_user_tenant_id()
    AND has_role_in_tenant(auth.uid(), tenant_id, 'owner')
  )
  WITH CHECK (
    tenant_id = get_user_tenant_id()
    AND has_role_in_tenant(auth.uid(), tenant_id, 'owner')
  );
-- Fase 1: Preparação do Banco de Dados para Integração WhatsApp

-- 1. Atualizar função para incluir feature flag 'whatsapp'
CREATE OR REPLACE FUNCTION public.create_default_tenant_features()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    (NEW.id, 'zig-casas', false),
    (NEW.id, 'whatsapp', false);
  
  RETURN NEW;
END;
$function$;

-- 2. Criar tabela whatsapp_configs
CREATE TABLE public.whatsapp_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL DEFAULT 'default',
  railway_service_url TEXT,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  qr_code TEXT,
  phone_number TEXT,
  last_connection_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, session_name)
);

-- Habilitar RLS na tabela whatsapp_configs
ALTER TABLE public.whatsapp_configs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_configs
CREATE POLICY "Users can view whatsapp_configs from their tenant"
ON public.whatsapp_configs
FOR SELECT
USING ((tenant_id = get_user_tenant_id()) OR is_super_admin(auth.uid()));

CREATE POLICY "Users can insert whatsapp_configs in their tenant"
ON public.whatsapp_configs
FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update whatsapp_configs in their tenant"
ON public.whatsapp_configs
FOR UPDATE
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete whatsapp_configs in their tenant"
ON public.whatsapp_configs
FOR DELETE
USING (tenant_id = get_user_tenant_id());

-- Trigger para updated_at em whatsapp_configs
CREATE TRIGGER update_whatsapp_configs_updated_at
BEFORE UPDATE ON public.whatsapp_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Criar tabela message_templates
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela message_templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para message_templates
CREATE POLICY "Users can view message_templates from their tenant"
ON public.message_templates
FOR SELECT
USING ((tenant_id = get_user_tenant_id()) OR is_super_admin(auth.uid()));

CREATE POLICY "Users can insert message_templates in their tenant"
ON public.message_templates
FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update message_templates in their tenant"
ON public.message_templates
FOR UPDATE
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete message_templates in their tenant"
ON public.message_templates
FOR DELETE
USING (tenant_id = get_user_tenant_id());

-- Trigger para updated_at em message_templates
CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Criar tabela whatsapp_messages_log
CREATE TABLE public.whatsapp_messages_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES public.customers(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  campaign_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_whatsapp_messages_log_tenant_id ON public.whatsapp_messages_log(tenant_id);
CREATE INDEX idx_whatsapp_messages_log_customer_id ON public.whatsapp_messages_log(customer_id);
CREATE INDEX idx_whatsapp_messages_log_status ON public.whatsapp_messages_log(status);
CREATE INDEX idx_whatsapp_messages_log_created_at ON public.whatsapp_messages_log(created_at DESC);

-- Habilitar RLS na tabela whatsapp_messages_log
ALTER TABLE public.whatsapp_messages_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_messages_log
CREATE POLICY "Users can view whatsapp_messages_log from their tenant"
ON public.whatsapp_messages_log
FOR SELECT
USING ((tenant_id = get_user_tenant_id()) OR is_super_admin(auth.uid()));

CREATE POLICY "Users can insert whatsapp_messages_log in their tenant"
ON public.whatsapp_messages_log
FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update whatsapp_messages_log in their tenant"
ON public.whatsapp_messages_log
FOR UPDATE
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());
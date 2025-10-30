-- Add valle_id column to link with valle_clientes
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS valle_id uuid UNIQUE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_customers_valle_id ON public.customers(valle_id);

-- Update sync function to use valle_id
CREATE OR REPLACE FUNCTION public.sync_valle_clientes_to_customers()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.customers (
      valle_id, name, email, phone, gender, birthdate, city, tenant_id,
      cpf, presencas, consumo, primeira_entrada, ultima_visita,
      aplicativo_ativo, id_evento, primeira_interacao, primeira_utilizacao
    )
    VALUES (
      NEW.id,
      NEW.nome,
      NEW.email,
      NEW.telefone,
      NEW.genero,
      NEW.aniversario,
      NULL,
      NEW.tenant_id,
      NEW.cpf,
      COALESCE(NEW.presencas, 0),
      COALESCE(NEW.consumo, 0),
      NEW.primeira_entrada,
      NEW.ultima_visita,
      COALESCE(NEW.aplicativo_ativo, false),
      NEW.id_evento,
      NEW.primeira_interacao,
      COALESCE(NEW.primeira_utilizacao, false)
    )
    ON CONFLICT (valle_id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      gender = EXCLUDED.gender,
      birthdate = EXCLUDED.birthdate,
      cpf = EXCLUDED.cpf,
      presencas = EXCLUDED.presencas,
      consumo = EXCLUDED.consumo,
      primeira_entrada = EXCLUDED.primeira_entrada,
      ultima_visita = EXCLUDED.ultima_visita,
      aplicativo_ativo = EXCLUDED.aplicativo_ativo,
      id_evento = EXCLUDED.id_evento,
      primeira_interacao = EXCLUDED.primeira_interacao,
      primeira_utilizacao = EXCLUDED.primeira_utilizacao;
    
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.customers
    SET
      name = NEW.nome,
      email = NEW.email,
      phone = NEW.telefone,
      gender = NEW.genero,
      birthdate = NEW.aniversario,
      cpf = NEW.cpf,
      presencas = COALESCE(NEW.presencas, 0),
      consumo = COALESCE(NEW.consumo, 0),
      primeira_entrada = NEW.primeira_entrada,
      ultima_visita = NEW.ultima_visita,
      aplicativo_ativo = COALESCE(NEW.aplicativo_ativo, false),
      id_evento = NEW.id_evento,
      primeira_interacao = NEW.primeira_interacao,
      primeira_utilizacao = COALESCE(NEW.primeira_utilizacao, false)
    WHERE valle_id = NEW.id AND tenant_id = NEW.tenant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Step 1: Add new columns to customers table
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS presencas integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consumo numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS primeira_entrada timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ultima_visita timestamp with time zone,
  ADD COLUMN IF NOT EXISTS aplicativo_ativo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS id_evento text,
  ADD COLUMN IF NOT EXISTS primeira_interacao timestamp with time zone,
  ADD COLUMN IF NOT EXISTS primeira_utilizacao boolean DEFAULT false;
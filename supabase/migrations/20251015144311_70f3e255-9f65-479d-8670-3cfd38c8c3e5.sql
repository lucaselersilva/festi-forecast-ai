-- Add unique constraint to CPF column for upsert functionality
ALTER TABLE public.valle_clientes 
ADD CONSTRAINT valle_clientes_cpf_unique UNIQUE (cpf);
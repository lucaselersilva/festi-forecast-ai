-- Drop the unique constraint on email (emails can be duplicated across customers)
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_email_key;
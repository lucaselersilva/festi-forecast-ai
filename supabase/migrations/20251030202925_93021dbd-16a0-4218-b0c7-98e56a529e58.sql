-- Drop dependent view
DROP VIEW IF EXISTS public.vw_all_customers_birthdays;

-- Increase phone column size
ALTER TABLE public.customers
  ALTER COLUMN phone TYPE varchar(30);

-- Recreate the view (will be recreated by the system later or add your definition here)
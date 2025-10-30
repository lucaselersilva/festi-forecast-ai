-- Step 2: Make existing columns nullable
ALTER TABLE public.customers
  ALTER COLUMN birthdate DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN gender DROP NOT NULL;
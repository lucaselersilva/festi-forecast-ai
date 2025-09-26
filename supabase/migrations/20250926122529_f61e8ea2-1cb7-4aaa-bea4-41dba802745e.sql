-- Enable RLS for customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policy for customers
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage customers" ON public.customers FOR ALL USING (auth.uid() IS NOT NULL);
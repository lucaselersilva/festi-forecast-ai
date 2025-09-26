-- Fix security issues

-- Enable RLS for consumptions table
ALTER TABLE public.consumptions ENABLE ROW LEVEL SECURITY;

-- Create policy for consumptions
CREATE POLICY "Authenticated users can view consumptions" ON public.consumptions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage consumptions" ON public.consumptions FOR ALL USING (auth.uid() IS NOT NULL);

-- Fix the update_updated_at_column function to have security definer and proper search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
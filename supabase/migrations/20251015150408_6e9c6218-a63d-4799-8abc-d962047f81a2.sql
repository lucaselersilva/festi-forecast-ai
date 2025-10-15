-- Remove existing policy
DROP POLICY IF EXISTS "Authenticated users can manage strategies" ON public.valle_reactivation_strategies;

-- Create new policy for public read access
CREATE POLICY "Anyone can view strategies"
ON public.valle_reactivation_strategies
FOR SELECT
TO public
USING (true);

-- Maintain policy for authenticated write/modify operations
CREATE POLICY "Authenticated users can manage strategies"
ON public.valle_reactivation_strategies
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
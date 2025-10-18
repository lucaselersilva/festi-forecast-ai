-- Drop existing policy
DROP POLICY IF EXISTS "Authenticated users can manage marketing_plans" ON marketing_plans;

-- Anyone can create marketing plans
CREATE POLICY "Anyone can create marketing_plans" 
ON marketing_plans 
FOR INSERT 
WITH CHECK (true);

-- Anyone can view marketing plans
CREATE POLICY "Anyone can view marketing_plans" 
ON marketing_plans 
FOR SELECT 
USING (true);

-- Users can update their own marketing plans
CREATE POLICY "Users can update their own marketing_plans" 
ON marketing_plans 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  (created_by = auth.uid()::text OR created_by = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Users can delete their own marketing plans
CREATE POLICY "Users can delete their own marketing_plans" 
ON marketing_plans 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND 
  (created_by = auth.uid()::text OR created_by = (SELECT email FROM auth.users WHERE id = auth.uid()))
);
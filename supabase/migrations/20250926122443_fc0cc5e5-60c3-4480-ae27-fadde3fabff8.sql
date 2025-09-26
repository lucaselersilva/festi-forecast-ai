-- Fix foreign key constraints and recreate tables
DROP TABLE IF EXISTS public.interactions CASCADE;
DROP TABLE IF EXISTS public.scoring_snapshots CASCADE;

-- Create interactions table with correct customer_id type (integer to match customers table)
CREATE TABLE public.interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  event_id UUID,
  item_id UUID,
  interaction_type TEXT NOT NULL, -- 'view', 'click', 'purchase', 'add_to_cart'
  value NUMERIC(10,2),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scoring_snapshots table with correct customer_id type (integer)
CREATE TABLE public.scoring_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  event_id UUID,
  propensity_score NUMERIC(5,4) NOT NULL, -- 0 to 1
  segment TEXT,
  recency_days INTEGER,
  frequency_score NUMERIC(5,2),
  monetary_value NUMERIC(10,2),
  predicted_ltv NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view interactions" ON public.interactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage interactions" ON public.interactions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view scoring_snapshots" ON public.scoring_snapshots FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage scoring_snapshots" ON public.scoring_snapshots FOR ALL USING (auth.uid() IS NOT NULL);

-- Add correct foreign key references
ALTER TABLE public.interactions ADD CONSTRAINT fk_interactions_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.interactions ADD CONSTRAINT fk_interactions_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.scoring_snapshots ADD CONSTRAINT fk_scoring_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.scoring_snapshots ADD CONSTRAINT fk_scoring_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_interactions_customer ON public.interactions(customer_id);
CREATE INDEX idx_interactions_event ON public.interactions(event_id);
CREATE INDEX idx_interactions_type ON public.interactions(interaction_type);
CREATE INDEX idx_scoring_customer ON public.scoring_snapshots(customer_id);
CREATE INDEX idx_scoring_event ON public.scoring_snapshots(event_id);
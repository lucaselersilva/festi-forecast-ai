-- Create events table based on the CSV structure
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id INTEGER NOT NULL UNIQUE,
  date DATE NOT NULL,
  city VARCHAR(100) NOT NULL,
  venue VARCHAR(200) NOT NULL,
  artist VARCHAR(200) NOT NULL,
  genre VARCHAR(50) NOT NULL,
  ticket_price DECIMAL(10,2) NOT NULL,
  marketing_spend DECIMAL(10,2) NOT NULL,
  google_trends_genre DECIMAL(5,2) NOT NULL,
  instagram_mentions INTEGER NOT NULL,
  temp_c DECIMAL(4,1) NOT NULL,
  precip_mm DECIMAL(5,1) NOT NULL,
  day_of_week VARCHAR(10) NOT NULL,
  is_holiday_brazil_hint INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL,
  sold_tickets INTEGER,
  revenue DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is event data)
CREATE POLICY "Events are viewable by everyone" 
ON public.events 
FOR SELECT 
USING (true);

CREATE POLICY "Events can be inserted by authenticated users" 
ON public.events 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Events can be updated by authenticated users" 
ON public.events 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_city ON public.events(city);
CREATE INDEX idx_events_genre ON public.events(genre);
CREATE INDEX idx_events_event_id ON public.events(event_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
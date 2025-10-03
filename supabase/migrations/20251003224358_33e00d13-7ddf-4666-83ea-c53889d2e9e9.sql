-- Add column to store new event context in analysis_runs
ALTER TABLE analysis_runs 
ADD COLUMN event_context_json JSONB;

-- Add comment
COMMENT ON COLUMN analysis_runs.event_context_json IS 'Stores new event details when analyzing events that don''t exist yet: {artist, genre, city, date, capacity, avgPrice}';

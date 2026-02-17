
-- Create user_locations table for saved places (home, work, etc.)
CREATE TABLE public.user_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 200,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own locations"
ON public.user_locations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own locations"
ON public.user_locations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations"
ON public.user_locations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations"
ON public.user_locations FOR DELETE USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_user_locations_updated_at
BEFORE UPDATE ON public.user_locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add optional location_id to sentences for location-based reminders
ALTER TABLE public.sentences ADD COLUMN location_id UUID REFERENCES public.user_locations(id) ON DELETE SET NULL;

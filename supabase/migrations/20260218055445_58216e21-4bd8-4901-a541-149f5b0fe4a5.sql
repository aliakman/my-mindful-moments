
-- Add color column to user_locations for colored dot indicators
ALTER TABLE public.user_locations ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#6366f1';

-- Add trigger_type to sentences: 'arrive' (default) or 'leave'
ALTER TABLE public.sentences ADD COLUMN IF NOT EXISTS location_trigger_type text NOT NULL DEFAULT 'arrive';

-- Add scheduled_date for date-based (calendar) reminders
ALTER TABLE public.sentences ADD COLUMN IF NOT EXISTS scheduled_date date DEFAULT NULL;

-- Add preset_type for quick reminder presets on collections
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS preset_type text DEFAULT NULL;

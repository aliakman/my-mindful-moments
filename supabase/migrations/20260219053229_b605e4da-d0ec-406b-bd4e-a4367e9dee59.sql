-- Add streak tracking to collections
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS streak_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date date;

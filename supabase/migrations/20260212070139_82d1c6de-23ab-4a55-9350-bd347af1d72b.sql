
-- Add reminder configuration columns to collections
ALTER TABLE public.collections
ADD COLUMN reminder_type text NOT NULL DEFAULT 'none',
ADD COLUMN active_hours_mode text NOT NULL DEFAULT 'default',
ADD COLUMN active_hours_start time NOT NULL DEFAULT '08:00',
ADD COLUMN active_hours_end time NOT NULL DEFAULT '22:00',
ADD COLUMN interval_hours integer NOT NULL DEFAULT 1;

-- reminder_type: 'none' | 'fixed' | 'random' | 'random_interval'
-- active_hours_mode: 'custom' | 'always' | 'default'
-- interval_hours: used when reminder_type = 'random_interval'

COMMENT ON COLUMN public.collections.reminder_type IS 'none=off, fixed=per-sentence times, random=random sentence at random time, random_interval=random sentence every N hours';
COMMENT ON COLUMN public.collections.active_hours_mode IS 'default=8AM-10PM, always=24/7, custom=user-defined range';

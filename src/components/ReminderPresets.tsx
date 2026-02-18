/**
 * ReminderPresets — Quick one-tap preset buttons for common reminder schedules.
 * Each preset maps to a reminder_type + interval configuration.
 */
import { Clock, CalendarDays, Repeat2, AlarmClock, Sun, Calendar } from "lucide-react";

interface Preset {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  config: {
    reminder_type: string;
    interval_hours: number;
    active_hours_mode: string;
    active_hours_start: string;
    active_hours_end: string;
  };
}

export const REMINDER_PRESETS: Preset[] = [
  {
    id: "every_day",
    label: "Every Day",
    description: "Random time daily during waking hours",
    icon: Sun,
    config: {
      reminder_type: "random_interval",
      interval_hours: 24,
      active_hours_mode: "default",
      active_hours_start: "08:00",
      active_hours_end: "22:00",
    },
  },
  {
    id: "every_2h",
    label: "Every 2 Hours",
    description: "Repeat reminder every 2 hours",
    icon: Repeat2,
    config: {
      reminder_type: "random_interval",
      interval_hours: 2,
      active_hours_mode: "default",
      active_hours_start: "08:00",
      active_hours_end: "22:00",
    },
  },
  {
    id: "morning",
    label: "Every Morning",
    description: "Fixed reminder at 8:00 AM daily",
    icon: AlarmClock,
    config: {
      reminder_type: "fixed",
      interval_hours: 24,
      active_hours_mode: "custom",
      active_hours_start: "07:00",
      active_hours_end: "09:00",
    },
  },
  {
    id: "weekly",
    label: "Start of Week",
    description: "Random reminder on Mondays",
    icon: CalendarDays,
    config: {
      reminder_type: "random_interval",
      interval_hours: 168,
      active_hours_mode: "default",
      active_hours_start: "08:00",
      active_hours_end: "22:00",
    },
  },
  {
    id: "monthly",
    label: "Start of Month",
    description: "Random reminder on the 1st of each month",
    icon: Calendar,
    config: {
      reminder_type: "random_interval",
      interval_hours: 720,
      active_hours_mode: "default",
      active_hours_start: "08:00",
      active_hours_end: "22:00",
    },
  },
  {
    id: "random",
    label: "Random",
    description: "Surprise reminders throughout the day",
    icon: Clock,
    config: {
      reminder_type: "random",
      interval_hours: 1,
      active_hours_mode: "default",
      active_hours_start: "08:00",
      active_hours_end: "22:00",
    },
  },
];

interface ReminderPresetsProps {
  onSelect: (config: Preset["config"]) => void;
  currentType: string;
}

const ReminderPresets = ({ onSelect, currentType }: ReminderPresetsProps) => {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Presets</p>
      <div className="grid grid-cols-2 gap-2">
        {REMINDER_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isActive = currentType === preset.config.reminder_type;
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset.config)}
              className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-all ${
                isActive
                  ? "border-primary bg-primary/8 text-foreground"
                  : "border-border bg-card hover:border-primary/40 hover:bg-primary/4"
              }`}
            >
              <div className={`mt-0.5 rounded-md p-1 ${isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight">{preset.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{preset.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ReminderPresets;

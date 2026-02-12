import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, Clock, Shuffle, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface ReminderSettingsProps {
  collectionId: string;
  reminderType: string;
  activeHoursMode: string;
  activeHoursStart: string;
  activeHoursEnd: string;
  intervalHours: number;
  onUpdate: () => void;
}

const REMINDER_TYPES = [
  { value: "none", label: "Off", icon: BellOff, description: "No reminders" },
  { value: "fixed", label: "Fixed Time", icon: Clock, description: "Each sentence at its set time" },
  { value: "random", label: "Random", icon: Shuffle, description: "Random sentence at random times" },
  { value: "random_interval", label: "Interval", icon: Timer, description: "Random sentence every N hours" },
];

const ReminderSettings = ({
  collectionId,
  reminderType,
  activeHoursMode,
  activeHoursStart,
  activeHoursEnd,
  intervalHours,
  onUpdate,
}: ReminderSettingsProps) => {
  const [type, setType] = useState(reminderType);
  const [hoursMode, setHoursMode] = useState(activeHoursMode);
  const [startTime, setStartTime] = useState(activeHoursStart?.slice(0, 5) || "08:00");
  const [endTime, setEndTime] = useState(activeHoursEnd?.slice(0, 5) || "22:00");
  const [interval, setInterval] = useState(intervalHours);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("collections")
      .update({
        reminder_type: type,
        active_hours_mode: hoursMode,
        active_hours_start: startTime,
        active_hours_end: endTime,
        interval_hours: interval,
      })
      .eq("id", collectionId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Reminder settings updated" });
      onUpdate();
    }
    setSaving(false);
  };

  const showActiveHours = type === "random" || type === "random_interval";

  return (
    <div className="space-y-4 rounded-xl bg-card p-4 animate-fade-in">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary" />
        Reminder Settings
      </h3>

      {/* Reminder Type */}
      <div className="grid grid-cols-2 gap-2">
        {REMINDER_TYPES.map((rt) => {
          const Icon = rt.icon;
          return (
            <button
              key={rt.value}
              onClick={() => setType(rt.value)}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left text-xs transition-all ${
                type === rt.value
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <div>
                <p className="font-medium">{rt.label}</p>
                <p className="text-[10px] opacity-70">{rt.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interval slider (for random_interval) */}
      {type === "random_interval" && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Send every <span className="font-semibold text-foreground">{interval}h</span>
          </label>
          <Slider
            value={[interval]}
            onValueChange={(v) => setInterval(v[0])}
            min={1}
            max={12}
            step={1}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>1h</span>
            <span>6h</span>
            <span>12h</span>
          </div>
        </div>
      )}

      {/* Active Hours */}
      {showActiveHours && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Active hours</label>
          <Select value={hoursMode} onValueChange={setHoursMode}>
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (8 AM – 10 PM)</SelectItem>
              <SelectItem value="always">Always (24/7)</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          {hoursMode === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-8 text-xs bg-background"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
          )}
        </div>
      )}

      <Button onClick={save} disabled={saving} size="sm" className="w-full">
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
};

export default ReminderSettings;

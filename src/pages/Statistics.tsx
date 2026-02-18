/**
 * Statistics — Detailed overview with summary cards and insights.
 */
import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FolderOpen, MessageSquare, Bell, MapPin, Clock, Shuffle, BellOff } from "lucide-react";

interface Stats {
  totalCollections: number;
  totalSentences: number;
  activeSentences: number;
  inactiveSentences: number;
  withFixedTime: number;
  withLocation: number;
  collectionsWithReminders: number;
  totalLocations: number;
  byReminderType: Record<string, number>;
}

const TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  none:            { label: "Off",       color: "text-muted-foreground", icon: BellOff },
  fixed:           { label: "Fixed",     color: "text-primary",          icon: Clock   },
  random:          { label: "Random",    color: "text-accent",           icon: Shuffle },
  random_interval: { label: "Interval",  color: "text-accent",           icon: Bell    },
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  iconColor,
  index,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconColor?: string;
  index: number;
}) => (
  <div
    className="rounded-xl bg-card border border-border/50 p-4 animate-fade-in"
    style={{ animationDelay: `${index * 60}ms` }}
  >
    <div className="flex items-center gap-2 mb-3">
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-muted ${iconColor ?? "text-primary"}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold tracking-tight">{value}</p>
  </div>
);

const Statistics = () => {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    const [colsRes, sentsRes, locsRes] = await Promise.all([
      supabase.from("collections").select("id, reminder_type"),
      supabase.from("sentences").select("id, is_active, reminder_time, location_id"),
      supabase.from("user_locations").select("id", { count: "exact", head: true }),
    ]);

    const cols = colsRes.data ?? [];
    const sents = sentsRes.data ?? [];
    const locCount = locsRes.count ?? 0;

    const byType: Record<string, number> = {};
    for (const c of cols) {
      byType[c.reminder_type] = (byType[c.reminder_type] ?? 0) + 1;
    }

    setStats({
      totalCollections: cols.length,
      totalSentences: sents.length,
      activeSentences: sents.filter((s) => s.is_active).length,
      inactiveSentences: sents.filter((s) => !s.is_active).length,
      withFixedTime: sents.filter((s) => s.reminder_time).length,
      withLocation: sents.filter((s) => s.location_id).length,
      collectionsWithReminders: cols.filter((c) => c.reminder_type !== "none").length,
      totalLocations: locCount,
      byReminderType: byType,
    });
  };

  if (loading || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const mainCards = [
    { label: "Collections",         value: stats.totalCollections,        icon: FolderOpen,   iconColor: "text-primary" },
    { label: "Total Sentences",     value: stats.totalSentences,          icon: MessageSquare,iconColor: "text-primary" },
    { label: "Active Reminders",    value: stats.activeSentences,         icon: Bell,         iconColor: "text-accent"  },
    { label: "Inactive",            value: stats.inactiveSentences,       icon: BellOff,      iconColor: "text-muted-foreground" },
    { label: "Fixed-Time Reminders",value: stats.withFixedTime,           icon: Clock,        iconColor: "text-primary" },
    { label: "Location Reminders",  value: stats.withLocation,            icon: MapPin,       iconColor: "text-primary" },
    { label: "Saved Locations",     value: stats.totalLocations,          icon: MapPin,       iconColor: "text-primary" },
    { label: "Active Collections",  value: stats.collectionsWithReminders,icon: Bell,         iconColor: "text-accent"  },
  ];

  const reminderBreakdown = Object.entries(stats.byReminderType).filter(([, v]) => v > 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <Link to="/settings" className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">Statistics</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {/* Main stat grid */}
        <div className="grid grid-cols-2 gap-3">
          {mainCards.map((card, i) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              iconColor={card.iconColor}
              index={i}
            />
          ))}
        </div>

        {/* Reminder type breakdown */}
        {reminderBreakdown.length > 0 && (
          <section className="rounded-xl bg-card border border-border/50 p-4 space-y-3 animate-fade-in">
            <h3 className="text-sm font-semibold">Collections by Type</h3>
            <div className="space-y-2">
              {reminderBreakdown.map(([type, count]) => {
                const meta = TYPE_LABELS[type] ?? { label: type, color: "text-muted-foreground", icon: Bell };
                const Icon = meta.icon;
                const pct = stats.totalCollections > 0
                  ? Math.round((count / stats.totalCollections) * 100)
                  : 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`flex items-center gap-1.5 font-medium ${meta.color}`}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {stats.totalCollections === 0 && (
          <div className="mt-10 text-center text-muted-foreground text-sm">
            <p>No data yet. Create some collections to see your stats.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Statistics;

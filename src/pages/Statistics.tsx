/**
 * Statistics — Overview of user's reminder activity.
 * Shows total collections, sentences, active reminders, and location-based reminders.
 */
import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FolderOpen, MessageSquare, Bell, MapPin, TrendingUp } from "lucide-react";

interface Stats {
  totalCollections: number;
  totalSentences: number;
  activeSentences: number;
  withFixedTime: number;
  withLocation: number;
  collectionsWithReminders: number;
}

const Statistics = () => {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    // Fetch collections
    const { data: cols } = await supabase
      .from("collections")
      .select("id, reminder_type");

    // Fetch sentences
    const { data: sents } = await supabase
      .from("sentences")
      .select("id, is_active, reminder_time, location_id");

    // Fetch user locations count
    const { count: locCount } = await supabase
      .from("user_locations")
      .select("*", { count: "exact", head: true });

    if (cols && sents) {
      setStats({
        totalCollections: cols.length,
        totalSentences: sents.length,
        activeSentences: sents.filter((s) => s.is_active).length,
        withFixedTime: sents.filter((s) => s.reminder_time).length,
        withLocation: sents.filter((s) => s.location_id).length,
        collectionsWithReminders: cols.filter((c) => c.reminder_type !== "none").length,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const cards = stats
    ? [
        { label: "Collections", value: stats.totalCollections, icon: FolderOpen, color: "text-primary" },
        { label: "Total Sentences", value: stats.totalSentences, icon: MessageSquare, color: "text-primary" },
        { label: "Active Reminders", value: stats.activeSentences, icon: Bell, color: "text-accent" },
        { label: "With Fixed Time", value: stats.withFixedTime, icon: TrendingUp, color: "text-primary" },
        { label: "Location-Based", value: stats.withLocation, icon: MapPin, color: "text-primary" },
        { label: "Collections with Reminders", value: stats.collectionsWithReminders, icon: Bell, color: "text-accent" },
      ]
    : [];

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

      <main className="mx-auto max-w-lg px-4 py-6">
        {!stats ? (
          <div className="mt-20 text-center animate-pulse text-muted-foreground">Loading stats...</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-xl bg-card p-4 animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${card.color}`} />
                    <span className="text-xs text-muted-foreground">{card.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Statistics;

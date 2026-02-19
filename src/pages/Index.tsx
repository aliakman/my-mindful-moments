import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, FolderOpen, Trash2, ChevronRight, Settings2, Pencil,
  Check, X, Search, Bell, BellOff, MapPin, Clock, Shuffle, Calendar,
  Layers, Flame
} from "lucide-react";
import { Link } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useSubscription } from "@/hooks/useSubscription";

interface Collection {
  id: string;
  name: string;
  created_at: string;
  reminder_type: string;
  active_hours_mode: string;
  active_hours_start: string;
  active_hours_end: string;
  interval_hours: number;
  sentence_count?: number;
  streak_count: number;
  last_active_date: string | null;
}

const REMINDER_TYPE_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  none:            { icon: BellOff,   label: "No reminder", color: "text-muted-foreground" },
  fixed:           { icon: Clock,     label: "Fixed time",  color: "text-primary" },
  random:          { icon: Shuffle,   label: "Random",      color: "text-accent" },
  random_interval: { icon: Bell,      label: "Interval",    color: "text-accent" },
  date:            { icon: Calendar,  label: "Date-based",  color: "text-primary" },
  location:        { icon: MapPin,    label: "Location",    color: "text-primary" },
};

const FILTER_TABS = [
  { id: "all",      label: "All",      icon: Layers  },
  { id: "fixed",    label: "Fixed",    icon: Clock   },
  { id: "random",   label: "Random",   icon: Shuffle },
  { id: "location", label: "Location", icon: MapPin  },
  { id: "none",     label: "Off",      icon: BellOff },
];

/** Compute "next reminder" human string from collection settings */
const getNextReminderText = (col: Collection): string | null => {
  if (col.reminder_type === "none") return null;
  if (col.reminder_type === "random") return "Random reminder";
  if (col.reminder_type === "random_interval") {
    const h = col.interval_hours;
    return `Every ${h === 1 ? "hour" : `${h} hours`}`;
  }
  if (col.reminder_type === "fixed") return "At scheduled times";
  if (col.reminder_type === "location") return "Location-based";
  if (col.reminder_type === "date") return "Date scheduled";
  return null;
};

/** Update streak: increment if last active was yesterday, reset if older, no-op if today */
const updateStreak = async (col: Collection) => {
  const today = new Date().toISOString().split("T")[0];
  if (col.last_active_date === today) return col.streak_count; // already counted

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const isConsecutive = col.last_active_date === yesterday;
  const newStreak = isConsecutive ? col.streak_count + 1 : 1;

  await supabase
    .from("collections")
    .update({ streak_count: newStreak, last_active_date: today })
    .eq("id", col.id);

  return newStreak;
};

const Index = () => {
  const { user, loading } = useAuth();
  const { isTrialActive, trialDaysLeft, isSubscribed } = useSubscription();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchCollections();
  }, [user]);

  const fetchCollections = async () => {
    const { data: cols } = await supabase
      .from("collections")
      .select("id, name, created_at, reminder_type, active_hours_mode, active_hours_start, active_hours_end, interval_hours, streak_count, last_active_date")
      .order("created_at", { ascending: false });

    if (cols) {
      const withCounts = await Promise.all(
        cols.map(async (c) => {
          const { count } = await supabase
            .from("sentences")
            .select("*", { count: "exact", head: true })
            .eq("collection_id", c.id);
          return { ...c, sentence_count: count ?? 0 };
        })
      );
      setCollections(withCounts as Collection[]);
    }
  };

  const addCollection = async () => {
    if (!newName.trim() || !user) return;
    setAdding(true);
    const { error } = await supabase.from("collections").insert({
      name: newName.trim(),
      user_id: user.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewName("");
      setShowInput(false);
      fetchCollections();
    }
    setAdding(false);
  };

  const renameCollection = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase.from("collections").update({ name: editName.trim() }).eq("id", id);
    if (!error) {
      setEditingId(null);
      fetchCollections();
    }
  };

  const deleteCollection = async () => {
    if (!deleteTarget) return;
    await supabase.from("collections").delete().eq("id", deleteTarget.id);
    fetchCollections();
    setDeleteTarget(null);
  };

  const handleOpenCollection = async (col: Collection) => {
    // Update streak on open
    const newStreak = await updateStreak(col);
    if (newStreak !== col.streak_count) {
      setCollections((prev) =>
        prev.map((c) => (c.id === col.id ? { ...c, streak_count: newStreak } : c))
      );
    }
  };

  const filtered = collections.filter((c) => {
    const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterType === "all" ||
      c.reminder_type === filterType ||
      (filterType === "random" && (c.reminder_type === "random" || c.reminder_type === "random_interval"));
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Remind Me</h1>
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
              {collections.length} collection{collections.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              aria-label="Search collections"
              className={`rounded-lg p-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                showSearch ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              to="/settings"
              aria-label="Open settings"
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Settings2 className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {showSearch && (
          <div className="mx-auto max-w-lg px-4 pb-3 animate-fade-in">
            <Input
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="h-10 bg-card text-sm"
            />
          </div>
        )}

        {/* Filter tabs */}
        <div
          className="mx-auto max-w-lg px-4 pb-3 flex gap-1.5 overflow-x-auto"
          style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all min-h-[32px] ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                <Icon className="h-3 w-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-5">
        {/* Trial countdown banner */}
        {isTrialActive && !isSubscribed && (
          <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-center text-sm animate-fade-in">
            <span className="text-muted-foreground">Free trial: </span>
            <span className="font-semibold text-accent">{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left</span>
          </div>
        )}

        {/* New collection input */}
        {showInput ? (
          <div className="mb-5 flex gap-2 animate-fade-in">
            <Input
              placeholder="Collection name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCollection()}
              autoFocus
              className="h-11 bg-card"
            />
            <Button onClick={addCollection} disabled={adding} size="sm" className="h-11 px-4">
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-11 w-11 p-0"
              aria-label="Cancel"
              onClick={() => { setShowInput(false); setNewName(""); }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setShowInput(true)}
            variant="outline"
            className="mb-5 w-full h-11 gap-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            New Collection
          </Button>
        )}

        {/* Collections list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted mb-4">
              <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="text-base font-semibold text-foreground">
              {searchQuery || filterType !== "all" ? "No matching collections" : "No collections yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs">
              {searchQuery
                ? `Try a different search term`
                : filterType !== "all"
                ? `No collections with this reminder type`
                : "Tap 'New Collection' above to create your first reminder collection"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((col, i) => {
              const meta = REMINDER_TYPE_META[col.reminder_type] ?? REMINDER_TYPE_META.none;
              const RIcon = meta.icon;
              const nextReminder = getNextReminderText(col);
              const hasStreak = col.streak_count > 1;

              return (
                <div
                  key={col.id}
                  className="group flex items-center gap-3 rounded-xl bg-card p-4 border border-border/40 transition-all hover:shadow-sm hover:border-border/80 animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {editingId === col.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameCollection(col.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="h-9 text-sm bg-background"
                      />
                      <button
                        onClick={() => renameCollection(col.id)}
                        aria-label="Confirm rename"
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        aria-label="Cancel rename"
                        className="p-2 text-muted-foreground hover:bg-secondary rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link
                        to={`/collection/${col.id}`}
                        onClick={() => handleOpenCollection(col)}
                        className="flex flex-1 items-center gap-3 min-w-0"
                      >
                        {/* Folder icon */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <FolderOpen className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-sm">{col.name}</p>
                            {/* Streak badge */}
                            {hasStreak && (
                              <span className="flex items-center gap-0.5 shrink-0 text-[10px] font-semibold text-accent bg-accent/10 rounded-full px-1.5 py-0.5">
                                <Flame className="h-2.5 w-2.5" />
                                {col.streak_count}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <RIcon className={`h-3 w-3 shrink-0 ${meta.color}`} />
                            <span className={`text-[11px] ${meta.color}`}>{meta.label}</span>
                            {nextReminder && col.reminder_type !== "none" && (
                              <>
                                <span className="text-[11px] text-muted-foreground/40">·</span>
                                <span className="text-[11px] text-muted-foreground">{nextReminder}</span>
                              </>
                            )}
                            <span className="text-[11px] text-muted-foreground/40">·</span>
                            <span className="text-[11px] text-muted-foreground">
                              {col.sentence_count} {col.sentence_count === 1 ? "sentence" : "sentences"}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      </Link>

                      <div className="flex gap-0.5">
                        <button
                          onClick={() => { setEditingId(col.id); setEditName(col.name); }}
                          aria-label={`Rename ${col.name}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-secondary text-muted-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(col)}
                          aria-label={`Delete ${col.name}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete collection?"
        description={`"${deleteTarget?.name}" and all its sentences will be permanently deleted.`}
        onConfirm={deleteCollection}
      />
    </div>
  );
};

export default Index;

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
  Layers
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
  sentence_count?: number;
}

// Mapping of reminder types to icons and labels
const REMINDER_TYPE_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  none:           { icon: BellOff, label: "No reminder",   color: "text-muted-foreground" },
  fixed:          { icon: Clock,   label: "Fixed time",     color: "text-primary" },
  random:         { icon: Shuffle, label: "Random",         color: "text-accent" },
  random_interval:{ icon: Bell,    label: "Interval",       color: "text-accent" },
  date:           { icon: Calendar,label: "Date-based",     color: "text-primary" },
  location:       { icon: MapPin,  label: "Location",       color: "text-primary" },
};

// Filter categories
const FILTER_TABS = [
  { id: "all",      label: "All",       icon: Layers  },
  { id: "fixed",    label: "Fixed",     icon: Clock   },
  { id: "random",   label: "Random",    icon: Shuffle },
  { id: "location", label: "Location",  icon: MapPin  },
  { id: "none",     label: "Off",       icon: BellOff },
];

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
      .select("id, name, created_at, reminder_type, active_hours_mode")
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
      setCollections(withCounts);
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

  // Apply search + type filter
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
              className={`rounded-lg p-1.5 transition-colors ${
                showSearch ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Search className="h-5 w-5" />
            </button>
            <Link to="/settings" className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors">
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
              className="h-9 bg-card text-sm"
            />
          </div>
        )}
        {/* Filter tabs */}
        <div className="mx-auto max-w-lg px-4 pb-3 flex gap-1.5 overflow-x-auto" style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}>
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all ${
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
              className="h-10 bg-card"
            />
            <Button onClick={addCollection} disabled={adding} size="sm" className="h-10 px-4">
              Add
            </Button>
            <Button variant="ghost" size="sm" className="h-10" onClick={() => { setShowInput(false); setNewName(""); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setShowInput(true)}
            variant="outline"
            className="mb-5 w-full gap-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            New Collection
          </Button>
        )}

        {/* Collections list */}
        {filtered.length === 0 ? (
          <div className="mt-20 text-center animate-fade-in">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              {searchQuery || filterType !== "all" ? "No matching collections" : "No collections yet"}
            </p>
            {!searchQuery && filterType === "all" && (
              <p className="text-xs text-muted-foreground/60">Create one to start adding sentences</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((col, i) => {
              const meta = REMINDER_TYPE_META[col.reminder_type] ?? REMINDER_TYPE_META.none;
              const RIcon = meta.icon;

              return (
                <div
                  key={col.id}
                  className="group flex items-center gap-3 rounded-xl bg-card p-4 transition-all hover:shadow-sm animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
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
                        className="h-8 text-sm bg-background"
                      />
                      <button onClick={() => renameCollection(col.id)} className="p-1 text-primary hover:bg-primary/10 rounded">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:bg-secondary rounded">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link to={`/collection/${col.id}`} className="flex flex-1 items-center gap-3 min-w-0">
                        {/* Folder icon */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <FolderOpen className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-sm">{col.name}</p>
                          {/* Reminder type badge */}
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <RIcon className={`h-3 w-3 ${meta.color}`} />
                            <span className={`text-[11px] ${meta.color}`}>{meta.label}</span>
                            <span className="text-[11px] text-muted-foreground/60">·</span>
                            <span className="text-[11px] text-muted-foreground">
                              {col.sentence_count} {col.sentence_count === 1 ? "sentence" : "sentences"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      </Link>
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => { setEditingId(col.id); setEditName(col.name); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-secondary text-muted-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(col)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
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

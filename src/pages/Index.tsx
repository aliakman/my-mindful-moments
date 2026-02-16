import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FolderOpen, Trash2, ChevronRight, Settings2, Pencil, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useSubscription } from "@/hooks/useSubscription";

interface Collection {
  id: string;
  name: string;
  created_at: string;
  sentence_count?: number;
}

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
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchCollections();
  }, [user]);

  const fetchCollections = async () => {
    const { data: cols } = await supabase
      .from("collections")
      .select("id, name, created_at")
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
    const { error } = await supabase.from("collections").delete().eq("id", deleteTarget.id);
    if (!error) fetchCollections();
    setDeleteTarget(null);
  };

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
          <h1 className="text-lg font-bold tracking-tight">Remind Me</h1>
          <Link to="/settings" className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors">
            <Settings2 className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Trial countdown banner */}
        {isTrialActive && !isSubscribed && (
          <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-center text-sm animate-fade-in">
            <span className="text-muted-foreground">Free trial: </span>
            <span className="font-semibold text-accent">{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left</span>
          </div>
        )}

        {/* New collection input */}
        {showInput ? (
          <div className="mb-6 flex gap-2 animate-fade-in">
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
            className="mb-6 w-full gap-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            New Collection
          </Button>
        )}

        {/* Collections list */}
        {collections.length === 0 ? (
          <div className="mt-20 text-center animate-fade-in">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No collections yet</p>
            <p className="text-xs text-muted-foreground/60">Create one to start adding sentences</p>
          </div>
        ) : (
          <div className="space-y-2">
            {collections.map((col, i) => (
              <div
                key={col.id}
                className="group flex items-center gap-3 rounded-xl bg-card p-4 transition-all hover:shadow-sm animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {editingId === col.id ? (
                  /* Inline rename */
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
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FolderOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{col.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {col.sentence_count} {col.sentence_count === 1 ? "sentence" : "sentences"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                    </Link>
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation */}
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

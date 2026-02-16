import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FolderOpen, Trash2, ChevronRight, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Collection {
  id: string;
  name: string;
  created_at: string;
  sentence_count?: number;
}

const Index = () => {
  const { user, loading } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);
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
      // Get sentence counts
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

  const deleteCollection = async (id: string) => {
    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (!error) fetchCollections();
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
              ✕
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
                  onClick={(e) => { e.stopPropagation(); deleteCollection(col.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;

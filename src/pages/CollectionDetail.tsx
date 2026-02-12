import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Clock, Bell, BellOff, Settings2 } from "lucide-react";
import ReminderSettings from "@/components/ReminderSettings";

interface Sentence {
  id: string;
  text: string;
  reminder_time: string | null;
  is_active: boolean;
  created_at: string;
}

interface CollectionData {
  name: string;
  reminder_type: string;
  active_hours_mode: string;
  active_hours_start: string;
  active_hours_end: string;
  interval_hours: number;
}

const CollectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [newText, setNewText] = useState("");
  const [newTime, setNewTime] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && id) {
      fetchCollection();
      fetchSentences();
    }
  }, [user, id]);

  const fetchCollection = async () => {
    const { data } = await supabase
      .from("collections")
      .select("name, reminder_type, active_hours_mode, active_hours_start, active_hours_end, interval_hours")
      .eq("id", id!)
      .maybeSingle();
    if (data) setCollection(data);
  };

  const fetchSentences = async () => {
    const { data } = await supabase
      .from("sentences")
      .select("*")
      .eq("collection_id", id!)
      .order("created_at", { ascending: false });
    if (data) setSentences(data);
  };

  const addSentence = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    const { error } = await supabase.from("sentences").insert({
      collection_id: id!,
      text: newText.trim(),
      reminder_time: newTime || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewText("");
      setNewTime("");
      setShowInput(false);
      fetchSentences();
    }
    setAdding(false);
  };

  const deleteSentence = async (sentenceId: string) => {
    await supabase.from("sentences").delete().eq("id", sentenceId);
    fetchSentences();
  };

  const toggleActive = async (sentenceId: string, currentActive: boolean) => {
    await supabase.from("sentences").update({ is_active: !currentActive }).eq("id", sentenceId);
    fetchSentences();
  };

  const updateReminderTime = async (sentenceId: string, time: string) => {
    await supabase.from("sentences").update({ reminder_time: time || null }).eq("id", sentenceId);
    fetchSentences();
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
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <Link to="/" className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="truncate text-lg font-bold tracking-tight">{collection?.name}</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`ml-auto rounded-lg p-1.5 transition-colors ${
              showSettings ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Settings2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Reminder Settings */}
        {showSettings && collection && (
          <div className="mb-6">
            <ReminderSettings
              collectionId={id!}
              reminderType={collection.reminder_type}
              activeHoursMode={collection.active_hours_mode}
              activeHoursStart={collection.active_hours_start}
              activeHoursEnd={collection.active_hours_end}
              intervalHours={collection.interval_hours}
              onUpdate={fetchCollection}
            />
          </div>
        )}

        {/* Add sentence */}
        {showInput ? (
          <div className="mb-6 space-y-3 rounded-xl bg-card p-4 animate-fade-in">
            <Input
              placeholder="Write your sentence..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              autoFocus
              className="bg-background"
            />
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="h-9 w-36 bg-background text-sm"
              />
              <span className="text-xs text-muted-foreground">Reminder time</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={addSentence} disabled={adding} size="sm" className="px-4">
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowInput(false); setNewText(""); setNewTime(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setShowInput(true)}
            variant="outline"
            className="mb-6 w-full gap-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Add Sentence
          </Button>
        )}

        {/* Sentences list */}
        {sentences.length === 0 ? (
          <div className="mt-20 text-center animate-fade-in">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No sentences yet</p>
            <p className="text-xs text-muted-foreground/60">Add your first reminder sentence</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sentences.map((s, i) => (
              <div
                key={s.id}
                className={`group rounded-xl p-4 transition-all animate-fade-in ${
                  s.is_active ? "bg-card" : "bg-muted/50 opacity-60"
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleActive(s.id, s.is_active)}
                    className={`mt-0.5 shrink-0 rounded-md p-1.5 transition-colors ${
                      s.is_active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.is_active ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed">{s.text}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="time"
                        value={s.reminder_time ?? ""}
                        onChange={(e) => updateReminderTime(s.id, e.target.value)}
                        className="h-7 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      {s.reminder_time && (
                        <span className="text-xs text-muted-foreground">⏰ {s.reminder_time.slice(0, 5)}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSentence(s.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CollectionDetail;

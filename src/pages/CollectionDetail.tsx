import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Clock, Bell, BellOff, Settings2, Pencil, Check, X, MapPin, Search } from "lucide-react";
import ReminderSettings from "@/components/ReminderSettings";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Sentence {
  id: string;
  text: string;
  reminder_time: string | null;
  is_active: boolean;
  created_at: string;
  location_id: string | null;
}

interface CollectionData {
  name: string;
  reminder_type: string;
  active_hours_mode: string;
  active_hours_start: string;
  active_hours_end: string;
  interval_hours: number;
}

interface UserLocation {
  id: string;
  name: string;
}

const CollectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [newText, setNewText] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLocationId, setNewLocationId] = useState<string>("");
  const [showInput, setShowInput] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Sentence | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && id) {
      fetchCollection();
      fetchSentences();
      fetchLocations();
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

  const fetchLocations = async () => {
    const { data } = await supabase
      .from("user_locations")
      .select("id, name")
      .order("name");
    if (data) setLocations(data);
  };

  const addSentence = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    const { error } = await supabase.from("sentences").insert({
      collection_id: id!,
      text: newText.trim(),
      reminder_time: newTime || null,
      location_id: newLocationId || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewText("");
      setNewTime("");
      setNewLocationId("");
      setShowInput(false);
      fetchSentences();
    }
    setAdding(false);
  };

  const updateSentenceText = async (sentenceId: string) => {
    if (!editText.trim()) return;
    await supabase.from("sentences").update({ text: editText.trim() }).eq("id", sentenceId);
    setEditingId(null);
    fetchSentences();
  };

  const deleteSentence = async () => {
    if (!deleteTarget) return;
    await supabase.from("sentences").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
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

  const updateLocation = async (sentenceId: string, locationId: string) => {
    await supabase.from("sentences").update({ location_id: locationId || null }).eq("id", sentenceId);
    fetchSentences();
  };

  const filtered = searchQuery
    ? sentences.filter((s) => s.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : sentences;

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
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`rounded-lg p-1.5 transition-colors ${
                showSearch ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`rounded-lg p-1.5 transition-colors ${
                showSettings ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Settings2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        {showSearch && (
          <div className="mx-auto max-w-lg px-4 pb-3 animate-fade-in">
            <Input
              placeholder="Search sentences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="h-9 bg-card text-sm"
            />
          </div>
        )}
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
              <span className="text-xs text-muted-foreground">Time</span>
            </div>
            {/* Location picker */}
            {locations.length > 0 && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Select value={newLocationId} onValueChange={setNewLocationId}>
                  <SelectTrigger className="h-9 flex-1 bg-background text-sm">
                    <SelectValue placeholder="No location trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No location</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={addSentence} disabled={adding} size="sm" className="px-4">
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowInput(false); setNewText(""); setNewTime(""); setNewLocationId(""); }}>
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
        {filtered.length === 0 ? (
          <div className="mt-20 text-center animate-fade-in">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              {searchQuery ? "No matching sentences" : "No sentences yet"}
            </p>
            {!searchQuery && (
              <p className="text-xs text-muted-foreground/60">Add your first reminder sentence</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s, i) => (
              <SentenceCard
                key={s.id}
                sentence={s}
                index={i}
                locations={locations}
                isEditing={editingId === s.id}
                editText={editText}
                onStartEdit={() => { setEditingId(s.id); setEditText(s.text); }}
                onEditChange={setEditText}
                onSaveEdit={() => updateSentenceText(s.id)}
                onCancelEdit={() => setEditingId(null)}
                onToggleActive={() => toggleActive(s.id, s.is_active)}
                onUpdateTime={(time) => updateReminderTime(s.id, time)}
                onUpdateLocation={(locId) => updateLocation(s.id, locId)}
                onDelete={() => setDeleteTarget(s)}
              />
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete sentence?"
        description="This sentence and its reminder will be permanently removed."
        onConfirm={deleteSentence}
      />
    </div>
  );
};

/** Individual sentence card */
interface SentenceCardProps {
  sentence: Sentence;
  index: number;
  locations: UserLocation[];
  isEditing: boolean;
  editText: string;
  onStartEdit: () => void;
  onEditChange: (text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleActive: () => void;
  onUpdateTime: (time: string) => void;
  onUpdateLocation: (locationId: string) => void;
  onDelete: () => void;
}

const SentenceCard = ({
  sentence: s,
  index,
  locations,
  isEditing,
  editText,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onToggleActive,
  onUpdateTime,
  onUpdateLocation,
  onDelete,
}: SentenceCardProps) => {
  const locationName = locations.find((l) => l.id === s.location_id)?.name;

  return (
    <div
      className={`group rounded-xl p-4 transition-all animate-fade-in ${
        s.is_active ? "bg-card" : "bg-muted/50 opacity-60"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggleActive}
          className={`mt-0.5 shrink-0 rounded-md p-1.5 transition-colors ${
            s.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {s.is_active ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
        </button>
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editText}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEdit();
                  if (e.key === "Escape") onCancelEdit();
                }}
                autoFocus
                className="h-8 text-sm bg-background"
              />
              <button onClick={onSaveEdit} className="p-1 text-primary hover:bg-primary/10 rounded">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={onCancelEdit} className="p-1 text-muted-foreground hover:bg-secondary rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm leading-relaxed cursor-pointer" onClick={onStartEdit} title="Click to edit">
              {s.text}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="time"
              value={s.reminder_time ?? ""}
              onChange={(e) => onUpdateTime(e.target.value)}
              className="h-7 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {s.reminder_time && (
              <span className="text-xs text-muted-foreground">⏰ {s.reminder_time.slice(0, 5)}</span>
            )}
            {/* Location badge */}
            {locationName && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
                <MapPin className="h-3 w-3" />
                {locationName}
              </span>
            )}
          </div>
          {/* Location selector (shown on hover/tap) */}
          {locations.length > 0 && (
            <div className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <select
                value={s.location_id ?? ""}
                onChange={(e) => onUpdateLocation(e.target.value)}
                className="h-6 rounded border border-border bg-background px-1 text-[10px] text-muted-foreground focus:outline-none"
              >
                <option value="">No location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={onStartEdit}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-secondary text-muted-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectionDetail;

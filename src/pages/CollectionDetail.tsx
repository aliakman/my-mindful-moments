import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Plus, Trash2, Clock, Bell, BellOff, Settings2,
  Pencil, Check, X, MapPin, Search, LogIn, LogOut
} from "lucide-react";
import ReminderSettings from "@/components/ReminderSettings";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Sentence {
  id: string;
  text: string;
  reminder_time: string | null;
  is_active: boolean;
  created_at: string;
  location_id: string | null;
  location_trigger_type: string;
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
  color: string;
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
  const [newTriggerType, setNewTriggerType] = useState<string>("arrive");
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
      .select("id, text, reminder_time, is_active, created_at, location_id, location_trigger_type")
      .eq("collection_id", id!)
      .order("created_at", { ascending: false });
    if (data) setSentences(data as Sentence[]);
  };

  const fetchLocations = async () => {
    const { data } = await supabase
      .from("user_locations")
      .select("id, name, color")
      .order("name");
    if (data) setLocations(data as UserLocation[]);
  };

  const addSentence = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    const { error } = await supabase.from("sentences").insert({
      collection_id: id!,
      text: newText.trim(),
      reminder_time: newTime || null,
      location_id: newLocationId || null,
      location_trigger_type: newTriggerType,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewText("");
      setNewTime("");
      setNewLocationId("");
      setNewTriggerType("arrive");
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

  const updateTriggerType = async (sentenceId: string, triggerType: string) => {
    await supabase.from("sentences").update({ location_trigger_type: triggerType }).eq("id", sentenceId);
    fetchSentences();
  };

  const filtered = searchQuery
    ? sentences.filter((s) => s.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : sentences;

  // Only show time picker under sentences when collection is fixed-time type
  const showTimeUnderSentences = collection?.reminder_type === "fixed";

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
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight">{collection?.name}</h1>
            {collection && (
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5 capitalize">
                {collection.reminder_type === "none" ? "No reminder" :
                 collection.reminder_type === "fixed" ? "Fixed time" :
                 collection.reminder_type === "random_interval" ? "Interval" :
                 collection.reminder_type}
              </p>
            )}
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
          <div className="mb-6 animate-fade-in">
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

        {/* Add sentence form */}
        {showInput ? (
          <div className="mb-6 space-y-3 rounded-xl bg-card border border-border/60 p-4 animate-fade-in">
            <Input
              placeholder="Write your sentence..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              autoFocus
              className="bg-background"
            />

            {/* Time — only if collection is fixed type */}
            {showTimeUnderSentences && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="h-9 w-36 bg-background text-sm"
                />
                <span className="text-xs text-muted-foreground">Reminder time</span>
              </div>
            )}

            {/* Location picker */}
            {locations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select value={newLocationId} onValueChange={setNewLocationId}>
                    <SelectTrigger className="h-9 flex-1 bg-background text-sm">
                      <SelectValue placeholder="No location trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No location</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: loc.color }} />
                            {loc.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Trigger type (arrive/leave) — only if location selected */}
                {newLocationId && (
                  <div className="ml-6 flex gap-2">
                    <button
                      onClick={() => setNewTriggerType("arrive")}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition-all ${
                        newTriggerType === "arrive"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <LogIn className="h-3 w-3" /> Arrive
                    </button>
                    <button
                      onClick={() => setNewTriggerType("leave")}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition-all ${
                        newTriggerType === "leave"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <LogOut className="h-3 w-3" /> Leave
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={addSentence} disabled={adding} size="sm" className="px-4">
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowInput(false); setNewText(""); setNewTime(""); setNewLocationId(""); }}
              >
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
              <p className="text-xs text-muted-foreground/60">Add your first reminder sentence above</p>
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
                showTimeControl={showTimeUnderSentences}
                onStartEdit={() => { setEditingId(s.id); setEditText(s.text); }}
                onEditChange={setEditText}
                onSaveEdit={() => updateSentenceText(s.id)}
                onCancelEdit={() => setEditingId(null)}
                onToggleActive={() => toggleActive(s.id, s.is_active)}
                onUpdateTime={(time) => updateReminderTime(s.id, time)}
                onUpdateLocation={(locId) => updateLocation(s.id, locId)}
                onUpdateTriggerType={(t) => updateTriggerType(s.id, t)}
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
  showTimeControl: boolean;
  onStartEdit: () => void;
  onEditChange: (text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleActive: () => void;
  onUpdateTime: (time: string) => void;
  onUpdateLocation: (locationId: string) => void;
  onUpdateTriggerType: (triggerType: string) => void;
  onDelete: () => void;
}

const SentenceCard = ({
  sentence: s,
  index,
  locations,
  isEditing,
  editText,
  showTimeControl,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onToggleActive,
  onUpdateTime,
  onUpdateLocation,
  onUpdateTriggerType,
  onDelete,
}: SentenceCardProps) => {
  const location = locations.find((l) => l.id === s.location_id);

  return (
    <div
      className={`group rounded-xl border p-4 transition-all animate-fade-in ${
        s.is_active
          ? "bg-card border-border/50"
          : "bg-muted/30 border-border/30 opacity-60"
      }`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Active toggle */}
        <button
          onClick={onToggleActive}
          className={`mt-0.5 shrink-0 rounded-lg p-1.5 transition-colors ${
            s.is_active
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
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
            <p
              className="text-sm leading-relaxed cursor-pointer hover:text-primary transition-colors"
              onClick={onStartEdit}
              title="Click to edit"
            >
              {s.text}
            </p>
          )}

          {/* Meta row: time + location badges */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Time picker — only for fixed time collections */}
            {showTimeControl && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <input
                  type="time"
                  value={s.reminder_time ?? ""}
                  onChange={(e) => onUpdateTime(e.target.value)}
                  className="h-6 rounded-md border border-border bg-background px-1.5 text-[11px] text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}

            {/* Fixed time badge (when NOT in fixed mode — show read-only) */}
            {!showTimeControl && s.reminder_time && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary font-medium">
                <Clock className="h-3 w-3" />
                {s.reminder_time.slice(0, 5)}
              </span>
            )}

            {/* Location badge with color dot */}
            {location && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: `${location.color}20`,
                  color: location.color,
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: location.color }} />
                {location.name}
                {s.location_trigger_type === "leave" ? (
                  <LogOut className="h-2.5 w-2.5 ml-0.5" />
                ) : (
                  <LogIn className="h-2.5 w-2.5 ml-0.5" />
                )}
              </span>
            )}
          </div>

          {/* Location selector (on hover) */}
          {locations.length > 0 && (
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <select
                  value={s.location_id ?? ""}
                  onChange={(e) => onUpdateLocation(e.target.value)}
                  className="h-6 flex-1 rounded border border-border bg-background px-1 text-[11px] text-muted-foreground focus:outline-none"
                >
                  <option value="">No location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              {/* Arrive / Leave toggle — only when location is set */}
              {s.location_id && (
                <div className="ml-5 flex gap-1.5">
                  <button
                    onClick={() => onUpdateTriggerType("arrive")}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-all ${
                      s.location_trigger_type !== "leave"
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <LogIn className="h-2.5 w-2.5" /> Arrive
                  </button>
                  <button
                    onClick={() => onUpdateTriggerType("leave")}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-all ${
                      s.location_trigger_type === "leave"
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <LogOut className="h-2.5 w-2.5" /> Leave
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-0.5">
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

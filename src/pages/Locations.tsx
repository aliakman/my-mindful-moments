/**
 * Locations — Manage saved places for location-based reminders.
 * Supports colored dot indicators, trigger type (arrive/leave), and custom radius.
 */
import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ArrowLeft, Plus, MapPin, Trash2, Navigation } from "lucide-react";
import { LOCATION_COLORS, getNextColor } from "@/lib/locationColors";

interface UserLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  color: string;
}

const Locations = () => {
  const { user, loading } = useAuth();
  const { position, permissionStatus, requestPosition, loading: geoLoading } = useGeolocation();
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState(200);
  const [selectedColor, setSelectedColor] = useState(LOCATION_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserLocation | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchLocations();
  }, [user]);

  const fetchLocations = async () => {
    const { data } = await supabase
      .from("user_locations")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setLocations(data as UserLocation[]);
    }
  };

  // Auto-fill form when position is available
  useEffect(() => {
    if (position && showForm && !lat && !lng) {
      setLat(position.latitude.toFixed(6));
      setLng(position.longitude.toFixed(6));
    }
  }, [position, showForm]);

  // Auto-pick next unused color when opening form
  useEffect(() => {
    if (showForm) {
      setSelectedColor(getNextColor(locations.map((l) => l.color)));
    }
  }, [showForm]);

  const saveLocation = async () => {
    if (!name.trim() || !lat || !lng || !user) return;
    setSaving(true);
    const { error } = await supabase.from("user_locations").insert({
      user_id: user.id,
      name: name.trim(),
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      radius_meters: radius,
      color: selectedColor,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      resetForm();
      fetchLocations();
      toast({ title: "Location saved", description: `"${name.trim()}" added to your places.` });
    }
    setSaving(false);
  };

  const deleteLocation = async () => {
    if (!deleteTarget) return;
    await supabase.from("user_locations").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    fetchLocations();
  };

  const resetForm = () => {
    setShowForm(false);
    setName("");
    setLat("");
    setLng("");
    setRadius(200);
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
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <Link to="/settings" className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight">My Locations</h1>
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
              {locations.length} saved place{locations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Permission banner */}
        {permissionStatus === "denied" && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-fade-in">
            📍 Location access denied. Enable it in your device settings to use location-based reminders.
          </div>
        )}

        {/* Add form */}
        {showForm ? (
          <div className="mb-6 space-y-4 rounded-xl bg-card p-4 border border-border animate-fade-in">
            <Input
              placeholder="Location name (e.g., Home, Work, Gym)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="bg-background"
            />

            {/* Color picker */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Color indicator</p>
              <div className="flex gap-2 flex-wrap">
                {LOCATION_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`h-7 w-7 rounded-full transition-all ${
                      selectedColor === color ? "ring-2 ring-offset-2 ring-foreground/30 scale-110" : "opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => requestPosition()}
              disabled={geoLoading}
              className="w-full gap-2"
            >
              <Navigation className="h-4 w-4" />
              {geoLoading ? "Getting location..." : "Use Current Location"}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="40.7128"
                  className="h-9 bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="-74.0060"
                  className="h-9 bg-background text-sm"
                />
              </div>
            </div>

            {/* Trigger type */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Trigger radius: <span className="font-semibold text-foreground">{radius}m</span>
              </label>
              <Slider
                value={[radius]}
                onValueChange={(v) => setRadius(v[0])}
                min={50}
                max={1000}
                step={50}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>50m</span>
                <span>500m</span>
                <span>1km</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveLocation} disabled={saving} size="sm" className="px-4">
                {saving ? "Saving..." : "Save Location"}
              </Button>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => { setShowForm(true); requestPosition(); }}
            variant="outline"
            className="mb-6 w-full gap-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        )}

        {/* Locations list */}
        {locations.length === 0 ? (
          <div className="mt-20 text-center animate-fade-in">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No saved locations</p>
            <p className="text-xs text-muted-foreground/60">Add places like Home or Work for location reminders</p>
          </div>
        ) : (
          <div className="space-y-2">
            {locations.map((loc, i) => (
              <div
                key={loc.id}
                className="group flex items-center gap-3 rounded-xl bg-card p-4 animate-fade-in border border-border/50"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Color dot */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${loc.color}20` }}
                >
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: loc.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{loc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    <span className="mx-1">·</span>
                    <span>{loc.radius_meters}m radius</span>
                  </p>
                </div>
                <button
                  onClick={() => setDeleteTarget(loc)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tip */}
        {locations.length > 0 && (
          <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
            Tip: Assign these locations to sentences in your collections for automatic location-based reminders.
          </p>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete location?"
        description={`"${deleteTarget?.name}" will be removed. Sentences linked to it will keep their text but lose the location trigger.`}
        onConfirm={deleteLocation}
      />
    </div>
  );
};

export default Locations;

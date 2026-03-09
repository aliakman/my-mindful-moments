/**
 * Locations — Manage saved places for location-based reminders.
 * Interactive Leaflet map picker, GPS auto-fill, custom radius.
 */
import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ArrowLeft, Plus, MapPin, Trash2, Navigation, ChevronDown, ChevronUp } from "lucide-react";
import { LOCATION_COLORS, getNextColor } from "@/lib/locationColors";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const LOG = "[Locations]";

// Fix Leaflet default marker icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface UserLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  color: string;
}

/** Handles map click → sets picked coordinates */
const MapClickHandler = ({ onPick }: { onPick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      console.log(`${LOG} Map tapped: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`);
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

/** Flies map to a new center without remounting */
const MapFlyTo = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  const prevCenter = useRef(center);
  useEffect(() => {
    if (center[0] !== prevCenter.current[0] || center[1] !== prevCenter.current[1]) {
      map.flyTo(center, 15, { duration: 0.8 });
      prevCenter.current = center;
    }
  }, [center, map]);
  return null;
};

const Locations = () => {
  const { user, loading } = useAuth();
  const { position, permissionStatus, requestPosition, loading: geoLoading } = useGeolocation();
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radius, setRadius] = useState(200);
  const [selectedColor, setSelectedColor] = useState(LOCATION_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserLocation | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchLocations();
  }, [user]);

  const fetchLocations = async () => {
    console.log(`${LOG} Fetching locations...`);
    const { data, error } = await supabase
      .from("user_locations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(`${LOG} Fetch error:`, error.message);
    }
    if (data) {
      console.log(`${LOG} Loaded ${data.length} locations`);
      setLocations(data as UserLocation[]);
    }
  };

  // Auto-fill GPS when form opens (only if no coords set yet)
  useEffect(() => {
    if (position && showForm && lat === null) {
      console.log(`${LOG} Auto-filling GPS: ${position.latitude}, ${position.longitude}`);
      setLat(position.latitude);
      setLng(position.longitude);
    }
  }, [position, showForm]);

  useEffect(() => {
    if (showForm) setSelectedColor(getNextColor(locations.map((l) => l.color)));
  }, [showForm]);

  const saveLocation = async () => {
    if (!name.trim() || lat === null || lng === null || !user) {
      console.warn(`${LOG} Save blocked: name=${name.trim()}, lat=${lat}, lng=${lng}`);
      return;
    }
    setSaving(true);
    console.log(`${LOG} Saving "${name.trim()}" at ${lat}, ${lng}, radius=${radius}m`);
    const { error } = await supabase.from("user_locations").insert({
      user_id: user.id,
      name: name.trim(),
      latitude: lat,
      longitude: lng,
      radius_meters: radius,
      color: selectedColor,
    });
    if (error) {
      console.error(`${LOG} Save error:`, error.message);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      console.log(`${LOG} Location saved successfully`);
      resetForm();
      fetchLocations();
      toast({ title: "Location saved", description: `"${name.trim()}" added.` });
    }
    setSaving(false);
  };

  const deleteLocation = async () => {
    if (!deleteTarget) return;
    console.log(`${LOG} Deleting location: ${deleteTarget.name}`);
    await supabase.from("user_locations").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    fetchLocations();
  };

  const resetForm = () => {
    setShowForm(false);
    setName("");
    setLat(null);
    setLng(null);
    setRadius(200);
    setShowAdvanced(false);
  };

  const handleUseCurrentLocation = async () => {
    console.log(`${LOG} Requesting GPS position...`);
    const pos = await requestPosition();
    if (pos) {
      console.log(`${LOG} GPS acquired: ${pos.latitude}, ${pos.longitude}`);
      setLat(pos.latitude);
      setLng(pos.longitude);
    } else {
      console.warn(`${LOG} GPS position unavailable`);
      toast({
        title: "Location unavailable",
        description: permissionStatus === "denied"
          ? "Location access denied. Enable it in your device settings."
          : "Could not get your position. Try again.",
        variant: "destructive",
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

  const mapCenter: [number, number] = lat !== null && lng !== null
    ? [lat, lng]
    : position ? [position.latitude, position.longitude]
    : [48.8566, 2.3522];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <Link
            to="/settings"
            aria-label="Back to settings"
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
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
              <p className="text-xs text-muted-foreground font-medium">Color indicator</p>
              <div className="flex gap-2 flex-wrap">
                {LOCATION_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select color ${color}`}
                    className={`h-8 w-8 rounded-full transition-all min-w-[32px] ${
                      selectedColor === color ? "ring-2 ring-offset-2 ring-foreground/40 scale-110" : "opacity-60 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Map picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">
                  {lat !== null ? `📍 ${lat.toFixed(5)}, ${lng?.toFixed(5)}` : "Tap the map to pick a location"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUseCurrentLocation}
                  disabled={geoLoading}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  {geoLoading ? "Locating..." : "Use GPS"}
                </Button>
              </div>

              {/* Interactive map — no key prop, uses flyTo instead */}
              <div className="rounded-xl overflow-hidden border border-border h-56">
                <MapContainer
                  center={mapCenter}
                  zoom={14}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={true}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onPick={(la, ln) => { setLat(la); setLng(ln); }} />
                  <MapFlyTo center={mapCenter} />
                  {lat !== null && lng !== null && (
                    <>
                      <Marker position={[lat, lng]} />
                      <Circle
                        center={[lat, lng]}
                        radius={radius}
                        pathOptions={{
                          color: selectedColor,
                          fillColor: selectedColor,
                          fillOpacity: 0.15,
                          weight: 2,
                        }}
                      />
                    </>
                  )}
                </MapContainer>
              </div>
              <p className="text-[11px] text-muted-foreground/60 text-center">
                Tap anywhere on the map to set the location
              </p>
            </div>

            {/* Advanced: radius */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Advanced settings</span>
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showAdvanced && (
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
            )}

            <div className="flex gap-2 pt-1">
              <Button
                onClick={saveLocation}
                disabled={saving || lat === null || !name.trim()}
                size="sm"
                className="h-11 px-5"
              >
                {saving ? "Saving..." : "Save Location"}
              </Button>
              <Button variant="ghost" size="sm" onClick={resetForm} className="h-11">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => { setShowForm(true); requestPosition(); }}
            variant="outline"
            className="mb-6 w-full h-11 gap-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        )}

        {/* Locations list */}
        {locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted mb-4">
              <MapPin className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="text-base font-semibold">No saved locations</p>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs">
              Add places like Home or Work to use location-based reminders
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {locations.map((loc, i) => (
              <div
                key={loc.id}
                className="group flex items-center gap-3 rounded-xl bg-card p-4 animate-fade-in border border-border/50"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${loc.color}20` }}
                >
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: loc.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{loc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    <span className="mx-1">·</span>
                    {loc.radius_meters}m radius
                  </p>
                </div>
                <button
                  onClick={() => setDeleteTarget(loc)}
                  aria-label={`Delete ${loc.name}`}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {locations.length > 0 && (
          <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
            Assign locations to sentences in your collections for automatic triggers.
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

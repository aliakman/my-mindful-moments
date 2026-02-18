/**
 * locationChecker — Checks user proximity to saved locations.
 * Supports arrive AND leave triggers with 30-min cooldown per alert.
 */
import { supabase } from "@/integrations/supabase/client";
import { getDistanceMeters } from "@/hooks/useGeolocation";

interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  color: string;
}

let watchId: number | null = null;

// Track which locations the user is currently "inside"
const insideLocations: Set<string> = new Set();
const sentLocationAlerts: Map<string, number> = new Map();
const COOLDOWN_MS = 30 * 60 * 1000; // 30 min cooldown per alert key

const sendNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
};

const checkProximity = async (lat: number, lng: number) => {
  const { data: locations } = await supabase
    .from("user_locations")
    .select("id, name, latitude, longitude, radius_meters, color");

  if (!locations || locations.length === 0) return;

  const now = Date.now();

  for (const loc of locations as SavedLocation[]) {
    const dist = getDistanceMeters(lat, lng, loc.latitude, loc.longitude);
    const wasInside = insideLocations.has(loc.id);
    const isNowInside = dist <= loc.radius_meters;

    // Detect transitions
    const justArrived = !wasInside && isNowInside;
    const justLeft = wasInside && !isNowInside;

    // Update inside-set
    if (isNowInside) insideLocations.add(loc.id);
    else insideLocations.delete(loc.id);

    if (!justArrived && !justLeft) continue;

    // Fetch sentences with matching trigger type for this location
    const triggerType = justArrived ? "arrive" : "leave";
    const { data: sentences } = await supabase
      .from("sentences")
      .select("id, text, location_id, collection_id, location_trigger_type")
      .eq("location_id", loc.id)
      .eq("is_active", true)
      .eq("location_trigger_type", triggerType);

    if (!sentences || sentences.length === 0) continue;

    // Get collection names
    const collectionIds = [...new Set(sentences.map((s) => s.collection_id))];
    const { data: collections } = await supabase
      .from("collections")
      .select("id, name")
      .in("id", collectionIds);
    const colMap = new Map(collections?.map((c) => [c.id, c.name]) ?? []);

    for (const s of sentences) {
      const alertKey = `loc-${s.id}-${triggerType}`;
      const lastSent = sentLocationAlerts.get(alertKey) ?? 0;
      if (now - lastSent < COOLDOWN_MS) continue;

      const emoji = justArrived ? "📍" : "👋";
      const verb = justArrived ? "You arrived at" : "You left";
      sendNotification(
        colMap.get(s.collection_id) ?? "Reminder",
        `${emoji} ${verb} ${loc.name}: ${s.text}`
      );
      sentLocationAlerts.set(alertKey, now);
    }
  }
};

export const startLocationChecker = () => {
  if (watchId !== null) return;
  if (!("geolocation" in navigator)) return;

  watchId = navigator.geolocation.watchPosition(
    (pos) => checkProximity(pos.coords.latitude, pos.coords.longitude),
    () => {},
    { enableHighAccuracy: true, maximumAge: 60000, timeout: 30000 }
  );
};

export const stopLocationChecker = () => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  insideLocations.clear();
};

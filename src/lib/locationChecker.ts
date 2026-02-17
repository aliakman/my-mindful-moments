/**
 * locationChecker — Periodically checks if the user is near saved locations
 * and triggers notifications for sentences linked to those locations.
 */
import { supabase } from "@/integrations/supabase/client";
import { getDistanceMeters } from "@/hooks/useGeolocation";

interface LocationSentence {
  id: string;
  text: string;
  location_id: string;
  collection_name: string;
}

interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

let watchId: number | null = null;
const sentLocationAlerts: Map<string, number> = new Map();
const COOLDOWN_MS = 30 * 60 * 1000; // 30 min cooldown per sentence-location pair

const sendNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
};

const checkProximity = async (lat: number, lng: number) => {
  // Fetch user's saved locations
  const { data: locations } = await supabase
    .from("user_locations")
    .select("id, name, latitude, longitude, radius_meters");

  if (!locations || locations.length === 0) return;

  // Find which locations the user is currently inside
  const nearbyLocationIds: string[] = [];
  for (const loc of locations) {
    const dist = getDistanceMeters(lat, lng, loc.latitude, loc.longitude);
    if (dist <= loc.radius_meters) {
      nearbyLocationIds.push(loc.id);
    }
  }

  if (nearbyLocationIds.length === 0) return;

  // Fetch active sentences linked to nearby locations
  const { data: sentences } = await supabase
    .from("sentences")
    .select("id, text, location_id, collection_id")
    .in("location_id", nearbyLocationIds)
    .eq("is_active", true);

  if (!sentences || sentences.length === 0) return;

  // Get collection names for the notification title
  const collectionIds = [...new Set(sentences.map((s) => s.collection_id))];
  const { data: collections } = await supabase
    .from("collections")
    .select("id, name")
    .in("id", collectionIds);

  const colMap = new Map(collections?.map((c) => [c.id, c.name]) ?? []);

  // Send notifications respecting cooldown
  const now = Date.now();
  for (const s of sentences) {
    const key = `loc-${s.id}-${s.location_id}`;
    const lastSent = sentLocationAlerts.get(key) || 0;
    if (now - lastSent >= COOLDOWN_MS) {
      const locName = locations.find((l) => l.id === s.location_id)?.name ?? "a saved location";
      sendNotification(
        colMap.get(s.collection_id) ?? "Reminder",
        `📍 You're at ${locName}: ${s.text}`
      );
      sentLocationAlerts.set(key, now);
    }
  }
};

/** Start watching position and checking proximity to saved locations */
export const startLocationChecker = () => {
  if (watchId !== null) return;
  if (!("geolocation" in navigator)) return;

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      checkProximity(pos.coords.latitude, pos.coords.longitude);
    },
    () => {}, // silently ignore errors
    { enableHighAccuracy: true, maximumAge: 120000 }
  );
};

/** Stop watching */
export const stopLocationChecker = () => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
};

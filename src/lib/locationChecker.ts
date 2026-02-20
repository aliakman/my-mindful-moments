/**
 * locationChecker — Checks user proximity to saved locations.
 * Supports arrive AND leave triggers with 30-min cooldown per alert.
 * Includes robust error handling, logging, and Capacitor native support.
 */
import { supabase } from "@/integrations/supabase/client";
import { getDistanceMeters } from "@/hooks/useGeolocation";

const LOG_PREFIX = "[LocationChecker]";

interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  color: string;
}

let watchId: number | null = null;
let capacitorWatchId: string | null = null;

// Track which locations the user is currently "inside"
const insideLocations: Set<string> = new Set();
const sentLocationAlerts: Map<string, number> = new Map();
const COOLDOWN_MS = 30 * 60 * 1000; // 30 min cooldown per alert key

const isNative = () =>
  typeof (window as any).Capacitor !== "undefined" &&
  (window as any).Capacitor.isNativePlatform?.();

const sendNotification = async (title: string, body: string) => {
  console.log(`${LOG_PREFIX} Sending notification: "${title}" — ${body}`);
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const { display } = await LocalNotifications.checkPermissions();
      if (display !== "granted") {
        console.warn(`${LOG_PREFIX} Native notification permission not granted`);
        return;
      }
      await LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(Math.random() * 100000),
          title,
          body,
          schedule: { at: new Date(Date.now() + 500) },
          sound: "default",
          smallIcon: "ic_stat_icon_config_sample",
        }],
      });
    } catch (e) {
      console.error(`${LOG_PREFIX} Native notification failed:`, e);
    }
    return;
  }
  // Web fallback
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
};

const checkProximity = async (lat: number, lng: number) => {
  try {
    console.log(`${LOG_PREFIX} Position update: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);

    const { data: locations, error } = await supabase
      .from("user_locations")
      .select("id, name, latitude, longitude, radius_meters, color");

    if (error) {
      console.error(`${LOG_PREFIX} Failed to fetch locations:`, error.message);
      return;
    }
    if (!locations || locations.length === 0) return;

    const now = Date.now();

    for (const loc of locations as SavedLocation[]) {
      const dist = getDistanceMeters(lat, lng, loc.latitude, loc.longitude);
      const wasInside = insideLocations.has(loc.id);
      const isNowInside = dist <= loc.radius_meters;

      const justArrived = !wasInside && isNowInside;
      const justLeft = wasInside && !isNowInside;

      if (isNowInside) insideLocations.add(loc.id);
      else insideLocations.delete(loc.id);

      if (!justArrived && !justLeft) continue;

      const triggerType = justArrived ? "arrive" : "leave";
      console.log(`${LOG_PREFIX} Transition: ${triggerType} at "${loc.name}" (dist=${Math.round(dist)}m, radius=${loc.radius_meters}m)`);

      const { data: sentences, error: sErr } = await supabase
        .from("sentences")
        .select("id, text, location_id, collection_id, location_trigger_type")
        .eq("location_id", loc.id)
        .eq("is_active", true)
        .eq("location_trigger_type", triggerType);

      if (sErr) {
        console.error(`${LOG_PREFIX} Failed to fetch sentences for loc ${loc.id}:`, sErr.message);
        continue;
      }
      if (!sentences || sentences.length === 0) continue;

      const collectionIds = [...new Set(sentences.map((s) => s.collection_id))];
      const { data: collections } = await supabase
        .from("collections")
        .select("id, name")
        .in("id", collectionIds);
      const colMap = new Map(collections?.map((c) => [c.id, c.name]) ?? []);

      for (const s of sentences) {
        const alertKey = `loc-${s.id}-${triggerType}`;
        const lastSent = sentLocationAlerts.get(alertKey) ?? 0;
        if (now - lastSent < COOLDOWN_MS) {
          console.log(`${LOG_PREFIX} Cooldown active for alert ${alertKey}`);
          continue;
        }

        const emoji = justArrived ? "📍" : "👋";
        const verb = justArrived ? "You arrived at" : "You left";
        await sendNotification(
          colMap.get(s.collection_id) ?? "Reminder",
          `${emoji} ${verb} ${loc.name}: ${s.text}`
        );
        sentLocationAlerts.set(alertKey, now);
      }
    }
  } catch (err) {
    console.error(`${LOG_PREFIX} checkProximity error:`, err);
  }
};

export const startLocationChecker = async () => {
  if (watchId !== null || capacitorWatchId !== null) {
    console.log(`${LOG_PREFIX} Already running`);
    return;
  }

  if (isNative()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      // Request permissions first
      const permResult = await Geolocation.requestPermissions();
      if (permResult.location !== "granted" && permResult.coarseLocation !== "granted") {
        console.warn(`${LOG_PREFIX} Native geolocation permission denied`);
        return;
      }
      capacitorWatchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true },
        (position, err) => {
          if (err) {
            console.error(`${LOG_PREFIX} Native watch error:`, err);
            return;
          }
          if (position) {
            checkProximity(position.coords.latitude, position.coords.longitude);
          }
        }
      );
      console.log(`${LOG_PREFIX} Native geolocation watch started (id: ${capacitorWatchId})`);
    } catch (e) {
      console.error(`${LOG_PREFIX} Failed to start native geolocation:`, e);
    }
    return;
  }

  // Web fallback
  if (!("geolocation" in navigator)) {
    console.warn(`${LOG_PREFIX} Geolocation API not available`);
    return;
  }

  try {
    watchId = navigator.geolocation.watchPosition(
      (pos) => checkProximity(pos.coords.latitude, pos.coords.longitude),
      (err) => console.error(`${LOG_PREFIX} Web geolocation error: ${err.message} (code ${err.code})`),
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 30000 }
    );
    console.log(`${LOG_PREFIX} Web geolocation watch started (id: ${watchId})`);
  } catch (e) {
    console.error(`${LOG_PREFIX} Failed to start web geolocation:`, e);
  }
};

export const stopLocationChecker = async () => {
  if (isNative() && capacitorWatchId !== null) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      await Geolocation.clearWatch({ id: capacitorWatchId });
      console.log(`${LOG_PREFIX} Native geolocation watch stopped`);
    } catch (e) {
      console.error(`${LOG_PREFIX} Failed to clear native watch:`, e);
    }
    capacitorWatchId = null;
  }

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    console.log(`${LOG_PREFIX} Web geolocation watch stopped`);
    watchId = null;
  }
  insideLocations.clear();
};

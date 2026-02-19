import { supabase } from "@/integrations/supabase/client";

// Detect if running inside Capacitor (native iOS/Android)
const isNative = () =>
  typeof (window as any).Capacitor !== "undefined" &&
  (window as any).Capacitor.isNativePlatform?.();

interface ScheduledCollection {
  id: string;
  name: string;
  reminder_type: string;
  active_hours_mode: string;
  active_hours_start: string;
  active_hours_end: string;
  interval_hours: number;
}

interface Sentence {
  id: string;
  text: string;
  reminder_time: string | null;
  is_active: boolean;
}

let intervalId: ReturnType<typeof setInterval> | null = null;
const lastSentTimes: Map<string, number> = new Map();

// ─── Permission ───────────────────────────────────────────────────────────────

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const result = await LocalNotifications.requestPermissions();
      return result.display === "granted";
    } catch {
      return false;
    }
  }
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

// ─── Send notification (native or web) ───────────────────────────────────────

const sendNotification = async (title: string, body: string) => {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const { display } = await LocalNotifications.checkPermissions();
      if (display !== "granted") return;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 100000),
            title,
            body,
            schedule: { at: new Date(Date.now() + 500) }, // fire ~immediately
            sound: "default",
            smallIcon: "ic_stat_icon_config_sample",
          },
        ],
      });
    } catch (e) {
      console.warn("Native notification failed:", e);
    }
    return;
  }
  // Web fallback
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });
  }
};

// ─── Active hours check ───────────────────────────────────────────────────────

const isWithinActiveHours = (collection: ScheduledCollection): boolean => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (collection.active_hours_mode === "always") return true;
  const start = collection.active_hours_mode === "default" ? "08:00" : collection.active_hours_start;
  const end = collection.active_hours_mode === "default" ? "22:00" : collection.active_hours_end;
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  return currentMinutes >= startH * 60 + startM && currentMinutes <= endH * 60 + endM;
};

// ─── Reminder logic ───────────────────────────────────────────────────────────

const getRandomSentence = (sentences: Sentence[]): Sentence | null => {
  const active = sentences.filter((s) => s.is_active);
  if (active.length === 0) return null;
  return active[Math.floor(Math.random() * active.length)];
};

const checkFixedReminders = (sentences: Sentence[], collectionName: string) => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  sentences
    .filter((s) => s.is_active && s.reminder_time)
    .forEach((s) => {
      const reminderHHMM = s.reminder_time!.slice(0, 5);
      if (reminderHHMM === currentTime) {
        const key = `fixed-${s.id}-${currentTime}`;
        if (!lastSentTimes.has(key)) {
          sendNotification(collectionName, s.text);
          lastSentTimes.set(key, Date.now());
        }
      }
    });
};

const checkRandomReminder = (sentences: Sentence[], collection: ScheduledCollection) => {
  if (!isWithinActiveHours(collection)) return;
  const key = `random-${collection.id}`;
  const lastSent = lastSentTimes.get(key) || 0;
  if (Date.now() - lastSent < 15 * 60 * 1000) return;
  if (Math.random() < 0.03) {
    const sentence = getRandomSentence(sentences);
    if (sentence) {
      sendNotification(collection.name, sentence.text);
      lastSentTimes.set(key, Date.now());
    }
  }
};

const checkIntervalReminder = (sentences: Sentence[], collection: ScheduledCollection) => {
  if (!isWithinActiveHours(collection)) return;
  const key = `interval-${collection.id}`;
  const lastSent = lastSentTimes.get(key) || 0;
  const intervalMs = collection.interval_hours * 60 * 60 * 1000;
  if (Date.now() - lastSent >= intervalMs) {
    const sentence = getRandomSentence(sentences);
    if (sentence) {
      sendNotification(collection.name, sentence.text);
      lastSentTimes.set(key, Date.now());
    }
  }
};

// ─── Scheduler loop ───────────────────────────────────────────────────────────

const checkAllReminders = async () => {
  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, reminder_type, active_hours_mode, active_hours_start, active_hours_end, interval_hours")
    .neq("reminder_type", "none");
  if (!collections || collections.length === 0) return;
  for (const col of collections) {
    const { data: sentences } = await supabase
      .from("sentences")
      .select("id, text, reminder_time, is_active")
      .eq("collection_id", col.id);
    if (!sentences || sentences.length === 0) continue;
    switch (col.reminder_type) {
      case "fixed": checkFixedReminders(sentences, col.name); break;
      case "random": checkRandomReminder(sentences, col); break;
      case "random_interval": checkIntervalReminder(sentences, col); break;
    }
  }
};

const cleanOldEntries = () => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, time] of lastSentTimes.entries()) {
    if (key.startsWith("fixed-") && time < oneHourAgo) lastSentTimes.delete(key);
  }
};

export const startNotificationScheduler = () => {
  if (intervalId) return;
  intervalId = setInterval(() => {
    checkAllReminders();
    cleanOldEntries();
  }, 60 * 1000);
  checkAllReminders();
};

export const stopNotificationScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

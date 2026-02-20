/**
 * Sample collections with realistic dummy data covering all reminder types,
 * including location-based examples.
 */
import { supabase } from "@/integrations/supabase/client";

interface SampleSentence {
  text: string;
  reminder_time?: string;
  is_active: boolean;
  /** If set, will be linked to a sample location by name */
  location_name?: string;
  location_trigger_type?: "arrive" | "leave";
}

interface SampleCollection {
  name: string;
  reminder_type: string;
  active_hours_mode: string;
  active_hours_start: string;
  active_hours_end: string;
  interval_hours: number;
  preset_type?: string;
  sentences: SampleSentence[];
}

/** Sample locations to create for location-based reminders */
const SAMPLE_LOCATIONS = [
  { name: "Home", latitude: 48.8566, longitude: 2.3522, radius_meters: 200, color: "#6366f1" },
  { name: "Office", latitude: 48.8738, longitude: 2.2950, radius_meters: 300, color: "#f59e0b" },
  { name: "Supermarket", latitude: 48.8600, longitude: 2.3400, radius_meters: 150, color: "#10b981" },
  { name: "Gym", latitude: 48.8650, longitude: 2.3600, radius_meters: 200, color: "#ef4444" },
];

const SAMPLE_COLLECTIONS: SampleCollection[] = [
  {
    name: "💧 Drink Water",
    reminder_type: "random_interval",
    active_hours_mode: "default",
    active_hours_start: "08:00",
    active_hours_end: "22:00",
    interval_hours: 2,
    sentences: [
      { text: "Drink a full glass of water right now 💧", is_active: true },
      { text: "Hydration check! Have you had water in the last hour?", is_active: true },
      { text: "Your body is 60% water — keep it that way! 🌊", is_active: true },
      { text: "A glass of water a day keeps the headaches away.", is_active: true },
      { text: "Feeling tired? Drink water first.", is_active: true },
    ],
  },
  {
    name: "🌅 Morning Routine",
    reminder_type: "fixed",
    active_hours_mode: "custom",
    active_hours_start: "06:00",
    active_hours_end: "10:00",
    interval_hours: 1,
    sentences: [
      { text: "Good morning! Take 5 deep breaths before you get up.", reminder_time: "07:00", is_active: true },
      { text: "Stretch your body for 3 minutes.", reminder_time: "07:15", is_active: true },
      { text: "Write one thing you're grateful for today.", reminder_time: "07:30", is_active: true },
      { text: "Don't forget to drink a glass of water after waking up.", reminder_time: "07:05", is_active: true },
      { text: "Review your top 3 goals for today.", reminder_time: "08:00", is_active: true },
    ],
  },
  {
    name: "💊 Medication",
    reminder_type: "fixed",
    active_hours_mode: "always",
    active_hours_start: "08:00",
    active_hours_end: "22:00",
    interval_hours: 1,
    sentences: [
      { text: "Take your morning vitamins 💊", reminder_time: "08:00", is_active: true },
      { text: "Time for your afternoon medication.", reminder_time: "14:00", is_active: true },
      { text: "Evening dose — don't forget!", reminder_time: "20:00", is_active: true },
      { text: "Check: did you take all your medications today?", reminder_time: "21:30", is_active: true },
      { text: "Refill prescription if you have less than 7 days left.", reminder_time: "09:00", is_active: false },
    ],
  },
  {
    name: "🏋️ Fitness",
    reminder_type: "random",
    active_hours_mode: "custom",
    active_hours_start: "06:00",
    active_hours_end: "21:00",
    interval_hours: 3,
    sentences: [
      { text: "Stand up and do 10 jumping jacks! 🏋️", is_active: true },
      { text: "Take a 5-minute walk outside.", is_active: true },
      { text: "Do 15 push-ups right now. You've got this!", is_active: true },
      { text: "Stretch your shoulders and neck — you've been sitting too long.", is_active: true },
      { text: "It's time to crush your workout! 💪", is_active: true },
      { text: "30-second plank. Start now!", is_active: true },
    ],
  },
  {
    name: "💡 Motivation",
    reminder_type: "random",
    active_hours_mode: "default",
    active_hours_start: "08:00",
    active_hours_end: "22:00",
    interval_hours: 4,
    sentences: [
      { text: "The best time to start was yesterday. The second best time is now.", is_active: true },
      { text: "Small steps every day lead to massive results.", is_active: true },
      { text: "You are capable of amazing things. Believe it.", is_active: true },
      { text: "Discipline beats motivation. Show up anyway.", is_active: true },
      { text: "Progress, not perfection.", is_active: true },
      { text: "Your future self will thank you for what you do today.", is_active: true },
    ],
  },
  {
    name: "📚 Study / Focus",
    reminder_type: "fixed",
    active_hours_mode: "custom",
    active_hours_start: "09:00",
    active_hours_end: "18:00",
    interval_hours: 1,
    sentences: [
      { text: "Start your Pomodoro session — 25 minutes of deep focus.", reminder_time: "09:00", is_active: true },
      { text: "Take a 5-minute break. Stand up and breathe.", reminder_time: "09:30", is_active: true },
      { text: "Review your notes from the last session.", reminder_time: "11:00", is_active: true },
      { text: "Close all tabs except the one you need.", reminder_time: "14:00", is_active: true },
      { text: "End-of-day review: what did you learn today?", reminder_time: "17:30", is_active: true },
    ],
  },
  {
    name: "😴 Wind Down",
    reminder_type: "fixed",
    active_hours_mode: "custom",
    active_hours_start: "20:00",
    active_hours_end: "23:59",
    interval_hours: 1,
    sentences: [
      { text: "Put your phone face down. Screen-free hour starts now.", reminder_time: "21:00", is_active: true },
      { text: "Prepare your clothes for tomorrow.", reminder_time: "21:15", is_active: true },
      { text: "Write down 3 wins from today.", reminder_time: "21:30", is_active: true },
      { text: "Lights out target: 10:30 PM. Start wrapping up.", reminder_time: "22:00", is_active: true },
      { text: "Read one chapter of your book before sleeping.", reminder_time: "22:15", is_active: true },
    ],
  },
  {
    name: "🌿 Mindfulness",
    reminder_type: "random_interval",
    active_hours_mode: "default",
    active_hours_start: "08:00",
    active_hours_end: "22:00",
    interval_hours: 3,
    sentences: [
      { text: "Take 3 slow, deep breaths. Inhale for 4, hold for 4, exhale for 8.", is_active: true },
      { text: "Notice 5 things you can see right now.", is_active: true },
      { text: "How are you feeling in this moment? Name it.", is_active: true },
      { text: "Unclench your jaw. Relax your shoulders.", is_active: true },
      { text: "You are here. You are enough. Breathe.", is_active: true },
    ],
  },
  // ─── Location-based collections ───────────────────────────────────────
  {
    name: "🏠 Home Arrival",
    reminder_type: "none",
    active_hours_mode: "always",
    active_hours_start: "00:00",
    active_hours_end: "23:59",
    interval_hours: 1,
    sentences: [
      { text: "Welcome home! Take off your shoes and relax 🏠", is_active: true, location_name: "Home", location_trigger_type: "arrive" },
      { text: "Check the mailbox — you might have packages!", is_active: true, location_name: "Home", location_trigger_type: "arrive" },
      { text: "Time to take your evening medication 💊", is_active: true, location_name: "Home", location_trigger_type: "arrive" },
    ],
  },
  {
    name: "🏢 Leaving Office",
    reminder_type: "none",
    active_hours_mode: "always",
    active_hours_start: "00:00",
    active_hours_end: "23:59",
    interval_hours: 1,
    sentences: [
      { text: "Don't forget your lunch bag and water bottle!", is_active: true, location_name: "Office", location_trigger_type: "leave" },
      { text: "Great work today! Time to decompress 🎉", is_active: true, location_name: "Office", location_trigger_type: "leave" },
      { text: "Check your calendar for tomorrow's first meeting.", is_active: true, location_name: "Office", location_trigger_type: "leave" },
    ],
  },
  {
    name: "🛒 Shopping List",
    reminder_type: "none",
    active_hours_mode: "always",
    active_hours_start: "00:00",
    active_hours_end: "23:59",
    interval_hours: 1,
    sentences: [
      { text: "Buy milk, eggs, and bread 🥛🥚🍞", is_active: true, location_name: "Supermarket", location_trigger_type: "arrive" },
      { text: "Check if you need more fruits and vegetables.", is_active: true, location_name: "Supermarket", location_trigger_type: "arrive" },
      { text: "Don't forget the coffee beans! ☕", is_active: true, location_name: "Supermarket", location_trigger_type: "arrive" },
    ],
  },
  {
    name: "💪 Gym Motivation",
    reminder_type: "none",
    active_hours_mode: "always",
    active_hours_start: "00:00",
    active_hours_end: "23:59",
    interval_hours: 1,
    sentences: [
      { text: "You showed up — that's 90% of the work! Let's go 💪", is_active: true, location_name: "Gym", location_trigger_type: "arrive" },
      { text: "Remember: warm up for 5 minutes before lifting.", is_active: true, location_name: "Gym", location_trigger_type: "arrive" },
      { text: "Today's focus: consistency over intensity.", is_active: true, location_name: "Gym", location_trigger_type: "arrive" },
    ],
  },
];

export const seedSampleData = async (userId: string): Promise<{ collections: number; sentences: number }> => {
  let totalCollections = 0;
  let totalSentences = 0;

  // 1. Create sample locations
  const locationMap = new Map<string, string>(); // name -> id

  for (const loc of SAMPLE_LOCATIONS) {
    const { data: existing } = await supabase
      .from("user_locations")
      .select("id")
      .eq("user_id", userId)
      .eq("name", loc.name)
      .maybeSingle();

    if (existing) {
      locationMap.set(loc.name, existing.id);
      continue;
    }

    const { data: newLoc, error } = await supabase
      .from("user_locations")
      .insert({
        user_id: userId,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius_meters: loc.radius_meters,
        color: loc.color,
      })
      .select("id")
      .single();

    if (!error && newLoc) {
      locationMap.set(loc.name, newLoc.id);
    }
  }

  // 2. Create collections and sentences
  for (const col of SAMPLE_COLLECTIONS) {
    const { data: newCol, error } = await supabase
      .from("collections")
      .insert({
        user_id: userId,
        name: col.name,
        reminder_type: col.reminder_type,
        active_hours_mode: col.active_hours_mode,
        active_hours_start: col.active_hours_start,
        active_hours_end: col.active_hours_end,
        interval_hours: col.interval_hours,
      })
      .select("id")
      .single();

    if (error || !newCol) continue;
    totalCollections++;

    const rows = col.sentences.map((s) => ({
      collection_id: newCol.id,
      text: s.text,
      reminder_time: s.reminder_time ?? null,
      is_active: s.is_active,
      location_id: s.location_name ? (locationMap.get(s.location_name) ?? null) : null,
      location_trigger_type: s.location_trigger_type ?? "arrive",
    }));

    const { error: sErr } = await supabase.from("sentences").insert(rows);
    if (!sErr) totalSentences += rows.length;
  }

  return { collections: totalCollections, sentences: totalSentences };
};

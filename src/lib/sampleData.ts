/**
 * Sample collections with realistic dummy data covering all reminder types.
 * Used to demonstrate app features to new users.
 */
import { supabase } from "@/integrations/supabase/client";

interface SampleCollection {
  name: string;
  reminder_type: string;
  active_hours_mode: string;
  active_hours_start: string;
  active_hours_end: string;
  interval_hours: number;
  preset_type?: string;
  sentences: {
    text: string;
    reminder_time?: string;
    is_active: boolean;
  }[];
}

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
];

export const seedSampleData = async (userId: string): Promise<{ collections: number; sentences: number }> => {
  let totalCollections = 0;
  let totalSentences = 0;

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
    }));

    const { error: sErr } = await supabase.from("sentences").insert(rows);
    if (!sErr) totalSentences += rows.length;
  }

  return { collections: totalCollections, sentences: totalSentences };
};

/**
 * exportImport — Export collections & sentences as JSON, and import them back.
 */
import { supabase } from "@/integrations/supabase/client";

interface ExportData {
  version: 1;
  exportedAt: string;
  collections: {
    name: string;
    reminder_type: string;
    active_hours_mode: string;
    active_hours_start: string;
    active_hours_end: string;
    interval_hours: number;
    sentences: {
      text: string;
      reminder_time: string | null;
      is_active: boolean;
    }[];
  }[];
}

/** Export all user data as a JSON blob */
export const exportData = async (): Promise<string> => {
  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, reminder_type, active_hours_mode, active_hours_start, active_hours_end, interval_hours");

  if (!collections) throw new Error("Failed to fetch collections");

  const result: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    collections: [],
  };

  for (const col of collections) {
    const { data: sentences } = await supabase
      .from("sentences")
      .select("text, reminder_time, is_active")
      .eq("collection_id", col.id);

    result.collections.push({
      name: col.name,
      reminder_type: col.reminder_type,
      active_hours_mode: col.active_hours_mode,
      active_hours_start: col.active_hours_start,
      active_hours_end: col.active_hours_end,
      interval_hours: col.interval_hours,
      sentences: sentences ?? [],
    });
  }

  return JSON.stringify(result, null, 2);
};

/** Download the export as a file */
export const downloadExport = async () => {
  const json = await exportData();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `remind-me-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

/** Import data from a JSON file, merging into existing data */
export const importData = async (file: File, userId: string): Promise<{ collections: number; sentences: number }> => {
  const text = await file.text();
  const data: ExportData = JSON.parse(text);

  if (data.version !== 1) throw new Error("Unsupported export version");

  let totalCollections = 0;
  let totalSentences = 0;

  for (const col of data.collections) {
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

    if (col.sentences.length > 0) {
      const rows = col.sentences.map((s) => ({
        collection_id: newCol.id,
        text: s.text,
        reminder_time: s.reminder_time,
        is_active: s.is_active,
      }));
      const { error: sErr } = await supabase.from("sentences").insert(rows);
      if (!sErr) totalSentences += rows.length;
    }
  }

  return { collections: totalCollections, sentences: totalSentences };
};

/**
 * A palette of distinct colors for location dot indicators.
 * Users get auto-assigned colors, and can see them as dots in the UI.
 */
export const LOCATION_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
];

export const getNextColor = (usedColors: string[]): string => {
  const available = LOCATION_COLORS.find((c) => !usedColors.includes(c));
  return available ?? LOCATION_COLORS[usedColors.length % LOCATION_COLORS.length];
};

export const ACCENT_COLORS = [
  "#00f0ff",
  "#ff3e6c",
  "#a855f7",
  "#22d65e",
  "#ff9f1c",
  "#3b82f6",
  "#f472b6",
  "#facc15",
  "#14b8a6",
  "#e879f9",
  "#fb7185",
  "#38bdf8",
  "#4ade80",
  "#f97316",
  "#818cf8",
];

export function getAccentColor(index: number): string {
  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}

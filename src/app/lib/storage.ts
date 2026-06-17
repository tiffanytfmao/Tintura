// ─── Canonical types ──────────────────────────────────────────────────────────

export interface RollEntry {
  id: string;
  photo: string | null; // base64 data URL
  note: string;
  timestamp: string; // ISO 8601
}

export interface DiaryEntry {
  id: string;
  photo: string | null; // base64 data URL or seed URL
  name: string; // "[ANCHOR]. [observation sentence]"
  swatches: string[]; // hex colors, 1–5
  timestamp: string; // ISO 8601
  location: string; // human-readable, empty string if unknown
  isBlend: boolean;
  blendSources?: [string, string];
  blendPhotos?: [string | null, string | null];
}

// ─── Seed entry ───────────────────────────────────────────────────────────────

const SEED: DiaryEntry = {
  id: "seed_tintura_001",
  photo:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=1067&fit=crop&auto=format",
  name: "Morning light. The coffee had three colours and none of them were brown.",
  swatches: ["#C8956C", "#F0D4B0", "#6B3D2E", "#E8C89A", "#2C1810"],
  timestamp: "2025-06-01T07:23:00.000Z",
  location: "Home",
  isBlend: false,
};

// ─── Keys ─────────────────────────────────────────────────────────────────────

const DIARY_KEY = "tintura_diary";
const ROLL_KEY = "tintura_roll";

// ─── Diary ────────────────────────────────────────────────────────────────────

export function getDiary(): DiaryEntry[] {
  const raw = localStorage.getItem(DIARY_KEY);
  if (!raw) {
    setDiary([SEED]);
    return [SEED];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      setDiary([SEED]);
      return [SEED];
    }
    return parsed as DiaryEntry[];
  } catch {
    setDiary([SEED]);
    return [SEED];
  }
}

export function setDiary(entries: DiaryEntry[]): void {
  localStorage.setItem(DIARY_KEY, JSON.stringify(entries));
}

export function addToDiary(entry: DiaryEntry): void {
  setDiary([entry, ...getDiary()]);
}

export function updateDiaryEntry(id: string, updates: Partial<DiaryEntry>): void {
  setDiary(getDiary().map((e) => (e.id === id ? { ...e, ...updates } : e)));
}

export function removeDiaryEntry(id: string): void {
  setDiary(getDiary().filter((e) => e.id !== id));
}

// ─── Roll ─────────────────────────────────────────────────────────────────────

export function getRoll(): RollEntry[] {
  const raw = localStorage.getItem(ROLL_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RollEntry[];
  } catch {
    return [];
  }
}

export function setRoll(entries: RollEntry[]): void {
  localStorage.setItem(ROLL_KEY, JSON.stringify(entries));
}

export function addToRoll(entry: RollEntry): void {
  setRoll([entry, ...getRoll()]);
}

export function removeFromRoll(id: string): void {
  setRoll(getRoll().filter((e) => e.id !== id));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function splitName(name: string): { anchor: string; observation: string | null } {
  const dot = name.indexOf(". ");
  if (dot === -1) return { anchor: name, observation: null };
  return { anchor: name.slice(0, dot + 1), observation: name.slice(dot + 2) };
}

export type HueFamily = "warm" | "cool" | "neutral";

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

export function computeHue(swatches: string[]): HueFamily {
  if (!swatches.length) return "neutral";
  const [h, s] = hexToHsl(swatches[0]);
  if (s < 0.15) return "neutral";
  if (h <= 60 || h >= 300) return "warm"; // reds, oranges, yellows, pinks
  if (h > 80 && h < 170) return "neutral"; // yellow-greens
  if (h >= 170 && h < 300) return "cool"; // teals, blues, purples
  return "neutral";
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return `Today · ${time}`;
  if (diffDays === 1) return `Yesterday · ${time}`;
  return `${diffDays} days ago · ${time}`;
}

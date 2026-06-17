import { useState, useMemo } from "react";
import { Camera } from "lucide-react";
import { useNavigate } from "react-router";
import { DiaryCard } from "../components/DiaryCard";
import { SAMPLE_ENTRIES, type DiaryEntry, type HueFamily } from "../data/entries";

type SortMode = "time" | "color" | "place";

const HUE_LABELS: Record<HueFamily, string> = {
  warm: "Warm",
  cool: "Cool",
  neutral: "Neutral",
};

const HUE_ORDER: HueFamily[] = ["warm", "cool", "neutral"];

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 16, padding: "8px 0 4px" }}>
      <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 400, color: "var(--color-text-secondary)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--color-border-subtle)" }} />
    </div>
  );
}

function CaptureCTA({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}
    >
      <span style={{ fontSize: 16, fontWeight: 500, color: hovered ? "#1A1814" : "#C4A882", lineHeight: 1, transition: "color 150ms ease" }}>+</span>
      <span style={{ fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 13, color: hovered ? "#1A1814" : "#8C8880", transition: "color 150ms ease" }}>
        new color memory
      </span>
    </button>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 120, gap: 16 }}>
      <Camera size={20} strokeWidth={1.5} style={{ color: "var(--color-text-secondary)", opacity: 0.5 }} />
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontStyle: "italic", fontSize: 18, color: "var(--color-text-secondary)", margin: 0 }}>
        Nothing here yet. Go outside.
      </p>
      <CaptureCTA onClick={() => navigate("/capture")} />
    </div>
  );
}

type GridItem =
  | { type: "divider"; label: string; key: string }
  | { type: "card"; entry: DiaryEntry; key: string };

function buildTimeItems(entries: DiaryEntry[]): GridItem[] {
  return [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((e) => ({ type: "card", entry: e, key: e.id }));
}

function buildColorItems(entries: DiaryEntry[]): GridItem[] {
  const items: GridItem[] = [];
  for (const hue of HUE_ORDER) {
    const group = entries.filter((e) => e.hue === hue);
    if (group.length === 0) continue;
    items.push({ type: "divider", label: HUE_LABELS[hue], key: `divider-${hue}` });
    for (const e of group) items.push({ type: "card", entry: e, key: e.id });
  }
  return items;
}

function buildPlaceItems(entries: DiaryEntry[]): GridItem[] {
  const byLocation = new Map<string, DiaryEntry[]>();
  for (const e of entries) {
    if (!byLocation.has(e.location)) byLocation.set(e.location, []);
    byLocation.get(e.location)!.push(e);
  }
  const items: GridItem[] = [];
  for (const [loc, group] of [...byLocation.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    items.push({ type: "divider", label: loc, key: `divider-${loc}` });
    for (const e of group) items.push({ type: "card", entry: e, key: e.id });
  }
  return items;
}

export default function Diary() {
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortMode>("time");
  const [animating, setAnimating] = useState(false);
  const entries = SAMPLE_ENTRIES;

  const items = useMemo<GridItem[]>(() => {
    if (sort === "time") return buildTimeItems(entries);
    if (sort === "color") return buildColorItems(entries);
    return buildPlaceItems(entries);
  }, [sort, entries]);

  function handleSort(mode: SortMode) {
    if (mode === sort) return;
    setAnimating(true);
    setTimeout(() => { setSort(mode); setAnimating(false); }, 140);
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 48px 120px" }}>

      {/* Toolbar row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>

        {/* Sort toggle */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
          {(["time", "color", "place"] as SortMode[]).map((mode, i) => (
            <div key={mode} style={{ display: "flex", alignItems: "baseline" }}>
              <button
                onClick={() => handleSort(mode)}
                style={{
                  background: "none", border: "none", padding: "0 0 3px", cursor: "pointer",
                  fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 14,
                  color: sort === mode ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  borderBottom: sort === mode ? "1px solid var(--color-text-primary)" : "1px solid transparent",
                  transition: "color 180ms ease, border-color 180ms ease",
                  letterSpacing: "0.01em",
                }}
              >
                {mode === "time" ? "Time" : mode === "color" ? "Colour" : "Place"}
              </button>
              {i < 2 && (
                <span style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--color-border-subtle)", padding: "0 12px", userSelect: "none" }}>·</span>
              )}
            </div>
          ))}
        </div>

        {/* Right side: capture CTA + blend pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <CaptureCTA onClick={() => navigate("/capture")} />

          {/* Blend pill — navigates directly to /blend */}
          <button
            onClick={() => navigate("/blend")}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "transparent",
              border: "1px solid #C4A882", borderRadius: 20,
              padding: "4px 12px", cursor: "pointer",
              fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 12,
              color: "#C4A882", transition: "background 150ms ease", whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(196,168,130,0.08)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            ⊕ blend
          </button>
        </div>
      </div>

      {/* Responsive grid styles */}
      <style>{`
        .diary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; align-items: start; }
        @media (max-width: 1000px) { .diary-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      {/* Card grid */}
      <div
        className="diary-grid"
        style={{ opacity: animating ? 0 : 1, transform: animating ? "translateY(6px)" : "translateY(0)", transition: "opacity 180ms ease, transform 180ms ease" }}
      >
        {entries.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((item) =>
            item.type === "divider" ? (
              <SectionDivider key={item.key} label={item.label} />
            ) : (
              <DiaryCard key={item.key} entry={item.entry} />
            )
          )
        )}
      </div>
    </main>
  );
}

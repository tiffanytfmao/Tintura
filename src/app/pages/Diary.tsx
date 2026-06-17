import { useState, useMemo, useRef, useEffect } from "react";
import { Camera } from "lucide-react";
import { useNavigate } from "react-router";
import { DiaryCard } from "../components/DiaryCard";
import { getDiary, computeHue, type DiaryEntry, type HueFamily } from "../lib/storage";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortMode = "time" | "color" | "place";
type HueBucket = "red" | "orange" | "yellow" | "green" | "teal" | "blue" | "purple" | "neutral";
type BlendFilter = "blends" | "originals" | null;

const BUCKET_ORDER: HueBucket[] = ["red", "orange", "yellow", "green", "teal", "blue", "purple", "neutral"];
const BUCKET_LABELS: Record<HueBucket, string> = {
  red: "red", orange: "orange", yellow: "yellow", green: "green",
  teal: "teal", blue: "blue", purple: "purple", neutral: "neutral",
};

const HUE_LABELS: Record<HueFamily, string> = { warm: "Warm", cool: "Cool", neutral: "Neutral" };
const HUE_ORDER: HueFamily[] = ["warm", "cool", "neutral"];

// ─── Colour utilities ─────────────────────────────────────────────────────────

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToBucket(h: number, s: number): HueBucket {
  if (s < 15) return "neutral";
  if (h >= 330 || h < 20) return "red";
  if (h < 50) return "orange";
  if (h < 75) return "yellow";
  if (h < 165) return "green";
  if (h < 200) return "teal";
  if (h < 260) return "blue";
  return "purple";
}

function swatchBucket(hex: string): HueBucket {
  const { h, s } = hexToHsl(hex);
  return hslToBucket(h, s);
}

function averageHslColor(hsls: Array<{ h: number; s: number; l: number }>): string {
  const n = hsls.length;
  // Average hue using circular mean to handle 0°/360° wrap
  const sinSum = hsls.reduce((a, c) => a + Math.sin((c.h * Math.PI) / 180), 0);
  const cosSum = hsls.reduce((a, c) => a + Math.cos((c.h * Math.PI) / 180), 0);
  const avgH = ((Math.atan2(sinSum / n, cosSum / n) * 180) / Math.PI + 360) % 360;
  const avgS = hsls.reduce((a, c) => a + c.s, 0) / n;
  const avgL = hsls.reduce((a, c) => a + c.l, 0) / n;
  return `hsl(${Math.round(avgH)}, ${Math.round(avgS)}%, ${Math.round(avgL)}%)`;
}

// Compute which buckets exist in diary, and their representative avg color
function computeBuckets(entries: DiaryEntry[]): Map<HueBucket, string> {
  const bucketHsls = new Map<HueBucket, Array<{ h: number; s: number; l: number }>>();
  for (const entry of entries) {
    for (const swatch of entry.swatches) {
      if (!swatch.startsWith("#") || swatch.length !== 7) continue;
      const hsl = hexToHsl(swatch);
      const bucket = hslToBucket(hsl.h, hsl.s);
      if (!bucketHsls.has(bucket)) bucketHsls.set(bucket, []);
      bucketHsls.get(bucket)!.push(hsl);
    }
  }
  const result = new Map<HueBucket, string>();
  for (const [bucket, hsls] of bucketHsls) {
    result.set(bucket, averageHslColor(hsls));
  }
  return result;
}

// Does an entry match a set of active color buckets (OR logic)?
function entryMatchesBuckets(entry: DiaryEntry, active: Set<HueBucket>): boolean {
  if (active.size === 0) return true;
  return entry.swatches.some((hex) => {
    if (!hex.startsWith("#") || hex.length !== 7) return false;
    return active.has(swatchBucket(hex));
  });
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

type GridItem =
  | { type: "divider"; label: string; key: string }
  | { type: "card"; entry: DiaryEntry; key: string };

function buildTimeItems(entries: DiaryEntry[]): GridItem[] {
  return [...entries]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map((e) => ({ type: "card", entry: e, key: e.id }));
}

function buildColorItems(entries: DiaryEntry[]): GridItem[] {
  const items: GridItem[] = [];
  for (const hue of HUE_ORDER) {
    const group = entries.filter((e) => computeHue(e.swatches) === hue);
    if (group.length === 0) continue;
    items.push({ type: "divider", label: HUE_LABELS[hue], key: `divider-${hue}` });
    for (const e of group) items.push({ type: "card", entry: e, key: e.id });
  }
  return items;
}

function buildPlaceItems(entries: DiaryEntry[]): GridItem[] {
  const byLocation = new Map<string, DiaryEntry[]>();
  for (const e of entries) {
    const loc = e.location || "Unknown";
    if (!byLocation.has(loc)) byLocation.set(loc, []);
    byLocation.get(loc)!.push(e);
  }
  const items: GridItem[] = [];
  for (const [loc, group] of [...byLocation.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    items.push({ type: "divider", label: loc, key: `divider-${loc}` });
    for (const e of group) items.push({ type: "card", entry: e, key: e.id });
  }
  return items;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function FilterIcon({ active }: { active: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="1" y1="3" x2="12" y2="3" stroke={active ? "#C4A882" : "#8C8880"} strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="4.5" cy="3" r="1.5" fill={active ? "#C4A882" : "#8C8880"} />
      <line x1="1" y1="7" x2="12" y2="7" stroke={active ? "#C4A882" : "#8C8880"} strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="8.5" cy="7" r="1.5" fill={active ? "#C4A882" : "#8C8880"} />
      <line x1="1" y1="11" x2="12" y2="11" stroke={active ? "#C4A882" : "#8C8880"} strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="5.5" cy="11" r="1.5" fill={active ? "#C4A882" : "#8C8880"} />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Diary() {
  const navigate = useNavigate();

  // Sort
  const [sort, setSort] = useState<SortMode>("time");
  const [animating, setAnimating] = useState(false);

  // Filter UI state
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeColorBuckets, setActiveColorBuckets] = useState<Set<HueBucket>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [blendFilter, setBlendFilter] = useState<BlendFilter>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const hasActiveFilter =
    activeColorBuckets.size > 0 || selectedLocation !== null || blendFilter !== null;

  // Close location dropdown on outside click
  useEffect(() => {
    if (!locationOpen) return;
    function onDown(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [locationOpen]);

  // Read diary data
  const allEntries = useMemo(() => getDiary(), []);

  // Compute available buckets from actual diary data
  const availableBuckets = useMemo(() => computeBuckets(allEntries), [allEntries.length]);

  // Unique locations (non-empty)
  const locations = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const e of allEntries) {
      if (e.location && e.location.trim()) set.add(e.location.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [allEntries.length]);

  // Apply filters, then sort
  const filteredEntries = useMemo(() => {
    return allEntries.filter((e) => {
      if (!entryMatchesBuckets(e, activeColorBuckets)) return false;
      if (selectedLocation && e.location !== selectedLocation) return false;
      if (blendFilter === "blends" && !e.isBlend) return false;
      if (blendFilter === "originals" && e.isBlend) return false;
      return true;
    });
  }, [allEntries.length, activeColorBuckets, selectedLocation, blendFilter]);

  const items = useMemo<GridItem[]>(() => {
    if (sort === "time") return buildTimeItems(filteredEntries);
    if (sort === "color") return buildColorItems(filteredEntries);
    return buildPlaceItems(filteredEntries);
  }, [sort, filteredEntries]);

  function handleSort(mode: SortMode) {
    if (mode === sort) return;
    setAnimating(true);
    setTimeout(() => { setSort(mode); setAnimating(false); }, 140);
  }

  function toggleColorBucket(bucket: HueBucket) {
    setActiveColorBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(bucket)) next.delete(bucket); else next.add(bucket);
      return next;
    });
  }

  function clearAll() {
    setActiveColorBuckets(new Set());
    setSelectedLocation(null);
    setBlendFilter(null);
  }

  return (
    <main className="diary-main" style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* Toolbar row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: filterOpen ? 0 : 40 }}>

        {/* Left: sort toggle + divider + filter button */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>

          {/* Sort toggles */}
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

          {/* Vertical divider */}
          <div style={{ width: 1, height: 16, background: "#E8E4DC", margin: "0 16px" }} />

          {/* Filter toggle button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              title="Filter"
              style={{
                width: 30, height: 30, borderRadius: "50%",
                border: `1px solid ${filterOpen || hasActiveFilter ? "#C4A882" : "#E8E4DC"}`,
                background: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                transition: "border-color 150ms ease",
                padding: 0, flexShrink: 0,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#C4A882")}
              onMouseLeave={(e) => {
                if (!filterOpen && !hasActiveFilter) {
                  (e.currentTarget as HTMLElement).style.borderColor = "#E8E4DC";
                }
              }}
            >
              <FilterIcon active={filterOpen || hasActiveFilter} />
            </button>
            {/* Active notification dot */}
            {hasActiveFilter && (
              <div style={{
                position: "absolute", top: -3, right: -3,
                width: 6, height: 6, borderRadius: "50%",
                background: "#C4A882",
                border: "1.5px solid #F9F7F4",
                pointerEvents: "none",
              }} />
            )}
          </div>
        </div>

        {/* Right: blend pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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

      {/* Filter row */}
      {filterOpen && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          padding: "12px 0 16px",
          borderBottom: "1px solid #E8E4DC",
          marginBottom: 32,
        }}>

          {/* Hue family chips */}
          {BUCKET_ORDER.filter((b) => availableBuckets.has(b)).map((bucket) => {
            const active = activeColorBuckets.has(bucket);
            const avgColor = availableBuckets.get(bucket)!;
            return (
              <button
                key={bucket}
                onClick={() => toggleColorBucket(bucket)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  border: `1px solid ${active ? "#C4A882" : "#E8E4DC"}`,
                  borderRadius: 20, padding: "4px 10px",
                  fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 11,
                  color: active ? "#1A1814" : "#8C8880",
                  background: active ? "rgba(196,168,130,0.1)" : "white",
                  cursor: "pointer",
                  transition: "border-color 150ms ease, background 150ms ease, color 150ms ease",
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: avgColor, flexShrink: 0 }} />
                {BUCKET_LABELS[bucket]}
              </button>
            );
          })}

          {/* Vertical micro-divider between color and location chips */}
          {availableBuckets.size > 0 && (
            <div style={{ width: 1, height: 16, background: "#E8E4DC", margin: "0 4px", flexShrink: 0 }} />
          )}

          {/* Location chip */}
          {locations.length > 0 && (
            <div ref={locationRef} style={{ position: "relative" }}>
              <button
                onClick={() => setLocationOpen((v) => !v)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  border: `1px solid ${selectedLocation ? "#C4A882" : "#E8E4DC"}`,
                  borderRadius: 20, padding: "4px 10px",
                  fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 11,
                  color: selectedLocation ? "#1A1814" : "#8C8880",
                  background: selectedLocation ? "rgba(196,168,130,0.1)" : "white",
                  cursor: "pointer",
                  transition: "border-color 150ms ease, background 150ms ease, color 150ms ease",
                }}
              >
                📍 {selectedLocation || "location"}
                {selectedLocation && (
                  <span
                    onClick={(e) => { e.stopPropagation(); setSelectedLocation(null); setLocationOpen(false); }}
                    style={{ marginLeft: 2, fontWeight: 500, fontSize: 13, lineHeight: 1, opacity: 0.7, cursor: "pointer" }}
                  >
                    ×
                  </span>
                )}
              </button>

              {/* Location dropdown */}
              {locationOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0,
                  background: "white", border: "1px solid #E8E4DC", borderRadius: 6,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  zIndex: 100, minWidth: 180, overflow: "hidden",
                }}>
                  {locations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => { setSelectedLocation(loc); setLocationOpen(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "8px 14px",
                        background: selectedLocation === loc ? "rgba(196,168,130,0.08)" : "transparent",
                        border: "none", cursor: "pointer",
                        fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 12,
                        color: selectedLocation === loc ? "#1A1814" : "#4A4640",
                        transition: "background 120ms ease",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(196,168,130,0.06)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = selectedLocation === loc ? "rgba(196,168,130,0.08)" : "transparent")}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Blend status chips */}
          {(["blends", "originals"] as const).map((mode) => {
            const active = blendFilter === mode;
            return (
              <button
                key={mode}
                onClick={() => setBlendFilter((prev) => (prev === mode ? null : mode))}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  border: `1px solid ${active ? "#C4A882" : "#E8E4DC"}`,
                  borderRadius: 20, padding: "4px 10px",
                  fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 11,
                  color: active ? "#1A1814" : "#8C8880",
                  background: active ? "rgba(196,168,130,0.1)" : "white",
                  cursor: "pointer",
                  transition: "border-color 150ms ease, background 150ms ease, color 150ms ease",
                }}
              >
                {mode === "blends" ? "⊕ blends only" : "○ originals only"}
              </button>
            );
          })}

          {/* Clear all */}
          {hasActiveFilter && (
            <button
              onClick={clearAll}
              style={{
                marginLeft: "auto",
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 11, color: "#C4A882",
              }}
            >
              clear all
            </button>
          )}
        </div>
      )}

      {/* Masonry grid */}
      <style>{`
        .diary-main { padding: 48px 48px 120px; }
        .diary-grid { columns: 4; column-gap: 24px; }
        .diary-card-wrap { break-inside: avoid; margin-bottom: 24px; display: block; }
        .diary-divider-wrap { column-span: all; display: block; }
        .diary-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 100px; gap: 12px; }
        @media (max-width: 1024px) { .diary-grid { columns: 2; } }
        @media (max-width: 640px) {
          .diary-main { padding: 32px 20px 80px; }
          .diary-grid { columns: 1; }
        }
      `}</style>

      <div
        className="diary-grid"
        style={{ opacity: animating ? 0 : 1, transform: animating ? "translateY(6px)" : "translateY(0)", transition: "opacity 180ms ease, transform 180ms ease" }}
      >
        {allEntries.length === 0 ? (
          <EmptyState />
        ) : filteredEntries.length === 0 ? (
          <div className="diary-empty">
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontStyle: "italic", fontSize: 18, color: "var(--color-text-secondary)", margin: 0 }}>
              nothing matches these filters
            </p>
            <button
              onClick={clearAll}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 12, color: "#C4A882" }}
            >
              clear all
            </button>
          </div>
        ) : (
          items.map((item) =>
            item.type === "divider" ? (
              <div key={item.key} className="diary-divider-wrap">
                <SectionDivider label={item.label} />
              </div>
            ) : (
              <div key={item.key} className="diary-card-wrap">
                <DiaryCard entry={item.entry} />
              </div>
            )
          )
        )}
      </div>
    </main>
  );
}

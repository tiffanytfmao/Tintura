import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { BackNav } from "../components/BackNav";
import { getDiary, addToDiary, splitName, type DiaryEntry } from "../lib/storage";

// ─── CIELAB blend algorithm ───────────────────────────────────────────────────

function hexToLab(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (v: number) => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  const [rl, gl, bl] = [lin(r), lin(g), lin(b)];
  const X = rl * 0.4124 + gl * 0.3576 + bl * 0.1805;
  const Y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
  const Z = rl * 0.0193 + gl * 0.1192 + bl * 0.9505;
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  return [116 * f(Y) - 16, 500 * (f(X / 0.95047) - f(Y)), 200 * (f(Y) - f(Z / 1.08883))];
}

function deltaE(a: [number, number, number], b: [number, number, number]) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function computeBlendPalette(c1: string[], c2: string[]): string[] {
  if (!c1.length && !c2.length) return [];
  const selected: string[] = [];
  if (c1[0]) selected.push(c1[0]);
  if (c2[0] && c2[0] !== c1[0]) selected.push(c2[0]);
  const remaining = [...c1.slice(1), ...c2.slice(1)].filter((c) => !selected.includes(c));
  while (selected.length < 5 && remaining.length > 0) {
    const selLab = selected.map(hexToLab);
    let bestIdx = -1, bestDist = -1;
    for (let i = 0; i < remaining.length; i++) {
      const minD = Math.min(...selLab.map((sl) => deltaE(hexToLab(remaining[i]), sl)));
      if (minD >= 25 && minD > bestDist) { bestDist = minD; bestIdx = i; }
    }
    if (bestIdx === -1) break;
    selected.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }
  return selected.sort((a, b) => hexToLab(a)[0] - hexToLab(b)[0]);
}

function anchorLabel(name: string): string {
  const { anchor } = splitName(name);
  return anchor.replace(/\.$/, "").trim();
}

// ─── Shared components ────────────────────────────────────────────────────────

function Separator() {
  return (
    <span style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontStyle: "italic", fontSize: 32, color: "#C4A882", alignSelf: "center", padding: "0 12px", flexShrink: 0, marginBottom: 48 }}>
      ×
    </span>
  );
}

function EmptyCard({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minHeight: 240,
        border: `1.5px dashed ${hov ? "#1A1814" : "#C4A882"}`,
        borderRadius: 4,
        background: hov ? "rgba(196,168,130,0.09)" : "rgba(196,168,130,0.04)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 10, cursor: "pointer",
        transition: "background 150ms ease, border-color 150ms ease",
      }}
    >
      <span style={{ fontSize: 32, color: "#C4A882", fontWeight: 300, lineHeight: 1 }}>+</span>
      <span style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 12, color: "#C4A882" }}>pick a memory</span>
    </div>
  );
}

function FilledCard({ entry, onDelete }: { entry: DiaryEntry; onDelete: () => void }) {
  const { anchor, observation } = splitName(entry.name);
  return (
    <div style={{ flex: 1, position: "relative" }}>
      <button onClick={onDelete} style={{
        position: "absolute", top: -8, right: -8, zIndex: 2,
        width: 20, height: 20, borderRadius: "50%",
        background: "#1A1814", border: "none", color: "#F9F7F4",
        fontSize: 10, fontFamily: "var(--font-ui)", fontWeight: 500,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", padding: 0,
      }}>×</button>
      <div style={{ background: "#FFFFFF", border: "1px solid #E8E4DC", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ position: "relative", height: 160, overflow: "hidden" }}>
          {entry.photo && (
            <img src={entry.photo} alt={entry.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          )}
          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 44, display: "flex", flexDirection: "column", borderRadius: "4px 0 0 0", overflow: "hidden", zIndex: 1 }}>
            {entry.swatches.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
          </div>
        </div>
        <div style={{ display: "flex", height: 9 }}>
          {entry.swatches.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
        </div>
        <div style={{ padding: "10px 12px" }}>
          <div style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 9, color: "#1A1814", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
            {anchor}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: 12, color: "#1A1814", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {observation ?? anchor}
          </div>
        </div>
      </div>
    </div>
  );
}

function PickerRow({ entry, onClick }: { entry: DiaryEntry; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const { anchor, observation } = splitName(entry.name);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "13px 28px", display: "flex", alignItems: "center", gap: 14,
        borderBottom: "1px solid #E8E4DC", cursor: "pointer",
        background: hov ? "rgba(196,168,130,0.06)" : "transparent",
        transition: "background 150ms ease",
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 3, overflow: "hidden", flexShrink: 0, background: "#E0DEDA" }}>
        {entry.photo && (
          <img src={entry.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 9, color: "#8C8880", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 1 }}>
          {anchor}
        </span>
        <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 300, fontSize: 15, color: "#1A1814", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {observation ?? anchor}
        </span>
        <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 10, color: "#8C8880", marginTop: 3 }}>
          {entry.location ? `${entry.location.toUpperCase()} · ` : ""}
          {new Date(entry.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {entry.swatches.slice(0, 5).map((c, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
        ))}
      </div>
    </div>
  );
}

// ─── Blend result panel ───────────────────────────────────────────────────────

function BlendResultPanel({ left, right, name, setName, blendPalette, setBlendPalette, onSave, onCancel }: {
  left: DiaryEntry; right: DiaryEntry;
  name: string; setName: (v: string) => void;
  blendPalette: string[]; setBlendPalette: (v: string[]) => void;
  onSave: () => void; onCancel: () => void;
}) {
  const [shake, setShake] = useState(false);

  function removeColor(i: number) {
    if (blendPalette.length <= 1) return;
    setBlendPalette(blendPalette.filter((_, idx) => idx !== i));
  }

  function addColor(color: string) {
    if (blendPalette.includes(color)) return;
    if (blendPalette.length >= 5) { setShake(true); setTimeout(() => setShake(false), 500); return; }
    setBlendPalette([...blendPalette, color]);
  }

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E4DC", borderRadius: 4, padding: 20 }}>
      <style>{`@keyframes blend-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 60%{transform:translateX(5px)} }`}</style>

      <p style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 10, color: "#8C8880", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>
        Blend result
      </p>

      {/* Blend palette */}
      <div style={{ display: "flex", gap: 6, alignItems: "flex-start", animation: shake ? "blend-shake 0.45s ease" : "none" }}>
        {blendPalette.map((color, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <div style={{ width: "100%", height: 48, borderRadius: 3, background: color }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#8C8880", marginTop: 4, textAlign: "center" }}>{color}</span>
          </div>
        ))}
        {blendPalette.length < 5 && Array.from({ length: 5 - blendPalette.length }).map((_, i) => (
          <div key={`e${i}`} style={{ flex: 1, height: 48, borderRadius: 3, border: "1px dashed #C4A882", background: "transparent" }} />
        ))}
      </div>

      <div style={{ height: 1, background: "#E8E4DC", margin: "16px 0" }} />

      {/* Source palettes */}
      {[left, right].map((entry) => (
        <div key={entry.id} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.swatches[0] ?? "#ccc", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 10, color: "#8C8880", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {anchorLabel(entry.name).toLowerCase()}
            </span>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {entry.swatches.map((color, i) => {
              const used = blendPalette.includes(color);
              return (
                <div
                  key={i}
                  onClick={() => !used && addColor(color)}
                  style={{ width: 36, height: 36, borderRadius: 3, background: color, position: "relative", opacity: used ? 0.35 : 1, cursor: used ? "default" : "pointer", transition: "transform 150ms ease, opacity 150ms ease", flexShrink: 0 }}
                  onMouseEnter={(e) => { if (!used) (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                >
                  {used ? (
                    <div style={{ position: "absolute", top: -5, right: -5, width: 14, height: 14, borderRadius: "50%", background: "#7DB88A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  ) : (
                    <div style={{ position: "absolute", top: -5, right: -5, width: 14, height: 14, borderRadius: "50%", background: "#C4A882", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M4 1v6M1 4h6" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ height: 1, background: "#E8E4DC", margin: "16px 0" }} />

      {/* Name */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", fontFamily: "var(--font-display)", fontWeight: 300, fontSize: 20, color: "#1A1814", border: "none", borderBottom: "1px solid #C4A882", background: "transparent", outline: "none", padding: "0 0 6px", margin: "16px 0 4px", boxSizing: "border-box", caretColor: "#C4A882" }}
      />
      <p style={{ fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 10, fontStyle: "italic", color: "#8C8880", margin: 0 }}>
        edit the name — it&apos;s your memory
      </p>

      {/* Save */}
      <button
        onClick={onSave}
        disabled={blendPalette.length === 0}
        style={{
          display: "block", width: "100%", marginTop: 16,
          background: blendPalette.length === 0 ? "#E6E6E2" : "#1A1814",
          color: blendPalette.length === 0 ? "#9A9895" : "#F9F7F4",
          fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 14,
          border: "none", borderRadius: 4, padding: "13px 0",
          cursor: blendPalette.length === 0 ? "not-allowed" : "pointer",
          letterSpacing: "0.02em", transition: "opacity 150ms ease",
        }}
        onMouseEnter={(e) => { if (blendPalette.length > 0) (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
      >
        Save blend
      </button>

      <button
        onClick={onCancel}
        style={{ display: "block", width: "100%", marginTop: 10, background: "none", border: "none", fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 11, color: "#8C8880", textAlign: "center", cursor: "pointer", padding: 0, transition: "color 150ms ease" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1A1814")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#8C8880")}
      >
        cancel — discard blend
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Blend() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const anchorId = searchParams.get("anchor");
  const returnTo = searchParams.get("returnTo") ?? "/";

  // Only non-blend entries can be blended
  const entries = useMemo(() => getDiary().filter((e) => !e.isBlend), []);

  const [leftEntry, setLeftEntry] = useState<DiaryEntry | null>(null);
  const [rightEntry, setRightEntry] = useState<DiaryEntry | null>(null);
  const [activeSlot, setActiveSlot] = useState<"left" | "right" | null>(null);
  const [blendPalette, setBlendPalette] = useState<string[]>([]);
  const [blendName, setBlendName] = useState("");

  // Pre-fill anchor entry into left slot
  useEffect(() => {
    if (anchorId) {
      const found = entries.find((e) => e.id === anchorId);
      if (found) {
        setLeftEntry(found);
        setActiveSlot("right");
      }
    }
  }, [anchorId, entries]);

  // Recompute palette + name when both slots fill
  useEffect(() => {
    if (leftEntry && rightEntry) {
      setBlendPalette(computeBlendPalette(leftEntry.swatches, rightEntry.swatches));
      setBlendName(`${anchorLabel(leftEntry.name)} × ${anchorLabel(rightEntry.name)}`);
      setActiveSlot(null);
    }
  }, [leftEntry?.id, rightEntry?.id]);

  const bothFilled = !!leftEntry && !!rightEntry;
  const tooFew = entries.length < 2;

  function handlePick(entry: DiaryEntry) {
    if (activeSlot === "left") setLeftEntry(entry);
    else setRightEntry(entry);
    setActiveSlot(null);
  }

  function handleSave() {
    if (!leftEntry || !rightEntry || blendPalette.length === 0) return;
    addToDiary({
      id: crypto.randomUUID(),
      photo: null,
      name: blendName,
      swatches: blendPalette,
      timestamp: new Date().toISOString(),
      location: leftEntry.location,
      isBlend: true,
      blendSources: [leftEntry.id, rightEntry.id],
      blendPhotos: [leftEntry.photo, rightEntry.photo],
    });
    navigate(returnTo);
  }

  const pickerEntries = entries.filter((e) => e.id !== leftEntry?.id && e.id !== rightEntry?.id);

  // ── Full-page picker ──────────────────────────────────────────────────────

  if (activeSlot !== null) {
    return (
      <>
        <BackNav label="back" to={returnTo} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "14px 28px", gap: 14, borderBottom: "1px solid #E8E4DC" }}>
            <button
              onClick={() => setActiveSlot(null)}
              style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 12, color: "#8C8880", padding: 0, transition: "color 150ms ease" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1A1814")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#8C8880")}
            >
              ← back
            </button>
            <div style={{ width: 1, height: 14, background: "#E8E4DC", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 13, color: "#C4A882" }}>
              picking memory {activeSlot === "left" ? "1" : "2"} of 2
            </span>
            <button
              onClick={() => { setActiveSlot(null); navigate(returnTo); }}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 12, color: "#8C8880", padding: 0, transition: "color 150ms ease" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1A1814")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#8C8880")}
            >
              cancel
            </button>
          </div>

          <div style={{ padding: "12px 32px 10px", borderBottom: "1px solid #E8E4DC", fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 11, color: "#8C8880", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            select a memory
          </div>

          {pickerEntries.length === 0 ? (
            <div style={{ padding: "40px 32px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontStyle: "italic", fontSize: 18, color: "#8C8880", margin: 0 }}>
                no other memories to blend with
              </p>
            </div>
          ) : (
            pickerEntries.map((entry) => (
              <PickerRow key={entry.id} entry={entry} onClick={() => handlePick(entry)} />
            ))
          )}
        </div>
      </>
    );
  }

  // ── Main blend view ───────────────────────────────────────────────────────

  return (
    <>
      <BackNav label="back" to={returnTo} />
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "32px 32px 80px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontStyle: "italic", fontSize: 32, color: "#1A1814", margin: "0 0 4px", lineHeight: 1.15 }}>
          blend two memories
        </h1>
        <p style={{ fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 12, color: "#8C8880", margin: "0 0 32px" }}>
          merge two palettes into one
        </p>

        {tooFew ? (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontStyle: "italic", fontSize: 20, color: "#8C8880", margin: "0 0 20px" }}>
              you need at least two memories to blend
            </p>
            <button
              onClick={() => navigate("/")}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 13, color: "#C4A882", padding: 0 }}
            >
              ← back to diary
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "stretch", gap: 16, marginBottom: 0 }}>
              {leftEntry
                ? <FilledCard entry={leftEntry} onDelete={() => { setLeftEntry(null); setBlendPalette([]); setActiveSlot("left"); }} />
                : <EmptyCard onClick={() => setActiveSlot("left")} />}
              <Separator />
              {rightEntry
                ? <FilledCard entry={rightEntry} onDelete={() => { setRightEntry(null); setBlendPalette([]); setActiveSlot("right"); }} />
                : <EmptyCard onClick={() => setActiveSlot("right")} />}
            </div>

            {!bothFilled && (
              <p style={{ fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 11, fontStyle: "italic", color: "#8C8880", textAlign: "center", marginTop: 20 }}>
                tap either card to begin
              </p>
            )}

            {bothFilled && leftEntry && rightEntry && (
              <div style={{ marginTop: 24 }}>
                <BlendResultPanel
                  left={leftEntry}
                  right={rightEntry}
                  name={blendName}
                  setName={setBlendName}
                  blendPalette={blendPalette}
                  setBlendPalette={setBlendPalette}
                  onSave={handleSave}
                  onCancel={() => navigate(returnTo)}
                />
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { X, Plus } from "lucide-react";
import { BackNav } from "../components/BackNav";
import { SAMPLE_ENTRIES } from "../data/entries";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toHex(r: number, g: number, b: number) {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// K-means++ color extraction from a canvas
function extractKMeans(canvas: HTMLCanvasElement, k: number): string[] {
  if (k <= 0) return [];
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  type RGB = [number, number, number];
  const pixels: RGB[] = [];

  for (let i = 0; i < data.length; i += 4 * 10) {
    if (data[i + 3] < 200) continue;
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (pixels.length < k) return [];

  // K-means++ initialization
  const centers: RGB[] = [pixels[Math.floor(Math.random() * pixels.length)]];
  while (centers.length < k) {
    const dists = pixels.map((p) =>
      Math.min(...centers.map((c) => (p[0]-c[0])**2 + (p[1]-c[1])**2 + (p[2]-c[2])**2))
    );
    const total = dists.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (let i = 0; i < pixels.length; i++) {
      rand -= dists[i];
      if (rand <= 0) { centers.push(pixels[i]); break; }
    }
  }

  // 20 iterations
  for (let iter = 0; iter < 20; iter++) {
    const sums: [number, number, number, number][] = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (const p of pixels) {
      let minD = Infinity, minI = 0;
      for (let j = 0; j < k; j++) {
        const c = centers[j];
        const d = (p[0]-c[0])**2 + (p[1]-c[1])**2 + (p[2]-c[2])**2;
        if (d < minD) { minD = d; minI = j; }
      }
      sums[minI][0] += p[0]; sums[minI][1] += p[1];
      sums[minI][2] += p[2]; sums[minI][3]++;
    }
    for (let j = 0; j < k; j++) {
      if (sums[j][3] > 0)
        centers[j] = [
          Math.round(sums[j][0] / sums[j][3]),
          Math.round(sums[j][1] / sums[j][3]),
          Math.round(sums[j][2] / sums[j][3]),
        ];
    }
  }

  return centers.map(([r, g, b]) => toHex(r, g, b));
}

function saveDeveloped(id: string, photo: string, swatches: string[], name: string) {
  const diary = JSON.parse(localStorage.getItem("tintura_diary") ?? "[]");
  const roll = JSON.parse(localStorage.getItem("tintura_roll") ?? "[]");
  const entry = {
    id: `dev_${Date.now()}`,
    sourceId: id,
    photo,
    colors: swatches,
    name,
    date: new Date().toISOString(),
  };
  diary.unshift(entry);
  localStorage.setItem("tintura_diary", JSON.stringify(diary));
  const updated = roll.filter((e: { id: string }) => e.id !== id);
  localStorage.setItem("tintura_roll", JSON.stringify(updated));
}

// ─── Demo photo mapping ───────────────────────────────────────────────────────

const DEMO_PHOTOS: Record<string, string> = {
  r1: SAMPLE_ENTRIES[0].photoUrl,
  r2: SAMPLE_ENTRIES[1].photoUrl,
  r3: SAMPLE_ENTRIES[2].photoUrl,
  r4: SAMPLE_ENTRIES[3].photoUrl,
  r5: SAMPLE_ENTRIES[4].photoUrl,
};

const DEMO_NOTES: Record<string, string> = {
  r1: "the colour of old copper on a wet morning",
  r2: "neon on wet tarmac after the rain stopped",
  r3: "every balcony had laundry in a different faded colour",
  r4: "shadow of a drainpipe at exactly 2pm",
  r5: "the inside of a flower market, very early",
};

// ─── Swatch component ────────────────────────────────────────────────────────

function Swatch({ color, size, onRemove, showHex }: {
  color: string;
  size: number;
  onRemove?: () => void;
  showHex?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: size,
          height: size,
          borderRadius: 4,
          background: color,
          border: "1px solid rgba(0,0,0,0.08)",
          position: "relative",
          flexShrink: 0,
          cursor: onRemove ? "default" : "default",
        }}
      >
        {onRemove && hovered && (
          <button
            onClick={onRemove}
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#1A1814",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <X size={9} strokeWidth={2.5} style={{ color: "#F9F7F4" }} />
          </button>
        )}
      </div>
      {showHex && (
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--color-text-secondary)",
          letterSpacing: "0.02em",
        }}>
          {color}
        </span>
      )}
    </div>
  );
}

// ─── Canvas eyedropper ───────────────────────────────────────────────────────

interface CanvasPickerProps {
  photoUrl: string;
  swatches: string[];
  onAddSwatch: (hex: string) => void;
  onShake: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  developing: boolean;
}

function CanvasPicker({ photoUrl, swatches, onAddSwatch, onShake, canvasRef, developing }: CanvasPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loupeVisible, setLoupeVisible] = useState(false);
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0 });
  const [imageReady, setImageReady] = useState(false);

  // Load image onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    imgRef.current = img;

    img.onload = () => {
      const container = containerRef.current;
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Cover-fit the image
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = w / h;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (imgAspect > canvasAspect) {
        sw = img.naturalHeight * canvasAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / canvasAspect;
        sy = (img.naturalHeight - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      setImageReady(true);
    };

    img.onerror = () => {
      // Fallback: draw a gradient placeholder
      const container = containerRef.current;
      if (!container || !canvas) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#8a5c28");
      grad.addColorStop(1, "#e0aa60");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      setImageReady(true);
    };

    img.src = photoUrl;
  }, [photoUrl, canvasRef]);

  const drawLoupe = useCallback((canvasX: number, canvasY: number) => {
    const canvas = canvasRef.current;
    const loupeCanvas = loupeCanvasRef.current;
    if (!canvas || !loupeCanvas || !imageReady) return;

    const lCtx = loupeCanvas.getContext("2d");
    if (!lCtx) return;

    const loupe = 80;
    const zoom = 5;
    const src = loupe / zoom; // 16px source region

    loupeCanvas.width = loupe;
    loupeCanvas.height = loupe;

    // Draw zoomed canvas region
    lCtx.clearRect(0, 0, loupe, loupe);
    lCtx.drawImage(
      canvas,
      Math.max(0, canvasX - src / 2),
      Math.max(0, canvasY - src / 2),
      src, src,
      0, 0,
      loupe, loupe
    );

    // Crosshair
    lCtx.strokeStyle = "rgba(255,255,255,0.9)";
    lCtx.lineWidth = 1;
    lCtx.beginPath();
    lCtx.moveTo(loupe / 2, loupe / 2 - 8);
    lCtx.lineTo(loupe / 2, loupe / 2 + 8);
    lCtx.moveTo(loupe / 2 - 8, loupe / 2);
    lCtx.lineTo(loupe / 2 + 8, loupe / 2);
    lCtx.stroke();

    // Center pixel ring
    lCtx.strokeStyle = "rgba(255,255,255,0.7)";
    lCtx.lineWidth = 1;
    lCtx.beginPath();
    lCtx.arc(loupe / 2, loupe / 2, 4, 0, Math.PI * 2);
    lCtx.stroke();
  }, [canvasRef, imageReady]);

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLoupePos({ x, y });
    drawLoupe(x, y);
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (swatches.length >= 5) { onShake(); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = toHex(pixel[0], pixel[1], pixel[2]);
    onAddSwatch(hex);
  }

  // Loupe positioning: above cursor, flip below if near top
  const LOUPE_SIZE = 80;
  const LOUPE_OFFSET = 16;
  const nearTop = loupePos.y < LOUPE_SIZE + LOUPE_OFFSET + 8;
  const loupeTop = nearTop
    ? loupePos.y + LOUPE_OFFSET
    : loupePos.y - LOUPE_SIZE - LOUPE_OFFSET;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        paddingTop: "133.33%",
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid #E8E4DC",
        background: "#E0DEDA",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 20px rgba(0,0,0,0.05)",
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setLoupeVisible(true)}
        onMouseLeave={() => setLoupeVisible(false)}
        onClick={handleClick}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          cursor: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M20.71 5.63l-2.34-2.34a1 1 0 0 0-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42 1.41 1.41-6.6 6.6A2 2 0 0 0 5 16v3h3a2 2 0 0 0 1.42-.59l6.6-6.6 1.41 1.42 1.42-1.42-1.42-1.41 3.12-3.12a1 1 0 0 0 0-1.65z' fill='rgba(255,255,255,0.82)'/%3E%3Ccircle cx='4' cy='20' r='2' fill='%23C4A882'/%3E%3Cline x1='5.41' y1='18.59' x2='8' y2='16' stroke='rgba(255,255,255,0.82)' stroke-width='1.5'/%3E%3C/svg%3E\") 0 24, crosshair",
          display: "block",
          filter: developing ? "blur(0px)" : "none",
          transition: developing ? "filter 600ms ease-out" : "none",
        }}
      />

      {/* Loupe */}
      {loupeVisible && imageReady && (
        <div
          style={{
            position: "absolute",
            left: loupePos.x - LOUPE_SIZE / 2,
            top: loupeTop,
            width: LOUPE_SIZE,
            height: LOUPE_SIZE,
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid rgba(255,255,255,0.85)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <canvas
            ref={loupeCanvasRef}
            width={LOUPE_SIZE}
            height={LOUPE_SIZE}
            style={{ display: "block" }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Curation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/roll";

  // Detect edit mode: entry exists in diary (developed) vs roll (developing)
  const diaryEntries: Array<{ id: string; photo?: string; photoUrl?: string; colors?: string[]; swatches?: string[]; name?: string; note?: string }> =
    JSON.parse(localStorage.getItem("tintura_diary") ?? "[]");
  const rollEntries: Array<{ id: string; photo?: string; note?: string }> =
    JSON.parse(localStorage.getItem("tintura_roll") ?? "[]");

  const diaryEntry = diaryEntries.find((e) => e.id === id);
  const sampleEntry = SAMPLE_ENTRIES.find((e) => e.id === id);
  // Edit mode: entry exists in localStorage diary OR in SAMPLE_ENTRIES
  const isEditMode = !!diaryEntry || !!sampleEntry;

  const rollEntry = rollEntries.find((e) => e.id === id);
  const photoUrl = diaryEntry?.photoUrl ?? diaryEntry?.photo
    ?? sampleEntry?.photoUrl
    ?? rollEntry?.photo
    ?? DEMO_PHOTOS[id ?? "r1"]
    ?? SAMPLE_ENTRIES[0].photoUrl;
  const initialNote = diaryEntry?.name ?? diaryEntry?.note
    ?? sampleEntry?.name
    ?? rollEntry?.note
    ?? DEMO_NOTES[id ?? "r1"] ?? "";
  const initialSwatches = isEditMode
    ? (diaryEntry?.colors ?? diaryEntry?.swatches ?? sampleEntry?.colors ?? [])
    : [];

  const [swatches, setSwatches] = useState<string[]>(initialSwatches);
  const [shake, setShake] = useState(false);
  const [name, setName] = useState(initialNote);
  const [developing, setDeveloping] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleAddSwatch(hex: string) {
    setSwatches((prev) => [...prev, hex]);
  }

  function handleRemoveSwatch(i: number) {
    setSwatches((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  function handleAutoPick() {
    const canvas = canvasRef.current;
    if (!canvas || swatches.length >= 5) return;
    const colors = extractKMeans(canvas, swatches.length + 3);
    const newColor = colors.find((c) => !swatches.some((s) => colorDistance(c, s) < 30));
    if (newColor) setSwatches((prev) => [...prev, newColor]);
  }

  function colorDistance(a: string, b: string): number {
    const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab_ = parseInt(a.slice(5, 7), 16);
    const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
    return Math.sqrt((ar-br)**2 + (ag-bg)**2 + (ab_-bb)**2);
  }

  function handleDevelop() {
    if (swatches.length === 0) return;
    if (isEditMode) {
      // Edit mode: update existing diary entry in place
      const updated = diaryEntries.map((e) =>
        e.id === id
          ? { ...e, colors: swatches, swatches, name: name.trim() || initialNote, note: name.trim() || initialNote }
          : e
      );
      localStorage.setItem("tintura_diary", JSON.stringify(updated));
      navigate(returnTo);
      return;
    }
    // Develop mode: animate unblur then save
    setDeveloping(true);
    setTimeout(() => {
      saveDeveloped(id ?? "", photoUrl, swatches, name.trim() || initialNote);
      navigate("/");
    }, 700);
  }

  return (
    <>
      <BackNav label="Back" to={returnTo} />
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 48px 120px",
        }}
      >
        {/* Develop flash animation */}
        <style>{`
          @keyframes swatch-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }
          .shake { animation: swatch-shake 0.45s ease; }
          @keyframes develop-flash {
            0% { filter: blur(10px); }
            100% { filter: blur(0px); }
          }
          .developing-canvas {
            animation: develop-flash 600ms ease-out forwards;
          }
        `}</style>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "55fr 45fr",
            gap: 64,
            alignItems: "start",
          }}
        >
          {/* ── Left: canvas + small swatch strip ── */}
          <div>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontSize: 12,
                color: "#8C8880",
                marginBottom: 8,
              }}
            >
              tap anywhere on the photo to pick a color
            </span>
            <CanvasPicker
              photoUrl={photoUrl}
              swatches={swatches}
              onAddSwatch={handleAddSwatch}
              onShake={handleShake}
              canvasRef={canvasRef}
              developing={developing}
            />

            {/* Small swatch palette strip below canvas */}
            <div
              style={{
                marginTop: 16,
                minHeight: 52,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                className={shake ? "shake" : ""}
                style={{ display: "flex", gap: 8 }}
              >
                {swatches.map((color, i) => (
                  <Swatch
                    key={i}
                    color={color}
                    size={36}
                    onRemove={() => handleRemoveSwatch(i)}
                  />
                ))}
                {Array.from({ length: 5 - swatches.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 4,
                      border: "1px dashed #D4CEBF",
                      background: "#F0EDE8",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: curation panel ── */}
          <div style={{ paddingTop: 4, paddingLeft: 40, paddingRight: 24 }}>

            {/* 01 PICK YOUR COLORS */}
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 11,
                color: "var(--color-text-secondary)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                margin: "0 0 12px",
              }}
            >
              01 Pick your colors
            </p>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontSize: 11,
                color: "#8C8880",
                margin: "0 0 12px",
              }}
            >
              pick 1–5 colors from the photo
            </p>

            {/* 5 swatch slots */}
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const color = swatches[i];
                if (color) {
                  return (
                    <Swatch
                      key={i}
                      color={color}
                      size={48}
                      onRemove={() => handleRemoveSwatch(i)}
                      showHex
                    />
                  );
                }
                return (
                  <div
                    key={`slot-${i}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 4,
                        border: "1px dashed #D4CEBF",
                        background: "#F0EDE8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Plus size={14} strokeWidth={1.5} style={{ color: "#C4BFB8" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Auto-pick link */}
            <button
              onClick={handleAutoPick}
              disabled={swatches.length >= 5}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: swatches.length >= 5 ? "default" : "pointer",
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontSize: 12,
                color: swatches.length >= 5 ? "#C8C4BC" : "#8C8880",
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginBottom: 0,
                transition: "color 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (swatches.length < 5)
                  (e.currentTarget as HTMLElement).style.color = "#1A1814";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  swatches.length >= 5 ? "#C8C4BC" : "#8C8880";
              }}
            >
              <Plus size={14} strokeWidth={1.5} />
              auto-pick next color
            </button>

            {/* 02 NAME THIS MEMORY */}
            <div style={{ marginTop: 32, marginBottom: 32 }}>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 11,
                color: "var(--color-text-secondary)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                margin: "0 0 12px",
              }}
            >
              02 Name this memory
            </p>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="what stopped you?"
              style={{
                width: "100%",
                fontFamily: "var(--font-display)",
                fontWeight: 300,
                fontSize: 22,
                lineHeight: 1.38,
                color: "#1A1814",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid #C4A882",
                outline: "none",
                padding: "0 0 8px",
                letterSpacing: "-0.01em",
                boxSizing: "border-box",
                caretColor: "#C4A882",
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontStyle: "italic",
                fontSize: 11,
                color: "#8C8880",
                margin: "8px 0 0",
              }}
            >
              for when you forget what stopped you.
            </p>

            </div>

            {/* 03 DEVELOP */}
            <div style={{ marginTop: 32 }}>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 11,
                color: "var(--color-text-secondary)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                margin: "0 0 12px",
              }}
            >
              {isEditMode ? "03 Save" : "03 Develop"}
            </p>

            <button
              onClick={handleDevelop}
              disabled={swatches.length === 0 || developing}
              style={{
                width: "100%",
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 14,
                color: swatches.length > 0 ? "#F9F7F4" : "#8C8880",
                background: swatches.length > 0 ? "#1A1814" : "#E8E4DC",
                border: "none",
                borderRadius: 4,
                padding: "12px 0",
                cursor: swatches.length > 0 ? "pointer" : "not-allowed",
                letterSpacing: "0.02em",
                transition: "background 200ms ease, color 200ms ease",
              }}
            >
              {developing ? "Developing…" : isEditMode ? "Save changes" : "Develop this memory"}
            </button>

            {swatches.length === 0 && (
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontWeight: 400,
                  fontSize: 11,
                  color: "#C4A882",
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                pick at least one color to develop
              </p>
            )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

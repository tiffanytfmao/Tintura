import { type DiaryEntry, splitName } from "./storage";

const W = 800;
const HEADER_H = 64;
const PHOTO_RATIO = 1.1; // 110% — matches Option B mockup
const STRIP_H = 48;
const PAD = 32;
const ANCHOR_SIZE = 13;
const OBS_SIZE = 22;
const OBS_LINE_H = 34;
const HEX_H = 44;
const FOOTER_H = 48;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCoverFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = dw / dh;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (imgAspect > canvasAspect) {
    sw = img.naturalHeight * canvasAspect;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / canvasAspect;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// ─── Main export function ─────────────────────────────────────────────────────

export async function exportCard(entry: DiaryEntry): Promise<void> {
  await document.fonts.ready;

  // ── Pre-measure observation to compute canvas height ──────────────────────
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = `300 ${OBS_SIZE}px "Cormorant Garamond", Georgia, serif`;
  const { observation } = splitName(entry.name);
  const obsLines = observation ? wrapText(probe, observation, W - PAD * 2) : [];
  const obsBlockH = obsLines.length > 0
    ? 52 + obsLines.length * OBS_LINE_H  // 52 = top pad + anchor row
    : 52;

  const PHOTO_H = Math.round(W * PHOTO_RATIO);
  const H = HEADER_H + PHOTO_H + STRIP_H + obsBlockH + HEX_H + FOOTER_H;

  // ── Create canvas ─────────────────────────────────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#F9F7F4";
  ctx.fillRect(0, 0, W, H);

  // ── Header ────────────────────────────────────────────────────────────────
  ctx.textBaseline = "middle";

  // Wordmark
  ctx.fillStyle = "#1A1814";
  ctx.font = `300 italic 26px "Cormorant Garamond", Georgia, serif`;
  ctx.fillText("tintura", PAD, HEADER_H / 2);

  // Date (right-aligned)
  const dateStr = new Date(entry.timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  ctx.fillStyle = "#8C8880";
  ctx.font = `400 11px "DM Mono", "Courier New", monospace`;
  ctx.textAlign = "right";
  ctx.fillText(dateStr, W - PAD, HEADER_H / 2);
  ctx.textAlign = "left";

  // Header bottom border
  ctx.strokeStyle = "#E8E4DC";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, HEADER_H);
  ctx.lineTo(W, HEADER_H);
  ctx.stroke();

  // ── Photo ─────────────────────────────────────────────────────────────────
  const photoY = HEADER_H;

  if (entry.isBlend && entry.blendPhotos) {
    // 50/50 composite: left half = photo[0], right half = photo[1]
    const [left, right] = await Promise.all([
      entry.blendPhotos[0] ? loadImage(entry.blendPhotos[0]) : null,
      entry.blendPhotos[1] ? loadImage(entry.blendPhotos[1]) : null,
    ]);
    ctx.save();
    if (left) {
      ctx.rect(0, photoY, W / 2, PHOTO_H);
      ctx.clip();
      drawCoverFit(ctx, left, 0, photoY, W, PHOTO_H);
    } else {
      ctx.fillStyle = "#E0DEDA";
      ctx.fillRect(0, photoY, W / 2, PHOTO_H);
    }
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(W / 2, photoY, W / 2, PHOTO_H);
    ctx.clip();
    if (right) {
      drawCoverFit(ctx, right, 0, photoY, W, PHOTO_H);
    } else {
      ctx.fillStyle = "#E0DEDA";
      ctx.fillRect(W / 2, photoY, W / 2, PHOTO_H);
    }
    ctx.restore();
  } else if (entry.photo) {
    const img = await loadImage(entry.photo);
    if (img) {
      drawCoverFit(ctx, img, 0, photoY, W, PHOTO_H);
    } else {
      ctx.fillStyle = "#E0DEDA";
      ctx.fillRect(0, photoY, W, PHOTO_H);
    }
  } else {
    ctx.fillStyle = "#E0DEDA";
    ctx.fillRect(0, photoY, W, PHOTO_H);
  }

  // Inset border over photo
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, photoY + 1, W - 2, PHOTO_H - 2);

  // ── Palette strip ─────────────────────────────────────────────────────────
  const stripY = HEADER_H + PHOTO_H;
  const swatchW = W / entry.swatches.length;
  entry.swatches.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(i * swatchW), stripY, Math.ceil(swatchW), STRIP_H);
  });

  // ── Name block ────────────────────────────────────────────────────────────
  const nameY = stripY + STRIP_H;
  const { anchor } = splitName(entry.name);

  ctx.textBaseline = "alphabetic";

  // Anchor (DM Sans, uppercase, tracked)
  ctx.fillStyle = "#1A1814";
  ctx.font = `500 ${ANCHOR_SIZE}px "DM Sans", system-ui, sans-serif`;
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.08em";
  ctx.fillText(anchor.toUpperCase(), PAD, nameY + 32);
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";

  // Observation (Cormorant Garamond, wrapped)
  ctx.font = `300 ${OBS_SIZE}px "Cormorant Garamond", Georgia, serif`;
  obsLines.forEach((line, i) => {
    ctx.fillText(line, PAD, nameY + 52 + i * OBS_LINE_H);
  });

  // ── Hex values ────────────────────────────────────────────────────────────
  const hexY = nameY + obsBlockH;
  ctx.fillStyle = "#8C8880";
  ctx.font = `400 10px "DM Mono", "Courier New", monospace`;
  ctx.textBaseline = "middle";
  const hexSpacing = (W - PAD * 2) / entry.swatches.length;
  entry.swatches.forEach((color, i) => {
    ctx.fillText(color, PAD + i * hexSpacing, hexY + HEX_H / 2);
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = hexY + HEX_H;
  ctx.strokeStyle = "#E8E4DC";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(W, footerY);
  ctx.stroke();

  ctx.fillStyle = "#C4BFB8";
  ctx.font = `400 10px "DM Sans", system-ui, sans-serif`;
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.04em";
  const footerText = `${entry.location ? entry.location.toUpperCase() + " · " : ""}TINTURA`;
  ctx.fillText(footerText, PAD, footerY + FOOTER_H / 2);

  // ── Download ──────────────────────────────────────────────────────────────
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  const slug = entry.name.slice(0, 32).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  a.download = `tintura-${slug}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

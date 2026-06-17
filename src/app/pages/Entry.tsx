import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";

import { SAMPLE_ENTRIES } from "../data/entries";
import { BackNav } from "../components/BackNav";


function DetailSwatch({ color }: { color: string }) {
  const [copied, setCopied] = useState(false);

  function handleClick() {
    try {
      navigator.clipboard.writeText(color).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }).catch(() => fallbackCopy());
    } catch {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    const el = document.createElement("textarea");
    el.value = color;
    el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <button
        onClick={handleClick}
        title={`Copy ${color}`}
        style={{
          width: 48,
          height: 48,
          borderRadius: 4,
          background: color,
          border: "1px solid rgba(0,0,0,0.08)",
          cursor: "pointer",
          transition: "transform 150ms ease, box-shadow 150ms ease",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: copied ? "var(--color-accent-amber)" : "var(--color-text-secondary)",
          transition: "color 200ms ease",
          letterSpacing: "0.02em",
        }}
      >
        {copied ? "Copied" : color}
      </span>
    </div>
  );
}

function ActionButton({
  label,
  variant = "bordered",
  onClick,
}: {
  label: string;
  variant?: "bordered" | "ghost";
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "none",
        border: variant === "bordered" ? `1px solid ${hovered ? "#1A1814" : "#E6E6E2"}` : "none",
        borderRadius: variant === "bordered" ? 4 : 0,
        padding: variant === "bordered" ? "10px 16px" : "4px 0",
        cursor: "pointer",
        fontFamily: "var(--font-ui)",
        fontWeight: variant === "bordered" ? 500 : 400,
        fontSize: 13,
        color: variant === "bordered" ? "#1A1814" : "var(--color-text-secondary)",
        letterSpacing: "0.01em",
        transition: "border-color 150ms ease, color 150ms ease",
      }}
    >
      {label}
    </button>
  );
}

export default function Entry() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const entry = SAMPLE_ENTRIES.find((e) => e.id === id) ?? SAMPLE_ENTRIES[0];
  const entryId = id ?? entry.id;

  const [name, setName] = useState(entry.name);
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function startEdit() {
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function commitEdit(val: string) {
    setName(val.trim() || entry.name);
    setEditing(false);
  }

  const dotIndex = name.indexOf(". ");
  const anchor = dotIndex !== -1 ? name.slice(0, dotIndex + 1) : name;
  const observation = dotIndex !== -1 ? name.slice(dotIndex + 2) : null;

  return (
    <>
    <BackNav label="Diary" to="/" />
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "32px 48px 120px",
      }}
    >

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "55fr 45fr",
          gap: 64,
          alignItems: "start",
        }}
      >
        {/* ── Left: photo + freestanding palette bar ── */}
        <div>
          {/* Photo frame */}
          <div
            style={{
              background: "#E0DEDA",
              border: "1px solid #E8E4DC",
              borderRadius: 4,
              boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 20px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative", width: "100%", paddingTop: "133.33%" }}>
              <img
                src={entry.photoUrl}
                alt={entry.name}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {/* Inset border */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />
              {/* Vertical palette strip — overlaid on right edge */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 56,
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "4px 0 0 4px",
                  overflow: "hidden",
                  zIndex: 1,
                }}
              >
                {entry.colors.map((color, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: color,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: text + actions ── */}
        <div>
          {/* Entry name — inline editable */}
          {editing ? (
            <textarea
              ref={textareaRef}
              defaultValue={name}
              onBlur={(e) => commitEdit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") commitEdit((e.target as HTMLTextAreaElement).value);
              }}
              style={{
                width: "100%",
                fontFamily: "var(--font-display)",
                fontWeight: 300,
                fontSize: 32,
                lineHeight: 1.3,
                color: "#1A1814",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid #E6E6E2",
                outline: "none",
                resize: "none",
                padding: "0 0 4px",
                marginBottom: 4,
                marginTop: 2,
              }}
              rows={3}
            />
          ) : (
            <div
              onClick={startEdit}
              title="Click to edit"
              style={{ cursor: "text", marginBottom: 4 }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  fontSize: 11,
                  color: "#1A1814",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                {anchor}
              </span>
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-display)",
                  fontWeight: 300,
                  fontSize: 32,
                  color: "#1A1814",
                  lineHeight: 1.3,
                }}
              >
                {observation ?? anchor}
              </span>
            </div>
          )}

          {/* Location */}
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 400,
              fontSize: 13,
              color: "var(--color-text-secondary)",
              margin: "16px 0 4px",
            }}
          >
            {entry.location}, {entry.country}
          </p>

          {/* Date */}
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 400,
              fontSize: 12,
              color: "var(--color-text-secondary)",
              margin: "0 0 4px",
            }}
          >
            {new Date(entry.date).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          {/* GPS placeholder */}
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 400,
              fontSize: 11,
              color: "var(--color-text-secondary)",
              opacity: 0.6,
              margin: 0,
            }}
          >
            35.6762° N, 139.6503° E
          </p>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "#E8E4DC",
              margin: "28px 0",
            }}
          />

          {/* Palette section */}
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              fontSize: 11,
              color: "#8C8880",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: "0 0 14px",
            }}
          >
            Palette
          </p>

          {/* 5-slot swatch row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const color = entry.colors[i];
              return color ? (
                <DetailSwatch key={i} color={color} />
              ) : (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 4,
                      background: "#F0EDE8",
                      border: "1px dashed #D4CEBF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8C8880",
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                  >
                    +
                  </div>
                  {/* Spacer to align with filled swatch hex labels */}
                  <span style={{ fontSize: 11, visibility: "hidden" }}>·</span>
                </div>
              );
            })}
          </div>

          {/* Edit palette button */}
          <button
            onClick={() => navigate(`/curation/${entryId}?returnTo=/entry/${entryId}`)}
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              fontSize: 12,
              color: "#1A1814",
              background: "none",
              border: "1px solid #E8E4DC",
              borderRadius: 4,
              padding: "8px 16px",
              cursor: "pointer",
              letterSpacing: "0.01em",
              transition: "border-color 150ms ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor = "#1A1814")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor = "#E8E4DC")
            }
          >
            Edit palette →
          </button>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "#E8E4DC",
              margin: "28px 0",
            }}
          />

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <ActionButton label="Export card" variant="bordered" />

            {/* Blend button — amber accent */}
            <div>
              <button
                onClick={() => navigate(`/blend?anchor=${entry.id}&returnTo=/entry/${entry.id}`)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "1px solid #C4A882",
                  borderRadius: 4,
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  fontSize: 13,
                  color: "#C4A882",
                  letterSpacing: "0.01em",
                  transition: "background 150ms ease, border-color 150ms ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(196,168,130,0.07)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                ⊕ Blend with another memory
              </button>
              <p style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontStyle: "italic",
                fontSize: 11,
                color: "#8C8880",
                margin: "4px 0 0",
              }}>
                merge two palettes into one
              </p>
            </div>

            <ActionButton label="Delete entry" variant="ghost" />
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 1000px) {
          .entry-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
    </>
  );
}

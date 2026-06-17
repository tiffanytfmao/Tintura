import { useState } from "react";
import { useNavigate } from "react-router";
import { BackNav } from "../components/BackNav";

const MAX_SLOTS = 12;

interface RollEntry {
  id: string;
  note: string;
  timestamp: string;
  gradient: string;
  photoUrl?: string;
}

const DEVELOPING: RollEntry[] = [
  {
    id: "r1",
    note: "the colour of old copper on a wet morning",
    timestamp: "Today · 08:42",
    gradient: "linear-gradient(160deg, #8a5c28 0%, #c4882a 30%, #e0aa60 60%, #b07840 100%)",
  },
  {
    id: "r2",
    note: "neon on wet tarmac after the rain stopped",
    timestamp: "Today · 07:14",
    gradient: "linear-gradient(145deg, #1a1f3a 0%, #2d3a6b 30%, #c43a6e 65%, #f59a3a 100%)",
  },
  {
    id: "r3",
    note: "every balcony had laundry in a different faded colour",
    timestamp: "Yesterday · 16:55",
    gradient: "linear-gradient(170deg, #d4a843 0%, #c08040 30%, #8a5030 60%, #6b3820 100%)",
  },
  {
    id: "r4",
    note: "shadow of a drainpipe at exactly 2pm",
    timestamp: "Yesterday · 14:03",
    gradient: "linear-gradient(135deg, #c8c4bc 0%, #9a9690 35%, #6a6660 65%, #3a3632 100%)",
  },
  {
    id: "r5",
    note: "the inside of a flower market, very early",
    timestamp: "3 days ago · 06:28",
    gradient: "linear-gradient(155deg, #e8b4c0 0%, #d4789a 25%, #a84870 55%, #6a2040 85%, #3a1020 100%)",
  },
];

function PulsingDot() {
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "var(--color-accent-amber)",
        animation: "pulse-dot 2s ease-in-out infinite",
        zIndex: 2,
      }}
    />
  );
}

function DevelopingCard({ entry }: { entry: RollEntry }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <article
      onClick={() => navigate(`/curation/${entry.id}?returnTo=/roll`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 4,
        boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
        cursor: "pointer",
        overflow: "hidden",
        transition: "transform 200ms ease, box-shadow 200ms ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Blurred photo area — 3:4 */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "133.33%",
          overflow: "hidden",
        }}
      >
        {/* Blurred photo — img if real photo exists, gradient placeholder for demo */}
        {entry.photoUrl ? (
          <img
            src={entry.photoUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(8px) saturate(0.75)",
              transform: "scale(1.08)",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: entry.gradient,
              filter: "blur(18px)",
              transform: "scale(1.12)",
            }}
          />
        )}

        {/* Frosted overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(247, 244, 238, 0.12)",
          }}
        />

        {/* Hover scrim + "Develop →" */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(26, 24, 20, 0.38)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: hovered ? 1 : 0,
            transition: "opacity 150ms ease",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              fontSize: 13,
              color: "#FFFFFF",
              letterSpacing: "0.03em",
            }}
          >
            Develop →
          </span>
        </div>

        <PulsingDot />
      </div>

      {/* Empty palette placeholder */}
      <div style={{ display: "flex", height: 18 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, background: "#ECEAE7" }} />
        ))}
      </div>

      {/* Note */}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 300,
          fontStyle: "italic",
          fontSize: 16,
          color: "var(--color-text-primary)",
          padding: "14px 14px 4px",
          lineHeight: 1.45,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {entry.note}
      </div>

      {/* Timestamp */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 400,
          fontSize: 11,
          color: "var(--color-text-secondary)",
          padding: "4px 14px 14px",
        }}
      >
        {entry.timestamp}
      </div>
    </article>
  );
}

function EmptySlot() {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate("/capture")}
      style={{
        border: "1px dashed #E8E4DC",
        borderRadius: 4,
        cursor: "pointer",
        overflow: "hidden",
        aspectRatio: "3 / 4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "border-color 180ms ease",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent-amber)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.borderColor = "#E8E4DC")
      }
    >
      <svg width="20" height="16" viewBox="0 0 20 16" fill="none" stroke="#C4A882" strokeWidth="1" opacity="0.5">
        <rect x="1" y="1" width="18" height="14" rx="1.5" />
        <rect x="1" y="3.5" width="2.5" height="2.5" rx="0.3" fill="#C4A882" stroke="none" opacity="0.6" />
        <rect x="1" y="8" width="2.5" height="2.5" rx="0.3" fill="#C4A882" stroke="none" opacity="0.6" />
        <rect x="16.5" y="3.5" width="2.5" height="2.5" rx="0.3" fill="#C4A882" stroke="none" opacity="0.6" />
        <rect x="16.5" y="8" width="2.5" height="2.5" rx="0.3" fill="#C4A882" stroke="none" opacity="0.6" />
      </svg>
    </div>
  );
}

function FullRollBanner() {
  return (
    <div
      style={{
        background: "rgba(196, 168, 130, 0.10)",
        border: "1px solid var(--color-accent-amber)",
        borderRadius: 4,
        padding: "10px 16px",
        marginBottom: 32,
        fontFamily: "var(--font-ui)",
        fontWeight: 400,
        fontSize: 13,
        color: "var(--color-accent-amber)",
        lineHeight: 1.5,
      }}
    >
      Your roll is full. Tap a developing photo to swap it for a new capture.
    </div>
  );
}

export default function Roll() {
  const developingCount = DEVELOPING.length;
  const emptyCount = MAX_SLOTS - developingCount;
  const isFull = developingCount === MAX_SLOTS;

  const slots = [
    ...DEVELOPING.map((e) => ({ type: "developing" as const, entry: e })),
    ...Array.from({ length: emptyCount }, (_, i) => ({ type: "empty" as const, id: `empty-${i}` })),
  ];

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
      {/* Page header */}
      <div style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 300,
            fontSize: 48,
            color: "var(--color-text-primary)",
            lineHeight: 1.1,
            margin: "0 0 10px",
            letterSpacing: "-0.01em",
          }}
        >
          The Roll
        </h1>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontWeight: 400,
            fontSize: 13,
            color: "var(--color-text-secondary)",
            margin: 0,
          }}
        >
          {developingCount} photos developing · {emptyCount} frames left
        </p>
      </div>

      {isFull && <FullRollBanner />}

      {/* Grid */}
      <style>{`
        .roll-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 1000px) {
          .roll-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="roll-grid">
        {slots.map((slot) =>
          slot.type === "developing" ? (
            <DevelopingCard key={slot.entry.id} entry={slot.entry} />
          ) : (
            <EmptySlot key={slot.id} />
          )
        )}
      </div>
    </main>
    </>
  );
}

import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { getRoll } from "./lib/storage";

function GrainOverlay() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999,
        opacity: 0.028,
      }}
    >
      <filter id="grain-root">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves="4"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-root)" />
    </svg>
  );
}

function ReelIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      style={{
        display: "block",
        transformOrigin: "18px 18px",
        animation: spinning ? "reel-spin 1.2s linear infinite" : "none",
      }}
    >
      <circle cx="18" cy="18" r="16" stroke="#C4A882" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="5" stroke="#C4A882" strokeWidth="1.5" />
      <circle cx="18" cy="8" r="2.5" fill="#C4A882" />
      <circle cx="18" cy="28" r="2.5" fill="#C4A882" />
      <circle cx="8" cy="18" r="2.5" fill="#C4A882" />
      <circle cx="28" cy="18" r="2.5" fill="#C4A882" />
      <circle cx="10.9" cy="10.9" r="2.5" fill="#C4A882" />
      <circle cx="25.1" cy="25.1" r="2.5" fill="#C4A882" />
      <circle cx="25.1" cy="10.9" r="2.5" fill="#C4A882" />
      <circle cx="10.9" cy="25.1" r="2.5" fill="#C4A882" />
    </svg>
  );
}

function NavCaptureCTA() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => navigate("/capture")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <span
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: hovered ? "#1A1814" : "#C4A882",
          lineHeight: 1,
          transition: "color 150ms ease",
        }}
      >
        +
      </span>
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontWeight: 400,
          fontSize: 13,
          color: hovered ? "#1A1814" : "#8C8880",
          transition: "color 150ms ease",
        }}
      >
        new color memory
      </span>
    </button>
  );
}

export function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [reelHovered, setReelHovered] = useState(false);
  const isDiary = location.pathname === "/";
  // Re-reads on every navigation since Nav re-renders with location changes
  const rollCount = getRoll().length;

  return (
    <nav style={{ borderBottom: "1px solid #E8E4DC" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "16px 48px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: 24,
            color: "var(--color-text-primary)",
            letterSpacing: "0.02em",
            position: "relative",
            zIndex: 1,
          }}
        >
          tintura
        </button>

        {/* Centered capture CTA — diary home only */}
        {isDiary && <NavCaptureCTA />}

        <button
          onClick={() => navigate("/roll")}
          onMouseEnter={() => setReelHovered(true)}
          onMouseLeave={() => setReelHovered(false)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
            position: "relative",
            zIndex: 1,
          }}
        >
          <ReelIcon spinning={reelHovered} />
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 400,
              fontSize: 11,
              color: "#8C8880",
              letterSpacing: "0.01em",
            }}
          >
            {rollCount} photos developing
          </span>
        </button>
      </div>
    </nav>
  );
}

export default function Root() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F9F7F4",
        backgroundImage: "radial-gradient(circle, rgba(180,168,148,0.65) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <GrainOverlay />
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.8); }
        }
        @keyframes reel-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar { width: 0; height: 0; }
        * { scrollbar-width: none; }
      `}</style>
      <Nav />
      <Outlet />
    </div>
  );
}

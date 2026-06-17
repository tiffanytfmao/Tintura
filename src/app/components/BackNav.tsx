import { useNavigate } from "react-router";

interface BackNavProps {
  label: string;
  to: string;
}

export function BackNav({ label, to }: BackNavProps) {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "16px 0 0 48px" }}>
      <button
        onClick={() => navigate(to)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontFamily: "var(--font-ui)",
          fontWeight: 400,
          fontSize: 13,
          color: "#8C8880",
          textDecoration: "none",
          transition: "color 150ms ease",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = "#1A1814";
          el.style.textDecoration = "underline";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = "#8C8880";
          el.style.textDecoration = "none";
        }}
      >
        ← Back
      </button>
    </div>
  );
}

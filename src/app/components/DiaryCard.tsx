import { useNavigate } from "react-router";
import { type DiaryEntry, splitName } from "../lib/storage";

export function DiaryCard({ entry }: { entry: DiaryEntry }) {
  const navigate = useNavigate();
  const { anchor, observation } = splitName(entry.name);

  return (
    <article
      onClick={() => navigate(`/entry/${entry.id}`)}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 4,
        boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
        cursor: "pointer",
        overflow: "hidden",
        transition: "transform 200ms ease, box-shadow 200ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 2px 8px rgba(0,0,0,0.09), 0 8px 24px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)";
      }}
    >
      {/* Photo — 3:4 aspect ratio */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "133.33%",
          background: "#E0DEDA",
          overflow: "hidden",
        }}
      >
        {entry.photo ? (
          <img
            src={entry.photo}
            alt={entry.name}
            loading="lazy"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : entry.isBlend && entry.blendPhotos ? (
          <BlendPhotoComposite photos={entry.blendPhotos} name={entry.name} />
        ) : null}

        {/* Inset border — printed photograph feel */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
            pointerEvents: "none",
          }}
        />
        {entry.isBlend && (
          <span
            style={{
              position: "absolute",
              bottom: 8,
              right: 10,
              fontFamily: "var(--font-ui)",
              fontSize: 11,
              color: "rgba(255,255,255,0.75)",
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            ⊕
          </span>
        )}
      </div>

      {/* Palette strip — 18px, flush below photo */}
      <div style={{ display: "flex", height: 18 }}>
        {entry.swatches.map((color, i) => (
          <div key={i} style={{ flex: 1, background: color }} />
        ))}
      </div>

      {/* Name — two-tier typographic hierarchy */}
      <div style={{ padding: "16px 14px 0", marginBottom: 6 }}>
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
            fontSize: 11,
            color: "#1A1814",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          {anchor}
        </span>
        {observation && (
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-display)",
              fontWeight: 300,
              fontSize: 17,
              color: "#1A1814",
              lineHeight: 1.45,
            }}
          >
            {observation}
          </span>
        )}
      </div>

      {/* Meta */}
      <div style={{ padding: "0 14px 14px" }}>
        {entry.location && (
          <>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontSize: 11,
                color: "#8C8880",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {entry.location}
            </span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "#8C8880", padding: "0 6px" }}>
              ·
            </span>
          </>
        )}
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 400,
            fontSize: 11,
            color: "#8C8880",
          }}
        >
          {new Date(entry.timestamp).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </article>
  );
}

function BlendPhotoComposite({
  photos,
  name,
}: {
  photos: [string | null, string | null];
  name: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
      }}
    >
      {photos[0] && (
        <div style={{ flex: 1, overflow: "hidden" }}>
          <img
            src={photos[0]}
            alt={name}
            style={{ width: "200%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}
      {photos[1] && (
        <div style={{ flex: 1, overflow: "hidden" }}>
          <img
            src={photos[1]}
            alt={name}
            style={{
              width: "200%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              marginLeft: "-100%",
            }}
          />
        </div>
      )}
    </div>
  );
}

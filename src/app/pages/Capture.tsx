import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { Camera, Upload } from "lucide-react";
import { BackNav } from "../components/BackNav";
import { addToRoll } from "../lib/storage";

type Step = "choose" | "camera" | "preview" | "note";

export default function Capture() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("choose");
  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  async function startCamera() {
    setCameraError(null);
    setStep("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Camera not available. Try uploading instead.");
      setStep("choose");
    }
  }

  function captureFromVideo() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopCamera();
    setPhoto(dataUrl);
    setStep("preview");
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto(ev.target?.result as string);
      setStep("preview");
    };
    reader.readAsDataURL(file);
  }

  function retake() {
    setPhoto(null);
    stopCamera();
    setStep("choose");
  }

  function handleAddToRoll() {
    if (!photo) return;
    addToRoll({
      id: `roll_${crypto.randomUUID()}`,
      photo,
      note: note.trim(),
      timestamp: new Date().toISOString(),
    });
    navigate("/roll");
  }

  // ─── Step 1: choose / camera / preview ───────────────────────────────────────

  if (step !== "note") {
    return (
      <>
        <BackNav label="back" to="/" />
        <div
          style={{
            minHeight: "calc(100vh - 48px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "24px 24px 48px",
          }}
        >
          <div
            style={{
              width: 390, height: 520,
              border: "1px dashed #E8E4DC", borderRadius: 4,
              overflow: "hidden", position: "relative",
              background: "var(--color-bg)", flexShrink: 0,
            }}
          >
            {step === "choose" && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
                {cameraError && (
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "#b94040", marginBottom: 24, textAlign: "center", maxWidth: 280 }}>
                    {cameraError}
                  </p>
                )}
                <button
                  onClick={startCamera}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: "20px 32px", borderRadius: 4, transition: "opacity 150ms ease" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.6")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                >
                  <Camera size={32} strokeWidth={1.25} style={{ color: "var(--color-text-secondary)" }} />
                  <span style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 14, color: "var(--color-text-primary)" }}>Take a photo</span>
                </button>
                <div style={{ width: 200, display: "flex", alignItems: "center", gap: 12, margin: "8px 0" }}>
                  <div style={{ flex: 1, height: 1, background: "#E8E4DC" }} />
                  <span style={{ fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 12, color: "var(--color-text-secondary)" }}>or</span>
                  <div style={{ flex: 1, height: 1, background: "#E8E4DC" }} />
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: "20px 32px", borderRadius: 4, transition: "opacity 150ms ease" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.6")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                >
                  <Upload size={32} strokeWidth={1.25} style={{ color: "var(--color-text-secondary)" }} />
                  <span style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 14, color: "var(--color-text-primary)" }}>Upload from camera roll</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
              </div>
            )}

            {step === "camera" && (
              <>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <button
                  onClick={captureFromVideo}
                  style={{
                    position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
                    width: 56, height: 56, borderRadius: "50%",
                    background: "#FFFFFF", border: "1px solid #E8E4DC", cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)", transition: "transform 120ms ease",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "translateX(-50%) scale(1.06)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "translateX(-50%)")}
                />
                <button
                  onClick={retake}
                  style={{ position: "absolute", top: 12, left: 14, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 12, color: "rgba(255,255,255,0.85)" }}
                >
                  Cancel
                </button>
              </>
            )}

            {step === "preview" && photo && (
              <>
                <img src={photo} alt="Captured" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <button
                  onClick={retake}
                  style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 12, color: "rgba(255,255,255,0.9)", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
                >
                  Retake
                </button>
              </>
            )}
          </div>

          {step === "preview" && (
            <button
              onClick={() => setStep("note")}
              style={{
                marginTop: 24, fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 14,
                color: "var(--color-text-primary)", background: "none",
                border: "1px solid var(--color-border-subtle)", borderRadius: 4,
                padding: "10px 24px", cursor: "pointer", letterSpacing: "0.01em",
                transition: "border-color 150ms ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#1A1814")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-subtle)")}
            >
              Continue →
            </button>
          )}
        </div>
      </>
    );
  }

  // ─── Step 2: note ─────────────────────────────────────────────────────────────

  return (
    <>
      <BackNav label="back" to="/" />
      <div style={{ minHeight: "calc(100vh - 48px)", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px 80px" }}>
        {photo && (
          <div style={{ maxWidth: 320, width: "100%", aspectRatio: "3/4", margin: "0 auto", borderRadius: 4, border: "1px solid #E8E4DC", overflow: "hidden", flexShrink: 0 }}>
            <img
              src={photo}
              alt="Your capture"
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(6px) saturate(0.75)", transform: "scale(1.04)", display: "block" }}
            />
          </div>
        )}

        <div style={{ width: "100%", maxWidth: 480, margin: "24px auto 0" }}>
          <span style={{ display: "block", fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 11, color: "#8C8880", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            what did you notice?
          </span>

          <textarea
            autoFocus
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
            placeholder="what stopped you?"
            rows={2}
            style={{
              width: "100%", fontFamily: "var(--font-display)", fontWeight: 300,
              fontStyle: note ? "normal" : "italic", fontSize: 22, color: "#1A1814",
              background: "transparent", border: "none", borderBottom: "1px solid #D4CEBF",
              outline: "none", resize: "none", padding: "0 0 8px", lineHeight: 1.45,
              letterSpacing: "-0.01em", boxSizing: "border-box", minHeight: 60,
              caretColor: "#C4A882", overflow: "hidden",
            }}
          />

          <p style={{ fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 11, color: "#8C8880", margin: "6px 0 0" }}>
            this becomes your entry name — edit it any time
          </p>

          <button
            onClick={handleAddToRoll}
            style={{
              marginTop: 20, fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 13,
              color: "#1A1814", background: "transparent", border: "1px solid #1A1814",
              borderRadius: 4, padding: "10px 24px", cursor: "pointer",
              letterSpacing: "0.01em", display: "block", transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.65")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            Add to Roll →
          </button>

          <p style={{ fontFamily: "var(--font-ui)", fontWeight: 400, fontSize: 11, color: "#8C8880", marginTop: 8 }}>
            {"you'll pick the colors later."}
          </p>
        </div>
      </div>
    </>
  );
}

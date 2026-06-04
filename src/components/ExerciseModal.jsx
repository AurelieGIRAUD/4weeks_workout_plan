import { MuscleFront, MuscleBack } from './MuscleMap';
import { EXERCISES } from '../lib/workoutData';

const ytLink = (q) => `youtube://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export default function ExerciseModal({ name, onClose }) {
  const ex = EXERCISES[name];
  if (!ex) return null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#15151e", borderRadius: 20, padding: 22, maxWidth: 380, width: "100%", border: "1px solid #2e2e42", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 15, color: "#f0ede8", lineHeight: 1.3, paddingRight: 12 }}>{name}</h3>
          <button onClick={onClose} style={{ background: "#2a2a38", border: "none", borderRadius: 8, color: "#aaa", fontSize: 16, cursor: "pointer", padding: "4px 10px", flexShrink: 0 }}>✕</button>
        </div>

        <a href={ytLink(ex.ytQuery)} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 12, background: "#cc0000", borderRadius: 12, padding: "13px 16px", textDecoration: "none", marginBottom: 18 }}>
          <svg width="28" height="20" viewBox="0 0 28 20"><rect width="28" height="20" rx="4" fill="#cc0000"/><polygon points="11,5 22,10 11,15" fill="white"/></svg>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 13 }}>Watch on YouTube</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 2 }}>Opens YouTube app</div>
          </div>
        </a>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 10 }}>Muscles Targeted</div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#555", marginBottom: 4 }}>Front</div>
              <MuscleFront highlighted={ex.frontMuscles} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#555", marginBottom: 4 }}>Back</div>
              <MuscleBack highlighted={ex.backMuscles} />
            </div>
            <div style={{ flex: 1, paddingTop: 16 }}>
              <div style={{ fontSize: 9, color: "#555", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Primary</div>
              {ex.primary.map((m, i) => (
                <div key={i} style={{ fontSize: 11, color: "#e8c547", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e8c547", flexShrink: 0, display: "inline-block" }} />{m}
                </div>
              ))}
              {ex.secondary?.length > 0 && <>
                <div style={{ fontSize: 9, color: "#555", marginBottom: 4, marginTop: 8, letterSpacing: 1, textTransform: "uppercase" }}>Supporting</div>
                {ex.secondary.map((m, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#666", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#444", flexShrink: 0, display: "inline-block" }} />{m}
                  </div>
                ))}
              </>}
            </div>
          </div>
        </div>

        <div style={{ background: "#0e0e14", borderRadius: 10, padding: "10px 12px", borderLeft: "3px solid #e8c547" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#e8c547", marginBottom: 5 }}>Key Form Cue</div>
          <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.7 }}>{ex.cue}</div>
        </div>
      </div>
    </div>
  );
}

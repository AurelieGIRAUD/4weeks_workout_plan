import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import {
  SESSIONS, WEEKS, DAY_ORDER, weekAccent, tagStyle,
  MUSCLE_IMAGES, SESSION_IMAGE
} from "./lib/workoutData";
import ProgressRings from "./components/ProgressRings";

export default function App() {
  const [activeWeek, setActiveWeek] = useState(0);
  const [expandedDay, setExpandedDay] = useState(null);
  const [completed, setCompleted] = useState({});
  const [minutes, setMinutes] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [promptKey, setPromptKey] = useState(null);
  const [promptMinutes, setPromptMinutes] = useState("");

  useEffect(() => { loadCompletions(); }, []);

  const loadCompletions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("workout_completions")
        .select("week_number, day_index, duration_minutes");
      if (error) throw error;
      const cMap = {};
      const mMap = {};
      data.forEach(({ week_number, day_index, duration_minutes }) => {
        const k = "w" + (week_number - 1) + "-d" + day_index;
        cMap[k] = true;
        mMap[k] = duration_minutes || 0;
      });
      setCompleted(cMap);
      setMinutes(mMap);
    } catch (err) {
      console.error("Error loading completions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTick = (weekIndex, dayIndex, e) => {
    e.stopPropagation();
    const key = "w" + weekIndex + "-d" + dayIndex;
    const isDone = !!completed[key];
    if (isDone) {
      // untick directly — no prompt needed
      untick(weekIndex, dayIndex, key);
    } else {
      // show duration prompt before saving
      setPromptKey(key + "|" + weekIndex + "|" + dayIndex);
      setPromptMinutes("");
    }
  };

  const untick = async (weekIndex, dayIndex, key) => {
    setSaving(key);
    try {
      const { error } = await supabase
        .from("workout_completions").delete()
        .eq("week_number", weekIndex + 1).eq("day_index", dayIndex);
      if (error) throw error;
      setCompleted(p => { const n = { ...p }; delete n[key]; return n; });
      setMinutes(p => { const n = { ...p }; delete n[key]; return n; });
    } catch (err) {
      console.error("Error removing:", err);
    } finally {
      setSaving(null);
    }
  };

  const confirmPrompt = async () => {
    if (!promptKey) return;
    const parts = promptKey.split("|");
    const key = parts[0];
    const weekIndex = parseInt(parts[1]);
    const dayIndex = parseInt(parts[2]);
    const mins = parseInt(promptMinutes) || 0;
    setSaving(key);
    setPromptKey(null);
    try {
      const { error } = await supabase
        .from("workout_completions")
        .insert({ week_number: weekIndex + 1, day_index: dayIndex, duration_minutes: mins });
      if (error) throw error;
      setCompleted(p => ({ ...p, [key]: true }));
      setMinutes(p => ({ ...p, [key]: mins }));
    } catch (err) {
      console.error("Error saving:", err);
      alert("Could not save — check your connection and try again.");
    } finally {
      setSaving(null);
    }
  };

  const skipPrompt = async () => {
    if (!promptKey) return;
    const parts = promptKey.split("|");
    const key = parts[0];
    const weekIndex = parseInt(parts[1]);
    const dayIndex = parseInt(parts[2]);
    setSaving(key);
    setPromptKey(null);
    try {
      const { error } = await supabase
        .from("workout_completions")
        .insert({ week_number: weekIndex + 1, day_index: dayIndex, duration_minutes: 0 });
      if (error) throw error;
      setCompleted(p => ({ ...p, [key]: true }));
      setMinutes(p => ({ ...p, [key]: 0 }));
    } catch (err) {
      console.error("Error saving:", err);
    } finally {
      setSaving(null);
    }
  };

  const weekActualMinutes = (weekIdx) => {
    return DAY_ORDER.reduce((sum, _, di) => {
      const k = "w" + weekIdx + "-d" + di;
      return sum + (minutes[k] || 0);
    }, 0);
  };

  const accent = weekAccent[activeWeek];
  const week = WEEKS[activeWeek];
  const weekProgress = DAY_ORDER.filter((_, i) => completed["w" + activeWeek + "-d" + i]).length;
  const totalCompleted = Object.keys(completed).length;
  const actualMin = weekActualMinutes(activeWeek);
  const toggleDay = (i) => setExpandedDay(expandedDay === i ? null : i);

  if (loading) {
    return (
      <div style={{ background: "#0e0e14", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, border: "3px solid #1e1e2c", borderTop: "3px solid #e8c547", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ color: "#888", fontSize: 13, fontFamily: "Georgia, serif" }}>Loading your plan...</div>
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#0e0e14", minHeight: "100vh", color: "#f0ede8", paddingBottom: 80 }}>

      {/* Duration prompt modal */}
      {promptKey && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#15151e", border: "1px solid #2e2e42", borderRadius: 20, padding: 28, maxWidth: 320, width: "100%" }}>
            <div style={{ fontSize: 22, textAlign: "center", marginBottom: 8 }}>💪</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "#f0ede8", textAlign: "center" }}>Great work!</h3>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: "#999", textAlign: "center", lineHeight: 1.6 }}>How many minutes did you actually train?</p>
            <input
              type="number"
              value={promptMinutes}
              onChange={function(e) { setPromptMinutes(e.target.value); }}
              onKeyDown={function(e) { if (e.key === "Enter") confirmPrompt(); }}
              placeholder="e.g. 42"
              autoFocus
              style={{ width: "100%", background: "#0e0e14", border: "1px solid #2a2a38", borderRadius: 10, padding: "12px 14px", fontSize: 20, color: "#f0ede8", textAlign: "center", fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box", marginBottom: 14 }}
            />
            <button onClick={confirmPrompt}
              style={{ width: "100%", background: accent, border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, color: "#111", cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>
              Save
            </button>
            <button onClick={skipPrompt}
              style={{ width: "100%", background: "transparent", border: "1px solid #2a2a38", borderRadius: 10, padding: "10px 0", fontSize: 12, color: "#888", cursor: "pointer", fontFamily: "inherit" }}>
              Skip — just mark as done
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "#111118", padding: "48px 20px 24px", borderBottom: "1px solid #1e1e2c", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase", color: "#888", marginBottom: 4 }}>
                Summer Body Better at 40
              </div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>My 4-weeks Workout Plan</h1>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#e8c547" }}>{totalCompleted}</div>
              <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>total done</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, marginTop: 14, overflowX: "auto", paddingBottom: 4 }}>
            {WEEKS.map(function(w, i) {
              return (
                <button key={i} onClick={function() { setActiveWeek(i); setExpandedDay(null); }}
                  style={{ padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0, background: activeWeek === i ? weekAccent[i] : "#1a1a24", color: activeWeek === i ? "#111" : "#555", transition: "all 0.2s" }}>
                  {w.deload ? "Wk 4 Deload" : "Wk " + (i + 1) + " — " + w.tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ProgressRings completed={completed} />

      {/* Week header + active minutes */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, color: accent }}>{week.tag}</h2>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#888", lineHeight: 1.5 }}>{week.note}</p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: accent }}>{weekProgress}</span>
            <span style={{ fontSize: 12, color: "#777" }}>/7</span>
            <div style={{ fontSize: 9, color: "#777", textTransform: "uppercase", letterSpacing: 1 }}>this week</div>
          </div>
        </div>


        {/* Actual minutes logged this week */}
        <div style={{ marginTop: 14, background: "#15151e", border: "1px solid #1e1e2c", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#999" }}>Active minutes logged this week</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: actualMin >= 150 ? "#34D399" : accent }}>
              {actualMin} / 150 min
              {actualMin >= 150 ? " ✓" : ""}
            </span>
          </div>
          <div style={{ height: 5, background: "#1a1a24", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: Math.min(100, Math.round((actualMin / 150) * 100)) + "%", background: actualMin >= 150 ? "#34D399" : accent, borderRadius: 3, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ fontSize: 10, color: "#777", marginTop: 6 }}>
            {actualMin === 0
              ? "Tick a workout and log your actual training time to start tracking"
              : actualMin >= 150
              ? "WHO/ACSM 150-min weekly target reached"
              : (150 - actualMin) + " min to reach the 150-min weekly target"}
          </div>
        </div>
      </div>

      {/* Day cards */}
      <div style={{ maxWidth: 560, margin: "12px auto 0", padding: "0 20px" }}>
        {DAY_ORDER.map(function(dayKey, i) {
          const session = SESSIONS[dayKey];
          const wd = session.weeks[activeWeek];
          const key = "w" + activeWeek + "-d" + i;
          const isDone = !!completed[key];
          const isExp = expandedDay === i;
          const isSaving = saving === key;
          const isRest = session.type === "rest";
          const ts = tagStyle[session.type] || tagStyle.rest;
          const imgKey = SESSION_IMAGE[dayKey];
          const sessionImg = imgKey ? MUSCLE_IMAGES[imgKey] : null;
          const loggedMins = minutes[key] || 0;

          return (
            <div key={dayKey} onClick={function() { toggleDay(i); }}
              style={{ marginBottom: 8, borderRadius: 14, overflow: "hidden", cursor: "pointer", background: isDone ? "#0c180c" : "#15151e", border: "1px solid " + (isDone ? "#1e3d1e" : isExp ? "#2e2e42" : "#1e1e2c"), boxShadow: isExp ? "0 8px 32px rgba(0,0,0,0.5)" : "none", transition: "all 0.2s" }}>

              <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div onClick={function(e) { if (!isRest) handleTick(activeWeek, i, e); }}
                  style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, cursor: isRest ? "default" : "pointer", border: "2px solid " + (isDone ? "#4ade80" : "#2a2a38"), background: isDone ? "#4ade80" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s", opacity: isSaving ? 0.5 : 1 }}>
                  {isSaving
                    ? <div style={{ width: 10, height: 10, border: "2px solid #888", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                    : isDone ? <span style={{ color: "#0a1a0a", fontSize: 12, fontWeight: 900 }}>✓</span> : null}
                </div>

                {sessionImg ? (
                  <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", border: "1px solid " + session.color + "40", flexShrink: 0 }}>
                    <img src={sessionImg} alt={session.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%" }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 28, flexShrink: 0, width: 44, textAlign: "center" }}>{session.icon}</div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: isDone ? "#4ade80" : "#f0ede8" }}>{session.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", padding: "2px 8px", borderRadius: 6, background: ts.bg, color: ts.text }}>{session.type}</span>
                    {wd.duration !== "—" && <span style={{ fontSize: 10, color: "#888" }}>{wd.duration}</span>}
                    {week.deload && !isRest && <span style={{ fontSize: 9, background: "#2a1a3a", color: "#A78BFA", padding: "2px 7px", borderRadius: 8 }}>DELOAD</span>}
                  </div>
                  <div style={{ fontSize: 12, color: isDone ? "#4ade8088" : "#666", marginTop: 3 }}>{session.title}</div>
                  {isDone && loggedMins > 0 && (
                    <div style={{ fontSize: 10, color: "#4ade8066", marginTop: 3 }}>Logged: {loggedMins} min</div>
                  )}
                  {session.equipment && session.equipment.length > 0 && (
                    <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                      {session.equipment.map(function(eq) {
                        return <span key={eq} style={{ fontSize: 9, background: "#1a1a24", border: "1px solid #2a2a38", borderRadius: 10, padding: "2px 7px", color: "#999" }}>{eq}</span>;
                      })}
                    </div>
                  )}
                </div>

                <div style={{ color: "#333", transform: isExp ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", fontSize: 14 }}>▼</div>
              </div>

              {isExp && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid #1e1e2c" }}>
                  {week.deload && !isRest && (
                    <div style={{ margin: "12px 0 10px", background: "#2a1a3a", border: "1px solid #A78BFA50", borderRadius: 10, padding: "8px 12px", fontSize: 11, color: "#A78BFA" }}>
                      Deload week — 50% volume. Keep perfect form. No chasing failure.
                    </div>
                  )}
                  {wd.supersetNote && (
                    <div style={{ margin: "10px 0 8px", background: "#1a1a28", border: "1px solid #2a2a38", borderRadius: 10, padding: "8px 12px", fontSize: 11, color: "#9090b8", fontStyle: "italic" }}>
                      {wd.supersetNote}
                    </div>
                  )}
                  {session.targetSets && !week.deload && (
                    <div style={{ margin: "8px 0", background: session.color + "18", border: "1px solid " + session.color + "40", borderRadius: 10, padding: "8px 12px", fontSize: 11, color: session.color }}>
                      {session.targetSets}
                    </div>
                  )}
                  {wd.sections && wd.sections.map(function(section, si) {
                    return (
                      <div key={si} style={{ marginBottom: 14, marginTop: si === 0 ? 12 : 0 }}>
                        <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: section.ss ? accent : "#666", fontWeight: section.ss ? 800 : 600, marginBottom: 7 }}>
                          {section.name}
                          {section.ss && <span style={{ marginLeft: 6, fontSize: 8, background: accent + "20", color: accent, padding: "1px 6px", borderRadius: 4 }}>SS</span>}
                        </div>
                        {section.note && (
                          <div style={{ fontSize: 10, color: "#888", fontStyle: "italic", marginBottom: 6, paddingLeft: 4 }}>{section.note}</div>
                        )}
                        {section.exercises && section.exercises.map(function(ex, ei) {
                          return (
                            <div key={ei} style={{ marginBottom: 6, padding: "8px 10px", background: "#0e0e14", borderRadius: 8, borderLeft: "3px solid " + session.color + "40" }}>
                              <div
                                onClick={function(e) {
                                  e.stopPropagation();
                                  window.open("youtube://www.youtube.com/results?search_query=" + encodeURIComponent(ex.name + " exercise tutorial form"), "_blank");
                                }}
                                style={{ fontSize: 12, color: accent, fontWeight: 600, cursor: "pointer", textDecoration: "underline dotted", textUnderlineOffset: 3 }}>
                                {ex.name} ↗
                              </div>
                              {ex.detail && <div style={{ fontSize: 11, color: "#888", marginTop: 3, lineHeight: 1.5 }}>{ex.detail}</div>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{"@keyframes spin { to { transform: rotate(360deg); } } * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; } body { margin: 0; padding: 0; }"}</style>
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { makeWeek, weekMeta, weekAccent, tagStyle, runDetails, EXERCISES } from "./lib/workoutData";
import ExerciseModal from "./components/ExerciseModal";

export default function App() {
  const [activeWeek, setActiveWeek] = useState(0);
  const [expandedDay, setExpandedDay] = useState(null);
  const [completed, setCompleted] = useState({});
  const [showNutrition, setShowNutrition] = useState(false);
  const [activeExercise, setActiveExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  // Load completions from Supabase on mount
  useEffect(() => {
    loadCompletions();
  }, []);

  const loadCompletions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("workout_completions")
        .select("week_number, day_index");

      if (error) throw error;

      const map = {};
      data.forEach(({ week_number, day_index }) => {
        map[`w${week_number - 1}-d${day_index}`] = true;
      });
      setCompleted(map);
    } catch (err) {
      console.error("Error loading completions:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (weekIndex, dayIndex, e) => {
    e.stopPropagation();
    const key = `w${weekIndex}-d${dayIndex}`;
    const isDone = !!completed[key];
    setSaving(key);

    try {
      if (isDone) {
        const { error } = await supabase
          .from("workout_completions")
          .delete()
          .eq("week_number", weekIndex + 1)
          .eq("day_index", dayIndex);
        if (error) throw error;
        setCompleted(p => { const n = { ...p }; delete n[key]; return n; });
      } else {
        const { error } = await supabase
          .from("workout_completions")
          .insert({ week_number: weekIndex + 1, day_index: dayIndex });
        if (error) throw error;
        setCompleted(p => ({ ...p, [key]: true }));
      }
    } catch (err) {
      console.error("Error saving completion:", err);
      alert("Could not save — check your connection and try again.");
    } finally {
      setSaving(null);
    }
  };

  const wNum = activeWeek + 1;
  const meta = weekMeta[activeWeek];
  const days = makeWeek(wNum);
  const accent = weekAccent[activeWeek];
  const weekProgress = days.filter((_, i) => completed[`w${activeWeek}-d${i}`]).length;
  const totalCompleted = Object.keys(completed).length;

  const toggleDay = (i) => setExpandedDay(expandedDay === i ? null : i);
  const openExercise = (name, e) => { e.stopPropagation(); if (EXERCISES[name]) setActiveExercise(name); };

  if (loading) {
    return (
      <div style={{ background: "#0e0e14", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, border: "3px solid #1e1e2c", borderTop: "3px solid #e8c547", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ color: "#555", fontSize: 13, fontFamily: "Georgia, serif" }}>Loading your plan...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#0e0e14", minHeight: "100vh", color: "#f0ede8", paddingBottom: 80 }}>

      {activeExercise && (
        <ExerciseModal name={activeExercise} onClose={() => setActiveExercise(null)} />
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #111118 0%, #0e0e14 100%)", padding: "48px 20px 24px", borderBottom: "1px solid #1e1e2c", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase", color: "#555", marginBottom: 4 }}>3 Strength · 2 Runs · Glutes 2×/week</div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>Lily's Workout Plan</h1>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#e8c547" }}>{totalCompleted}</div>
              <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>total done</div>
            </div>
          </div>

          {/* Week tabs */}
          <div style={{ display: "flex", gap: 6, marginTop: 16, overflowX: "auto", paddingBottom: 4 }}>
            {weekMeta.map((w, i) => (
              <button key={i} onClick={() => { setActiveWeek(i); setExpandedDay(null); }}
                style={{ padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", background: activeWeek === i ? weekAccent[i] : "#1a1a24", color: activeWeek === i ? "#111" : "#555", transition: "all 0.2s", flexShrink: 0 }}>
                {w.theme === "Deload" ? "Wk 4 Deload" : `Wk ${w.week} — ${w.theme}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Week progress */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, color: accent }}>{meta.theme}</h2>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "#555" }}>{meta.subtitle}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: accent }}>{weekProgress}</span>
            <span style={{ fontSize: 12, color: "#444" }}>/7</span>
            <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: 1 }}>this week</div>
          </div>
        </div>
        <div style={{ marginTop: 10, background: "#1a1a24", borderRadius: 3, height: 4 }}>
          <div style={{ width: `${(weekProgress / 7) * 100}%`, height: "100%", background: accent, borderRadius: 3, transition: "width 0.4s" }} />
        </div>
      </div>

      {/* Day cards */}
      <div style={{ maxWidth: 560, margin: "12px auto 0", padding: "0 20px" }}>
        {days.map((day, i) => {
          const key = `w${activeWeek}-d${i}`;
          const isDone = !!completed[key];
          const isExp = expandedDay === i;
          const isSaving = saving === key;
          const ts = tagStyle[day.tag] || tagStyle.Rest;
          const isSimple = day.run || day.yoga || day.tag === "Rest";
          const rd = day.run ? runDetails[day.runWeek] : null;

          return (
            <div key={i} onClick={() => toggleDay(i)}
              style={{ marginBottom: 8, borderRadius: 14, overflow: "hidden", cursor: "pointer", background: isDone ? "#0c180c" : "#15151e", border: `1px solid ${isDone ? "#1e3d1e" : isExp ? "#2e2e42" : "#1e1e2c"}`, boxShadow: isExp ? "0 8px 32px rgba(0,0,0,0.5)" : "none", transition: "all 0.2s" }}>

              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                {/* Completion circle */}
                <div onClick={e => toggleComplete(activeWeek, i, e)}
                  style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, cursor: "pointer", border: `2px solid ${isDone ? "#4ade80" : "#2a2a38"}`, background: isDone ? "#4ade80" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s", opacity: isSaving ? 0.5 : 1 }}>
                  {isSaving ? (
                    <div style={{ width: 10, height: 10, border: "2px solid #888", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  ) : isDone ? (
                    <span style={{ color: "#0a1a0a", fontSize: 14, fontWeight: 900 }}>✓</span>
                  ) : null}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: isDone ? "#4ade80" : "#f0ede8" }}>{day.day}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", padding: "2px 8px", borderRadius: 6, background: ts.bg, color: ts.text }}>{day.tag}</span>
                    {day.duration && <span style={{ fontSize: 10, color: "#555" }}>⏱ {day.duration}</span>}
                    {day.run && <span style={{ fontSize: 10, color: "#6fcf8a" }}>📏 5 km</span>}
                  </div>
                  <div style={{ fontSize: 12, color: isDone ? "#4ade8088" : "#555", marginTop: 3 }}>{day.label}</div>
                </div>

                <div style={{ color: "#333", transform: isExp ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", fontSize: 14 }}>▼</div>
              </div>

              {/* Expanded content */}
              {isExp && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid #1e1e2c" }}>
                  {isSimple ? (
                    day.run ? (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 12, color: "#6fcf8a", marginBottom: 12, lineHeight: 1.6 }}>
                          {day.runDay === "Monday" ? "🏃 First run of the week — legs are fresh. This is your benchmark time." : "🏃 End of training week run — go by feel, not pace."}
                        </div>
                        {[
                          { label: "Distance", value: "5 km" },
                          { label: "Effort", value: rd.effort },
                          { label: "Goal", value: rd.goal },
                        ].map((item, j) => (
                          <div key={j} style={{ padding: "9px 12px", background: "#0e0e14", borderRadius: 8, marginBottom: 6, borderLeft: "3px solid #6fcf8a44" }}>
                            <span style={{ fontSize: 10, color: "#6fcf8a", marginRight: 6 }}>{item.label}:</span>
                            <span style={{ fontSize: 12, color: "#aaa" }}>{item.value}</span>
                          </div>
                        ))}
                        <div style={{ fontSize: 12, color: "#666", marginTop: 10, fontStyle: "italic", lineHeight: 1.6 }}>{rd.tip}</div>
                        <div style={{ fontSize: 11, color: "#555", marginTop: 8, lineHeight: 1.6 }}>💧 Hydrate well before — creatine + running = higher water needs.</div>
                      </div>
                    ) : (
                      <p style={{ margin: "14px 0 0", fontSize: 12, color: "#777", lineHeight: 1.8 }}>{day.note}</p>
                    )
                  ) : (
                    <>
                      {day.focus && <div style={{ margin: "12px 0 12px", fontSize: 12, color: accent, fontStyle: "italic", lineHeight: 1.5 }}>{day.focus}</div>}

                      {/* Warmup */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#444", marginBottom: 6 }}>5 min Warm-up</div>
                        {day.warmup?.map((wu, j) => (
                          <div key={j} style={{ fontSize: 11, color: "#666", padding: "3px 0 3px 10px", borderLeft: "2px solid #22222e" }}>{wu}</div>
                        ))}
                      </div>

                      {/* Supersets */}
                      {day.supersets?.map((ss, j) => (
                        <div key={j} style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: accent, marginBottom: 8, opacity: 0.8 }}>{ss.label}</div>
                          {ss.exercises.map((exItem, k) => {
                            const hasInfo = !!EXERCISES[exItem.name];
                            return (
                              <div key={k} style={{ marginBottom: 7, padding: "9px 11px", background: "#0e0e14", borderRadius: 9, borderLeft: `3px solid ${accent}28` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                                  <span onClick={e => openExercise(exItem.name, e)}
                                    style={{ fontSize: 12, color: hasInfo ? accent : "#ddd", fontWeight: 600, cursor: hasInfo ? "pointer" : "default", textDecoration: hasInfo ? "underline dotted" : "none", textUnderlineOffset: 3 }}>
                                    {exItem.name}{hasInfo ? " ↗" : ""}
                                  </span>
                                  <span style={{ fontSize: 11, color: "#777", fontWeight: 700, flexShrink: 0 }}>{exItem.sets}</span>
                                </div>
                                <div style={{ fontSize: 11, color: "#555", marginTop: 3, lineHeight: 1.5 }}>{exItem.note}</div>
                              </div>
                            );
                          })}
                          <div style={{ fontSize: 10, color: "#444", fontStyle: "italic", marginTop: 4 }}>⏸ {ss.rest}</div>
                        </div>
                      ))}

                      {day.finisher && (
                        <div style={{ marginBottom: 9, padding: "9px 11px", background: "#0d1828", borderRadius: 9, borderLeft: "3px solid #7eb8e8" }}>
                          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#7eb8e8", marginBottom: 4 }}>Finisher</div>
                          <div style={{ fontSize: 11, color: "#8aa" }}>{day.finisher}</div>
                        </div>
                      )}

                      {day.cooldown && (
                        <div style={{ padding: "9px 11px", background: "#130d1e", borderRadius: 9, borderLeft: "3px solid #9b7ac8" }}>
                          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#9b7ac8", marginBottom: 4 }}>Cool-down</div>
                          <div style={{ fontSize: 11, color: "#8a7a9a" }}>{day.cooldown}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Nutrition panel */}
      <div style={{ maxWidth: 560, margin: "12px auto 0", padding: "0 20px" }}>
        <div onClick={() => setShowNutrition(!showNutrition)}
          style={{ padding: "14px 16px", borderRadius: 14, background: "#15151e", border: "1px solid #1e1e2c", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#f0ede8", fontWeight: 700 }}>🥩 Nutrition, Calories & Recovery</span>
          <span style={{ color: "#444", transform: showNutrition ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", fontSize: 14 }}>▼</span>
        </div>
        {showNutrition && (
          <div style={{ background: "#0e0e14", border: "1px solid #1e1e2c", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "14px 16px" }}>
            {[
              "🥩 Protein: 90–100g daily — non-negotiable for muscle tone + fat loss at 39",
              "🔥 Calories: ~1,500 kcal/day — add ~200 kcal on run days (Mon + Fri)",
              "💧 Hydration: 2.5L+ strength days · 3L+ run days",
              "⏰ Creatine: any time daily — post-workout with small carb is optimal",
              "🌙 Pre-training: protein-rich snack 60–90 min before, not a full meal",
              "📉 3-month plan: repeat Weeks 1–3, deload Week 4, restart",
              "😴 Sleep: 7–8h minimum — cortisol at 39 directly blocks fat loss",
            ].map((tip, i, arr) => (
              <div key={i} style={{ fontSize: 12, color: "#777", lineHeight: 1.8, padding: "5px 0", borderBottom: i < arr.length - 1 ? "1px solid #16161e" : "none" }}>{tip}</div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        body { margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}

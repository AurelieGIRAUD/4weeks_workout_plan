import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import {
  SESSIONS, WEEKS, DAY_ORDER, weekAccent, tagStyle,
  MUSCLE_IMAGES, SESSION_IMAGE
} from "./lib/workoutData";
import ProgressRings from "./components/ProgressRings";

// ─── JOKER COLORS ─────────────────────────────────────────────────────────────
const JC = {
  pilates: "#A78BFA",
  glutes:  "#FF5C87",
  run:     "#3ECFB2",
  arms:    "#FF9A3C",
};

// ─── ZERO DAY REASONS ─────────────────────────────────────────────────────────
const ZERO_REASONS = [
  "🤒 Sick", "😓 Exhausted", "✈️ Travelling", "👨‍👩‍👧 Family / Social",
  "🧠 Mental health day", "🤕 Injury / Pain", "💼 Work overload",
  "⏰ No time", "🎨 Creative Activity",
];

// ─── JOKER WORKOUTS ───────────────────────────────────────────────────────────
const JOKER_DAYS = [
  {
    id: "mobility",
    icon: "🧘",
    title: "Mobility Flow",
    duration: "~20 min",
    minutesCount: 20,
    color: JC.pilates,
    tagline: "Deep stretch · joint mobility · zero intensity",
    sections: [
      { name: "Hip & Glute Openers", exercises: [
        { name: "90/90 hip switches", detail: "1 min · rotate slowly between both positions · breathe into the stretch" },
        { name: "Pigeon pose", detail: "90 sec / side · let gravity do the work" },
        { name: "Supine figure-4", detail: "60 sec / side · gentle pull on shin" },
      ]},
      { name: "Thoracic & Shoulder", exercises: [
        { name: "Thread the needle", detail: "45 sec / side · thoracic rotation · let shoulder melt down" },
        { name: "Cat-cow", detail: "10 slow reps · breathe: exhale round, inhale arch" },
        { name: "Doorframe chest opener", detail: "45 sec · arms at 90°, lean into stretch" },
      ]},
      { name: "Full Body Flow", exercises: [
        { name: "World's greatest stretch", detail: "5 reps / side · lunge + rotate + reach — all planes of motion" },
        { name: "Downdog to cobra flow", detail: "8 slow reps · exhale down, inhale up" },
        { name: "Supine spinal twist", detail: "60 sec / side · close your eyes, breathe" },
      ]},
    ],
  },
  {
    id: "activation",
    icon: "🔴",
    title: "Glute Activation Only",
    duration: "~15 min",
    minutesCount: 15,
    color: JC.glutes,
    tagline: "Signal the muscle · no kettlebell · no fatigue",
    sections: [
      { name: "Band Activation", exercises: [
        { name: "Banded clamshells", detail: "2×15 / side · band above knees · slow squeeze at top" },
        { name: "Glute bridge hold", detail: "2×12 · 2-sec squeeze · lower back stays neutral" },
        { name: "Lateral band walk", detail: "2×15 steps / side · stay low · band at ankles" },
      ]},
      { name: "Bodyweight Finisher", exercises: [
        { name: "Donkey kickback", detail: "2×12 / side · squeeze glute at peak, slow return" },
        { name: "Side-lying hip abduction", detail: "2×15 / side · no band · slow arc, feel the medius" },
      ]},
    ],
  },
  {
    id: "walk",
    icon: "🚶",
    title: "Treadmill Walk",
    duration: "~25 min",
    minutesCount: 25,
    color: JC.run,
    tagline: "Incline walk · low impact · glute stimulus",
    sections: [
      { name: "Incline Walk", note: "Maintain upright posture — don't hold the handles.", exercises: [
        { name: "Warm-up flat walk", detail: "3 min · 5 km/h · loosen the legs" },
        { name: "Incline walk", detail: "20 min · 5.5–6 km/h · 5–7% incline · push through the heel" },
        { name: "Cool-down flat walk", detail: "2 min · 4.5 km/h · let heart rate settle" },
      ]},
      { name: "Stretch (optional)", exercises: [
        { name: "Standing calf + hip flexor stretch", detail: "45 sec / side · post-walk feels great" },
      ]},
    ],
  },
  {
    id: "mini",
    icon: "💪",
    title: "Mini Strength Circuit",
    duration: "~25 min",
    minutesCount: 25,
    color: JC.arms,
    tagline: "2 sets · no failure · bodyweight + band only",
    sections: [
      { name: "Lower Body", exercises: [
        { name: "Bodyweight squat", detail: "2×12 · slow · feel the movement pattern" },
        { name: "Banded floor hip thrust", detail: "2×15 · moderate band · 1-sec squeeze at top" },
        { name: "Lateral band walk", detail: "2×12 steps / side" },
      ]},
      { name: "Upper Body", exercises: [
        { name: "Band shoulder press", detail: "2×12 · stand on band · elbows in front of ears" },
        { name: "Band bicep curl", detail: "2×12 · slow tempo · 2 sec up, 3 sec down" },
        { name: "Band face pull", detail: "2×15 · anchor at face height · posture builder" },
      ]},
      { name: "Core", exercises: [
        { name: "Dead bug", detail: "2×8 / side · lower back glued to floor" },
        { name: "Plank hold", detail: "2×25 sec · squeeze everything" },
      ]},
    ],
  },
];

// jokerLogs key: "{weekIdx}_{id}" e.g. "0_mobility", "2_zero"
function jlKey(weekIdx, id) { return weekIdx + "_" + id; }

export default function App() {
  const [activeWeek, setActiveWeek] = useState(0);
  const [expandedDay, setExpandedDay] = useState(null);
  const [completed, setCompleted] = useState({});
  const [minutes, setMinutes] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  // Regular session duration prompt
  const [promptKey, setPromptKey] = useState(null);
  const [promptMinutes, setPromptMinutes] = useState("");

  // Weight tracking
  const [weekWeights, setWeekWeights] = useState({});
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [weightSaving, setWeightSaving] = useState(false);
  const [weightModalWeek, setWeightModalWeek] = useState(null);

  // Joker workout duration prompt
  const [jokerPromptId, setJokerPromptId] = useState(null);
  const [jokerPromptMinutes, setJokerPromptMinutes] = useState("");
  const [jokerEditIdx, setJokerEditIdx] = useState(null); // null = new entry, number = editing entry at that index

  // ─── JOKER STATE (unified log array model) ──────────────────────────────────
  // jokerLogs: { "0_mobility": [{minutes, ts}, ...], "0_zero": [{reasons, note, ts}, ...] }
  const [jokerLogs, setJokerLogs] = useState(function() {
    try { return JSON.parse(localStorage.getItem("joker_logs") || "{}"); } catch { return {}; }
  });
  const [expandedJoker, setExpandedJoker] = useState(null);
  const [showZeroModal, setShowZeroModal] = useState(false);
  const [zeroDraftReasons, setZeroDraftReasons] = useState([]);
  const [zeroDraftNote, setZeroDraftNote] = useState("");

  // ─── SUNDAY REST TRACKING ───────────────────────────────────────────────────
  // Separate from completed — does not affect session counts or 150-min total
  const [restDone, setRestDone] = useState(function() {
    try { return JSON.parse(localStorage.getItem("rest_done") || "{}"); } catch { return {}; }
  });

  useEffect(() => { loadCompletions(); }, []);

  useEffect(() => {
    async function loadWeights() {
      const { data, error } = await supabase
        .from("weekly_weights")
        .select("week_index, weight_kg")
        .order("logged_at", { ascending: false });
      if (error) { console.error("loadWeights:", error); return; }
      const map = {};
      data.forEach(function(row) {
        if (map[row.week_index] === undefined) map[row.week_index] = String(row.weight_kg);
      });
      setWeekWeights(map);
    }
    loadWeights();
  }, []);

  const loadCompletions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("workout_completions")
        .select("week_number, day_index, duration_minutes");
      if (error) throw error;
      const cMap = {};
      const mMap = {};
      let maxWeekIndex = 0;
      data.forEach(({ week_number, day_index, duration_minutes }) => {
        const k = "w" + (week_number - 1) + "-d" + day_index;
        cMap[k] = true;
        mMap[k] = duration_minutes || 0;
        if (week_number - 1 > maxWeekIndex) maxWeekIndex = week_number - 1;
      });
      setCompleted(cMap);
      setMinutes(mMap);
      setActiveWeek(maxWeekIndex);
    } catch (err) {
      console.error("Error loading completions:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── REGULAR SESSION HANDLERS ───────────────────────────────────────────────
  const handleTick = (weekIndex, dayIndex, e) => {
    e.stopPropagation();
    const key = "w" + weekIndex + "-d" + dayIndex;
    if (completed[key]) {
      untick(weekIndex, dayIndex, key);
    } else {
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
      const newCompleted = { ...completed, [key]: true };
      setCompleted(newCompleted);
      setMinutes(p => ({ ...p, [key]: mins }));
      const weekKeys = Object.keys(newCompleted).filter(function(k) { return k.startsWith("w" + weekIndex + "-d"); });
      if (weekKeys.length === 1 && weekWeights[weekIndex] === undefined) {
        setWeightInput("");
        setWeightModalWeek(weekIndex);
        setShowWeightModal(true);
      }
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
      const newCompleted = { ...completed, [key]: true };
      setCompleted(newCompleted);
      setMinutes(p => ({ ...p, [key]: 0 }));
      const weekKeys = Object.keys(newCompleted).filter(function(k) { return k.startsWith("w" + weekIndex + "-d"); });
      if (weekKeys.length === 1 && weekWeights[weekIndex] === undefined) {
        setWeightInput("");
        setWeightModalWeek(weekIndex);
        setShowWeightModal(true);
      }
    } catch (err) {
      console.error("Error saving:", err);
    } finally {
      setSaving(null);
    }
  };

  const saveWeight = async () => {
    const kg = parseFloat(weightInput);
    if (isNaN(kg)) return;
    setWeightSaving(true);
    const wk = weightModalWeek ?? activeWeek;
    const { error } = await supabase
      .from("weekly_weights")
      .insert({ week_index: wk, weight_kg: kg });
    if (!error) {
      setWeekWeights(function(prev) { return { ...prev, [wk]: String(kg) }; });
    } else {
      console.error("saveWeight:", error);
    }
    setWeightSaving(false);
    setShowWeightModal(false);
  };

  // ─── SUNDAY REST HANDLER ────────────────────────────────────────────────────
  const toggleRestDone = (weekIdx, e) => {
    e.stopPropagation();
    const k = "w" + weekIdx + "-rest";
    const next = { ...restDone, [k]: !restDone[k] };
    if (!next[k]) delete next[k];
    setRestDone(next);
    localStorage.setItem("rest_done", JSON.stringify(next));
  };

  // ─── JOKER WORKOUT DURATION HANDLERS ────────────────────────────────────────
  const openJokerPrompt = (jokerId, e) => {
    e.stopPropagation();
    setJokerPromptId(jokerId);
    setJokerPromptMinutes("");
    setJokerEditIdx(null);
  };

  const openJokerEdit = (jokerId, idx, currentMins, e) => {
    e.stopPropagation();
    setJokerPromptId(jokerId);
    setJokerPromptMinutes(currentMins > 0 ? String(currentMins) : "");
    setJokerEditIdx(idx);
  };

  const confirmJokerPrompt = () => {
    if (!jokerPromptId) return;
    const k = jlKey(activeWeek, jokerPromptId);
    const mins = parseInt(jokerPromptMinutes) || 0;
    const existing = jokerLogs[k] || [];
    let arr;
    if (jokerEditIdx !== null) {
      arr = existing.map(function(e, i) { return i === jokerEditIdx ? { ...e, minutes: mins } : e; });
    } else {
      arr = [...existing, { minutes: mins, ts: new Date().toISOString() }];
    }
    const next = { ...jokerLogs, [k]: arr };
    setJokerLogs(next);
    localStorage.setItem("joker_logs", JSON.stringify(next));
    setJokerPromptId(null);
    setJokerEditIdx(null);
  };

  const skipJokerPrompt = () => {
    if (!jokerPromptId) return;
    if (jokerEditIdx !== null) {
      // Cancel edit — close without saving
      setJokerPromptId(null);
      setJokerEditIdx(null);
      return;
    }
    const k = jlKey(activeWeek, jokerPromptId);
    const entry = { minutes: 0, ts: new Date().toISOString() };
    const next = { ...jokerLogs, [k]: [...(jokerLogs[k] || []), entry] };
    setJokerLogs(next);
    localStorage.setItem("joker_logs", JSON.stringify(next));
    setJokerPromptId(null);
  };

  const deleteJokerEntry = (jokerId, idx, e) => {
    e.stopPropagation();
    const k = jlKey(activeWeek, jokerId);
    const arr = (jokerLogs[k] || []).filter(function(_, i) { return i !== idx; });
    const next = { ...jokerLogs };
    if (arr.length === 0) { delete next[k]; } else { next[k] = arr; }
    setJokerLogs(next);
    localStorage.setItem("joker_logs", JSON.stringify(next));
  };

  // ─── ZERO DAY HANDLERS ──────────────────────────────────────────────────────
  const openZeroModal = (e) => {
    if (e) e.stopPropagation();
    setZeroDraftReasons([]);
    setZeroDraftNote("");
    setShowZeroModal(true);
  };

  const confirmZeroDay = () => {
    const k = jlKey(activeWeek, "zero");
    const entry = { reasons: zeroDraftReasons, note: zeroDraftNote.trim(), ts: new Date().toISOString() };
    const next = { ...jokerLogs, [k]: [...(jokerLogs[k] || []), entry] };
    setJokerLogs(next);
    localStorage.setItem("joker_logs", JSON.stringify(next));
    setShowZeroModal(false);
  };

  const toggleZeroReason = (reason) => {
    setZeroDraftReasons(function(prev) {
      return prev.includes(reason) ? prev.filter(function(r) { return r !== reason; }) : [...prev, reason];
    });
  };

  // ─── DERIVED VALUES ─────────────────────────────────────────────────────────
  const weekActualMinutes = (weekIdx) => {
    const regularMins = DAY_ORDER.reduce(function(sum, _, di) {
      return sum + (minutes["w" + weekIdx + "-d" + di] || 0);
    }, 0);
    const jokerMins = JOKER_DAYS.reduce(function(sum, joker) {
      const entries = jokerLogs[jlKey(weekIdx, joker.id)] || [];
      return sum + entries.reduce(function(s, e) { return s + (e.minutes || 0); }, 0);
    }, 0);
    return regularMins + jokerMins;
  };

  const weekJokerCount = (weekIdx) => JOKER_DAYS.reduce(function(sum, joker) {
    return sum + (jokerLogs[jlKey(weekIdx, joker.id)] || []).length;
  }, 0);

  const accent = weekAccent[activeWeek];
  const week = WEEKS[activeWeek];
  const weekProgress = DAY_ORDER.filter(function(_, i) { return completed["w" + activeWeek + "-d" + i]; }).length + weekJokerCount(activeWeek);
  const totalJokerCompleted = WEEKS.reduce(function(sum, _, i) { return sum + weekJokerCount(i); }, 0);
  const totalCompleted = Object.keys(completed).length + totalJokerCompleted;
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

      {/* Regular session duration modal */}
      {promptKey && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#15151e", border: "1px solid #2e2e42", borderRadius: 20, padding: 28, maxWidth: 320, width: "100%" }}>
            <div style={{ fontSize: 22, textAlign: "center", marginBottom: 8 }}>💪</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "#f0ede8", textAlign: "center" }}>Great work!</h3>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: "#999", textAlign: "center", lineHeight: 1.6 }}>How many minutes did you actually train?</p>
            <input type="number" value={promptMinutes}
              onChange={function(e) { setPromptMinutes(e.target.value); }}
              onKeyDown={function(e) { if (e.key === "Enter") confirmPrompt(); }}
              placeholder="e.g. 42" autoFocus
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

      {/* Joker workout duration modal */}
      {jokerPromptId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#15151e", border: "1px solid #2e2e42", borderRadius: 20, padding: 28, maxWidth: 320, width: "100%" }}>
            {(function() {
              const joker = JOKER_DAYS.find(function(j) { return j.id === jokerPromptId; });
              return (
                <>
                  <div style={{ fontSize: 22, textAlign: "center", marginBottom: 8 }}>{joker ? joker.icon : "🃏"}</div>
                  <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "#f0ede8", textAlign: "center" }}>{jokerEditIdx !== null ? "Edit session" : "Nice work!"}</h3>
                  <p style={{ margin: "0 0 6px", fontSize: 13, color: joker ? joker.color : accent, textAlign: "center", fontWeight: 600 }}>{joker ? joker.title : ""}</p>
                  <p style={{ margin: "0 0 20px", fontSize: 12, color: "#999", textAlign: "center", lineHeight: 1.6 }}>How long did this take?</p>
                </>
              );
            })()}
            <input type="number" value={jokerPromptMinutes}
              onChange={function(e) { setJokerPromptMinutes(e.target.value); }}
              onKeyDown={function(e) { if (e.key === "Enter") confirmJokerPrompt(); }}
              placeholder="e.g. 20" autoFocus
              style={{ width: "100%", background: "#0e0e14", border: "1px solid #2a2a38", borderRadius: 10, padding: "12px 14px", fontSize: 20, color: "#f0ede8", textAlign: "center", fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box", marginBottom: 14 }}
            />
            <button onClick={confirmJokerPrompt}
              style={{ width: "100%", background: (JOKER_DAYS.find(function(j) { return j.id === jokerPromptId; }) || {}).color || accent, border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, color: "#111", cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>
              {jokerEditIdx !== null ? "Save changes" : "Log it"}
            </button>
            <button onClick={skipJokerPrompt}
              style={{ width: "100%", background: "transparent", border: "1px solid #2a2a38", borderRadius: 10, padding: "10px 0", fontSize: 12, color: "#888", cursor: "pointer", fontFamily: "inherit" }}>
              {jokerEditIdx !== null ? "Cancel" : "Skip — just mark as done"}
            </button>
          </div>
        </div>
      )}

      {/* Zero Day modal */}
      {showZeroModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={function() { setShowZeroModal(false); }}>
          <div style={{ background: "#15151e", border: "1px solid #2e2e42", borderRadius: 20, padding: 28, maxWidth: 340, width: "100%" }} onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ fontSize: 24, textAlign: "center", marginBottom: 6 }}>🌑</div>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "#f0ede8", textAlign: "center" }}>Zero Day</h3>
            <p style={{ margin: "0 0 18px", fontSize: 11, color: "#888", textAlign: "center", lineHeight: 1.6 }}>Rest is part of the plan. What's going on?</p>

            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: 10 }}>Pick all that apply</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18 }}>
              {ZERO_REASONS.map(function(reason) {
                const selected = zeroDraftReasons.includes(reason);
                return (
                  <button key={reason} onClick={function() { toggleZeroReason(reason); }}
                    style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid " + (selected ? JC.pilates : "#2a2a38"), background: selected ? "#1a1030" : "#1a1a24", color: selected ? JC.pilates : "#888", fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    {reason}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: 8 }}>Note (optional)</div>
            <textarea
              value={zeroDraftNote}
              onChange={function(e) { setZeroDraftNote(e.target.value); }}
              placeholder="Anything you want to remember about today..."
              rows={2}
              style={{ width: "100%", background: "#0e0e14", border: "1px solid #2a2a38", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#f0ede8", fontFamily: "Georgia, serif", outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 16, lineHeight: 1.5 }}
            />

            <button onClick={confirmZeroDay}
              style={{ width: "100%", background: JC.pilates, border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, color: "#111", cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>
              Log Zero Day
            </button>
            <button onClick={function() { setShowZeroModal(false); }}
              style={{ width: "100%", background: "transparent", border: "none", padding: "8px 0", fontSize: 11, color: "#555", cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Weight modal */}
      {showWeightModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#15151e", border: "1px solid #2e2e42", borderRadius: 20, padding: 28, maxWidth: 320, width: "100%" }}>
            <div style={{ fontSize: 22, textAlign: "center", marginBottom: 8 }}>⚖️</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "#f0ede8", textAlign: "center" }}>Log your weight</h3>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: "#999", textAlign: "center", lineHeight: 1.6 }}>
              Week {(weightModalWeek ?? activeWeek) + 1} — tracking your weight each week helps you see progress over the programme.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <input
                type="number" step="0.1" min="30" max="250"
                value={weightInput}
                onChange={function(e) { setWeightInput(e.target.value); }}
                onKeyDown={function(e) { if (e.key === "Enter") saveWeight(); }}
                placeholder="e.g. 68.5" autoFocus
                style={{ flex: 1, background: "#0e0e14", border: "1px solid #2a2a38", borderRadius: 10, padding: "12px 14px", fontSize: 20, color: "#f0ede8", textAlign: "center", fontFamily: "Georgia, serif", outline: "none" }}
              />
              <span style={{ fontSize: 14, color: "#888" }}>kg</span>
            </div>
            <button onClick={saveWeight} disabled={weightSaving || !weightInput || isNaN(parseFloat(weightInput))}
              style={{ width: "100%", background: weekAccent[weightModalWeek ?? activeWeek], border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, color: "#111", cursor: "pointer", fontFamily: "inherit", marginBottom: 8, opacity: (!weightInput || isNaN(parseFloat(weightInput))) ? 0.5 : 1 }}>
              {weightSaving ? "Saving…" : "Save weight"}
            </button>
            <button onClick={function() { setShowWeightModal(false); }}
              style={{ width: "100%", background: "transparent", border: "1px solid #2a2a38", borderRadius: 10, padding: "10px 0", fontSize: 12, color: "#888", cursor: "pointer", fontFamily: "inherit" }}>
              Skip for now
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
                <button key={i} onClick={function() { setActiveWeek(i); setExpandedDay(null); setExpandedJoker(null); }}
                  style={{ padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0, background: activeWeek === i ? weekAccent[i] : "#1a1a24", color: activeWeek === i ? "#111" : "#555", transition: "all 0.2s" }}>
                  {w.deload ? "Wk 4 Deload" : "Wk " + (i + 1) + " — " + w.tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ProgressRings completed={completed} jokerCountsByWeek={WEEKS.map(function(_, i) { return weekJokerCount(i); })} />

      {/* Week header + active minutes */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, color: accent }}>{week.tag}</h2>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#888", lineHeight: 1.5 }}>{week.note}</p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: accent }}>{weekProgress}</span>
            <span style={{ fontSize: 12, color: "#777" }}>/{DAY_ORDER.filter(d => SESSIONS[d].type !== 'rest').length}</span>
            <div style={{ fontSize: 9, color: "#777", textTransform: "uppercase", letterSpacing: 1 }}>this week</div>
          </div>
        </div>

        {/* Actual minutes logged this week (includes joker workout minutes) */}
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

        {/* Weight strip */}
        {(function() {
          const current = weekWeights[activeWeek];
          const prev = weekWeights[activeWeek - 1];
          const delta = current && prev ? (parseFloat(current) - parseFloat(prev)).toFixed(1) : null;
          return (
            <div style={{ marginTop: 10, background: "#15151e", border: "1px solid #1e1e2c", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>⚖️</span>
                <div>
                  <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Week {activeWeek + 1} weight</div>
                  {current ? (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#f0ede8" }}>{parseFloat(current).toFixed(1)}</span>
                      <span style={{ fontSize: 11, color: "#888" }}>kg</span>
                      {delta !== null && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: parseFloat(delta) <= 0 ? "#34D399" : "#FF9A3C" }}>
                          {parseFloat(delta) <= 0 ? "▼" : "▲"} {Math.abs(parseFloat(delta)).toFixed(1)} kg vs last week
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "#555" }}>Not logged yet</div>
                  )}
                </div>
              </div>
              <button onClick={function() { setWeightInput(current || ""); setWeightModalWeek(activeWeek); setShowWeightModal(true); }}
                style={{ fontSize: 11, color: accent, background: "transparent", border: "1px solid " + accent + "40", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}>
                {current ? "Edit" : "Log"}
              </button>
            </div>
          );
        })()}
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
          const isSunday = dayKey === "sun";
          const ts = tagStyle[session.type] || tagStyle.rest;
          const imgKey = SESSION_IMAGE[dayKey];
          const sessionImg = imgKey ? MUSCLE_IMAGES[imgKey] : null;
          const loggedMins = minutes[key] || 0;
          const restTaken = isSunday && !!restDone["w" + activeWeek + "-rest"];

          return (
            <div key={dayKey} onClick={function() { toggleDay(i); }}
              style={{ marginBottom: 8, borderRadius: 14, overflow: "hidden", cursor: "pointer", background: isDone ? "#0c180c" : "#15151e", border: "1px solid " + (isDone ? "#1e3d1e" : isExp ? "#2e2e42" : "#1e1e2c"), boxShadow: isExp ? "0 8px 32px rgba(0,0,0,0.5)" : "none", transition: "all 0.2s" }}>

              <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                {/* Circle: training tick for non-rest, rest toggle for Sunday */}
                {isSunday ? (
                  <div onClick={function(e) { toggleRestDone(activeWeek, e); }}
                    style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, cursor: "pointer", border: "2px solid " + (restTaken ? "#60A5FA" : "#2a2a38"), background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                    {restTaken && <span style={{ color: "#60A5FA", fontSize: 12, fontWeight: 900 }}>✓</span>}
                  </div>
                ) : (
                  <div onClick={function(e) { if (!isRest) handleTick(activeWeek, i, e); }}
                    style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, cursor: isRest ? "default" : "pointer", border: "2px solid " + (isDone ? "#4ade80" : "#2a2a38"), background: isDone ? "#4ade80" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s", opacity: isSaving ? 0.5 : 1 }}>
                    {isSaving
                      ? <div style={{ width: 10, height: 10, border: "2px solid #888", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                      : isDone ? <span style={{ color: "#0a1a0a", fontSize: 12, fontWeight: 900 }}>✓</span> : null}
                  </div>
                )}

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
                  {isSunday ? (
                    <div style={{ fontSize: 12, color: restTaken ? "#60A5FA88" : "#555", marginTop: 3 }}>
                      {restTaken ? "Rest taken ✓" : "Mark rest taken"}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: isDone ? "#4ade8088" : "#666", marginTop: 3 }}>{session.title}</div>
                  )}
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

        {/* ─── JOKER DAYS ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 12px" }}>
          <div style={{ flex: 1, height: 1, background: "#1e1e2c" }} />
          <div style={{ fontSize: 9, letterSpacing: 2.5, textTransform: "uppercase", color: "#555", whiteSpace: "nowrap" }}>🃏 Joker Days</div>
          <div style={{ flex: 1, height: 1, background: "#1e1e2c" }} />
        </div>
        <div style={{ fontSize: 10, color: "#555", marginBottom: 12, lineHeight: 1.5 }}>
          Can't do your scheduled session? Pick one of these instead.
        </div>

        {/* Joker workout cards */}
        {JOKER_DAYS.map(function(joker) {
          const k = jlKey(activeWeek, joker.id);
          const entries = jokerLogs[k] || [];
          const count = entries.length;
          const totalMins = entries.reduce(function(s, e) { return s + (e.minutes || 0); }, 0);
          const isExp = expandedJoker === joker.id;

          return (
            <div key={joker.id} onClick={function() { setExpandedJoker(isExp ? null : joker.id); }}
              style={{ marginBottom: 8, borderRadius: 14, overflow: "hidden", cursor: "pointer", background: count > 0 ? "#0c1a14" : "#15151e", border: "1px solid " + (count > 0 ? joker.color + "40" : isExp ? "#2e2e42" : "#1e1e2c"), boxShadow: isExp ? "0 8px 32px rgba(0,0,0,0.5)" : "none", transition: "all 0.2s" }}>

              <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                {/* Count badge circle — tap always opens duration modal */}
                <div onClick={function(e) { openJokerPrompt(joker.id, e); }}
                  style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, cursor: "pointer", border: "2px solid " + (count > 0 ? joker.color : "#2a2a38"), background: count > 0 ? joker.color + "20" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                  {count > 0
                    ? <span style={{ color: joker.color, fontSize: 9, fontWeight: 900, letterSpacing: -0.5 }}>{count}×</span>
                    : null}
                </div>

                <div style={{ fontSize: 24, flexShrink: 0, width: 44, textAlign: "center" }}>{joker.icon}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: count > 0 ? joker.color : "#f0ede8" }}>{joker.title}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", padding: "2px 8px", borderRadius: 6, background: joker.color + "18", color: joker.color }}>joker</span>
                    <span style={{ fontSize: 10, color: "#888" }}>{joker.duration}</span>
                  </div>
                  <div style={{ fontSize: 12, color: count > 0 ? joker.color + "99" : "#666", marginTop: 3 }}>{joker.tagline}</div>
                  {count > 0 && (
                    <div style={{ fontSize: 10, color: joker.color + "88", marginTop: 3 }}>
                      Logged: {totalMins} min ({count} session{count > 1 ? "s" : ""})
                    </div>
                  )}
                </div>

                <div style={{ color: "#333", transform: isExp ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", fontSize: 14 }}>▼</div>
              </div>

              {isExp && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid #1e1e2c" }}>
                  {joker.sections.map(function(section, si) {
                    return (
                      <div key={si} style={{ marginBottom: 14, marginTop: si === 0 ? 12 : 0 }}>
                        <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#666", fontWeight: 600, marginBottom: 7 }}>
                          {section.name}
                        </div>
                        {section.note && (
                          <div style={{ fontSize: 10, color: "#888", fontStyle: "italic", marginBottom: 6, paddingLeft: 4 }}>{section.note}</div>
                        )}
                        {section.exercises.map(function(ex, ei) {
                          return (
                            <div key={ei} style={{ marginBottom: 6, padding: "8px 10px", background: "#0e0e14", borderRadius: 8, borderLeft: "3px solid " + joker.color + "40" }}>
                              <div
                                onClick={function(e) {
                                  e.stopPropagation();
                                  window.open("youtube://www.youtube.com/results?search_query=" + encodeURIComponent(ex.name + " exercise tutorial form"), "_blank");
                                }}
                                style={{ fontSize: 12, color: joker.color, fontWeight: 600, cursor: "pointer", textDecoration: "underline dotted", textUnderlineOffset: 3 }}>
                                {ex.name} ↗
                              </div>
                              {ex.detail && <div style={{ fontSize: 11, color: "#888", marginTop: 3, lineHeight: 1.5 }}>{ex.detail}</div>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  {/* Logged session history with edit / delete */}
                  {count > 0 && (
                    <div style={{ marginTop: 14, marginBottom: 4 }}>
                      <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 6 }}>Logged sessions</div>
                      {entries.map(function(entry, idx) {
                        return (
                          <div key={idx} onClick={function(e) { e.stopPropagation(); }}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#0e0e14", borderRadius: 8, marginBottom: 4, borderLeft: "3px solid " + joker.color + "30" }}>
                            <span style={{ flex: 1, fontSize: 11, color: "#aaa" }}>
                              Session {idx + 1}{entry.minutes > 0 ? " — " + entry.minutes + " min" : ""}
                            </span>
                            <button onClick={function(e) { openJokerEdit(joker.id, idx, entry.minutes, e); }}
                              title="Edit"
                              style={{ background: "none", border: "none", cursor: "pointer", color: joker.color + "99", fontSize: 13, padding: "2px 5px", lineHeight: 1 }}>✎</button>
                            <button onClick={function(e) { deleteJokerEntry(joker.id, idx, e); }}
                              title="Delete"
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#ff5555", fontSize: 13, padding: "2px 5px", lineHeight: 1 }}>✕</button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Mark Complete button — opens duration modal */}
                  <button
                    onClick={function(e) { openJokerPrompt(joker.id, e); }}
                    style={{ marginTop: 8, width: "100%", background: joker.color + "18", border: "1px solid " + joker.color + "50", borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, color: joker.color, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                    Mark Complete
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Zero Day card */}
        {(function() {
          const k = jlKey(activeWeek, "zero");
          const entries = jokerLogs[k] || [];
          const count = entries.length;

          return (
            <div style={{ marginBottom: 8, borderRadius: 14, overflow: "hidden", background: count > 0 ? "#0f0c1a" : "#15151e", border: "1px solid " + (count > 0 ? "#3a2a5050" : "#1e1e2c"), transition: "all 0.2s" }}>
              {/* Header row */}
              <div onClick={function(e) { openZeroModal(e); }} style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                {/* Count badge circle */}
                <div onClick={function(e) { openZeroModal(e); }}
                  style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, cursor: "pointer", border: "2px solid " + (count > 0 ? JC.pilates : "#2a2a38"), background: count > 0 ? JC.pilates + "20" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                  {count > 0
                    ? <span style={{ color: JC.pilates, fontSize: 9, fontWeight: 900, letterSpacing: -0.5 }}>{count}×</span>
                    : null}
                </div>

                <div style={{ fontSize: 24, flexShrink: 0, width: 44, textAlign: "center" }}>🌑</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: count > 0 ? JC.pilates : "#f0ede8" }}>Zero Day</span>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", padding: "2px 8px", borderRadius: 6, background: "#1a1030", color: JC.pilates }}>rest</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 3 }}>
                    {count > 0 ? "Tap ✎ to log another entry" : "Honest rest — log your reason, no guilt"}
                  </div>
                </div>

                <div style={{ fontSize: 14, color: "#444" }}>✎</div>
              </div>

              {/* Log history — shown inline when entries exist */}
              {entries.length > 0 && (
                <div style={{ padding: "0 16px 14px", borderTop: "1px solid #1e1e2c" }}>
                  {entries.map(function(entry, ei) {
                    return (
                      <div key={ei} style={{ marginTop: 10, paddingTop: ei > 0 ? 10 : 0, borderTop: ei > 0 ? "1px solid #1e1e2c" : "none" }}>
                        {entry.reasons && entry.reasons.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: ei === 0 ? 10 : 0 }}>
                            {entry.reasons.map(function(r) {
                              return <span key={r} style={{ fontSize: 9, background: "#1a1030", border: "1px solid " + JC.pilates + "30", borderRadius: 10, padding: "2px 7px", color: JC.pilates + "99" }}>{r}</span>;
                            })}
                          </div>
                        )}
                        {(!entry.reasons || entry.reasons.length === 0) && (
                          <div style={{ fontSize: 10, color: "#444", marginTop: ei === 0 ? 10 : 0, fontStyle: "italic" }}>No reason specified</div>
                        )}
                        {entry.note ? (
                          <div style={{ fontSize: 10, color: JC.pilates + "66", marginTop: 4, fontStyle: "italic" }}>{entry.note}</div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <style>{"@keyframes spin { to { transform: rotate(360deg); } } * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; } body { margin: 0; padding: 0; }"}</style>
    </div>
  );
}

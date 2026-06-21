import { WEEKS, DAY_ORDER, SESSIONS, weekAccent } from '../lib/workoutData';

function Ring({ weekNum, accent, done, total }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const offset = total === 0 ? circ : Math.max(0, circ * (1 - done / total));
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="#1a1a24" strokeWidth="6" />
        {done > 0 && (
          <circle cx="30" cy="30" r={r} fill="none" stroke={accent} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 30 30)"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        )}
        <text x="30" y="35" textAnchor="middle" fontSize="12" fontWeight="500"
          fill={done > 0 ? accent : "#444"}>
          {done}/{total}
        </text>
      </svg>
      <div style={{ fontSize: 10, color: "#888", marginTop: 4, letterSpacing: 0.5 }}>
        Wk {weekNum}
      </div>
    </div>
  );
}

export default function ProgressRings({ completed, jokerCountsByWeek = [] }) {
  const trainingTotal = DAY_ORDER.filter(d => SESSIONS[d]?.type !== 'rest').length;
  const totalJoker = jokerCountsByWeek.reduce((s, n) => s + n, 0);
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "14px 20px 0" }}>
      <div style={{ background: "#15151e", border: "1px solid #1e1e2c", borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#888", marginBottom: 12 }}>
          4-week progress
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
          {WEEKS.map((w, i) => {
            const done = DAY_ORDER.filter((d, di) => SESSIONS[d]?.type !== 'rest' && completed[`w${i}-d${di}`]).length + (jokerCountsByWeek[i] || 0);
            return <Ring key={i} weekNum={i + 1} accent={weekAccent[i]} done={done} total={trainingTotal} />;
          })}
        </div>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #1e1e2c", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "#888" }}>Total sessions</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e8c547" }}>
            {Object.keys(completed).length + totalJoker}
            <span style={{ color: "#777", fontWeight: 400 }}> / {WEEKS.length * trainingTotal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

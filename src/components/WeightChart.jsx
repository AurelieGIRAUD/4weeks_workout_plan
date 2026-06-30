import { useState } from 'react';
import { weekAccent } from '../lib/workoutData';

const WEEKS_COUNT = 4;

export default function WeightChart({ weekWeights }) {
  const [open, setOpen] = useState(false);

  const weights = Array.from({ length: WEEKS_COUNT }, (_, i) => {
    const v = weekWeights[i] ?? weekWeights[String(i)];
    if (v === undefined || v === null || v === "") return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  });

  const defined = weights.filter(w => w !== null);

  const vw = 280, vh = 130;
  const padL = 36, padR = 16, padT = 18, padB = 26;
  const chartW = vw - padL - padR;
  const chartH = vh - padT - padB;

  const xPos = weights.map((_, i) => padL + (i / (WEEKS_COUNT - 1)) * chartW);

  let yMin, yMax;
  if (defined.length === 0) {
    yMin = 55; yMax = 75;
  } else if (defined.length === 1) {
    yMin = defined[0] - 3;
    yMax = defined[0] + 3;
  } else {
    yMin = Math.min(...defined) - 1;
    yMax = Math.max(...defined) + 1;
  }

  const toY = (w) => padT + (1 - (w - yMin) / (yMax - yMin)) * chartH;

  const yTicks = [yMax, (yMin + yMax) / 2, yMin];

  const pathSegments = [];
  let currentSeg = [];
  for (let i = 0; i < WEEKS_COUNT; i++) {
    if (weights[i] !== null) {
      currentSeg.push([xPos[i], toY(weights[i])]);
    } else {
      if (currentSeg.length >= 2) pathSegments.push([...currentSeg]);
      currentSeg = [];
    }
  }
  if (currentSeg.length >= 2) pathSegments.push(currentSeg);

  const fmt = (v) => Number.isInteger(v) ? v : parseFloat(v.toFixed(1));

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "10px 20px 0" }}>
      <div style={{ background: "#15151e", border: "1px solid #1e1e2c", borderRadius: 14, overflow: "hidden" }}>

        <button
          onClick={() => setOpen(o => !o)}
          style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: "14px 16px", fontFamily: "inherit" }}>
          <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>
            Weight trend (kg)
          </span>
          <span style={{ color: "#555", fontSize: 12, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▾
          </span>
        </button>

        {open && (
          <div style={{ padding: "0 16px 14px" }}>
            <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" style={{ display: "block", overflow: "visible" }}>
              {yTicks.map((tick, i) => (
                <g key={i}>
                  <line x1={padL} y1={toY(tick)} x2={padL + chartW} y2={toY(tick)}
                    stroke="#1e1e2c" strokeWidth="1" />
                  <text x={padL - 5} y={toY(tick) + 3.5} textAnchor="end" fontSize="8" fill="#555">
                    {fmt(tick)}
                  </text>
                </g>
              ))}

              {pathSegments.map((seg, si) => (
                <polyline key={si}
                  points={seg.map(([x, y]) => `${x},${y}`).join(' ')}
                  fill="none" stroke="#3a3a50" strokeWidth="1.5" strokeLinejoin="round" />
              ))}

              {weights.map((w, i) => (
                <g key={i}>
                  {w !== null ? (
                    <>
                      <circle cx={xPos[i]} cy={toY(w)} r="4" fill={weekAccent[i]} />
                      <text x={xPos[i]} y={toY(w) - 8} textAnchor="middle" fontSize="8"
                        fill={weekAccent[i]} fontWeight="600">
                        {fmt(w)}
                      </text>
                    </>
                  ) : (
                    <circle cx={xPos[i]} cy={padT + chartH / 2} r="3"
                      fill="none" stroke="#252535" strokeWidth="1.5" />
                  )}
                  <text x={xPos[i]} y={vh - 2} textAnchor="middle" fontSize="8" fill="#555">
                    Wk {i + 1}
                  </text>
                </g>
              ))}
            </svg>

            {defined.length === 0 && (
              <div style={{ textAlign: "center", fontSize: 11, color: "#3a3a50", paddingBottom: 2 }}>
                Log a weight after each week to see your trend
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const BODY_COLOR = "#2a2a3a";
const MUSCLE_ACTIVE = "#e8c547";

export function MuscleFront({ highlighted = [] }) {
  const a = (m) => highlighted.includes(m) ? MUSCLE_ACTIVE : BODY_COLOR;
  const s = (m) => highlighted.includes(m) ? MUSCLE_ACTIVE : "#333344";
  return (
    <svg viewBox="0 0 80 160" width="75" height="150">
      <ellipse cx="40" cy="18" rx="12" ry="14" fill={BODY_COLOR} />
      <rect x="36" y="30" width="8" height="8" fill={BODY_COLOR} />
      <path d="M 22 38 Q 18 60 20 90 Q 25 95 40 95 Q 55 95 60 90 Q 62 60 58 38 Z" fill={BODY_COLOR} />
      <ellipse cx="18" cy="45" rx="8" ry="10" fill={a("shoulders")} />
      <ellipse cx="62" cy="45" rx="8" ry="10" fill={a("shoulders")} />
      <ellipse cx="32" cy="55" rx="9" ry="8" fill={s("chest")} />
      <ellipse cx="48" cy="55" rx="9" ry="8" fill={s("chest")} />
      <ellipse cx="10" cy="52" rx="5" ry="8" fill={a("triceps")} />
      <ellipse cx="70" cy="52" rx="5" ry="8" fill={a("triceps")} />
      <ellipse cx="13" cy="64" rx="6" ry="10" fill={a("biceps")} />
      <ellipse cx="67" cy="64" rx="6" ry="10" fill={a("biceps")} />
      <ellipse cx="11" cy="80" rx="5" ry="9" fill={a("forearms")} />
      <ellipse cx="69" cy="80" rx="5" ry="9" fill={a("forearms")} />
      <ellipse cx="36" cy="68" rx="6" ry="5" fill={s("abs")} />
      <ellipse cx="44" cy="68" rx="6" ry="5" fill={s("abs")} />
      <ellipse cx="36" cy="78" rx="6" ry="5" fill={s("abs")} />
      <ellipse cx="44" cy="78" rx="6" ry="5" fill={s("abs")} />
      <ellipse cx="36" cy="87" rx="6" ry="4" fill={s("abs")} />
      <ellipse cx="44" cy="87" rx="6" ry="4" fill={s("abs")} />
      <ellipse cx="24" cy="78" rx="5" ry="10" fill={s("obliques")} />
      <ellipse cx="56" cy="78" rx="5" ry="10" fill={s("obliques")} />
      <ellipse cx="32" cy="97" rx="7" ry="5" fill={a("hipflexors")} />
      <ellipse cx="48" cy="97" rx="7" ry="5" fill={a("hipflexors")} />
      <path d="M 24 100 Q 20 120 22 140 Q 28 143 34 140 Q 36 120 33 100 Z" fill={a("quads")} />
      <path d="M 46 100 Q 44 120 46 140 Q 52 143 58 140 Q 60 120 56 100 Z" fill={a("quads")} />
      <ellipse cx="28" cy="143" rx="7" ry="5" fill={BODY_COLOR} />
      <ellipse cx="52" cy="143" rx="7" ry="5" fill={BODY_COLOR} />
      <ellipse cx="27" cy="155" rx="5" ry="8" fill={a("calves")} />
      <ellipse cx="53" cy="155" rx="5" ry="8" fill={a("calves")} />
    </svg>
  );
}

export function MuscleBack({ highlighted = [] }) {
  const a = (m) => highlighted.includes(m) ? MUSCLE_ACTIVE : BODY_COLOR;
  const s = (m) => highlighted.includes(m) ? MUSCLE_ACTIVE : "#333344";
  return (
    <svg viewBox="0 0 80 160" width="75" height="150">
      <ellipse cx="40" cy="18" rx="12" ry="14" fill={BODY_COLOR} />
      <rect x="36" y="30" width="8" height="8" fill={BODY_COLOR} />
      <path d="M 22 38 Q 18 60 20 90 Q 25 95 40 95 Q 55 95 60 90 Q 62 60 58 38 Z" fill={BODY_COLOR} />
      <ellipse cx="18" cy="45" rx="8" ry="10" fill={a("shoulders")} />
      <ellipse cx="62" cy="45" rx="8" ry="10" fill={a("shoulders")} />
      <ellipse cx="40" cy="42" rx="12" ry="7" fill={s("traps")} />
      <path d="M 20 50 Q 16 70 22 85 Q 30 88 36 82 Q 35 65 30 50 Z" fill={s("lats")} />
      <path d="M 60 50 Q 64 70 58 85 Q 50 88 44 82 Q 45 65 50 50 Z" fill={s("lats")} />
      <ellipse cx="40" cy="88" rx="10" ry="7" fill={s("lowerback")} />
      <ellipse cx="11" cy="58" rx="6" ry="10" fill={a("triceps")} />
      <ellipse cx="69" cy="58" rx="6" ry="10" fill={a("triceps")} />
      <ellipse cx="32" cy="98" rx="12" ry="9" fill={s("glutes")} />
      <ellipse cx="48" cy="98" rx="12" ry="9" fill={s("glutes")} />
      <path d="M 24 106 Q 20 125 22 140 Q 28 144 34 140 Q 36 125 33 106 Z" fill={a("hamstrings")} />
      <path d="M 46 106 Q 44 125 46 140 Q 52 144 58 140 Q 60 125 56 106 Z" fill={a("hamstrings")} />
      <ellipse cx="28" cy="143" rx="7" ry="5" fill={BODY_COLOR} />
      <ellipse cx="52" cy="143" rx="7" ry="5" fill={BODY_COLOR} />
      <ellipse cx="27" cy="155" rx="5" ry="8" fill={a("calves")} />
      <ellipse cx="53" cy="155" rx="5" ry="8" fill={a("calves")} />
      <ellipse cx="18" cy="43" rx="6" ry="7" fill={a("reardelts")} />
      <ellipse cx="62" cy="43" rx="6" ry="7" fill={a("reardelts")} />
    </svg>
  );
}

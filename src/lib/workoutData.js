export const weekMeta = [
  { week: 1, theme: "Foundation", subtitle: "4 rounds strength — easy running — learn every movement" },
  { week: 2, theme: "Build", subtitle: "More volume — shorter rest — push run pace" },
  { week: 3, theme: "Push", subtitle: "5 rounds — heaviest weights — fastest 5k — peak week" },
  { week: 4, theme: "Deload", subtitle: "50% volume — easy runs — body consolidates gains" },
];

export const weekAccent = ["#e8c547", "#f4a261", "#e07070", "#7eb8e8"];

export const tagStyle = {
  Strength: { bg: "#1a1a2e", text: "#e8c547" },
  Run:      { bg: "#0d2010", text: "#6fcf8a" },
  Yoga:     { bg: "#2d1040", text: "#d4a0f0" },
  Rest:     { bg: "#1e1e1e", text: "#666666" },
  Deload:   { bg: "#0d1828", text: "#7eb8e8" },
};

export const runDetails = {
  1: { effort: "Easy conversational pace — full sentences throughout", goal: "Complete the distance. Note your time — this is your baseline.", tip: "Your Week 1 time is the benchmark. Do not chase pace yet." },
  2: { effort: "Comfortable but pushing — slightly harder than Week 1", goal: "Finish 1-2 min faster than your Week 1 equivalent run", tip: "If Week 1 felt easy, increase pace. If it felt hard, keep same and focus on consistency." },
  3: { effort: "Push — this is your peak effort run of the programme", goal: "Go for your best 5k time of the 4 weeks", tip: "Week 3 is peak week. Leave it all out there." },
  4: { effort: "Easy deload pace — back to Week 1 effort level", goal: "Complete comfortably, no time pressure", tip: "Deload applies to running too. Easy effort only." },
};

export const EXERCISES = {
  "Kettlebell Romanian Deadlift": { ytQuery: "kettlebell romanian deadlift form tutorial women", frontMuscles: ["hipflexors"], backMuscles: ["glutes","hamstrings","lowerback"], primary: ["Glutes","Hamstrings"], secondary: ["Lower back","Core"], cue: "Push the floor away as you stand. Hinge at the hips not the waist. KB stays close to your legs the entire movement." },
  "Resistance Band Hip Thrust (elevated)": { ytQuery: "hip thrust resistance band elevated tutorial glutes", frontMuscles: [], backMuscles: ["glutes","hamstrings"], primary: ["Glutes"], secondary: ["Hamstrings","Core"], cue: "Shoulders on couch, band across hips. Drive through heels, 2-second squeeze at the top." },
  "Kettlebell Goblet Squat": { ytQuery: "kettlebell goblet squat form tutorial", frontMuscles: ["quads","abs"], backMuscles: ["glutes"], primary: ["Quads","Glutes"], secondary: ["Core"], cue: "Chest tall, sit back and down. Heels planted. Elbows track inside knees. Drive through heels on the way up." },
  "Resistance Band Clamshell": { ytQuery: "resistance band clamshell glute med tutorial", frontMuscles: [], backMuscles: ["glutes"], primary: ["Gluteus medius (outer glute)"], secondary: [], cue: "Feet together, rotate top knee up. Hip should not roll back. Targets the side of the glute that creates the rounded shape." },
  "Kettlebell Single-leg Deadlift": { ytQuery: "single leg deadlift kettlebell form tutorial", frontMuscles: ["hipflexors"], backMuscles: ["glutes","hamstrings"], primary: ["Glutes","Hamstrings"], secondary: ["Core (balance)","Lower back"], cue: "Keep hips level. The biggest mistake is letting the lifted hip rotate up. Go light until balance is solid." },
  "Resistance Band Squat Pulse": { ytQuery: "resistance band squat pulse tutorial", frontMuscles: ["quads","hipflexors"], backMuscles: ["glutes"], primary: ["Quads","Glutes"], secondary: [], cue: "Stay in the bottom quarter and pulse. The burn is the point. Do not stand up fully between pulses." },
  "Resistance Band Donkey Kick": { ytQuery: "resistance band donkey kick glute tutorial form", frontMuscles: [], backMuscles: ["glutes"], primary: ["Glutes (gluteus maximus)"], secondary: ["Hamstrings","Core"], cue: "Initiate from the glute not the lower back. Hips stay level and square to the floor." },
  "Resistance Band Kickback (standing)": { ytQuery: "resistance band standing kickback glutes tutorial", frontMuscles: [], backMuscles: ["glutes","hamstrings"], primary: ["Glutes"], secondary: ["Hamstrings"], cue: "Anchor band at ankle, stand tall. Kick straight back, do not rotate the hip. Squeeze at the top." },
  "Kettlebell Swing": { ytQuery: "kettlebell swing proper form tutorial hip hinge", frontMuscles: ["abs"], backMuscles: ["glutes","hamstrings","lowerback"], primary: ["Glutes","Hamstrings"], secondary: ["Core","Shoulders"], cue: "Hip hinge not a squat. Power comes from snapping hips forward. Arms just guide the bell." },
  "Resistance Band Glute Bridge": { ytQuery: "resistance band glute bridge tutorial form", frontMuscles: [], backMuscles: ["glutes","hamstrings"], primary: ["Glutes"], secondary: ["Hamstrings","Core"], cue: "Band just above knees. Drive through heels. Squeeze hard at the top for 2 full seconds before lowering slowly." },
  "Resistance Band Lateral Walk": { ytQuery: "resistance band lateral walk glute tutorial", frontMuscles: ["quads"], backMuscles: ["glutes"], primary: ["Gluteus medius"], secondary: ["Quads"], cue: "Keep tension on the band. Do not let feet come together. Stay low in a slight squat. Toes forward." },
  "Plank Hold": { ytQuery: "proper plank form tutorial core engagement", frontMuscles: ["abs","obliques"], backMuscles: ["lowerback","glutes"], primary: ["Core (transverse abdominis)"], secondary: ["Glutes","Shoulders"], cue: "Squeeze glutes AND abs simultaneously. Pull elbows toward your feet. Breathe. Never hold your breath." },
  "Dead Bug": { ytQuery: "dead bug exercise form tutorial core", frontMuscles: ["abs","hipflexors"], backMuscles: ["lowerback"], primary: ["Deep core","Transverse abdominis"], secondary: ["Hip flexors"], cue: "Lower back stays pressed to the floor. If it lifts the range is too big. Breathe out as you extend." },
  "Resistance Band Pallof Press": { ytQuery: "pallof press resistance band core anti rotation tutorial", frontMuscles: ["abs","obliques"], backMuscles: ["lowerback"], primary: ["Obliques","Core (anti-rotation)"], secondary: ["Transverse abdominis"], cue: "RESIST rotation. Torso stays completely square while you press out and return." },
  "Reverse Crunch": { ytQuery: "reverse crunch lower abs tutorial form", frontMuscles: ["abs","hipflexors"], backMuscles: [], primary: ["Lower abs"], secondary: ["Hip flexors"], cue: "Lift hips using abs not momentum. Slow and controlled on the way down. Lower back stays pressed to floor." },
  "Side Plank with Hip Dip": { ytQuery: "side plank hip dip tutorial obliques", frontMuscles: ["obliques"], backMuscles: ["lowerback"], primary: ["Obliques"], secondary: ["Core","Shoulder stability"], cue: "Lower hip toward floor, drive it back up. Do not rush. This is the move that defines the waist over time." },
  "Resistance Band Bicep Curl": { ytQuery: "resistance band bicep curl proper form tutorial", frontMuscles: ["biceps"], backMuscles: [], primary: ["Biceps"], secondary: ["Forearms"], cue: "3 seconds on the way down. The eccentric builds the muscle. Elbows pinned at your sides throughout." },
  "Kettlebell Hammer Curl": { ytQuery: "hammer curl kettlebell form tutorial", frontMuscles: ["biceps","forearms"], backMuscles: [], primary: ["Biceps (brachialis)"], secondary: ["Forearms"], cue: "Neutral grip thumbs up throughout. Hits the brachialis which adds width and thickness under the bicep peak." },
  "Kettlebell Concentration Curl": { ytQuery: "concentration curl kettlebell dumbbell tutorial", frontMuscles: ["biceps"], backMuscles: [], primary: ["Biceps (peak)"], secondary: [], cue: "Elbow braced on inner thigh. Full range all the way down, full squeeze at the top." },
  "Resistance Band Tricep Kickback": { ytQuery: "resistance band tricep kickback form tutorial", frontMuscles: ["triceps"], backMuscles: ["triceps"], primary: ["Triceps"], secondary: [], cue: "Elbow pinned to side. It must not move. Only the elbow joint bends. Squeeze hard at full extension." },
  "Resistance Band Overhead Tricep Extension": { ytQuery: "resistance band overhead tricep extension tutorial", frontMuscles: ["triceps"], backMuscles: ["triceps"], primary: ["Triceps (long head)"], secondary: [], cue: "Anchor band low. Keep elbows close to head. Flaring them shifts tension away from the tricep." },
  "Resistance Band Tricep Pushdown": { ytQuery: "resistance band tricep pushdown tutorial", frontMuscles: ["triceps"], backMuscles: ["triceps"], primary: ["Triceps"], secondary: [], cue: "Anchor band above. Elbows pinned, only forearms move. Full extension at the bottom, controlled return." },
  "Resistance Band Skull Crusher": { ytQuery: "resistance band skull crusher tricep tutorial", frontMuscles: ["triceps"], backMuscles: ["triceps"], primary: ["Triceps (long head)"], secondary: [], cue: "Anchor above, bend only at the elbow. Targets the long head which gives the arm its shape." },
  "Resistance Band Lateral Raise": { ytQuery: "resistance band lateral raise shoulder form tutorial", frontMuscles: ["shoulders"], backMuscles: ["shoulders"], primary: ["Lateral deltoid"], secondary: ["Traps"], cue: "Lead with your elbow not your wrist. Stop at shoulder height. Going higher shifts work to your traps." },
  "Resistance Band Rear Delt Fly": { ytQuery: "resistance band rear delt fly tutorial", frontMuscles: [], backMuscles: ["reardelts","shoulders"], primary: ["Rear deltoid"], secondary: ["Traps","Rhomboids"], cue: "Anchor at chest height, pull apart with straight arms. Improves posture and adds rounded shoulder look." },
  "Kettlebell Arnold Press": { ytQuery: "arnold press dumbbell kettlebell tutorial", frontMuscles: ["shoulders"], backMuscles: ["shoulders"], primary: ["All 3 deltoid heads"], secondary: ["Triceps"], cue: "Start palms facing you, rotate to palms out as you press up. The rotation hits all three parts of the shoulder." },
};

const YOGA_NOTE = "Hot yoga — no strength session. Hydrate well (creatine + hot yoga = high sweat loss, add electrolytes). Active recovery and mobility.";
const REST_NOTE = "Full rest. Muscles rebuild today — this is where the actual progress happens. A short walk is fine if you feel restless.";

const TUESDAY = (w) => ({
  day: "Tuesday", label: "Arms + Shoulders + Core", tag: w === 4 ? "Deload" : "Strength",
  duration: w === 4 ? "25 min" : "45 min",
  focus: w === 4 ? "Deload — same movements, half the volume." : w === 3 ? "Peak arm session — heaviest bands, most volume." : "Arms + shoulders — controlled reps, slow negatives",
  warmup: ["Arm circles forward + backward — 15 each", "Band pull-apart — 15 reps", "Shoulder rolls — 10 each direction", "Light band curl — 12 reps warm-up", "Chest opener stretch — 30 sec"],
  supersets: w === 4 ? [
    { label: "Superset A — 2 rounds", rest: "60 sec", exercises: [{ name: "Resistance Band Bicep Curl", sets: "2x10", note: "Lighter band — full range, no strain" }, { name: "Resistance Band Tricep Kickback", sets: "2x10", note: "Light and controlled" }] },
    { label: "Superset B — 2 rounds", rest: "60 sec", exercises: [{ name: "Kettlebell Hammer Curl", sets: "2x8 each", note: "Lighter than Week 3 — recovery is the goal" }, { name: "Resistance Band Lateral Raise", sets: "2x10", note: "Perfect form — keep the shoulder healthy" }] },
  ] : w === 1 ? [
    { label: "Superset A — 4 rounds", rest: "45 sec", exercises: [{ name: "Resistance Band Bicep Curl", sets: "4x12", note: "3 sec on the way down — the eccentric builds the muscle" }, { name: "Resistance Band Tricep Pushdown", sets: "4x12", note: "Anchor above, elbows pinned, full extension" }] },
    { label: "Superset B — 3 rounds", rest: "45 sec", exercises: [{ name: "Kettlebell Hammer Curl", sets: "3x12", note: "Neutral grip — adds brachialis thickness" }, { name: "Resistance Band Overhead Tricep Extension", sets: "3x12", note: "Elbows close to head, full extension" }] },
    { label: "Superset C — 3 rounds", rest: "45 sec", exercises: [{ name: "Resistance Band Lateral Raise", sets: "3x15", note: "Lead with elbow, stop at shoulder height" }, { name: "Resistance Band Rear Delt Fly", sets: "3x12", note: "Anchor at chest height — posture + shoulder width" }] },
    { label: "Core Finisher — 3 rounds", rest: "30 sec", exercises: [{ name: "Dead Bug", sets: "3x10 each side", note: "Back pressed to floor throughout" }, { name: "Resistance Band Pallof Press", sets: "3x12 each", note: "Resist rotation — best waist exercise" }] },
  ] : w === 2 ? [
    { label: "Superset A — 4 rounds", rest: "40 sec", exercises: [{ name: "Resistance Band Bicep Curl", sets: "4x15", note: "Heavier band — shorter rest increases intensity" }, { name: "Resistance Band Tricep Pushdown", sets: "4x15", note: "Heavier band — arms should fatigue by round 3" }] },
    { label: "Superset B — 4 rounds", rest: "40 sec", exercises: [{ name: "Kettlebell Concentration Curl", sets: "4x10 each", note: "Elbow on inner thigh — maximum bicep isolation" }, { name: "Resistance Band Skull Crusher", sets: "4x12", note: "Long tricep head — gives the horseshoe shape" }] },
    { label: "Superset C — 3 rounds", rest: "40 sec", exercises: [{ name: "Resistance Band Lateral Raise", sets: "3x15", note: "2-sec hold at the top — burns the shoulder cap" }, { name: "Resistance Band Rear Delt Fly", sets: "3x15", note: "5 more reps than Week 1" }] },
    { label: "Core Finisher — 3 rounds", rest: "30 sec", exercises: [{ name: "Dead Bug", sets: "3x12 each side", note: "2 more reps than Week 1" }, { name: "Side Plank with Hip Dip", sets: "3x10 each", note: "Obliques define the waist" }] },
  ] : [
    { label: "Superset A — 5 rounds", rest: "35 sec", exercises: [{ name: "Resistance Band Bicep Curl", sets: "5x15", note: "Heaviest band — 5 rounds. Peak bicep stimulus" }, { name: "Resistance Band Tricep Pushdown", sets: "5x15", note: "Heaviest band — 5 rounds. 35 sec rest is short on purpose" }] },
    { label: "Superset B — 4 rounds", rest: "35 sec", exercises: [{ name: "Kettlebell Concentration Curl", sets: "4x12 each", note: "Peak bicep isolation" }, { name: "Resistance Band Skull Crusher", sets: "4x15", note: "Peak long head volume" }] },
    { label: "Superset C — 3 rounds", rest: "40 sec", exercises: [{ name: "Kettlebell Arnold Press", sets: "3x12", note: "All 3 deltoid heads" }, { name: "Resistance Band Rear Delt Fly", sets: "3x20", note: "Peak rear delt volume" }] },
    { label: "Core Finisher — 3 rounds", rest: "25 sec", exercises: [{ name: "Dead Bug", sets: "3x14 each side", note: "Peak core volume" }, { name: "Side Plank with Hip Dip", sets: "3x15 each", note: "Shortest rest, most oblique burn" }] },
  ],
  finisher: w === 4 ? null : "8 min treadmill incline walk — 6% grade, active recovery",
  cooldown: "Tricep cross-body stretch 30 sec each + overhead tricep stretch 30 sec + doorframe chest stretch 30 sec",
});

const WEDNESDAY = (w) => ({
  day: "Wednesday", label: "Glutes + Hamstrings (2nd hit)", tag: w === 4 ? "Deload" : "Strength",
  duration: w === 4 ? "20 min" : "35-40 min",
  focus: w === 4 ? "Deload — light glute activation only. 2 rounds max." : "Second glute session — hip thrusts + isolation = growth stimulus",
  warmup: ["Hip circles — 10 each side", "Glute bridges bodyweight — 20 reps slow", "Lateral band walk — 12 steps each way", "Clamshell no band — 15 each side", "Cat-cow — 8 reps"],
  supersets: w === 4 ? [
    { label: "Activation — 2 rounds", rest: "75 sec", exercises: [{ name: "Resistance Band Glute Bridge", sets: "2x15", note: "Light band — slow and deliberate" }, { name: "Resistance Band Clamshell", sets: "2x12 each", note: "Feel the glute med, do not grind" }] },
  ] : w === 1 ? [
    { label: "Superset A — 4 rounds", rest: "50 sec", exercises: [{ name: "Resistance Band Hip Thrust (elevated)", sets: "4x15", note: "Shoulders on couch, band across hips — 2-sec squeeze at top" }, { name: "Resistance Band Clamshell", sets: "4x15 each", note: "Outer glute — keep tension throughout" }] },
    { label: "Superset B — 4 rounds", rest: "50 sec", exercises: [{ name: "Resistance Band Donkey Kick", sets: "4x15 each", note: "Slow and controlled — glute initiates, not lower back" }, { name: "Resistance Band Lateral Walk", sets: "4x15 steps each way", note: "Stay low, keep tension on the band" }] },
    { label: "Burnout — 2 rounds", rest: "40 sec", exercises: [{ name: "Resistance Band Glute Bridge", sets: "2x20", note: "Drive through heels — hold 2 sec at top" }, { name: "Resistance Band Kickback (standing)", sets: "2x15 each", note: "Straight back, full squeeze" }] },
  ] : w === 2 ? [
    { label: "Superset A — 4 rounds", rest: "45 sec", exercises: [{ name: "Resistance Band Hip Thrust (elevated)", sets: "4x20", note: "More reps + heavier band — keep the 2-sec squeeze" }, { name: "Resistance Band Clamshell", sets: "4x20 each", note: "5 more reps — outer glute fatigue is the goal" }] },
    { label: "Superset B — 4 rounds", rest: "45 sec", exercises: [{ name: "Resistance Band Donkey Kick", sets: "4x20 each", note: "5 more than Week 1" }, { name: "Resistance Band Lateral Walk", sets: "4x20 steps each way", note: "5 more steps" }] },
    { label: "Burnout — 3 rounds", rest: "35 sec", exercises: [{ name: "Resistance Band Glute Bridge", sets: "3x25", note: "5 more reps + shorter rest" }, { name: "Resistance Band Kickback (standing)", sets: "3x20 each", note: "Squeeze at top every rep" }] },
  ] : [
    { label: "Superset A — 5 rounds", rest: "40 sec", exercises: [{ name: "Resistance Band Hip Thrust (elevated)", sets: "5x20", note: "Heaviest band — 5 rounds. Peak glute stimulus" }, { name: "Resistance Band Clamshell", sets: "5x20 each", note: "5 rounds — outer glute completely fatigued by end" }] },
    { label: "Superset B — 4 rounds", rest: "40 sec", exercises: [{ name: "Resistance Band Donkey Kick", sets: "4x25 each", note: "Peak donkey kick volume" }, { name: "Resistance Band Lateral Walk", sets: "4x25 steps each way", note: "Peak lateral walk volume" }] },
    { label: "Burnout — 3 rounds", rest: "30 sec", exercises: [{ name: "Resistance Band Glute Bridge", sets: "3x30", note: "Highest rep count of the programme" }, { name: "Resistance Band Kickback (standing)", sets: "3x25 each", note: "Squeeze hard, go slow" }] },
  ],
  finisher: w === 4 ? null : "5 min easy walk — legs will be pumped, walk it out",
  cooldown: "Pigeon pose 45 sec each + lying figure-4 stretch 45 sec each + hip flexor lunge 40 sec each",
});

const THURSDAY = (w) => ({
  day: "Thursday", label: "Glutes + Legs + Core (Heavy)", tag: w === 4 ? "Deload" : "Strength",
  duration: w === 4 ? "30 min" : "45 min",
  focus: w === 4 ? "Deload — same movements, 2 rounds only." : w === 3 ? "Heaviest session of the programme — push the kettlebell weight" : "Primary lower session — heavy deadlifts, squats, core",
  warmup: ["Hip circles — 10 each side", "Glute bridges bodyweight — 20 reps", "Lateral band walks — 12 steps each way", "Leg swings — 10 each side", "Inchworm walkout — 5 reps"],
  supersets: w === 4 ? [
    { label: "Superset A — 2 rounds", rest: "75 sec", exercises: [{ name: "Kettlebell Romanian Deadlift", sets: "2x8", note: "Moderate weight — perfect form focus" }, { name: "Resistance Band Hip Thrust (elevated)", sets: "2x12", note: "Slow and deliberate" }] },
    { label: "Superset B — 2 rounds", rest: "75 sec", exercises: [{ name: "Kettlebell Goblet Squat", sets: "2x8", note: "Smooth controlled reps" }, { name: "Resistance Band Clamshell", sets: "2x12 each", note: "Light band" }] },
    { label: "Core — 1 round", rest: "30 sec", exercises: [{ name: "Plank Hold", sets: "1x25 sec", note: "Quality over duration" }, { name: "Dead Bug", sets: "1x8 each side", note: "Reset the core pattern" }] },
  ] : w === 1 ? [
    { label: "Superset A — 4 rounds", rest: "55 sec", exercises: [{ name: "Kettlebell Romanian Deadlift", sets: "4x10", note: "Hinge at hips — primary glute builder" }, { name: "Resistance Band Hip Thrust (elevated)", sets: "4x15", note: "Band across hips, 2-sec squeeze every rep" }] },
    { label: "Superset B — 4 rounds", rest: "55 sec", exercises: [{ name: "Kettlebell Goblet Squat", sets: "4x12", note: "Sit back not down — 2-sec pause at the bottom" }, { name: "Resistance Band Squat Pulse", sets: "4x20", note: "Stay in the bottom quarter" }] },
    { label: "Superset C — 3 rounds", rest: "50 sec", exercises: [{ name: "Kettlebell Single-leg Deadlift", sets: "3x8 each", note: "Go light — hips stay level" }, { name: "Kettlebell Swing", sets: "3x15", note: "Hip hinge power — glutes, hamstrings, core" }] },
    { label: "Core Finisher — 3 rounds", rest: "30 sec", exercises: [{ name: "Plank Hold", sets: "3x35 sec", note: "Squeeze glutes and abs simultaneously" }, { name: "Reverse Crunch", sets: "3x12", note: "Lift hips with abs — not momentum" }] },
  ] : w === 2 ? [
    { label: "Superset A — 4 rounds", rest: "50 sec", exercises: [{ name: "Kettlebell Romanian Deadlift", sets: "4x12", note: "Add 1-2 kg vs Week 1. Pause 1 sec at bottom" }, { name: "Resistance Band Hip Thrust (elevated)", sets: "4x20", note: "Heavier band — keep the squeeze" }] },
    { label: "Superset B — 4 rounds", rest: "50 sec", exercises: [{ name: "Kettlebell Goblet Squat", sets: "4x12", note: "3-sec pause at bottom" }, { name: "Resistance Band Squat Pulse", sets: "4x25", note: "5 more pulses — stay in the burn" }] },
    { label: "Superset C — 4 rounds", rest: "45 sec", exercises: [{ name: "Kettlebell Single-leg Deadlift", sets: "4x10 each", note: "2 more reps vs Week 1" }, { name: "Kettlebell Swing", sets: "4x20", note: "5 more swings per round" }] },
    { label: "Core Finisher — 3 rounds", rest: "30 sec", exercises: [{ name: "Plank Hold", sets: "3x40 sec", note: "5 more seconds than Week 1" }, { name: "Side Plank with Hip Dip", sets: "3x12 each", note: "Oblique definition" }] },
  ] : [
    { label: "Superset A — 5 rounds", rest: "45 sec", exercises: [{ name: "Kettlebell Romanian Deadlift", sets: "5x12", note: "Heaviest weight yet — 5 rounds" }, { name: "Resistance Band Hip Thrust (elevated)", sets: "5x20", note: "Heaviest band — 2-sec squeeze every rep" }] },
    { label: "Superset B — 4 rounds", rest: "45 sec", exercises: [{ name: "Kettlebell Goblet Squat", sets: "4x15", note: "3-sec pause, explosive drive up" }, { name: "Resistance Band Squat Pulse", sets: "4x30", note: "Peak pulse volume" }] },
    { label: "Superset C — 4 rounds", rest: "40 sec", exercises: [{ name: "Kettlebell Single-leg Deadlift", sets: "4x12 each", note: "Heaviest single-leg work" }, { name: "Kettlebell Swing", sets: "4x25", note: "Peak swing volume" }] },
    { label: "Core Finisher — 3 rounds", rest: "25 sec", exercises: [{ name: "Plank Hold", sets: "3x50 sec", note: "Longest hold of the programme" }, { name: "Reverse Crunch", sets: "3x20", note: "Peak lower ab activation" }] },
  ],
  finisher: w === 4 ? "8 min easy flat treadmill walk" : "8 min treadmill incline walk",
  cooldown: "Hip flexor lunge 40 sec each + pigeon pose 50 sec each + spinal twist 35 sec each",
});

export const makeWeek = (w) => [
  { day: "Monday", label: "5k Run", tag: "Run", run: true, runWeek: w, runDay: "Monday" },
  TUESDAY(w),
  WEDNESDAY(w),
  THURSDAY(w),
  { day: "Friday", label: "5k Run", tag: "Run", run: true, runWeek: w, runDay: "Friday" },
  { day: "Saturday", label: "Hot Yoga", tag: "Yoga", yoga: true, note: YOGA_NOTE },
  { day: "Sunday", label: "Rest", tag: "Rest", note: REST_NOTE },
];

// Wiring reference tables and test-tips content, plus simple identification
// diagrams. Wire colours follow the common Honeywell/Drayton-style
// convention used in most UK wiring centre diagrams, but colours and
// terminal layouts DO vary by manufacturer — always confirm against the
// instructions for the actual valve/wiring centre fitted.

const Y_PLAN_DIAGRAM = `
<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Y plan schematic: boiler, 3-port mid-position valve, cylinder and radiators">
  <style>
    .lbl { font: 12px -apple-system, Roboto, sans-serif; fill: var(--text); }
    .sub { font: 10px -apple-system, Roboto, sans-serif; fill: var(--muted); }
    .box { fill: var(--card); stroke: var(--border); stroke-width: 1.5; }
    .pipe { stroke: var(--muted); stroke-width: 2.5; fill: none; }
  </style>
  <rect class="box" x="16" y="90" width="66" height="44" rx="6"/>
  <text class="lbl" x="49" y="117" text-anchor="middle">Boiler</text>

  <path class="pipe" d="M82,112 L150,112"/>
  <circle cx="165" cy="112" r="20" class="box"/>
  <text class="lbl" x="165" y="109" text-anchor="middle">3-port</text>
  <text class="sub" x="165" y="121" text-anchor="middle">valve</text>

  <path class="pipe" d="M185,100 L240,60"/>
  <path class="pipe" d="M185,124 L240,164"/>

  <rect class="box" x="240" y="30" width="90" height="40" rx="6"/>
  <text class="lbl" x="285" y="54" text-anchor="middle">Radiators (CH)</text>

  <rect class="box" x="240" y="144" width="90" height="40" rx="6"/>
  <text class="lbl" x="285" y="168" text-anchor="middle">Cylinder (HW)</text>

  <text class="sub" x="165" y="150" text-anchor="middle">one valve body,</text>
  <text class="sub" x="165" y="162" text-anchor="middle">three pipes</text>
</svg>`;

const S_PLAN_DIAGRAM = `
<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="S plan schematic: boiler, two separate 2-port zone valves, cylinder and radiators">
  <style>
    .lbl { font: 12px -apple-system, Roboto, sans-serif; fill: var(--text); }
    .sub { font: 10px -apple-system, Roboto, sans-serif; fill: var(--muted); }
    .box { fill: var(--card); stroke: var(--border); stroke-width: 1.5; }
    .pipe { stroke: var(--muted); stroke-width: 2.5; fill: none; }
  </style>
  <rect class="box" x="16" y="90" width="66" height="44" rx="6"/>
  <text class="lbl" x="49" y="117" text-anchor="middle">Boiler</text>

  <path class="pipe" d="M82,105 L140,60"/>
  <path class="pipe" d="M82,119 L140,164"/>

  <rect x="140" y="40" width="46" height="34" rx="6" class="box"/>
  <text class="lbl" x="163" y="61" text-anchor="middle" style="font-size:10px">2-port</text>

  <rect x="140" y="150" width="46" height="34" rx="6" class="box"/>
  <text class="lbl" x="163" y="171" text-anchor="middle" style="font-size:10px">2-port</text>

  <path class="pipe" d="M186,57 L240,57"/>
  <path class="pipe" d="M186,167 L240,167"/>

  <rect class="box" x="240" y="37" width="90" height="40" rx="6"/>
  <text class="lbl" x="285" y="61" text-anchor="middle">Radiators (CH)</text>

  <rect class="box" x="240" y="147" width="90" height="40" rx="6"/>
  <text class="lbl" x="285" y="171" text-anchor="middle">Cylinder (HW)</text>

  <text class="sub" x="163" y="100" text-anchor="middle">two separate</text>
  <text class="sub" x="163" y="112" text-anchor="middle">valve bodies</text>
</svg>`;

const WIRING_REFERENCE = [
  {
    title: "Y plan: 3-port mid-position valve",
    diagram: Y_PLAN_DIAGRAM,
    caption: "One valve body with three pipes: inlet, CH outlet, HW outlet.",
    rows: [
      { dot: "#9ca3af", wire: "Grey", fn: "Live to drive valve to <b>hot water</b> (from cylinder stat via wiring centre)" },
      { dot: "#ffffff", wire: "White", fn: "Live to drive valve to <b>heating only</b> (from room stat via wiring centre)" },
      { dot: "#f97316", wire: "Orange", fn: "Switched live <b>out</b> to boiler (and pump) once valve has travelled" },
      { dot: "#3b82f6", wire: "Blue", fn: "Neutral" },
      { dot: "linear-gradient(90deg,#16a34a 50%,#facc15 50%)", wire: "Green/yellow", fn: "Earth" },
    ],
    note: "Grey + white both live = valve sits in the <b>mid position</b>, so heating and hot water together. Only one live = that port only.",
  },
  {
    title: "S plan: 2-port zone valves (one CH, one HW)",
    diagram: S_PLAN_DIAGRAM,
    caption: "Two separate valve bodies — one per circuit.",
    rows: [
      { dot: "#9ca3af", wire: "Grey (some makes brown)", fn: "Switched live from stat/programmer: powers the motor to <b>open</b> the valve" },
      { dot: "#f97316", wire: "Orange", fn: "End-switch live <b>out</b> to boiler/pump once valve is open (each valve's orange joins at the wiring centre)" },
      { dot: "#3b82f6", wire: "Blue", fn: "Neutral" },
      { dot: "linear-gradient(90deg,#16a34a 50%,#facc15 50%)", wire: "Green/yellow", fn: "Earth" },
    ],
    note: "Motor is spring-return: lose the live on grey and the valve closes. Heads usually swap without draining down (check the model).",
  },
];

const SPOTTING_NOTES = [
  "<b>Y plan:</b> one valve with three pipes (inlet and two outlets), usually near the cylinder. One orange wire to the boiler.",
  "<b>S plan:</b> two separate 2-port valves, one on the CH flow and one on the HW flow to the cylinder.",
  "Wire colours and terminal layouts vary by make and wiring centre. Verify with the instructions.",
];

const TEST_TIPS = [
  { title: "Work backwards", text: "Programmer → stats → wiring centre → valve → boiler. Find where the live stops." },
  { title: "Valve test", text: "With power isolated, use the manual lever to confirm the valve body moves freely. Return the lever to <b>auto</b> afterwards — a lever left on manual causes \"heating always on\"." },
  { title: "Voltage", text: "A live reading should be about 230V AC against neutral. Anything much lower suggests a poor connection." },
  { title: "Continuity (isolated)", text: "Stat contacts and end switches should read near 0Ω when closed and open circuit when open." },
  { title: "Feel the pipes", text: "A hot pipe before the valve and cold after it means the valve isn't opening or passing." },
  { title: "Check the basics", text: "Boiler pressure (about 1 to 1.5 bar cold), stat batteries, programmer time, TRV pins, pump speed, fused spur." },
  { title: "Overheating cylinder", text: "If there's no working cylinder stat or valve closure, treat as a scalding risk — isolate it and fix before use." },
];

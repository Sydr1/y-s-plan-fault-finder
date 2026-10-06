// Quick Checks: a short, universal checklist shown before the plan/valve
// diagnosis starts. These are the fast, high-hit-rate checks that resolve a
// large share of "no heat" calls before any electrical testing is needed —
// the idea being to not make you (or the app) do 10 minutes of valve
// fault-finding when the answer was a dead programmer battery.
const QUICK_CHECKS = [
  {
    label: "Boiler has power — display or lights on",
    why: "Resolves a lot of \"completely dead\" calls by itself.",
    ifFail: "Check the fused spur fuse, isolator, RCD/MCB, and any fuse in the wiring centre before testing anything else.",
  },
  {
    label: "No fault code, lockout or low-pressure warning showing",
    why: "If the boiler itself is faulting, that's not a controls problem — sort that first.",
    ifFail: "Repressurise if low. Look up the fault code. Resolve the boiler fault before testing the valve/wiring.",
  },
  {
    label: "Programmer/timer is calling, right time and day, not left OFF",
    why: "Wrong time, held on OFF, or a flat battery on an electronic programmer is extremely common.",
    ifFail: "Set the time and day, check the mode, and replace batteries if it's an electronic programmer.",
  },
  {
    label: "Room/cylinder stat is actually calling (setpoint above current temp)",
    why: "A stat that isn't calling looks identical to a wiring fault until you rule this out.",
    ifFail: "Raise the setpoint and check it responds. For wireless stats, check the battery and the receiver's signal/pairing light.",
  },
  {
    label: "TRVs aren't all shut with no bypass fitted",
    why: "All TRVs closed with no automatic bypass can choke flow and mimic a valve fault.",
    ifFail: "Open at least one TRV fully, or confirm an automatic bypass valve is fitted and set correctly.",
  },
  {
    label: "No obvious air or sludge symptoms (gurgling, cold tops/bottoms on rads)",
    why: "Airlocks and sludge cause \"no heat\" symptoms that look electrical but aren't.",
    ifFail: "Bleed radiators and the pump. If sludge is suspected, check the magnetic filter.",
  },
];

// Triage summaries: shown once, right after a symptom is picked, before the
// step-by-step questions begin. Ranked most-likely-first (general trade
// experience, not measured data — see the note in tree-data.js). Each entry
// points at a RESULTS id so the title/body/severity/frequency come from
// there; `note` adds symptom-specific context.
const TRIAGE_SUMMARIES = {
  A1: {
    intro: "No heating AND no hot water usually points to something shared — power, the boiler itself, or the programmer — rather than the valve. Most likely first:",
    items: [
      { result: "rPower", note: "Check this is actually a power problem before anything else." },
      { result: "rBoiler", note: "A lockout or low pressure stops everything downstream." },
      { result: "rProg", note: "Simple programmer mistakes are very common." },
      { result: "rMotor", note: "If power/boiler/programmer are all fine, the valve motor is next most likely." },
      { result: "rFlow", note: "Boiler firing but nothing getting through — pump, airlock or bypass." },
    ],
  },
  B1: {
    intro: "Heating's fine, so controls are mostly proven. Most likely first:",
    items: [
      { result: "rSat", note: "Check the cylinder isn't simply already hot before chasing a fault." },
      { result: "rMotor", note: "Valve motor/head failure is the most common genuine fault here." },
      { result: "rCyl", note: "Cylinder stat not calling or not wired correctly." },
      { result: "rWC", note: "Live being lost somewhere before the valve." },
      { result: "rHW", note: "Valve and boiler both working but no heat reaching the coil." },
    ],
  },
  C1: {
    intro: "Hot water's fine, so controls are mostly proven. Most likely first:",
    items: [
      { result: "rStat", note: "Room stat not actually calling is the most common cause." },
      { result: "rCH", note: "TRVs, balancing or sludge — very common once the valve has fired." },
      { result: "rMotor", note: "Valve motor/head failure on the CH side." },
      { result: "rWC", note: "Live being lost somewhere before the valve." },
    ],
  },
  D1: {
    intro: "Check for a genuine safety issue first, then the common causes:",
    items: [
      { result: "rTemp", note: "⚠ If anything is dangerously hot or boiling, deal with that before continuing.", safety: true },
      { result: "rManual", note: "The simplest and most common cause — a lever left on manual." },
      { result: "rCylStuck", note: "Cylinder stat or its wiring stuck calling." },
      { result: "rStatStuck", note: "Room stat, programmer override, or a wiring link stuck calling." },
      { result: "rStuck", note: "Mechanically jammed valve — less common, needs replacement." },
    ],
  },
};

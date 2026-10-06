// Decision tree for diagnosing Y plan (3-port mid-position valve) and
// S plan (two 2-port zone valves) heating control faults.
//
// Node ids ending in "*" are plan-dependent: the app resolves the trailing
// "*" to "y" or "s" once the plan is known (e.g. "A5*" -> "A5y" / "A5s").
// Every `o` (option) entry is [label, nextNodeId] or [label, resultId].
// A null target means "dead end / see another tab" (no further navigation).
//
// Where a node offers several genuinely different root causes to pick
// between (not just a yes/no observation), options are ordered most common
// first based on general UK domestic trade experience — not a specific
// manufacturer source. If your own field experience disagrees with an
// ordering, that's worth more than this list: treat it as a sensible
// starting point, not gospel.
const TREE = {
  start: {
    q: "Which system is it?",
    h: "Pick the layout you're working on.",
    o: [
      ["Y plan (one 3-port valve)", "sym", "y"],
      ["S plan (two 2-port valves)", "sym", "s"],
      ["Not sure", "id"],
    ],
  },
  id: {
    q: "Identify the system",
    h: "<ul><li><b>One</b> valve with <b>three</b> pipes = Y plan.</li><li><b>Two</b> separate valves, one on the heating and one on the hot water = S plan.</li></ul>",
    o: [
      ["It's a Y plan", "sym", "y"],
      ["It's an S plan", "sym", "s"],
      ["Still unsure — check the Wiring tab", null],
    ],
  },
  sym: {
    q: "What's the symptom?",
    h: "Choose the closest match.",
    o: [
      ["No heating and no hot water", "A1"],
      ["Heating works but no hot water", "B1"],
      ["Hot water works but no heating", "C1"],
      ["Heating or hot water runs when it shouldn't", "D1"],
    ],
  },

  A1: { q: "Is the boiler powered (display or lights on)?", h: "Check the fused spur, isolator and any fuse in the wiring centre.",
    o: [["Yes, it's powered", "A2"], ["No, it's dead", "rPower"]] },
  A2: { q: "Is the boiler showing a fault, lockout or low pressure?", h: "Look at the display, fault code and pressure gauge.",
    o: [["Yes", "rBoiler"], ["No, it looks normal", "A3"]] },
  A3: { q: "Is the programmer calling for heat or hot water?", h: "Channel lights on, correct time and day, and not set to OFF or boost-cancelled.",
    o: [["Yes, it's calling", "A4"], ["No, or the display is wrong/blank", "rProg"]] },
  A4: { q: "Is there 230V from the programmer to the wiring centre?", h: "Test the CH ON or HW ON terminal against neutral while calling. Prove your tester first.",
    o: [["Yes, live present", "A5*"], ["No live", "rProgOut"]] },
  A5y: { q: "At the mid-position valve, is the grey (HW call) or white (CH call) wire live?", h: "Only the wire for the active demand will be live.",
    o: [["Yes, live on the demanded wire", "A6y"], ["No live at the valve", "rWC"]] },
  A6y: { q: "Does the valve drive (lever or indicator moves, motor hum)?", h: "Give it up to a minute. Motors are slow.",
    o: [["Yes, it moves", "A7"], ["No, it doesn't move", "rMotor"]] },
  A5s: { q: "At the zone valve for the active demand, is there live on the grey (motor) wire?", h: "Check the CH valve for a heating call, and the HW valve for a hot water call.",
    o: [["Yes, live present", "A6s"], ["No live at the valve", "rWC"]] },
  A6s: { q: "Does the zone valve open (lever or indicator moves, motor hum)?", h: "Give it up to a minute.",
    o: [["Yes, it opens", "A7"], ["No, it doesn't", "rMotor"]] },
  A7: { q: "Once the valve has travelled, is there a live on the orange wire?", h: "The end switch should send a switched live to the boiler.",
    o: [["Yes, orange live", "A8"], ["No, orange stays dead", "rEnd"]] },
  A8: { q: "Does the boiler fire up when it receives the live?", h: "Check the boiler's own live input (its terminal strip) and the stat/frost terminals.",
    o: [["Yes, it fires", "rFlow"], ["No, the boiler ignores it", "rBoilerIn"]] },

  B1: { q: "Is the HW channel on and the cylinder actually cold?", h: "Cylinder stat should call if the cylinder is below set point (about 60°C).",
    o: [["Yes, calling and cylinder is cold", "B2"], ["No, the cylinder is actually hot", "rSat"]] },
  B2: { q: "Is there a live out of the cylinder stat when HW is calling?", h: "Test the stat's output terminal. Check the stat wiring and setting.",
    o: [["Yes, live out", "B3*"], ["No live out", "rCyl"]] },
  B3y: { q: "What do you see at the mid-position valve?", h: "Look at the grey wire and the valve motion.",
    o: [["Live on grey but the valve doesn't move", "rMotor"], ["The valve moves, the boiler fires, but the cylinder coil stays cold", "rHW"], ["No live on grey", "rWC"]] },
  B3s: { q: "What do you see at the HW zone valve?", h: "Look at its live feed and motion.",
    o: [["Live but the valve doesn't open", "rMotor"], ["The valve opens, the boiler fires, but the cylinder coil stays cold", "rHW"], ["No live at the valve", "rWC"]] },

  C1: { q: "Is the CH channel on and the room stat calling?", h: "Turn the stat well above room temperature. Check wireless stat batteries and receiver lights.",
    o: [["Yes, it's calling", "C2*"], ["No, the stat isn't calling", "rStat"]] },
  C2y: { q: "What do you see at the mid-position valve?", h: "Look at the white wire (heating only).",
    o: [["The valve moves, the boiler fires, but the radiators are cold", "rCH"], ["Live on white but the valve doesn't move", "rMotor"], ["No live on white", "rWC"]] },
  C2s: { q: "What do you see at the CH zone valve?", h: "Look at its live feed and motion.",
    o: [["The valve opens, the boiler fires, but the radiators are cold", "rCH"], ["Live but the valve doesn't open", "rMotor"], ["No live at the valve", "rWC"]] },

  D1: { q: "What is happening?", h: "Pick the closest.",
    o: [["Runs when it should be off", "D2*"], ["Cylinder is dangerously hot or the pipes are boiling", "rTemp"]] },
  D2y: { q: "With everything programmed off, check the valve. Which fits?", h: "Check the lever position and the grey and white wires with a tester.",
    o: [["Lever is on manual or stuck over", "rManual"], ["Grey is live when HW should be off", "rCylStuck"], ["White is live when CH should be off", "rStatStuck"], ["No live on either but the valve still passes", "rStuck"]] },
  D2s: { q: "With everything programmed off, check the zone valves. Which fits?", h: "Check the lever position and the grey wire on each valve.",
    o: [["Lever is on manual or stuck over", "rManual"], ["Grey on HW valve is live when HW should be off", "rCylStuck"], ["Grey on CH valve is live when CH should be off", "rStatStuck"], ["No live but the valve still passes", "rStuck"]] },
};

// [severity, title, body, frequency] — frequency is a rough "how often is
// this the actual cause" tag used for triage ordering and badges: 'common',
// 'occasional' or 'rare'. These are general trade-experience estimates, not
// measured statistics — treat them as a sensible default, not a citation.
const RESULTS = {
  rPower: ["danger", "Boiler has no power", "Check the fused spur fuse (3A or 5A), the isolator, the RCD/MCB, and the wiring centre fuse. If the spur is live but the boiler is dead, it's a boiler-side fault: call a Gas Safe engineer.", "common"],
  rBoiler: ["warn", "Boiler fault, lockout or low pressure", "Low pressure: repressurise to about 1 to 1.5 bar via the filling loop. Lockouts and error codes: check the manual, then reset once. Repeating lockouts mean a Gas Safe engineer. Controls aren't the problem here.", "common"],
  rProg: ["warn", "Programmer or timer problem", "Set the time and day, check the mode isn't OFF, replace programmer batteries, and check the live and neutral supply. If the display is dead with power present, replace the programmer.", "common"],
  rProgOut: ["danger", "Programmer isn't switching its output", "Confirm permanent live and neutral to the programmer. Calling but no live at the output terminal means a failed programmer relay. Replace it or the whole programmer (isolate first).", "occasional"],
  rWC: ["warn", "Live is being lost before the valve", "Work from the wiring centre to the valve. Check the stat (room stat for CH, cylinder stat for HW), its wiring, the terminal screws, and the wiring centre links. Check for a loose neutral. Replace the failed stat or repair the connection.", "occasional"],
  rMotor: ["danger", "Valve motor or head fault", "Live reaches the valve but it doesn't move. Isolate, use the manual lever to check the body moves freely. If the body is stiff, the valve is seized — try freeing it mechanically before condemning the head. If it moves freely by hand, replace the motor/head (often without draining down — check the model first).", "common"],
  rEnd: ["danger", "End switch (orange) fault", "Valve has moved but doesn't send live on orange. The internal microswitch is worn or failed, or the wire/terminal is loose. Replace the valve head. On S plan, check which valve is calling.", "occasional"],
  rBoilerIn: ["warn", "Live reaches the boiler terminal but it doesn't fire", "Check the boiler's own stat terminal link, the pump live, and any external control connection. If the input is present with no ignition, it's a boiler fault: Gas Safe engineer.", "occasional"],
  rFlow: ["warn", "Controls are OK: it's a flow problem", "Boiler fires but no heat reaches the system. Check the pump is running and not seized, bleed radiators and pump (airlock), check the valve body isn't blocked or sludged, check the bypass, and check system pressure. A magnetic filter flush may be needed.", "common"],
  rSat: ["ok", "Probably not a fault", "The cylinder is already up to temperature, so the cylinder stat is correctly satisfied. If the water is hot at the taps but cold at the cylinder top, check the taps and the cylinder stat position.", "common"],
  rCyl: ["danger", "Cylinder stat fault or setting", "Check the set point, the wiring (common/live in, output to valve), and replace the cylinder stat if it fails to make when the cylinder is cold. Check that it's strapped firmly to the cylinder.", "occasional"],
  rHW: ["warn", "Hot water flow problem", "Valve and boiler are working but the cylinder coil gets no heat. Check the pump, airlock on the HW circuit, a stuck valve body, a blocked coil or sludged HW flow and return, or a blocked pipe. Check the flow and return temperatures on the cylinder.", "occasional"],
  rStat: ["warn", "Room stat not calling", "Raise the setpoint, replace the batteries, check the wireless receiver lights and pairing, check wiring and terminals, and replace the stat if it never makes.", "common"],
  rCH: ["warn", "Heating flow problem", "Controls are working. Check that TRVs aren't stuck shut, bleed radiators, check the pump, the balancing, the bypass, and look for sludge. Balance and flush if needed.", "common"],
  rTemp: ["danger", "Overheating: safety risk", "Turn off the boiler and immersion if safe. Likely: cylinder stat stuck closed, miswired valve, or a stuck HW valve. Avoid using hot taps and don't tamper with a pressurised unvented cylinder. Call a qualified (G3/Gas Safe) engineer urgently.", "rare"],
  rManual: ["ok", "Manual lever left on", "Return the lever to auto. If it's on auto but the valve still sits open, replace the head.", "common"],
  rCylStuck: ["danger", "HW is being called when it shouldn't", "Cylinder stat output is live when satisfied: a stuck cylinder stat or wiring fault. Check the stat, any permanent live to grey, and the wiring centre links. Replace the stat.", "occasional"],
  rStatStuck: ["danger", "CH is being called when it shouldn't", "Room stat stuck closed, programmer set to constant or in override, or a wiring link. Check the stat, programmer mode and wiring centre.", "occasional"],
  rStuck: ["danger", "Valve passing or stuck", "No live is driving it but the valve doesn't return or shut. It's mechanically stuck: swap the head first, and if it's still open, replace the valve body.", "rare"],
};

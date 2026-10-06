// Validates the Y/S plan decision tree: every option target resolves to a
// real node or result (for both plan contexts), every result has a valid
// severity, and every node is reachable from "start". Run with:
//   node test/test-tree.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = {};
vm.createContext(sandbox);
const src = fs.readFileSync(path.join(__dirname, "..", "js", "tree-data.js"), "utf8");
const { TREE, RESULTS } = vm.runInContext(src + "\n({ TREE, RESULTS })", sandbox);

const SEVERITIES = ["ok", "warn", "danger"];
let failures = 0;
function fail(msg) { failures++; console.error("  FAIL: " + msg); }

function resolve(id, plan) {
  if (id && id.endsWith("*")) return id.slice(0, -1) + plan;
  return id;
}

console.log("Checking RESULTS entries...");
Object.entries(RESULTS).forEach(([id, r]) => {
  if (!Array.isArray(r) || r.length !== 3) { fail(`result "${id}": expected [severity, title, body]`); return; }
  const [sev, title, body] = r;
  if (!SEVERITIES.includes(sev)) fail(`result "${id}": severity "${sev}" not one of ${SEVERITIES.join("/")}`);
  if (!title || typeof title !== "string") fail(`result "${id}": missing title`);
  if (!body || typeof body !== "string") fail(`result "${id}": missing body`);
});
console.log(`  ${Object.keys(RESULTS).length} results checked`);

console.log("Checking TREE node options resolve (for both plans)...");
let optionsChecked = 0;
Object.entries(TREE).forEach(([nodeId, node]) => {
  if (!node.q || typeof node.q !== "string") fail(`node "${nodeId}": missing question text "q"`);
  if (!Array.isArray(node.o) || node.o.length === 0) { fail(`node "${nodeId}": "o" must be a non-empty array`); return; }
  node.o.forEach(([label, target, plan], i) => {
    if (!label || typeof label !== "string") fail(`node "${nodeId}" option[${i}]: missing label`);
    if (target === null) return; // intentional dead end (e.g. "see another tab")
    optionsChecked++;
    ["y", "s"].forEach((p) => {
      const resolved = resolve(target, plan || p);
      if (!resolved) { fail(`node "${nodeId}" option[${i}]: target "${target}" resolves to empty for plan "${p}"`); return; }
      if (!TREE[resolved] && !RESULTS[resolved]) {
        fail(`node "${nodeId}" option[${i}]: target "${target}" -> "${resolved}" is not a known node or result (plan=${p})`);
      }
    });
  });
});
console.log(`  ${Object.keys(TREE).length} nodes, ${optionsChecked} options verified for both plans`);

console.log("Checking reachability from \"start\"...");
["y", "s"].forEach((plan) => {
  const visited = new Set();
  const queue = ["start"];
  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id) || RESULTS[id]) continue;
    visited.add(id);
    const node = TREE[id];
    if (!node) continue;
    node.o.forEach(([, target, p]) => {
      if (target === null) return;
      const resolved = resolve(target, p || plan);
      if (resolved && !visited.has(resolved)) queue.push(resolved);
    });
  }
  // Nodes ending in y/s that belong to the other plan are expected to be unreached in this pass.
  const relevantUnreached = Object.keys(TREE).filter((id) => {
    if (visited.has(id)) return false;
    if (id.endsWith("y") && plan !== "y") return false;
    if (id.endsWith("s") && plan !== "s") return false;
    return true;
  });
  if (relevantUnreached.length) fail(`plan "${plan}": unreachable nodes: ${relevantUnreached.join(", ")}`);
  console.log(`  plan "${plan}": ${visited.size} nodes/results reached`);
});

console.log("\n" + "=".repeat(40));
if (failures > 0) {
  console.error(`${failures} FAILURE(S).`);
  process.exit(1);
} else {
  console.log("All checks passed.");
}

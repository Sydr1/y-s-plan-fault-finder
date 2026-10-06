// Validates the Y/S plan decision tree: every option target resolves to a
// real node or result (for both plan contexts), every result has a valid
// severity, and every node is reachable from "start". Run with:
//   node test/test-tree.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = {};
vm.createContext(sandbox);
const treeSrc = fs.readFileSync(path.join(__dirname, "..", "js", "tree-data.js"), "utf8");
const { TREE, RESULTS } = vm.runInContext(treeSrc + "\n({ TREE, RESULTS })", sandbox);
const quickSrc = fs.readFileSync(path.join(__dirname, "..", "js", "quick-data.js"), "utf8");
const { QUICK_CHECKS, TRIAGE_SUMMARIES } = vm.runInContext(quickSrc + "\n({ QUICK_CHECKS, TRIAGE_SUMMARIES })", sandbox);

const SEVERITIES = ["ok", "warn", "danger"];
const FREQUENCIES = ["common", "occasional", "rare"];
let failures = 0;
function fail(msg) { failures++; console.error("  FAIL: " + msg); }

function resolve(id, plan) {
  if (id && id.endsWith("*")) return id.slice(0, -1) + plan;
  return id;
}

console.log("Checking RESULTS entries...");
Object.entries(RESULTS).forEach(([id, r]) => {
  if (!Array.isArray(r) || r.length !== 4) { fail(`result "${id}": expected [severity, title, body, frequency]`); return; }
  const [sev, title, body, freq] = r;
  if (!SEVERITIES.includes(sev)) fail(`result "${id}": severity "${sev}" not one of ${SEVERITIES.join("/")}`);
  if (!title || typeof title !== "string") fail(`result "${id}": missing title`);
  if (!body || typeof body !== "string") fail(`result "${id}": missing body`);
  if (!FREQUENCIES.includes(freq)) fail(`result "${id}": frequency "${freq}" not one of ${FREQUENCIES.join("/")}`);
});
console.log(`  ${Object.keys(RESULTS).length} results checked`);

console.log("Checking QUICK_CHECKS...");
if (!Array.isArray(QUICK_CHECKS) || QUICK_CHECKS.length === 0) fail("QUICK_CHECKS must be a non-empty array");
else QUICK_CHECKS.forEach((c, i) => {
  ["label", "why", "ifFail"].forEach((f) => {
    if (!c[f] || typeof c[f] !== "string") fail(`QUICK_CHECKS[${i}]: missing "${f}"`);
  });
});
console.log(`  ${(QUICK_CHECKS || []).length} quick checks checked`);

console.log("Checking TRIAGE_SUMMARIES reference real results...");
let triageItemsChecked = 0;
Object.entries(TRIAGE_SUMMARIES || {}).forEach(([nodeId, summary]) => {
  if (!TREE[nodeId]) fail(`TRIAGE_SUMMARIES["${nodeId}"]: no such TREE node`);
  if (!summary.intro || typeof summary.intro !== "string") fail(`TRIAGE_SUMMARIES["${nodeId}"]: missing intro`);
  if (!Array.isArray(summary.items) || summary.items.length === 0) { fail(`TRIAGE_SUMMARIES["${nodeId}"]: items must be a non-empty array`); return; }
  summary.items.forEach((item, i) => {
    triageItemsChecked++;
    if (!RESULTS[item.result]) fail(`TRIAGE_SUMMARIES["${nodeId}"].items[${i}]: result "${item.result}" is not a known result`);
    if (!item.note || typeof item.note !== "string") fail(`TRIAGE_SUMMARIES["${nodeId}"].items[${i}]: missing note`);
  });
});
console.log(`  ${Object.keys(TRIAGE_SUMMARIES || {}).length} triage summaries, ${triageItemsChecked} items checked`);

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

const fs = require("fs");
const { spawnSync } = require("child_process");

const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const packages = lock.packages || {};

function isRuntimeNode(nodePath) {
  const meta = packages[nodePath];
  if (!meta) return true; // conservative: unknown node counts as runtime
  return meta.dev !== true && meta.devOptional !== true;
}

const run = spawnSync(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["audit", "--json"],
  { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
);

let report;
try {
  report = JSON.parse(run.stdout || "{}");
} catch (err) {
  console.error(run.stdout || "");
  console.error(run.stderr || "");
  throw new Error("Unable to parse npm audit JSON");
}

const vulnerabilities = report.vulnerabilities || {};
const runtimeFindings = [];
const devOnlyFindings = [];

for (const [name, finding] of Object.entries(vulnerabilities)) {
  const nodes = Array.isArray(finding.nodes) ? finding.nodes : [];
  const runtimeNodes = nodes.filter(isRuntimeNode);
  const record = {
    name,
    severity: finding.severity || "unknown",
    nodes: runtimeNodes.length ? runtimeNodes : nodes,
  };
  if (runtimeNodes.length > 0 || nodes.length === 0) runtimeFindings.push(record);
  else devOnlyFindings.push(record);
}

const highOrCritical = runtimeFindings.filter((f) =>
  f.severity === "high" || f.severity === "critical"
);

console.log("AETHER runtime dependency audit");
console.log("runtimeFindings:", runtimeFindings.length);
console.log("runtimeHighCritical:", highOrCritical.length);
console.log("devToolingFindings:", devOnlyFindings.length);

if (runtimeFindings.length) {
  console.log(
    "runtimePackages:",
    runtimeFindings.map((f) => f.name + ":" + f.severity).join(", ")
  );
}
if (devOnlyFindings.length) {
  console.log(
    "devToolingPackages:",
    devOnlyFindings.map((f) => f.name + ":" + f.severity).join(", ")
  );
}
if (highOrCritical.length) {
  throw new Error(
    "Runtime dependency audit failed: high/critical vulnerabilities found in " +
      highOrCritical.map((f) => f.name).join(", ")
  );
}

console.log("runtimeSecurityAudit: PASSED (no high/critical runtime dependency vulnerabilities)");

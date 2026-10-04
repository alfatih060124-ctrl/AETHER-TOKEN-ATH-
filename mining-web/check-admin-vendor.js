const fs = require("fs");
const path = require("path");

const bundle = path.join(
  path.dirname(require.resolve("ethers")),
  "..",
  "dist",
  "ethers.umd.min.js"
);

if (!fs.existsSync(bundle)) {
  throw new Error("Admin vendor QC failed: local ethers UMD bundle is missing: " + bundle);
}

const stat = fs.statSync(bundle);
if (!stat.isFile() || stat.size < 100000) {
  throw new Error("Admin vendor QC failed: local ethers UMD bundle is invalid.");
}

console.log("Admin vendor QC passed: same-origin ethers bundle available (" + stat.size + " bytes).");

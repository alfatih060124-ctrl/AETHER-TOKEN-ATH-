const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");
const banned = [
  /\bgunakan\b/i,
  /\bjangan\b/i,
  /\bpilih\b/i,
  /\bminat\b/i,
  /\bverifikasi\b/i,
  /\bkomunitas\b/i,
  /\bperingatan\b/i,
  /\bdihapus\b/i,
  /\bdiblokir\b/i,
  /\bmenit\b/i,
  /\bselamat datang\b/i,
  /\bedukasi\b/i,
  /\bteman\b/i,
  /\bbelum\b/i,
  /\bapakah\b/i,
  /\bkamu\b/i,
  /\bsudah\b/i,
  /\bharus\b/i,
  /\balamat\b/i,
  /\btransaksi\b/i,
];

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(full);
    return entry.isFile() && entry.name.endsWith(".js") ? [full] : [];
  });
}

const violations = [];
for (const file of files(ROOT)) {
  const source = fs.readFileSync(file, "utf8");
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of banned) {
      if (pattern.test(line)) {
        violations.push(
          `${path.relative(ROOT, file)}:${index + 1}: ${line.trim()}`
        );
        break;
      }
    }
  });
}

if (violations.length) {
  console.error("English-only runtime check FAILED:");
  for (const violation of violations) console.error(" - " + violation);
  process.exit(1);
}

console.log("ATH Telegram bot English-only runtime check PASSED");

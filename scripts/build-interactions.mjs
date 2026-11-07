// Builds src/data/interactions.json from DDInter's CSV downloads (https://ddinter.scbdd.com/download/).
// Usage: node scripts/build-interactions.mjs <csv files...>
// Accepts DDInter's own columns (Drug_A, Drug_B, Level) or the merged layout
// (primary_drug_name, secondary_drug_name, interaction_severity).
// The output is derived from DDInter and is licensed CC BY-NC-SA 4.0 (see src/data/LICENSE.md).
import { readFileSync, writeFileSync } from "node:fs";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: node scripts/build-interactions.mjs <ddinter csv files...>");
  process.exit(1);
}

const SEVERITIES = ["Major", "Moderate", "Minor", "Unknown"];

// Minimal CSV parser: handles quoted fields with commas and doubled quotes.
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const names = new Map(); // lower-case name -> display name
const pairs = new Map(); // "a|b" (sorted, lower-case) -> severity
let read = 0, conflicts = 0;
for (const file of files) {
  const [header, ...rows] = parseCsv(readFileSync(file, "utf8"));
  const col = (...options) => {
    const i = header.findIndex((h) => options.includes(h.trim()));
    if (i < 0) throw new Error(`${file}: no column named ${options.join(" or ")}`);
    return i;
  };
  const a = col("Drug_A", "primary_drug_name"), b = col("Drug_B", "secondary_drug_name"), s = col("Level", "interaction_severity");
  for (const r of rows) {
    const nameA = r[a].trim(), nameB = r[b].trim();
    const severity = SEVERITIES.find((x) => x.toLowerCase() === r[s].trim().toLowerCase()) ?? "Unknown";
    if (!nameA || !nameB) continue;
    names.set(nameA.toLowerCase(), nameA);
    names.set(nameB.toLowerCase(), nameB);
    const key = [nameA.toLowerCase(), nameB.toLowerCase()].sort().join("|");
    const before = pairs.get(key);
    if (before && before !== severity) conflicts++;
    // (if DDInter's files ever disagree, keep the more serious level)
    if (!before || SEVERITIES.indexOf(severity) < SEVERITIES.indexOf(before)) pairs.set(key, severity);
    read++;
  }
}

const drugs = [...names.values()].sort((x, y) => x.localeCompare(y));
const index = new Map(drugs.map((d, i) => [d.toLowerCase(), i]));
const flat = [];
for (const [key, severity] of [...pairs].sort()) {
  const [x, y] = key.split("|").map((n) => index.get(n));
  flat.push(Math.min(x, y), Math.max(x, y), SEVERITIES.indexOf(severity));
}
const out = {
  source: "DDInter (https://ddinter.scbdd.com/), CC BY-NC-SA 4.0",
  severities: SEVERITIES,
  drugs,
  pairs: flat, // [drugA, drugB, severity] index triples, drugA < drugB
};
writeFileSync("src/data/interactions.json", JSON.stringify(out));
console.log(`${read} rows -> ${drugs.length} drugs, ${pairs.size} pairs (${conflicts} disagreements resolved)`);

// Drug–drug interaction lookup over the bundled DDInter data (src/data/interactions.json, CC BY-NC-SA 4.0).
// Built by scripts/build-interactions.mjs; everything runs in memory on the server, no database.
import data from "@/data/interactions.json";

export type Severity = "Major" | "Moderate" | "Minor" | "Unknown";

const SEVERITIES = data.severities as Severity[];
const DRUGS: string[] = data.drugs;
const byName = new Map(DRUGS.map((name, i) => [name.toLowerCase(), i]));

// Pairs keyed by both drug indexes (smaller first).
const key = (a: number, b: number) => (a < b ? a * 65536 + b : b * 65536 + a);
const pairs = new Map<number, Severity>();
for (let i = 0; i < data.pairs.length; i += 3) pairs.set(key(data.pairs[i], data.pairs[i + 1]), SEVERITIES[data.pairs[i + 2]]);

// Everyday and UK names that DDInter files under another name.
const ALIASES: Record<string, string> = {
  aspirin: "Acetylsalicylic acid",
  paracetamol: "Acetaminophen",
  adrenaline: "Epinephrine",
  noradrenaline: "Norepinephrine",
  frusemide: "Furosemide",
  lignocaine: "Lidocaine",
  "glyceryl trinitrate": "Nitroglycerin",
  albuterol: "Salbutamol",
};

const normalise = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

export interface Drug {
  index: number;
  name: string; // DDInter's name
  label: string; // what to show: "Aspirin (Acetylsalicylic acid)" when an everyday name was used
}

/** Finds a drug by its exact name or a known everyday name. No partial matches, so a typo can't pick the wrong drug. */
export function findDrug(input: string): Drug | null {
  const q = normalise(input);
  const direct = byName.get(q);
  if (direct !== undefined) return { index: direct, name: DRUGS[direct], label: DRUGS[direct] };
  const alias = ALIASES[q];
  const viaAlias = alias === undefined ? undefined : byName.get(alias.toLowerCase());
  if (viaAlias === undefined) return null;
  const typed = q.charAt(0).toUpperCase() + q.slice(1);
  return { index: viaAlias, name: DRUGS[viaAlias], label: `${typed} (${DRUGS[viaAlias]})` };
}

/** Up to `limit` names that start with, then contain, what was typed (for "did you mean…?"). */
export function suggest(input: string, limit = 4): string[] {
  const q = normalise(input);
  if (q.length < 3) return [];
  const starts = DRUGS.filter((d) => d.toLowerCase().startsWith(q));
  const contains = DRUGS.filter((d) => !d.toLowerCase().startsWith(q) && d.toLowerCase().includes(q));
  return [...starts, ...contains].slice(0, limit);
}

/** The recorded interaction between two drugs, or null if DDInter has none. */
export function interactionBetween(a: Drug, b: Drug): Severity | null {
  return pairs.get(key(a.index, b.index)) ?? null;
}

/** Facts about the data, for checks and the README. */
export const DATA_STATS = { drugs: DRUGS.length, pairs: pairs.size, aliases: Object.keys(ALIASES).length };

// API route: checks drug–drug interactions by querying our Supabase table.
// Notes for teammates:
// - We keep this route small and focused: normalize input, try a couple of schema variants,
//   and return either a matching record or a safe default response.
// - The table/column names can vary across datasets. We therefore support both our legacy
//   schema (drug1/drug2/severity) and the DDInter-like schema (primary_drug_name/secondary_drug_name/interaction_severity).
// - If you extend the schema, add another branch in `findInteractionInTable` (ideally behind
//   an env flag) rather than changing existing behavior.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

// Canonical shape we return to the UI regardless of the underlying table schema.
interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: "Major" | "Moderate" | "Minor" | "None";
  description?: string;
  interaction?: string;
}

// Supabase table in screenshot uses these columns
type DDInterRow = {
  primary_drug_name: string;
  secondary_drug_name: string;
  interaction_severity: string;
  description?: string | null;
  interaction?: string | null;
};

// Normalize user input to improve matching and reduce false negatives
function normalizeDrugName(drug: string): string {
  return drug.toLowerCase().trim();
}

// Map free-form severity text to our narrow union so the UI remains consistent
function normalizeSeverity(sev: string | undefined | null): "Major" | "Moderate" | "Minor" | "None" {
  const s = (sev || "").toLowerCase();
  if (s.includes("major")) return "Major";
  if (s.includes("moderate")) return "Moderate";
  if (s.includes("minor")) return "Minor";
  return "None";
}

export async function POST(request: NextRequest) {
  try {
    // Prefer service role key (if provided) to avoid RLS surprises in server-side reads.
    // Falls back to anon key safely if the service key isn't configured.
    const supabase = getSupabaseServerClient();
    const body = await request.json();
    const { drug1, drug2 } = body;

    if (!drug1 || !drug2) {
      return NextResponse.json(
        { error: "Both drug names are required" },
        { status: 400 }
      );
    }

    const normalizedDrug1 = normalizeDrugName(drug1);
    const normalizedDrug2 = normalizeDrugName(drug2);

    // Helper: attempts reads for both schema variants and both drug orders (A→B and B→A).
    // This keeps the handler tolerant of upstream CSVs/dbs with slightly different naming.
    async function findInteractionInTable(tableName: string) {
      const like1 = `%${normalizedDrug1}%`;
      const like2 = `%${normalizedDrug2}%`;

      let hadError = false;

      // Variant A: legacy columns drug1/drug2/severity (old local schema)
      const firstA = await supabase
        .from(tableName)
        .select("drug1,drug2,severity,description,interaction")
        .ilike("drug1", like1)
        .ilike("drug2", like2)
        .limit(1);

      if (!firstA.error && firstA.data && firstA.data.length > 0) {
        return firstA.data[0] as DrugInteraction;
      }

      // Variant B: DDInter-like columns primary_drug_name/secondary_drug_name/interaction_severity
      const firstB = await supabase
        .from(tableName)
        .select("primary_drug_name,secondary_drug_name,interaction_severity")
        .ilike("primary_drug_name", like1)
        .ilike("secondary_drug_name", like2)
        .limit(1);

      if (!firstB.error && firstB.data && firstB.data.length > 0) {
        const row = firstB.data[0] as Partial<DDInterRow> & {
          primary_drug_name: string;
          secondary_drug_name: string;
          interaction_severity: string;
        };
        const severity = normalizeSeverity(row.interaction_severity);
        return {
          drug1: row.primary_drug_name,
          drug2: row.secondary_drug_name,
          severity,
          description: undefined,
          interaction: undefined,
        } satisfies DrugInteraction;
      }

      // Second order (swapped): we also look for B→A
      const secondA = await supabase
        .from(tableName)
        .select("drug1,drug2,severity,description,interaction")
        .ilike("drug1", like2)
        .ilike("drug2", like1)
        .limit(1);

      if (!secondA.error && secondA.data && secondA.data.length > 0) {
        return secondA.data[0] as DrugInteraction;
      }

      const secondB = await supabase
        .from(tableName)
        .select("primary_drug_name,secondary_drug_name,interaction_severity")
        .ilike("primary_drug_name", like2)
        .ilike("secondary_drug_name", like1)
        .limit(1);

      if (!secondB.error && secondB.data && secondB.data.length > 0) {
        const row = secondB.data[0] as Partial<DDInterRow> & {
          primary_drug_name: string;
          secondary_drug_name: string;
          interaction_severity: string;
        };
        const severity = normalizeSeverity(row.interaction_severity);
        return {
          drug1: row.primary_drug_name,
          drug2: row.secondary_drug_name,
          severity,
          description: undefined,
          interaction: undefined,
        } satisfies DrugInteraction;
      }

      if (firstA.error || firstB.error || secondA.error || secondB.error) {
        hadError = true;
        const errors = [firstA.error, firstB.error, secondA.error, secondB.error]
          .filter(Boolean)
          .map((e) => (e as any).message)
          .join(" | ");
        console.error(`Supabase read errors for table ${tableName}:`, errors);
      }

      return hadError ? null : null;
    }

    // Try common table naming variants. Prefer an explicit env var so different deployments
    // can point at different tables without code changes.
    const tableCandidates = [
      process.env.NEXT_PUBLIC_DRUG_INTERACTIONS_TABLE || "drug_interactions",
      "DrugInteraction",
      "druginteraction",
    ];

    let interaction: DrugInteraction | null = null;
    for (const tableName of tableCandidates) {
      try {
        interaction = await findInteractionInTable(tableName);
        if (interaction) break;
      } catch (e) {
        // If specific table fails due to RLS/policy or missing table, try next candidate
        continue;
      }
    }

    if (interaction) {
      return NextResponse.json({
        drug1: drug1.trim(),
        drug2: drug2.trim(),
        severity: interaction.severity as "Major" | "Moderate" | "Minor" | "None",
        description: interaction.description,
        interaction: interaction.interaction,
      });
    } else {
      // Return "None" severity if no interaction found in database
      return NextResponse.json({
        drug1: drug1.trim(),
        drug2: drug2.trim(),
        severity: "None" as const,
        description: "No known significant interactions found between these medications in our database.",
        interaction: "Based on current medical data, these medications do not have significant documented interactions. However, always consult with your healthcare provider as individual factors may affect medication interactions."
      });
    }
  } catch (error) {
    // Defensive default: never leak internal details to the UI
    console.error("Error checking drug interaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
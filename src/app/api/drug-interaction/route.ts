// API route: checks whether two medicines interact, using the bundled DDInter data (no database).
// Answers one of four ways:
// - an interaction with its severity (Major, Moderate, Minor)
// - "Unknown": DDInter records an interaction but doesn't grade how serious it is
// - "None": both medicines are in the data and no interaction between them is recorded
// - an error naming any medicine we don't have, with suggestions
import { NextRequest, NextResponse } from "next/server";
import { findDrug, interactionBetween, suggest } from "@/lib/interactions";

const DESCRIPTIONS = {
  Major: "A major interaction is recorded between these medicines. The combination may be dangerous.",
  Moderate: "A moderate interaction is recorded between these medicines.",
  Minor: "A minor interaction is recorded between these medicines.",
  Unknown: "An interaction is recorded between these medicines, but its severity hasn't been graded.",
};

function notFound(typed: string) {
  const ideas = suggest(typed);
  const hint = ideas.length ? ` Did you mean ${ideas.join(", ")}?` : " Check the spelling, or try the generic name.";
  return `We don't have "${typed.trim()}" in our data.${hint}`;
}

export async function POST(request: NextRequest) {
  try {
    const { drug1, drug2 } = await request.json();
    if (typeof drug1 !== "string" || typeof drug2 !== "string" || !drug1.trim() || !drug2.trim()) {
      return NextResponse.json({ error: "Both drug names are required" }, { status: 400 });
    }

    const a = findDrug(drug1), b = findDrug(drug2);
    if (!a || !b) {
      const message = [!a && notFound(drug1), !b && notFound(drug2)].filter(Boolean).join(" ");
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (a.index === b.index) {
      return NextResponse.json({ error: "Please enter two different medicines." }, { status: 400 });
    }

    const severity = interactionBetween(a, b);
    if (!severity) {
      return NextResponse.json({
        drug1: a.label,
        drug2: b.label,
        severity: "None" as const,
        description: "No interaction between these two medicines is recorded in DDInter.",
        interaction: "Not being recorded isn't a guarantee they're safe together, so check with a pharmacist or doctor.",
      });
    }
    return NextResponse.json({ drug1: a.label, drug2: b.label, severity, description: DESCRIPTIONS[severity] });
  } catch (error) {
    // Defensive default: never leak internal details to the UI
    console.error("Error checking drug interaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

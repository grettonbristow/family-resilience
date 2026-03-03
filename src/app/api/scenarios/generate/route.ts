import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const GENERATE_PROMPT = `Respond with ONLY a JSON object (no markdown, no code fences) with these fields:
- "name": scenario name
- "description": 1-2 sentence description of the scenario
- "category": one of "power", "weather", "supply_disruption", "medical", "financial", "evacuation", "general"
- "checklistItems": array of objects, each with:
  - "description": what is needed (be specific with quantities where relevant)
  - "itemType": one of "supply", "action", "document", "skill"
  - "supplyCategory": (only if itemType is "supply") one of "food", "water", "medicine", "first_aid", "tools", "fuel", "documents", "communication", "financial", "hygiene", "clothing", "other"
  - "requiredQuantity": (only if itemType is "supply") number needed
  - "requiredUnit": (only if itemType is "supply") the unit (e.g. "gallons", "units", "days", "cans")
  - "sortOrder": number for ordering (0 = most important)

Scale quantities for the given household size. Include a mix of supply, action, document, and skill items. Be practical and specific to UK households where relevant.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioName, description, householdSize = 2 } = body;

    if (!scenarioName?.trim()) {
      return NextResponse.json({ error: "Scenario name is required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Claude API key not configured" }, { status: 500 });
    }

    const anthropic = new Anthropic();

    const prompt = description
      ? `Generate a family preparedness checklist for: "${scenarioName}" — ${description}. Household size: ${householdSize} people.`
      : `Generate a family preparedness checklist for: "${scenarioName}". Household size: ${householdSize} people.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `${prompt}\n\n${GENERATE_PROMPT}`,
      }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    let jsonText = textContent.text.trim();
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonText = fenceMatch[1].trim();
    }

    try {
      const result = JSON.parse(jsonText);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
  } catch (error) {
    console.error("Scenario generation failed:", error);
    const message = error instanceof Error ? error.message : "Scenario generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

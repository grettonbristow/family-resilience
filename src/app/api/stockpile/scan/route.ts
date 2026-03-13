import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SCAN_PROMPT = `Look at this food product image. Extract the following information and respond with ONLY a JSON object (no markdown, no code fences, no explanation):

- "name": the product name (e.g., "Basmati Rice", "Heinz Baked Beans")
- "quantity": numeric amount shown on the packet (weight, volume, or count). Just the number.
- "unit": the unit for the quantity — must be one of: "kg", "g", "liters", "ml", "tins", "packets", "bags", "bottles", "boxes", "jars", "units"
- "caloriesTotal": estimated total calories for the FULL quantity shown. If nutritional info is visible, calculate from it (e.g., if it says 350 cal per 100g and the packet is 500g, return 1750). If not visible, provide a reasonable estimate.
- "expiryDate": best-before or use-by date if visible, in "YYYY-MM-DD" format. If not visible or unclear, use null.

Example response:
{"name":"Tilda Basmati Rice","quantity":5,"unit":"kg","caloriesTotal":17500,"expiryDate":"2027-06-15"}`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, mediaType = "image/jpeg" } = body;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Claude API key not configured" }, { status: 500 });
    }

    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: image,
            },
          },
          {
            type: "text",
            text: SCAN_PROMPT,
          },
        ],
      }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    let jsonText = textContent.text.trim();

    // Strip markdown code fences if present
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonText = fenceMatch[1].trim();
    }

    // Extract JSON if there's surrounding text
    if (!jsonText.startsWith("{")) {
      const jsonStart = jsonText.indexOf("{");
      if (jsonStart !== -1) jsonText = jsonText.substring(jsonStart);
    }
    if (!jsonText.endsWith("}")) {
      const jsonEnd = jsonText.lastIndexOf("}");
      if (jsonEnd !== -1) jsonText = jsonText.substring(0, jsonEnd + 1);
    }

    try {
      const result = JSON.parse(jsonText);
      return NextResponse.json(result);
    } catch {
      console.error("Failed to parse scan JSON:", jsonText.substring(0, 200));
      return NextResponse.json({ error: "Could not recognise this item. Please try a clearer photo or enter details manually." }, { status: 422 });
    }
  } catch (error) {
    console.error("Scan failed:", error);
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

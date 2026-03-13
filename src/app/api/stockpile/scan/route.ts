import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUserId } from "@/lib/auth-utils";

const PRODUCT_PROMPT = `Look at this food product photo. I need you to identify the product from the front label, packaging, or any visible text.

Extract the following and respond with ONLY a JSON object (no markdown, no code fences, no explanation):

- "name": the product name (e.g., "Tilda Basmati Rice", "Heinz Baked Beans")
- "quantity": numeric amount if visible on the front (weight, volume, or count). Just the number. If not visible, use null.
- "unit": the unit for the quantity — must be one of: "kg", "g", "liters", "ml", "tins", "packets", "bags", "bottles", "boxes", "jars", "units". If quantity is null, use null.
- "caloriesTotal": estimated total calories based on product type and likely size. This is a rough estimate only. If not possible to estimate, use null.
- "expiryDate": best-before or use-by date if visible, in "YYYY-MM-DD" format. If not visible, use null.

Example response:
{"name":"Tilda Basmati Rice","quantity":5,"unit":"kg","caloriesTotal":17500,"expiryDate":null}`;

const NUTRITION_PROMPT = `Look at this photo of a food product's nutrition label or back-of-packet information. Extract the weight/quantity and calorie information.

Respond with ONLY a JSON object (no markdown, no code fences, no explanation):

- "quantity": the total net weight, volume, or count shown on the packet. Just the number.
- "unit": the unit — must be one of: "kg", "g", "liters", "ml", "tins", "packets", "bags", "bottles", "boxes", "jars", "units"
- "caloriesTotal": total calories for the FULL packet. Calculate from the nutritional panel (e.g., if it says 350 kcal per 100g and the packet is 500g, return 1750). If the panel shows "per serving", multiply by the number of servings if shown.

Example response:
{"quantity":500,"unit":"g","caloriesTotal":1750}`;

const EXPIRY_PROMPT = `Look at this photo of a food product's expiry or best-before date. Extract the date and respond with ONLY a JSON object:

- "expiryDate": the date in "YYYY-MM-DD" format. If the date only shows month and year (e.g., "06/2027"), use the last day of that month (e.g., "2027-06-30"). If unclear or not visible, use null.

Example response:
{"expiryDate":"2027-06-30"}`;

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

function buildImageContent(image: string, mediaType: string) {
  return {
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: mediaType as ImageMediaType,
      data: image,
    },
  };
}

function extractJson(text: string): Record<string, unknown> {
  let jsonText = text.trim();

  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonText = fenceMatch[1].trim();
  }

  if (!jsonText.startsWith("{")) {
    const jsonStart = jsonText.indexOf("{");
    if (jsonStart !== -1) jsonText = jsonText.substring(jsonStart);
  }
  if (!jsonText.endsWith("}")) {
    const jsonEnd = jsonText.lastIndexOf("}");
    if (jsonEnd !== -1) jsonText = jsonText.substring(0, jsonEnd + 1);
  }

  return JSON.parse(jsonText);
}

export async function POST(request: Request) {
  try {
    await requireUserId();
    const body = await request.json();
    const { image, mediaType = "image/jpeg", scanType = "product" } = body;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Claude API key not configured" }, { status: 500 });
    }

    const anthropic = new Anthropic();
    const prompts: Record<string, string> = {
      product: PRODUCT_PROMPT,
      nutrition: NUTRITION_PROMPT,
      expiry: EXPIRY_PROMPT,
    };
    const prompt = prompts[scanType] || PRODUCT_PROMPT;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          buildImageContent(image, mediaType),
          { type: "text", text: prompt },
        ],
      }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    try {
      const result = extractJson(textContent.text);
      return NextResponse.json(result);
    } catch {
      console.error("Failed to parse scan JSON:", textContent.text.substring(0, 200));
      const errorMessages: Record<string, string> = {
        expiry: "Could not read the expiry date. Try a clearer photo.",
        nutrition: "Could not read the nutrition label. Try a clearer photo.",
        product: "Could not recognise this item. Try photographing the front label.",
      };
      return NextResponse.json({
        error: errorMessages[scanType] || errorMessages.product,
      }, { status: 422 });
    }
  } catch (error) {
    console.error("Scan failed:", error);
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

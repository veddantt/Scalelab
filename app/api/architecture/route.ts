import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { problem, messages } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `
Generate a system design architecture based on:

Problem: ${problem}

Candidate answers:
${messages && messages.length > 0
        ? messages.map((m: any) => `${m.role}: ${m.content}`).join("\n")
        : "No answers yet — generate a standard architecture."}

Use candidate choices when possible (e.g. their chosen database, services, API style).

Return ONLY valid JSON in this exact shape:
{
  "nodes": [
    {
      "id": "1",
      "position": { "x": 0, "y": 100 },
      "data": { "label": "Client App" }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "1",
      "target": "2",
      "label": "HTTP"
    }
  ]
}

Rules:
- 8 to 12 nodes
- Include client, API gateway, services, database, cache, queue where relevant
- Reflect candidate's specific technology choices (e.g. PostgreSQL, Kafka, Redis) if mentioned
- Use clear system-design component names
- Position nodes left to right
- JSON only, no markdown
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const raw = response.text || "";

    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return Response.json(parsed);
  } catch (error: any) {
    console.error("Architecture API error:", error);

    return Response.json(
      { error: error?.message || "Architecture generation failed" },
      { status: 500 }
    );
  }
}

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

        const prompt = `You are an expert FAANG system design interviewer providing a final evaluation.

Problem: ${problem}

Candidate Transcript:
${messages && messages.length > 0
            ? messages.map((m: any) => `${m.role}: ${m.content}`).join("\n")
            : "No answers provided."}

Return a detailed final review.
Return ONLY valid JSON in this exact shape:
{
  "finalScore": 85,
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "architectureSummary": "1-2 paragraph summary of the architecture they chose.",
  "componentExplanations": [
    { "component": "API Gateway", "reasoning": "string" }
  ],
  "recommendedImprovements": ["string", "string"]
}

Rules:
- Be highly analytical and constructive.
- No markdown formatting outside of the JSON structure.
- finalScore should be an integer out of 100.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const cleaned = (response.text || "")
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        return Response.json(JSON.parse(cleaned));
    } catch (error: any) {
        console.error("Review API error:", error);

        return Response.json(
            { error: error?.message || "Failed to generate final review" },
            { status: 500 }
        );
    }
}

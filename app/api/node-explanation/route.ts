import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    try {
        const { problem, nodeLabel } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return Response.json(
                { error: "Missing GEMINI_API_KEY" },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const prompt = `You are a senior system design interviewer.

Problem: ${problem}
Selected component: ${nodeLabel}

Return ONLY valid JSON:
{
  "purpose": "1-2 sentence purpose",
  "whyItMatters": "1-2 sentence explanation",
  "interviewTalkingPoint": "1-2 sentence interview advice",
  "scalingRisk": "1-2 sentence risk"
}

Be concise and practical.
No markdown.`;

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
        console.error("Node explanation error:", error);

        return Response.json(
            { error: error?.message || "Failed to generate explanation" },
            { status: 500 }
        );
    }
}

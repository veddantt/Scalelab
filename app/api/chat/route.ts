import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    try {
        const { messages, problem, step } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return Response.json(
                { error: "Missing GEMINI_API_KEY in .env.local" },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const prompt = `
You are a strict FAANG system design interviewer.

Problem: ${problem}

Current step: ${step}

Step meaning (internal only):
0 = Functional Requirements
1 = Scale
2 = APIs
3 = Database
4 = Architecture
5 = Bottlenecks
6 = Review

CRITICAL RULES:
- Ask ONLY ONE question
- MAX 12 words
- NO explanations
- NO teaching
- NO paragraphs
- NEVER mention steps or numbers
- NEVER say "we are on step X"
- Be sharp and interview-like

Behavior:
- If answer is vague → ask sharper question
- If answer is good → move forward

Conversation:
${messages.map((m: any) => `${m.role}: ${m.content}`).join("\n")}
Return ONLY valid JSON. No markdown. No plain text.
{
  "reply": "string",
  "shouldAdvance": boolean,
  "nextStep": number,
  "scores": { "clarity": number, "depth": number, "correctness": number }
}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        const rawText = response.text || "";

        let parsed;

        try {
            const cleaned = rawText
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            parsed = JSON.parse(cleaned);
        } catch {
            parsed = {
                reply: rawText || "What are the core functional requirements?",
                shouldAdvance: false,
                nextStep: step,
                scores: {
                    clarity: 5,
                    depth: 5,
                    correctness: 5,
                },
            };
        }

        return Response.json(parsed);
    } catch (error: any) {
        console.error("Chat API error:", error);

        return Response.json(
            { error: error?.message || "AI request failed." },
            { status: 500 }
        );
    }
}
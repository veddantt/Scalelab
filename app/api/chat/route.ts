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
`;


        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const rawText = response.text || "";

        const cleaned = rawText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        return Response.json(parsed);
    } catch (error: any) {
        console.error("Chat API error:", error);

        return Response.json(
            { error: error?.message || "AI request failed." },
            { status: 500 }
        );
    }
}
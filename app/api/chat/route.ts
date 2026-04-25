export async function POST(req: Request) {
    try {
        const { messages, problem, step } = await req.json();
        if (!process.env.OPENROUTER_API_KEY) {
            console.warn("Missing OPENROUTER_API_KEY, using fallback");
            return Response.json({
                reply: "What are the core functional requirements?",
                shouldAdvance: false,
                nextStep: step,
                scores: {
                    clarity: 5,
                    depth: 5,
                    correctness: 5,
                },
            });
        }
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
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "ScaleLab",
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: prompt
                    }
                ],
            }),
        });
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error("No content in OpenRouter response");
        }
        let parsed;
        try {
            const cleaned = content
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();
            parsed = JSON.parse(cleaned);
        } catch {
            parsed = {
                reply: content || "What are the core functional requirements?",
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
        return Response.json({
            reply: "What are the core functional requirements?",
            shouldAdvance: false,
            nextStep: 0,
            scores: {
                clarity: 5,
                depth: 5,
                correctness: 5,
            },
        });
    }
}
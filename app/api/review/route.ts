export async function POST(req: Request) {
    try {
        const { problem, messages } = await req.json();

        if (!process.env.OPENROUTER_API_KEY) {
            console.warn("Missing OPENROUTER_API_KEY, using fallback");
            return Response.json({
                finalScore: 70,
                strengths: ["Good understanding of basic concepts", "Clear communication"],
                weaknesses: ["Lacked depth in scaling", "Missed some failure scenarios"],
                architectureSummary: "A standard architecture was proposed, but it needs more thought on high availability.",
                componentExplanations: [
                    { component: "API Gateway", reasoning: "Used for routing but didn't mention rate limiting." }
                ],
                recommendedImprovements: ["Study distributed caching", "Consider database replication"]
            });
        }

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

        const cleaned = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        return Response.json(JSON.parse(cleaned));
    } catch (error: any) {
        console.error("Review API error:", error);

        return Response.json(
            {
                finalScore: 70,
                strengths: ["Good understanding of basic concepts", "Clear communication"],
                weaknesses: ["Lacked depth in scaling", "Missed some failure scenarios"],
                architectureSummary: "A standard architecture was proposed, but it needs more thought on high availability.",
                componentExplanations: [
                    { component: "API Gateway", reasoning: "Used for routing but didn't mention rate limiting." }
                ],
                recommendedImprovements: ["Study distributed caching", "Consider database replication"]
            }
        );
    }
}

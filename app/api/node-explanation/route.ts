const MOCK_FALLBACK = {
    title: "Component",
    role: "Core architectural component",
    responsibilities: [
        "Handles specific domain logic",
        "Processes incoming requests or data"
    ],
    scalingNotes: [
        "Can be scaled horizontally",
        "Consider caching frequently accessed data"
    ],
    failureRisks: [
        "Single point of failure if not deployed redundantly",
        "Network latency under high load"
    ]
};

export async function POST(req: Request) {
    try {
        const { problem, nodeLabel } = await req.json();

        if (!process.env.OPENROUTER_API_KEY) {
            console.warn("Missing OPENROUTER_API_KEY, using fallback");
            return Response.json(MOCK_FALLBACK);
        }

        const prompt = `You are a senior system design interviewer.

Problem: ${problem}
Selected component: ${nodeLabel}

Return ONLY valid JSON:
{
  "title": "string",
  "role": "string",
  "responsibilities": ["string"],
  "scalingNotes": ["string"],
  "failureRisks": ["string"]
}

Be concise and practical. No markdown.`;

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
            console.error("No content in OpenRouter response:", data);
            return Response.json(MOCK_FALLBACK);
        }

        let parsed;
        try {
            const cleaned = content
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();
            parsed = JSON.parse(cleaned);
        } catch {
            console.error("JSON parse failed, using fallback. Raw:", content.slice(0, 200));
            return Response.json(MOCK_FALLBACK);
        }

        return Response.json(parsed);
    } catch (error: any) {
        console.error("Node explanation error:", error);
        return Response.json(MOCK_FALLBACK);
    }
}

// server/ai/review.ts
// Server-only module for generating the final interview review.

import type { ReviewScore } from "@/lib/types";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";

export interface ReviewAIRequest {
  problem: string;
  messages: { role: string; content: string }[];
}

const FALLBACK_REVIEW: ReviewScore = {
  finalScore: 70,
  strengths: ["Good understanding of basic concepts", "Clear communication"],
  weaknesses: ["Lacked depth in scaling", "Missed some failure scenarios"],
  architectureSummary:
    "A standard architecture was proposed, but it needs more thought on high availability.",
  componentExplanations: [
    {
      component: "API Gateway",
      reasoning: "Used for routing but didn't mention rate limiting.",
    },
  ],
  recommendedImprovements: [
    "Study distributed caching",
    "Consider database replication",
  ],
};

function tryParse(raw: string): ReviewScore | null {
  try {
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function generateReview(
  req: ReviewAIRequest
): Promise<ReviewScore> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("[review] Missing OPENROUTER_API_KEY — returning fallback");
    return FALLBACK_REVIEW;
  }

  const transcript =
    req.messages?.length > 0
      ? req.messages.map((m) => `${m.role}: ${m.content}`).join("\n")
      : "No answers provided.";

  const prompt = `You are an expert FAANG system design interviewer providing a final evaluation.

Problem: ${req.problem}

Candidate Transcript:
${transcript}

Return a detailed final review as ONLY valid JSON in this exact shape:
{
  "finalScore": 85,
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "architectureSummary": "1-2 paragraph summary",
  "componentExplanations": [
    { "component": "API Gateway", "reasoning": "string" }
  ],
  "recommendedImprovements": ["string", "string"]
}

Rules:
- Be highly analytical and constructive.
- finalScore is an integer out of 100.
- No markdown outside the JSON structure.`;

  try {
    const res = await fetch(OPENROUTER_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ScaleLab",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: prompt }],
      }),
    });

    const data = await res.json();
    const content: string | undefined = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in response");

    const parsed = tryParse(content);
    if (!parsed) throw new Error("Invalid JSON in response");

    return parsed;
  } catch (err) {
    console.error("[review] Error:", err);
    return FALLBACK_REVIEW;
  }
}

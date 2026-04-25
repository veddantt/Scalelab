// server/ai/nodeExplanation.ts
// Server-only module for explaining individual architecture nodes.

import type { NodeExplanation } from "@/lib/types";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";

export interface NodeExplanationRequest {
  problem: string;
  nodeLabel: string;
}

const FALLBACK_EXPLANATION: NodeExplanation = {
  title: "Component",
  role: "Core architectural component",
  responsibilities: [
    "Handles specific domain logic",
    "Processes incoming requests or data",
  ],
  scalingNotes: [
    "Can be scaled horizontally",
    "Consider caching frequently accessed data",
  ],
  failureRisks: [
    "Single point of failure if not deployed redundantly",
    "Network latency under high load",
  ],
};

function tryParse(raw: string): NodeExplanation | null {
  try {
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function explainNode(
  req: NodeExplanationRequest
): Promise<NodeExplanation> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("[nodeExplanation] Missing OPENROUTER_API_KEY — returning fallback");
    return FALLBACK_EXPLANATION;
  }

  const prompt = `You are a senior system design interviewer.

Problem: ${req.problem}
Selected component: ${req.nodeLabel}

Return ONLY valid JSON:
{
  "title": "string",
  "role": "string",
  "responsibilities": ["string"],
  "scalingNotes": ["string"],
  "failureRisks": ["string"]
}

Be concise and practical. No markdown.`;

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
    console.error("[nodeExplanation] Error:", err);
    return FALLBACK_EXPLANATION;
  }
}

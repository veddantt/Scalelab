// server/ai/chat.ts
// All OpenRouter calls for the live interview chat.
// This module is server-only — never imported by client components.

import type { InterviewMessage, InterviewScores } from "@/lib/types";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";

export interface ChatAIRequest {
  messages: InterviewMessage[];
  problem: string;
  step: number;
}

export interface ChatAIResponse {
  reply: string;
  feedback: string;
  scores: InterviewScores;
  shouldAdvance: boolean;
  reason: string;
  followUp?: string;
}

function buildSystemPrompt(problem: string, step: number): string {
  return `You are a senior FAANG system design interviewer conducting a mock interview.

Problem: ${problem}
Current step index: ${step} (0=Requirements, 1=Scale, 2=APIs, 3=Database, 4=Architecture, 5=Bottlenecks, 6=Review)

Your role:
- Ask ONE focused question at a time about the current step.
- Be concise (1–3 sentences).
- Challenge weak or vague answers with a follow-up.
- Only advance when the candidate gives a sufficiently complete answer.

Return ONLY valid JSON (no markdown):
{
  "reply": "Your next question or follow-up to the candidate",
  "feedback": "Brief coaching note on their last answer (1 sentence)",
  "scores": {
    "clarity": <1-10>,
    "depth": <1-10>,
    "correctness": <1-10>
  },
  "shouldAdvance": <true|false>,
  "reason": "Why you are or are not advancing",
  "followUp": "Optional deeper follow-up question"
}`;
}

function clampScores(scores: InterviewScores): InterviewScores {
  const clamp = (n: number) => Math.min(10, Math.max(1, Math.round(n)));
  return {
    clarity: clamp(scores.clarity),
    depth: clamp(scores.depth),
    correctness: clamp(scores.correctness),
  };
}

function tryParseJSON(raw: string): ChatAIResponse | null {
  try {
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

const FALLBACK_RESPONSE: ChatAIResponse = {
  reply:
    "That's a good start. Could you go deeper on the specific components you'd choose and why?",
  feedback: "Answer received — continue elaborating.",
  scores: { clarity: 5, depth: 5, correctness: 5 },
  shouldAdvance: false,
  reason: "Fallback response due to API error.",
};

export async function runChatTurn(req: ChatAIRequest): Promise<ChatAIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("[chat] Missing OPENROUTER_API_KEY — returning fallback");
    return FALLBACK_RESPONSE;
  }

  const systemPrompt = buildSystemPrompt(req.problem, req.step);

  // Keep last 10 messages to avoid token bloat
  const trimmed = req.messages.slice(-10);

  const openRouterMessages = [
    { role: "system", content: systemPrompt },
    ...trimmed.map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content,
    })),
  ];

  async function callAPI(): Promise<string | null> {
    const res = await fetch(OPENROUTER_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ScaleLab",
      },
      body: JSON.stringify({ model: MODEL, messages: openRouterMessages }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  }

  // First attempt
  let content = await callAPI();
  let parsed = content ? tryParseJSON(content) : null;

  // Retry once with stricter prompt if JSON parse fails
  if (!parsed && content) {
    console.warn("[chat] JSON parse failed, retrying with strict prompt");
    openRouterMessages.push({
      role: "user",
      content:
        "Return ONLY the JSON object. No explanation. No markdown. No prose.",
    });
    content = await callAPI();
    parsed = content ? tryParseJSON(content) : null;
  }

  if (!parsed) {
    console.error("[chat] All attempts failed, returning fallback");
    return FALLBACK_RESPONSE;
  }

  // Ensure required fields
  return {
    reply: parsed.reply || FALLBACK_RESPONSE.reply,
    feedback: parsed.feedback || "",
    scores: clampScores(parsed.scores || { clarity: 5, depth: 5, correctness: 5 }),
    shouldAdvance: Boolean(parsed.shouldAdvance),
    reason: parsed.reason || "",
    followUp: parsed.followUp,
  };
}

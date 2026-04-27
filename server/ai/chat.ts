// server/ai/chat.ts
// Server-only AI service for ScaleLab interview chat.

import type { InterviewMessage, InterviewScores } from "@/lib/types";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";

export interface ChatAIRequest {
  messages: InterviewMessage[];
  problem: string;
  step: number;
  practiceMode?: boolean;
  weakestAreas?: string[];
}

export interface ChatAIResponse {
  reply: string;
  feedback: string;
  scores: InterviewScores;
  shouldAdvance: boolean;
  reason: string;
  followUp?: string;
}

function buildSystemPrompt(
  problem: string,
  step: number,
  practiceMode?: boolean,
  weakestAreas?: string[]
): string {
  const toneInstruction = practiceMode
    ? "You are a supportive system design coach helping the user improve through practice."
    : "You are a senior FAANG system design interviewer conducting a realistic mock interview.";

  const weaknessContext =
    practiceMode && weakestAreas?.length
      ? `\nThe user previously struggled with: ${weakestAreas.join(", ")}. Probe those areas when relevant.`
      : "";

  return `${toneInstruction}

Problem: ${problem}
Current step index: ${step}
Step mapping:
0=Requirements
1=Scale
2=APIs
3=Database
4=Architecture
5=Bottlenecks
6=Review
${weaknessContext}

Rules:
- Ask exactly ONE focused question.
- Keep the reply concise.
- Challenge vague answers.
- Advance only when the answer is sufficiently complete.
- Scores must reflect the user's latest answer.

Return ONLY valid JSON:
{
  "reply": "next question or follow-up",
  "feedback": "brief feedback on the user's last answer",
  "scores": {
    "clarity": 1,
    "depth": 1,
    "correctness": 1
  },
  "shouldAdvance": false,
  "reason": "why the user should or should not advance",
  "followUp": "optional deeper follow-up"
}`;
}

function clampScores(scores: InterviewScores): InterviewScores {
  const clamp = (n: number) => Math.min(10, Math.max(1, Math.round(Number(n))));
  return {
    clarity: clamp(scores.clarity),
    depth: clamp(scores.depth),
    correctness: clamp(scores.correctness),
  };
}

function parseAIResponse(raw: string): ChatAIResponse {
  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  if (!parsed.reply || !parsed.scores) {
    throw new Error("Invalid AI response shape");
  }

  return {
    reply: String(parsed.reply),
    feedback: String(parsed.feedback ?? ""),
    scores: clampScores(parsed.scores),
    shouldAdvance: Boolean(parsed.shouldAdvance),
    reason: String(parsed.reason ?? ""),
    followUp: parsed.followUp ? String(parsed.followUp) : undefined,
  };
}

export async function runChatTurn(req: ChatAIRequest): Promise<ChatAIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  if (!req.problem || typeof req.step !== "number") {
    throw new Error("Invalid chat request");
  }

  const systemPrompt = buildSystemPrompt(
    req.problem,
    req.step,
    req.practiceMode,
    req.weakestAreas
  );

  const trimmedMessages = req.messages.slice(-10);

  const openRouterMessages = [
    { role: "system", content: systemPrompt },
    ...trimmedMessages.map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content,
    })),
  ];

  async function callOpenRouter(messages: typeof openRouterMessages): Promise<string> {
    const res = await fetch(OPENROUTER_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://scalelab-ai.vercel.app",
        "X-Title": "ScaleLab",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter request failed: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenRouter returned empty response");
    }

    return content;
  }

  try {
    const content = await callOpenRouter(openRouterMessages);
    return parseAIResponse(content);
  } catch (firstError) {
    console.warn("[chat] First AI parse/call failed, retrying once", firstError);

    const retryMessages = [
      ...openRouterMessages,
      {
        role: "user",
        content: "Return only a valid JSON object matching the required schema. No markdown.",
      },
    ];

    const retryContent = await callOpenRouter(retryMessages);
    return parseAIResponse(retryContent);
  }
}
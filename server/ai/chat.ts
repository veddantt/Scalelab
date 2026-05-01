// server/ai/chat.ts
// Server-only AI service for ScaleLab interview chat.

import type { InterviewMessage, InterviewScores } from "@/lib/types";
import { getProblemMeta } from "@/lib/problems";
import { extractJSON } from "@/lib/ai";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";

export interface ChatAIRequest {
  messages: InterviewMessage[];
  problem: string;
  /** Problem id — used to enrich prompts with structured context */
  problemId?: string;
  step: number;
  practiceMode?: boolean;
  weakestAreas?: string[];
  isInitialQuestion?: boolean;
}

export interface ChatAIResponse {
  reply: string;
  feedback: string;
  scores: InterviewScores;
  shouldAdvance: boolean;
  reason: string;
  followUp?: string;
}

/** Build structured context block for problems that have rich metadata */
function buildProblemContext(problemId?: string): string {
  if (!problemId) return "";
  const meta = getProblemMeta(problemId);
  if (!meta) return "";

  const lines: string[] = [
    `\nProblem context for "${meta.problem.title}":`,
    `Requirements: ${meta.requirements.join("; ")}`,
    `Practice focus areas: ${meta.practiceSkills.join(", ")}`,
  ];
  return lines.join("\n");
}

function buildSystemPrompt(
  problem: string,
  problemId: string | undefined,
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

  const problemContext = buildProblemContext(problemId);

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
${problemContext}${weaknessContext}

Rules:
- Ask exactly ONE question only.
- CONSTRAINTS: Your question MUST BE 12 WORDS OR LESS. This is non-negotiable.
- No explanations, no teaching, no hints, no step mention.
- If answer is weak or vague, ask a sharper follow-up and do not advance.
- If answer is strong, advance to next step.
- Score latest user answer only.

Scoring rules:
- Clarity: structure and specificity (0-10).
- Depth: tradeoffs, scaling, constraints (0-10).
- Correctness: technical validity (0-10).
- Multi-Metric Engine: Use specific rubric. Mentioning CDN or caching increases depth. Tradeoffs increase depth. Clear sequencing increases clarity. Incorrect concepts lower correctness.

Return ONLY valid JSON:
{
  "reply": "next question or sharper follow-up (<= 12 words)",
  "feedback": "one sentence: good + improve",
  "scores": {
    "clarity": 0,
    "depth": 0,
    "correctness": 0
  },
  "shouldAdvance": false,
  "reason": "why the user should or should not advance",
  "followUp": "optional deeper follow-up"
}`;
}

function buildInitialPrompt(problem: string, problemId?: string): string {
  const problemContext = buildProblemContext(problemId);

  return `You are a senior FAANG system design interviewer starting a mock interview.

Problem: ${problem}
${problemContext}

Your task: ask the first requirements question.

Rules:
- Ask exactly ONE question.
- Max 12 words.
- No intro, no explanation, no hints.

Return ONLY valid JSON:
{
  "reply": "first question",
  "feedback": "",
  "scores": { "clarity": 0, "depth": 0, "correctness": 0 },
  "shouldAdvance": false,
  "reason": "initial question",
  "followUp": null
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
  const parsed: any = extractJSON(raw);

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

  async function callOpenRouter(messages: { role: string; content: string }[]): Promise<string> {
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

  // Build the message array for OpenRouter
  let openRouterMessages: { role: string; content: string }[];

  if (req.isInitialQuestion) {
    // For the initial question, use a dedicated prompt
    // We add a user message to trigger the response for providers that require it
    openRouterMessages = [
      { role: "system", content: buildInitialPrompt(req.problem, req.problemId) },
      { role: "user", content: "Start the interview." }
    ];
  } else {
    const systemPrompt = buildSystemPrompt(
      req.problem,
      req.problemId,
      req.step,
      req.practiceMode,
      req.weakestAreas
    );
    const trimmedMessages = req.messages.slice(-10);
    openRouterMessages = [
      { role: "system", content: systemPrompt },
      ...trimmedMessages.map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      })),
    ];
  }

  try {
    console.log(`[chat] Requesting AI turn for problem: ${req.problem}, step: ${req.step}`);
    const content = await callOpenRouter(openRouterMessages);
    console.log(`[chat] AI raw response: ${content.substring(0, 100)}...`);
    const parsed = parseAIResponse(content);
    console.log(`[chat] AI response parsed successfully. Advance: ${parsed.shouldAdvance}`);
    return parsed;
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
// Helper: clamp a value between min and max
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, typeof v === "number" && !isNaN(v) ? v : min));
}

const STEP_NAMES = [
  "Requirements",
  "Scale",
  "APIs",
  "Database",
  "Architecture",
  "Bottlenecks",
  "Review",
];

function buildSystemPrompt(problem: string, step: number): string {
  const stepName = STEP_NAMES[step] ?? "Requirements";
  return `You are a senior system design interviewer conducting a structured mock interview at a FAANG-level company.

Problem being discussed: "${problem}"
Current interview step (${step}): ${stepName}

Your behavior:
- Ask exactly ONE focused question per turn. Never ask multiple questions.
- Be concise: 1 to 3 sentences maximum.
- If the candidate's answer is vague or incomplete, challenge it with a pointed follow-up. Do not simply accept it.
- If the answer is strong and covers the key points for step ${step} (${stepName}), set shouldAdvance to true.
- Never reveal the full solution. Guide with questions, not explanations.
- Stay strictly on the current step topic (${stepName}). Do not jump ahead.
- Do not say "great answer!" or give empty praise. Be direct.

Step context:
0 = Requirements → ask about functional requirements, users, core actions, constraints
1 = Scale → ask about DAU, QPS, read/write ratio, storage needs
2 = APIs → ask about core REST endpoints, request/response shapes
3 = Database → ask about data model, SQL vs NoSQL choice, indexing strategy
4 = Architecture → ask about component diagram: client, gateway, services, storage
5 = Bottlenecks → ask about failure points, hot spots, and mitigation strategies
6 = Review → ask the candidate to summarize tradeoffs and defend their decisions

Return ONLY valid JSON. No markdown. No text outside the JSON object.
{
  "reply": "string — your next interviewer question or challenge (1-3 sentences)",
  "feedback": "string — internal evaluation of the candidate's last answer (1-2 sentences, not shown as a chat bubble)",
  "scores": {
    "clarity": <integer 1-10>,
    "depth": <integer 1-10>,
    "correctness": <integer 1-10>
  },
  "shouldAdvance": <boolean — true only if the candidate sufficiently covered step ${step}>,
  "reason": "string — brief internal reason for shouldAdvance decision",
  "followUp": "string or null — optional sharpening question if answer was weak"
}`;
}

const SAFE_FALLBACK = (step: number) => ({
  reply: "Can you walk me through your thinking on that?",
  feedback: "Unable to evaluate — model response was malformed.",
  scores: { clarity: 5, depth: 5, correctness: 5 },
  shouldAdvance: false,
  reason: "Fallback triggered due to parse error.",
  followUp: null,
  nextStep: step,
});

async function callOpenRouter(
  systemPrompt: string,
  userMessages: { role: string; content: string }[]
): Promise<string | null> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "ScaleLab",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        ...userMessages,
      ],
    }),
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
}

function parseContent(raw: string): Record<string, unknown> | null {
  try {
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function safeParsed(parsed: Record<string, unknown>, step: number) {
  const scores = (parsed.scores as Record<string, unknown>) ?? {};
  return {
    reply:
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : "Can you elaborate on that?",
    feedback:
      typeof parsed.feedback === "string" ? parsed.feedback : "",
    scores: {
      clarity: clamp(Number(scores.clarity), 1, 10),
      depth: clamp(Number(scores.depth), 1, 10),
      correctness: clamp(Number(scores.correctness), 1, 10),
    },
    shouldAdvance: parsed.shouldAdvance === true,
    reason: typeof parsed.reason === "string" ? parsed.reason : "",
    followUp: typeof parsed.followUp === "string" ? parsed.followUp : null,
    nextStep: parsed.shouldAdvance === true ? step + 1 : step,
  };
}

export async function POST(req: Request) {
  try {
    const { messages, problem, step } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("Missing OPENROUTER_API_KEY, using fallback");
      return Response.json({
        ...SAFE_FALLBACK(step ?? 0),
        reply: "What are the core functional requirements of this system?",
      });
    }

    const stepIndex = typeof step === "number" ? step : 0;
    const systemPrompt = buildSystemPrompt(String(problem ?? "Unknown problem"), stepIndex);

    // Limit conversation history to last 10 messages
    const trimmedMessages = Array.isArray(messages)
      ? messages.slice(-10).map((m: { role: string; content: string }) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: String(m.content),
        }))
      : [];

    // First attempt
    const content = await callOpenRouter(systemPrompt, trimmedMessages);

    if (!content) {
      console.error("No content from OpenRouter on first attempt.");
      return Response.json(SAFE_FALLBACK(stepIndex));
    }

    let parsed = parseContent(content);

    // Retry once with a stricter prompt if parse fails
    if (!parsed) {
      console.warn("JSON parse failed on first attempt, retrying...");
      const retryPrompt =
        systemPrompt +
        "\n\nCRITICAL: Your previous response was not valid JSON. Return ONLY the JSON object. No markdown. No text outside the JSON.";
      const retryContent = await callOpenRouter(retryPrompt, trimmedMessages);
      if (retryContent) {
        parsed = parseContent(retryContent);
      }
    }

    if (!parsed) {
      console.error("JSON parse failed after retry. Using safe fallback.");
      return Response.json(SAFE_FALLBACK(stepIndex));
    }

    return Response.json(safeParsed(parsed, stepIndex));
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    return Response.json(SAFE_FALLBACK(0));
  }
}
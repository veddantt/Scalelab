// server/ai/architecture.ts
// Server-only module for generating system architecture via OpenRouter.

import type {
  ArchitectureNode,
  ArchitectureEdge,
  ArchitectureInsights,
} from "@/lib/types";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";

export interface ArchitectureAIRequest {
  problem: string;
  messages: { role: string; content: string }[];
  architectureStyle?: string;
}

export interface ArchitectureAIResponse extends ArchitectureInsights {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

// ─── Fallback used when AI is unavailable or returns invalid JSON ────────────
export const ARCHITECTURE_FALLBACK: ArchitectureAIResponse = {
  summary:
    "A standard 3-tier architecture with an API gateway, application services, a relational database, a caching layer, and an asynchronous message queue for background processing.",
  score: 72,
  nodes: [
    { id: "1", label: "Web / Mobile Client", type: "client", description: "User-facing SPA or native app that sends requests via HTTPS." },
    { id: "2", label: "CDN (CloudFront)", type: "external", description: "Serves static assets and caches responses at edge locations worldwide." },
    { id: "3", label: "API Gateway", type: "gateway", description: "Handles routing, rate limiting, authentication, and request validation." },
    { id: "4", label: "Application Service", type: "service", description: "Core business logic service handling CRUD operations and domain rules." },
    { id: "5", label: "PostgreSQL", type: "database", description: "Primary relational database for structured data with ACID transactions." },
    { id: "6", label: "Redis Cache", type: "cache", description: "In-memory cache for hot data, session tokens, and rate limit counters." },
    { id: "7", label: "Kafka Message Queue", type: "queue", description: "Durable message broker for decoupling services and handling async events." },
    { id: "8", label: "Background Worker", type: "worker", description: "Consumes messages from the queue for email, analytics, and batch jobs." },
  ],
  edges: [
    { source: "1", target: "2", label: "Static asset request" },
    { source: "1", target: "3", label: "HTTPS API call" },
    { source: "3", target: "4", label: "Route & forward" },
    { source: "4", target: "5", label: "SQL read/write" },
    { source: "4", target: "6", label: "Cache lookup / set" },
    { source: "4", target: "7", label: "Publish async event" },
    { source: "7", target: "8", label: "Consume job" },
  ],
  bottlenecks: [
    "Single PostgreSQL instance becomes a write bottleneck under high traffic.",
    "Cache invalidation lag can serve stale data for up to several seconds.",
  ],
  tradeoffs: [
    "Chose PostgreSQL over NoSQL for strong consistency, sacrificing horizontal write scalability.",
    "Added Redis for speed but introduced cache-invalidation complexity.",
  ],
  scalingRecommendations: [
    "Add read replicas to PostgreSQL and route read queries to them.",
    "Partition the Kafka topic by entity ID for parallel consumer processing.",
    "Deploy the Application Service behind a load balancer with auto-scaling.",
  ],
  isFallback: true,
};

function buildPrompts(req: ArchitectureAIRequest): {
  system: string;
  user: string;
} {
  const styleInstruction = req.architectureStyle
    ? `The candidate chose "${req.architectureStyle}" style. Tailor accordingly:\n- "high-level": Conceptual, 6-8 nodes.\n- "scalable-production": Load balancers, caches, queues, CDN, workers. 8-10 nodes.\n- "highly-available": Redundancy, failover, multi-region. 8-12 nodes.\n`
    : "";

  const candidateAnswers =
    req.messages?.length > 0
      ? req.messages
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")
      : "No answers yet — generate a standard architecture.";

  const user = `Generate a system design architecture for: ${req.problem}\n\n${styleInstruction}\nCandidate answers:\n${candidateAnswers}`;

  const system = `You are a senior system design engineer.

Return ONLY valid JSON in this exact format:
{
  "summary": "1-2 sentence overall architecture summary",
  "score": 85,
  "nodes": [
    { "id": "1", "label": "Client App", "type": "client", "description": "What this component does" }
  ],
  "edges": [
    { "source": "1", "target": "2", "label": "HTTP request" }
  ],
  "bottlenecks": ["Specific bottleneck description"],
  "tradeoffs": ["Specific tradeoff: why X was chosen over Y"],
  "scalingRecommendations": ["Actionable scaling recommendation"]
}

Rules:
- 6 to 10 nodes total.
- Every architecture MUST include: a client, an API gateway, at least one backend service, and at least one database.
- Node "type" must be one of: client, gateway, service, database, cache, queue, worker, storage, external, monitoring.
- Never use vague labels. Use real names like "User Service", "PostgreSQL", "Redis Cache".
- Edge labels must describe real data flow.
- Return 3-5 items for bottlenecks, tradeoffs, and scalingRecommendations each.
- Return ONLY JSON. No markdown.`;

  return { system, user };
}

function tryParse(raw: string): ArchitectureAIResponse | null {
  try {
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function generateArchitecture(
  req: ArchitectureAIRequest
): Promise<ArchitectureAIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("[architecture] Missing OPENROUTER_API_KEY — returning fallback");
    return ARCHITECTURE_FALLBACK;
  }

  const { system, user } = buildPrompts(req);

  async function callAPI(): Promise<string | null> {
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
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  }

  // First attempt
  let content = await callAPI();
  let parsed = content ? tryParse(content) : null;

  // Retry once on bad JSON
  if (!parsed) {
    console.warn("[architecture] JSON parse failed, retrying...");
    content = await callAPI();
    if (content) parsed = tryParse(content);
  }

  if (!parsed) {
    console.error("[architecture] All attempts failed, returning fallback");
    return ARCHITECTURE_FALLBACK;
  }

  // Validate shape
  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges) || parsed.nodes.length === 0) {
    console.error("[architecture] Invalid shape, returning fallback");
    return ARCHITECTURE_FALLBACK;
  }

  // Remove edges pointing to non-existent nodes
  const validIds = new Set(parsed.nodes.map((n) => String(n.id)));
  parsed.edges = parsed.edges.filter(
    (e) => validIds.has(String(e.source)) && validIds.has(String(e.target))
  );

  return parsed;
}

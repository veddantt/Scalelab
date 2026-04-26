// server/ai/modelAnswer.ts
// Server-only module for generating a strong model answer for a system design problem.

import type { ModelAnswer } from "@/lib/sessionStorage";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";

export interface ModelAnswerRequest {
  problemId: string;
  problemTitle: string;
  problemStatement: string;
  userAnswers?: string;
  architectureResult?: any;
  reviewScores?: any;
  weaknesses?: string[];
}

const FALLBACK_MODEL_ANSWER: ModelAnswer = {
  overview:
    "A URL shortener maps a long URL to a short alphanumeric alias. The system must handle high read:write ratios (100:1), guarantee uniqueness of aliases, and return redirects with sub-100ms latency globally.",
  requirements: [
    "Generate a unique short alias for any given URL",
    "Redirect short URLs to original URL with minimal latency",
    "Support analytics (click counts, referrers)",
    "Handle 10K writes/sec and 1M reads/sec at peak",
    "URLs should optionally expire",
  ],
  scaleAssumptions: [
    "100M URLs created per day → ~1200 writes/sec avg",
    "10B redirects per day → ~115K reads/sec avg",
    "Estimated DB size: ~500 bytes/row × 100M = 50 GB/year",
    "Stateless service nodes; cache handles read amplification",
  ],
  apiDesign: [
    { method: "POST", endpoint: "/api/shorten", purpose: "Create a short URL alias" },
    { method: "GET", endpoint: "/{alias}", purpose: "Redirect to original URL" },
    { method: "GET", endpoint: "/api/stats/{alias}", purpose: "Fetch analytics for a short URL" },
    { method: "DELETE", endpoint: "/api/{alias}", purpose: "Delete / deactivate a short URL" },
  ],
  dataModel: [
    {
      entity: "url_mappings",
      fields: ["alias VARCHAR(8) PK", "original_url TEXT", "user_id UUID", "created_at TIMESTAMP", "expires_at TIMESTAMP"],
      notes: "Index on alias for sub-ms lookups. Store in a Key-Value store (Redis / DynamoDB) for O(1) reads.",
    },
    {
      entity: "click_events",
      fields: ["id UUID PK", "alias VARCHAR(8) FK", "timestamp TIMESTAMP", "referrer TEXT", "ip TEXT"],
      notes: "Write to a Kafka topic and batch-ingest into analytics store (ClickHouse / BigQuery). Never on the hot path.",
    },
  ],
  architecture: [
    { component: "API Gateway / Load Balancer", responsibility: "Terminate TLS, rate limit per IP, route to shortener service replicas." },
    { component: "Shortener Service (stateless)", responsibility: "Validate URL, generate alias via base62(counter) or random, write to DB." },
    { component: "Redis Cache (write-through)", responsibility: "Cache alias→URL mappings. 99% of reads served here with ~1ms latency." },
    { component: "PostgreSQL / DynamoDB", responsibility: "Durable store for URL mappings. DynamoDB preferred for auto-scaling at massive scale." },
    { component: "Alias Counter Service", responsibility: "Global atomic counter (Zookeeper or DB sequence) to guarantee unique IDs without collisions." },
    { component: "Kafka + Analytics Consumer", responsibility: "Decouple click tracking from the redirect path. Consumer batch-writes to ClickHouse." },
    { component: "CDN (Cloudflare / CloudFront)", responsibility: "Cache redirect responses at edge nodes globally for <10ms redirects." },
  ],
  tradeoffs: [
    "base62(counter) is sequential (predictable) but guaranteed unique; random hashes require collision checking.",
    "Centralised counter is a bottleneck — mitigate with range-based ID allocation per service instance.",
    "Write-through cache adds latency on writes but makes reads extremely fast and consistent.",
    "CDN caching of redirects means stale aliases can persist for TTL duration after deletion.",
  ],
  bottlenecks: [
    "Counter service becomes a hot spot under extreme write load — mitigate with range allocation.",
    "Redis eviction under memory pressure can cause cache misses and DB fan-out.",
    "Single-region DB write endpoint limits geographic write throughput.",
  ],
  scalingPlan: [
    "Horizontally scale stateless shortener replicas behind the load balancer.",
    "Shard DynamoDB by alias prefix or use consistent hashing.",
    "Use Redis Cluster with read replicas to spread read load.",
    "Deploy edge redirect services in multiple regions using Cloudflare Workers.",
    "Switch analytics to async Kafka pipeline so redirect p99 is never affected by analytics writes.",
  ],
  howToExplainInInterview:
    "Start with requirements and scale numbers to ground the design. Then walk through the redirect hot path (client → CDN → cache → DB) before discussing the write path. Highlight the alias generation strategy and why you chose it. Mention analytics decoupling via Kafka to show awareness of the read/write separation principle. Close with failure handling: what happens if Redis is down, if the counter service is unavailable, or if the DB primary fails.",
};

function tryParse(raw: string): ModelAnswer | null {
  try {
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    // Extract first JSON object in case the model adds extra commentary
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function generateModelAnswer(
  req: ModelAnswerRequest
): Promise<ModelAnswer> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("[modelAnswer] Missing OPENROUTER_API_KEY — returning fallback");
    return FALLBACK_MODEL_ANSWER;
  }

  const weaknessBlock =
    req.weaknesses?.length
      ? `User's identified weaknesses:\n${req.weaknesses.map((w) => `- ${w}`).join("\n")}\n`
      : "";

  const userBlock =
    req.userAnswers
      ? `User's interview answers (summarised):\n${req.userAnswers}\n`
      : "";

  const prompt = `You are a senior staff engineer and technical interviewer at a top tech company.

Generate a strong, realistic model answer for the following system design problem. Write it as if a well-prepared senior engineer is answering in an interview. Be specific, practical, and concise. Do not be vague or generic.

Problem: ${req.problemTitle}
Description: ${req.problemStatement}
${userBlock}${weaknessBlock}

Return ONLY valid JSON with exactly this structure. Do not include markdown, code blocks, or commentary outside the JSON:
{
  "overview": "2-3 sentence framing of the problem and the approach",
  "requirements": ["functional and non-functional requirements as bullet strings"],
  "scaleAssumptions": ["concrete numbers: QPS, storage, latency targets"],
  "apiDesign": [
    { "method": "GET|POST|PUT|DELETE", "endpoint": "/path", "purpose": "what it does" }
  ],
  "dataModel": [
    { "entity": "table_name", "fields": ["field: type"], "notes": "why this schema" }
  ],
  "architecture": [
    { "component": "component name", "responsibility": "what it does and why" }
  ],
  "tradeoffs": ["specific technical tradeoff with justification"],
  "bottlenecks": ["specific bottleneck and mitigation"],
  "scalingPlan": ["specific scaling strategy"],
  "howToExplainInInterview": "2-3 sentence coaching tip on how to structure the verbal explanation"
}

Rules:
- Be specific to ${req.problemTitle}, not generic
- Use real technology names (Redis, Kafka, PostgreSQL, etc.)
- Avoid saying "as an AI" or generic filler phrases
- Keep each list item concise (1-2 sentences max)
- No markdown inside JSON string values`;

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
        temperature: 0.3,
      }),
    });

    const data = await res.json();
    const content: string | undefined = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in response");

    const parsed = tryParse(content);
    if (!parsed) throw new Error("Invalid JSON in model answer response");

    return parsed;
  } catch (err) {
    console.error("[modelAnswer] Error:", err);
    return FALLBACK_MODEL_ANSWER;
  }
}

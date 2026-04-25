const MOCK_FALLBACK = {
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
};

export async function POST(req: Request) {
  try {
    const { problem, messages, architectureStyle } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("Missing OPENROUTER_API_KEY, using fallback");
      return Response.json(MOCK_FALLBACK);
    }

    const styleInstruction = architectureStyle
      ? `The candidate chose "${architectureStyle}" style. Tailor the architecture accordingly:\n- "high-level": Keep it conceptual with 6-8 nodes.\n- "scalable-production": Include load balancers, caches, queues, CDN, workers. 8-10 nodes.\n- "highly-available": Add redundancy, failover, multi-region, health checks. 8-12 nodes.\n`
      : "";

    const candidateAnswers =
      messages && messages.length > 0
        ? messages.map((m: any) => `${m.role}: ${m.content}`).join("\n")
        : "No answers yet — generate a standard architecture.";

    const userPrompt = `Generate a system design architecture for: ${problem}\n\n${styleInstruction}\nCandidate answers:\n${candidateAnswers}`;

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
            content: `You are a senior system design engineer.

Return ONLY valid JSON in this exact format:
{
  "summary": "1-2 sentence overall architecture summary",
  "score": 85,
  "nodes": [
    {
      "id": "1",
      "label": "Client App",
      "type": "client",
      "description": "What this component does"
    }
  ],
  "edges": [
    {
      "source": "1",
      "target": "2",
      "label": "HTTP request"
    }
  ],
  "bottlenecks": ["Specific bottleneck description"],
  "tradeoffs": ["Specific tradeoff: why X was chosen over Y"],
  "scalingRecommendations": ["Actionable scaling recommendation"]
}

Rules:
- 6 to 10 nodes total.
- Every architecture MUST include: a client, an API gateway, at least one backend service, and at least one database.
- Prefer realistic production components: CDN, cache (Redis/Memcached), message queue (Kafka/RabbitMQ), background workers, object storage (S3), monitoring (Datadog/Prometheus).
- Never use vague labels like "Service 1" or "Database 1". Use real names like "User Service", "PostgreSQL", "Redis Cache".
- Node "type" must be one of: client, gateway, service, database, cache, queue, worker, storage, external, monitoring.
- Edge labels must describe real data flow: "HTTP request", "cache lookup", "async job", "SQL read/write", "publish event".
- Bottlenecks must be specific to this architecture (not generic).
- Tradeoffs must explain why one choice was made over another.
- Scaling recommendations must be actionable.
- Return 3-5 items for bottlenecks, tradeoffs, and scalingRecommendations each.
- Return ONLY JSON. No markdown. No explanation outside the JSON.`,
          },
          {
            role: "user",
            content: userPrompt,
          },
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

    // Validate required fields
    if (!parsed.nodes || !parsed.edges || !Array.isArray(parsed.nodes)) {
      console.error("Invalid architecture shape, using fallback");
      return Response.json(MOCK_FALLBACK);
    }

    return Response.json(parsed);
  } catch (error: any) {
    console.error("Architecture API error:", error);
    return Response.json(MOCK_FALLBACK);
  }
}

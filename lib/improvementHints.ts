// lib/improvementHints.ts

export function getHintForStep(step: number, weakestAreas?: string[], improvementGoals?: string[]): string | null {
  if (!weakestAreas || weakestAreas.length === 0) return null;

  const combinedAreas = [...weakestAreas, ...(improvementGoals || [])].join(" ").toLowerCase();

  switch (step) {
    case 1: // Requirements
      if (combinedAreas.includes("requirement") || combinedAreas.includes("feature") || combinedAreas.includes("user")) {
        return "Improvement Goal: Focus on explicitly defining core user actions and non-functional requirements (latency, availability).";
      }
      break;
    case 2: // Scale Estimation
      if (combinedAreas.includes("scale") || combinedAreas.includes("qps") || combinedAreas.includes("storage") || combinedAreas.includes("bandwidth") || combinedAreas.includes("math")) {
        return "Improvement Goal: Add concrete math for QPS, storage size over 5 years, and network bandwidth.";
      }
      break;
    case 3: // API Design
      if (combinedAreas.includes("api") || combinedAreas.includes("endpoint") || combinedAreas.includes("rest") || combinedAreas.includes("rpc") || combinedAreas.includes("payload")) {
        return "Improvement Goal: Clearly define request/response payloads, HTTP methods, and status codes.";
      }
      break;
    case 4: // Data Model
      if (combinedAreas.includes("data") || combinedAreas.includes("database") || combinedAreas.includes("schema") || combinedAreas.includes("sql") || combinedAreas.includes("nosql")) {
        return "Improvement Goal: Justify your database choice (SQL vs NoSQL) and define primary/foreign keys or partition keys.";
      }
      break;
    case 5: // High-Level Architecture
      if (combinedAreas.includes("architecture") || combinedAreas.includes("component") || combinedAreas.includes("service") || combinedAreas.includes("flow")) {
        return "Improvement Goal: Break the system into clear, decoupled services and explain the end-to-end request flow.";
      }
      break;
    case 6: // Deep Dive / Bottlenecks
      if (combinedAreas.includes("bottleneck") || combinedAreas.includes("fail") || combinedAreas.includes("spof") || combinedAreas.includes("cache") || combinedAreas.includes("queue") || combinedAreas.includes("availability")) {
        return "Improvement Goal: Identify single points of failure and explain how caching, queues, or replication mitigate them.";
      }
      break;
    case 7: // Review / Tradeoffs
      if (combinedAreas.includes("tradeoff") || combinedAreas.includes("justify") || combinedAreas.includes("alternative")) {
        return "Improvement Goal: Summarize specific technical tradeoffs you made (e.g. Consistency vs Availability, Latency vs Cost).";
      }
      break;
  }

  // Fallback: If no specific match, just show a general hint from the goals on step 1 or 6
  if (step === 1 && improvementGoals && improvementGoals.length > 0) {
    return `Goal for this session: ${improvementGoals[0]}`;
  }

  return null;
}

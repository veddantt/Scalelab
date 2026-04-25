// ─────────────────────────────────────────────────────────────────
// Workflow configuration — single source of truth for interview
// stages and architecture style options.
// ─────────────────────────────────────────────────────────────────

import type { InterviewStep, ArchitectureStyle } from "@/lib/types";

export const INTERVIEW_STEPS: InterviewStep[] = [
  {
    title: "Requirements",
    subtitle: "Core features & scope",
    coachTip:
      "Start with users, core actions, and non-functional needs before discussing scale.",
  },
  {
    title: "Scale",
    subtitle: "Traffic & data sizing",
    coachTip:
      "Estimate DAU, QPS, and storage. Use round numbers — precision isn't the goal.",
  },
  {
    title: "APIs",
    subtitle: "Endpoints & contracts",
    coachTip:
      "Define REST or GraphQL endpoints. Show request/response shapes for core actions.",
  },
  {
    title: "Database",
    subtitle: "Schema & storage",
    coachTip:
      "Choose SQL vs NoSQL and justify it. Mention indexing and data access patterns.",
  },
  {
    title: "Architecture",
    subtitle: "High-level components",
    coachTip:
      "Sketch: client → gateway → services → storage. Name real components.",
  },
  {
    title: "Bottlenecks",
    subtitle: "Failure points & limits",
    coachTip:
      "Identify the most critical failure point and explain how you'd mitigate it.",
  },
  {
    title: "Review",
    subtitle: "Final evaluation",
    coachTip:
      "Summarize your decisions and be ready to defend each tradeoff clearly.",
  },
];

export const ARCHITECTURE_STYLES: ArchitectureStyle[] = [
  {
    id: "high-level",
    label: "High-Level Design",
    description: "Conceptual overview with major components",
  },
  {
    id: "scalable-production",
    label: "Scalable Production",
    description: "Load balancers, caches, queues, CDN, workers",
  },
  {
    id: "highly-available",
    label: "Highly Available",
    description: "Redundancy, failover, multi-region",
  },
];

/** Minimum step index required before architecture generation is allowed */
export const MIN_STEP_FOR_ARCHITECTURE = 4;

// ─────────────────────────────────────────────────────────────────
// Centralized TypeScript types for ScaleLab
// ─────────────────────────────────────────────────────────────────

// ── Domain: Problems ──────────────────────────────────────────────

export interface Problem {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  tags: string[];
  estimatedMinutes: number;
  examples: string[];
}

// ── Domain: Interview ─────────────────────────────────────────────

export interface InterviewStep {
  title: string;
  subtitle: string;
  coachTip: string;
}

export interface InterviewMessage {
  role: "user" | "ai";
  content: string;
  feedback?: string;
}

export interface InterviewScores {
  clarity: number;
  depth: number;
  correctness: number;
}

export interface ArchitectureStyle {
  id: string;
  label: string;
  description: string;
}

// ── Domain: Architecture ──────────────────────────────────────────

export type NodeType =
  | "client"
  | "gateway"
  | "service"
  | "database"
  | "cache"
  | "queue"
  | "worker"
  | "storage"
  | "external"
  | "monitoring";

export interface ArchitectureNode {
  id: string;
  label: string;
  type: NodeType;
  description?: string;
}

export interface ArchitectureEdge {
  id?: string;
  source: string;
  target: string;
  label?: string;
}

export interface ArchitectureInsights {
  summary?: string;
  score?: number;
  bottlenecks?: string[];
  tradeoffs?: string[];
  scalingRecommendations?: string[];
  isFallback?: boolean;
}

export interface NodeExplanation {
  title: string;
  role: string;
  responsibilities: string[];
  scalingNotes: string[];
  failureRisks: string[];
}

// ── Domain: Review ────────────────────────────────────────────────

export interface ReviewScore {
  finalScore: number;
  strengths: string[];
  weaknesses: string[];
  architectureSummary: string;
  componentExplanations: { component: string; reasoning: string }[];
  recommendedImprovements: string[];
}

// ── Supabase DB types (server-side) ──────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export type SessionStatus = "in_progress" | "completed";

export interface InterviewSession {
  id: string;
  user_id: string;
  problem_id: string;
  problem_title: string;
  status: SessionStatus;
  current_step: number;
  overall_score: number | null;
  clarity_score: number | null;
  depth_score: number | null;
  correctness_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  feedback?: string | null;
  step: number | null;
  created_at: string;
}

export interface ArchitectureResult {
  id: string;
  session_id: string;
  summary: string | null;
  score: number | null;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  bottlenecks: string[] | null;
  tradeoffs: string[] | null;
  scaling_recommendations: string[] | null;
  is_fallback: boolean;
  created_at: string;
}

export interface ReviewResult {
  id: string;
  session_id: string;
  final_score: number | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  architecture_summary: string | null;
  component_explanations: { component: string; reasoning: string }[] | null;
  recommended_improvements: string[] | null;
  created_at: string;
}

/** Full session payload returned by GET /api/sessions/[id] */
export interface FullSession {
  session: InterviewSession;
  messages: ChatMessage[];
  architecture: ArchitectureResult | null;
  review: ReviewResult | null;
}

/** Payload sent to POST /api/sessions/save */
export interface SaveSessionPayload {
  problem_id: string;
  problem_title: string;
  status: SessionStatus;
  current_step: number;
  scores: InterviewScores;
  messages: { role: string; content: string; feedback?: string; step?: number }[];
  architecture?: {
    summary?: string;
    score?: number;
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
    bottlenecks?: string[];
    tradeoffs?: string[];
    scalingRecommendations?: string[];
    isFallback?: boolean;
  };
  review?: Partial<ReviewScore>;
}

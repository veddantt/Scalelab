// ──────────────────────────────────────────────────────────────
// Types for Supabase-backed interview persistence
// ──────────────────────────────────────────────────────────────

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
  nodes: any[];
  edges: any[];
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
  component_explanations: any[] | null;
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
  scores: {
    clarity: number;
    depth: number;
    correctness: number;
  };
  messages: { role: string; content: string; feedback?: string; step?: number }[];
  architecture?: {
    summary?: string;
    score?: number;
    nodes: any[];
    edges: any[];
    bottlenecks?: string[];
    tradeoffs?: string[];
    scalingRecommendations?: string[];
    isFallback?: boolean;
  };
  review?: {
    finalScore?: number;
    strengths?: string[];
    weaknesses?: string[];
    architectureSummary?: string;
    componentExplanations?: any[];
    recommendedImprovements?: string[];
  };
}

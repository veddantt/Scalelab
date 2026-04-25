import type { FullSession } from "./types";
import { saveSession as saveToLocalStorage } from "./sessionStorage";
import type { ScaleLabSession } from "./sessionStorage";

/**
 * Fetches a saved session from Supabase and writes it to localStorage
 * so the existing interview/architecture/review pages can load it.
 *
 * Returns the problem_id for routing.
 */
export async function restoreSession(sessionId: string): Promise<string> {
  const res = await fetch(`/api/sessions/${sessionId}`);
  if (!res.ok) {
    throw new Error("Failed to load session");
  }

  const data: FullSession = await res.json();
  const { session, messages, architecture, review } = data;

  // Convert DB format → ScaleLabSession format for localStorage
  const localSession: ScaleLabSession = {
    id: session.problem_id,
    problem: session.problem_title,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      feedback: m.feedback || undefined,
    })),
    scores: {
      clarity: session.clarity_score || 0,
      depth: session.depth_score || 0,
      correctness: session.correctness_score || 0,
    },
    currentStep: session.current_step,
    highestStep: session.current_step,
    createdAt: session.created_at,
  };

  // Attach architecture if it exists
  if (architecture) {
    localSession.architecture = {
      nodes: architecture.nodes,
      edges: architecture.edges,
      summary: architecture.summary || undefined,
      score: architecture.score || undefined,
      bottlenecks: architecture.bottlenecks || undefined,
      tradeoffs: architecture.tradeoffs || undefined,
      scalingRecommendations: architecture.scaling_recommendations || undefined,
    };
  }

  // Attach review if it exists
  if (review) {
    localSession.review = {
      finalScore: review.final_score,
      strengths: review.strengths,
      weaknesses: review.weaknesses,
      architectureSummary: review.architecture_summary,
      componentExplanations: review.component_explanations,
      recommendedImprovements: review.recommended_improvements,
    };
  }

  // Write to localStorage — the existing pages read from here
  saveToLocalStorage(localSession);

  return session.problem_id;
}

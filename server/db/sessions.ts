// server/db/sessions.ts
// Server-only Supabase data-access layer for interview sessions.
// All DB interactions must go through here — never in API routes directly.

import { createClient } from "@/lib/supabase/server";
import type { SaveSessionPayload, FullSession } from "@/lib/types";

// ─── List all sessions for the authenticated user ────────────────
export async function listSessions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const, data: null };

  const { data, error } = await supabase
    .from("interview_sessions")
    .select(
      `*, architecture_results ( id, score ), review_results ( id, final_score )`
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return { error: error.message, status: 500 as const, data: null };
  return { error: null, status: 200 as const, data: data ?? [] };
}

// ─── Save a full session (insert, not upsert — multiple snapshots allowed) ──
export async function saveSession(body: SaveSessionPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const, data: null };

  const overallScore = Math.round(
    (body.scores.clarity + body.scores.depth + body.scores.correctness) / 3
  );

  const { data: session, error: sessionErr } = await supabase
    .from("interview_sessions")
    .insert({
      user_id: user.id,
      problem_id: body.problem_id,
      problem_title: body.problem_title,
      status: body.status,
      current_step: body.current_step,
      overall_score: overallScore || null,
      clarity_score: body.scores.clarity || null,
      depth_score: body.scores.depth || null,
      correctness_score: body.scores.correctness || null,
      attempt_number: body.attempt_number || 1,
      original_session_id: body.original_session_id || null,
      practice_mode: body.practice_mode || false,
      improvement_goals: body.improvement_goals || null,
      weakest_areas: body.weakest_areas || null,
      model_answer: body.model_answer || null,
    })
    .select("id")
    .single();

  if (sessionErr || !session) {
    return {
      error: sessionErr?.message ?? "Failed to create session",
      status: 500 as const,
      data: null,
    };
  }

  const sessionId: string = session.id;

  // Insert chat messages
  if (body.messages?.length > 0) {
    const rows = body.messages.map((m) => ({
      session_id: sessionId,
      role: m.role,
      content: m.content,
      feedback: m.feedback ?? null,
      step: m.step ?? null,
    }));
    const { error: msgErr } = await supabase.from("chat_messages").insert(rows);
    if (msgErr) console.error("[db] Failed to insert messages:", msgErr);
  }

  // Insert architecture result
  if (body.architecture?.nodes?.length) {
    const { error: archErr } = await supabase.from("architecture_results").insert({
      session_id: sessionId,
      summary: body.architecture.summary ?? null,
      score: body.architecture.score ?? null,
      nodes: body.architecture.nodes,
      edges: body.architecture.edges,
      bottlenecks: body.architecture.bottlenecks ?? null,
      tradeoffs: body.architecture.tradeoffs ?? null,
      scaling_recommendations: body.architecture.scalingRecommendations ?? null,
      is_fallback: body.architecture.isFallback ?? false,
    });
    if (archErr) console.error("[db] Failed to insert architecture:", archErr);
  }

  // Insert review result
  if (body.review) {
    const { error: revErr } = await supabase.from("review_results").insert({
      session_id: sessionId,
      final_score: body.review.finalScore ?? null,
      strengths: body.review.strengths ?? null,
      weaknesses: body.review.weaknesses ?? null,
      architecture_summary: body.review.architectureSummary ?? null,
      component_explanations: body.review.componentExplanations ?? null,
      recommended_improvements: body.review.recommendedImprovements ?? null,
    });
    if (revErr) console.error("[db] Failed to insert review:", revErr);
  }

  return { error: null, status: 200 as const, data: { id: sessionId } };
}

// ─── Get a single session with related data ──────────────────────
export async function getSessionById(
  id: string
): Promise<{ error: string | null; status: 200 | 401 | 404 | 500; data: FullSession | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, data: null };

  const { data: session, error: sErr } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (sErr || !session) return { error: "Session not found", status: 404, data: null };

  const [messagesRes, archRes, reviewRes] = await Promise.all([
    supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("architecture_results").select("*").eq("session_id", id).maybeSingle(),
    supabase.from("review_results").select("*").eq("session_id", id).maybeSingle(),
  ]);

  return {
    error: null,
    status: 200,
    data: {
      session,
      messages: messagesRes.data ?? [],
      architecture: archRes.data ?? null,
      review: reviewRes.data ?? null,
    },
  };
}

// ─── Delete a session ─────────────────────────────────────────────
export async function deleteSession(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };

  const { error } = await supabase
    .from("interview_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message, status: 500 as const };
  return { error: null, status: 200 as const };
}

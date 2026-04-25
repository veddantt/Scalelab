import { createClient } from "../../../../lib/supabase/server";
import type { SaveSessionPayload } from "../../../../lib/types";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SaveSessionPayload = await req.json();

    // ─── 1. Upsert interview session ───
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
      })
      .select("id")
      .single();

    if (sessionErr || !session) {
      console.error("Failed to create session:", sessionErr);
      return Response.json(
        { error: sessionErr?.message || "Failed to create session" },
        { status: 500 }
      );
    }

    const sessionId = session.id;

    // ─── 2. Insert chat messages ───
    if (body.messages && body.messages.length > 0) {
      const rows = body.messages.map((m, i) => ({
        session_id: sessionId,
        role: m.role,
        content: m.content,
        feedback: m.feedback || null,
        step: m.step ?? null,
      }));

      const { error: msgErr } = await supabase
        .from("chat_messages")
        .insert(rows);

      if (msgErr) {
        console.error("Failed to insert messages:", msgErr);
      }
    }

    // ─── 3. Insert architecture result ───
    if (body.architecture && body.architecture.nodes?.length > 0) {
      const { error: archErr } = await supabase
        .from("architecture_results")
        .insert({
          session_id: sessionId,
          summary: body.architecture.summary || null,
          score: body.architecture.score || null,
          nodes: body.architecture.nodes,
          edges: body.architecture.edges,
          bottlenecks: body.architecture.bottlenecks || null,
          tradeoffs: body.architecture.tradeoffs || null,
          scaling_recommendations:
            body.architecture.scalingRecommendations || null,
          is_fallback: body.architecture.isFallback || false,
        });

      if (archErr) {
        console.error("Failed to insert architecture:", archErr);
      }
    }

    // ─── 4. Insert review result ───
    if (body.review) {
      const { error: revErr } = await supabase
        .from("review_results")
        .insert({
          session_id: sessionId,
          final_score: body.review.finalScore || null,
          strengths: body.review.strengths || null,
          weaknesses: body.review.weaknesses || null,
          architecture_summary: body.review.architectureSummary || null,
          component_explanations: body.review.componentExplanations || null,
          recommended_improvements:
            body.review.recommendedImprovements || null,
        });

      if (revErr) {
        console.error("Failed to insert review:", revErr);
      }
    }

    return Response.json({ id: sessionId, status: "saved" });
  } catch (err: any) {
    console.error("Save session error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

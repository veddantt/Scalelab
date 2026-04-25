import { createClient } from "../../../../lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch session
    const { data: session, error: sErr } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (sErr || !session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    // Fetch related data in parallel
    const [messagesRes, archRes, reviewRes] = await Promise.all([
      supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("architecture_results")
        .select("*")
        .eq("session_id", id)
        .maybeSingle(),
      supabase
        .from("review_results")
        .select("*")
        .eq("session_id", id)
        .maybeSingle(),
    ]);

    return Response.json({
      session,
      messages: messagesRes.data || [],
      architecture: archRes.data || null,
      review: reviewRes.data || null,
    });
  } catch (err: any) {
    console.error("Get session error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { error } = await supabase
      .from("interview_sessions")
      .update(body)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ status: "updated" });
  } catch (err: any) {
    console.error("Patch session error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("interview_sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ status: "deleted" });
  } catch (err: any) {
    console.error("Delete session error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

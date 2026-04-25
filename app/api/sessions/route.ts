import { createClient } from "../../../lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: sessions, error } = await supabase
      .from("interview_sessions")
      .select(`
        *,
        architecture_results ( id, score ),
        review_results ( id, final_score )
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to list sessions:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(sessions || []);
  } catch (err: any) {
    console.error("List sessions error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

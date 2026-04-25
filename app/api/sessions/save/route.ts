import { saveSession } from "@/server/db/sessions";
import type { SaveSessionPayload } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body: SaveSessionPayload = await req.json();
    const { error, status, data } = await saveSession(body);
    if (error) return Response.json({ error }, { status });
    return Response.json(data);
  } catch (err: any) {
    console.error("[api/sessions/save]", err);
    return Response.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}

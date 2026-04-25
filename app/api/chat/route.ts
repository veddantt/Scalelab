import { runChatTurn } from "@/server/ai/chat";
import type { ChatAIRequest } from "@/server/ai/chat";

export async function POST(req: Request) {
  try {
    const body: ChatAIRequest = await req.json();
    const result = await runChatTurn(body);
    return Response.json(result);
  } catch (err: any) {
    console.error("[api/chat]", err);
    return Response.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}

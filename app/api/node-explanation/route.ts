import { explainNode } from "@/server/ai/nodeExplanation";
import type { NodeExplanationRequest } from "@/server/ai/nodeExplanation";

export async function POST(req: Request) {
  try {
    const body: NodeExplanationRequest = await req.json();
    const result = await explainNode(body);
    return Response.json(result);
  } catch (err: any) {
    console.error("[api/node-explanation]", err);
    return Response.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}

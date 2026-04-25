import { generateArchitecture } from "@/server/ai/architecture";
import type { ArchitectureAIRequest } from "@/server/ai/architecture";

export async function POST(req: Request) {
  try {
    const body: ArchitectureAIRequest = await req.json();
    const result = await generateArchitecture(body);
    return Response.json(result);
  } catch (err: any) {
    console.error("[api/architecture]", err);
    return Response.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}

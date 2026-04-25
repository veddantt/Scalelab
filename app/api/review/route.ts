import { generateReview } from "@/server/ai/review";
import type { ReviewAIRequest } from "@/server/ai/review";

export async function POST(req: Request) {
  try {
    const body: ReviewAIRequest = await req.json();
    const result = await generateReview(body);
    return Response.json(result);
  } catch (err: any) {
    console.error("[api/review]", err);
    return Response.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}

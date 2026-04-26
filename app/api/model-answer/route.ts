// app/api/model-answer/route.ts
import { generateModelAnswer } from "@/server/ai/modelAnswer";
import type { ModelAnswerRequest } from "@/server/ai/modelAnswer";

export async function POST(req: Request) {
  try {
    const body: ModelAnswerRequest = await req.json();

    if (!body.problemId || !body.problemTitle) {
      return Response.json(
        { error: "problemId and problemTitle are required" },
        { status: 400 }
      );
    }

    const result = await generateModelAnswer(body);
    return Response.json(result);
  } catch (err: any) {
    console.error("[api/model-answer]", err);
    return Response.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}

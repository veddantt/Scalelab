import { listSessions } from "@/server/db/sessions";

export async function GET() {
  const { error, status, data } = await listSessions();
  if (error) return Response.json({ error }, { status });
  return Response.json(data);
}

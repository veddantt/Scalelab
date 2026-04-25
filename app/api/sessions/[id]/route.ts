import { getSessionById, deleteSession } from "@/server/db/sessions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, status, data } = await getSessionById(id);
  if (error) return Response.json({ error }, { status });
  return Response.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, status } = await deleteSession(id);
  if (error) return Response.json({ error }, { status });
  return Response.json({ status: "deleted" });
}

import { bodyPlayerId, jsonError, mutateRoom, readBody } from "@/lib/api";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await readBody(req);
  const story = typeof body.story === "string" ? body.story.slice(0, 200) : "";
  const playerId = bodyPlayerId(body);

  return mutateRoom(id, playerId, (room) => {
    if (playerId !== room.adminId) {
      return jsonError(403, "Only the host 👑 can set the story");
    }
    room.story = story;
  });
}

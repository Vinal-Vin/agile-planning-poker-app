import { bodyPlayerId, jsonError, mutateRoom, readBody } from "@/lib/api";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await readBody(req);
  const story = typeof body.story === "string" ? body.story.slice(0, 200) : undefined;
  const playerId = bodyPlayerId(body);

  return mutateRoom(id, playerId, (room) => {
    if (playerId !== room.adminId) {
      return jsonError(403, "Only the host 👑 can start a new round");
    }
    room.revealed = false;
    room.round += 1;
    if (story !== undefined) room.story = story;
    for (const p of room.players) p.vote = null;
  });
}

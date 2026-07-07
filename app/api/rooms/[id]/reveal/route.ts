import { bodyPlayerId, jsonError, mutateRoom, readBody } from "@/lib/api";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await readBody(req);
  const playerId = bodyPlayerId(body);

  return mutateRoom(id, playerId, (room) => {
    if (playerId !== room.adminId) {
      return jsonError(403, "Only the host 👑 can reveal the cards");
    }
    if (!room.players.some((p) => p.vote !== null)) {
      return jsonError(409, "Nobody has voted yet");
    }
    room.revealed = true;
  });
}

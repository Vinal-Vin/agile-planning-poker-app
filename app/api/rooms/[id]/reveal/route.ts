import { bodyPlayerId, jsonError, mutateRoom, readBody } from "@/lib/api";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await readBody(req);

  return mutateRoom(id, bodyPlayerId(body), (room) => {
    if (!room.players.some((p) => p.vote !== null)) {
      return jsonError(409, "Nobody has voted yet");
    }
    room.revealed = true;
  });
}

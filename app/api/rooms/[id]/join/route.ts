import { bodyPlayerId, jsonError, mutateRoom, readBody } from "@/lib/api";
import { AVATARS, randomAvatar, sillyName } from "@/lib/names";

const MAX_PLAYERS = 20;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await readBody(req);
  const playerId = bodyPlayerId(body);
  if (!playerId) return jsonError(400, "playerId is required");

  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim().slice(0, 30)
      : sillyName();
  const avatar =
    typeof body.avatar === "string" && AVATARS.includes(body.avatar)
      ? body.avatar
      : randomAvatar();

  return mutateRoom(id, playerId, (room) => {
    const existing = room.players.find((p) => p.id === playerId);
    if (existing) {
      existing.name = name;
      existing.avatar = avatar;
      existing.lastSeen = Date.now();
      return;
    }
    if (room.players.length >= MAX_PLAYERS) {
      return jsonError(409, "Room is full (20 players max)");
    }
    room.players.push({
      id: playerId,
      name,
      avatar,
      vote: null,
      lastSeen: Date.now(),
    });
    // Legacy rooms / direct API use: first player to join becomes the host.
    if (!room.adminId) room.adminId = playerId;
  });
}

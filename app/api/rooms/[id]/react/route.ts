import { bodyPlayerId, jsonError, mutateRoom, readBody } from "@/lib/api";
import { REACTION_EMOJI } from "@/lib/decks";

const MAX_STORED_REACTIONS = 20;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await readBody(req);
  const playerId = bodyPlayerId(body);
  const emoji = typeof body.emoji === "string" ? body.emoji : "";
  if (!REACTION_EMOJI.includes(emoji)) return jsonError(400, "Unknown emoji");

  return mutateRoom(id, playerId, (room) => {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return jsonError(404, "You're not in this room — rejoin");
    room.reactions.push({
      id: `${playerId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      emoji,
      playerId,
      playerName: player.name,
      ts: Date.now(),
    });
    room.reactions = room.reactions.slice(-MAX_STORED_REACTIONS);
  });
}

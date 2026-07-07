import { bodyPlayerId, jsonError, mutateRoom, readBody } from "@/lib/api";
import { DECKS } from "@/lib/decks";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await readBody(req);
  const playerId = bodyPlayerId(body);
  const vote = body.vote === null ? null : String(body.vote ?? "");

  return mutateRoom(id, playerId, (room) => {
    if (room.revealed) {
      return jsonError(409, "Cards are already revealed — start a new round");
    }
    if (vote !== null && !DECKS[room.deck].cards.includes(vote)) {
      return jsonError(400, "That card isn't in this room's deck");
    }
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return jsonError(404, "You're not in this room — rejoin");
    // Tapping the selected card again clears the vote.
    player.vote = player.vote === vote ? null : vote;
    player.lastSeen = Date.now();
  });
}

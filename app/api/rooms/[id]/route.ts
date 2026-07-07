import { jsonError, roomResponse } from "@/lib/api";
import { getStore } from "@/lib/store";

const IDLE_TIMEOUT_MS = 60_000;
const REACTION_WINDOW_MS = 10_000;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = getStore();
  const room = await store.get(id.toLowerCase());
  if (!room) return jsonError(404, "Room not found (it may have expired)");

  const playerId = new URL(req.url).searchParams.get("playerId");
  const now = Date.now();
  let dirty = false;

  const me = room.players.find((p) => p.id === playerId);
  if (me) {
    me.lastSeen = now;
    dirty = true;
  }

  const active = room.players.filter(
    (p) => now - p.lastSeen < IDLE_TIMEOUT_MS,
  );
  if (active.length !== room.players.length) {
    room.players = active;
    dirty = true;
  }

  const freshReactions = room.reactions.filter(
    (r) => now - r.ts < REACTION_WINDOW_MS,
  );
  if (freshReactions.length !== room.reactions.length) {
    room.reactions = freshReactions;
    dirty = true;
  }

  if (dirty) await store.set(room.id, room);
  return roomResponse(room, playerId);
}

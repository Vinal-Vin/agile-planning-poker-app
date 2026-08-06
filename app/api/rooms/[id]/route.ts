import { jsonError, roomResponse } from "@/lib/api";
import { getStore } from "@/lib/store";

// Seats must survive a full meeting (an hour or slightly longer) even when a
// tab is backgrounded, throttled, or the laptop sleeps — browsers throttle
// hidden-tab timers to ~1/min, so the timeout must dwarf the poll interval.
const IDLE_TIMEOUT_MS = 90 * 60_000;
// The host gets extra grace: the crown moves only after a truly long absence.
const HOST_IDLE_TIMEOUT_MS = 2 * 60 * 60_000;
// Persist heartbeats at most this often — keeps the poll (the hot path)
// read-only most of the time, shrinking the unlocked read-modify-write window.
const LASTSEEN_PERSIST_MS = 10_000;
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
    // Always refresh in memory (the caller can never prune themselves below),
    // but only write it out when meaningfully stale.
    if (now - me.lastSeen > LASTSEEN_PERSIST_MS) dirty = true;
    me.lastSeen = now;
  }

  const active = room.players.filter((p) => {
    const timeout =
      p.id === room.adminId ? HOST_IDLE_TIMEOUT_MS : IDLE_TIMEOUT_MS;
    return now - p.lastSeen < timeout;
  });
  if (active.length !== room.players.length) {
    // If the host has been gone past their (long) grace, pass the crown to the
    // longest-standing player so the room stays usable. The original creator
    // reclaims it on rejoin (see join route).
    const hostWasSeated = room.players.some((p) => p.id === room.adminId);
    const hostStillSeated = active.some((p) => p.id === room.adminId);
    room.players = active;
    if (hostWasSeated && !hostStillSeated && active.length > 0) {
      room.adminId = active[0].id;
    }
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

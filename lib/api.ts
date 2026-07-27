import { NextResponse } from "next/server";
import { getStore } from "./store";
import { toPublicRoom, type Room } from "./types";

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Public room state plus the caller's own (otherwise masked) vote so the
 * client can highlight their selected card without exposing other votes.
 */
export function roomResponse(room: Room, playerId?: string | null) {
  const yourVote = playerId
    ? (room.players.find((p) => p.id === playerId)?.vote ?? null)
    : null;
  return NextResponse.json({ room: toPublicRoom(room), yourVote });
}

/**
 * Load a room, apply a mutation, save, and return the public state.
 * Read-modify-write without locking is fine at planning-poker scale: the poll
 * (the hot path) rarely writes, and clients auto-rejoin if a write is lost.
 * Every successful mutation also counts as a heartbeat for the acting player.
 */
export async function mutateRoom(
  id: string,
  playerId: string | null,
  mutate: (room: Room) => NextResponse | void,
): Promise<NextResponse> {
  const store = getStore();
  const room = await store.get(id.toLowerCase());
  if (!room) return jsonError(404, "Room not found (it may have expired)");
  const early = mutate(room);
  if (early) return early;
  const actor = room.players.find((p) => p.id === playerId);
  if (actor) actor.lastSeen = Date.now();
  await store.set(room.id, room);
  return roomResponse(room, playerId);
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return typeof body === "object" && body !== null ? body : {};
  } catch {
    return {};
  }
}

export function bodyPlayerId(body: Record<string, unknown>): string {
  return typeof body.playerId === "string" ? body.playerId : "";
}

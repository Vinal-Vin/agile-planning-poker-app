import { NextResponse } from "next/server";
import { jsonError, readBody } from "@/lib/api";
import { DECKS } from "@/lib/decks";
import { roomCode } from "@/lib/names";
import { getStore } from "@/lib/store";
import type { DeckId, Room } from "@/lib/types";

export async function POST(req: Request) {
  const body = await readBody(req);
  const deck = body.deck as DeckId;
  if (!DECKS[deck]) return jsonError(400, "Invalid deck");
  const story = typeof body.story === "string" ? body.story.slice(0, 200) : "";
  // The creator becomes the host; if omitted, the first player to join claims it.
  const adminId = typeof body.playerId === "string" ? body.playerId : "";

  const store = getStore();
  let id = roomCode();
  // Regenerate on the (unlikely) collision with a live room.
  for (let i = 0; i < 5 && (await store.get(id)); i++) id = roomCode();

  const room: Room = {
    id,
    deck,
    story,
    revealed: false,
    adminId,
    originalAdminId: adminId,
    players: [],
    reactions: [],
    round: 1,
    createdAt: Date.now(),
  };
  await store.set(id, room);
  return NextResponse.json({ id });
}

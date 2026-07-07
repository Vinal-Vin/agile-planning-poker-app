import { bodyPlayerId, mutateRoom, readBody } from "@/lib/api";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await readBody(req);
  const story = typeof body.story === "string" ? body.story.slice(0, 200) : undefined;

  return mutateRoom(id, bodyPlayerId(body), (room) => {
    room.revealed = false;
    room.round += 1;
    if (story !== undefined) room.story = story;
    for (const p of room.players) p.vote = null;
  });
}

export type DeckId = "fibonacci" | "tshirt";

export interface Player {
  id: string;
  name: string;
  avatar: string;
  vote: string | null;
  lastSeen: number;
}

export interface Reaction {
  id: string;
  emoji: string;
  playerId: string;
  playerName: string;
  ts: number;
}

export interface Room {
  id: string;
  deck: DeckId;
  story: string;
  revealed: boolean;
  /** The host: the player who created the room. Only they can reveal, reset, and set the story. */
  adminId: string;
  players: Player[];
  reactions: Reaction[];
  round: number;
  createdAt: number;
}

/** Room state as sent to clients — votes are masked while hidden. */
export interface PublicPlayer {
  id: string;
  name: string;
  avatar: string;
  hasVoted: boolean;
  vote: string | null; // only populated when revealed
}

export interface PublicRoom {
  id: string;
  deck: DeckId;
  story: string;
  revealed: boolean;
  adminId: string;
  players: PublicPlayer[];
  reactions: Reaction[];
  round: number;
}

export function toPublicRoom(room: Room): PublicRoom {
  return {
    id: room.id,
    deck: room.deck,
    story: room.story,
    revealed: room.revealed,
    adminId: room.adminId,
    round: room.round,
    reactions: room.reactions,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      hasVoted: p.vote !== null,
      vote: room.revealed ? p.vote : null,
    })),
  };
}

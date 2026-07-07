import type { DeckId } from "./types";

export interface Deck {
  id: DeckId;
  label: string;
  emoji: string;
  cards: string[];
  /** Whether cards map to numbers (enables average/spread stats). */
  numeric: boolean;
}

export const DECKS: Record<DeckId, Deck> = {
  fibonacci: {
    id: "fibonacci",
    label: "Fibonacci",
    emoji: "🌀",
    cards: ["0", "1", "2", "3", "5", "8", "13", "21", "?", "☕"],
    numeric: true,
  },
  tshirt: {
    id: "tshirt",
    label: "T-shirt sizes",
    emoji: "👕",
    cards: ["XS", "S", "M", "L", "XL", "XXL", "?", "☕"],
    numeric: false,
  },
};

export const REACTION_EMOJI = ["👍", "🎉", "😂", "🤔", "😱", "☕"];

/** Cards that don't count toward stats. */
export const NON_ESTIMATES = new Set(["?", "☕"]);

export function cardValue(card: string): number | null {
  if (NON_ESTIMATES.has(card)) return null;
  const n = Number(card);
  return Number.isFinite(n) ? n : null;
}

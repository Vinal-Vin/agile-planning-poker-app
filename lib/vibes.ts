import { cardValue, DECKS, NON_ESTIMATES } from "./decks";
import type { PublicRoom } from "./types";

export interface VoteStats {
  /** card -> count, in deck order, only cards that received votes */
  distribution: { card: string; count: number }[];
  totalVotes: number;
  average: number | null;
  min: string | null;
  max: string | null;
  mode: string | null;
  consensus: boolean;
  coffeeCount: number;
  unsureCount: number;
  vibe: { message: string; emoji: string };
}

export function computeStats(room: PublicRoom): VoteStats | null {
  if (!room.revealed) return null;
  const deck = DECKS[room.deck];
  const votes = room.players
    .map((p) => p.vote)
    .filter((v): v is string => v !== null);
  if (votes.length === 0) return null;

  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v, (counts.get(v) ?? 0) + 1);

  const distribution = deck.cards
    .filter((c) => counts.has(c))
    .map((c) => ({ card: c, count: counts.get(c)! }));

  const estimates = votes.filter((v) => !NON_ESTIMATES.has(v));
  const coffeeCount = counts.get("☕") ?? 0;
  const unsureCount = counts.get("?") ?? 0;

  let average: number | null = null;
  if (deck.numeric && estimates.length > 0) {
    const nums = estimates
      .map(cardValue)
      .filter((n): n is number => n !== null);
    if (nums.length > 0) {
      average = Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
    }
  }

  // min/max/spread in deck order (works for both numeric and t-shirt decks)
  const estimateIndexes = estimates
    .map((v) => deck.cards.indexOf(v))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  const min = estimateIndexes.length ? deck.cards[estimateIndexes[0]] : null;
  const max = estimateIndexes.length
    ? deck.cards[estimateIndexes[estimateIndexes.length - 1]]
    : null;
  const spread = estimateIndexes.length
    ? estimateIndexes[estimateIndexes.length - 1] - estimateIndexes[0]
    : 0;

  let mode: string | null = null;
  let modeCount = 0;
  for (const { card, count } of distribution) {
    if (!NON_ESTIMATES.has(card) && count > modeCount) {
      mode = card;
      modeCount = count;
    }
  }

  const consensus =
    estimates.length >= 2 && new Set(estimates).size === 1 &&
    estimates.length === votes.length;

  return {
    distribution,
    totalVotes: votes.length,
    average,
    min,
    max,
    mode,
    consensus,
    coffeeCount,
    unsureCount,
    vibe: pickVibe({ consensus, spread, estimates: estimates.length, votes: votes.length, coffeeCount, unsureCount }),
  };
}

function pickVibe(s: {
  consensus: boolean;
  spread: number;
  estimates: number;
  votes: number;
  coffeeCount: number;
  unsureCount: number;
}): { message: string; emoji: string } {
  if (s.coffeeCount > 0 && s.coffeeCount === s.votes) {
    return { emoji: "☕", message: "Unanimous coffee break. The team has spoken!" };
  }
  if (s.estimates === 0) {
    return { emoji: "🤷", message: "Nobody committed to a number. Bold strategy!" };
  }
  if (s.consensus) {
    return { emoji: "🎯", message: "Perfect consensus! Are you all sharing a brain?" };
  }
  if (s.coffeeCount > 0) {
    return { emoji: "☕", message: "Someone needs a break. Estimate responsibly!" };
  }
  if (s.unsureCount > s.estimates) {
    return { emoji: "🔮", message: "More question marks than answers. Time to talk it out!" };
  }
  if (s.spread === 0) {
    return { emoji: "🎯", message: "Everyone who estimated agrees. Smooth!" };
  }
  if (s.spread === 1) {
    return { emoji: "🤝", message: "So close! One quick chat and you're there." };
  }
  if (s.spread <= 3) {
    return { emoji: "🧐", message: "Some healthy disagreement. Who saw something the others didn't?" };
  }
  return { emoji: "🌪️", message: "Total chaos! Highest and lowest voters, state your case!" };
}

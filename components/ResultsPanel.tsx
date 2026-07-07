"use client";

import { useEffect, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import { DECKS } from "@/lib/decks";
import { computeStats } from "@/lib/vibes";
import type { PublicRoom } from "@/lib/types";

function fireConfetti() {
  const opts = { spread: 70, ticks: 120, zIndex: 60 };
  confetti({ ...opts, particleCount: 90, origin: { x: 0.2, y: 0.7 } });
  confetti({ ...opts, particleCount: 90, origin: { x: 0.8, y: 0.7 } });
  setTimeout(
    () =>
      confetti({
        ...opts,
        particleCount: 60,
        origin: { x: 0.5, y: 0.6 },
        scalar: 1.2,
      }),
    250,
  );
}

export function ResultsPanel({ room }: { room: PublicRoom }) {
  const stats = useMemo(() => computeStats(room), [room]);
  const deck = DECKS[room.deck];
  const celebratedRound = useRef<number | null>(null);

  useEffect(() => {
    if (stats?.consensus && celebratedRound.current !== room.round) {
      celebratedRound.current = room.round;
      fireConfetti();
    }
  }, [stats, room.round]);

  if (!stats) return null;
  const maxCount = Math.max(...stats.distribution.map((d) => d.count));

  return (
    <div className="animate-pop-in mx-auto w-full max-w-xl rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
      {/* Vibe headline */}
      <div className="flex items-center gap-3">
        <span className="text-4xl">{stats.vibe.emoji}</span>
        <p className="text-lg font-extrabold">{stats.vibe.message}</p>
      </div>

      {/* Stat tiles */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {deck.numeric ? (
          <StatTile label="Average" value={stats.average ?? "—"} />
        ) : (
          <StatTile label="Most picked" value={stats.mode ?? "—"} />
        )}
        <StatTile label="Lowest" value={stats.min ?? "—"} />
        <StatTile label="Highest" value={stats.max ?? "—"} />
      </div>

      {/* Vote distribution */}
      <div className="mt-4 space-y-1.5">
        {stats.distribution.map(({ card, count }) => (
          <div key={card} className="flex items-center gap-2">
            <span className="w-9 shrink-0 text-right text-sm font-black">
              {card}
            </span>
            <div className="h-5 flex-1 overflow-hidden rounded-md bg-white/5">
              <div
                className="animate-grow-bar flex h-full items-center justify-end rounded-md bg-violet-400/80 pr-1.5"
                style={{ width: `${(count / maxCount) * 100}%` }}
              >
                <span className="text-[11px] font-black text-violet-950">
                  {count}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white/5 px-2 py-3 ring-1 ring-white/10">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-violet-200">
        {label}
      </div>
    </div>
  );
}

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

export function ResultsPanel({
  room,
  onClose,
}: {
  room: PublicRoom;
  onClose: () => void;
}) {
  const stats = useMemo(() => computeStats(room), [room]);
  const deck = DECKS[room.deck];
  const celebratedRound = useRef<number | null>(null);

  useEffect(() => {
    if (stats?.consensus && celebratedRound.current !== room.round) {
      celebratedRound.current = room.round;
      fireConfetti();
    }
  }, [stats, room.round]);

  // Close on Escape and lock background scroll while the popup is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!stats) return null;
  const maxCount = Math.max(...stats.distribution.map((d) => d.count));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Round results"
    >
      {/* Dimmed, blurred backdrop — click to dismiss */}
      <button
        type="button"
        aria-label="Close results"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 cursor-default bg-indigo-950/70 backdrop-blur-sm"
      />

      {/* The popup card */}
      <div className="animate-pop-in relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-indigo-950/95 p-5 shadow-2xl shadow-black/40 ring-1 ring-white/15">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close results"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-lg font-black ring-1 ring-white/15 transition hover:scale-110 hover:bg-white/20 active:scale-95"
        >
          ✕
        </button>

        {/* Vibe headline */}
        <div className="flex items-center gap-3 pr-10">
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

        {/* Column legend: distinguishes "Card" (the value) from "Votes" (the tally) */}
        <div
          className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-violet-300/60"
          aria-hidden="true"
        >
          <span className="w-32 shrink-0 sm:w-40" />
          <span className="w-9 shrink-0 text-center">Card</span>
          <span className="flex-1 pr-1.5 text-right">Votes</span>
        </div>

        {/* Vote distribution — voter names, then the value, then the bar */}
        <div className="mt-1.5 space-y-1.5">
          {stats.distribution.map(({ card, count }) => {
            const voters = room.players.filter((p) => p.vote === card);
            const names = voters.map((p) => `${p.avatar} ${p.name}`).join(", ");
            return (
              <div key={card} className="flex items-center gap-2">
                <span
                  className="w-32 shrink-0 truncate text-right text-xs font-bold text-violet-100 sm:w-40"
                  title={names}
                >
                  {names}
                </span>
                <span className="flex w-9 shrink-0 items-center justify-center rounded-md bg-white px-1 py-0.5 text-xs font-black text-violet-900 shadow-sm ring-1 ring-violet-200">
                  {card}
                </span>
                <div className="h-5 flex-1 overflow-hidden rounded-md bg-white/5">
                  <div
                    className="animate-grow-bar flex h-full items-center justify-end rounded-md bg-violet-400/80 pr-1.5"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  >
                    <span className="text-[11px] font-black text-violet-950">
                      {count}
                      <span className="sr-only"> {count === 1 ? "vote" : "votes"}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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

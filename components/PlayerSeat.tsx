"use client";

import type { PublicPlayer } from "@/lib/types";

export function PlayerSeat({
  player,
  revealed,
  isMe,
}: {
  player: PublicPlayer;
  revealed: boolean;
  isMe: boolean;
}) {
  return (
    <div className="flex w-20 animate-pop-in flex-col items-center gap-1.5 sm:w-24">
      {/* The card slot */}
      <div className="perspective-600 h-16 w-11 sm:h-20 sm:w-14">
        {player.hasVoted ? (
          <div
            className={`preserve-3d relative h-full w-full transition-transform duration-500 ${
              revealed ? "flip-y-180" : ""
            }`}
          >
            {/* Card back (hidden vote) */}
            <div className="backface-hidden absolute inset-0 grid animate-wiggle place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-lg shadow-lg ring-1 ring-white/30">
              🃏
            </div>
            {/* Card face (revealed vote) */}
            <div className="backface-hidden flip-y-180 absolute inset-0 grid place-items-center rounded-lg bg-white text-lg font-black text-violet-900 shadow-lg ring-1 ring-violet-200 sm:text-xl">
              {revealed ? player.vote : ""}
            </div>
          </div>
        ) : (
          <div className="grid h-full w-full place-items-center rounded-lg border-2 border-dashed border-white/25 text-white/30">
            <span className="text-xs">…</span>
          </div>
        )}
      </div>
      <div className="text-2xl leading-none">{player.avatar}</div>
      <div
        className={`w-full truncate text-center text-xs font-bold ${
          isMe ? "text-fuchsia-300" : "text-violet-100"
        }`}
        title={player.name}
      >
        {player.name}
        {isMe && " (you)"}
      </div>
    </div>
  );
}

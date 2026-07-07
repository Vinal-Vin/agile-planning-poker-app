"use client";

import { useEffect, useRef, useState } from "react";
import type { Reaction } from "@/lib/types";

interface FloatingReaction extends Reaction {
  left: number; // vw offset
}

/**
 * Full-screen overlay that floats each reaction up the screen once.
 * Tracks seen reaction ids so polling doesn't replay old reactions.
 */
export function ReactionLayer({ reactions }: { reactions: Reaction[] }) {
  const seen = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const [floating, setFloating] = useState<FloatingReaction[]>([]);

  useEffect(() => {
    // Don't replay reactions that happened before we loaded the room.
    if (!initialized.current) {
      initialized.current = true;
      for (const r of reactions) seen.current.add(r.id);
      return;
    }
    const fresh = reactions.filter((r) => !seen.current.has(r.id));
    if (fresh.length === 0) return;
    for (const r of fresh) seen.current.add(r.id);
    const withPos = fresh.map((r) => ({
      ...r,
      left: 10 + Math.random() * 80,
    }));
    setFloating((prev) => [...prev, ...withPos]);
    // Remove after the animation finishes.
    const ids = new Set(withPos.map((r) => r.id));
    const t = setTimeout(
      () => setFloating((prev) => prev.filter((r) => !ids.has(r.id))),
      3000,
    );
    return () => clearTimeout(t);
  }, [reactions]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {floating.map((r) => (
        <div
          key={r.id}
          className="animate-float-up absolute bottom-24 flex flex-col items-center"
          style={{ left: `${r.left}vw` }}
        >
          <span className="text-4xl drop-shadow-lg">{r.emoji}</span>
          <span className="mt-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white">
            {r.playerName}
          </span>
        </div>
      ))}
    </div>
  );
}

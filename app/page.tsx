"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DECKS } from "@/lib/decks";
import { AVATARS, randomAvatar, sillyName } from "@/lib/names";
import {
  apiPost,
  getPlayerId,
  loadProfile,
  saveProfile,
} from "@/lib/client";
import type { DeckId } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🦊");
  const [deck, setDeck] = useState<DeckId>("fibonacci");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const profile = loadProfile();
    setName(profile?.name ?? sillyName());
    setAvatar(profile?.avatar ?? randomAvatar());
  }, []);

  function shuffleName() {
    setName(sillyName());
    setAvatar(randomAvatar());
  }

  async function createRoom() {
    setBusy(true);
    setError(null);
    try {
      const profile = { name: name.trim() || sillyName(), avatar };
      saveProfile(profile);
      const playerId = getPlayerId();
      // Creating the room makes you its host 👑
      const { id } = await apiPost<{ id: string }>("/api/rooms", {
        deck,
        playerId,
      });
      await apiPost(`/api/rooms/${id}/join`, { playerId, ...profile });
      router.push(`/room/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  function joinRoom(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim();
    if (!code) return;
    // Accept either a bare code or a pasted room link.
    const match = code.match(/room\/([a-z0-9-]+)/i);
    const id = (match ? match[1] : code).toLowerCase();
    saveProfile({ name: name.trim() || sillyName(), avatar });
    router.push(`/room/${encodeURIComponent(id)}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <h1 className="text-center text-5xl font-black tracking-tight sm:text-6xl">
          Planning Poker{" "}
          <span className="inline-block animate-wiggle">🃏</span>
        </h1>
        <p className="mt-3 text-center text-lg text-violet-200">
          Estimate together. Argue less. Confetti when you agree. 🎉
        </p>

        <div className="mt-8 rounded-3xl bg-white/10 p-6 shadow-2xl ring-1 ring-white/15 backdrop-blur">
          {/* Identity */}
          <label className="block text-sm font-bold uppercase tracking-wide text-violet-200">
            Who are you?
          </label>
          <div className="mt-2 flex items-center gap-2">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-3xl ring-1 ring-white/15">
              {avatar}
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="Your name"
              className="h-12 w-full rounded-2xl bg-white/10 px-4 font-semibold text-white placeholder-violet-300 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-fuchsia-400"
            />
            <button
              type="button"
              onClick={shuffleName}
              title="Shuffle name & avatar"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl ring-1 ring-white/15 transition hover:scale-105 hover:bg-white/20 active:scale-95"
            >
              🎲
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {AVATARS.slice(0, 15).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={`grid h-9 w-9 place-items-center rounded-xl text-xl transition hover:scale-110 ${
                  a === avatar
                    ? "bg-fuchsia-500/40 ring-2 ring-fuchsia-400"
                    : "bg-white/5 ring-1 ring-white/10"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          {/* Deck */}
          <label className="mt-6 block text-sm font-bold uppercase tracking-wide text-violet-200">
            Pick a deck
          </label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {Object.values(DECKS).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDeck(d.id)}
                className={`rounded-2xl p-4 text-left transition hover:scale-[1.02] active:scale-[0.98] ${
                  deck === d.id
                    ? "bg-fuchsia-500/30 ring-2 ring-fuchsia-400"
                    : "bg-white/5 ring-1 ring-white/10"
                }`}
              >
                <div className="text-2xl">{d.emoji}</div>
                <div className="mt-1 font-extrabold">{d.label}</div>
                <div className="mt-0.5 text-xs text-violet-200">
                  {d.cards.join(" · ")}
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={createRoom}
            disabled={busy}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-4 text-lg font-black shadow-lg transition hover:scale-[1.02] hover:shadow-fuchsia-500/30 active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Dealing the cards… 🃏" : "Create a room 🚀"}
          </button>

          {/* Join */}
          <form onSubmit={joinRoom} className="mt-4 flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="…or paste a room code / link"
              className="h-12 w-full rounded-2xl bg-white/10 px-4 text-sm font-semibold text-white placeholder-violet-300 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-fuchsia-400"
            />
            <button
              type="submit"
              className="h-12 shrink-0 rounded-2xl bg-white/10 px-5 font-bold ring-1 ring-white/15 transition hover:bg-white/20 active:scale-95"
            >
              Join
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 ring-1 ring-red-400/30">
              {error}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-violet-300">
          Rooms expire after 24 hours. No sign-up, no fuss.
        </p>
      </div>
    </main>
  );
}

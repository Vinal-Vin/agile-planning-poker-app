"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/Card";
import { PlayerSeat } from "@/components/PlayerSeat";
import { ReactionLayer } from "@/components/ReactionLayer";
import { ResultsPanel } from "@/components/ResultsPanel";
import {
  ApiError,
  apiPost,
  fetchRoom,
  getPlayerId,
  loadProfile,
  saveProfile,
} from "@/lib/client";
import { DECKS, REACTION_EMOJI } from "@/lib/decks";
import { AVATARS, randomAvatar, sillyName } from "@/lib/names";
import type { PublicRoom } from "@/lib/types";

const POLL_MS = 1500;

type Phase = "joining" | "playing" | "expired";

export function RoomClient({ roomId }: { roomId: string }) {
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("joining");
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [copied, setCopied] = useState(false);

  // Join form state (shown to invitees without a saved profile)
  const [draftName, setDraftName] = useState("");
  const [draftAvatar, setDraftAvatar] = useState("🦊");
  const [needsProfile, setNeedsProfile] = useState(false);

  // Story editing
  const [storyDraft, setStoryDraft] = useState<string | null>(null);

  // Results popup — opens automatically when cards are revealed for a round,
  // and can be dismissed / reopened without leaving the round.
  const [showResults, setShowResults] = useState(false);
  const shownResultsRound = useRef<number | null>(null);

  const join = useCallback(
    async (name: string, avatar: string) => {
      const id = getPlayerId();
      setPlayerId(id);
      try {
        const { room, yourVote } = await apiPost(`/api/rooms/${roomId}/join`, {
          playerId: id,
          name,
          avatar,
        });
        saveProfile({ name, avatar });
        setRoom(room);
        setMyVote(yourVote);
        setPhase("playing");
        setError(null);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) setPhase("expired");
        else setError(e instanceof Error ? e.message : "Couldn't join room");
      }
    },
    [roomId],
  );

  // On mount: auto-join with the saved profile, or ask for one.
  useEffect(() => {
    const profile = loadProfile();
    if (profile) {
      void join(profile.name, profile.avatar);
    } else {
      setDraftName(sillyName());
      setDraftAvatar(randomAvatar());
      setNeedsProfile(true);
    }
  }, [join]);

  // Poll room state.
  useEffect(() => {
    if (phase !== "playing" || !playerId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const { room, yourVote } = await fetchRoom(roomId, playerId);
        if (!cancelled) {
          setRoom(room);
          setMyVote(yourVote);
        }
      } catch (e) {
        if (!cancelled && e instanceof ApiError && e.status === 404) {
          setPhase("expired");
        }
        // Transient network errors: keep polling.
      }
    };
    const interval = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [phase, playerId, roomId]);

  // Pop the results open once per reveal; close them when a new round starts.
  useEffect(() => {
    if (room?.revealed) {
      if (shownResultsRound.current !== room.round) {
        shownResultsRound.current = room.round;
        setShowResults(true);
      }
    } else {
      shownResultsRound.current = null;
      setShowResults(false);
    }
  }, [room?.revealed, room?.round]);

  async function action(path: string, body?: Record<string, unknown>) {
    try {
      const { room, yourVote } = await apiPost(`/api/rooms/${roomId}/${path}`, {
        playerId,
        ...body,
      });
      setRoom(room);
      setMyVote(yourVote);
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404 && e.message.includes("expired")) {
        setPhase("expired");
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy — grab the link from the address bar");
    }
  }

  if (phase === "expired") {
    return (
      <Shell>
        <div className="mx-auto mt-24 max-w-md rounded-3xl bg-white/10 p-8 text-center ring-1 ring-white/15">
          <div className="text-5xl">👻</div>
          <h2 className="mt-3 text-2xl font-black">This room has vanished</h2>
          <p className="mt-2 text-violet-200">
            It may have expired (rooms live for 24 hours) or the code is wrong.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-6 py-3 font-black transition hover:scale-105"
          >
            Start a new room
          </Link>
        </div>
      </Shell>
    );
  }

  if (needsProfile && phase === "joining") {
    return (
      <Shell>
        <div className="mx-auto mt-16 max-w-md animate-pop-in rounded-3xl bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur">
          <h2 className="text-center text-2xl font-black">
            Joining room <span className="text-fuchsia-300">{roomId}</span>
          </h2>
          <p className="mt-1 text-center text-sm text-violet-200">
            Pick a name and an avatar to sit at the table.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-3xl ring-1 ring-white/15">
              {draftAvatar}
            </span>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={30}
              className="h-12 w-full rounded-2xl bg-white/10 px-4 font-semibold ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-fuchsia-400"
            />
            <button
              type="button"
              title="Shuffle name & avatar"
              onClick={() => {
                setDraftName(sillyName());
                setDraftAvatar(randomAvatar());
              }}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl ring-1 ring-white/15 transition hover:scale-105 active:scale-95"
            >
              🎲
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {AVATARS.slice(0, 15).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setDraftAvatar(a)}
                className={`grid h-9 w-9 place-items-center rounded-xl text-xl transition hover:scale-110 ${
                  a === draftAvatar
                    ? "bg-fuchsia-500/40 ring-2 ring-fuchsia-400"
                    : "bg-white/5 ring-1 ring-white/10"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setNeedsProfile(false);
              void join(draftName.trim() || sillyName(), draftAvatar);
            }}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-3.5 text-lg font-black transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Take a seat 🪑
          </button>
          {error && <ErrorNote message={error} />}
        </div>
      </Shell>
    );
  }

  if (!room) {
    return (
      <Shell>
        <div className="mt-32 text-center">
          <div className="animate-wiggle text-6xl">🃏</div>
          <p className="mt-4 font-bold text-violet-200">Shuffling you in…</p>
          {error && <ErrorNote message={error} />}
        </div>
      </Shell>
    );
  }

  const deck = DECKS[room.deck];
  const me = room.players.find((p) => p.id === playerId);
  const iVoted = me?.hasVoted ?? false;
  const votedCount = room.players.filter((p) => p.hasVoted).length;
  const story = storyDraft ?? room.story;
  const isHost = room.adminId === playerId;
  const host = room.players.find((p) => p.id === room.adminId);
  const hostName = host ? `${host.avatar} ${host.name}` : "the host";

  return (
    <Shell>
      <ReactionLayer reactions={room.reactions} />

      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-xl font-black tracking-tight">
          🃏 Planning Poker
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-white/10 px-3 py-1.5 font-bold text-violet-200 ring-1 ring-white/15">
            Round {room.round}
          </span>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-full bg-white/10 px-3 py-1.5 font-bold ring-1 ring-white/15 transition hover:bg-white/20 active:scale-95"
          >
            {copied ? "Copied! ✅" : `${room.id} 🔗`}
          </button>
        </div>
      </header>

      {/* Story — only the host can edit it */}
      <div className="mx-auto mt-6 w-full max-w-xl">
        {isHost ? (
          <input
            value={story}
            onChange={(e) => setStoryDraft(e.target.value)}
            onBlur={() => {
              if (storyDraft !== null && storyDraft !== room.story) {
                void action("story", { story: storyDraft });
              }
              setStoryDraft(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            maxLength={200}
            placeholder="✏️ What are we estimating? (type a story or ticket)"
            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-center text-lg font-bold ring-1 ring-white/15 outline-none placeholder:text-violet-300 focus:ring-2 focus:ring-fuchsia-400"
          />
        ) : (
          <div className="w-full rounded-2xl bg-white/10 px-4 py-3 text-center text-lg font-bold ring-1 ring-white/15">
            {room.story ? (
              room.story
            ) : (
              <span className="text-violet-300">
                Waiting for {hostName} 👑 to set the story…
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="mx-auto mt-8 w-full max-w-3xl rounded-[2.5rem] bg-white/5 p-6 ring-1 ring-white/10 sm:p-10">
        {room.players.length === 1 && (
          <p className="mb-4 text-center text-sm font-bold text-violet-300">
            It&apos;s just you so far — share the room link to deal others in! 🔗
          </p>
        )}
        <div className="flex flex-wrap items-start justify-center gap-4 sm:gap-6">
          {room.players.map((p) => (
            <PlayerSeat
              key={p.id}
              player={p}
              revealed={room.revealed}
              isMe={p.id === playerId}
              isHost={p.id === room.adminId}
            />
          ))}
        </div>

        {/* Table actions — only the host controls the round */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isHost ? (
            !room.revealed ? (
              <button
                type="button"
                onClick={() => action("reveal")}
                disabled={votedCount === 0}
                className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-black text-amber-950 shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              >
                Reveal cards 👀
              </button>
            ) : (
              <button
                type="button"
                onClick={() => action("reset")}
                className="rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-3 font-black text-emerald-950 shadow-lg transition hover:scale-105 active:scale-95"
              >
                New round 🔄
              </button>
            )
          ) : (
            <span className="rounded-2xl bg-white/5 px-4 py-2 text-sm font-bold text-violet-200 ring-1 ring-white/10">
              👑 {hostName} {room.revealed ? "starts the next round" : "flips the cards"}
            </span>
          )}
          {room.revealed && !showResults && (
            <button
              type="button"
              onClick={() => setShowResults(true)}
              className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-black ring-1 ring-white/15 transition hover:scale-105 hover:bg-white/20 active:scale-95"
            >
              📊 See results
            </button>
          )}
          <span className="text-sm font-bold text-violet-300">
            {votedCount}/{room.players.length} voted
          </span>
        </div>
      </div>

      {/* Results popup */}
      {room.revealed && showResults && (
        <ResultsPanel room={room} onClose={() => setShowResults(false)} />
      )}

      {error && (
        <div className="mx-auto mt-4 max-w-xl">
          <ErrorNote message={error} />
        </div>
      )}

      {/* Reaction bar */}
      <div className="mx-auto mt-6 flex justify-center gap-2">
        {REACTION_EMOJI.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => action("react", { emoji })}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-xl ring-1 ring-white/15 transition hover:scale-125 hover:bg-white/20 active:scale-95"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Your hand */}
      <div className="sticky bottom-0 mt-8 -mx-4 bg-gradient-to-t from-indigo-950 via-indigo-950/90 to-transparent px-4 pb-5 pt-8">
        <p className="mb-3 text-center text-sm font-bold text-violet-300">
          {room.revealed
            ? "Cards are on the table! Start a new round to vote again."
            : iVoted
              ? "Vote locked in — pick another card to change your mind 🤫"
              : "Pick your card 👇"}
        </p>
        <div className="flex justify-center gap-2 overflow-x-auto pb-1 sm:gap-3">
          {deck.cards.map((card) => (
            <Card
              key={card}
              value={card}
              selected={myVote === card}
              disabled={room.revealed}
              onClick={() => action("vote", { vote: card })}
            />
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6">
      {children}
    </main>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="mt-4 rounded-xl bg-red-500/20 px-4 py-2 text-center text-sm font-semibold text-red-200 ring-1 ring-red-400/30">
      {message}
    </p>
  );
}

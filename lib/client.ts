"use client";

import type { PublicRoom } from "./types";

const PLAYER_ID_KEY = "poker-player-id";
const PROFILE_KEY = "poker-profile";

export function getPlayerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export interface Profile {
  name: string;
  avatar: string;
}

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.name === "string" && typeof parsed?.avatar === "string") {
      return parsed;
    }
  } catch {
    // fall through
  }
  return null;
}

export function saveProfile(profile: Profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Room state plus the caller's own vote (masked in the public state). */
export interface RoomPayload {
  room: PublicRoom;
  yourVote: string | null;
}

export async function apiPost<T = RoomPayload>(
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export async function fetchRoom(
  id: string,
  playerId: string,
): Promise<RoomPayload> {
  const res = await fetch(
    `/api/rooms/${encodeURIComponent(id)}?playerId=${encodeURIComponent(playerId)}`,
    { cache: "no-store" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`);
  }
  return data as RoomPayload;
}

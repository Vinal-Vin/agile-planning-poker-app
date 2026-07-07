import { Redis } from "@upstash/redis";
import type { Room } from "./types";

const ROOM_TTL_SECONDS = 60 * 60 * 24; // 24h

interface RoomStore {
  get(id: string): Promise<Room | null>;
  set(id: string, room: Room): Promise<void>;
}

function redisCredentials(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

class RedisStore implements RoomStore {
  private redis: Redis;

  constructor(creds: { url: string; token: string }) {
    this.redis = new Redis(creds);
  }

  async get(id: string): Promise<Room | null> {
    return (await this.redis.get<Room>(`room:${id}`)) ?? null;
  }

  async set(id: string, room: Room): Promise<void> {
    await this.redis.set(`room:${id}`, room, { ex: ROOM_TTL_SECONDS });
  }
}

/**
 * Local-dev fallback when no Redis is configured. Works within a single
 * long-lived process (next dev / next start); NOT reliable on Vercel
 * serverless, where Redis must be configured.
 */
class MemoryStore implements RoomStore {
  private rooms = new Map<string, { room: Room; expires: number }>();

  async get(id: string): Promise<Room | null> {
    const entry = this.rooms.get(id);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.rooms.delete(id);
      return null;
    }
    return entry.room;
  }

  async set(id: string, room: Room): Promise<void> {
    this.rooms.set(id, {
      room,
      expires: Date.now() + ROOM_TTL_SECONDS * 1000,
    });
  }
}

// Persist the memory store across dev-server hot reloads.
const globalStore = globalThis as unknown as { __roomStore?: RoomStore };

export function getStore(): RoomStore {
  if (!globalStore.__roomStore) {
    const creds = redisCredentials();
    globalStore.__roomStore = creds
      ? new RedisStore(creds)
      : new MemoryStore();
    if (!creds && process.env.VERCEL) {
      console.warn(
        "No Redis configured (KV_REST_API_URL/KV_REST_API_TOKEN). " +
          "Rooms will not persist between serverless invocations. " +
          "Add Upstash Redis from the Vercel Marketplace.",
      );
    }
  }
  return globalStore.__roomStore;
}

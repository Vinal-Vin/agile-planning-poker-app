# Planning Poker 🃏

A fun, real-time agile planning poker app. Create a room, share the link, and
estimate stories together — with card-flip reveals, floating emoji reactions,
silly auto-generated names, vote stats with playful "vibe" verdicts, and
confetti when the team reaches consensus. 🎉

## Features

- **Real-time rooms** — share a human-friendly room code like `brave-otter-42`;
  everyone votes from their own device and cards reveal simultaneously.
- **Two decks** — Fibonacci (0–21, ?, ☕) and T-shirt sizes (XS–XXL, ?, ☕).
- **Fun extras** — 3D card-flip reveal, emoji reactions that float across every
  screen, auto-generated names like "Sneaky Waffle", and post-reveal stats
  (average / most picked, lowest, highest, distribution) with vibe messages
  from "🎯 Perfect consensus!" to "🌪️ Total chaos!".
- **No sign-up** — players are identified by a browser-local id; rooms expire
  after 24 hours.

## Stack

- [Next.js 15](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS v4
- [Upstash Redis](https://upstash.com) for room state (free tier is plenty)
- Clients poll room state every 1.5s — no WebSocket infrastructure needed,
  which keeps it fully compatible with Vercel serverless functions.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without Redis configured, an in-memory store is
used automatically — perfect for local development (state resets on restart).

## Deploying to Vercel

1. Push this repo to GitHub and [import it in Vercel](https://vercel.com/new).
2. In your Vercel project, go to **Storage → Create Database → Upstash Redis**
   (free tier). This injects the `KV_REST_API_URL` and `KV_REST_API_TOKEN`
   environment variables automatically.
   - Alternatively, create a database at [upstash.com](https://upstash.com) and
     set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` yourself.
3. Deploy. That's it — no other configuration needed.

> ⚠️ Without Redis, production falls back to per-instance memory, so rooms
> will randomly "disappear" between serverless invocations. Add the Upstash
> integration before sharing the app.

## How it works

Room state is a single JSON blob in Redis (`room:<id>`, 24h TTL) holding the
players, votes, story, round number, and recent reactions. Next.js route
handlers under `app/api/rooms` mutate it; votes stay masked in API responses
(only `hasVoted`) until someone hits **Reveal**. Each client polls
`GET /api/rooms/<id>` every 1.5s, which also serves as a heartbeat — players
idle for more than 60 seconds are removed from the table.

# ArenaMC

Minecraft PvP challenge platform — schedule fights, escrow equal wagers, confirm results, and resolve disputes with recordings.

## Stack

- Next.js 15 (App Router)
- TypeScript, Tailwind CSS
- NextAuth (Auth.js) + Discord OAuth (`identify` scope only — no email)
- Prisma + PostgreSQL (Neon)

## Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Fill in:
   - `DATABASE_URL` — Neon PostgreSQL connection string
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` — [Discord Developer Portal](https://discord.com/developers/applications)
   - `BLOB_READ_WRITE_TOKEN` — required on Vercel for deposit proof uploads ([Vercel Blob](https://vercel.com/docs/storage/vercel-blob); local dev uses `public/uploads/` when unset)

   **Do not set a single `AUTH_URL` or `NEXTAUTH_URL` in production** (it forces all OAuth callbacks to one domain). Auth uses the request host per subdomain (`trustHost` + dynamic origin in `/api/auth`).

   **Discord OAuth redirect URIs** (add every arena host you use):
   - `http://localhost:3000/api/auth/callback/discord`
   - `https://crp.arenamc.xyz/api/auth/callback/discord`
   - `https://drp.arenamc.xyz/api/auth/callback/discord`

3. Push schema and seed arenas:

```bash
npm install
npm run db:push
npm run db:seed
```

4. Run dev server:

```bash
npm run dev
```

## Auth & onboarding

Discord login returns to the **same subdomain** you started on (`crp` / `drp`). Sessions are host-scoped (separate cookies per subdomain).

1. Sign in with Discord at `/onboarding`
2. Link Minecraft username (unique per account)
3. Accept fight rules
4. Finish setup → access `/schedule`, `/wallet`, `/profile`

Protected routes redirect to onboarding when incomplete.

## Fight flow

1. **Create** — `/schedule` saves an `OPEN` fight (direct challenge or open challenge)
2. **Accept** — Opponent accepts on fight detail; matching wager required; both balances escrowed
3. **Decline** — Target opponent can decline direct challenges
4. **Results** — Fighters report win/loss/dispute (confirmation + payout logic expandable)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run db:push` | Sync Prisma schema to database |
| `npm run db:seed` | Seed approved arenas |
| `npm run build` | Production build |

## Multi-server (one deployment)

| Role | URL |
|------|-----|
| **Hub** (server selector) | `arenamc.xyz` |
| CityRP arena | `crp.arenamc.xyz` — CRP ($) |
| DistrictRP arena | `drp.arenamc.xyz` — NPF (ƒ) |

The apex domain shows a premium hub landing page only. Arena routes (`/schedule`, `/wallet`, etc.) redirect to `/` on the hub.

Retired hosts (`dc`, `sc`, `sw`, `swc`) redirect to the hub.

Local dev:
- **`http://localhost:3000`** — CityRP arena (default)
- **`http://127.0.0.1:3000`** — hub (server selector)
- **`http://127.0.0.1:3000/hub`** — hub on any host
- **`http://localhost:3000?server=drp`** — switch to DistrictRP locally

Use **`http://`**, not `https://`. Safari may force HTTPS for `arenamc.xyz` (HSTS from production) — use `localhost` instead of `https://arenamc.xyz:3000`.

**Vercel:** Add wildcard domain `*.arenamc.xyz` (plus apex if needed) on the same project. Subdomain routing is handled in `src/middleware.ts` via `x-arenamc-server-id`.

Users are isolated per server (`discordId` + `serverId`). The same Discord account can have separate profiles on each arena.

After deploy, run `npm run db:seed` to create arenas for all servers.

## Admin

Set `ADMIN_DISCORD_ID` in `.env`, sign in on each subdomain, then visit `/admin` after your user exists in the database for that server.

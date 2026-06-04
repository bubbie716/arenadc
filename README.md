# ArenaMC

DemocracyCraft Minecraft PvP challenge platform — schedule fights, escrow equal RMD wagers, confirm results, and resolve disputes with recordings.

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
   - `https://dc.arenamc.xyz/api/auth/callback/discord`
   - `https://sc.arenamc.xyz/api/auth/callback/discord`
   - `https://sw.arenamc.xyz/api/auth/callback/discord`

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

Discord login returns to the **same subdomain** you started on (`dc` / `sc` / `sw`). Sessions are host-scoped (separate cookies per subdomain).

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
| DemocracyCraft arena | `dc.arenamc.xyz` — RMD ($) |
| StateCraft arena | `sc.arenamc.xyz` — ALP (£) |
| Stoneworks arena | `sw.arenamc.xyz` — SWC ($) |

The apex domain shows a premium hub landing page only. Arena routes (`/schedule`, `/wallet`, etc.) redirect to `/` on the hub.

Local dev: `localhost` loads the **dc** arena app. To preview the hub locally, map `arenamc.xyz` → `127.0.0.1` in `/etc/hosts` and open `http://arenamc.xyz:3000`.

**Vercel:** Add wildcard domain `*.arenamc.xyz` (plus apex if needed) on the same project. Subdomain routing is handled in `src/middleware.ts` via `x-arenamc-server-id`.

Users are isolated per server (`discordId` + `serverId`). The same Discord account can have separate DC, SC, and SW profiles.

After deploy, run `npm run db:seed` to create arenas for all three servers.

## Admin

Set `ADMIN_DISCORD_ID` in `.env`, sign in on each subdomain, then visit `/admin` after your user exists in the database for that server.

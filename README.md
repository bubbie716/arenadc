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
   - Redirect URL: `http://localhost:3000/api/auth/callback/discord`
   - `BLOB_READ_WRITE_TOKEN` — required on Vercel for deposit proof uploads ([Vercel Blob](https://vercel.com/docs/storage/vercel-blob); local dev uses `public/uploads/` when unset)

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

## Admin

Set `ADMIN_DISCORD_ID` in `.env`, sign in, then visit `/admin` after your user exists in the database.

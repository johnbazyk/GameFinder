# GameFinder — Family Social Gaming Platform
## Build brief for Claude Code (GitHub + Supabase + Netlify)

This is the **source of truth** for the next phase. You have the GitHub repo, a Supabase project, and Netlify. **Build in the repo. Do not rewrite the product from scratch.**

Grok Build already shipped a working TanStack Start app (wizard, catalog, vault, Finn coach, Better Auth, groups, Bank + four boards, +N family scoring) on a Grok preview sandbox. That sandbox uses **PGLite** and **Grok’s auth broker**. Those two things will not survive. Your job is to **move the heart of the product onto infrastructure the family owns**, then add notifications, joinable Bank, presence, and invitations.

If something already works, extend it. Do not replace Bank, the wizard, or the scoring rule.

---

## 0. How to work

1. Read this file fully before writing code.
2. Inventory the existing `src/` against §2. Confirm what is already there.
3. Land **Supabase as the system of record** first (migrations + RLS + env). Without that, family scores die when the sandbox restarts.
4. Then notifications, then joinable Bank, then presence/invites polish.
5. Keep the Finn / fox-orange / cream / night look. Bank stays a fullscreen felt table. Other boards stay cream product pages.
6. After each slice: typecheck, a happy-path play (Bank 2-player or 1-human+bot), and a Netlify preview deploy.
7. Open a PR per slice. Do not mix “move to Supabase” with “redesign Bank.”

**Do not** dump the whole codebase into chat. **Do not** depend on Grok preview, PGLite, or `GROK_AUTH_ISSUER` in production.

---

## 1. Product vision

Families (and close friend groups) use GameFinder to:

- Play simple games together, even when apart
- Keep a running family scoreboard that lasts years
- See what others are doing and jump into a live Bank game
- Build shared play history

The original **“What should we play tonight?”** wizard stays. Guest mode stays. The **heart** of the signed-in product is ongoing family play.

Tone: warm, paper and felt, Finn the fox. No emoji in chrome. Copy like: “Don’t be the 7.” “The ledger remembers forever.”

---

## 2. What is already built (do not redo)

### Recommendation (guest-safe)

- 4-step wizard, 7-dimension rubric, owned-vault-first ranking
- Catalog in `src/lib/catalog.ts` (~local, no live BGG dependency for recs)
- Vault, Discover, game pages, Finn voice coach, score pads
- Zustand persist for guest wizard/vault/plays

### Auth & social (sandbox)

- Better Auth at `/api/auth/*` (`src/lib/auth/`)
- Email/password can be enabled; Grok broker for federated preview
- Tables: `profiles`, `vault_games`, `friendships`, `play_groups`, `group_members`, `invites`, `group_plays`, `group_play_seats`, `group_activity`
- Routes: `/login`, `/circle`, `/circle/$groupId`, `/invite/$token`, `/profile`

### Family mini-games (this is the core — keep it)

| Game | Engine | UI | Notes |
|---|---|---|---|
| Bank | `src/lib/bank.ts` | `bank-table.tsx` fullscreen felt | Fair 2d6, bots Finn/Sly/Rook, auto-pass, 7 busts after 3 safe rolls |
| Connect Four | `connect4.ts` | `boards.tsx` | Seat 0 fox, seat 1 moss |
| Checkers | `checkers.ts` | English draughts, mandatory captures | |
| Chess | `chess.ts` + chess.js | Resign / draw | Pieces `text-fox` / `text-night` |
| Tic-Tac-Toe | `tictactoe.ts` | 3×3 | |

Shared model already exists:

- `game_sessions` (status waiting/active/finished, `state` JSON, **`version` for optimistic concurrency**)
- `game_session_players` (seat)
- `family_scores` (group_id, user_id, points, games_played, wins)
- Server: `src/lib/minigames/server.ts` — `createMiniSession`, `playMiniAction`, `getMiniSession`, `listMiniSessions`, `listFamilyScores`
- Scoring pipeline `finishIfNeeded`: winner gets **+N where N = player count (bots count toward N, bots never receive points)**; draws award 0; writes `group_plays` + `group_activity`

Dice: `src/lib/dice.ts` — CSPRNG + rejection sampling, **server-authoritative** on roll.

### Design system (`src/styles.css` `@theme`)

| Token | Hex | Use |
|---|---|---|
| fox / fox-deep | `#e8642b` / `#c44d1a` | Primary CTA |
| cream / cream-deep | `#fbf6ef` / `#f3eadc` | Paper |
| night / night-soft | `#1a1a2e` / `#2a2a44` | Ink |
| moss | `#4a6b4d` | Felt, owned, seat 1 |
| berry | `#a63d57` | Bust, destructive |
| sky | `#7fa8c9` | Links |
| display | Fraunces | Titles, scores (`tabular-nums` + `tnum`) |
| sans | Nunito Sans | Body |
| radius-card / button | 1.25rem / 0.875rem | Paper vs CTA |

`Button` (`rounded-button`) is the primary CTA. Bank is `position: fixed; 100dvh; z-60` and covers the header. Other `/play` games keep the GameFinder header and cream padding.

### Stack today

TanStack Start + Router, React 19, Tailwind v4, Zustand, Better Auth, PGLite **or** `DATABASE_URL` Postgres (`src/lib/db.ts`), Netlify-shaped Vite build.

---

## 3. What is missing (this is the work)

1. **Durable database** — family scores and sessions on **Supabase Postgres**, not PGLite.
2. **Auth the family owns** — Better Auth against Supabase, email + Google (or Magic Link). No Grok broker in production.
3. **Row Level Security** — defense in depth even though TanStack server functions already call `requireMember`.
4. **Notifications** — in-app + Web Push: invite, your turn, joinable Bank, game finished, optional activity.
5. **Joinable live Bank** — family members can sit down after the game started.
6. **Presence** — “Ellie is online”, “Liam is in a game.”
7. **Invite to play / challenge** — from a member row or the group page, one-tap join.
8. **Realtime** — stop relying on 1.6s poll as the only sync (keep poll as fallback).
9. **Deep links** that work from a push tap: `/play/$sessionId`, `/circle/$groupId`, `/invite/$token`.

Stripe is **out of scope** for this pass. `profiles.plan` and `play_groups.plan` already exist — do not invent a billing UI.

---

## 4. Scoring rule (frozen)

Every **finished group mini-game**:

- Winner receives **+N** points, **N = number of seats** (humans + bots).
- Draw → 0 points, no winner.
- Only games inside a Group/Family count.
- Bots (ids `bot:finn`, `bot:sly`, `bot:rook`) **never** receive family points and **are not rows** in `family_scores`. They still inflate N.
- Idempotent: finishing a session twice must not double-award. Guard with `status = 'active'` on the finish update, or a unique `(session_id)` on a `family_score_events` table.

Examples: 1v1 win → +2 if you count both seats (current code uses `playerIds.length`). **Keep current behavior:** N = `playerIds.length` (2 for 1v1). If product later wants “1v1 → +1”, that is a deliberate change — **do not silently change N**.

Current code in `finishIfNeeded` (`src/lib/minigames/server.ts`) is the reference implementation. When you add notifications, hook them **there**, in the same transaction if possible.

---

## 5. Long-term survivability (non-negotiable)

The Grok sandbox will go away. Design so a family still has their ledger in five years.

### 5.1 System of record

| Concern | Production | Preview/dev only |
|---|---|---|
| Postgres | **Supabase** (`DATABASE_URL` = pooler URI) | PGLite if `DATABASE_URL` unset |
| Auth sessions | Better Auth tables **in that same Postgres** | Same |
| Files / git | GitHub main | Local |
| App host | Netlify (TanStack Start / Vite SSR or static+functions as the repo already builds) | Grok `:8080` |
| Secrets | Netlify + Supabase env, never committed | — |

`src/lib/db.ts` already switches on `DATABASE_URL`. Point it at Supabase. Prefer the **transaction pooler** (port 6543, `?pgbouncer=true`) for serverless and the **direct** URI for migrations.

### 5.2 Migrations are the contract

- Keep numbered SQL in `migrations/`. Next file: `migrations/0004_notifications.sql`, then `0005_presence.sql` (or one file if you ship them together).
- **Additive only.** No `DROP COLUMN` in a rush. Never rewrite 0001–0003.
- Run the same files on Supabase (`supabase db push` or SQL editor) and via `scripts/migrate.mjs`.
- After apply, store a row in `_migrations` (already used).

### 5.3 Auth you own

Production env (Netlify):

```
DATABASE_URL=           # Supabase Postgres
BETTER_AUTH_URL=        # https://<production-domain>
BETTER_AUTH_SECRET=     # 32+ bytes
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=   # or skip Google until email works
VITE_AUTH_ENABLED=true
```

- Enable email/password for families (grandparents will not complete OAuth dances).
- Google is optional week-two.
- **Strip production dependence on `GROK_AUTH_ISSUER` / preview client.** Keep that path behind “no DATABASE_URL / preview host” so Grok preview can still boot, but Netlify production must not use it.
- Session cookie on the app origin. Deep links must land on the same origin.

### 5.4 RLS (even with server functions)

TanStack `createServerFn` + `requireMember` is the app’s authorization today. That is not enough if anyone ever uses the Supabase anon key.

Enable RLS on every family table. Pattern:

```sql
alter table game_sessions enable row level security;

-- Helper: current auth uid. Better Auth user ids are TEXT.
-- If you keep Better Auth (recommended this phase), the Supabase JWT may NOT
-- be the same id. Then: do NOT expose these tables via anon key at all.
-- RLS still documents the rule; the API is only server-side (service role
-- or DATABASE_URL with a server role).
```

**Decision for this phase (pick and write it in the PR):**

- **A (recommended):** App talks to Postgres only from the server (`DATABASE_URL` as a server role). Anon key is unused for game data. RLS is still enabled, policies match `group_members`. Service role only in server functions / migrate.
- **B:** Migrate auth to Supabase Auth so `auth.uid()` matches `user_id`. Then the client may subscribe to Realtime under RLS.

Do **not** mix Better Auth user ids with `auth.uid()` without a mapping table.

Realtime can still work with option A: server issues a short-lived channel token, or you poll + optional Supabase Realtime on a `session_id` topic using the service role to broadcast.

### 5.5 Idempotent scoring

Add one of:

```sql
-- Preferred: event log
create table family_score_events (
  session_id text primary key references game_sessions(id),
  group_id text not null,
  winner_id text,
  points int not null,
  created_at timestamptz not null default now()
);
```

`finishIfNeeded` inserts here first; unique violation → already scored. Then update `family_scores`. This is how the ledger survives retries, double-clicks, and bot-step races.

### 5.6 Session state

- Keep `version` integer. Every `playMiniAction` is `update … where version = $expected`.
- On Supabase, migrate `state` / `settings` from `text` to `jsonb` **additively** (`state_json jsonb`) or cast in 0004 if you are sure no rows are invalid JSON. jsonb is survivable (queryable, constrainable). Text blobs are a trap.
- Never trust the client for dice or legal moves.

### 5.7 Notification outbox

Do not call OneSignal/Web Push inside the request that finishes a chess game and hope. Write rows, then a worker/function delivers.

```
notifications          -- in-app inbox (user-visible)
notification_outbox    -- delivery attempts: web_push / email, status, tries
push_subscriptions     -- Web Push endpoints
notification_prefs     -- per-type booleans
```

Netlify scheduled function or Supabase `pg_net` + Edge Function drains the outbox. Retries with backoff. This is how “your turn” still arrives after a deploy.

### 5.8 What not to put in the client

- `DATABASE_URL`, Better Auth secret, VAPID private key, service role key
- Game engines that award points without the server

Guest wizard/vault in Zustand persist is fine — that is not the family ledger.

### 5.9 Observability

Log (server, no PII beyond user id): session id, action type, version conflict, score event insert. One Netlify log search should answer “did this Bank game award +3 twice?”

### 5.10 Compatibility window

- Keep PGLite fallback when `DATABASE_URL` is unset so local/Grok preview still runs.
- Production Netlify **must** fail closed if `DATABASE_URL` or `BETTER_AUTH_SECRET` is missing (auth skill already leans this way).

---

## 6. Target data model (additions)

Keep 0001–0003. Add:

```sql
-- 0004_notifications.sql (illustrative)

create table if not exists notifications (
  id text primary key,
  user_id text not null,
  type text not null check (type in (
    'invite', 'your_turn', 'joinable', 'finished', 'activity'
  )),
  title text not null,
  body text not null,
  href text not null,             -- deep link path, e.g. /play/<id>
  group_id text,
  session_id text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx
  on notifications (user_id, created_at desc);

create table if not exists notification_prefs (
  user_id text primary key,
  invite boolean not null default true,
  your_turn boolean not null default true,
  joinable boolean not null default true,
  finished boolean not null default true,
  activity boolean not null default false
);

create table if not exists push_subscriptions (
  user_id text not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);

create table if not exists notification_outbox (
  id text primary key,
  notification_id text not null references notifications(id) on delete cascade,
  channel text not null check (channel in ('web_push', 'email')),
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  tries int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists outbox_pending_idx
  on notification_outbox (status, created_at)
  where status = 'pending';

create table if not exists family_score_events (
  session_id text primary key references game_sessions(id),
  group_id text not null,
  winner_id text,
  points int not null,
  created_at timestamptz not null default now()
);

-- Joinable Bank
alter table game_sessions
  add column if not exists joinable boolean not null default false;

-- Presence
create table if not exists presence (
  user_id text primary key,
  last_seen timestamptz not null default now(),
  status text not null default 'online'
    check (status in ('online', 'idle', 'in_game')),
  current_session_id text,
  current_group_id text
);
```

Set `joinable = true` for Bank while `status in ('waiting','active')` and seats < max (8). Flip false on finish or when full.

---

## 7. Notifications (essential)

### Triggers

| Type | When | Push? | Deep link |
|---|---|---|---|
| `invite` | Challenge / “invite to play” | Yes | `/play/$id` or `/circle/$groupId` |
| `your_turn` | `current_turn_user_id` changes to them (not bots) | Yes | `/play/$id` |
| `joinable` | Bank (or later joinable game) starts or becomes joinable | Yes | `/play/$id` |
| `finished` | Session they sat in ends | Yes | `/play/$id` |
| `activity` | Optional: scoreboard climb / logged night | Pref default **off** | `/circle/$groupId` |

Copy examples:

- Joinable: “Ellie started Bank — join now.”
- Your turn: “Your dice in Bank vs Finn and Sly.”
- Finished: “Maya won Bank (+3).”

### Delivery

Phase 1 (this pass):

1. Insert `notifications` for each recipient (skip self where it would be noise; **do** notify on finished including yourself).
2. In-app bell on the header (`AuthChip` area) with unread count.
3. Web Push via VAPID (`web-push` library) from the outbox drain. Prompt for permission on first “Your turn” or from Profile → Notifications.
4. Prefs on `/profile`.

Phase 2 (if Web Push on iOS PWA is painful): OneSignal or FCM. Same `notifications` rows; swap the outbox adapter. **Do not** put OneSignal into the scoring function.

Polling: `GET` unread every 20s when the tab is focused, plus Realtime later. Play session already polls ~1.6s — do not add a second tight poll for the same session.

### Recipients

- `your_turn`: the new `current_turn_user_id` if human
- `joinable`: all `group_members` except the starter
- `finished`: all human seats
- `invite`: the challenged user

Honor `notification_prefs`. Never notify bots.

---

## 8. Joinable Bank

Today `createMiniSession` seats a closed list. Change:

1. Bank may start with 2–8. `joinable=true` while active and `count(players) < 8`.
2. `joinMiniSession({ sessionId })` — must be a group member, not already seated, game_type bank, joinable.
3. Engine: add a player with score 0. If they join mid-round, they sit out **this** round (`bankedIds` includes them) or wait for `need-roll` of next round — pick **wait for next round** (simpler, fair). Document it in the UI: “You’re in next round.”
4. Notify the table in `lastLine` and the activity feed.
5. Group page: live row “Ellie started Bank — Join” → `/play/$id`.
6. Bots already seated stay. New humans take empty seats.

Connect Four / Checkers / Chess / Tic-Tac-Toe stay **not** joinable (fixed 2).

---

## 9. Presence & social polish

- Heartbeat: client calls `touchPresence` every 30s while signed in; `status=in_game` while on `/play/$sessionId`.
- Online = `last_seen` within 45s.
- Group page member list: color dot + “in Bank” if `current_session_id` set.
- “Invite to play” on a member: creates a `waiting` session with you + them (or a challenge notification that starts on accept). For Bank, also offer “open to the table” (`joinable`).
- Activity feed already exists (`group_activity`). Use it; don’t build a second feed.

---

## 10. Implementation order (do this order)

### Slice 0 — Repo + Supabase + Netlify (survivability)

- Connect GitHub repo; Netlify deploy from `main`.
- Create Supabase project (us-east-1 is fine).
- Set `DATABASE_URL` (transaction pooler) on Netlify.
- Run `migrations/0001`–`0003` on Supabase. Confirm Better Auth tables exist (`migrations/auth` / 0001).
- Production sign-in with email/password against that DB.
- Smoke: create group, start Bank vs Finn, finish a tiny game, `family_scores` row visible after deploy/restart.

**Exit criterion:** restarting Netlify does not wipe scores.

### Slice 1 — Score events + jsonb (hardening)

- `family_score_events`
- Finish path uses it
- Optional `jsonb` for `game_sessions.state`

### Slice 2 — Notifications

- 0004 schema, prefs UI, in-app inbox, your_turn + finished wired from `playMiniAction` / `finishIfNeeded`
- Web Push outbox + Netlify function drain
- Deep links

### Slice 3 — Joinable Bank

- `joinable` column, join server fn, group-page CTA, `joinable` notifications

### Slice 4 — Presence + invite-to-play

- `presence` table, member dots, challenge flow

### Slice 5 — Realtime (optional same week)

- Broadcast session version on action; client invalidates poll. Poll remains fallback.

Do **not** start on new game types (Yahtzee, etc.) until slices 0–3 work in production.

---

## 11. File map (where to touch)

| Path | Role |
|---|---|
| `migrations/*.sql` | Schema |
| `scripts/migrate.mjs` | Apply |
| `src/lib/db.ts` | Postgres vs PGLite |
| `src/lib/auth/server.ts` | Better Auth — production providers |
| `src/lib/minigames/server.ts` | Sessions, finish, **hook notifications here** |
| `src/lib/minigames/apply.ts` | Dispatch |
| `src/lib/bank.ts` | Pure Bank FSM — add join-next-round carefully |
| `src/lib/dice.ts` | Fair dice — do not move to the client |
| `src/lib/minigames/bots.ts` | Finn / Sly / Rook |
| `src/components/minigames/*` | UI |
| `src/routes/play.$sessionId.tsx` | Play shell |
| `src/routes/circle.$groupId.tsx` | Table: scores, start, **join CTA, presence** |
| `src/routes/profile.tsx` | Notification prefs |
| `src/styles.css` | Tokens |
| `src/lib/social.ts` | Groups, invites, activity |

Pure engines stay pure (no SQL, no fetch). Side effects only in `server.ts`.

---

## 12. Bank rules (reference)

- Shared pot, two dice, pass around.
- First **three** rolls of a round: 7 = **+70** (not a bust). Doubles = face value only.
- From roll 4: doubles **double** the pot. **7 = bust** — pot 0, anyone who has not banked scores nothing this round.
- Bank at any time after a roll (while still in); sit the rest of the round.
- Rounds: 10 / 15 / 20. Highest total wins +N family points.
- Dice pass automatically after a short Bank window (do not bring back “Pass the dice”).
- Bust UI must **show 0** for ~2s before next round.

House bots (Bank only): Finn (banks early), Sly (greedy), Rook (EV / protect a lead).

---

## 13. UX constraints (from the visual audit — keep)

- Bank: fullscreen moss felt, header covered, Leave ≥44px, scores on seats.
- Other games: GameFinder header + `max-w-3xl px-4` cream page. Seat dots fox/moss.
- Connect Four drop controls are chevron icons, not the word “Drop.”
- Chess glyphs `text-fox` / `text-night` (dark mode).
- No raw hex in JSX; use tokens or `PLAYER_COLORS`.
- No new emoji in chrome.

---

## 14. Env checklist (Netlify)

```
DATABASE_URL=
BETTER_AUTH_URL=https://<prod-domain>
BETTER_AUTH_SECRET=
VITE_AUTH_ENABLED=true
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:family@<domain>
```

Optional later: `ONESIGNAL_APP_ID`, `STRIPE_SECRET_KEY` — do not add unused SDKs.

Supabase dashboard: disable the anon key for these tables (or RLS deny-all for anon). Server uses `DATABASE_URL`.

---

## 15. Test plan (minimum)

- Two real users in one family group (two browsers).
- Bank: P1 starts joinable, P2 joins from notification/CTA, both see the same pot, a Danger 7 shows BUST 0, finish awards **+N** once (reload, confirm scores unchanged).
- Restart Netlify / reconnect DB: scores still there.
- Your-turn push (or in-app) when P1 passes to P2.
- Prefs: turn off `your_turn`, confirm no new notif.
- Guest wizard still works signed-out (no regression).
- Chess dark mode: pieces visible.

---

## 16. Suggested Claude Code prompt

Paste this with the file:

> Implement GameFinder as a durable family social gaming platform per GAMEFINDER_FAMILY_PLATFORM.md.
> I have GitHub, Supabase, and Netlify connected.
> Slice 0 first: production Postgres + auth the family owns, existing migrations applied, family_scores survive a redeploy.
> Then Slice 1–3: score events, notifications (in-app + Web Push outbox), joinable Bank.
> Do not rewrite Bank, the wizard, or the +N rule. Do not use PGLite or the Grok auth broker in production.
> Keep the Finn aesthetic. Open a PR per slice.

---

## 17. Questions to resolve in the first PR description (not in chat)

1. Production domain (Netlify).
2. Auth: email-only vs email+Google this week.
3. Web Push vs delay push until in-app inbox is live (inbox must ship either way).
4. Confirm N = `playerIds.length` (including bots).

If those are unspecified: email+password this week, in-app inbox + Web Push outbox, N unchanged.

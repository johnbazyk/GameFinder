import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { applyAction, initState } from "./apply";
import { botColor, botLabel, isBot, nextBankBotAction } from "./bots";
import { nextStockpileBotAction, type StockpileState } from "./stockpile";
import { DEFAULT_PIECE_COLOR, normalizePieceColor } from "@/lib/piece-color";
import { PLAYER_COLORS } from "@/lib/types";
import { roll2d6 } from "@/lib/dice";
import { MINI_GAMES, type MiniAction, type MiniGameType } from "./types";
import type { BankState } from "@/lib/bank";

export type SessionPlayer = { userId: string; name: string; seat: number; color: string };

export type SessionView = {
  id: string;
  groupId: string;
  gameType: MiniGameType;
  status: "waiting" | "active" | "finished";
  currentTurnUserId: string | null;
  settings: { passPhone: boolean; rounds?: number };
  state: unknown;
  winnerId: string | null;
  pointsAwarded: number | null;
  version: number;
  lastLine: string;
  players: SessionPlayer[];
  you: string;
  dice: [number, number] | null;
};

export type FamilyScoreRow = {
  userId: string;
  name: string;
  points: number;
  gamesPlayed: number;
  wins: number;
};

export type SessionListItem = {
  id: string;
  gameType: MiniGameType;
  status: SessionView["status"];
  currentTurnUserId: string | null;
  winnerId: string | null;
  pointsAwarded: number | null;
  updatedAt: string;
  youAreIn: boolean;
  yourTurn: boolean;
};

function nid() {
  return crypto.randomUUID();
}

async function requireMember(groupId: string, userId: string) {
  const sql = await getSql();
  const rows = await sql<{ user_id: string }>`
    select user_id from group_members where group_id = ${groupId} and user_id = ${userId} limit 1
  `;
  if (!rows[0]) throw new Error("Not at this table");
}

async function namesFor(ids: string[]) {
  const sql = await getSql();
  const map = new Map<string, string>();
  for (const id of ids) {
    if (isBot(id)) {
      map.set(id, botLabel(id));
      continue;
    }
    const rows = await sql<{ display_name: string }>`
      select display_name from profiles where user_id = ${id} limit 1
    `;
    map.set(id, rows[0]?.display_name ?? "Player");
  }
  return ids.map((id) => map.get(id) ?? "Player");
}

async function colorsFor(ids: string[]) {
  const sql = await getSql();
  const map = new Map<string, string>();
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (isBot(id)) {
      map.set(id, botColor(id));
      continue;
    }
    const rows = await sql<{ piece_color: string | null }>`
      select piece_color from profiles where user_id = ${id} limit 1
    `;
    map.set(id, normalizePieceColor(rows[0]?.piece_color, PLAYER_COLORS[i % PLAYER_COLORS.length] as typeof DEFAULT_PIECE_COLOR));
  }
  return ids.map((id, i) => map.get(id) ?? PLAYER_COLORS[i % PLAYER_COLORS.length]);
}

async function loadPlayers(sessionId: string): Promise<SessionPlayer[]> {
  const sql = await getSql();
  const rows = await sql<{ user_id: string; seat: number; display_name: string; piece_color: string | null }>`
    select p.user_id, p.seat, coalesce(pr.display_name, 'Player') as display_name, pr.piece_color
    from game_session_players p
    left join profiles pr on pr.user_id = p.user_id
    where p.session_id = ${sessionId}
    order by p.seat
  `;
  return rows.map((r, i) => ({
    userId: r.user_id,
    name: isBot(r.user_id) ? botLabel(r.user_id) : r.display_name,
    seat: Number(r.seat),
    color: isBot(r.user_id)
      ? botColor(r.user_id)
      : normalizePieceColor(r.piece_color, PLAYER_COLORS[i % PLAYER_COLORS.length] as typeof DEFAULT_PIECE_COLOR),
  }));
}

async function finishIfNeeded(
  sessionId: string,
  groupId: string,
  gameType: MiniGameType,
  result: { finished: boolean; winnerId: string | null; lastLine: string },
  playerIds: string[],
) {
  if (!result.finished) return { pointsAwarded: null as number | null };
  const sql = await getSql();
  const humans = playerIds.filter((id) => !isBot(id));
  const points = result.winnerId && !isBot(result.winnerId) ? playerIds.length : 0;
  await sql`
    update game_sessions
    set status = 'finished', winner_id = ${result.winnerId}, points_awarded = ${points || null},
        current_turn_user_id = null, updated_at = now()
    where id = ${sessionId}
  `;
  for (const uid of humans) {
    await sql`
      insert into family_scores (group_id, user_id, points, games_played, wins)
      values (${groupId}, ${uid}, 0, 1, 0)
      on conflict (group_id, user_id) do update set
        games_played = family_scores.games_played + 1
    `;
  }
  if (result.winnerId && points && !isBot(result.winnerId)) {
    await sql`
      insert into family_scores (group_id, user_id, points, games_played, wins)
      values (${groupId}, ${result.winnerId}, ${points}, 0, 1)
      on conflict (group_id, user_id) do update set
        points = family_scores.points + ${points},
        wins = family_scores.wins + 1
    `;
  }
  const label = MINI_GAMES[gameType].label;
  const winnerName = result.winnerId ? (await namesFor([result.winnerId]))[0] : null;
  const body = winnerName
    ? `${winnerName} won ${label}${points ? ` (+${points})` : ""}.`
    : `${label} ended in a draw.`;
  const logger = humans[0] ?? playerIds[0];
  await sql`
    insert into group_activity (id, group_id, user_id, kind, body)
    values (${nid()}, ${groupId}, ${logger}, 'play', ${body})
  `;
  const playId = nid();
  await sql`
    insert into group_plays (id, group_id, logger_id, bgg_id, notes)
    values (${playId}, ${groupId}, ${logger}, ${gameType}, ${body})
  `;
  let seat = 0;
  for (const uid of playerIds) {
    const name = (await namesFor([uid]))[0];
    await sql`
      insert into group_play_seats (play_id, seat, player_name, user_id, total, won)
      values (${playId}, ${seat}, ${name}, ${uid}, ${uid === result.winnerId ? points : 0}, ${uid === result.winnerId})
    `;
    seat += 1;
  }
  return { pointsAwarded: points || null };
}

export const createMiniSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { groupId: string; gameType: MiniGameType; playerIds: string[]; rounds?: number }) => ({
    groupId: String(input?.groupId ?? ""),
    gameType: input?.gameType,
    playerIds: Array.from(new Set((input?.playerIds ?? []).map(String))),
    rounds: input?.rounds,
  }))
  .handler(async ({ context, data }) => {
    const meta = MINI_GAMES[data.gameType];
    if (!meta) throw new Error("Unknown game");
    if (!data.groupId) throw new Error("Missing table");
    await requireMember(data.groupId, context.userId);
    if (!data.playerIds.includes(context.userId)) {
      data.playerIds.unshift(context.userId);
    }
    if (data.playerIds.length < meta.min || data.playerIds.length > meta.max) {
      throw new Error(`${meta.label} needs ${meta.min}–${meta.max} players`);
    }
    const sql = await getSql();
    for (const uid of data.playerIds) {
      if (!isBot(uid)) await requireMember(data.groupId, uid);
    }
    const names = await namesFor(data.playerIds);
    const colors = await colorsFor(data.playerIds);
    const settings = { passPhone: meta.passPhone, rounds: data.rounds ?? 15 };
    const state = initState(data.gameType, data.playerIds, names, settings, colors);
    const id = nid();
    const turn = data.playerIds[0];
    await sql`
      insert into game_sessions (id, group_id, game_type, status, created_by, current_turn_user_id, settings, state)
      values (
        ${id}, ${data.groupId}, ${data.gameType}, 'active', ${context.userId}, ${turn},
        ${JSON.stringify(settings)}, ${JSON.stringify(state)}
      )
    `;
    let seat = 0;
    for (const uid of data.playerIds) {
      await sql`
        insert into game_session_players (session_id, user_id, seat)
        values (${id}, ${uid}, ${seat})
      `;
      seat += 1;
    }
    return { id };
  });

export const getMiniSession = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { sessionId: string }) => ({ sessionId: String(input?.sessionId ?? "") }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      group_id: string;
      game_type: MiniGameType;
      status: SessionView["status"];
      current_turn_user_id: string | null;
      settings: string;
      state: string;
      winner_id: string | null;
      points_awarded: number | null;
      version: number;
    }>`
      select id, group_id, game_type, status, current_turn_user_id, settings, state,
        winner_id, points_awarded, version
      from game_sessions where id = ${data.sessionId} limit 1
    `;
    const row = rows[0];
    if (!row) throw new Error("Game gone");
    await requireMember(row.group_id, context.userId);
    const players = await loadPlayers(row.id);
    const parsed = JSON.parse(row.state) as { lastLine?: string; dice?: [number, number] };
    return {
      id: row.id,
      groupId: row.group_id,
      gameType: row.game_type,
      status: row.status,
      currentTurnUserId: row.current_turn_user_id,
      settings: JSON.parse(row.settings) as SessionView["settings"],
      state: JSON.parse(row.state),
      winnerId: row.winner_id,
      pointsAwarded: row.points_awarded == null ? null : Number(row.points_awarded),
      version: Number(row.version),
      lastLine: parsed.lastLine ?? "",
      players,
      you: context.userId,
      dice: parsed.dice ?? null,
    } satisfies SessionView;
  });

export const listMiniSessions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { groupId: string }) => ({ groupId: String(input?.groupId ?? "") }))
  .handler(async ({ context, data }) => {
    await requireMember(data.groupId, context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      game_type: MiniGameType;
      status: SessionView["status"];
      current_turn_user_id: string | null;
      winner_id: string | null;
      points_awarded: number | null;
      updated_at: string;
    }>`
      select id, game_type, status, current_turn_user_id, winner_id, points_awarded, updated_at::text as updated_at
      from game_sessions where group_id = ${data.groupId}
      order by updated_at desc
      limit 20
    `;
    const mine = await sql<{ session_id: string }>`
      select session_id from game_session_players where user_id = ${context.userId}
    `;
    const set = new Set(mine.map((m) => m.session_id));
    return rows.map((r) => ({
      id: r.id,
      gameType: r.game_type,
      status: r.status,
      currentTurnUserId: r.current_turn_user_id,
      winnerId: r.winner_id,
      pointsAwarded: r.points_awarded == null ? null : Number(r.points_awarded),
      updatedAt: r.updated_at,
      youAreIn: set.has(r.id),
      yourTurn: r.current_turn_user_id === context.userId && r.status === "active",
    })) satisfies SessionListItem[];
  });

export const listFamilyScores = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { groupId: string }) => ({ groupId: String(input?.groupId ?? "") }))
  .handler(async ({ context, data }) => {
    await requireMember(data.groupId, context.userId);
    const sql = await getSql();
    const rows = await sql<{
      user_id: string;
      display_name: string;
      points: number;
      games_played: number;
      wins: number;
    }>`
      select s.user_id, coalesce(p.display_name, 'Player') as display_name,
        s.points, s.games_played, s.wins
      from family_scores s
      left join profiles p on p.user_id = s.user_id
      where s.group_id = ${data.groupId}
      order by s.points desc, s.wins desc
    `;
    return rows.map((r) => ({
      userId: r.user_id,
      name: r.display_name,
      points: Number(r.points),
      gamesPlayed: Number(r.games_played),
      wins: Number(r.wins),
    })) satisfies FamilyScoreRow[];
  });

export const playMiniAction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { sessionId: string; version: number; action: MiniAction }) => ({
    sessionId: String(input?.sessionId ?? ""),
    version: Number(input?.version) || 0,
    action: input?.action,
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      group_id: string;
      game_type: MiniGameType;
      status: string;
      current_turn_user_id: string | null;
      settings: string;
      state: string;
      version: number;
    }>`
      select id, group_id, game_type, status, current_turn_user_id, settings, state, version
      from game_sessions where id = ${data.sessionId} limit 1
    `;
    const row = rows[0];
    if (!row) throw new Error("Game gone");
    if (row.status !== "active") throw new Error("Game already finished");
    await requireMember(row.group_id, context.userId);
    const players = await loadPlayers(row.id);
    const playerIds = players.map((p) => p.userId);
    if (!playerIds.includes(context.userId)) throw new Error("You're not in this game");
    const settings = JSON.parse(row.settings) as { passPhone: boolean };
    const passPhone = Boolean(settings.passPhone);
    let action = data.action;
    let actorId = context.userId;
    if (action.type === "bot-step") {
      if (row.game_type === "bank") {
        const step = nextBankBotAction(JSON.parse(row.state) as BankState);
        if (!step) return { ok: true as const, dice: null, lastLine: "", pointsAwarded: null };
        action = step.action;
        actorId = step.actorId;
      } else if (row.game_type === "stockpile") {
        const s = JSON.parse(row.state) as StockpileState;
        const botId = playerIds[s.turn];
        if (!botId || !isBot(botId)) return { ok: true as const, dice: null, lastLine: "", pointsAwarded: null };
        const step = nextStockpileBotAction(s);
        if (!step) return { ok: true as const, dice: null, lastLine: "", pointsAwarded: null };
        action = step;
        actorId = botId;
      } else {
        throw new Error("No house players here");
      }
    } else {
      actorId =
        passPhone && (action.type === "roll" || action.type === "pass" || action.type === "next-round")
          ? (row.current_turn_user_id ?? context.userId)
          : passPhone && action.type === "bank" && action.playerId
            ? action.playerId
            : context.userId;
      if (!passPhone) {
        const turnLocked =
          action.type === "roll" ||
          action.type === "pass" ||
          action.type === "drop" ||
          action.type === "move" ||
          action.type === "play-card" ||
          action.type === "draw" ||
          action.type === "play-stock" ||
          action.type === "play-hand" ||
          action.type === "play-discard" ||
          action.type === "park" ||
          action.type === "next-round";
        if (turnLocked && row.current_turn_user_id && row.current_turn_user_id !== context.userId) {
          throw new Error("Wait your turn");
        }
      }
    }
    const dice: [number, number] | undefined = action.type === "roll" ? roll2d6() : undefined;
    const result = applyAction(row.game_type, JSON.parse(row.state), action, actorId, playerIds, dice);
    const stateOut = { ...(result.state as object), lastLine: result.lastLine, dice: result.dice ?? null };
    const updated = await sql<{ id: string }>`
      update game_sessions
      set state = ${JSON.stringify(stateOut)},
          current_turn_user_id = ${result.currentTurnUserId},
          version = version + 1,
          updated_at = now()
      where id = ${row.id} and version = ${data.version}
      returning id
    `;
    if (!updated.length) throw new Error("Stale — someone else moved");
    const fin = await finishIfNeeded(row.id, row.group_id, row.game_type, result, playerIds);
    return { ok: true as const, dice: result.dice ?? null, lastLine: result.lastLine, pointsAwarded: fin.pointsAwarded };
  });

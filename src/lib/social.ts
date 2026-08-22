import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export type Profile = {
  userId: string;
  displayName: string;
  avatarSeed: number;
  plan: string;
};

export type FriendRow = {
  id: string;
  otherId: string;
  displayName: string;
  status: "pending" | "accepted" | "blocked";
  incoming: boolean;
};

export type GroupRow = {
  id: string;
  name: string;
  kind: "friends" | "family";
  role: "owner" | "admin" | "member";
  shareVault: boolean;
  memberCount: number;
};

export type GroupMember = {
  userId: string;
  displayName: string;
  role: "owner" | "admin" | "member";
  shareVault: boolean;
};

export type InvitePreview = {
  token: string;
  kind: "friend" | "group";
  fromName: string;
  groupName: string | null;
  expired: boolean;
};

export type ActivityRow = {
  id: string;
  body: string;
  kind: string;
  at: string;
  displayName: string;
};

export type GroupPlayRow = {
  id: string;
  bggId: string;
  notes: string | null;
  at: string;
  loggerName: string;
  seats: { playerName: string; total: number; won: boolean }[];
};

function nid() {
  return crypto.randomUUID();
}

function token() {
  return nid().replaceAll("-", "").slice(0, 12);
}

async function ensureProfile(userId: string) {
  const sql = await getSql();
  const existing = await sql<{ user_id: string }>`
    select user_id from profiles where user_id = ${userId} limit 1
  `;
  if (existing.length) return;
  const users = await sql<{ name: string; email: string }>`
    select name, email from "user" where id = ${userId} limit 1
  `;
  const raw = users[0]?.name?.trim() || users[0]?.email?.split("@")[0] || "Player";
  const seed = Array.from(userId).reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
  await sql`
    insert into profiles (user_id, display_name, avatar_seed)
    values (${userId}, ${raw.slice(0, 32)}, ${seed})
    on conflict (user_id) do nothing
  `;
}

async function profileName(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ display_name: string }>`
    select display_name from profiles where user_id = ${userId} limit 1
  `;
  return rows[0]?.display_name ?? "A friend";
}

async function requireMember(groupId: string, userId: string) {
  const sql = await getSql();
  const rows = await sql<{ role: GroupMember["role"]; share_vault: boolean }>`
    select role, share_vault from group_members
    where group_id = ${groupId} and user_id = ${userId} limit 1
  `;
  if (!rows[0]) throw new Error("Not at this table");
  return rows[0];
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      user_id: string;
      display_name: string;
      avatar_seed: number;
      plan: string;
    }>`
      select user_id, display_name, avatar_seed, plan
      from profiles where user_id = ${context.userId} limit 1
    `;
    const r = rows[0];
    return {
      userId: r.user_id,
      displayName: r.display_name,
      avatarSeed: r.avatar_seed,
      plan: r.plan,
    } satisfies Profile;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { displayName: string }) => ({
    displayName: String(input?.displayName ?? "").trim().slice(0, 32),
  }))
  .handler(async ({ context, data }) => {
    if (!data.displayName) throw new Error("Need a name");
    await ensureProfile(context.userId);
    const sql = await getSql();
    await sql`
      update profiles
      set display_name = ${data.displayName}, updated_at = now()
      where user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const getCloudVault = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ bgg_id: string; list: string }>`
      select bgg_id, list from vault_games where user_id = ${context.userId}
    `;
    return {
      owned: rows.filter((r) => r.list === "owned").map((r) => r.bgg_id),
      wishlist: rows.filter((r) => r.list === "wishlist").map((r) => r.bgg_id),
    };
  });

export const replaceCloudVault = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { owned: string[]; wishlist: string[] }) => ({
    owned: Array.from(new Set((input?.owned ?? []).map(String))).slice(0, 400),
    wishlist: Array.from(new Set((input?.wishlist ?? []).map(String))).slice(0, 400),
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from vault_games where user_id = ${context.userId}`;
    for (const id of data.owned) {
      await sql`
        insert into vault_games (user_id, bgg_id, list)
        values (${context.userId}, ${id}, 'owned')
        on conflict do nothing
      `;
    }
    for (const id of data.wishlist) {
      await sql`
        insert into vault_games (user_id, bgg_id, list)
        values (${context.userId}, ${id}, 'wishlist')
        on conflict do nothing
      `;
    }
    return { ok: true as const };
  });

export const listFriends = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      other_id: string;
      display_name: string;
      status: FriendRow["status"];
      incoming: boolean;
    }>`
      select
        f.id,
        case when f.requester_id = ${context.userId} then f.addressee_id else f.requester_id end as other_id,
        coalesce(p.display_name, 'Player') as display_name,
        f.status,
        (f.addressee_id = ${context.userId}) as incoming
      from friendships f
      left join profiles p
        on p.user_id = case when f.requester_id = ${context.userId} then f.addressee_id else f.requester_id end
      where (f.requester_id = ${context.userId} or f.addressee_id = ${context.userId})
        and f.status <> 'blocked'
      order by f.created_at desc
    `;
    return rows.map((r) => ({
      id: r.id,
      otherId: r.other_id,
      displayName: r.display_name,
      status: r.status,
      incoming: Boolean(r.incoming),
    })) satisfies FriendRow[];
  });

export const requestFriendByEmail = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { email: string }) => ({
    email: String(input?.email ?? "").trim().toLowerCase(),
  }))
  .handler(async ({ context, data }) => {
    if (!data.email || !data.email.includes("@")) throw new Error("Need an email");
    await ensureProfile(context.userId);
    const sql = await getSql();
    const users = await sql<{ id: string }>`
      select id from "user" where lower(email) = ${data.email} limit 1
    `;
    const other = users[0]?.id;
    if (!other) throw new Error("Nobody with that email has a GameFinder account yet. Send them an invite link.");
    if (other === context.userId) throw new Error("That's you.");

    const blocked = await sql<{ id: string }>`
      select id from friendships
      where status = 'blocked'
        and (
          (requester_id = ${context.userId} and addressee_id = ${other})
          or (requester_id = ${other} and addressee_id = ${context.userId})
        )
      limit 1
    `;
    if (blocked.length) throw new Error("Can't add that person.");

    const existing = await sql<{ id: string; status: string; requester_id: string }>`
      select id, status, requester_id from friendships
      where (requester_id = ${context.userId} and addressee_id = ${other})
         or (requester_id = ${other} and addressee_id = ${context.userId})
      limit 1
    `;
    if (existing[0]?.status === "accepted") return { ok: true as const, already: true };
    if (existing[0] && existing[0].requester_id === other) {
      await sql`update friendships set status = 'accepted' where id = ${existing[0].id}`;
      return { ok: true as const, accepted: true };
    }
    if (existing[0]) return { ok: true as const, pending: true };

    await sql`
      insert into friendships (id, requester_id, addressee_id, status)
      values (${nid()}, ${context.userId}, ${other}, 'pending')
    `;
    return { ok: true as const };
  });

export const respondFriend = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; action: "accept" | "decline" | "block" }) => ({
    id: String(input?.id ?? ""),
    action: input?.action,
  }))
  .handler(async ({ context, data }) => {
    if (!data.id || !["accept", "decline", "block"].includes(data.action)) {
      throw new Error("Bad request");
    }
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      requester_id: string;
      addressee_id: string;
      status: string;
    }>`
      select id, requester_id, addressee_id, status from friendships
      where id = ${data.id}
        and (requester_id = ${context.userId} or addressee_id = ${context.userId})
      limit 1
    `;
    const row = rows[0];
    if (!row) throw new Error("Request not found");
    if (data.action === "accept") {
      if (row.addressee_id !== context.userId) throw new Error("That's not yours to accept");
      await sql`update friendships set status = 'accepted' where id = ${row.id}`;
    } else if (data.action === "decline") {
      await sql`delete from friendships where id = ${row.id}`;
    } else {
      await sql`update friendships set status = 'blocked' where id = ${row.id}`;
    }
    return { ok: true as const };
  });

export const createFriendInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const t = token();
    await sql`
      insert into invites (token, kind, from_user_id, expires_at)
      values (${t}, 'friend', ${context.userId}, now() + interval '14 days')
    `;
    return { token: t };
  });

export const listMyGroups = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      name: string;
      kind: GroupRow["kind"];
      role: GroupRow["role"];
      share_vault: boolean;
      member_count: number;
    }>`
      select g.id, g.name, g.kind, m.role, m.share_vault,
        (select count(*)::int from group_members gm where gm.group_id = g.id) as member_count
      from play_groups g
      join group_members m on m.group_id = g.id
      where m.user_id = ${context.userId}
      order by g.created_at desc
    `;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      kind: r.kind,
      role: r.role,
      shareVault: Boolean(r.share_vault),
      memberCount: Number(r.member_count),
    })) satisfies GroupRow[];
  });

export const createGroup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { name: string; kind: "friends" | "family" }) => ({
    name: String(input?.name ?? "").trim().slice(0, 40),
    kind: input?.kind === "family" ? ("family" as const) : ("friends" as const),
  }))
  .handler(async ({ context, data }) => {
    if (!data.name) throw new Error("Name the table");
    await ensureProfile(context.userId);
    const sql = await getSql();
    const id = nid();
    await sql`
      insert into play_groups (id, name, kind, owner_id)
      values (${id}, ${data.name}, ${data.kind}, ${context.userId})
    `;
    await sql`
      insert into group_members (group_id, user_id, role, share_vault)
      values (${id}, ${context.userId}, 'owner', true)
    `;
    const who = await profileName(context.userId);
    await sql`
      insert into group_activity (id, group_id, user_id, kind, body)
      values (${nid()}, ${id}, ${context.userId}, 'created', ${`${who} set the table.`})
    `;
    return { id };
  });

export const getGroup = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { groupId: string }) => ({ groupId: String(input?.groupId ?? "") }))
  .handler(async ({ context, data }) => {
    if (!data.groupId) throw new Error("Missing table");
    await requireMember(data.groupId, context.userId);
    const sql = await getSql();
    const groups = await sql<{ id: string; name: string; kind: GroupRow["kind"]; owner_id: string }>`
      select id, name, kind, owner_id from play_groups where id = ${data.groupId} limit 1
    `;
    const g = groups[0];
    if (!g) throw new Error("Table gone");
    const members = await sql<{
      user_id: string;
      display_name: string;
      role: GroupMember["role"];
      share_vault: boolean;
    }>`
      select m.user_id, coalesce(p.display_name, 'Player') as display_name, m.role, m.share_vault
      from group_members m
      left join profiles p on p.user_id = m.user_id
      where m.group_id = ${data.groupId}
      order by m.joined_at
    `;
    const activity = await sql<{
      id: string;
      body: string;
      kind: string;
      created_at: string;
      display_name: string;
    }>`
      select a.id, a.body, a.kind, a.created_at::text as created_at,
        coalesce(p.display_name, 'Player') as display_name
      from group_activity a
      left join profiles p on p.user_id = a.user_id
      where a.group_id = ${data.groupId}
      order by a.created_at desc
      limit 30
    `;
    const mine = members.find((m) => m.user_id === context.userId);
    return {
      id: g.id,
      name: g.name,
      kind: g.kind,
      role: mine?.role ?? "member",
      shareVault: Boolean(mine?.share_vault),
      members: members.map((m) => ({
        userId: m.user_id,
        displayName: m.display_name,
        role: m.role,
        shareVault: Boolean(m.share_vault),
      })) satisfies GroupMember[],
      activity: activity.map((a) => ({
        id: a.id,
        body: a.body,
        kind: a.kind,
        at: a.created_at,
        displayName: a.display_name,
      })) satisfies ActivityRow[],
    };
  });

export const createGroupInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { groupId: string }) => ({ groupId: String(input?.groupId ?? "") }))
  .handler(async ({ context, data }) => {
    const member = await requireMember(data.groupId, context.userId);
    if (member.role === "member") throw new Error("Only the host can invite");
    const sql = await getSql();
    const t = token();
    await sql`
      insert into invites (token, kind, group_id, from_user_id, expires_at)
      values (${t}, 'group', ${data.groupId}, ${context.userId}, now() + interval '14 days')
    `;
    return { token: t };
  });

export const setShareVault = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { groupId: string; share: boolean }) => ({
    groupId: String(input?.groupId ?? ""),
    share: Boolean(input?.share),
  }))
  .handler(async ({ context, data }) => {
    await requireMember(data.groupId, context.userId);
    const sql = await getSql();
    await sql`
      update group_members set share_vault = ${data.share}
      where group_id = ${data.groupId} and user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const listGroupVault = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { groupId: string }) => ({ groupId: String(input?.groupId ?? "") }))
  .handler(async ({ context, data }) => {
    await requireMember(data.groupId, context.userId);
    const sql = await getSql();
    const rows = await sql<{ bgg_id: string }>`
      select distinct v.bgg_id
      from vault_games v
      join group_members m on m.user_id = v.user_id
      where m.group_id = ${data.groupId}
        and m.share_vault = true
        and v.list = 'owned'
    `;
    return rows.map((r) => r.bgg_id);
  });

export const listGroupPlays = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { groupId: string }) => ({ groupId: String(input?.groupId ?? "") }))
  .handler(async ({ context, data }) => {
    await requireMember(data.groupId, context.userId);
    const sql = await getSql();
    const plays = await sql<{
      id: string;
      bgg_id: string;
      notes: string | null;
      played_at: string;
      logger_name: string;
    }>`
      select p.id, p.bgg_id, p.notes, p.played_at::text as played_at,
        coalesce(pr.display_name, 'Player') as logger_name
      from group_plays p
      left join profiles pr on pr.user_id = p.logger_id
      where p.group_id = ${data.groupId}
      order by p.played_at desc
      limit 50
    `;
    const seats = await sql<{
      play_id: string;
      player_name: string;
      total: number;
      won: boolean;
    }>`
      select s.play_id, s.player_name, s.total, s.won
      from group_play_seats s
      join group_plays p on p.id = s.play_id
      where p.group_id = ${data.groupId}
      order by s.seat
    `;
    const byPlay = new Map<string, GroupPlayRow["seats"]>();
    for (const s of seats) {
      const list = byPlay.get(s.play_id) ?? [];
      list.push({ playerName: s.player_name, total: Number(s.total), won: Boolean(s.won) });
      byPlay.set(s.play_id, list);
    }
    return plays.map((p) => ({
      id: p.id,
      bggId: p.bgg_id,
      notes: p.notes,
      at: p.played_at,
      loggerName: p.logger_name,
      seats: byPlay.get(p.id) ?? [],
    })) satisfies GroupPlayRow[];
  });

export const logGroupPlay = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      groupId: string;
      bggId: string;
      notes?: string;
      seats: { playerName: string; total: number; won: boolean }[];
    }) => ({
      groupId: String(input?.groupId ?? ""),
      bggId: String(input?.bggId ?? ""),
      notes: String(input?.notes ?? "").slice(0, 280) || undefined,
      seats: (input?.seats ?? [])
        .map((s) => ({
          playerName: String(s.playerName ?? "").trim().slice(0, 32),
          total: Number(s.total) || 0,
          won: Boolean(s.won),
        }))
        .filter((s) => s.playerName)
        .slice(0, 16),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireMember(data.groupId, context.userId);
    if (!data.bggId) throw new Error("Which game?");
    const sql = await getSql();
    const id = nid();
    await sql`
      insert into group_plays (id, group_id, logger_id, bgg_id, notes)
      values (${id}, ${data.groupId}, ${context.userId}, ${data.bggId}, ${data.notes ?? null})
    `;
    let seat = 0;
    for (const s of data.seats) {
      await sql`
        insert into group_play_seats (play_id, seat, player_name, total, won)
        values (${id}, ${seat}, ${s.playerName}, ${s.total}, ${s.won})
      `;
      seat += 1;
    }
    const who = await profileName(context.userId);
    await sql`
      insert into group_activity (id, group_id, user_id, kind, body)
      values (${nid()}, ${data.groupId}, ${context.userId}, 'play', ${`${who} logged a play.`})
    `;
    return { id };
  });

export const previewInvite = createServerFn({ method: "GET" })
  .validator((input: { token: string }) => ({ token: String(input?.token ?? "").trim() }))
  .handler(async ({ data }) => {
    if (!data.token) throw new Error("Missing invite");
    const sql = await getSql();
    const rows = await sql<{
      token: string;
      kind: "friend" | "group";
      group_id: string | null;
      from_user_id: string;
      expires_at: string;
    }>`
      select token, kind, group_id, from_user_id, expires_at::text as expires_at
      from invites where token = ${data.token} limit 1
    `;
    const inv = rows[0];
    if (!inv) throw new Error("Invite not found");
    await ensureProfile(inv.from_user_id);
    const fromName = await profileName(inv.from_user_id);
    let groupName: string | null = null;
    if (inv.group_id) {
      const g = await sql<{ name: string }>`select name from play_groups where id = ${inv.group_id} limit 1`;
      groupName = g[0]?.name ?? null;
    }
    const expired = new Date(inv.expires_at).getTime() < Date.now();
    return {
      token: inv.token,
      kind: inv.kind,
      fromName,
      groupName,
      expired,
    } satisfies InvitePreview;
  });

export const acceptInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { token: string }) => ({ token: String(input?.token ?? "").trim() }))
  .handler(async ({ context, data }) => {
    if (!data.token) throw new Error("Missing invite");
    await ensureProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      token: string;
      kind: "friend" | "group";
      group_id: string | null;
      from_user_id: string;
      expires_at: string;
      accepted_by: string | null;
    }>`
      select token, kind, group_id, from_user_id, expires_at::text as expires_at, accepted_by
      from invites where token = ${data.token} limit 1
    `;
    const inv = rows[0];
    if (!inv) throw new Error("Invite not found");
    if (new Date(inv.expires_at).getTime() < Date.now()) throw new Error("That invite aged out");
    if (inv.from_user_id === context.userId) throw new Error("That's your own link");

    if (inv.kind === "friend") {
      const existing = await sql<{ id: string; status: string }>`
        select id, status from friendships
        where (requester_id = ${inv.from_user_id} and addressee_id = ${context.userId})
           or (requester_id = ${context.userId} and addressee_id = ${inv.from_user_id})
        limit 1
      `;
      if (!existing[0]) {
        await sql`
          insert into friendships (id, requester_id, addressee_id, status)
          values (${nid()}, ${inv.from_user_id}, ${context.userId}, 'accepted')
        `;
      } else if (existing[0].status === "pending") {
        await sql`update friendships set status = 'accepted' where id = ${existing[0].id}`;
      } else if (existing[0].status === "blocked") {
        throw new Error("Can't add that person");
      }
      await sql`update invites set accepted_by = ${context.userId} where token = ${inv.token}`;
      return { ok: true as const, kind: "friend" as const };
    }

    if (!inv.group_id) throw new Error("Broken invite");
    await sql`
      insert into group_members (group_id, user_id, role, share_vault)
      values (${inv.group_id}, ${context.userId}, 'member', true)
      on conflict (group_id, user_id) do nothing
    `;
    const who = await profileName(context.userId);
    await sql`
      insert into group_activity (id, group_id, user_id, kind, body)
      values (${nid()}, ${inv.group_id}, ${context.userId}, 'join', ${`${who} pulled up a chair.`})
    `;
    await sql`update invites set accepted_by = ${context.userId} where token = ${inv.token}`;
    return { ok: true as const, kind: "group" as const, groupId: inv.group_id };
  });

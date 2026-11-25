import type { Sql } from "./db";

/** Public readiness reports a boolean only; never disclose environment, users or errors. */
export async function publicHealth(
  loadSql: () => Promise<Sql>,
  requirePersistent = false,
  persistent = false,
) {
  let ok = false;
  try {
    if (!requirePersistent || persistent) {
      const sql = await loadSql();
      const rows = await sql<{ n: number }>`select 1::int as n`;
      ok = rows[0]?.n === 1;
      if (ok && requirePersistent) {
        const schema = await sql<{ ready: boolean }>`
          select to_regclass('public.profiles') is not null
            and to_regclass('public.catalog_games') is not null
            and to_regclass('public.billing_subscriptions') is not null
            and to_regclass('public.billing_webhook_events') is not null
            and to_regclass('public."user"') is not null as ready
        `;
        ok = schema[0]?.ready === true;
      }
    }
  } catch {
    ok = false;
  }
  return new Response(JSON.stringify({ ok }), {
    status: ok ? 200 : 503,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

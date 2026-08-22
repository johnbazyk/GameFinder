import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { peekDbUser } from "@/lib/pg-pool";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const out: Record<string, unknown> = {
          ok: false,
          version: "voice-1",
          hasDatabaseUrl: Boolean(process.env.DATABASE_URL?.trim()),
          hasAuthSecret: Boolean(process.env.BETTER_AUTH_SECRET?.trim()),
          hasXaiKey: Boolean(process.env.XAI_API_KEY?.trim()),
          authUrl: process.env.BETTER_AUTH_URL ?? null,
          dbUser: peekDbUser(process.env.DATABASE_URL),
        };
        try {
          const sql = await getSql();
          const ping = await sql`select 1::int as n`;
          out.db = ping[0] ?? null;
          try {
            const users = await sql`select count(*)::int as n from "user"`;
            out.users = users[0] ?? null;
          } catch (err) {
            out.userTable = err instanceof Error ? err.message : String(err);
          }
          out.ok = true;
        } catch (err) {
          out.error = err instanceof Error ? err.message : String(err);
        }
        return new Response(JSON.stringify(out), {
          status: out.ok ? 200 : 503,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});

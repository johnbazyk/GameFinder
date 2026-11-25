import { createFileRoute } from "@tanstack/react-router";
import { dbSource, getSql } from "@/lib/db";
import { publicHealth } from "@/lib/public-health.server";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: () =>
        publicHealth(
          getSql,
          process.env.NETLIFY === "true" || process.env.GAMEFINDER_REQUIRE_PERSISTENT_DB === "1",
          dbSource === "neon",
        ),
    },
  },
});

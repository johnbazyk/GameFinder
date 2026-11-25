import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

async function handle(request: Request) {
  try {
    return await auth.handler(request);
  } catch (err) {
    console.error("[auth] handler failed", err instanceof Error ? err.name : "UnknownError");
    return new Response(
      JSON.stringify({
        message: "Authentication is temporarily unavailable.",
        code: "AUTH_HANDLER",
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});

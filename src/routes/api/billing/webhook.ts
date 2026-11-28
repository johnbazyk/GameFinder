import { createFileRoute } from "@tanstack/react-router";
import { verifyStripeEvent } from "@/lib/stripe-webhook.server";
import { processStripeEvent } from "@/lib/stripe-event-handler.server";
import { withSqlTransaction } from "@/lib/db";

export const Route = createFileRoute("/api/billing/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Explicitly disabled until a separately reviewed test-mode activation.
        const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
        const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
        const prices = [
          process.env.STRIPE_PRICE_MONTHLY?.trim(),
          process.env.STRIPE_PRICE_YEARLY?.trim(),
        ];
        if (
          process.env.GAMEFINDER_STRIPE_TEST_WEBHOOK !== "1" ||
          !key.startsWith("sk_test_") ||
          !secret.startsWith("whsec_") ||
          !process.env.DATABASE_URL?.trim() ||
          prices.some((p) => !p || !/^price_[a-zA-Z0-9]+$/.test(p)) ||
          prices[0] === prices[1]
        )
          return new Response("Billing webhook unavailable", { status: 503 });
        const declared = Number(request.headers.get("content-length") ?? 0);
        if (!Number.isFinite(declared) || declared > 1000000)
          return new Response("Payload too large", { status: 413 });
        let event;
        try {
          const reader = request.body?.getReader();
          if (!reader) throw new Error("Missing body");
          const chunks: Uint8Array[] = [];
          let count = 0;
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            count += value.byteLength;
            if (count > 1000000) {
              await reader.cancel();
              return new Response("Payload too large", { status: 413 });
            }
            chunks.push(value);
          }
          const raw = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
            Buffer.concat(chunks),
          );
          event = verifyStripeEvent(raw, request.headers.get("stripe-signature") ?? "", secret);
          if (event.livemode) throw new Error("Live events disabled");
        } catch {
          return new Response("Invalid webhook", { status: 400 });
        }
        try {
          await withSqlTransaction((sql) =>
            processStripeEvent(
              sql,
              event,
              async (path) => {
                const response = await fetch("https://api.stripe.com/v1/" + path, {
                  headers: { Authorization: "Bearer " + key },
                  signal: AbortSignal.timeout(10000),
                });
                if (!response.ok) throw new Error("Provider request failed");
                return await response.json();
              },
              prices as string[],
              false,
            ),
          );
          return new Response("OK");
        } catch {
          return new Response("Reconciliation unavailable", { status: 503 });
        }
      },
    },
  },
});

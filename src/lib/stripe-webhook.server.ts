import { createHmac, timingSafeEqual } from "node:crypto";

// Verify exact bytes before parsing. A verified event is a reconciliation
// trigger, not by itself proof of a paid service period.
export function verifyStripeEvent(
  raw: string,
  signature: string,
  secret: string,
  now = Date.now(),
) {
  if (
    !secret.startsWith("whsec_") ||
    !Number.isFinite(now) ||
    raw.length > 1000000 ||
    signature.length > 4096
  )
    throw new Error("Invalid webhook");
  const parts = signature.split(",").map((p) => p.split("="));
  const times = parts.filter((p) => p[0] === "t").map((p) => p[1]);
  const signatures = parts.filter((p) => p[0] === "v1").map((p) => p[1]);
  if (
    times.length !== 1 ||
    !/^\d{1,12}$/.test(times[0]) ||
    Math.abs(now / 1000 - Number(times[0])) > 300
  )
    throw new Error("Invalid webhook timestamp");
  const expected = createHmac("sha256", secret)
    .update(times[0] + "." + raw, "utf8")
    .digest();
  if (
    !signatures.some(
      (s) =>
        typeof s === "string" &&
        /^[a-f0-9]{64}$/i.test(s) &&
        timingSafeEqual(expected, Buffer.from(s, "hex")),
    )
  )
    throw new Error("Invalid webhook signature");
  const event = JSON.parse(raw);
  if (
    !event ||
    typeof event !== "object" ||
    !/^evt_[a-zA-Z0-9]+$/.test(event.id ?? "") ||
    typeof event.type !== "string" ||
    typeof event.livemode !== "boolean" ||
    !Number.isSafeInteger(event.created) ||
    event.created < 0 ||
    !event.data?.object
  )
    throw new Error("Invalid webhook event");
  return event as {
    id: string;
    type: string;
    livemode: boolean;
    created: number;
    data: { object: Record<string, unknown> };
  };
}

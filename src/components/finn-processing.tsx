import { FoxAvatar, type FoxMood } from "./fox-avatar";

/** A genuine busy state, never a timed animation pretending to be progress. */
export function FinnProcessing({
  title,
  detail,
  mood = "sniffing",
}: {
  title: string;
  detail?: string;
  mood?: FoxMood;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-3 px-4 py-6 text-center"
    >
      <FoxAvatar mood={mood} size="lg" />
      <p className="font-display text-xl">{title}</p>
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      <div aria-hidden="true" className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/3 rounded-full bg-fox motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

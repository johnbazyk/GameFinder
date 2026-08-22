import { FoxAvatar, type FoxMood } from "./fox-avatar";
import { Button } from "./ui/button";

export function EmptyState({
  mood,
  title,
  body,
  cta,
  onCta,
}: {
  mood: FoxMood;
  title: string;
  body: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <FoxAvatar mood={mood} size="lg" />
      <h2 className="mt-5 font-display text-2xl">{title}</h2>
      <p className="mt-2 max-w-sm text-muted-foreground">{body}</p>
      {cta && onCta ? (
        <Button className="mt-6" size="lg" onClick={onCta}>
          {cta}
        </Button>
      ) : null}
    </div>
  );
}

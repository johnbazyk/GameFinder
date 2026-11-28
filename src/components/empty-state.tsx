import { FoxAvatar, type FoxMood } from "./fox-avatar";
import { Button } from "./ui/button";

export function EmptyState({
  mood,
  title,
  body,
  cta,
  onCta,
  pageHeading = false,
}: {
  mood: FoxMood;
  title: string;
  body: string;
  cta?: string;
  onCta?: () => void;
  pageHeading?: boolean;
}) {
  const Heading = pageHeading ? "h1" : "h2";
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <FoxAvatar mood={mood} size="lg" />
      <Heading className="mt-5 font-display text-2xl">{title}</Heading>
      <p className="mt-2 max-w-sm text-muted-foreground">{body}</p>
      {cta && onCta ? (
        <Button className="mt-6" size="lg" onClick={onCta}>
          {cta}
        </Button>
      ) : null}
    </div>
  );
}

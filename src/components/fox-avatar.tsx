import { cn } from "@/lib/utils";

const ART = {
  sniffing: ["magnifier", "Finn looking through a magnifying glass"],
  proud: ["point", "Finn pointing the way"],
  shrug: ["shrug", "Finn shrugging"],
  celebrate: ["trophy", "Finn raising a trophy"],
  hopeful: ["wave", "Finn waving hello"],
  shelf: ["game-box", "Finn with a box of games"],
  profile: ["checklist", "Finn with a checklist"],
  thinking: ["thinking", "Finn considering a move"],
  teaching: ["cards", "Finn showing game cards"],
  surprise: ["die", "Finn holding a die"],
  resting: ["asleep", "Finn curled up beside a die"],
} as const;

export type FoxMood = keyof typeof ART;

export function FoxAvatar({
  mood,
  size = "md",
  caption,
  className,
}: {
  mood: FoxMood;
  size?: "sm" | "md" | "lg" | "hero";
  caption?: string;
  className?: string;
}) {
  const dim = {
    sm: "size-16",
    md: "size-28",
    lg: "size-40",
    hero: "size-52 sm:size-64",
  }[size];

  const [pose, description] = ART[mood];

  return (
    <figure className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-2xl",
          dim,
          mood === "sniffing" && "anim-sniff",
          mood === "celebrate" && "anim-hop",
        )}
      >
        <img
          src={`/fox/finn-${pose}.webp`}
          width={768}
          height={768}
          alt={description}
          className="size-full object-contain"
        />
      </div>
      {caption ? (
        <figcaption className="font-display text-center text-lg text-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

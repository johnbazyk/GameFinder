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
    sm: "size-20 sm:size-24",
    md: "size-36 sm:size-40",
    lg: "size-44 sm:size-52",
    hero: "size-[clamp(10rem,30dvh,18rem)] sm:size-[clamp(12rem,34dvh,21rem)]",
  }[size];

  const [pose, description] = ART[mood];

  return (
    <figure data-finn-size={size} className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn(
          "max-w-full shrink-0 overflow-hidden rounded-2xl",
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

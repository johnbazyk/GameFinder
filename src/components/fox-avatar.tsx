import { cn } from "@/lib/utils";

export type FoxMood = "sniffing" | "proud" | "shrug" | "celebrate" | "hopeful";

const SRC: Record<FoxMood, string> = {
  sniffing: "/fox/sniffing.jpg",
  proud: "/fox/proud.jpg",
  shrug: "/fox/shrug.jpg",
  celebrate: "/fox/celebrate.jpg",
  hopeful: "/fox/hopeful.jpg",
};

const LINE: Record<FoxMood, string> = {
  sniffing: "Finn is sniffing out a match",
  proud: "Finn found your games",
  shrug: "Hmm, nothing fits all of that",
  celebrate: "Logged. Finn is pleased",
  hopeful: "Tell Finn what's on your shelf",
};

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

  return (
    <figure className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-full bg-cream-deep shadow-card ring-4 ring-cream",
          dim,
          mood === "sniffing" && "anim-sniff",
          mood === "celebrate" && "anim-hop",
        )}
      >
        <img
          src={SRC[mood]}
          alt={LINE[mood]}
          className="size-full object-cover"
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

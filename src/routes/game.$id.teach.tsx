import { useState } from "react";
import { ensureLesson } from "@/lib/lesson-cache";
import type { LessonPack } from "@/lib/coach";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CATALOG_EXTERNAL_ID_CONFLICTS } from "@/lib/catalog";
import { DESIGN_ASSESSMENTS } from "@/lib/ratings/design-assessments";
import { getGame } from "@/lib/scoring";
import { PremiumGate } from "@/components/premium-gate";
import { FinnProcessing } from "@/components/finn-processing";
import { FinnCoach } from "@/components/finn-coach";
import { guides } from "@/lib/written-guides";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/game/$id/teach")({ component: TeachGame });

function MoreTeaching({ id }: { id: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "unavailable">("idle");
  const [lesson, setLesson] = useState<LessonPack | null>(null);
  if (lesson)
    return (
      <section className="space-y-3">
        <p className="text-sm text-muted-foreground">
          General AI guide · Check your edition for exact rules.
        </p>
        {(
          [
            ["Set up", lesson.setup],
            ["On your turn", lesson.turn],
            ["How to win", lesson.goal],
            ["Scoring and ending", lesson.score],
            ["Common mistakes", lesson.oops],
          ] as const
        ).map(([heading, text]) => (
          <div key={heading}>
            <h2 className="font-semibold">{heading}</h2>
            <p>{text}</p>
          </div>
        ))}
      </section>
    );
  if (status === "loading")
    return <FinnProcessing mood="teaching" title="Finn is studying the rules…" />;
  if (status === "unavailable")
    return (
      <p role="status" className="text-sm">
        A step-by-step guide is unavailable for this edition.
      </p>
    );
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        setStatus("loading");
        const pack = await ensureLesson(id).catch(() => null);
        if (pack) setLesson(pack);
        else setStatus("unavailable");
      }}
    >
      Read a general AI guide
    </Button>
  );
}

function TeachGame() {
  const { id } = Route.useParams();
  const game = getGame(id);
  if (!game) return <p>Game not found.</p>;
  const ambiguous = CATALOG_EXTERNAL_ID_CONFLICTS.some((conflict) => conflict.externalId === id);
  const profile = DESIGN_ASSESSMENTS.find((row) => row.legacyId === id && row.title === game.name);
  const guide = ambiguous ? undefined : guides[game.name];
  const source = ambiguous || game.bggId === "1269" ? undefined : (guide?.rules ?? profile?.source);
  return (
    <main className="mx-auto max-w-xl space-y-5 pb-10">
      <Link to="/game/$id" params={{ id }} className="text-sm font-semibold text-sky">
        Back to {game.name}
      </Link>
      <h1 className="font-display text-3xl">How to play {game.name}</h1>
      <PremiumGate feature="finn">
        <FinnCoach game={game} />
        {guide ? (
          <dl className="space-y-4 rounded-card bg-card p-5 shadow-card">
            {(
              [
                ["Set up", guide.setup],
                ["On your turn", guide.turn],
                ["How to win", guide.win],
              ] as const
            ).map(([label, text]) => (
              <div key={label}>
                <dt className="font-semibold">{label}</dt>
                <dd className="mt-1">{text}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>
            {ambiguous
              ? "Check the title and edition on your box before using the rules."
              : profile
                ? Object.values(profile.matchReasons)[0]
                : "Use the instructions that came with this edition."}
          </p>
        )}
        {source?.startsWith("https://") && (
          <Button asChild>
            <a href={source} target="_blank" rel="noreferrer">
              {guide?.rules || /\.pdf(?:$|\?)/i.test(source)
                ? "Open game rules"
                : "Open game reference"}
            </a>
          </Button>
        )}
        {!guide && !ambiguous && <MoreTeaching key={id} id={id} />}
      </PremiumGate>
    </main>
  );
}

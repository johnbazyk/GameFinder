import { useState } from "react";
import { ensureLesson } from "@/lib/lesson-cache";
import type { LessonPack } from "@/lib/coach";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CATALOG_EXTERNAL_ID_CONFLICTS } from "@/lib/catalog";
import { DESIGN_ASSESSMENTS } from "@/lib/ratings/design-assessments";
import { getGame } from "@/lib/scoring";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/game/$id/teach")({ component: TeachGame });

type Guide = { setup: string; turn: string; win: string; rules?: string };
const guides: Record<string, Guide | undefined> = {
  Stockpile: {
    setup:
      "In the GameFinder card game, each player starts with a personal stock. Leave room for four shared building piles and four discard piles per player.",
    turn: "Fill your hand to five. Build the shared piles from 1 to 12 using your hand or the top of a stock or discard pile. A wild takes the next number. Discard one card from your hand to end your turn.",
    win: "Play the last card from your personal stock onto a building pile.",
  },
  Bank: {
    setup:
      "Choose the number of rounds and start everyone at zero. Pass two dice around the table and keep a shared running total.",
    turn: "Add each roll to the pot. On the first three rolls, a seven adds 70. After that, doubles double the pot and a seven ends the round. Before the next roll, anyone still in can bank the pot’s current value and sit out.",
    win: "Finish the last round with the most banked points.",
  },
  Catan: {
    setup:
      "Use the beginner island diagram in the rules below. Put each color’s two settlements and roads where shown, then take the starting resources listed for your color.",
    turn: "Roll both dice. Everyone with a settlement beside a producing tile with that number takes its resource. A city earns two. On a 7, resolve the robber instead. Then trade and spend resources to build.",
    win: "Reach 10 points on your turn. Each settlement gives you one point and each city gives you two. Some cards and awards also score.",
    rules: "https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf",
  },
  Sequence: {
    setup:
      "Choose chip colors and alternate seats by team. Shuffle and deal seven cards each for two players or six each for three or four. For larger groups, use the deal chart in the rules.",
    turn: "Play one card, cover an open matching space with a chip, then draw a card. A two-eyed jack lets you choose any open space. A one-eyed jack removes an opponent’s chip outside a completed line.",
    win: "Make five in a row across, down, or diagonally. With two sides you need two lines. With three sides you need one. A corner counts for every color.",
  },
  Uno: {
    setup:
      "Deal seven cards to each player. Stack the rest face down and turn one card over to start the discard pile.",
    turn: "Match the top card’s color, number, or symbol, or play a legal wild. If you draw one card, you may play it immediately if it fits. Say “UNO” when you play down to one card.",
    win: "Empty your hand to win the round. Under classic scoring, the winner scores the cards left in everyone else’s hands. The first player to reach 500 points wins.",
  },
  "Left Right Center": {
    setup:
      "Give everyone three chips. Pick a starting player and leave room in the middle for the pot.",
    turn: "Roll one die per chip you hold, up to three. Each L sends one chip left, each R sends one right, and each C sends one to the center. Keep a chip for each dot, then pass the dice left.",
    win: "Be the last player holding chips. If you run out, skip your roll. A neighbor can still pass you a chip on a later turn.",
  },
};

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
          ] as const
        ).map(([heading, text]) => (
          <div key={heading}>
            <h2 className="font-semibold">{heading}</h2>
            <p>{text}</p>
          </div>
        ))}
      </section>
    );
  if (status === "unavailable")
    return (
      <p role="status" className="text-sm">
        A step-by-step guide is unavailable for this edition.
      </p>
    );
  return (
    <Button
      variant="secondary"
      disabled={status === "loading"}
      onClick={async () => {
        setStatus("loading");
        const pack = await ensureLesson(id).catch(() => null);
        if (pack) setLesson(pack);
        else setStatus("unavailable");
      }}
    >
      {status === "loading" ? "Loading guide…" : "Read a general AI guide"}
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
  const source = game.bggId === "1269" ? undefined : (guide?.rules ?? profile?.source);
  return (
    <main className="mx-auto max-w-xl space-y-5 pb-10">
      <Link to="/game/$id" params={{ id }} className="text-sm font-semibold text-sky">
        Back to {game.name}
      </Link>
      <h1 className="font-display text-3xl">How to play {game.name}</h1>
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
            {(guide && game.name !== "Bank") || /\.pdf(?:$|\?)/i.test(source)
              ? "Open game rules"
              : "Open game reference"}
          </a>
        </Button>
      )}
      {!guide && !ambiguous && <MoreTeaching key={id} id={id} />}
      {!ambiguous && (
        <div>
          <Link to="/game/$id/table" params={{ id }} className="text-sm font-semibold text-sky">
            Ask Finn by voice
          </Link>
        </div>
      )}
    </main>
  );
}

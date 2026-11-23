import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Play } from "lucide-react";
import type { Game } from "@/lib/types";
import { chapters, chapterAudio } from "@/lib/guide-chapters";
import { guides, type Guide } from "@/lib/written-guides";
import { cn } from "@/lib/utils";
import { FoxAvatar } from "./fox-avatar";
import { VoicePlayer } from "./voice-player";
import { FinnQuestions } from "./finn-questions";

type Props = { game: Game; variant?: "panel" | "table" };

export function FinnCoach({ game, variant = "panel" }: Props) {
  return <Lesson key={game.bggId} game={game} guide={guides[game.name]} variant={variant} />;
}

function Lesson({ game, guide, variant }: Props & { guide?: Guide }) {
  const audio = useRef<HTMLAudioElement>(null);
  const answerAudio = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const current = chapters[index];

  function playChapter(next: number) {
    if (!guide || !audio.current || !chapters[next]) return;
    const player = audio.current;
    answerAudio.current?.pause();
    setStarted(true);
    setError(false);
    setIndex(next);
    player.src = chapterAudio(guide, chapters[next]);
    void player.play().catch((err) => {
      if (err.name !== "AbortError") setError(true);
    });
  }

  const questions = (
    <FinnQuestions
      game={game}
      guide={guide}
      answerAudio={answerAudio}
      onAsk={() => audio.current?.pause()}
    />
  );
  if (variant === "table")
    return (
      <section id="ask-finn" className="mx-auto max-w-xl space-y-5">
        <Link to="/game/$id" params={{ id: game.bggId }} className="text-sm font-semibold text-sky">
          Back to {game.name}
        </Link>
        <FoxAvatar mood="hopeful" size="md" />
        <h1 className="text-center font-display text-2xl">Table talk</h1>
        {questions}
      </section>
    );

  return (
    <section id="ask-finn" className="mt-6 space-y-4">
      <div className="flex items-center gap-3">
        <FoxAvatar mood={playing ? "teaching" : "hopeful"} size="sm" />
        <h2 className="font-display text-xl">Learn with Finn</h2>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => playChapter(0)}
          disabled={!guide}
          className="rounded-full bg-fox px-3 py-1.5 text-sm font-semibold text-cream"
        >
          Lesson
        </button>
        <Link
          to="/game/$id/table"
          params={{ id: game.bggId }}
          className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold"
        >
          Table talk
        </Link>
      </div>
      {guide && (
        <>
          <audio
            ref={audio}
            hidden
            playsInline
            preload="none"
            onPlay={() => {
              answerAudio.current?.pause();
              setPlaying(true);
            }}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setError(true)}
          />
          {started ? (
            <VoicePlayer
              audio={audio.current}
              ready={!error}
              title={current.title}
              onPrev={() =>
                playChapter(
                  (audio.current?.currentTime ?? 0) > 1.5 ? index : Math.max(0, index - 1),
                )
              }
              onNext={() => playChapter(index + 1)}
              canNext={index < chapters.length - 1}
            />
          ) : (
            <button
              type="button"
              onClick={() => playChapter(0)}
              className="flex w-full flex-col items-center rounded-card bg-card px-4 py-8 shadow-card"
            >
              <span className="grid size-16 place-items-center rounded-full bg-fox text-cream shadow-lift">
                <Play className="size-7 translate-x-0.5 fill-cream" />
              </span>
              <span className="mt-3 font-display text-2xl">Start the lesson</span>
            </button>
          )}
          {error && <p role="status">Audio couldn’t play. {guide[current.field]}</p>}
          <ol className="overflow-hidden rounded-card bg-card shadow-card">
            {chapters.map((chapter, i) => {
              const selected = started && i === index;
              return (
                <li key={chapter.id} className="border-b border-border last:border-0">
                  <button
                    type="button"
                    onClick={() => playChapter(i)}
                    aria-current={selected || undefined}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 px-4 text-left",
                      selected && "bg-fox/10",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                        selected ? "bg-fox text-cream" : "bg-muted",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 font-semibold">{chapter.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {selected && playing ? "playing" : "play"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      )}
      {questions}
    </section>
  );
}

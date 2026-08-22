import { useEffect, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

const BARS = [8, 16, 22, 14, 26, 18, 12, 24, 10, 20, 16, 22, 14, 18, 12, 20];

function fmt(secs: number) {
  if (!Number.isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoicePlayer({
  audio,
  ready,
  title,
  pending,
  status,
  onPlay,
  onPause,
  onEnded,
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
}: {
  audio: HTMLAudioElement | null;
  ready: boolean;
  title: string;
  pending?: boolean;
  status?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
}) {
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    if (!audio) return;
    const sync = () => {
      setTime(audio.currentTime || 0);
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setPaused(audio.paused);
    };
    const ended = () => {
      sync();
      onEnded?.();
    };
    sync();
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("durationchange", sync);
    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("ended", ended);
    audio.addEventListener("loadedmetadata", sync);
    return () => {
      audio.removeEventListener("timeupdate", sync);
      audio.removeEventListener("durationchange", sync);
      audio.removeEventListener("play", sync);
      audio.removeEventListener("pause", sync);
      audio.removeEventListener("ended", ended);
      audio.removeEventListener("loadedmetadata", sync);
    };
  }, [audio, ready, onEnded]);

  useEffect(() => {
    if (pending) {
      setTime(0);
      setDuration(0);
      setPaused(true);
    }
  }, [pending, title]);

  const toggle = () => {
    if (!audio || !ready) return;
    if (audio.paused) {
      if (audio.ended || (audio.duration && audio.currentTime >= audio.duration - 0.05)) {
        audio.currentTime = 0;
      }
      void audio.play();
      onPlay?.();
    } else {
      audio.pause();
      onPause?.();
    }
  };

  const playing = ready && !paused && !pending;
  const max = duration > 0 ? duration : 0;
  const pct = max ? Math.min(100, (time / max) * 100) : 0;

  return (
    <div className="rounded-card bg-card px-4 py-5 shadow-card">
      <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-fox">
        {pending ? "Loading rules" : playing ? "Now playing" : ready ? "Paused" : "Lesson"}
      </p>
      <h3 className="mt-1 text-center font-display text-2xl leading-tight">{title}</h3>
      {status ? (
        <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-snug text-muted-foreground">
          {status}
        </p>
      ) : null}

      <div className="mt-4 flex h-10 items-end justify-center gap-1" aria-hidden>
        {BARS.map((h, i) => (
          <span
            key={i}
            className={cn("wave-bar w-1", playing && "is-on")}
            style={{
              height: h,
              animationDelay: `${(i % 7) * 0.08}s`,
              opacity: playing ? 1 : 0.35,
            }}
          />
        ))}
      </div>

      <div className="mt-4">
        <input
          type="range"
          min={0}
          max={max || 0}
          step={0.1}
          value={Math.min(time, max || 0)}
          disabled={!ready || !max || pending}
          onChange={(e) => {
            if (!audio) return;
            const v = Number(e.target.value);
            audio.currentTime = v;
            setTime(v);
          }}
          aria-label="Scrub this chapter"
          className="h-2 w-full cursor-pointer accent-fox"
        />
        <div className="mt-1 flex justify-between text-xs tabular-nums text-muted-foreground">
          <span>{fmt(time)}</span>
          <span>{fmt(duration)}</span>
        </div>
        <div className="sr-only">{Math.round(pct)} percent</div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-5">
        <button
          type="button"
          className="grid size-12 place-items-center rounded-full bg-muted text-foreground disabled:opacity-40"
          onClick={onPrev}
          disabled={!onPrev || !canPrev}
          aria-label="Restart chapter, or previous chapter"
        >
          <SkipBack className="size-5" />
        </button>
        <button
          type="button"
          className="grid size-16 place-items-center rounded-full bg-fox text-cream shadow-lift disabled:opacity-50"
          onClick={toggle}
          disabled={!ready || pending}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="size-7 fill-cream" />
          ) : (
            <Play className="size-7 translate-x-0.5 fill-cream" />
          )}
        </button>
        <button
          type="button"
          className="grid size-12 place-items-center rounded-full bg-muted text-foreground disabled:opacity-40"
          onClick={onNext}
          disabled={!onNext || !canNext}
          aria-label="Next chapter"
        >
          <SkipForward className="size-5" />
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Back restarts, then previous · Forward skips ahead
      </p>
    </div>
  );
}

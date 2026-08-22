import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { FoxAvatar } from "@/components/fox-avatar";
import { VoicePlayer } from "@/components/voice-player";
import {
  askFinn,
  askFinnLesson,
  hearFinn,
  speakFinn,
  type CoachMessage,
  type CoachMode,
} from "@/lib/coach";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

const CHAPTERS = [
  {
    id: "goal",
    title: "The goal",
    send: "Audio-only, one beat: what is the goal of this game and how does someone win? Four to six spoken sentences. No setup.",
  },
  {
    id: "setup",
    title: "Set the table",
    send: "Audio-only, one beat: how to set up the table for a first game. Four to six spoken sentences. Skip the goal.",
  },
  {
    id: "turn",
    title: "A turn",
    send: "Audio-only, one beat: walk through one full turn as if we are playing right now. Four to six spoken sentences.",
  },
  {
    id: "score",
    title: "How you score",
    send: "Audio-only, one beat: how scoring and winning work. Four to six spoken sentences.",
  },
  {
    id: "oops",
    title: "Don't mess this up",
    send: "Audio-only, one beat: the three mistakes first-timers always make. Four to six spoken sentences.",
  },
] as const;

type LessonId = (typeof CHAPTERS)[number]["id"];
type ChapterId = LessonId | "ask" | "ruling";

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result ?? "");
      resolve(s.slice(s.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToObjectUrl(b64: string, mime: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime || "audio/mpeg" }));
}

function friendlyError(code: string) {
  if (code === "unavailable") return "Finn's voice is napping. Try again in a bit.";
  if (code === "too-long") return "Keep it short — tap the mic again.";
  if (code === "empty") return "Didn't catch that. Tap the mic and ask again.";
  return "Finn lost the scent. Try once more.";
}

function lessonIndex(id: ChapterId) {
  return CHAPTERS.findIndex((c) => c.id === id);
}

export function FinnCoach({
  game,
  variant = "panel",
}: {
  game: Game;
  variant?: "panel" | "table";
}) {
  const [mode, setMode] = useState<CoachMode>(variant === "table" ? "table" : "teach");
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [hasClip, setHasClip] = useState(false);
  const [started, setStarted] = useState(false);
  const [track, setTrack] = useState<{ id: ChapterId; title: string }>({
    id: "goal",
    title: CHAPTERS[0].title,
  });
  const [heard, setHeard] = useState<ChapterId[]>([]);
  const [packLoading, setPackLoading] = useState(true);
  const [readyClips, setReadyClips] = useState<ChapterId[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const cacheRef = useRef<Partial<Record<ChapterId, string>>>({});
  const textCacheRef = useRef<Partial<Record<ChapterId, string>>>({});
  const messagesRef = useRef<CoachMessage[]>([]);
  const requestIdRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recTimerRef = useRef<number | null>(null);
  const prefetchingRef = useRef<Partial<Record<ChapterId, boolean>>>({});
  const inflightRef = useRef<Partial<Record<ChapterId, Promise<string>>>>({});
  const reloadGenRef = useRef(0);

  messagesRef.current = messages;

  const ensureAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) throw new Error("audio missing");
    return audio;
  }, []);

  const armAudio = useCallback(() => {
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        if (!audioCtxRef.current) audioCtxRef.current = new AC();
        if (audioCtxRef.current.state === "suspended") void audioCtxRef.current.resume();
      }
    } catch {
      /* ignore */
    }
    if (!unlockAudioRef.current) {
      const unlock = new Audio(SILENT_WAV);
      unlock.setAttribute("playsinline", "true");
      unlockAudioRef.current = unlock;
    }
    unlockAudioRef.current.currentTime = 0;
    void unlockAudioRef.current.play().catch(() => undefined);
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (recTimerRef.current) window.clearTimeout(recTimerRef.current);
      Object.values(cacheRef.current).forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, []);

  const attachUrl = useCallback(
    async (url: string, meta: { id: ChapterId; title: string }, requestId: number) => {
      const audio = ensureAudio();
      audio.pause();
      audio.muted = false;
      audio.src = url;
      audio.currentTime = 0;
      setTrack(meta);
      setHasClip(true);
      setSpeaking(true);
      try {
        await audio.play();
      } catch {
        /* autoplay blocked — user can tap play */
      }
      if (requestIdRef.current !== requestId) return;
    },
    [ensureAudio],
  );

  const ensureClip = useCallback(
    async (meta: { id: ChapterId; title: string }, prompt: string, usedMode: CoachMode) => {
      const cached = cacheRef.current[meta.id];
      if (cached) return cached;
      const inflight = inflightRef.current[meta.id];
      if (inflight) return inflight;

      const run = (async () => {
        let text = textCacheRef.current[meta.id];
        if (!text) {
          const history: CoachMessage[] = [
            ...messagesRef.current,
            { role: "user", content: prompt, label: meta.title },
          ];
          const reply = await askFinn({
            data: { gameId: game.bggId, mode: usedMode, messages: history },
          });
          if (!reply.ok) throw new Error(reply.error);
          text = reply.text;
          textCacheRef.current[meta.id] = text;
          messagesRef.current = [...history, { role: "assistant", content: text }];
          setMessages(messagesRef.current);
        }

        const spoken = await speakFinn({ data: { text } });
        if (!spoken.ok) throw new Error(spoken.error);
        if (!spoken.audioBase64) throw new Error("empty");
        const url = base64ToObjectUrl(spoken.audioBase64, spoken.mime);
        const prev = cacheRef.current[meta.id];
        if (prev && prev !== url) URL.revokeObjectURL(prev);
        cacheRef.current[meta.id] = url;
        return url;
      })();
      inflightRef.current[meta.id] = run;
      try {
        return await run;
      } finally {
        delete inflightRef.current[meta.id];
      }
    },
    [game.bggId],
  );

  useEffect(() => {
    const gen = ++reloadGenRef.current;
    Object.values(cacheRef.current).forEach((u) => u && URL.revokeObjectURL(u));
    cacheRef.current = {};
    textCacheRef.current = {};
    prefetchingRef.current = {};
    setHeard([]);
    setReadyClips([]);
    setHasClip(false);
    setPackLoading(true);
    messagesRef.current = [];
    setMessages([]);

    void (async () => {
      const lesson = await askFinnLesson({ data: { gameId: game.bggId } }).catch(() => ({
        ok: false as const,
        error: "unavailable",
      }));
      if (reloadGenRef.current !== gen) return;
      if (!lesson.ok) {
        setPackLoading(false);
        return;
      }
      for (const ch of CHAPTERS) {
        textCacheRef.current[ch.id] = lesson.pack[ch.id];
      }
      const briefing = CHAPTERS.map((c) => `${c.title}. ${lesson.pack[c.id]}`).join("\n\n");
      messagesRef.current = [{ role: "assistant", content: briefing, label: "Full rules" }];
      setMessages(messagesRef.current);
      setPackLoading(false);

      await Promise.all(
        CHAPTERS.map(async (ch) => {
          if (reloadGenRef.current !== gen) return;
          prefetchingRef.current[ch.id] = true;
          try {
            await ensureClip({ id: ch.id, title: ch.title }, ch.send, "teach");
            if (reloadGenRef.current !== gen) return;
            setReadyClips((ids) => (ids.includes(ch.id) ? ids : [...ids, ch.id]));
          } catch {
            /* playChapter will retry */
          } finally {
            prefetchingRef.current[ch.id] = false;
          }
        }),
      );
    })();

    return () => {
      reloadGenRef.current += 1;
    };
  }, [game.bggId, ensureClip]);

  const prefetch = useCallback(
    (id: LessonId) => {
      if (cacheRef.current[id] || prefetchingRef.current[id]) return;
      const ch = CHAPTERS.find((c) => c.id === id);
      if (!ch) return;
      prefetchingRef.current[id] = true;
      void ensureClip({ id: ch.id, title: ch.title }, ch.send, "teach").finally(() => {
        prefetchingRef.current[id] = false;
      });
    },
    [ensureClip],
  );

  const playChapter = useCallback(
    async (id: LessonId) => {
      const ch = CHAPTERS.find((c) => c.id === id);
      if (!ch) return;
      const requestId = ++requestIdRef.current;
      armAudio();
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      setStarted(true);
      setMode("teach");
      setSpeaking(false);
      setTrack({ id: ch.id, title: ch.title });
      const instant = Boolean(cacheRef.current[ch.id]);
      setHasClip(instant);
      setPending(!instant);

      try {
        const url = await ensureClip({ id: ch.id, title: ch.title }, ch.send, "teach");
        if (requestIdRef.current !== requestId) return;
        setHeard((h) => (h.includes(ch.id) ? h : [...h, ch.id]));
        setPending(false);
        await attachUrl(url, { id: ch.id, title: ch.title }, requestId);
        const idx = lessonIndex(ch.id);
        const next = CHAPTERS[idx + 1];
        if (next) prefetch(next.id);
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        setPending(false);
        setSpeaking(false);
        const code = err instanceof Error ? err.message : "unavailable";
        toast(friendlyError(code));
      }
    },
    [armAudio, attachUrl, ensureClip, prefetch],
  );

  const playAsk = useCallback(
    async (content: string, meta: { id: ChapterId; title: string }, usedMode: CoachMode) => {
      const text = content.trim();
      if (!text) return;
      const requestId = ++requestIdRef.current;
      armAudio();
      audioRef.current?.pause();
      setStarted(true);
      setMode(usedMode);
      setTrack(meta);
      setHasClip(false);
      setPending(true);
      try {
        const url = await ensureClip(meta, text, usedMode);
        if (requestIdRef.current !== requestId) return;
        setHeard((h) => (h.includes(meta.id) ? h : [...h, meta.id]));
        setPending(false);
        await attachUrl(url, meta, requestId);
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        setPending(false);
        const code = err instanceof Error ? err.message : "unavailable";
        toast(friendlyError(code));
      }
    },
    [armAudio, attachUrl, ensureClip],
  );

  const skipPrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused && audio.currentTime > 1.5) {
      audio.currentTime = 0;
      void audio.play();
      setSpeaking(true);
      return;
    }
    const idx = lessonIndex(track.id);
    if (idx > 0) {
      void playChapter(CHAPTERS[idx - 1].id);
      return;
    }
    if (idx < 0) void playChapter("goal");
    else if (audio) {
      audio.currentTime = 0;
      void audio.play();
    }
  }, [playChapter, track.id]);

  const skipNext = useCallback(() => {
    const idx = lessonIndex(track.id);
    const next = idx < 0 ? CHAPTERS[0] : CHAPTERS[idx + 1];
    if (next) void playChapter(next.id);
  }, [playChapter, track.id]);

  const onEnded = useCallback(() => {
    setSpeaking(false);
  }, []);

  const stopRecording = useCallback(async () => {
    const rec = recorderRef.current;
    recorderRef.current = null;
    if (recTimerRef.current) {
      window.clearTimeout(recTimerRef.current);
      recTimerRef.current = null;
    }
    setRecording(false);
    if (!rec) return;

    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      if (rec.state !== "inactive") rec.stop();
      else resolve();
    });
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
    chunksRef.current = [];
    if (blob.size < 800) {
      toast("Too quiet — hold the mic and ask.");
      return;
    }

    setPending(true);
    try {
      const audioBase64 = await blobToBase64(blob);
      const heardText = await hearFinn({
        data: { audioBase64, mime: blob.type || "audio/webm" },
      });
      if (!heardText.ok) {
        toast(friendlyError(heardText.error));
        setPending(false);
        return;
      }
      const meta =
        mode === "table"
          ? { id: "ruling" as const, title: "A ruling" }
          : { id: "ask" as const, title: "Your question" };
      await playAsk(heardText.text, meta, mode);
    } catch {
      setPending(false);
      toast("Couldn't hear that. Tap the mic again.");
    }
  }, [mode, playAsk]);

  const startRecording = useCallback(async () => {
    if (pending || recording) return;
    armAudio();
    audioRef.current?.pause();
    setSpeaking(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      recTimerRef.current = window.setTimeout(() => {
        void stopRecording();
      }, 15000);
    } catch {
      toast("Allow the microphone to ask Finn.");
    }
  }, [armAudio, pending, recording, stopRecording]);

  const foxMood = recording || pending ? "sniffing" : speaking ? "proud" : "hopeful";
  const idx = lessonIndex(track.id);
  const readyN = readyClips.length;
  const loadStatus = packLoading
    ? `Finn is loading the full ${game.name} rules — all five tracks. Stay on this page.`
    : pending
      ? `Finn is recording “${track.title}.” Give it a few seconds.`
      : readyN < CHAPTERS.length && (started || variant === "table")
        ? `${readyN} of ${CHAPTERS.length} tracks ready. Skip is instant once a track is green.`
        : undefined;

  const mic = (
    <div className="flex flex-col items-center">
      <button
        type="button"
        disabled={pending && !recording}
        onClick={() => (recording ? void stopRecording() : void startRecording())}
        aria-label={recording ? "Stop listening" : "Ask Finn with your voice"}
        className={cn(
          "grid size-20 place-items-center rounded-full bg-fox text-cream shadow-lift transition-transform duration-150 active:scale-95",
          recording && "mic-pulse",
          pending && !recording && "opacity-60",
        )}
      >
        {recording ? <Square className="size-7 fill-cream" /> : <Mic className="size-8" />}
      </button>
      <p className="mt-2 text-center text-sm font-semibold">
        {recording
          ? "Listening — tap to send"
          : packLoading
            ? "Loading all rules…"
            : pending
              ? "Loading the rules…"
              : "Tap to ask"}
      </p>
      <p className="text-xs text-muted-foreground">Stuck mid-game? Just talk.</p>
    </div>
  );

  const player = (
    <VoicePlayer
      audio={audioRef.current}
      ready={hasClip}
      title={track.title}
      pending={pending}
      status={loadStatus}
      onPlay={() => setSpeaking(true)}
      onPause={() => setSpeaking(false)}
      onEnded={onEnded}
      onPrev={skipPrev}
      onNext={skipNext}
      canPrev={idx !== 0 || hasClip}
      canNext={idx < CHAPTERS.length - 1}
    />
  );

  const audioEl = (
    <audio
      ref={audioRef}
      hidden
      playsInline
      preload="auto"
      onError={() => setSpeaking(false)}
    />
  );

  if (variant === "table") {
    return (
      <div className="flex h-[calc(100dvh-5.5rem)] flex-col">
        {audioEl}
        <Link
          to="/game/$id"
          params={{ id: game.bggId }}
          className="text-sm font-semibold text-sky"
        >
          Back to {game.name}
        </Link>
        <FoxAvatar
          mood={foxMood}
          size="md"
          className={cn("mt-3", speaking && "speak-pulse")}
          caption={recording ? "Listening…" : "Ask a ruling. Don't pause the night."}
        />
        <p className="mt-3 text-sm leading-snug text-muted-foreground">
          Finn reloads the full {game.name} rules when you open this page, then answers from that.
          Tap the mic, ask, wait a few seconds, then he talks.
        </p>
        <div className="mt-4">{player}</div>
        <div className="mt-auto flex justify-center pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          {mic}
        </div>
      </div>
    );
  }

  return (
    <section id="ask-finn" className="mt-6 space-y-4">
      {audioEl}
      <div className="flex items-center gap-3">
        <FoxAvatar mood={foxMood} size="sm" className={cn(speaking && "speak-pulse")} />
        <div className="min-w-0">
          <h2 className="font-display text-xl">How to play, out loud</h2>
          <p className="text-sm text-muted-foreground">
            A five-track lesson for {game.name}. Nothing to read.
          </p>
        </div>
      </div>

      <div className="rounded-card bg-muted/70 px-4 py-3 text-sm leading-relaxed text-foreground">
        <p>
          Opening this page reloads the official rules for {game.name} and records every track.
          Stay here while Finn works. Skip and replay become instant as each track turns green.
        </p>
        <p className="mt-2 text-muted-foreground">
          Back: restart this track, tap again for the previous one. Forward: next track. Mic: ask
          anything after he finishes.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("teach")}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-semibold",
            mode === "teach" ? "bg-fox text-cream" : "bg-muted text-muted-foreground",
          )}
        >
          Lesson
        </button>
        <Link
          to="/game/$id/table"
          params={{ id: game.bggId }}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-semibold",
            mode === "table" ? "bg-fox text-cream" : "bg-muted text-muted-foreground",
          )}
        >
          Table talk
        </Link>
      </div>

      {started || pending || hasClip ? (
        player
      ) : (
        <button
          type="button"
          onClick={() => void playChapter("goal")}
          className="flex w-full flex-col items-center rounded-card bg-card px-4 py-8 shadow-card"
        >
          <span className="grid size-16 place-items-center rounded-full bg-fox text-cream shadow-lift">
            <Play className="size-7 translate-x-0.5 fill-cream" />
          </span>
          <span className="mt-3 font-display text-2xl">Start the lesson</span>
          <span className="mt-1 max-w-xs text-center text-sm text-muted-foreground">
            All five tracks load together. Hit play when the first one is ready.
          </span>
        </button>
      )}

      <ol className="overflow-hidden rounded-card bg-card shadow-card">
        {CHAPTERS.map((ch, i) => {
          const on = track.id === ch.id && started;
          const done = heard.includes(ch.id) || readyClips.includes(ch.id);
          const loadingThis = (on && pending) || (packLoading && !readyClips.includes(ch.id));
          return (
            <li key={ch.id} className="border-b border-border last:border-0">
              <button
                type="button"
                onClick={() => void playChapter(ch.id)}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 px-4 text-left",
                  on && "bg-fox/10",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                    on ? "bg-fox text-cream" : done ? "bg-moss text-cream" : "bg-muted",
                  )}
                >
                  {i + 1}
                </span>
                <span className="flex-1 font-semibold">{ch.title}</span>
                <span className="text-xs text-muted-foreground">
                  {loadingThis ? "loading" : on && speaking ? "playing" : readyClips.includes(ch.id) ? "ready" : done ? "replay" : "play"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {mic}
    </section>
  );
}

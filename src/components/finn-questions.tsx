import { useEffect, useRef, useState, type RefObject } from "react";
import { Mic, Square } from "lucide-react";
import {
  askFinn,
  hearFinn,
  isFinnVoiceConfigured,
  speakFinn,
  type CoachMessage,
} from "@/lib/coach";
import { CATALOG_EXTERNAL_ID_CONFLICTS } from "@/lib/catalog";
import { lessonRecording, previewAnswer } from "@/lib/catan-voice-preview";
import { guidePassage, directGuideChapter } from "@/lib/guide-chapters";
import type { Guide } from "@/lib/written-guides";
import type { Game } from "@/lib/types";
import { Button } from "./ui/button";

type Dictation = {
  lang: string;
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

function deviceDictation() {
  const browser = window as Window & {
    SpeechRecognition?: new () => Dictation;
    webkitSpeechRecognition?: new () => Dictation;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

type Answer = { text: string; audio?: string; label?: string };

export function FinnQuestions({
  game,
  guide,
  answerAudio,
  onAsk,
}: {
  game: Game;
  guide?: Guide;
  answerAudio: RefObject<HTMLAudioElement | null>;
  onAsk(): void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<"idle" | "starting" | "listening" | "busy">("idle");
  const [live, setLive] = useState(false);
  const [micAvailable, setMicAvailable] = useState(false);
  const history = useRef<CoachMessage[]>([]);
  const active = useRef(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const dictation = useRef<Dictation | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const submitted = useRef(false);
  const ambiguous = CATALOG_EXTERNAL_ID_CONFLICTS.some((c) => c.externalId === game.bggId);

  useEffect(() => {
    active.current = true;
    let cancelled = false;
    setMicAvailable(!ambiguous && Boolean(deviceDictation()));

    if (!ambiguous)
      void isFinnVoiceConfigured()
        .then((available) => {
          if (cancelled) return;
          setLive(available);
          setMicAvailable(
            Boolean(
              deviceDictation() ||
              (available &&
                typeof navigator.mediaDevices?.getUserMedia === "function" &&
                typeof window.MediaRecorder === "function"),
            ),
          );
        })
        .catch(() => {});
    return () => {
      cancelled = true;
      active.current = false;
      window.clearTimeout(timer.current);
      answerAudio.current?.pause();
      dictation.current?.abort();
      if (recorder.current?.state === "recording") recorder.current.stop();
      recorder.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, [game.bggId]);

  async function ask(value: string, spoken = false) {
    const text = value.trim();
    if (!text || text.length > 1600 || ambiguous || submitted.current || !active.current) return;
    submitted.current = true;
    setQuestion(text);
    setMessage("");
    setAnswer(null);
    setPhase("busy");
    answerAudio.current?.pause();
    onAsk();
    try {
      let result: Answer | undefined = previewAnswer(game.bggId, text);
      const direct = guide && directGuideChapter(text);
      if (!result && guide && direct)
        result = {
          text: guide[direct.field],
          audio: lessonRecording(guide, direct),
          label: "Quick-start guide · " + direct.title + " · Check your edition",
        };
      if (!result && live) {
        const messages: CoachMessage[] = [...history.current, { role: "user", content: text }];
        const reply = await askFinn({
          data: { gameId: game.bggId, mode: "table", messages },
        }).catch(() => null);
        if (!active.current) return;
        if (reply?.ok) {
          history.current = [
            ...messages,
            { role: "assistant" as const, content: reply.text },
          ].slice(-8);
          result = {
            text: reply.text,
            label: "General AI answer · Not verified against your edition",
          };
          setAnswer(result);
          if (spoken) {
            const voice = await speakFinn({ data: { text: reply.text } }).catch(() => null);
            if (voice?.ok) result.audio = "data:" + voice.mime + ";base64," + voice.audioBase64;
          }
        }
      }
      if (!active.current) return;
      if (!result) {
        const chapter = guide && guidePassage(guide, text);
        result =
          guide && chapter
            ? {
                text: guide[chapter.field],
                audio: lessonRecording(guide, chapter),
                label: "Related guide passage · " + chapter.title + " · Not a verified ruling",
              }
            : {
                text: "I couldn’t find that ruling in this guide. Check the rules for your edition.",
              };
      }
      setAnswer({ ...result });
      const player = answerAudio.current;
      if (player && result.audio) {
        player.src = result.audio;
        if (spoken)
          void player.play().catch(() => {
            if (active.current)
              setMessage("Audio couldn’t play. Read the answer or tap Hear answer.");
          });
      }
    } catch {
      if (active.current)
        setMessage("Finn could not answer. Try again or check your edition’s rules.");
    } finally {
      submitted.current = false;
      if (active.current) setPhase("idle");
    }
  }

  function stopped() {
    window.clearTimeout(timer.current);
    if (active.current && !submitted.current) setPhase("idle");
  }

  async function listen() {
    if (phase === "listening") {
      if (recorder.current?.state === "recording") recorder.current.stop();
      else dictation.current?.stop();
      return;
    }
    if (ambiguous || phase !== "idle") return;
    onAsk();
    answerAudio.current?.pause();
    setMessage("");
    setPhase("starting");
    try {
      if (
        live &&
        typeof navigator.mediaDevices?.getUserMedia === "function" &&
        typeof window.MediaRecorder === "function"
      ) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        let rec: MediaRecorder;
        try {
          rec = new MediaRecorder(stream);
        } catch (err) {
          stream.getTracks().forEach((track) => track.stop());
          throw err;
        }
        recorder.current = rec;
        const chunks: Blob[] = [];
        rec.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data);
        };
        rec.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          recorder.current = null;
          window.clearTimeout(timer.current);
          if (!active.current) return;
          setPhase("busy");
          try {
            const blob = new Blob(chunks, { type: rec.mimeType });
            const reader = new FileReader();
            const data = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(String(reader.result).split(",")[1]);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            const heard = await hearFinn({ data: { audioBase64: data, mime: blob.type } });
            if (!heard.ok) throw new Error("transcription");
            await ask(heard.text, true);
          } catch {
            if (active.current)
              setMessage("Finn couldn’t hear that. Try again or type your question.");
          } finally {
            stopped();
          }
        };
        rec.start();
        timer.current = window.setTimeout(() => {
          if (rec.state === "recording") rec.stop();
        }, 15000);
      } else {
        const Speech = deviceDictation();
        if (!Speech) throw new Error("no dictation");
        const speech = new Speech();
        dictation.current = speech;
        speech.lang = "en-US";
        speech.onresult = (event) => {
          void ask(event.results[0][0].transcript, true);
        };
        speech.onend = stopped;
        speech.onerror = () => {
          if (active.current) setMessage("Try the microphone again or type your question.");
        };
        speech.start();
        timer.current = window.setTimeout(() => speech.stop(), 15000);
      }
      setPhase("listening");
    } catch {
      recorder.current?.stream.getTracks().forEach((track) => track.stop());
      stopped();
      if (active.current) setMessage("Check microphone permissions or type your question.");
    }
  }

  if (ambiguous)
    return <p role="status">Finn cannot answer until this game identity is resolved.</p>;
  return (
    <section className="space-y-3 py-2">
      <h3 className="text-center font-display text-xl">Ask Finn a rules question</h3>
      <p className="text-sm text-muted-foreground">
        General help, not official rulings. Check your edition for exact rules.
      </p>
      {micAvailable && (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => void listen()}
            disabled={phase === "busy" || phase === "starting"}
            aria-label={phase === "listening" ? "Stop listening" : "Ask Finn with your voice"}
            className="grid size-20 place-items-center rounded-full bg-fox text-cream shadow-lift disabled:opacity-60"
          >
            {phase === "listening" ? (
              <Square className="size-7 fill-cream" />
            ) : (
              <Mic className="size-8" />
            )}
          </button>
          <span className="text-sm font-semibold">
            {phase === "listening" ? "Listening · tap to send" : "Tap to ask"}
          </span>
        </div>
      )}
      <form
        className="mx-auto flex max-w-lg gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(question);
        }}
      >
        <input
          aria-label="Your rules question"
          placeholder="Type a rules question"
          maxLength={1600}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={phase !== "idle"}
          className="min-w-0 flex-1 rounded-button border border-border bg-card px-3 py-2"
        />
        <Button type="submit" disabled={!question.trim() || phase !== "idle"}>
          Ask Finn
        </Button>
      </form>
      <div aria-live="polite" className="mx-auto max-w-lg text-sm">
        {phase === "busy" && !answer && <p>Checking your question…</p>}
        {message && <p>{message}</p>}
        {answer && (
          <div className="space-y-2 rounded-card bg-card p-4">
            {answer.label && <p className="font-semibold">{answer.label}</p>}
            <p>{answer.text}</p>
            {answer.audio && (
              <button
                type="button"
                className="font-semibold text-sky"
                onClick={() =>
                  void answerAudio.current?.play().catch(() => setMessage("Audio couldn’t play."))
                }
              >
                Hear answer
              </button>
            )}
          </div>
        )}
      </div>
      <audio ref={answerAudio} hidden playsInline preload="none" onPlay={onAsk} />
    </section>
  );
}

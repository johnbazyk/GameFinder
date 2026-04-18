import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { TopBar } from "./components/TopBar";
import { GamePicker } from "./components/GamePicker";
import { ChatThread } from "./components/ChatThread";
import { InputArea } from "./components/InputArea";
import { RateLimitBanner, NetworkErrorBanner } from "./components/Banners";
import type { Message } from "./components/MessageBubble";
import { GAMES, isGameSlug, gameBySlug, type GameSlug } from "./lib/games";
import { getOrCreateSession } from "./lib/session";
import { streamChat } from "./lib/chat-stream";

const DEFAULT_SLUG: GameSlug = "catan";

function initialMessagesByGame(): Record<GameSlug, Message[]> {
  return GAMES.reduce(
    (acc, g) => {
      acc[g.slug] = [];
      return acc;
    },
    {} as Record<GameSlug, Message[]>,
  );
}

function readHashSlug(): GameSlug {
  const raw = window.location.hash.slice(1);
  return isGameSlug(raw) ? raw : DEFAULT_SLUG;
}

function App() {
  const [activeSlug, setActiveSlug] = useState<GameSlug>(() => {
    const slug = readHashSlug();
    if (window.location.hash.slice(1) !== slug) {
      window.location.hash = `#${slug}`;
    }
    return slug;
  });
  const [messagesByGame, setMessagesByGame] = useState<Record<GameSlug, Message[]>>(
    initialMessagesByGame,
  );
  const [draft, setDraft] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [rateLimit, setRateLimit] = useState<{
    active: boolean;
    secondsRemaining: number;
  } | null>(null);
  const [networkError, setNetworkError] = useState<{
    slug: GameSlug;
    text: string;
  } | null>(null);

  const threadRef = useRef<HTMLDivElement | null>(null);
  const nearBottomRef = useRef(true);

  // Hash-based routing: listen for external changes (back/forward).
  useEffect(() => {
    const onHash = () => {
      const slug = readHashSlug();
      setActiveSlug(slug);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const activeGame = gameBySlug(activeSlug);
  const activeMessages = messagesByGame[activeSlug];

  // Auto-scroll to bottom on messages change if user was already near the bottom,
  // OR reset to bottom when switching games.
  useLayoutEffect(() => {
    if (nearBottomRef.current && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [activeMessages]);

  useLayoutEffect(() => {
    // Reset near-bottom tracking on game switch and scroll the new game to bottom.
    nearBottomRef.current = true;
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [activeSlug]);

  const appendMessage = useCallback(
    (slug: GameSlug, msg: Message) => {
      setMessagesByGame((prev) => ({
        ...prev,
        [slug]: [...prev[slug], msg],
      }));
    },
    [setMessagesByGame],
  );

  const updateLastAssistant = useCallback(
    (slug: GameSlug, updater: (m: Message) => Message) => {
      setMessagesByGame((prev) => {
        const list = prev[slug];
        if (list.length === 0) return prev;
        const idx = list.length - 1;
        const last = list[idx];
        if (last.role !== "assistant") return prev;
        const nextList = list.slice(0, idx).concat(updater(last));
        return { ...prev, [slug]: nextList };
      });
    },
    [],
  );

  const popLastAssistantIfStreaming = useCallback((slug: GameSlug) => {
    setMessagesByGame((prev) => {
      const list = prev[slug];
      if (list.length === 0) return prev;
      const last = list[list.length - 1];
      if (last.role === "assistant" && last.isStreaming) {
        return { ...prev, [slug]: list.slice(0, -1) };
      }
      return prev;
    });
  }, []);

  const popLastUser = useCallback((slug: GameSlug) => {
    setMessagesByGame((prev) => {
      const list = prev[slug];
      if (list.length === 0) return prev;
      const last = list[list.length - 1];
      if (last.role === "user") {
        return { ...prev, [slug]: list.slice(0, -1) };
      }
      return prev;
    });
  }, []);

  const send = useCallback(
    async (slug: GameSlug, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const sessionId = getOrCreateSession(slug);

      setNetworkError(null);
      setIsStreaming(true);

      const userId = crypto.randomUUID();
      const assistantId = crypto.randomUUID();
      appendMessage(slug, { id: userId, role: "user", content: trimmed });
      appendMessage(slug, {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
      });

      try {
        const result = await streamChat(
          { session_id: sessionId, game_slug: slug, message: trimmed },
          (ev) => {
            if (ev.type === "delta") {
              updateLastAssistant(slug, (m) => ({
                ...m,
                content: m.content + ev.content,
              }));
            } else if (ev.type === "done") {
              updateLastAssistant(slug, (m) => ({
                ...m,
                isStreaming: false,
                isFallback: ev.is_fallback,
                similarityTop: ev.similarity_top,
              }));
            } else if (ev.type === "error") {
              updateLastAssistant(slug, (m) => ({
                ...m,
                isStreaming: false,
                isError: true,
                content: "Something went wrong — try again.",
              }));
            }
          },
        );

        if (!result.ok) {
          // Non-2xx. Remove the in-progress assistant bubble.
          popLastAssistantIfStreaming(slug);

          if (result.status === 429) {
            const retryAfter =
              (result.body as { retry_after_seconds?: number } | null)
                ?.retry_after_seconds ?? 3600;
            setRateLimit({ active: true, secondsRemaining: retryAfter });
          } else if (result.status === 400 || result.status === 404) {
            // Inline error — re-add a short assistant error bubble.
            appendMessage(slug, {
              id: crypto.randomUUID(),
              role: "assistant",
              content: "Something went wrong — try again.",
              isError: true,
            });
          } else {
            setNetworkError({ slug, text: trimmed });
          }
        }
      } catch {
        popLastAssistantIfStreaming(slug);
        setNetworkError({ slug, text: trimmed });
      } finally {
        setIsStreaming(false);
      }
    },
    [appendMessage, popLastAssistantIfStreaming, updateLastAssistant],
  );

  const handleSend = useCallback(() => {
    const text = draft;
    setDraft("");
    void send(activeSlug, text);
  }, [activeSlug, draft, send]);

  const handleRetry = useCallback(() => {
    if (!networkError) return;
    const { slug, text } = networkError;
    setNetworkError(null);
    // Per spec: pop the last user message from state, then re-invoke send.
    popLastUser(slug);
    void send(slug, text);
  }, [networkError, popLastUser, send]);

  const handleSelectGame = useCallback((slug: GameSlug) => {
    if (window.location.hash.slice(1) !== slug) {
      window.location.hash = `#${slug}`;
    }
    setActiveSlug(slug);
  }, []);

  // Rate-limit countdown.
  useEffect(() => {
    if (!rateLimit?.active) return;
    const interval = setInterval(() => {
      setRateLimit((prev) => {
        if (!prev) return prev;
        const next = prev.secondsRemaining - 1;
        if (next <= 0) {
          return null;
        }
        return { ...prev, secondsRemaining: next };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimit?.active]);

  const inputDisabled = isStreaming || !!rateLimit?.active || !!networkError;

  return (
    <div className="app">
      <TopBar />
      <GamePicker activeSlug={activeSlug} onSelect={handleSelectGame} />
      {rateLimit?.active ? (
        <RateLimitBanner secondsRemaining={rateLimit.secondsRemaining} />
      ) : null}
      {networkError ? <NetworkErrorBanner onRetry={handleRetry} /> : null}
      <ChatThread
        ref={threadRef}
        messages={activeMessages}
        gameLabel={activeGame.label}
        onScroll={(nearBottom) => {
          nearBottomRef.current = nearBottom;
        }}
      />
      <InputArea
        value={draft}
        onChange={setDraft}
        onSend={handleSend}
        disabled={inputDisabled}
        placeholder={`Ask about ${activeGame.label} rules, setup, or strategy...`}
      />
    </div>
  );
}

export default App;

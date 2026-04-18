import { forwardRef } from "react";
import { FoxIcon } from "./FoxIcon";
import { MessageBubble, type Message } from "./MessageBubble";

interface ChatThreadProps {
  messages: Message[];
  gameLabel: string;
  onScroll?: (nearBottom: boolean) => void;
}

export const ChatThread = forwardRef<HTMLDivElement, ChatThreadProps>(
  function ChatThread({ messages, gameLabel, onScroll }, ref) {
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      if (!onScroll) return;
      const el = e.currentTarget;
      onScroll(el.scrollTop + el.clientHeight >= el.scrollHeight - 40);
    };

    if (messages.length === 0) {
      return (
        <div className="thread" ref={ref} onScroll={handleScroll}>
          <div className="empty">
            <FoxIcon variant="full" width={80} height={80} style={{ opacity: 0.8 }} />
            <h2 className="empty-title">Ask me anything about {gameLabel}</h2>
            <p className="empty-sub">
              Rules, setup, strategy — I'll pull answers from rulebooks and community wisdom.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="thread" ref={ref} onScroll={handleScroll}>
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>
    );
  },
);

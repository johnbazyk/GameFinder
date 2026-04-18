import { FoxIcon } from "./FoxIcon";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isFallback?: boolean;
  similarityTop?: number;
  isStreaming?: boolean;
  isError?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";
  return (
    <div className={`msg ${isAssistant ? "msg-assistant" : "msg-user"}`}>
      {isAssistant ? (
        <div className="avatar avatar-assistant">
          <FoxIcon variant="simple" width={22} height={22} />
        </div>
      ) : (
        <div className="avatar avatar-user">JB</div>
      )}
      <div className={`bubble ${isAssistant ? "bubble-assistant" : "bubble-user"}`}>
        {isAssistant && message.isFallback ? (
          <div className="cold-start-warning">
            <strong>⚠ Low-confidence retrieval.</strong> The corpus may not cover this — read the hint below.
          </div>
        ) : null}
        <div className="bubble-content">
          {message.content}
          {message.isStreaming && message.content.length > 0 ? (
            <span className="streaming-cursor" aria-hidden="true" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

import { useRef } from "react";

interface InputAreaProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder: string;
}

export function InputArea({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim().length > 0) {
        onSend();
      }
    }
  };

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="input-area">
      <textarea
        ref={textareaRef}
        className="input-textarea"
        value={value}
        placeholder={placeholder}
        rows={1}
        onChange={(e) => {
          onChange(e.target.value);
          autoGrow();
        }}
        onKeyDown={handleKeyDown}
        aria-label="Chat message"
      />
      <button
        type="button"
        className="send-btn"
        onClick={onSend}
        disabled={!canSend}
        aria-label="Send message"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20}>
          <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
        </svg>
      </button>
    </div>
  );
}

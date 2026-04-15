import { useTypingEffect } from "@/hooks/useTypingEffect";

interface TypingMessageProps {
  text: string;
  isNew: boolean;
  className?: string;
}

/**
 * Renders text with a character-by-character typing animation for new messages.
 * Old messages render instantly.
 */
export default function TypingMessage({ text, isNew, className }: TypingMessageProps) {
  const { displayText, isTyping } = useTypingEffect(text, 28, isNew);

  return (
    <span className={className}>
      {displayText}
      {isTyping && <span className="inline-block w-0.5 h-3 bg-primary/60 animate-pulse ml-0.5 align-middle" />}
    </span>
  );
}

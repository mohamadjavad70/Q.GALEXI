import { useState, useEffect, useRef } from "react";

/**
 * Typing effect hook: reveals text character-by-character.
 * Returns the currently visible portion of `text`.
 */
export function useTypingEffect(text: string, speed = 30, enabled = true): { displayText: string; isTyping: boolean } {
  const [displayText, setDisplayText] = useState(enabled ? "" : text);
  const [isTyping, setIsTyping] = useState(false);
  const prevText = useRef(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
      setDisplayText(text);
      setIsTyping(false);
      prevText.current = text;
      return;
    }

    // Only animate if text changed (new message)
    if (prevText.current === text) return;
    prevText.current = text;

    setIsTyping(true);
    let i = 0;
    setDisplayText("");

    const interval = setInterval(() => {
      i++;
      setDisplayText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  return { displayText, isTyping };
}

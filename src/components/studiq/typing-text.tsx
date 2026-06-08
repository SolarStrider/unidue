import { useEffect, useState } from "react";

/** Client-only terminal typing animation. Renders text immediately on SSR to avoid hydration mismatch. */
export function TypingText({
  text,
  speed = 35,
  className = "",
  cursor = true,
}: {
  text: string;
  speed?: number;
  className?: string;
  cursor?: boolean;
}) {
  const [shown, setShown] = useState(text);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);

  return (
    <span className={`font-mono-ui ${className}`} style={{ fontFamily: "var(--font-mono)" }}>
      {shown}
      {cursor && mounted && <span className="cursor-blink" aria-hidden />}
    </span>
  );
}
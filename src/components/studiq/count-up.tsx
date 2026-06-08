import { useEffect, useRef, useState } from "react";

/** Matrix-style count-up: cycles random digits, then lands on target. */
export function CountUp({ value, duration = 900, className = "" }: { value: number; duration?: number; className?: string }) {
  const [n, setN] = useState(value);
  const start = useRef(performance.now());

  useEffect(() => {
    start.current = performance.now();
    let raf = 0;
    const max = Math.max(1, value);
    function tick(t: number) {
      const p = Math.min(1, (t - start.current) / duration);
      if (p < 1) {
        // jitter early, settle late
        const jitter = (1 - p) * max * 1.2;
        setN(Math.max(0, Math.round(value * p + (Math.random() - 0.5) * jitter)));
        raf = requestAnimationFrame(tick);
      } else {
        setN(value);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className} style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{n}</span>;
}
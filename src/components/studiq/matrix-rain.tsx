import { useEffect, useRef } from "react";

/** Lightweight matrix-style falling glyphs. Renders on a canvas pinned behind content. */
export function MatrixRain({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let columns: number[] = [];
    const chars = "01ABCDEF<>/_$#@*+=Σ∆Ω学習";
    const fontSize = 14;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const colCount = Math.ceil(width / fontSize);
      columns = new Array(colCount).fill(0).map(() => Math.random() * -50);
    }

    function draw() {
      ctx!.fillStyle = "rgba(8, 8, 16, 0.08)";
      ctx!.fillRect(0, 0, width, height);
      ctx!.font = `${fontSize}px 'JetBrains Mono', monospace`;
      for (let i = 0; i < columns.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = columns[i] * fontSize;
        const head = Math.random() < 0.05;
        ctx!.fillStyle = head ? "rgba(0, 245, 255, 0.95)" : "rgba(0, 255, 136, 0.55)";
        ctx!.fillText(text, x, y);
        if (y > height && Math.random() > 0.975) columns[i] = 0;
        columns[i] += 1;
      }
      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={`absolute inset-0 h-full w-full ${className}`} />;
}
/** ASCII-style loading bar: [████████░░] 80% */
export function TerminalBar({ value, segments = 16 }: { value: number; segments?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const filled = Math.round((clamped / 100) * segments);
  const empty = segments - filled;
  return (
    <div className="flex items-center gap-2 text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
      <span className="text-[color:var(--color-cyber-cyan)] [text-shadow:0_0_8px_rgba(0,245,255,0.6)]">
        [{"█".repeat(filled)}<span className="text-muted-foreground/60">{"░".repeat(empty)}</span>]
      </span>
      <span className="text-[color:var(--color-cyber-cyan)] tabular-nums">{clamped}%</span>
    </div>
  );
}
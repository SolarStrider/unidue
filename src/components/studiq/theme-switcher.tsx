import { useProfile } from "@/hooks/use-profile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette } from "lucide-react";

export const THEMES = [
  { key: "cyan", label: "CYAN", code: "//default", color: "#00f5ff" },
  { key: "green", label: "MATRIX", code: "//green", color: "#00ff88" },
  { key: "purple", label: "SYNTH", code: "//purple", color: "#b388ff" },
  { key: "amber", label: "AMBER", code: "//warn", color: "#ffaa00" },
  { key: "red", label: "BLOOD", code: "//danger", color: "#ff3366" },
];

export function ThemeSwitcher() {
  const { profile, update } = useProfile();
  const activeKey = profile?.theme || "cyan";
  const active = THEMES.find((t) => t.key === activeKey) ?? THEMES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Switch theme"
          className="flex items-center gap-2 rounded-sm border px-2 py-1 text-[11px] uppercase tracking-[0.15em] transition hover:bg-[color:var(--color-cyber-cyan)]/10"
          style={{
            fontFamily: "var(--font-mono)",
            color: active.color,
            borderColor: `${active.color}55`,
          }}
        >
          <Palette className="h-3.5 w-3.5" />
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: active.color, boxShadow: `0 0 8px ${active.color}` }}
          />
          <span className="hidden sm:inline">{active.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[180px] border-[color:var(--color-cyber-cyan)]/20 bg-[#0a0a14]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {THEMES.map((t) => {
          const isActive = t.key === activeKey;
          return (
            <DropdownMenuItem
              key={t.key}
              onClick={() => update({ theme: t.key })}
              className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] cursor-pointer"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }}
              />
              <span style={{ color: t.color }}>
                {isActive ? `> ${t.label}` : t.label}
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground">{t.code}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
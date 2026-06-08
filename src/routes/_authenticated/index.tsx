import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, CheckCircle2, Clock, Flame, ListChecks, Target, Trash2 } from "lucide-react";
import { parseISO, isToday, isPast } from "date-fns";
import { dueLabel, formatDate } from "@/lib/studiq/date-format";
import type { Assignment, DailyGoal } from "@/lib/studiq/types";
import { TypingText } from "@/components/studiq/typing-text";
import { CountUp } from "@/components/studiq/count-up";
import { TerminalBar } from "@/components/studiq/terminal-bar";


export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard | Unidue" },
      { name: "description", content: "Unidue terminal dashboard: today's goals, upcoming deadlines, and study streaks at a glance." },
      { property: "og:title", content: "Dashboard | Unidue" },
      { property: "og:description", content: "Unidue terminal dashboard: today's goals, upcoming deadlines, and study streaks at a glance." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function Dashboard() {
  const { profile } = useProfile();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: a } = await supabase.from("assignments").select("*").order("due_date");
      setAssignments((a as Assignment[]) || []);
      const today = new Date().toISOString().slice(0, 10);
      const { data: g } = await supabase.from("daily_goals").select("*").eq("date", today).order("created_at");
      setGoals((g as DailyGoal[]) || []);
      const { data: s } = await supabase.from("streaks").select("*").maybeSingle();
      setStreak(s?.count || 0);
    }
    load();
  }, []);

  const pending = assignments.filter((a) => a.status === "pending");
  const completed = assignments.filter((a) => a.status === "completed");
  const overdue = pending.filter((a) => isPast(parseISO(a.due_date)) && !isToday(parseISO(a.due_date)));
  const dueToday = pending.filter((a) => isToday(parseISO(a.due_date)));
  const completionPct = assignments.length ? Math.round((completed.length / assignments.length) * 100) : 0;
  const upcoming = pending
    .filter((a) => !isPast(parseISO(a.due_date)) || isToday(parseISO(a.due_date)))
    .slice(0, 5);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newGoal.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from("daily_goals").insert({ user_id: user.id, text: newGoal.trim(), date: today }).select().single();
    if (data) setGoals([...goals, data as DailyGoal]);
    setNewGoal("");
  }

  async function toggleGoal(g: DailyGoal) {
    const { data } = await supabase.from("daily_goals").update({ done: !g.done }).eq("id", g.id).select().single();
    if (data) setGoals(goals.map((x) => (x.id === g.id ? (data as DailyGoal) : x)));
  }

  async function deleteGoal(id: string) {
    await supabase.from("daily_goals").delete().eq("id", id);
    setGoals(goals.filter((g) => g.id !== id));
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="space-y-1.5">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
          unidue@shell ~ %
        </div>
        <h1 className="text-2xl md:text-3xl text-[color:var(--color-cyber-cyan)] [text-shadow:0_0_12px_rgba(0,245,255,0.45)]">
          <TypingText
            text={`> WELCOME BACK, ${(profile?.name?.split(" ")[0] || "SOLARSTRIDER").toUpperCase()}_`}
            speed={32}
          />
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
          <span className="text-[color:var(--color-cyber-green)]">{">"}</span>{" "}
          <span className="text-foreground/80">{pending.length} TASKS PENDING</span>
          <span className="mx-2 opacity-40">|</span>
          <span className={overdue.length > 0 ? "text-[color:var(--color-cyber-red)]" : "text-foreground/60"}>
            {overdue.length} OVERDUE
          </span>
          <span className="mx-2 opacity-40">|</span>
          <span className="text-[color:var(--color-cyber-amber)]">{dueToday.length} DUE TODAY</span>
        </p>
      </div>

      {overdue.length >= 3 && (
        <div
          className="cyber-card flex items-center gap-3 rounded-md border border-[color:var(--color-cyber-red)]/50 bg-[color:var(--color-cyber-red)]/10 p-4 text-foreground"
          style={{ boxShadow: "0 0 24px -8px rgba(255,51,102,0.5)" }}
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-[color:var(--color-cyber-red)]" />
          <div className="text-sm" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="text-[color:var(--color-cyber-red)]">[ALERT]</span>{" "}
            <span>Workload critical — {overdue.length} overdue tasks detected.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat icon={Clock} label="pending" value={pending.length} />
        <Stat icon={CheckCircle2} label="completed" value={completed.length} tone="success" />
        <Stat icon={AlertTriangle} label="overdue" value={overdue.length} tone="destructive" />
        <Stat icon={Target} label="due_today" value={dueToday.length} tone="warning" />
        <Stat icon={ListChecks} label="rate" value={`${completionPct}%`} />
        <Stat icon={Flame} label="streak" value={`${streak}d`} tone="warning" />
      </div>

      <Card className="cyber-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
            <span>// sys.progress</span>
            <span className="text-[color:var(--color-cyber-cyan)]">{completed.length}/{assignments.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <TerminalBar value={completionPct} segments={24} />
          <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
            {">"} {completed.length} of {assignments.length} tasks completed
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="cyber-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
              // upcoming.queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                {">"} queue empty // stand down 🌤
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((a) => {
                  const d = dueLabel(a.due_date);
                  return (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-md border border-[color:var(--color-cyber-cyan)]/15 bg-black/30 p-3 transition-colors hover:border-[color:var(--color-cyber-cyan)]/40"
                    >
                      <div>
                        <div className="text-sm font-medium text-foreground">{a.title}</div>
                        <div className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                          [{a.subject}] · {formatDate(a.due_date, profile?.date_format)}
                        </div>
                      </div>
                      <span className={`terminal-tag ${
                        d.tone === "overdue" ? "text-[color:var(--color-cyber-red)]" :
                        d.tone === "today" ? "text-[color:var(--color-cyber-cyan)]" :
                        d.tone === "soon" ? "text-[color:var(--color-cyber-amber)]" :
                        "text-muted-foreground"
                      }`}>{d.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="cyber-card accent-purple">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
              // daily.objectives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={addGoal} className="flex gap-2">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="> input new objective..."
                className="input-caret bg-black/40 border-[color:var(--color-cyber-cyan)]/30 focus-visible:border-[color:var(--color-cyber-cyan)] focus-visible:ring-[color:var(--color-cyber-cyan)]/30"
                style={{ fontFamily: "var(--font-mono)" }}
              />
              <Button type="submit" className="cyber-btn">EXEC</Button>
            </form>
            <ul className="space-y-2">
              {goals.length === 0 && (
                <li className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                  {">"} no objectives queued
                </li>
              )}
              {goals.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center gap-2 rounded-md border border-[color:var(--color-cyber-cyan)]/15 bg-black/30 p-2.5"
                >
                  <Checkbox checked={g.done} onCheckedChange={() => toggleGoal(g)} />
                  <span
                    className={`flex-1 text-sm ${g.done ? "text-[color:var(--color-cyber-green)] line-through" : "text-foreground"}`}
                    style={{ fontFamily: g.done ? "var(--font-mono)" : undefined }}
                  >
                    {g.done && <span className="mr-1 text-[color:var(--color-cyber-green)]">[DONE ✓]</span>}
                    {g.text}
                  </span>
                  <button
                    aria-label={`Delete goal: ${g.text}`}
                    onClick={() => deleteGoal(g.id)}
                    className="text-muted-foreground hover:text-[color:var(--color-cyber-red)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  tone?: "destructive" | "success" | "warning";
}) {
  const color =
    tone === "destructive" ? "var(--color-cyber-red)" :
    tone === "success" ? "var(--color-cyber-green)" :
    tone === "warning" ? "var(--color-cyber-amber)" :
    "var(--color-cyber-cyan)";
  const isNumber = typeof value === "number";
  return (
    <Card className="cyber-card overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            [{label}]
          </span>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <div
          className="mt-2 text-3xl font-bold tabular-nums"
          style={{ color, fontFamily: "var(--font-mono)", textShadow: `0 0 12px ${color}55` }}
        >
          {isNumber ? <CountUp value={value as number} /> : value}
        </div>
        <div className="mt-1 h-px w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-30" style={{ color }} />
      </CardContent>
    </Card>
  );
}

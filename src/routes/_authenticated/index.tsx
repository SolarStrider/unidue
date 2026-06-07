import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, CheckCircle2, Clock, Flame, ListChecks, Target, Trash2 } from "lucide-react";
import { parseISO, isToday, isPast } from "date-fns";
import { dueLabel, formatDate } from "@/lib/studiq/date-format";
import type { Assignment, DailyGoal } from "@/lib/studiq/types";


export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""} 👋</h1>
        <p className="text-sm text-muted-foreground">Here's your study overview for today.</p>
      </div>

      {overdue.length >= 3 && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive-foreground">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <div className="text-sm">
            <span className="font-semibold text-destructive">Heavy workload:</span>{" "}
            <span className="text-foreground">You have {overdue.length} overdue assignments. Time to catch up!</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat icon={Clock} label="Pending" value={pending.length} />
        <Stat icon={CheckCircle2} label="Completed" value={completed.length} />
        <Stat icon={AlertTriangle} label="Overdue" value={overdue.length} tone="destructive" />
        <Stat icon={Target} label="Due today" value={dueToday.length} tone="accent" />
        <Stat icon={ListChecks} label="Completion" value={`${completionPct}%`} />
        <Stat icon={Flame} label="Streak" value={`${streak}d`} tone="accent" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Overall progress</CardTitle></CardHeader>
        <CardContent>
          <Progress value={completionPct} />
          <p className="mt-2 text-xs text-muted-foreground">{completed.length} of {assignments.length} assignments completed</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Upcoming deadlines</CardTitle></CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing due soon. Enjoy the calm 🌤️</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((a) => {
                  const d = dueLabel(a.due_date);
                  return (
                    <li key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3">
                      <div>
                        <div className="text-sm font-medium">{a.title}</div>
                        <div className="text-xs text-muted-foreground">{a.subject} · {formatDate(a.due_date, profile?.date_format)}</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        d.tone === "overdue" ? "bg-destructive/20 text-destructive" :
                        d.tone === "today" ? "bg-primary/20 text-primary" :
                        d.tone === "soon" ? "bg-yellow-500/20 text-yellow-500" :
                        "bg-muted text-muted-foreground"
                      }`}>{d.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Daily goals</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={addGoal} className="flex gap-2">
              <Input value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="Add a goal for today..." />
              <Button type="submit">Add</Button>
            </form>
            <ul className="space-y-2">
              {goals.length === 0 && <li className="text-sm text-muted-foreground">No goals yet for today.</li>}
              {goals.map((g) => (
                <li key={g.id} className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-2.5">
                  <Checkbox checked={g.done} onCheckedChange={() => toggleGoal(g)} />
                  <span className={`flex-1 text-sm ${g.done ? "line-through text-muted-foreground" : ""}`}>{g.text}</span>
                  <button aria-label={`Delete goal: ${g.text}`} onClick={() => deleteGoal(g.id)} className="text-muted-foreground hover:text-destructive">
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

function Stat({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number | string; tone?: "destructive" | "accent" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${tone === "destructive" ? "text-destructive" : tone === "accent" ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

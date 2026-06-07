import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, CalendarPlus, CheckCircle2, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { ASSIGNMENT_TYPES, SUBJECTS, type Assignment, type Priority, type Status } from "@/lib/studiq/types";
import { dueLabel, formatDate } from "@/lib/studiq/date-format";
import { googleCalendarUrl } from "@/lib/studiq/google-calendar";

export const Route = createFileRoute("/_authenticated/assignments")({
  component: AssignmentsPage,
  head: () => ({
    meta: [
      { title: "Assignments | Studiq" },
      { name: "description", content: "Manage college assignments, deadlines, priorities, and progress in one place." },
      { property: "og:title", content: "Assignments | Studiq" },
      { property: "og:description", content: "Manage college assignments, deadlines, priorities, and progress in one place." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type FormState = {
  id?: string;
  title: string;
  subject: string;
  type: string;
  due_date: string;
  priority: Priority;
  notes: string;
  status: Status;
};

const empty: FormState = {
  title: "", subject: "Mathematics", type: "Homework",
  due_date: new Date().toISOString().slice(0, 16),
  priority: "medium", notes: "", status: "pending",
};

function AssignmentsPage() {
  const { profile } = useProfile();
  const [items, setItems] = useState<Assignment[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  async function load() {
    const { data } = await supabase.from("assignments").select("*").order("due_date");
    setItems((data as Assignment[]) || []);
  }

  useEffect(() => { load(); }, []);

  function openNew() { setForm(empty); setOpen(true); }
  function openEdit(a: Assignment) {
    setForm({
      id: a.id, title: a.title, subject: a.subject, type: a.type,
      due_date: a.due_date.slice(0, 16), priority: a.priority, notes: a.notes, status: a.status,
    });
    setOpen(true);
  }

  async function save() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      title: form.title, subject: form.subject, type: form.type,
      due_date: new Date(form.due_date).toISOString(),
      priority: form.priority, notes: form.notes, status: form.status,
      user_id: user.id,
    };
    if (form.id) {
      const { error } = await supabase.from("assignments").update(payload).eq("id", form.id);
      if (error) return toast.error(error.message);
      toast.success("Assignment updated");
    } else {
      const { error } = await supabase.from("assignments").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Assignment added");
    }
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    await supabase.from("assignments").delete().eq("id", id);
    toast.success("Assignment deleted");
    load();
  }

  async function toggleComplete(a: Assignment) {
    const next: Status = a.status === "completed" ? "pending" : "completed";
    const { error } = await supabase.from("assignments").update({
      status: next, completed_at: next === "completed" ? new Date().toISOString() : null,
    }).eq("id", a.id);
    if (error) return toast.error(error.message);
    if (next === "completed") {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      await bumpStreak();
      toast.success("Nice work! 🎉");
    }
    load();
  }

  async function bumpStreak() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data: s } = await supabase.from("streaks").select("*").eq("user_id", user.id).maybeSingle();
    if (!s) {
      await supabase.from("streaks").insert({ user_id: user.id, last_completion_date: today, count: 1 });
      return;
    }
    if (s.last_completion_date === today) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yesterday = y.toISOString().slice(0, 10);
    const newCount = s.last_completion_date === yesterday ? s.count + 1 : 1;
    await supabase.from("streaks").update({ last_completion_date: today, count: newCount }).eq("user_id", user.id);
  }

  const filtered = items.filter((a) =>
    (filterStatus === "all" || a.status === filterStatus) &&
    (filterPriority === "all" || a.priority === filterPriority) &&
    (filterSubject === "all" || a.subject === filterSubject)
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-sm text-muted-foreground">Add, edit and track every piece of coursework.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> New assignment</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No assignments match your filters yet.</CardContent></Card>
        )}
        {filtered.map((a) => {
          const d = dueLabel(a.due_date);
          const borderColor = a.priority === "high" ? "var(--priority-high)" : a.priority === "medium" ? "var(--priority-medium)" : "var(--priority-low)";
          return (
            <Card key={a.id} style={{ borderLeft: `4px solid ${borderColor}` }}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className={`text-base font-semibold ${a.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{a.title}</h2>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{a.type}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        d.tone === "overdue" ? "bg-destructive/20 text-destructive" :
                        d.tone === "today" ? "bg-primary/20 text-primary" :
                        d.tone === "soon" ? "bg-yellow-500/20 text-yellow-500" :
                        "bg-muted text-muted-foreground"
                      }`}>{d.label}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{a.subject} · Due {formatDate(a.due_date, profile?.date_format)}</div>
                    {a.notes && <p className="mt-2 text-sm text-foreground/80">{a.notes}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button size="sm" variant={a.status === "completed" ? "outline" : "default"} onClick={() => toggleComplete(a)}>
                      {a.status === "completed" ? <><RotateCcw className="h-4 w-4 mr-1" />Reopen</> : <><CheckCircle2 className="h-4 w-4 mr-1" />Done</>}
                    </Button>
                    <Button size="icon" variant="ghost" asChild>
                      <a href={googleCalendarUrl(a)} target="_blank" rel="noopener noreferrer" title="Add to Google Calendar"><CalendarPlus className="h-4 w-4" /></a>
                    </Button>
                    <Button size="icon" variant="ghost" aria-label={`Edit ${a.title}`} onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label={`Delete ${a.title}`} onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Edit assignment" : "New assignment"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Subject</Label>
                <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSIGNMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due date</Label>
                <Input type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
            {form.id && (
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{form.id ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
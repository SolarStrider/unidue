import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GRADING_SYSTEMS, GRADING_SYSTEM_NAMES } from "@/lib/studiq/grading-systems";
import { SUBJECTS, type Grade } from "@/lib/studiq/types";

export const Route = createFileRoute("/_authenticated/grades")({
  component: GradesPage,
});

function GradesPage() {
  const { profile } = useProfile();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subject, setSubject] = useState("Mathematics");
  const [assignment, setAssignment] = useState("");
  const [system, setSystem] = useState<string>(profile?.grading_system || "US");
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    if (profile?.grading_system) setSystem(profile.grading_system);
  }, [profile?.grading_system]);

  async function load() {
    const { data } = await supabase.from("grades").select("*").order("created_at", { ascending: false });
    setGrades((data as Grade[]) || []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!assignment.trim() || !value) return toast.error("Add assignment and grade");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("grades").insert({
      user_id: user.id, subject, assignment: assignment.trim(), grade_value: value, grading_system: system,
    });
    if (error) return toast.error(error.message);
    toast.success("Grade saved");
    setAssignment(""); setValue("");
    load();
  }

  async function remove(id: string) {
    await supabase.from("grades").delete().eq("id", id);
    load();
  }

  const options = GRADING_SYSTEMS[system] || GRADING_SYSTEMS.US;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Grade tracker</h1>
        <p className="text-sm text-muted-foreground">Log results in your preferred grading system.</p>
      </div>

      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-5">
          <div className="md:col-span-1">
            <Label>Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Assignment</Label>
            <Input value={assignment} onChange={(e) => setAssignment(e.target.value)} placeholder="Midterm essay" />
          </div>
          <div>
            <Label>System</Label>
            <Select value={system} onValueChange={setSystem}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{GRADING_SYSTEM_NAMES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Grade</Label>
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger><SelectValue placeholder="Pick..." /></SelectTrigger>
              <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-5">
            <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> Add grade</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-2">
        {grades.length === 0 && (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No grades yet — add your first one above.</CardContent></Card>
        )}
        {grades.map((g) => (
          <Card key={g.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-14 items-center justify-center rounded-md bg-primary/15 text-primary font-bold">{g.grade_value}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{g.assignment}</div>
                <div className="text-xs text-muted-foreground">{g.subject} · {g.grading_system}</div>
              </div>
              <Button size="icon" variant="ghost" aria-label="Delete grade entry" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
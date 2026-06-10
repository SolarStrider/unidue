import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useServerFn } from "@tanstack/react-start";
import { aiGenerateQuiz } from "@/lib/ai/ai.functions";
import { toggleBookmark, isBookmarked } from "@/lib/studiq/bookmarks";
import { toast } from "sonner";
import { Sparkles, Bookmark, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/quiz")({
  component: QuizPage,
  head: () => ({ meta: [{ title: "Quiz | Unidue" }, { name: "robots", content: "noindex" }] }),
});

type Quiz = {
  id: string; name: string; source_type: string; source_label: string;
  difficulty: "easy" | "medium" | "hard";
  questions: { question: string; options: string[]; correctIndex: number; explanation?: string }[];
};
type Attempt = { quiz_id: string; score: number; total: number; taken_at: string };

const DIFF_COLOR: Record<string, string> = { easy: "#00ff88", medium: "#ffaa00", hard: "#ff3366" };

function QuizPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [lastScores, setLastScores] = useState<Record<string, Attempt>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<Quiz | null>(null);

  async function load() {
    const { data } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false });
    const qs = (data || []) as unknown as Quiz[];
    setQuizzes(qs);
    const { data: atts } = await supabase.from("quiz_attempts").select("*").order("taken_at", { ascending: false });
    const map: Record<string, Attempt> = {};
    for (const a of (atts || []) as Attempt[]) { if (!map[a.quiz_id]) map[a.quiz_id] = a; }
    setLastScores(map);
    for (const q of qs) isBookmarked("quiz", q.id).then((v) => setBookmarks((p) => ({ ...p, [q.id]: v })));
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="text-[color:var(--color-cyber-cyan)]">//</span> QUIZ_SYSTEM<span className="cursor-blink" />
          </h1>
        </div>
        <AiQuizDialog onCreated={load} />
      </div>

      {active ? (
        <QuizRunner quiz={active} onExit={() => { setActive(null); load(); }} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quizzes.map((q) => {
            const last = lastScores[q.id];
            return (
              <div key={q.id} className="cyber-card p-4 space-y-2" style={{ fontFamily: "var(--font-mono)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-bold">{q.name}</div>
                  <button onClick={async () => { const v = await toggleBookmark("quiz", q.id, q.name); setBookmarks((p) => ({ ...p, [q.id]: v })); }} className="text-xs text-[color:var(--color-cyber-cyan)]">{bookmarks[q.id] ? "[BOOKMARKED ✓]" : "[+]"}</button>
                </div>
                <div className="text-[11px] text-muted-foreground">[{q.source_label || q.source_type}]</div>
                <div className="text-[11px] flex gap-2">
                  <span style={{ color: DIFF_COLOR[q.difficulty] }}>[{q.difficulty.toUpperCase()}]</span>
                  <span>{q.questions.length} questions</span>
                </div>
                {last && <div className="text-[11px] text-[color:var(--color-cyber-green)]">&gt; LAST: {last.score}/{last.total}</div>}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="cyber-btn flex-1" onClick={() => setActive(q)}>[ START ]</Button>
                  <Button size="sm" variant="outline" onClick={async () => { if (confirm("Delete quiz?")) { await supabase.from("quizzes").delete().eq("id", q.id); load(); } }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            );
          })}
          {quizzes.length === 0 && <div className="text-xs text-muted-foreground p-6" style={{ fontFamily: "var(--font-mono)" }}>&gt; no quizzes — generate one with AI</div>}
        </div>
      )}
    </div>
  );
}

function AiQuizDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [sourceType, setSourceType] = useState<"note" | "deck">("note");
  const [sources, setSources] = useState<{ id: string; label: string }[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(aiGenerateQuiz);
  useEffect(() => {
    if (!open) return;
    if (sourceType === "note") {
      supabase.from("notes").select("id,title").order("updated_at", { ascending: false }).then(({ data }) => setSources((data || []).map((n: any) => ({ id: n.id, label: n.title }))));
    } else {
      supabase.from("flashcard_decks").select("id,name").order("created_at", { ascending: false }).then(({ data }) => setSources((data || []).map((n: any) => ({ id: n.id, label: n.name }))));
    }
    setSourceId("");
  }, [sourceType, open]);
  async function generate() {
    if (!sourceId) return;
    setBusy(true);
    try {
      const r: any = await gen({ data: { sourceType, sourceId, count, difficulty } });
      toast.success(`> QUIZ GENERATED — ${r.count} questions ✓`);
      setOpen(false); onCreated();
    } catch (e: any) { toast.error(e?.message || "AI failed"); }
    setBusy(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="cyber-btn" style={{ borderColor: "#7c3aed", color: "#b388ff" }}><Sparkles className="h-3 w-3 mr-1"/>[ AI GENERATE ]</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle style={{ fontFamily: "var(--font-mono)" }}>// AI_GENERATE_QUIZ</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={sourceType} onValueChange={(v: any) => setSourceType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="note">From Note</SelectItem>
              <SelectItem value="deck">From Flashcard Deck</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger><SelectValue placeholder="Pick source" /></SelectTrigger>
            <SelectContent>{sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">[EASY]</SelectItem>
              <SelectItem value="medium">[MEDIUM]</SelectItem>
              <SelectItem value="hard">[HARD]</SelectItem>
            </SelectContent>
          </Select>
          <div>
            <label className="text-xs" style={{ fontFamily: "var(--font-mono)" }}>QUESTIONS: {count}</label>
            <input type="range" min={5} max={30} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full" />
          </div>
        </div>
        <DialogFooter><Button onClick={generate} disabled={busy || !sourceId} className="cyber-btn">{busy ? "GENERATING..." : "[ GENERATE ]"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuizRunner({ quiz, onExit }: { quiz: Quiz; onExit: () => void }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    setTimeLeft(30);
    const t = setInterval(() => setTimeLeft((s) => {
      if (s <= 1) { clearInterval(t); pick(-1); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done]);

  function pick(i: number) {
    const next = [...answers, i];
    setAnswers(next);
    if (idx + 1 >= quiz.questions.length) finish(next);
    else setIdx(idx + 1);
  }

  async function finish(final: number[]) {
    setDone(true);
    const score = final.reduce((s, a, i) => s + (a === quiz.questions[i].correctIndex ? 1 : 0), 0);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("quiz_attempts").insert({ user_id: user.id, quiz_id: quiz.id, score, total: quiz.questions.length, answers: final });
  }

  if (done) {
    const score = answers.reduce((s, a, i) => s + (a === quiz.questions[i].correctIndex ? 1 : 0), 0);
    const passed = score / quiz.questions.length >= 0.6;
    return (
      <div className="space-y-4" style={{ fontFamily: "var(--font-mono)" }}>
        <div className="cyber-card p-6 text-center">
          <div className={`text-2xl ${passed ? "text-[color:var(--color-cyber-green)]" : "text-[color:var(--color-cyber-red)]"}`}>&gt; SCORE: {score}/{quiz.questions.length} — [{passed ? "PASSED ✓" : "FAILED ✗"}]</div>
          <div className="flex justify-center gap-2 mt-4">
            <Button className="cyber-btn" onClick={() => { setAnswers([]); setIdx(0); setDone(false); }}>[ RETAKE QUIZ ]</Button>
            <Button variant="outline" onClick={onExit}>[ BACK ]</Button>
          </div>
        </div>
        <div className="cyber-card p-4 space-y-3">
          <div className="text-xs text-[color:var(--color-cyber-cyan)]">// BREAKDOWN</div>
          {quiz.questions.map((q, i) => {
            const ok = answers[i] === q.correctIndex;
            return (
              <div key={i} className="border-l-2 pl-3 py-1" style={{ borderColor: ok ? "#00ff88" : "#ff3366" }}>
                <div className="text-sm">Q{i + 1}: {q.question}</div>
                <div className="text-[11px] text-muted-foreground">Your: {q.options[answers[i]] ?? "—"} · Correct: {q.options[q.correctIndex]}</div>
                {q.explanation && <div className="text-[11px] text-muted-foreground italic">{q.explanation}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const q = quiz.questions[idx];
  return (
    <div className="cyber-card p-6 space-y-4" style={{ fontFamily: "var(--font-mono)" }}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[color:var(--color-cyber-cyan)]">&gt; Q{idx + 1} OF {quiz.questions.length}</span>
        <span className={timeLeft <= 10 ? "text-[color:var(--color-cyber-red)]" : "text-[color:var(--color-cyber-amber)]"}>&gt; TIME: 00:{String(timeLeft).padStart(2, "0")}</span>
        <button onClick={onExit} className="text-muted-foreground">[ EXIT ]</button>
      </div>
      <div className="text-lg">{q.question}</div>
      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => pick(i)} className="w-full text-left p-3 border border-[color:var(--color-cyber-cyan)]/20 rounded-sm hover:border-[color:var(--color-cyber-cyan)] hover:bg-[color:var(--color-cyber-cyan)]/10 transition-colors">
            <span className="text-[color:var(--color-cyber-cyan)] mr-2">[{String.fromCharCode(65 + i)}]</span> {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
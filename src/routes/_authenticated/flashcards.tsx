import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useServerFn } from "@tanstack/react-start";
import { aiGenerateFlashcards } from "@/lib/ai/ai.functions";
import { toggleBookmark, isBookmarked } from "@/lib/studiq/bookmarks";
import { toast } from "sonner";
import { Plus, Sparkles, Bookmark, Shuffle, Check, RotateCw, Trash2 } from "lucide-react";
import { TerminalBar } from "@/components/studiq/terminal-bar";
import { SUBJECTS } from "@/lib/studiq/types";

export const Route = createFileRoute("/_authenticated/flashcards")({
  component: FlashcardsPage,
  head: () => ({ meta: [{ title: "Flashcards | Unidue" }, { name: "robots", content: "noindex" }] }),
});

type Deck = { id: string; name: string; subject: string; source_note_id: string | null };
type Card = { id: string; deck_id: string; front: string; back: string; ease: number; interval_days: number; next_review: string; times_known: number; times_review: number };

function FlashcardsPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [counts, setCounts] = useState<Record<string, { total: number; known: number }>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [studyDeck, setStudyDeck] = useState<Deck | null>(null);
  const [streak, setStreak] = useState(0);

  async function load() {
    const { data } = await supabase.from("flashcard_decks").select("*").order("created_at", { ascending: false });
    const ds = (data || []) as Deck[];
    setDecks(ds);
    const c: Record<string, { total: number; known: number }> = {};
    for (const d of ds) {
      const { data: cards } = await supabase.from("flashcards").select("times_known,times_review").eq("deck_id", d.id);
      const total = cards?.length || 0;
      const known = (cards || []).filter((x: any) => x.times_known > x.times_review).length;
      c[d.id] = { total, known };
      isBookmarked("deck", d.id).then((v) => setBookmarks((p) => ({ ...p, [d.id]: v })));
    }
    setCounts(c);
    // Streak from streaks table
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: s } = await supabase.from("streaks").select("count").eq("user_id", user.id).maybeSingle();
      setStreak(s?.count || 0);
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="text-[color:var(--color-cyber-cyan)]">//</span> FLASHCARD_SYSTEM<span className="cursor-blink" />
          </h1>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>&gt; STREAK: {streak} DAYS 🔥</p>
        </div>
        <div className="flex gap-2">
          <NewDeckDialog onCreated={load} />
          <AiGenerateDialog onCreated={load} />
        </div>
      </div>

      {studyDeck ? (
        <StudyMode deck={studyDeck} onExit={() => { setStudyDeck(null); load(); }} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {decks.map((d) => {
            const { total = 0, known = 0 } = counts[d.id] || {};
            const pct = total ? Math.round((known / total) * 100) : 0;
            return (
              <div key={d.id} className="cyber-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-mono text-sm font-bold">{d.name}</div>
                  <button onClick={async () => { const v = await toggleBookmark("deck", d.id, d.name, d.subject); setBookmarks((p) => ({ ...p, [d.id]: v })); }} className="text-xs text-[color:var(--color-cyber-cyan)]" style={{ fontFamily: "var(--font-mono)" }}>{bookmarks[d.id] ? "[BOOKMARKED ✓]" : "[+]"}</button>
                </div>
                <div className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                  {d.subject && <span className="text-[color:var(--color-cyber-cyan)]">[{d.subject}] </span>}
                  · {total} cards
                </div>
                <TerminalBar value={pct} />
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="cyber-btn flex-1" disabled={!total} onClick={() => setStudyDeck(d)}>[ STUDY ]</Button>
                  <Button size="sm" variant="outline" onClick={async () => { if (confirm("Delete deck?")) { await supabase.from("flashcard_decks").delete().eq("id", d.id); load(); } }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            );
          })}
          {decks.length === 0 && <div className="text-xs text-muted-foreground p-6" style={{ fontFamily: "var(--font-mono)" }}>&gt; no decks yet — create one or generate from a note</div>}
        </div>
      )}
    </div>
  );
}

function NewDeckDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [cards, setCards] = useState<{ front: string; back: string }[]>([{ front: "", back: "" }]);
  async function save() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !name) return;
    const { data: deck } = await supabase.from("flashcard_decks").insert({ user_id: user.id, name, subject }).select().single();
    if (deck) {
      const rows = cards.filter((c) => c.front && c.back).map((c) => ({ user_id: user.id, deck_id: deck.id, front: c.front, back: c.back }));
      if (rows.length) await supabase.from("flashcards").insert(rows);
    }
    setOpen(false); setName(""); setSubject(""); setCards([{ front: "", back: "" }]); onCreated();
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="cyber-btn"><Plus className="h-3 w-3 mr-1"/>[ + NEW DECK ]</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle style={{ fontFamily: "var(--font-mono)" }}>// NEW_DECK</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Deck name" value={name} onChange={(e) => setName(e.target.value)} />
          <Select value={subject || "__none"} onValueChange={(v) => setSubject(v === "__none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">[ NONE ]</SelectItem>
              {SUBJECTS.map((s) => <SelectItem key={s} value={s}>[{s}]</SelectItem>)}
            </SelectContent>
          </Select>
          {cards.map((c, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <Textarea placeholder="Front" value={c.front} onChange={(e) => { const n = [...cards]; n[i].front = e.target.value; setCards(n); }} />
              <Textarea placeholder="Back" value={c.back} onChange={(e) => { const n = [...cards]; n[i].back = e.target.value; setCards(n); }} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setCards([...cards, { front: "", back: "" }])}>+ Add card</Button>
        </div>
        <DialogFooter><Button onClick={save} className="cyber-btn">[ SAVE DECK ]</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AiGenerateDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<{ id: string; title: string }[]>([]);
  const [noteId, setNoteId] = useState<string>("");
  const [count, setCount] = useState(10);
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(aiGenerateFlashcards);
  useEffect(() => {
    if (open) supabase.from("notes").select("id,title").order("updated_at", { ascending: false }).then(({ data }) => setNotes((data || []) as any));
  }, [open]);
  async function generate() {
    if (!noteId) return;
    setBusy(true);
    try {
      const r: any = await gen({ data: { noteId, count } });
      toast.success(`> DECK GENERATED — ${r.count} cards ✓`);
      setOpen(false); onCreated();
    } catch (e: any) { toast.error(e?.message || "AI failed"); }
    setBusy(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="cyber-btn" style={{ borderColor: "#7c3aed", color: "#b388ff" }}><Sparkles className="h-3 w-3 mr-1"/>[ AI GENERATE FROM NOTE ]</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle style={{ fontFamily: "var(--font-mono)" }}>// AI_GENERATE_DECK</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={noteId} onValueChange={setNoteId}>
            <SelectTrigger><SelectValue placeholder="Select a note" /></SelectTrigger>
            <SelectContent>{notes.map((n) => <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>)}</SelectContent>
          </Select>
          <div>
            <label className="text-xs" style={{ fontFamily: "var(--font-mono)" }}>CARDS: {count}</label>
            <input type="range" min={3} max={30} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full" />
          </div>
        </div>
        <DialogFooter><Button onClick={generate} disabled={busy || !noteId} className="cyber-btn">{busy ? "GENERATING..." : "[ GENERATE ]"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StudyMode({ deck, onExit }: { deck: Deck; onExit: () => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [queue, setQueue] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [known, setKnown] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.from("flashcards").select("*").eq("deck_id", deck.id).then(({ data }) => {
      let arr = (data || []) as Card[];
      if (shuffle) arr = [...arr].sort(() => Math.random() - 0.5);
      else arr = [...arr].sort((a, b) => new Date(a.next_review).getTime() - new Date(b.next_review).getTime());
      setCards(arr); setQueue(arr); setIdx(0); setFlipped(false); setKnown(0); setDone(false);
    });
  }, [deck.id, shuffle]);

  const card = queue[idx];

  async function mark(isKnown: boolean) {
    if (!card) return;
    const ease = isKnown ? Math.min(card.ease + 0.15, 3.5) : Math.max(card.ease - 0.2, 1.3);
    const interval = isKnown ? Math.max(1, Math.round((card.interval_days || 1) * ease)) : 0;
    const next = new Date(Date.now() + interval * 86400000).toISOString();
    await supabase.from("flashcards").update({
      ease, interval_days: interval, next_review: next,
      times_known: card.times_known + (isKnown ? 1 : 0),
      times_review: card.times_review + (isKnown ? 0 : 1),
    }).eq("id", card.id);
    if (isKnown) setKnown((k) => k + 1);
    else setQueue((q) => [...q, card]); // spaced repetition: re-show
    setFlipped(false);
    if (idx + 1 >= queue.length && isKnown) setDone(true);
    else setIdx((i) => i + 1);
  }

  if (done) {
    return (
      <div className="cyber-card p-8 text-center space-y-4" style={{ fontFamily: "var(--font-mono)" }}>
        <div className="text-2xl text-[color:var(--color-cyber-green)]">&gt; SESSION COMPLETE — {known}/{cards.length} KNOWN</div>
        <Button className="cyber-btn" onClick={onExit}>[ BACK TO DECKS ]</Button>
      </div>
    );
  }

  if (!card) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="cyber-card p-6 space-y-4">
      <div className="flex items-center justify-between text-xs" style={{ fontFamily: "var(--font-mono)" }}>
        <span className="text-muted-foreground">&gt; CARD {idx + 1}/{queue.length}</span>
        <button onClick={() => setShuffle(!shuffle)} className="text-[color:var(--color-cyber-cyan)]"><Shuffle className="h-3 w-3 inline mr-1" />[ SHUFFLE {shuffle ? "ON" : "OFF"} ]</button>
        <button onClick={onExit} className="text-muted-foreground">[ EXIT ]</button>
      </div>
      <TerminalBar value={Math.round(((idx) / queue.length) * 100)} />
      <div
        onClick={() => setFlipped(!flipped)}
        className="min-h-[260px] flex items-center justify-center p-8 border border-[color:var(--color-cyber-cyan)]/40 rounded-sm bg-black/40 text-center cursor-pointer transition-transform duration-300"
        style={{ fontFamily: "var(--font-mono)", transform: flipped ? "rotateY(0deg) scale(1.01)" : "rotateY(0deg)" }}
      >
        <div className="text-xl">{flipped ? card.back : card.front}</div>
      </div>
      {!flipped ? (
        <Button className="cyber-btn w-full" onClick={() => setFlipped(true)}><RotateCw className="h-3 w-3 mr-1" />[ FLIP ]</Button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => mark(true)} className="cyber-btn" style={{ borderColor: "#00ff88", color: "#00ff88" }}><Check className="h-3 w-3 mr-1"/>[ KNOWN ✓ ]</Button>
          <Button onClick={() => mark(false)} className="cyber-btn" style={{ borderColor: "#ffaa00", color: "#ffaa00" }}><RotateCw className="h-3 w-3 mr-1"/>[ REVIEW ↺ ]</Button>
        </div>
      )}
    </div>
  );
}
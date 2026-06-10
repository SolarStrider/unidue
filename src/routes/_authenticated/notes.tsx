import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServerFn } from "@tanstack/react-start";
import { aiSummariseNote, aiGenerateTags } from "@/lib/ai/ai.functions";
import { toggleBookmark, isBookmarked } from "@/lib/studiq/bookmarks";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bold, Italic, Heading, Code, List, Pin, Sparkles, Tag, Bookmark, FileDown, Plus, Trash2, Save } from "lucide-react";
import { SUBJECTS } from "@/lib/studiq/types";
import { jsPDF } from "jspdf";

export const Route = createFileRoute("/_authenticated/notes")({
  component: NotesPage,
  head: () => ({ meta: [{ title: "Notes | Unidue" }, { name: "robots", content: "noindex" }] }),
});

type Note = {
  id: string; title: string; content: string; subject: string;
  pinned: boolean; tags: string[]; ai_summary: string;
  assignment_id: string | null; updated_at: string;
};

function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("updated");
  const [filterSubject, setFilterSubject] = useState("__all");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [bookmarked, setBookmarked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const summarise = useServerFn(aiSummariseNote);
  const genTags = useServerFn(aiGenerateTags);

  async function load() {
    const { data } = await supabase.from("notes").select("*").order("pinned", { ascending: false }).order("updated_at", { ascending: false });
    setNotes((data || []) as Note[]);
  }
  useEffect(() => { load(); }, []);

  const active = notes.find((n) => n.id === activeId) || null;

  useEffect(() => {
    if (active) isBookmarked("note", active.id).then(setBookmarked);
    else setBookmarked(false);
  }, [activeId]);

  const filtered = useMemo(() => {
    let r = notes.filter((n) =>
      (filterSubject === "__all" || n.subject === filterSubject) &&
      (!search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
    );
    if (sortBy === "title") r = [...r].sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "subject") r = [...r].sort((a, b) => a.subject.localeCompare(b.subject));
    return r;
  }, [notes, search, sortBy, filterSubject]);

  async function createNote() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("notes").insert({
      user_id: user.id, title: "Untitled", content: "", subject: "",
    }).select().single();
    await load();
    if (data) setActiveId((data as Note).id);
  }

  async function updateActive(patch: Partial<Note>) {
    if (!active) return;
    setNotes((p) => p.map((n) => n.id === active.id ? { ...n, ...patch } as Note : n));
  }

  async function saveActive() {
    if (!active) return;
    setSaving(true);
    const { id, title, content, subject, pinned, tags, assignment_id } = active;
    await supabase.from("notes").update({ title, content, subject, pinned, tags, assignment_id }).eq("id", id);
    setSaving(false);
    toast.success("> NOTE SAVED ✓");
  }

  async function deleteActive() {
    if (!active) return;
    await supabase.from("notes").delete().eq("id", active.id);
    setActiveId(null);
    load();
  }

  async function doSummarise() {
    if (!active?.content) return;
    setAiBusy(true);
    try {
      const r: any = await summarise({ data: { content: active.content } });
      await supabase.from("notes").update({ ai_summary: r.summary }).eq("id", active.id);
      updateActive({ ai_summary: r.summary });
      toast.success("> SUMMARISED ✓");
    } catch (e: any) { toast.error(e?.message || "AI failed"); }
    setAiBusy(false);
  }

  async function doTags() {
    if (!active?.content) return;
    setAiBusy(true);
    try {
      const r: any = await genTags({ data: { content: active.content, title: active.title } });
      const newTags = Array.from(new Set([...(active.tags || []), ...r.tags]));
      await supabase.from("notes").update({ tags: newTags }).eq("id", active.id);
      updateActive({ tags: newTags });
      toast.success("> TAGS GENERATED ✓");
    } catch (e: any) { toast.error(e?.message || "AI failed"); }
    setAiBusy(false);
  }

  async function doBookmark() {
    if (!active) return;
    const v = await toggleBookmark("note", active.id, active.title, active.subject);
    setBookmarked(v);
  }

  function exportPdf() {
    if (!active) return;
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(active.title, 14, 18);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(active.content || "(empty)", 180);
    doc.text(lines, 14, 30);
    doc.save(`${active.title.replace(/\W+/g, "_")}.pdf`);
  }

  function insertMd(wrap: string, end?: string) {
    if (!active) return;
    updateActive({ content: (active.content || "") + (active.content ? "\n" : "") + wrap + "text" + (end ?? wrap) });
  }

  const wordCount = (active?.content || "").trim().split(/\s+/).filter(Boolean).length;
  const readMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>
          <span className="text-[color:var(--color-cyber-cyan)]">//</span> NOTES_SYSTEM<span className="cursor-blink" />
        </h1>
        <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>&gt; markdown.editor --live</p>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-4">
        {/* LEFT */}
        <div className="cyber-card p-3 space-y-3">
          <div className="flex items-center gap-2 border border-[color:var(--color-cyber-cyan)]/30 px-2 py-1.5 rounded-sm bg-black/40" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="text-[color:var(--color-cyber-cyan)] text-xs">&gt;</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SEARCH_NOTES_" className="bg-transparent outline-none text-xs flex-1 uppercase tracking-wider input-caret" />
          </div>
          <div className="flex gap-2">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="h-8 text-xs font-mono"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">[ ALL SUBJECTS ]</SelectItem>
                {SUBJECTS.map((s) => <SelectItem key={s} value={s}>[{s}]</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-xs font-mono w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">DATE</SelectItem>
                <SelectItem value="title">TITLE</SelectItem>
                <SelectItem value="subject">SUBJECT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button onClick={createNote} className="cyber-btn w-full py-2 rounded-sm flex items-center justify-center gap-2">
            <Plus className="h-3 w-3" /> [ + NEW NOTE ]
          </button>
          <div className="space-y-1 max-h-[60vh] overflow-auto pr-1">
            {filtered.map((n) => (
              <button key={n.id} onClick={() => setActiveId(n.id)} className={`w-full text-left rounded-sm px-2 py-2 border ${activeId === n.id ? "border-[color:var(--color-cyber-cyan)] bg-[color:var(--color-cyber-cyan)]/5" : "border-transparent hover:border-[color:var(--color-cyber-cyan)]/30"}`} style={{ fontFamily: "var(--font-mono)" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate">{n.title || "Untitled"}</span>
                  {n.pinned && <span className="text-[9px] text-[color:var(--color-cyber-cyan)]">[PINNED]</span>}
                </div>
                <div className="text-[10px] text-muted-foreground flex gap-2 mt-0.5">
                  {n.subject && <span className="text-[color:var(--color-cyber-cyan)]">[{n.subject}]</span>}
                  <span className="tabular-nums">{new Date(n.updated_at).toISOString().slice(0,10)}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div className="text-xs text-muted-foreground p-2" style={{ fontFamily: "var(--font-mono)" }}>&gt; no notes</div>}
          </div>
        </div>

        {/* RIGHT */}
        <div className="cyber-card p-4 space-y-3">
          {!active ? (
            <div className="text-sm text-muted-foreground p-8 text-center" style={{ fontFamily: "var(--font-mono)" }}>&gt; select a note or create one</div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Input value={active.title} onChange={(e) => updateActive({ title: e.target.value })} className="flex-1 font-mono text-base" />
                <Select value={active.subject || "__none"} onValueChange={(v) => updateActive({ subject: v === "__none" ? "" : v })}>
                  <SelectTrigger className="h-9 w-44 text-xs font-mono"><SelectValue placeholder="[ SUBJECT ]" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">[ NONE ]</SelectItem>
                    {SUBJECTS.map((s) => <SelectItem key={s} value={s}>[{s}]</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs" style={{ fontFamily: "var(--font-mono)" }}>
                <div className="flex border border-[color:var(--color-cyber-cyan)]/30 rounded-sm overflow-hidden">
                  <button onClick={() => setMode("edit")} className={`px-3 py-1 ${mode === "edit" ? "bg-[color:var(--color-cyber-cyan)] text-black" : ""}`}>[EDIT]</button>
                  <button onClick={() => setMode("preview")} className={`px-3 py-1 ${mode === "preview" ? "bg-[color:var(--color-cyber-cyan)] text-black" : ""}`}>[PREVIEW]</button>
                </div>
                <span className="text-muted-foreground">&gt; {wordCount} words · {readMin} min read</span>
                {active.tags?.map((t) => <span key={t} className="text-[color:var(--color-cyber-cyan)]">[{t}]</span>)}
              </div>

              {mode === "edit" && (
                <div className="flex gap-1 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => insertMd("**")}><Bold className="h-3 w-3"/></Button>
                  <Button size="sm" variant="outline" onClick={() => insertMd("*")}><Italic className="h-3 w-3"/></Button>
                  <Button size="sm" variant="outline" onClick={() => insertMd("## ", "")}><Heading className="h-3 w-3"/></Button>
                  <Button size="sm" variant="outline" onClick={() => insertMd("```\n", "\n```")}><Code className="h-3 w-3"/></Button>
                  <Button size="sm" variant="outline" onClick={() => insertMd("- ", "")}><List className="h-3 w-3"/></Button>
                </div>
              )}

              {mode === "edit" ? (
                <Textarea value={active.content} onChange={(e) => updateActive({ content: e.target.value })} className="min-h-[300px] font-mono text-sm" placeholder="# Start writing in markdown..." />
              ) : (
                <div className="prose prose-invert max-w-none min-h-[300px] p-3 border border-[color:var(--color-cyber-cyan)]/20 rounded-sm bg-black/30">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{active.content || "*(empty)*"}</ReactMarkdown>
                </div>
              )}

              {active.ai_summary && (
                <div className="border-l-2 border-[color:var(--color-cyber-cyan)] pl-3 py-2 bg-black/30 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
                  <div className="text-[color:var(--color-cyber-cyan)] mb-1">&gt; AI_SUMMARY</div>
                  <pre className="whitespace-pre-wrap text-foreground/80">{active.ai_summary}</pre>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={saveActive} disabled={saving} className="cyber-btn"><Save className="h-3 w-3 mr-1"/>{saving ? "SAVING..." : "[ SAVE ]"}</Button>
                <Button variant="outline" onClick={() => updateActive({ pinned: !active.pinned })}><Pin className="h-3 w-3 mr-1"/>{active.pinned ? "[ UNPIN ]" : "[ PIN NOTE ]"}</Button>
                <Button variant="outline" onClick={doSummarise} disabled={aiBusy}><Sparkles className="h-3 w-3 mr-1"/>[ AI SUMMARISE ]</Button>
                <Button variant="outline" onClick={doTags} disabled={aiBusy}><Tag className="h-3 w-3 mr-1"/>[ AI TAGS ]</Button>
                <Button variant="outline" onClick={doBookmark}><Bookmark className="h-3 w-3 mr-1"/>{bookmarked ? "[BOOKMARKED ✓]" : "[ BOOKMARK ]"}</Button>
                <Button variant="outline" onClick={exportPdf}><FileDown className="h-3 w-3 mr-1"/>[ EXPORT PDF ]</Button>
                <Button variant="destructive" onClick={deleteActive}><Trash2 className="h-3 w-3 mr-1"/>DELETE</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
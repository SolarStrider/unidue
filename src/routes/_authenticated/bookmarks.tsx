import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/bookmarks")({
  component: BookmarksPage,
  head: () => ({ meta: [{ title: "Bookmarks | Unidue" }, { name: "robots", content: "noindex" }] }),
});

type Bookmark = { id: string; item_type: string; item_id: string; label: string; subject: string; created_at: string };

const TYPE_COLOR: Record<string, string> = {
  note: "#00f5ff", deck: "#7c3aed", quiz: "#ffaa00", assignment: "#00ff88",
};
const TYPE_ROUTE: Record<string, string> = {
  note: "/notes", deck: "/flashcards", quiz: "/quiz", assignment: "/assignments",
};

function BookmarksPage() {
  const [items, setItems] = useState<Bookmark[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const nav = useNavigate();

  async function load() {
    const { data } = await supabase.from("bookmarks").select("*").order("created_at", { ascending: false });
    setItems((data || []) as Bookmark[]);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((b) =>
    (filter === "all" || b.item_type === filter) &&
    (!search || b.label.toLowerCase().includes(search.toLowerCase()))
  ), [items, search, filter]);

  async function remove(b: Bookmark) {
    if (!confirm("> REMOVE BOOKMARK? [YES] [NO]")) return;
    await supabase.from("bookmarks").delete().eq("id", b.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>
          <span className="text-[color:var(--color-cyber-cyan)]">//</span> BOOKMARK_SYSTEM<span className="cursor-blink" />
        </h1>
      </div>

      <div className="flex items-center gap-2 border border-[color:var(--color-cyber-cyan)]/30 px-2 py-1.5 rounded-sm bg-black/40 max-w-md" style={{ fontFamily: "var(--font-mono)" }}>
        <span className="text-[color:var(--color-cyber-cyan)] text-xs">&gt;</span>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SEARCH_BOOKMARKS_" className="bg-transparent outline-none text-xs flex-1 uppercase tracking-wider input-caret" />
      </div>

      <div className="flex gap-2 flex-wrap" style={{ fontFamily: "var(--font-mono)" }}>
        {["all", "note", "deck", "quiz", "assignment"].map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`text-[11px] px-2 py-1 rounded-sm border ${filter === t ? "bg-[color:var(--color-cyber-cyan)]/10 border-[color:var(--color-cyber-cyan)] text-[color:var(--color-cyber-cyan)]" : "border-[color:var(--color-cyber-cyan)]/20 text-muted-foreground"}`}>
            [{t.toUpperCase()}]
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((b) => (
          <div key={b.id} className="cyber-card p-4 space-y-2" style={{ fontFamily: "var(--font-mono)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-bold">{b.label}</div>
              <span style={{ color: TYPE_COLOR[b.item_type] }} className="text-[10px]">[{b.item_type.toUpperCase()}]</span>
            </div>
            {b.subject && <div className="text-[11px] text-[color:var(--color-cyber-cyan)]">[{b.subject}]</div>}
            <div className="text-[10px] text-muted-foreground tabular-nums">{new Date(b.created_at).toISOString().slice(0, 10)}</div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="cyber-btn flex-1" onClick={() => nav({ to: TYPE_ROUTE[b.item_type] as any })}>[ OPEN ]</Button>
              <Button size="sm" variant="outline" onClick={() => remove(b)}>[ REMOVE ]</Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center p-12 text-[color:var(--color-cyber-amber)]" style={{ fontFamily: "var(--font-mono)" }}>
            &gt; NO BOOKMARKS FOUND — START SAVING ITEMS ✓
          </div>
        )}
      </div>
    </div>
  );
}
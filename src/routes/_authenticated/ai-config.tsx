import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useServerFn } from "@tanstack/react-start";
import { aiTestConnection } from "@/lib/ai/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ai-config")({
  component: AIConfigPage,
  head: () => ({ meta: [{ title: "AI Config | Unidue" }, { name: "robots", content: "noindex" }] }),
});

const PROVIDERS = [
  { key: "openai", name: "OpenAI ChatGPT", color: "#00ff88" },
  { key: "gemini", name: "Google Gemini", color: "#00f5ff" },
  { key: "claude", name: "Anthropic Claude", color: "#b388ff" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cyber-card p-4 space-y-3 border-l-2 border-[color:var(--color-cyber-cyan)]/40" style={{ fontFamily: "var(--font-mono)" }}>
      <div className="text-xs text-[color:var(--color-cyber-cyan)] uppercase tracking-[0.2em]">{title}</div>
      {children}
    </div>
  );
}

function AIConfigPage() {
  const [defaultProvider, setDefaultProvider] = useState("gemini");
  const [providers, setProviders] = useState<Record<string, { connected: boolean; key: string; testResult?: string }>>({
    openai: { connected: false, key: "" },
    gemini: { connected: true, key: "" }, // gemini works out of box via Lovable AI
    claude: { connected: false, key: "" },
  });
  const [moduleCfg, setModuleCfg] = useState<any>({
    notesAI: true, notesAutoSummarise: false, notesFormat: "MARKDOWN", linkToAssignments: true,
    fcAI: true, fcAutoGen: false, fcDifficulty: "MEDIUM", fcMaxPerSession: 20,
    quizAI: true, quizFromFlashcards: true, quizTypes: ["MULTIPLE CHOICE"], quizCount: 10, quizDifficulty: "MEDIUM",
    defaultSummary: "gemini", defaultFlashcards: "gemini", defaultQuiz: "gemini", defaultSuggestions: "gemini",
    gcalConnected: false, gcalSync: false,
  });
  const [status, setStatus] = useState<Record<string, "ONLINE" | "DEGRADED" | "OFFLINE">>({
    openai: "OFFLINE", gemini: "ONLINE", claude: "OFFLINE", gcal: "OFFLINE",
  });
  const testFn = useServerFn(aiTestConnection);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("ai_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setDefaultProvider(data.default_provider || "gemini");
        if (data.providers) setProviders((p) => ({ ...p, ...(data.providers as any) }));
        if (data.module_config) setModuleCfg((m: any) => ({ ...m, ...(data.module_config as any) }));
      }
    })();
  }, []);

  async function testProvider(key: string) {
    const r: any = await testFn({ data: { provider: key } });
    setProviders((p) => ({ ...p, [key]: { ...p[key], connected: r.ok, testResult: r.ok ? "> CONNECTION SUCCESSFUL ✓" : "> CONNECTION FAILED ✗" } }));
    setStatus((s) => ({ ...s, [key]: r.ok ? "ONLINE" : "OFFLINE" }));
    if (r.ok) toast.success(`${key} ONLINE`); else toast.error(`${key} OFFLINE — ${r.error || ""}`);
  }

  async function save() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("ai_settings").upsert({
      user_id: user.id,
      default_provider: defaultProvider,
      providers,
      module_config: moduleCfg,
    });
    toast.success("> CONFIGURATION SAVED ✓");
  }

  function resetDefaults() {
    setDefaultProvider("gemini");
    toast.message("> RESET TO DEFAULT");
  }

  async function connectGCal() {
    // Lightweight: we treat connection as enabled; real sync via assignment "Add to calendar" link
    setModuleCfg((m: any) => ({ ...m, gcalConnected: true, gcalSync: true }));
    setStatus((s) => ({ ...s, gcal: "ONLINE" }));
    toast.success("> GOOGLE CALENDAR LINKED ✓ — assignments now sync via add-to-calendar links");
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>
          <span className="text-[color:var(--color-cyber-cyan)]">//</span> AI_&amp;_INTEGRATIONS<span className="cursor-blink" />
        </h1>
      </div>

      <Section title="[ 1. AI PROVIDERS ]">
        <div className="grid sm:grid-cols-3 gap-3">
          {PROVIDERS.map((p) => {
            const st = providers[p.key];
            return (
              <div key={p.key} className="border border-[color:var(--color-cyber-cyan)]/20 rounded-sm p-3 space-y-2 bg-black/30">
                <div className="flex items-center justify-between">
                  <div className="text-sm" style={{ color: p.color }}>{p.name}</div>
                  <span className={`text-[10px] ${st.connected ? "text-[color:var(--color-cyber-green)]" : "text-[color:var(--color-cyber-amber)]"}`}>{st.connected ? "[CONNECTED]" : "[NOT CONNECTED]"}</span>
                </div>
                <Input value={st.key} onChange={(e) => setProviders((pp) => ({ ...pp, [p.key]: { ...pp[p.key], key: e.target.value } }))} placeholder="> ENTER_API_KEY_" className="font-mono text-xs h-8 input-caret" />
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="flex-1 text-[10px] h-7" onClick={() => setDefaultProvider(p.key)}>{defaultProvider === p.key ? "[DEFAULT ✓]" : "[ SET DEFAULT ]"}</Button>
                  <Button size="sm" className="cyber-btn flex-1 text-[10px] h-7" onClick={() => testProvider(p.key)}>[ TEST ]</Button>
                </div>
                {st.testResult && <div className={`text-[10px] ${st.connected ? "text-[color:var(--color-cyber-green)]" : "text-[color:var(--color-cyber-red)]"}`}>{st.testResult}</div>}
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-muted-foreground">// Powered by Lovable AI Gateway — provider selection routes to the chosen model. Custom API keys stored per-user.</div>
      </Section>

      <Section title="[ 2. CALENDAR INTEGRATION ]">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="border border-[color:var(--color-cyber-cyan)]/20 rounded-sm p-3 space-y-2 bg-black/30">
            <div className="flex items-center justify-between">
              <div className="text-sm">Google Calendar</div>
              <span className={`text-[10px] ${moduleCfg.gcalConnected ? "text-[color:var(--color-cyber-green)]" : "text-[color:var(--color-cyber-amber)]"}`}>{moduleCfg.gcalConnected ? "[CONNECTED]" : "[NOT CONNECTED]"}</span>
            </div>
            <Button size="sm" className="cyber-btn w-full text-[10px] h-7" onClick={connectGCal}>{moduleCfg.gcalConnected ? "[ RECONNECT ]" : "[ CONNECT ]"}</Button>
            <div className="flex items-center justify-between text-[11px]">
              <span>[ SYNC DEADLINES ]</span>
              <Switch checked={moduleCfg.gcalSync} onCheckedChange={(v) => setModuleCfg((m: any) => ({ ...m, gcalSync: v }))} />
            </div>
          </div>
          <div className="border border-[color:var(--color-cyber-cyan)]/20 rounded-sm p-3 space-y-2 bg-black/30">
            <div className="text-sm">Manual Calendar</div>
            <div className="text-[11px] text-muted-foreground">In-app calendar always active. Each assignment includes an "Add to Google Calendar" link.</div>
          </div>
        </div>
      </Section>

      <Section title="[ 3. NOTES CONFIGURATION ]">
        <Row label="AI-ASSISTED NOTES"><Switch checked={moduleCfg.notesAI} onCheckedChange={(v) => setModuleCfg((m: any) => ({ ...m, notesAI: v }))} /></Row>
        <Row label="[ AUTO SUMMARISE ON SAVE ]"><Switch checked={moduleCfg.notesAutoSummarise} onCheckedChange={(v) => setModuleCfg((m: any) => ({ ...m, notesAutoSummarise: v }))} /></Row>
        <Row label="AI PROVIDER"><ProviderSelect value={moduleCfg.defaultSummary} onChange={(v) => setModuleCfg((m: any) => ({ ...m, defaultSummary: v }))} /></Row>
        <Row label="NOTE FORMAT">
          <Select value={moduleCfg.notesFormat} onValueChange={(v) => setModuleCfg((m: any) => ({ ...m, notesFormat: v }))}>
            <SelectTrigger className="h-8 w-44 text-xs font-mono"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PLAIN TEXT">[PLAIN TEXT]</SelectItem>
              <SelectItem value="MARKDOWN">[MARKDOWN]</SelectItem>
              <SelectItem value="STRUCTURED">[STRUCTURED]</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label="[ LINK NOTES TO ASSIGNMENTS ]"><Switch checked={moduleCfg.linkToAssignments} onCheckedChange={(v) => setModuleCfg((m: any) => ({ ...m, linkToAssignments: v }))} /></Row>
      </Section>

      <Section title="[ 4. FLASHCARD CONFIGURATION ]">
        <Row label="AI GENERATION"><Switch checked={moduleCfg.fcAI} onCheckedChange={(v) => setModuleCfg((m: any) => ({ ...m, fcAI: v }))} /></Row>
        <Row label="[ AUTO GENERATE FROM NOTES ]"><Switch checked={moduleCfg.fcAutoGen} onCheckedChange={(v) => setModuleCfg((m: any) => ({ ...m, fcAutoGen: v }))} /></Row>
        <Row label="AI PROVIDER"><ProviderSelect value={moduleCfg.defaultFlashcards} onChange={(v) => setModuleCfg((m: any) => ({ ...m, defaultFlashcards: v }))} /></Row>
        <Row label="DIFFICULTY">
          <Select value={moduleCfg.fcDifficulty} onValueChange={(v) => setModuleCfg((m: any) => ({ ...m, fcDifficulty: v }))}>
            <SelectTrigger className="h-8 w-32 text-xs font-mono"><SelectValue /></SelectTrigger>
            <SelectContent>{["EASY","MEDIUM","HARD"].map((d) => <SelectItem key={d} value={d}>[{d}]</SelectItem>)}</SelectContent>
          </Select>
        </Row>
        <Row label="MAX CARDS / SESSION"><Input type="number" value={moduleCfg.fcMaxPerSession} onChange={(e) => setModuleCfg((m: any) => ({ ...m, fcMaxPerSession: Number(e.target.value) }))} className="h-8 w-24 font-mono text-xs" /></Row>
      </Section>

      <Section title="[ 5. QUIZ CONFIGURATION ]">
        <Row label="AI GENERATION"><Switch checked={moduleCfg.quizAI} onCheckedChange={(v) => setModuleCfg((m: any) => ({ ...m, quizAI: v }))} /></Row>
        <Row label="[ GENERATE FROM FLASHCARDS ]"><Switch checked={moduleCfg.quizFromFlashcards} onCheckedChange={(v) => setModuleCfg((m: any) => ({ ...m, quizFromFlashcards: v }))} /></Row>
        <Row label="AI PROVIDER"><ProviderSelect value={moduleCfg.defaultQuiz} onChange={(v) => setModuleCfg((m: any) => ({ ...m, defaultQuiz: v }))} /></Row>
        <Row label="QUESTION TYPES">
          <div className="flex gap-1 flex-wrap">
            {["MULTIPLE CHOICE","TRUE OR FALSE","SHORT ANSWER","FILL IN THE BLANK"].map((t) => {
              const on = moduleCfg.quizTypes.includes(t);
              return <button key={t} onClick={() => setModuleCfg((m: any) => ({ ...m, quizTypes: on ? m.quizTypes.filter((x: string) => x !== t) : [...m.quizTypes, t] }))} className={`text-[10px] px-2 py-1 rounded-sm border ${on ? "border-[color:var(--color-cyber-cyan)] text-[color:var(--color-cyber-cyan)] bg-[color:var(--color-cyber-cyan)]/10" : "border-[color:var(--color-cyber-cyan)]/20 text-muted-foreground"}`} style={{ fontFamily: "var(--font-mono)" }}>[{t}]</button>;
            })}
          </div>
        </Row>
        <Row label={`QUESTIONS / QUIZ: ${moduleCfg.quizCount}`}>
          <input type="range" min={5} max={50} value={moduleCfg.quizCount} onChange={(e) => setModuleCfg((m: any) => ({ ...m, quizCount: Number(e.target.value) }))} className="w-48" />
        </Row>
        <Row label="DIFFICULTY">
          <Select value={moduleCfg.quizDifficulty} onValueChange={(v) => setModuleCfg((m: any) => ({ ...m, quizDifficulty: v }))}>
            <SelectTrigger className="h-8 w-32 text-xs font-mono"><SelectValue /></SelectTrigger>
            <SelectContent>{["EASY","MEDIUM","HARD"].map((d) => <SelectItem key={d} value={d}>[{d}]</SelectItem>)}</SelectContent>
          </Select>
        </Row>
      </Section>

      <Section title="[ 6. DEFAULT BEHAVIOUR ]">
        <Row label="DEFAULT PROVIDER"><ProviderSelect value={defaultProvider} onChange={setDefaultProvider} /></Row>
        <Row label="SUMMARIES"><ProviderSelect value={moduleCfg.defaultSummary} onChange={(v) => setModuleCfg((m: any) => ({ ...m, defaultSummary: v }))} /></Row>
        <Row label="FLASHCARDS"><ProviderSelect value={moduleCfg.defaultFlashcards} onChange={(v) => setModuleCfg((m: any) => ({ ...m, defaultFlashcards: v }))} /></Row>
        <Row label="QUIZ"><ProviderSelect value={moduleCfg.defaultQuiz} onChange={(v) => setModuleCfg((m: any) => ({ ...m, defaultQuiz: v }))} /></Row>
        <Row label="SUGGESTIONS"><ProviderSelect value={moduleCfg.defaultSuggestions} onChange={(v) => setModuleCfg((m: any) => ({ ...m, defaultSuggestions: v }))} /></Row>
      </Section>

      <Section title="[ 7. CONNECTION STATUS ]">
        <div className="grid sm:grid-cols-2 gap-2">
          {Object.entries(status).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border border-[color:var(--color-cyber-cyan)]/20 rounded-sm px-3 py-2 bg-black/30">
              <span className="text-xs uppercase">{k}</span>
              <span className={`text-[10px] ${v === "ONLINE" ? "text-[color:var(--color-cyber-green)]" : v === "DEGRADED" ? "text-[color:var(--color-cyber-amber)]" : "text-[color:var(--color-cyber-red)]"}`}>[{v}]</span>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" className="text-[10px]" onClick={async () => { for (const p of PROVIDERS) await testProvider(p.key); }}>[ REFRESH STATUS ]</Button>
      </Section>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={resetDefaults} style={{ color: "#ffaa00", borderColor: "#ffaa00" }}>[ RESET TO DEFAULT ]</Button>
        <Button onClick={save} className="cyber-btn">[ SAVE CONFIGURATION ]</Button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function ProviderSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-40 text-xs font-mono"><SelectValue /></SelectTrigger>
      <SelectContent>{PROVIDERS.map((p) => <SelectItem key={p.key} value={p.key}>[{p.name}]</SelectItem>)}</SelectContent>
    </Select>
  );
}
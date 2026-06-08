import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MatrixRain } from "@/components/studiq/matrix-rain";
import { TypingText } from "@/components/studiq/typing-text";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Access Unidue — Sign in" },
      { name: "description", content: "Authenticate into Unidue, the cyberpunk student dashboard. Free forever." },
      { property: "og:title", content: "Access Unidue — Sign in" },
      { property: "og:description", content: "Authenticate into Unidue, the cyberpunk student dashboard. Free forever." },
      { property: "og:url", content: "https://studiq-global-tracker.lovable.app/auth" },
    ],
    links: [{ rel: "canonical", href: "https://studiq-global-tracker.lovable.app/auth" }],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/" });
    });
  }, [navigate]);

  function flashGrantedAndGo() {
    setGranted(true);
    window.setTimeout(() => navigate({ to: "/" }), 650);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("> reset packet dispatched");
        setForgot(false);
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { name } },
        });
        if (error) throw error;
        toast.success("> identity provisioned");
        flashGrantedAndGo();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        flashGrantedAndGo();
      }
    } catch (err) {
      toast.error(`> ACCESS DENIED: ${err instanceof Error ? err.message : "unknown fault"}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error(`> ACCESS DENIED: ${result.error.message || "google sign-in failed"}`);
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    flashGrantedAndGo();
  }

  const monoFont = { fontFamily: "var(--font-mono)" } as const;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080810] p-4 flex flex-col items-center justify-center">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <MatrixRain />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#080810]/40 via-[#080810]/70 to-[#080810]" />

      {granted && (
        <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-black/40 backdrop-blur-sm">
          <div
            className="px-8 py-4 text-2xl tracking-[0.4em] text-[color:var(--color-cyber-green)] [text-shadow:0_0_18px_rgba(0,255,136,0.8)] animate-[fade-in_0.2s_ease-out]"
            style={monoFont}
          >
            ACCESS GRANTED_
          </div>
        </div>
      )}

      <div className="relative z-10 mb-6 flex flex-col items-center gap-1">
        <div
          className="glitch-text text-3xl md:text-4xl font-bold tracking-[0.35em] text-[color:var(--color-cyber-cyan)] [text-shadow:0_0_14px_rgba(0,245,255,0.6)]"
          style={monoFont}
        >
          UNIDUE
        </div>
        <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground" style={monoFont}>
          // cyber.student.dashboard
        </p>
      </div>

      <section
        className="relative z-10 w-full max-w-md overflow-hidden rounded-md border border-[color:var(--color-cyber-cyan)]/40 bg-[#0d0d1a]/90 shadow-[0_0_48px_-12px_rgba(0,245,255,0.55)] backdrop-blur"
        aria-label="Login terminal"
      >
        {/* Title bar */}
        <header className="flex items-center justify-between border-b border-[color:var(--color-cyber-cyan)]/20 bg-black/60 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-cyber-red)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-cyber-amber)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-cyber-green)]" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground" style={monoFont}>
            unidue ~ /auth — bash
          </span>
          <span className="w-10" />
        </header>

        <div className="space-y-4 p-5">
          <div className="text-sm text-[color:var(--color-cyber-green)]" style={monoFont}>
            <TypingText text="> Enter credentials to access Unidue_" />
          </div>

          {!forgot && (
            <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 rounded-none border border-[color:var(--color-cyber-cyan)]/30 bg-black/40 p-0">
                <TabsTrigger
                  value="signin"
                  className="rounded-none data-[state=active]:bg-[color:var(--color-cyber-cyan)]/10 data-[state=active]:text-[color:var(--color-cyber-cyan)]"
                  style={monoFont}
                >
                  [signin]
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-none data-[state=active]:bg-[color:var(--color-cyber-cyan)]/10 data-[state=active]:text-[color:var(--color-cyber-cyan)]"
                  style={monoFont}
                >
                  [signup]
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && !forgot && (
              <TerminalField label="name">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="alex.student"
                  required
                  className="input-caret border-none bg-transparent shadow-none focus-visible:ring-0"
                  style={monoFont}
                />
              </TerminalField>
            )}
            <TerminalField label="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@domain"
                className="input-caret border-none bg-transparent shadow-none focus-visible:ring-0"
                style={monoFont}
              />
            </TerminalField>
            {!forgot && (
              <TerminalField label="passwd">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="input-caret border-none bg-transparent shadow-none focus-visible:ring-0"
                  style={monoFont}
                />
              </TerminalField>
            )}
            <Button type="submit" disabled={loading} className="cyber-btn w-full h-10">
              {loading ? "> processing..." : forgot ? "> dispatch reset link" : mode === "signin" ? "> authenticate" : "> provision identity"}
            </Button>
          </form>

          {!forgot && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[color:var(--color-cyber-cyan)]/15" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-[#0d0d1a] px-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground" style={monoFont}>or</span>
                </div>
              </div>
              <Button type="button" variant="outline" className="cyber-btn w-full h-10" onClick={handleGoogle} disabled={loading}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                continue with google
              </Button>
            </>
          )}

          <div className="flex justify-between text-[11px] text-muted-foreground" style={monoFont}>
            <button type="button" className="hover:text-[color:var(--color-cyber-cyan)]" onClick={() => setForgot(!forgot)}>
              {forgot ? "< back to login" : "> forgot passwd?"}
            </button>
            <span>v1.0.0</span>
          </div>
        </div>
      </section>

      <p className="relative z-10 mt-6 text-[11px] text-muted-foreground" style={monoFont}>
        // made by solarstrider · free forever for students worldwide
      </p>
    </main>
  );
}

function TerminalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-stretch rounded-sm border border-[color:var(--color-cyber-cyan)]/25 bg-black/40 focus-within:border-[color:var(--color-cyber-cyan)] focus-within:shadow-[0_0_0_1px_rgba(0,245,255,0.4),0_0_18px_-4px_rgba(0,245,255,0.6)]">
      <Label
        htmlFor={undefined as unknown as string}
        className="flex select-none items-center border-r border-[color:var(--color-cyber-cyan)]/20 bg-black/40 px-2 text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-cyber-cyan)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}:~$
      </Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
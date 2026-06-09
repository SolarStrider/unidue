import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Palette } from "lucide-react";
import { toast } from "sonner";
import { GRADING_SYSTEM_NAMES } from "@/lib/studiq/grading-systems";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings | Studiq" },
      { name: "description", content: "Customize your Studiq profile, theme, date format, and grading system." },
      { property: "og:title", content: "Settings | Studiq" },
      { property: "og:description", content: "Customize your Studiq profile, theme, date format, and grading system." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const THEMES = [
  { key: "cyan", label: "CYAN", code: "//default", color: "#00f5ff" },
  { key: "green", label: "MATRIX", code: "//green", color: "#00ff88" },
  { key: "purple", label: "SYNTH", code: "//purple", color: "#b388ff" },
  { key: "amber", label: "AMBER", code: "//warn", color: "#ffaa00" },
  { key: "red", label: "BLOOD", code: "//danger", color: "#ff3366" },
];

function SettingsPage() {
  const navigate = useNavigate();
  const { profile, update } = useProfile();
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ""));
  }, []);
  useEffect(() => { if (profile) setName(profile.name); }, [profile]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  async function saveName() {
    await update({ name });
    toast.success("Name updated");
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
          &gt; configure_user_shell --interactive
        </p>
      </div>

      <Card className="cyber-card">
        <CardHeader>
          <CardTitle
            className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <Palette className="h-4 w-4" /> [ ACCENT_COLOR ]
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {THEMES.map((t) => {
              const active = (profile?.theme || "cyan") === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => update({ theme: t.key })}
                  className="group relative rounded-sm border p-3 text-left transition"
                  style={{
                    fontFamily: "var(--font-mono)",
                    background: "rgba(8,8,16,0.6)",
                    borderColor: active ? t.color : "rgba(255,255,255,0.08)",
                    boxShadow: active ? `0 0 0 1px ${t.color}55, 0 0 24px -8px ${t.color}` : "none",
                  }}
                >
                  <div
                    className="h-6 w-6 rounded-full mb-2"
                    style={{ background: t.color, boxShadow: `0 0 12px ${t.color}` }}
                  />
                  <div className="text-[11px] font-semibold tracking-[0.15em]" style={{ color: t.color }}>
                    {active ? `> ${t.label}` : t.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{t.code}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Date format</Label>
            <Select value={profile?.date_format || "DD/MM/YYYY"} onValueChange={(v) => update({ date_format: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY/MM/DD">YYYY/MM/DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Grading system</Label>
            <Select value={profile?.grading_system || "US"} onValueChange={(v) => update({ grading_system: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{GRADING_SYSTEM_NAMES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Display name</Label>
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <Button onClick={saveName}>Save</Button>
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} readOnly disabled />
          </div>
          <Button variant="destructive" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>About</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="font-semibold text-foreground">Studiq</span> — Your global college task tracker.</p>
          <p className="text-muted-foreground">Made by <span className="font-semibold text-primary">SolarStrider</span></p>
          <p className="text-muted-foreground">Free forever for students worldwide.</p>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground pt-4">
        Made by SolarStrider · Free forever for students worldwide
      </p>
    </div>
  );
}
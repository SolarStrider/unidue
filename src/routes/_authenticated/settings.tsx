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
});

const THEMES = [
  { key: "midnight", label: "Midnight", color: "#6c63ff", bg: "#0f0f1a" },
  { key: "ocean", label: "Ocean", color: "#4aa8ff", bg: "#0a1628" },
  { key: "forest", label: "Forest", color: "#3fd07a", bg: "#0d1f15" },
  { key: "sunset", label: "Sunset", color: "#ff7a5c", bg: "#1f0d0a" },
  { key: "light", label: "Light", color: "#6c63ff", bg: "#ffffff" },
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
        <p className="text-sm text-muted-foreground">Personalize Studiq to your study style.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4" /> Theme</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => update({ theme: t.key })}
                className={`rounded-xl border-2 p-3 text-left transition ${profile?.theme === t.key ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"}`}
                style={{ background: t.bg, color: t.key === "light" ? "#111" : "#fff" }}
              >
                <div className="h-8 w-8 rounded-full mb-2" style={{ background: t.color }} />
                <div className="text-xs font-semibold">{t.label}</div>
              </button>
            ))}
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

      <p className="text-center text-xs text-muted-foreground pt-4">
        Made by SolarStrider · Free forever for students worldwide
      </p>
    </div>
  );
}
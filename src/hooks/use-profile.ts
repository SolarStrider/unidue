import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/studiq/types";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setLoading(false); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (active) {
        setProfile(data as Profile | null);
        setLoading(false);
      }
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  async function update(patch: Partial<Profile>) {
    if (!profile) return;
    const { data } = await supabase.from("profiles").update(patch).eq("id", profile.id).select().single();
    if (data) setProfile(data as Profile);
  }

  return { profile, loading, update };
}
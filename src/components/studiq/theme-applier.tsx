import { useEffect } from "react";
import { useProfile } from "@/hooks/use-profile";

export function ThemeApplier() {
  const { profile } = useProfile();
  useEffect(() => {
    const theme = profile?.theme || "midnight";
    document.documentElement.setAttribute("data-theme", theme);
  }, [profile?.theme]);
  return null;
}
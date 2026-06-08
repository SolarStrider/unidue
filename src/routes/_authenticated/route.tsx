import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/studiq/app-sidebar";
import { ThemeApplier } from "@/components/studiq/theme-applier";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <ThemeApplier />
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[color:var(--color-cyber-cyan)]/15 bg-background/70 px-4 backdrop-blur">
            <SidebarTrigger className="text-[color:var(--color-cyber-cyan)] hover:bg-[color:var(--color-cyber-cyan)]/10" />
            <div
              className="text-sm tracking-[0.25em] text-[color:var(--color-cyber-cyan)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              UNIDUE<span className="opacity-50">/</span><span className="opacity-70">SHELL</span>
            </div>
            <div
              className="ml-auto hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span className="text-[color:var(--color-cyber-green)]">●</span>
              <span>sys.online</span>
              <span className="opacity-40">|</span>
              <span className="tabular-nums">{new Date().toISOString().slice(0, 10)}</span>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ListChecks, CalendarDays, GraduationCap, Timer, Settings, Terminal, FileText, Layers, HelpCircle, Bookmark, Cpu } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Assignments", url: "/assignments", icon: ListChecks },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Notes", url: "/notes", icon: FileText },
  { title: "Flashcards", url: "/flashcards", icon: Layers },
  { title: "Quiz", url: "/quiz", icon: HelpCircle },
  { title: "Bookmarks", url: "/bookmarks", icon: Bookmark },
  { title: "Grades", url: "/grades", icon: GraduationCap },
  { title: "Pomodoro", url: "/pomodoro", icon: Timer },
  { title: "AI Config", url: "/ai-config", icon: Cpu },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon" className="scanline-strip">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[color:var(--color-cyber-cyan)]/50 bg-black/40 text-[color:var(--color-cyber-cyan)] shadow-[0_0_12px_rgba(0,245,255,0.45)]">
            <Terminal className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span
              className="glitch-text text-base font-bold tracking-[0.2em] text-[color:var(--color-cyber-cyan)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              UNIDUE
            </span>
            <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
              v1.0.0 // solarstrider
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <div
              className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground group-data-[collapsible=icon]:hidden"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              // menu
            </div>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={`${active ? "neon-underline text-[color:var(--color-cyber-cyan)]" : "text-sidebar-foreground hover:text-[color:var(--color-cyber-cyan)]"} rounded-none border-l-2 ${active ? "border-[color:var(--color-cyber-cyan)] bg-[color:var(--color-cyber-cyan)]/5" : "border-transparent"}`}
                    >
                      <Link to={item.url} style={{ fontFamily: "var(--font-mono)" }} className="uppercase text-[12px] tracking-[0.12em]">
                        <item.icon className="opacity-70" />
                        <span className="flex items-center gap-1">
                          <span className={active ? "text-[color:var(--color-cyber-cyan)]" : "opacity-40"}>{active ? ">" : "·"}</span>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div
          className="px-3 pb-3 text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span className="text-[color:var(--color-cyber-green)]">●</span> uplink stable
          <br />
          <span className="opacity-60">free // students worldwide</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
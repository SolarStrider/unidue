import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ListChecks, CalendarDays, GraduationCap, Timer, Settings } from "lucide-react";
import studiqIcon from "@/assets/studiq-icon.svg.asset.json";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Assignments", url: "/assignments", icon: ListChecks },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Grades", url: "/grades", icon: GraduationCap },
  { title: "Pomodoro", url: "/pomodoro", icon: Timer },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <img src={studiqIcon.url} alt="Studiq" className="h-9 w-9 rounded-lg shrink-0" />
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-base font-bold tracking-tight">Studiq</span>
            <span className="text-[10px] text-muted-foreground">by SolarStrider</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 pb-2 text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          Free forever for students worldwide
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
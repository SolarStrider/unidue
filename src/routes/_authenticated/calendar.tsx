import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek, subMonths } from "date-fns";
import type { Assignment } from "@/lib/studiq/types";

export const Route = createFileRoute("/_authenticated/calendar")({
  component: CalendarPage,
  head: () => ({
    meta: [
      { title: "Calendar | Studiq" },
      { name: "description", content: "Visualize assignments and study events on a monthly calendar view." },
      { property: "og:title", content: "Calendar | Studiq" },
      { property: "og:description", content: "Visualize assignments and study events on a monthly calendar view." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [items, setItems] = useState<Assignment[]>([]);

  useEffect(() => {
    supabase.from("assignments").select("*").then(({ data }) => setItems((data as Assignment[]) || []));
  }, []);

  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">Your deadlines at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" aria-label="Previous month" onClick={() => setMonth(subMonths(month, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="min-w-[160px] text-center font-semibold">{format(month, "MMMM yyyy")}</div>
          <Button size="icon" variant="outline" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayItems = items.filter((a) => isSameDay(parseISO(a.due_date), day));
              const today = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className={`min-h-[88px] rounded-lg border border-border p-1.5 text-left ${
                  isSameMonth(day, month) ? "bg-card" : "bg-card/30 text-muted-foreground"
                } ${today ? "ring-1 ring-primary" : ""}`}>
                  <div className="text-xs font-semibold">{format(day, "d")}</div>
                  <div className="mt-1 space-y-0.5">
                    {dayItems.slice(0, 3).map((a) => (
                      <div key={a.id} className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                        a.priority === "high" ? "bg-destructive/20 text-destructive" :
                        a.priority === "medium" ? "bg-yellow-500/20 text-yellow-500" :
                        "bg-primary/15 text-primary"
                      }`}>{a.title}</div>
                    ))}
                    {dayItems.length > 3 && <div className="text-[9px] text-muted-foreground">+{dayItems.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
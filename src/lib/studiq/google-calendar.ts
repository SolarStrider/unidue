import { format, parseISO } from "date-fns";
import type { Assignment } from "./types";

export function googleCalendarUrl(a: Assignment) {
  const due = parseISO(a.due_date);
  const start = new Date(due.getTime() - 60 * 60 * 1000);
  const fmt = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${a.title} (${a.subject})`,
    dates: `${fmt(start)}/${fmt(due)}`,
    details: `${a.type} — Priority: ${a.priority}\n\n${a.notes}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
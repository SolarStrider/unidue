import { format, parseISO } from "date-fns";

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY/MM/DD";

const MAP: Record<DateFormat, string> = {
  "DD/MM/YYYY": "dd/MM/yyyy",
  "MM/DD/YYYY": "MM/dd/yyyy",
  "YYYY/MM/DD": "yyyy/MM/dd",
};

export function formatDate(iso: string | Date, fmt: string = "DD/MM/YYYY") {
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  const key = (fmt as DateFormat) in MAP ? (fmt as DateFormat) : "DD/MM/YYYY";
  return format(d, MAP[key]);
}

export function dueLabel(iso: string): { label: string; tone: "ok" | "soon" | "today" | "overdue" } {
  const due = parseISO(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const days = Math.round((startOfDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return { label: "Due today!", tone: "today" };
  if (days < 0) return { label: `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`, tone: "overdue" };
  if (days <= 3) return { label: `${days} day${days === 1 ? "" : "s"} left`, tone: "soon" };
  return { label: `${days} days left`, tone: "ok" };
}
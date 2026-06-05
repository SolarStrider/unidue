export type Priority = "high" | "medium" | "low";
export type Status = "pending" | "completed";

export const SUBJECTS = [
  "Mathematics", "Computer Science", "Physics", "Chemistry", "Biology",
  "Economics", "Psychology", "History", "Literature", "Law",
  "Engineering", "Business", "Philosophy", "Sociology", "Art & Design",
  "Music", "Other",
] as const;

export const ASSIGNMENT_TYPES = [
  "Essay", "Coursework", "Lab Report", "Dissertation", "Presentation",
  "Project", "Quiz", "Exam", "Homework", "Research Paper", "Case Study", "Other",
] as const;

export type Assignment = {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  type: string;
  due_date: string;
  priority: Priority;
  notes: string;
  status: Status;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyGoal = {
  id: string;
  user_id: string;
  text: string;
  done: boolean;
  date: string;
  created_at: string;
};

export type Grade = {
  id: string;
  user_id: string;
  subject: string;
  assignment: string;
  grade_value: string;
  grading_system: string;
  created_at: string;
};

export type Profile = {
  id: string;
  name: string;
  theme: string;
  date_format: string;
  grading_system: string;
  created_at: string;
  updated_at: string;
};
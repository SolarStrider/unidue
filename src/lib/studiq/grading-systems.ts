export const GRADING_SYSTEMS: Record<string, string[]> = {
  US: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"],
  UK: ["First (1st)", "Upper Second (2:1)", "Lower Second (2:2)", "Third (3rd)", "Fail"],
  Europe: ["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
  India: ["O (10)", "A+ (9)", "A (8)", "B+ (7)", "B (6)", "C (5)", "P (4)", "F"],
  Australia: ["HD", "D", "C", "P", "F"],
  Canada: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D", "F"],
  Custom: ["Excellent", "Good", "Average", "Pass", "Fail"],
};

export const GRADING_SYSTEM_NAMES = Object.keys(GRADING_SYSTEMS);
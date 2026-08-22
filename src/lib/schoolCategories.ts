export const SCHOOL_CATEGORIES = [
  { value: "transport", label: "Buses & Transport" },
  { value: "curriculum", label: "Curriculum & Homework" },
  { value: "activities", label: "Activities & Tools" },
  { value: "announcement", label: "Announcements" },
] as const;

export type SchoolCategoryValue = (typeof SCHOOL_CATEGORIES)[number]["value"];

export function categoryLabel(value: string | undefined) {
  return SCHOOL_CATEGORIES.find((c) => c.value === value)?.label ?? null;
}

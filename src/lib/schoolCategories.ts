/** Topics for a question inside one school's community. */
export const SCHOOL_CATEGORIES = [
  { value: "transport", label: "Buses & Transport" },
  { value: "curriculum", label: "Curriculum & Homework" },
  { value: "activities", label: "Activities & Tools" },
  { value: "announcement", label: "Announcements" },
] as const;

/**
 * Topics for a question on the open Parent Network. Broader than the school
 * list because these questions cross schools — and tagging them is what
 * gives the home page real trending topics to rank.
 */
export const NETWORK_CATEGORIES = [
  { value: "choosing", label: "Choosing a School" },
  { value: "fees", label: "Fees & Costs" },
  { value: "curriculum", label: "Curriculum & Homework" },
  { value: "transport", label: "Buses & Transport" },
  { value: "activities", label: "Activities & Sports" },
  { value: "admissions", label: "Admissions & Applications" },
  { value: "moving", label: "Moving & Transfers" },
  { value: "wellbeing", label: "Wellbeing & Support" },
] as const;

export type SchoolCategoryValue = (typeof SCHOOL_CATEGORIES)[number]["value"];

const ALL = [...SCHOOL_CATEGORIES, ...NETWORK_CATEGORIES];

export function categoryLabel(value: string | undefined) {
  return ALL.find((c) => c.value === value)?.label ?? null;
}

/**
 * The site's section list, shared by the header, the left rail and the
 * mobile drawer so they can never drift apart.
 *
 * `soon: true` marks a section whose page exists but has no feature behind
 * it yet. Those routes render an honest placeholder rather than 404, and
 * carry a "Soon" chip in the nav — the structure is planned, and saying so
 * is better than a link that quietly goes nowhere.
 */
export type NavItem = {
  href: string;
  label: string;
  soon?: boolean;
  signedInOnly?: boolean;
  icon: "compass" | "school" | "class" | "activities" | "resources" | "profile";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Explore", icon: "compass" },
  { href: "/schools", label: "Schools", icon: "school" },
  { href: "/network", label: "Questions", icon: "compass" },
  { href: "/my-school", label: "My School", icon: "school", signedInOnly: true },
  { href: "/my-class", label: "My Class", icon: "class", signedInOnly: true },
  { href: "/activities", label: "Activities", icon: "activities", soon: true },
  { href: "/resources", label: "Resources", icon: "resources", soon: true },
];

export function navFor(signedIn: boolean) {
  return NAV_ITEMS.filter((item) => signedIn || !item.signedInOnly);
}

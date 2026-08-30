import type { NavItem } from "@/lib/navLinks";

export function NavIcon({
  name,
  className = "h-[18px] w-[18px]",
}: {
  name: NavItem["icon"];
  className?: string;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      {name === "compass" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5l-2 5-5 2 2-5z" />
        </>
      )}
      {name === "school" && (
        <path d="M4 21V9l8-5 8 5v12M9 21v-6h6v6" />
      )}
      {name === "class" && (
        <>
          <circle cx="9" cy="9" r="3" />
          <path d="M3 20c0-3.2 2.7-5 6-5s6 1.8 6 5" />
          <path d="M16 6.5a3 3 0 0 1 0 6M17.5 14.6c2.2.5 3.5 2.2 3.5 4.6" />
        </>
      )}
      {name === "activities" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3c3 3 3 15 0 18M3 12h18" />
        </>
      )}
      {name === "resources" && (
        <>
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
          <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
        </>
      )}
      {name === "profile" && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
        </>
      )}
    </svg>
  );
}

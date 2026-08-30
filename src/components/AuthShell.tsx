import { ParentsIllustration } from "@/components/ParentsIllustration";
import { Logo } from "@/components/Logo";

const BADGES = [
  {
    label: "100% Parent Verified Community",
    icon: (
      <path
        d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"
        stroke="white"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    label: "Authentic Experiences",
    icon: (
      <>
        <path
          d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3v-3H6a2 2 0 0 1-2-2V6z"
          stroke="white"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M12 14c-2.5-1.6-4-3-4-4.5A2 2 0 0 1 12 8a2 2 0 0 1 4 1.5c0 1.5-1.5 2.9-4 4.5z"
          fill="white"
        />
      </>
    ),
  },
  {
    label: "Complete Privacy & Safety",
    icon: (
      <>
        <rect
          x="5"
          y="10"
          width="14"
          height="10"
          rx="2"
          stroke="white"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M8 10V7a4 4 0 0 1 8 0v3"
          stroke="white"
          strokeWidth="1.6"
          fill="none"
        />
      </>
    ),
  },
];

/** The split hero + card layout shared by login, signup and password reset. */
export function AuthShell({
  heading,
  subheading,
  children,
}: {
  heading: React.ReactNode;
  subheading: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col md:flex-row">
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-neutral-950 px-10 py-12 md:flex md:w-1/2">
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-amber-500/25 blur-3xl" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />

        <div className="relative z-10 w-full max-w-md">
          <h1 className="text-4xl font-bold text-white">{heading}</h1>
          <p className="mt-3 max-w-sm text-neutral-300">{subheading}</p>

          <div className="mt-8 flex gap-6">
            {BADGES.map((badge) => (
              <div
                key={badge.label}
                className="flex flex-col items-center gap-2 text-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600">
                  <svg viewBox="0 0 24 24" className="h-6 w-6">
                    {badge.icon}
                  </svg>
                </span>
                <span className="text-xs text-neutral-300">{badge.label}</span>
              </div>
            ))}
          </div>

          <ParentsIllustration className="mt-10 w-full" />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-neutral-100 px-6 py-12 md:w-1/2">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl sm:p-10">
          <Logo className="justify-center" />
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </main>
  );
}

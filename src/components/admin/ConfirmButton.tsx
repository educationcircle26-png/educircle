"use client";

/**
 * Submit button that asks first. Deletes in the admin area are permanent
 * and cascade (removing a school takes its posts and memberships with it),
 * so a single stray click should not be enough to trigger one.
 */
export function ConfirmButton({
  children,
  confirm,
  tone = "danger",
}: {
  children: React.ReactNode;
  confirm: string;
  tone?: "danger" | "neutral" | "primary";
}) {
  const tones = {
    danger:
      "border border-rose-200 text-rose-700 hover:bg-rose-50",
    neutral:
      "border border-neutral-300 text-slate-700 hover:bg-neutral-50",
    primary: "bg-violet-600 text-white hover:bg-violet-700",
  };

  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

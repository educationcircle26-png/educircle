import { toggleFollow } from "@/app/profile/follow";

/**
 * Follow control for another parent.
 *
 * Renders nothing for anonymous authors, for yourself, or for signed-out
 * visitors — an anonymous post must not gain a button that names who wrote
 * it, which is exactly what a follow control would do.
 */
export function FollowButton({
  targetId,
  viewerId,
  isAnonymous,
  following,
  returnTo,
  size = "sm",
}: {
  targetId: string | null | undefined;
  viewerId: string | null | undefined;
  isAnonymous?: boolean;
  following: boolean;
  returnTo: string;
  size?: "sm" | "md";
}) {
  if (!targetId || !viewerId || isAnonymous || targetId === viewerId) {
    return null;
  }

  const pad = size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";

  return (
    <form action={toggleFollow.bind(null, targetId, returnTo)}>
      <button
        type="submit"
        aria-pressed={following}
        className={`shrink-0 rounded-lg font-bold transition ${pad} ${
          following
            ? "bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700"
            : "bg-violet-600 text-white hover:bg-violet-700"
        }`}
      >
        {following ? "Following" : "Follow"}
      </button>
    </form>
  );
}

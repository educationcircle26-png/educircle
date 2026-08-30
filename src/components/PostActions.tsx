import Link from "next/link";
import { togglePostReaction, toggleSave } from "@/app/network/actions";

/**
 * Like and save controls for a question row.
 *
 * Signed-out visitors get links to sign up rather than dead buttons — they
 * can read everything, but acting on a post is what an account is for.
 */
export function PostActions({
  postId,
  likeCount,
  liked,
  saved,
  signedIn,
  returnTo,
}: {
  postId: string;
  likeCount: number;
  liked: boolean;
  saved: boolean;
  signedIn: boolean;
  returnTo: string;
}) {
  if (!signedIn) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href="/signup"
          title="Join to like this question"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
        >
          <HeartIcon filled={false} />
          {likeCount > 0 && likeCount}
        </Link>
        <Link
          href="/signup"
          title="Join to save this question"
          className="rounded-lg px-2 py-1.5 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600"
        >
          <BookmarkIcon filled={false} />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <form action={togglePostReaction.bind(null, postId, returnTo)}>
        <button
          type="submit"
          title={liked ? "Remove like" : "Like this question"}
          aria-pressed={liked}
          className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold transition hover:bg-rose-50 ${
            liked ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
          }`}
        >
          <HeartIcon filled={liked} />
          {likeCount > 0 && likeCount}
        </button>
      </form>

      <form action={toggleSave.bind(null, postId, returnTo)}>
        <button
          type="submit"
          title={saved ? "Remove from saved" : "Save this question"}
          aria-pressed={saved}
          className={`rounded-lg px-2 py-1.5 transition hover:bg-violet-50 ${
            saved ? "text-violet-600" : "text-slate-400 hover:text-violet-600"
          }`}
        >
          <BookmarkIcon filled={saved} />
        </button>
      </form>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <path d="M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.7-7 10-7 10z" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

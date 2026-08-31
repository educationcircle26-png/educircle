/**
 * A parent's picture, or their initial when they have none.
 *
 * `anonymous` wins over everything: an anonymous post must show a neutral
 * mark, never the author's real photo — the avatar would identify them just
 * as surely as their name would.
 */
export function Avatar({
  name,
  url,
  anonymous,
  size = 40,
  className = "",
}: {
  name?: string | null;
  url?: string | null;
  anonymous?: boolean;
  size?: number;
  className?: string;
}) {
  const px = { width: size, height: size };

  if (anonymous) {
    return (
      <span
        style={px}
        className={`flex shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-500 ${className}`}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          style={{ width: size * 0.55, height: size * 0.55 }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
        </svg>
      </span>
    );
  }

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        style={px}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      style={px}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 font-bold text-white ${className}`}
      aria-hidden
    >
      <span style={{ fontSize: Math.max(size * 0.4, 11) }}>
        {(name ?? "P").charAt(0).toUpperCase()}
      </span>
    </span>
  );
}

export function ParentsIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 420 300"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <ellipse cx="210" cy="280" rx="180" ry="16" fill="#000" opacity="0.25" />

      {/* left parent (hijab) */}
      <path
        d="M60 280c0-52 22-96 58-96s58 44 58 96z"
        fill="#7C5CFC"
      />
      <path
        d="M78 190c0-24 18-42 40-42s40 18 40 42c0 6-2 11-5 15-8-14-20-20-35-20s-27 6-35 20c-3-4-5-9-5-15"
        fill="#5B3FD6"
      />
      <circle cx="118" cy="196" r="24" fill="#C9B8FF" />
      <rect
        x="90"
        y="230"
        width="42"
        height="30"
        rx="4"
        fill="#EDE6FF"
      />
      <rect x="96" y="240" width="30" height="3" rx="1.5" fill="#7C5CFC" />
      <rect x="96" y="248" width="20" height="3" rx="1.5" fill="#7C5CFC" />

      {/* middle parent */}
      <path
        d="M170 280c0-58 20-104 50-104s50 46 50 104z"
        fill="#9B87F5"
      />
      <circle cx="220" cy="164" r="26" fill="#D8CCFF" />
      <path
        d="M198 152c2-16 11-26 22-26s20 10 22 26c-6-6-14-9-22-9s-16 3-22 9"
        fill="#2E1F66"
      />

      {/* right parent */}
      <path
        d="M282 280c0-52 22-96 58-96s58 44 58 96z"
        fill="#7C5CFC"
      />
      <circle cx="322" cy="192" r="24" fill="#C9B8FF" />
      <path
        d="M300 182c2-15 10-24 22-24s20 9 22 24c-6-5-14-8-22-8s-16 3-22 8"
        fill="#2E1F66"
      />
      <rect
        x="330"
        y="222"
        width="26"
        height="36"
        rx="2"
        fill="#EDE6FF"
      />
      <rect x="335" y="230" width="16" height="4" rx="1" fill="#5B3FD6" />
      <text
        x="343"
        y="248"
        textAnchor="middle"
        fontSize="6"
        fill="#5B3FD6"
        fontFamily="sans-serif"
      >
        BOOKS
      </text>
    </svg>
  );
}

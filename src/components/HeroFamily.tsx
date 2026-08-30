/**
 * Hero artwork: a parent, child and second parent sharing a tablet.
 *
 * Drawn rather than photographed — a stock photo of a family would be
 * someone else's likeness standing in for "our parents", which is exactly
 * the impression this product shouldn't give.
 */
export function HeroFamily({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 420"
      className={className}
      role="img"
      aria-label="Two parents and a child looking at a tablet together"
    >
      <defs>
        <linearGradient id="hf-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="100%" stopColor="#f5f3ff" />
        </linearGradient>
        <linearGradient id="hf-violet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="hf-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="hf-teal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>

      {/* soft backdrop */}
      <ellipse cx="260" cy="220" rx="235" ry="185" fill="url(#hf-bg)" />

      {/* dotted texture, top left */}
      <g fill="#c4b5fd" opacity="0.55">
        {[0, 1, 2, 3, 4].map((r) =>
          [0, 1, 2, 3, 4].map((c) => (
            <circle key={`${r}-${c}`} cx={48 + c * 15} cy={58 + r * 15} r="2.4" />
          )),
        )}
      </g>

      {/* floating chat bubbles */}
      <g className="float-soft">
        <rect x="392" y="70" width="86" height="40" rx="14" fill="#ffffff" />
        <rect x="406" y="84" width="46" height="5" rx="2.5" fill="#ddd6fe" />
        <rect x="406" y="95" width="30" height="5" rx="2.5" fill="#ede9fe" />
        <path d="M406 110l-8 12 20-12z" fill="#ffffff" />
      </g>
      <g className="float-soft" style={{ animationDelay: "1.6s" }}>
        <rect x="36" y="252" width="74" height="36" rx="13" fill="#ffffff" />
        <rect x="49" y="264" width="40" height="5" rx="2.5" fill="#ddd6fe" />
        <rect x="49" y="275" width="24" height="5" rx="2.5" fill="#ede9fe" />
        <path d="M96 288l10 11-22-11z" fill="#ffffff" />
      </g>

      {/* ---- left parent ---- */}
      <g>
        <path
          d="M120 400c0-46 24-74 58-74s58 28 58 74z"
          fill="url(#hf-violet)"
        />
        <circle cx="178" cy="292" r="34" fill="#f3d5c0" />
        {/* hair */}
        <path
          d="M144 288c0-26 16-40 34-40s34 14 34 40c0 6-2 10-4 10 0-18-12-26-30-26s-30 8-30 26c-2 0-4-4-4-10z"
          fill="#3f2a1d"
        />
        <path d="M144 288c-6 14-4 34 4 44-10-6-16-30-4-44z" fill="#3f2a1d" />
        {/* face */}
        <circle cx="167" cy="292" r="2.6" fill="#3f2a1d" />
        <circle cx="189" cy="292" r="2.6" fill="#3f2a1d" />
        <path
          d="M170 304q8 7 16 0"
          stroke="#b4674a"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* ---- right parent ---- */}
      <g>
        <path
          d="M290 400c0-44 23-71 56-71s56 27 56 71z"
          fill="url(#hf-teal)"
        />
        <circle cx="346" cy="296" r="32" fill="#e8bd9a" />
        {/* short hair + beard */}
        <path
          d="M314 292c0-24 15-38 32-38s32 14 32 38c0 4-1 7-3 8-2-16-13-24-29-24s-27 8-29 24c-2-1-3-4-3-8z"
          fill="#2f2018"
        />
        <path
          d="M320 302c2 18 12 30 26 30s24-12 26-30c-4 14-13 22-26 22s-22-8-26-22z"
          fill="#2f2018"
          opacity="0.85"
        />
        <circle cx="336" cy="296" r="2.6" fill="#2f2018" />
        <circle cx="357" cy="296" r="2.6" fill="#2f2018" />
      </g>

      {/* ---- child, centre front ---- */}
      <g>
        <path
          d="M212 400c0-34 18-55 44-55s44 21 44 55z"
          fill="url(#hf-amber)"
        />
        <circle cx="256" cy="322" r="27" fill="#f7ddc6" />
        <path
          d="M229 318c0-21 12-33 27-33s27 12 27 33c0 3-1 5-2 6-3-13-11-20-25-20s-22 7-25 20c-1-1-2-3-2-6z"
          fill="#5b3a22"
        />
        {/* curls */}
        <circle cx="234" cy="304" r="7" fill="#5b3a22" />
        <circle cx="248" cy="296" r="8" fill="#5b3a22" />
        <circle cx="264" cy="296" r="8" fill="#5b3a22" />
        <circle cx="278" cy="304" r="7" fill="#5b3a22" />
        <circle cx="248" cy="322" r="2.4" fill="#4a2f1c" />
        <circle cx="266" cy="322" r="2.4" fill="#4a2f1c" />
        <path
          d="M249 332q7 7 14 0"
          stroke="#c07a55"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* ---- tablet the child is holding ---- */}
      <g>
        <rect
          x="214"
          y="356"
          width="84"
          height="60"
          rx="8"
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth="2"
        />
        <rect x="225" y="368" width="42" height="5" rx="2.5" fill="#c4b5fd" />
        <rect x="225" y="380" width="62" height="5" rx="2.5" fill="#e9e5ff" />
        <rect x="225" y="392" width="52" height="5" rx="2.5" fill="#e9e5ff" />
        <circle cx="287" cy="370" r="6" fill="#7c3aed" opacity="0.18" />
      </g>

      {/* small hearts rising from the tablet */}
      <g fill="#f472b6" opacity="0.85">
        <path
          className="float-soft"
          d="M312 344c-4-4-10-2-10 3 0 4 6 8 10 11 4-3 10-7 10-11 0-5-6-7-10-3z"
        />
        <path
          className="float-soft"
          style={{ animationDelay: "2.2s" }}
          d="M196 330c-3-3-7-1-7 2 0 3 4 6 7 8 3-2 7-5 7-8 0-3-4-5-7-2z"
          opacity="0.7"
        />
      </g>
    </svg>
  );
}

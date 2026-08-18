export function LogoMark({ className = "h-8 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 128" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-mark" x1="0" y1="0" x2="96" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      <g fill="url(#logo-mark)">
        <rect x="16" y="8" width="18" height="112" />
        <rect x="16" y="8" width="66" height="20" />
        <rect x="34" y="46" width="36" height="16" />
        <polygon points="46,62 66,62 56,76" />
        <rect x="34" y="92" width="40" height="16" />
        <polygon points="40,108 68,108 52,128" />
      </g>
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="text-xl font-bold text-neutral-900">EduCircle</span>
    </div>
  );
}

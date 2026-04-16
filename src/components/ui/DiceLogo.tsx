/**
 * RollCore logo — d20 silhouette with inner detail lines.
 * Redesigned for v2: more geometric, more presence.
 */
export function DiceLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="RollCore logo"
    >
      {/* Outer d20 pentagon shape — top half */}
      <polygon
        points="40,4 72,26 60,62 20,62 8,26"
        fill="rgba(212,168,67,0.06)"
        stroke="#D4A843"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Inner geometric lines — face divisions */}
      <line x1="40" y1="4"  x2="40" y2="62" stroke="#D4A843" strokeWidth="0.8" opacity="0.3" />
      <line x1="8"  y1="26" x2="60" y2="62" stroke="#D4A843" strokeWidth="0.8" opacity="0.3" />
      <line x1="72" y1="26" x2="20" y2="62" stroke="#D4A843" strokeWidth="0.8" opacity="0.3" />
      {/* Horizontal mid-line */}
      <line x1="8"  y1="26" x2="72" y2="26" stroke="#D4A843" strokeWidth="0.8" opacity="0.25" />
      {/* Center glow dot */}
      <circle cx="40" cy="35" r="4" fill="#D4A843" opacity="0.9" />
      <circle cx="40" cy="35" r="7" fill="none" stroke="#D4A843" strokeWidth="0.8" opacity="0.3" />
      {/* Top accent */}
      <polygon
        points="40,4 52,20 28,20"
        fill="rgba(212,168,67,0.15)"
        stroke="none"
      />
    </svg>
  )
}
/**
 * RollCore SVG logo — d8 (octahedron) silhouette.
 * Replaces the 🎲 emoji used in the Vanilla JS prototype (Sprint 4).
 */
export function DiceLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="RollCore logo"
    >
      {/* Top diamond face */}
      <polygon
        points="32,4 58,26 32,38 6,26"
        fill="none"
        stroke="#C8973A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Bottom diamond face */}
      <polygon
        points="32,38 58,26 32,60 6,26"
        fill="rgba(200,151,58,0.12)"
        stroke="#C8973A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Centre spine */}
      <line x1="32" y1="4" x2="32" y2="60" stroke="#C8973A" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.5" />
      {/* Result dot */}
      <circle cx="32" cy="26" r="3.5" fill="#C8973A" />
    </svg>
  )
}

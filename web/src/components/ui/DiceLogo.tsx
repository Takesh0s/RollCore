/**
 * Logo oficial do RollCore (a mesma do app mobile, em mobile/assets/logo).
 * Hexágono com as duas linhas horizontais e o zigue-zague da face do dado.
 * Usa `currentColor`, então a cor vem do CSS do elemento pai.
 */
export function DiceLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 56.14 65.07"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="RollCore"
    >
      <polygon
        points="28.07,1.83 54.32,17.18 54.32,47.89 28.07,63.24 1.83,47.89 1.83,17.18"
        strokeWidth="3.65"
      />
      <path
        d="M1.83 17.18 L54.32 17.18 M1.83 44.88 L54.32 44.88 M3.63 17.18 L15.89 44.88 M15.89 44.88 L28.07 17.18 M28.07 17.18 L40.25 44.88 M40.25 44.88 L52.51 17.18 M15.89 44.88 L28.07 59.48 M40.25 44.88 L28.07 59.48"
        strokeWidth="1.65"
      />
    </svg>
  )
}

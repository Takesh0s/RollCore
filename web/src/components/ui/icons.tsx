import type { ReactNode, SVGProps } from 'react'

/**
 * Ícones de linha usados no cabeçalho, no menu lateral e nos cartões.
 * Todos usam `currentColor`, então a cor vem do CSS do elemento pai.
 */
function Svg({ children, ...rest }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

type P = SVGProps<SVGSVGElement>

export const IconMenu = (p: P) => <Svg {...p}><line x1="3" y1="6" x2="21" y2="6" strokeWidth="2.4" /><line x1="3" y1="12" x2="21" y2="12" strokeWidth="2.4" /><line x1="3" y1="18" x2="21" y2="18" strokeWidth="2.4" /></Svg>
export const IconBack = (p: P) => <Svg {...p}><line x1="20" y1="12" x2="4" y2="12" strokeWidth="2" /><polyline points="10 6 4 12 10 18" strokeWidth="2" /></Svg>
export const IconUser = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3.4" /><path d="M5.8 18.6c1.4-2.6 3.6-3.8 6.2-3.8s4.8 1.2 6.2 3.8" /></Svg>
export const IconHome = (p: P) => <Svg {...p}><path d="M3 11.5 12 3l9 8.5" strokeWidth="2" /><path d="M5.5 10v10h13V10" /><path d="M10 20v-6h4v6" /></Svg>
export const IconBell = (p: P) => <Svg {...p}><path d="M6 17V11a6 6 0 0 1 12 0v6l1.6 2H4.4z" /><path d="M10 21a2 2 0 0 0 4 0" /><path d="M12 3V2" /></Svg>
export const IconCommunity = (p: P) => <Svg {...p}><circle cx="12" cy="9" r="3" /><circle cx="5" cy="6" r="1.8" /><circle cx="19" cy="6" r="1.8" /><circle cx="6" cy="18" r="1.8" /><circle cx="18" cy="18" r="1.8" /><path d="M7 20c1-3 3-4 5-4s4 1 5 4" /><path d="M6.5 7.5 9.5 9M17.5 7.5 14.5 9" /></Svg>
export const IconCalendar = (p: P) => <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2.5" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /><circle cx="8" cy="14" r=".6" fill="currentColor" /><circle cx="12" cy="14" r=".6" fill="currentColor" /><circle cx="16" cy="14" r=".6" fill="currentColor" /><circle cx="8" cy="18" r=".6" fill="currentColor" /><circle cx="12" cy="18" r=".6" fill="currentColor" /></Svg>
export const IconSystems = (p: P) => <Svg {...p}><rect x="3" y="4" width="18" height="4.5" rx="1" /><rect x="3" y="9.5" width="18" height="4.5" rx="1" /><rect x="3" y="15" width="18" height="4.5" rx="1" /></Svg>
export const IconGrimoire = (p: P) => <Svg {...p}><circle cx="13" cy="14" r="7" /><path d="M7.5 18.5c1.5 1.2 3.2 1.8 5.5 1.8" /><path d="M5 4v4M3 6h4" /><path d="M9 21h8" /></Svg>
export const IconWand = (p: P) => <Svg {...p}><line x1="4" y1="20" x2="14" y2="10" strokeWidth="2.2" /><path d="M16 3v4M14 5h4" /><path d="M20 9v3M18.5 10.5h3" /><path d="M10 3.5v2M9 4.5h2" /></Svg>
export const IconPaw = (p: P) => <Svg {...p}><ellipse cx="12" cy="16" rx="4.5" ry="3.8" /><circle cx="6" cy="10.5" r="1.8" /><circle cx="10" cy="6.5" r="1.8" /><circle cx="14" cy="6.5" r="1.8" /><circle cx="18" cy="10.5" r="1.8" /></Svg>
export const IconChat = (p: P) => <Svg {...p}><path d="M4 5h16v11H9l-5 4z" /><circle cx="9" cy="10.5" r=".7" fill="currentColor" /><circle cx="12" cy="10.5" r=".7" fill="currentColor" /><circle cx="15" cy="10.5" r=".7" fill="currentColor" /></Svg>
export const IconGear = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M5.2 18.8l2.1-2.1M16.7 7.3l2.1-2.1" /></Svg>
export const IconScroll = (p: P) => <Svg {...p}><path d="M7 4h11v13a3 3 0 0 1-3 3H6a3 3 0 0 0 3-3V6a2 2 0 0 0-2-2z" /><path d="M7 4a2 2 0 0 0-2 2v1h4" /><line x1="12" y1="9" x2="15" y2="9" /><line x1="12" y1="13" x2="15" y2="13" /></Svg>
export const IconPlus = (p: P) => <Svg {...p}><line x1="12" y1="4" x2="12" y2="20" strokeWidth="2.4" /><line x1="4" y1="12" x2="20" y2="12" strokeWidth="2.4" /></Svg>
export const IconSheets = (p: P) => <Svg {...p}><path d="M9 3h9a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M8 6 5 7v13l9-2" /><line x1="11" y1="8" x2="16" y2="8" /><line x1="11" y1="11" x2="16" y2="11" /><line x1="11" y1="14" x2="16" y2="14" /></Svg>
export const IconFilter = (p: P) => <Svg {...p}><path d="M3 4h18l-7 8.5V20l-4-2v-5.5z" /></Svg>
export const IconFeather = (p: P) => <Svg {...p}><path d="M20 4c-8 0-13 4-13 11l-2 5 5-2c7 0 10-5 10-14z" /><line x1="8" y1="16" x2="15" y2="9" /></Svg>
export const IconEdit = (p: P) => <Svg {...p}><path d="M5 19h4l10-10-4-4L5 15z" /><path d="m13.5 6.5 4 4" /></Svg>
export const IconSearch = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><line x1="16" y1="16" x2="21" y2="21" /></Svg>
export const IconLogout = (p: P) => <Svg {...p}><path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" /><polyline points="15 8 19 12 15 16" /><line x1="19" y1="12" x2="9" y2="12" /></Svg>
export const IconHelp = (p: P) => <Svg {...p}><path d="M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4" /><circle cx="12" cy="17.5" r=".7" fill="currentColor" /></Svg>
export const IconNotes = (p: P) => <Svg {...p}><path d="M6 3h9l4 4v10l-4 4H6z" /><path d="M14 3v5h5" /><line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="13" y2="15" /><path d="m15 20 5-5 1.5 1.5-5 5H15z" /></Svg>

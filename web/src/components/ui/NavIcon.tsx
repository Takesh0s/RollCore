import home from '@/assets/nav/home.svg?raw'
import sheets from '@/assets/nav/sheets.svg?raw'
import dice from '@/assets/nav/dice.svg?raw'
import tables from '@/assets/nav/tables.svg?raw'
import calendar from '@/assets/nav/calendar.svg?raw'
import community from '@/assets/nav/community.svg?raw'
import systems from '@/assets/nav/systems.svg?raw'
import bestiary from '@/assets/nav/bestiary.svg?raw'
import tools from '@/assets/nav/tools.svg?raw'
import store from '@/assets/nav/store.svg?raw'
import tutorials from '@/assets/nav/tutorials.svg?raw'
import { NEON_ICONS } from '@/assets/nav/neonIcons'
import { CYBERPUNK_ICONS } from '@/assets/nav/cyberpunkIcons'
import { TERROR_ICONS } from '@/assets/nav/terrorIcons'
import { STEAMPUNK_ICONS } from '@/assets/nav/steampunkIcons'
import { PERGAMINHO_ICONS } from '@/assets/nav/pergaminhoIcons'
import { useThemePrefs } from '@/theme/applyTheme'

/**
 * Ícones do menu lateral do computador, exportados do Figma (32×32).
 * As cores fixas do arquivo (#C0C0C0, #8FB4D4…) viram `currentColor`, então o
 * ícone segue a cor do item (normal, ativo e de cada tema).
 */
const recolor = (svg: string) => svg.replace(/#[0-9A-Fa-f]{6}\b/g, 'currentColor')

const FIGMA = { home, sheets, dice, tables, calendar, community, systems, bestiary, tools, store, tutorials }

/** Engrenagem (Phosphor, MIT): o ícone de Configurações ainda não foi exportado do Figma. */
const GEAR = '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z"/></svg>'

const ICONS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(FIGMA).map(([k, v]) => [k, recolor(v)])),
  settings: GEAR,
}

export type NavIconName = keyof typeof FIGMA | 'settings'

/** Cada tema pode ter o próprio conjunto: o Neon usa pixel-art, o Cyberpunk traço chanfrado, o Terror riscos tortos, o Steampunk engrenagens e canos, o Pergaminho pena e escudos; os demais, os do Medieval. */
export function NavIcon({ name }: { name: NavIconName }) {
  const { theme } = useThemePrefs()
  const set = theme === 'neon' ? NEON_ICONS : theme === 'cyberpunk' ? CYBERPUNK_ICONS : theme === 'terror' ? TERROR_ICONS : theme === 'steampunk' ? STEAMPUNK_ICONS : theme === 'pergaminho' ? PERGAMINHO_ICONS : undefined
  const svg = set?.[name] ?? ICONS[name]
  return <span className="nav-svg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
}

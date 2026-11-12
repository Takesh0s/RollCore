import { SvgXml } from 'react-native-svg';
import { NAV_SVG, type NavIconName } from '../design/navIcons';

/** Ícone do web (mesmos SVGs do menu e do cabeçalho). A cor vem da prop `color`, como o `currentColor` do CSS. */
export function NavIcon({ name, size = 28, color }: { name: NavIconName; size?: number; color: string }) {
  return <SvgXml xml={NAV_SVG[name]} width={size} height={size} color={color} />;
}
export type { NavIconName };

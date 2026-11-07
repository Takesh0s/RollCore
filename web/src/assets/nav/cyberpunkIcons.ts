/**
 * Ícones do tema Cyberpunk: traço fino de 2px, cantos chanfrados e pontas retas,
 * grade de 32 px. Usam `currentColor`, então seguem a cor do item (normal, ativo).
 */
const ic = (d: string) =>
  `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`

export const CYBERPUNK_ICONS: Record<string, string> = {
  home:      ic('M3 15L16 4L29 15M7 13V28H25V13M13 28V20H19V28'),
  sheets:    ic('M7 4H20L25 9V28H7ZM20 4V9H25M11 15H21M11 20H21M11 25H17'),
  tables:    ic('M9 9H23V23H9ZM12 4H20M12 28H20M4 12V20M28 12V20'),
  calendar:  ic('M4 7H28V28H4ZM4 13H28M10 3V9M22 3V9M9 18H12M15 18H18M21 18H24M9 23H12M15 23H18'),
  community: ic('M13 4H19V10H13ZM4 21H10V27H4ZM22 21H28V27H22ZM16 10V16M16 16L7 21M16 16L25 21'),
  systems:   ic('M16 4L28 10L16 16L4 10ZM4 16L16 22L28 16M4 22L16 28L28 22'),
  bestiary:  ic('M16 15L23 21L21 27H11L9 21ZM5 12H9V17H5ZM11 5H15V11H11ZM17 5H21V11H17ZM23 12H27V17H23Z'),
  tools:     ic('M5 27L19 13M16 10L22 16M24 3V9M21 6H27M8 5V9M6 7H10M26 20V24M24 22H28'),
  store:     ic('M3 5H8L11 20H25L28 9H9M11 24H14V27H11ZM22 24H25V27H22Z'),
  tutorials: ic('M16 8V27M16 8L4 6V24L16 27L28 24V6ZM8 11L12 12M8 16L12 17M20 12L24 11M20 17L24 16'),
  settings:  ic('M12 3H20L22 7L27 9L29 14V18L27 23L22 25L20 29H12L10 25L5 23L3 18V14L5 9L10 7ZM12 12H20V20H12Z'),
}

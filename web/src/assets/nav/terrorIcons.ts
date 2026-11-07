/**
 * Ícones do tema Terror: traço de 2px com pontas redondas e formas tortas, como riscos de
 * giz num dossiê (casa torta, olho, vela, morcego, punhal…). Grade de 32 px, `currentColor`.
 * O dado fica de fora de propósito: continua o ícone padrão do app.
 */
const ic = (inner: string) =>
  `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`
const p = (d: string) => `<path d="${d}"/>`
const ghost = (x: number, y: number) =>
  p(`M${x} ${y + 10}V${y + 4}Q${x} ${y} ${x + 3} ${y}Q${x + 6} ${y} ${x + 6} ${y + 4}V${y + 10}L${x + 4.5} ${y + 8.5}L${x + 3} ${y + 10}L${x + 1.5} ${y + 8.5}Z`)

export const TERROR_ICONS: Record<string, string> = {
  // casa torta com chaminé e porta em arco
  home:      ic(p('M3 16L15.5 4L29 15.5') + p('M7 14V28H25.5V14.5') + p('M21 9V5.5H24.5V12.5') + p('M13 28V21Q13 18 16 18Q19 18 19 21V28')),
  // dossiê com um olho
  sheets:    ic(p('M7 4H20L25 9.5V28H7Z') + p('M20 4V9.5H25') + p('M10 19Q16 12.5 22 19Q16 25.5 10 19Z') + p('M16 17.2V20.8')),
  // mesa redonda com uma vela acesa
  tables:    ic(p('M16 2.5Q19.5 7 16 10.5Q12.5 7 16 2.5Z') + p('M8.5 19a7.5 7.5 0 1 0 15 0a7.5 7.5 0 1 0-15 0') + p('M12 25L9.5 29.5M20 25L22.5 29.5')),
  // calendário com dias riscados
  calendar:  ic(p('M4 7H28V28H4Z') + p('M4 13H28M10 3V9M22 3V9') + p('M8 16.5L12 20.5M12 16.5L8 20.5M15 16.5L19 20.5M19 16.5L15 20.5M22 16.5L26 20.5M26 16.5L22 20.5M8 22.5L12 26.5M12 22.5L8 26.5')),
  // três fantasmas
  community: ic(ghost(13, 4) + ghost(4.5, 17) + ghost(21.5, 17) + p('M15 8.5v1M17 8.5v1M6.5 21.5v1M8.5 21.5v1M23.5 21.5v1M25.5 21.5v1')),
  // grimório com pentagrama
  systems:   ic(p('M7.5 4H26V28H7.5Q4 28 4 24.5V7.5Q4 4 7.5 4Z') + p('M10.5 4V28') + p('M18 10.5L21.2 20.4L12.8 14.3H23.2L14.8 20.4Z')),
  // morcego
  bestiary:  ic(p('M16 13L11 10Q8 12 3 11Q5 15 6 20Q8 17 10 19Q12 17 14 20L16 18L18 20Q20 17 22 19Q24 17 26 20Q27 15 29 11Q24 12 21 10Z') + p('M14 11.5L14 7L16 9.5L18 7L18 11.5')),
  // punhal pingando sangue
  tools:     ic(p('M28 4L12 13.5L18.5 20Z') + p('M9.5 16.5L15.5 22.5M12.5 19.5L5 27') + p('M24 22Q27.5 26 24 29Q20.5 26 24 22Z')),
  // frasco de veneno
  store:     ic(p('M13 4H19V10L25 22Q26.5 28 22 28H10Q5.5 28 7 22L13 10Z') + p('M12 4H20') + p('M9.5 19H22.5') + p('M14.8 23.5a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0-2.4 0')),
  // livro aberto com um olho
  tutorials: ic(p('M16 8V27M16 8L4 6V24L16 27L28 24V6Z') + p('M7.5 11L12.5 12M7.5 16L12.5 17') + p('M19 16Q22 12 25 16Q22 20 19 16Z') + p('M21 16a1 1 0 1 0 2 0a1 1 0 1 0-2 0')),
  // engrenagem de serra
  settings:  ic(p('M16 3L18 8L23 6L23 11L28 13L25 17L29 21L24 22L23 27L18 25L16 29L14 25L9 27L8 22L3 21L7 17L4 13L9 11L9 6L14 8Z') + p('M12 16a4 4 0 1 0 8 0a4 4 0 1 0-8 0')),
}

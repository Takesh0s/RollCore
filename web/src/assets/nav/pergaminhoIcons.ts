/**
 * Ícones do tema Pergaminho: torre, pergaminho, escudos, tomos, pena e tinteiro — traço de
 * manuscrito (2px, pontas redondas). Grade de 32 px, `currentColor`, então seguem a cor do item.
 * O dado fica de fora de propósito: continua o ícone padrão do app.
 */
const ic = (inner: string) =>
  `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`
const p = (d: string) => `<path d="${d}"/>`
const circle = (cx: number, cy: number, r: number) =>
  p(`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0-${2 * r} 0`)
const shield = (x: number, y: number) =>
  p(`M${x} ${y}H${x + 8}V${y + 6}Q${x + 8} ${y + 11} ${x + 4} ${y + 13}Q${x} ${y + 11} ${x} ${y + 6}Z`)

/** Engrenagem de dentes quadrados para Configurações. */
function gear(cx: number, cy: number, ro: number, ri: number, teeth: number, hole: number): string {
  const pts: string[] = []
  const step = (Math.PI * 2) / teeth
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2
    const w = step * 0.2
    ;[[a - step * 0.5 + w, ri], [a - w, ro], [a + w, ro], [a + step * 0.5 - w, ri]].forEach(([ang, r]) =>
      pts.push(`${(cx + Math.cos(ang) * r).toFixed(1)} ${(cy + Math.sin(ang) * r).toFixed(1)}`))
  }
  return p(`M${pts.join('L')}Z`) + circle(cx, cy, hole)
}

export const PERGAMINHO_ICONS: Record<string, string> = {
  // torre de castelo com bandeira
  home:      ic(p('M7 28V12H10V9H13V12H19V9H22V12H25V28Z') + p('M13 28V21Q13 17.5 16 17.5Q19 17.5 19 21V28') + p('M16 9V2.5L22 4.5L16 6.5')),
  // pergaminho enrolado
  sheets:    ic(p('M11 5H25V24Q25 27 22 27H8Q11 27 11 24V8Q11 5 8 5Q5 5 5 8V9Q5 11 8 11H11') + p('M15 12H21M15 16H21M15 20H19')),
  // mesa redonda com um cálice
  tables:    ic(p('M13 3H19Q19 8 16 8Q13 8 13 3Z') + p('M16 8V10.5') + p('M4 14Q16 9.5 28 14Q16 18.5 4 14Z') + p('M16 17V26M11 29H21M12.5 26.5Q16 25 19.5 26.5')),
  // calendário com selo de cera
  calendar:  ic(p('M4 7H28V28H4Z M4 13H28 M10 3V9 M22 3V9') + circle(16, 21, 4.5) + circle(16, 21, 1.6)),
  // três escudos heráldicos
  community: ic(shield(12, 3) + shield(4, 16) + shield(20, 16)),
  // pilha de tomos com marcador
  systems:   ic(p('M5 4H25V10H5Z M8 11H28V17H8Z M5 18H25V24H5Z') + p('M8 4V10M11 11V17M8 18V24') + p('M22 24V29L24 27.3L26 29V24')),
  // asa de dragão
  bestiary:  ic(p('M4 27L8 6L13.5 13.5L18.5 4.5L23.5 13L28.5 8.5L26 21Q22 27 14 28Q8 28 4 27Z') + p('M8 6L10.5 25M18.5 4.5L16.5 25M23.5 13L22 24')),
  // pena e tinteiro
  tools:     ic(p('M27 3Q13 5 8 17L6 25L13.5 23Q24 17 27 3Z') + p('M27 3L8.5 22') + p('M19 27H28V30H19Z M21 27V25H26V27')),
  // bolsa de moedas
  store:     ic(p('M11 7Q16 4 21 7L19.5 11Q27 17 25 25Q24 29 16 29Q8 29 7 25Q5 17 12.5 11Z') + p('M11.5 11.5H20.5') + circle(16, 21, 3.2)),
  // livro aberto com marcador
  tutorials: ic(p('M16 8V27M16 8L4 6V24L16 27L28 24V6Z') + p('M7.5 11L12.5 12M7.5 16L12.5 17') + p('M22 7V17L24 15L26 17V7.5')),
  // engrenagem
  settings:  ic(gear(16, 16, 13, 10, 8, 4)),
}

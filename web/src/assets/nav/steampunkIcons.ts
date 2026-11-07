/**
 * Ícones do tema Steampunk: engrenagens, canos e ferramentas de latão, traço de 2px com
 * pontas redondas. Grade de 32 px, `currentColor`, então seguem a cor do item.
 * O dado fica de fora de propósito: continua o ícone padrão do app.
 */
const ic = (inner: string) =>
  `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`
const p = (d: string) => `<path d="${d}"/>`
const circle = (cx: number, cy: number, r: number) =>
  p(`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0-${2 * r} 0`)

/** Engrenagem: contorno com `teeth` dentes + furo central. */
function gear(cx: number, cy: number, ro: number, ri: number, teeth: number, hole = ri * 0.45): string {
  const pts: string[] = []
  const step = (Math.PI * 2) / teeth
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2
    const w = step * 0.22
    ;[[a - step * 0.5 + w, ri], [a - w, ro], [a + w, ro], [a + step * 0.5 - w, ri]].forEach(([ang, r]) =>
      pts.push(`${(cx + Math.cos(ang) * r).toFixed(1)} ${(cy + Math.sin(ang) * r).toFixed(1)}`))
  }
  return p(`M${pts.join('L')}Z`) + circle(cx, cy, hole)
}

export const STEAMPUNK_ICONS: Record<string, string> = {
  // casa com chaminé soltando vapor
  home:      ic(p('M3 16L16 5L29 16M7 14V28H25V14M13 28V20H19V28') + p('M22 10V6') + p('M21 4Q23 3 23 1.5M24 5Q26 4 26 2.5')),
  // pergaminho com engrenagem
  sheets:    ic(p('M7 4H21Q25 4 25 8V26Q25 28 23 28H9Q7 28 7 26ZM7 4Q4 4 4 7Q4 10 7 10') + gear(16, 17, 5.8, 4.2, 7, 1.6)),
  // mesa redonda com engrenagem no centro
  tables:    ic(gear(16, 14, 8, 6, 10, 2.4) + p('M12 22L9 29M20 22L23 29M7 29H11M21 29H25')),
  // calendário com engrenagem
  calendar:  ic(p('M4 7H28V28H4Z M4 13H28 M10 3V9 M22 3V9') + gear(16, 21, 4.9, 3.6, 7, 1.3)),
  // três engrenagens conectadas
  community: ic(gear(11, 12, 7, 5.4, 8, 2) + gear(23, 9, 4.2, 3.2, 8, 1.2) + gear(21, 22, 5.6, 4.3, 8, 1.6)),
  // caldeira: tanque com canos e manômetro
  systems:   ic(p('M4 12H24Q28 12 28 16V20Q28 24 24 24H4Z') + p('M8 12V8H12V12M20 12V6') + p('M4 18H2M28 18H30') + circle(16, 18, 3.2) + p('M16 18L17.8 16.5') + p('M8 24V28M24 24V28')),
  // inseto mecânico (besouro de engrenagens)
  bestiary:  ic(circle(16, 18, 7) + p('M16 11V25') + p('M16 11L12 6M16 11L20 6') + p('M9.5 15L4 12M9.5 19L3.5 19M9.5 23L4.5 27M22.5 15L28 12M22.5 19L28.5 19M22.5 23L27.5 27')),
  // chave inglesa cruzada com chave de fenda
  tools:     ic(p('M20 4Q15 4 15 9Q15 10.5 15.8 11.8L5 22.5Q3.5 24 5 26Q6.5 27.5 8 26L18.8 15.2Q20 16 21.5 16Q27 16 27 11L23.5 14L20 12.5L18.5 9L22 5.5Q21 4 20 4Z') + p('M20 24L26 30M18.5 22.5L22 19.5L28.5 26L25.5 29.5Z')),
  // carrinho com engrenagem
  store:     ic(p('M3 5H8L11 20H25L28 9H9') + p('M11 24.3a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0M21.4 24.3a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0') + gear(18, 14, 4.4, 3.2, 7, 1.2)),
  // livro aberto com engrenagem
  tutorials: ic(p('M16 8V27M16 8L4 6V24L16 27L28 24V6Z') + p('M7.5 11L12.5 12M7.5 16L12.5 17') + gear(22, 15, 4.8, 3.5, 7, 1.4)),
  // engrenagem grande de latão
  settings:  ic(gear(16, 16, 13, 10, 10, 4)),
}

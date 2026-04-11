/* ═══════════════════════════════════════════════
   ROLLCORE — Navigation
   Controla qual tela está visível e sincroniza
   o estado ativo dos botões de navegação.
══════════════════════════════════════════════════ */

/**
 * Ativa a tela correspondente ao id fornecido
 * e marca o botão de navegação como ativo.
 * @param {string} id - Identificador da tela (ex: 'login', 'dados')
 */
export function showScreen(id) {
  document.querySelectorAll('.screen')
    .forEach(s => s.classList.remove('active'));

  document.getElementById('s-' + id)
    ?.classList.add('active');

  document.querySelectorAll('.nav-btn')
    .forEach(b => b.classList.remove('active'));

  document.querySelector(`.nav-btn[data-nav="${id}"]`)
    ?.classList.add('active');
}

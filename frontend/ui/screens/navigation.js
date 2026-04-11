/**
 * Screen navigation controller.
 * Activates the target screen and syncs the prototype navigation bar state.
 */

/**
 * Shows the screen matching the given id and marks its nav button as active.
 * @param {string} id - Screen identifier (e.g. 'login', 'dados')
 */
export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('s-' + id)?.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.nav-btn[data-nav="${id}"]`)?.classList.add('active');
}

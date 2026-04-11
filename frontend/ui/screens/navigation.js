export function showScreen(id){
  document.querySelectorAll('.screen')
    .forEach(s => s.classList.remove('active'));

  document.getElementById('s-' + id)?.classList.add('active');

  document.querySelectorAll('.nav-btn')
    .forEach(b => b.classList.remove('active'));

  document.querySelector(`[data-nav="${id}"]`)?.classList.add('active');
}
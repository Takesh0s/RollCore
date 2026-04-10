import { state, addHistory } from './state.js';
import { rollD20, rollFormula } from './dice.js';
import { getSkillBonus } from './engine.js';
import { updateDiceUI, showScreen } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  bindNavigation();
  bindDice();
});

function bindNavigation(){
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      const screen = el.dataset.nav;
      navigate(screen);
    });
  });
}

function bindDice(){
  document.querySelectorAll('[data-roll]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sides = parseInt(btn.dataset.roll);
      quickRoll(sides);
    });
  });
}

export function rollSkill(skill){
  const bonus = getSkillBonus(skill, state.character);
  const result = rollD20(bonus);

  addHistory({ type: 'skill', skill, result });

  updateDiceUI(result);
  showScreen('dados');
}

export function quickRoll(sides){
  const result = rollFormula(1, sides, 0);

  addHistory({ type: 'dice', sides, result });

  updateDiceUI(result);
}

export function navigate(screen){
  state.currentScreen = screen;
  showScreen(screen);
}
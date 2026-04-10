export const state = {
  currentScreen: 'login',

  character: {
    name: "Thorin Kettleback",
    class: "Guerreiro",
    level: 5,
    profBonus: 3,
    attributes: {
      STR: 18,
      DEX: 12,
      CON: 16,
      INT: 10,
      WIS: 14,
      CHA: 8
    }
  },

  history: []
};

export function addHistory(entry){
  state.history.unshift({
    ...entry,
    timestamp: Date.now()
  });

  if(state.history.length > 50){
    state.history.pop();
  }
}
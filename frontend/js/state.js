export const state = {
  currentScreen: 'login',

  user: {
    isLogged: false,
    keepConnected: false
  },

  characters: [
    {
      id: 1,
      name: "Thorin Kettleback",
      class: "Guerreiro",
      race: "Anão",
      level: 5,
      profBonus: 3,
      hp: 38,
      ac: 16,
      attributes: {
        STR: 18,
        DEX: 12,
        CON: 16,
        INT: 10,
        WIS: 14,
        CHA: 8
      }
    }
  ],

  selectedCharacterId: 1,
  history: []
};

export function addHistory(entry){
  state.history.unshift({
    ...entry,
    timestamp: Date.now()
  });

  if(state.history.length > 50){
    state.history.length = 50;
  }
}
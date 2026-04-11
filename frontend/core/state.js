/* ═══════════════════════════════════════════════
   ROLLCORE — State
   Armazena o estado global da aplicação.
   Personagens mock seguem o modelo da tabela
   characters (UC-02 / Seção 9.2 Doc. de Visão).
══════════════════════════════════════════════════ */

export const state = {
  currentScreen: 'login',

  user: {
    isLogged: false,
    email: '',
    keepConnected: false
  },

  // Mock de e-mails já cadastrados (UC-01 RN-04 — unicidade)
  registeredEmails: ['teste@rpg.com'],

  // Mock de personagens (tabela characters)
  characters: [
    {
      id: 1,
      name: 'Thorin Kettleback',
      class: 'Guerreiro',
      race: 'Anão',
      level: 5,
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

  // Histórico de rolagens (tabela dice_rolls — UC-03)
  history: []
};

/**
 * Adiciona uma entrada ao histórico e mantém o limite de 50
 * registros (UC-03 RN-04).
 * @param {object} entry
 */
export function addHistory(entry) {
  state.history.unshift({
    ...entry,
    timestamp: Date.now()
  });

  // UC-03 RN-04: exibir apenas últimas 50 rolagens
  if (state.history.length > 50) {
    state.history.length = 50;
  }
}

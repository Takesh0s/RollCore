export function calcMod(value){
  return Math.floor((value - 10) / 2);
}

const SKILL_MAP = {
  Atletismo: 'STR',
  Intimidacao: 'CHA',
  Percepcao: 'WIS',
  Furtividade: 'DEX',
  Arcana: 'INT'
};

export function getSkillBonus(skill, character){
  const attr = SKILL_MAP[skill];

  if(!attr) return 0;

  const baseMod = calcMod(character.attributes[attr]);

  return baseMod + character.profBonus;
}
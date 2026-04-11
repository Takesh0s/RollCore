export function roll(max){
  return Math.floor(Math.random() * max) + 1;
}

export function rollD20(mod = 0){
  const d20 = roll(20);

  return {
    total: d20 + mod,
    rolls: [d20],
    mod,
    type: 'd20'
  };
}

export function rollFormula(n, sides, mod = 0){
  const rolls = Array.from({ length: n }, () => roll(sides));
  const total = rolls.reduce((a, b) => a + b, 0) + mod;

  return {
    total,
    rolls,
    mod,
    type: `d${sides}`
  };
}
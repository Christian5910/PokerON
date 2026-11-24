'use strict';
// Mede a força relativa dos níveis: muitas partidas curtas, ganho médio em big blinds por mão.
const P = require('../regras.js'), R = require('../robo.js');
const lv = (arr) => arr.map((n, i) => ({ nome: 'R' + i, tipo: 'robo', nivel: n }));
function mao(E) { P.novaMao(E); let g = 0; while (E.fase === 'mao' && g++ < 400) { const m = E.m; if (m.pend === 'apostar') P.aplicar(E, R.decidir(P.visao(E, m.vez))); else if (m.pend === 'distribuir') P.distribuida(E); else break; } }
const REPS = +process.argv[2] || 60, MAOS = 40, mesa = (process.argv[3] || '1,2,3,4,5').split(',').map(Number);
const soma = {}, n = {}; mesa.forEach((x) => { soma[x] = 0; n[x] = 0; });
const t0 = Date.now();
for (let rod = 0; rod < mesa.length; rod++) {
  const niv = mesa.slice(rod).concat(mesa.slice(0, rod));
  for (let r = 0; r < REPS; r++) {
    const E = P.novo({ fis: false, jogadores: lv(niv), fichas: 2000, sb: 10, bb: 20, mpn: 0, semente: (process.argv[4] || 'f') + rod + '_' + r });
    const ini = E.jog.map((j) => j.fichas);
    for (let h = 0; h < MAOS && E.fase !== 'fim'; h++) mao(E);
    E.jog.forEach((j, i) => { soma[j.nivel] += (j.fichas - ini[i]) / 20; n[j.nivel]++; });
  }
}
const out = {}; for (const k in soma) out[k] = +(soma[k] / n[k] / MAOS * 100).toFixed(1);
console.log('bb por 100 mãos', JSON.stringify(out), (Date.now() - t0) / 1000 + 's');

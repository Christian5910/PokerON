'use strict';
const assert = require('assert');
const P = require('../regras.js'), R = require('../robo.js'), S = require('../sorteio.js');
let ok = 0, falhas = 0;
function t(nome, f) { try { f(); ok++; console.log('ok   ' + nome); } catch (e) { falhas++; console.log('FALHA ' + nome + '\n     ' + (e && e.stack || e)); } }

function jogarMao(E, espiar) {
  P.novaMao(E);
  let guard = 0;
  while (E.fase === 'mao' && guard++ < 400) {
    const m = E.m;
    if (m.pend === 'apostar') {
      const i = m.vez, v = P.visao(E, i);
      if (espiar) espiar(v, E, i);
      const a = R.decidir(v);
      const r = P.aplicar(E, a);
      assert.ok(r.ok, 'ação inválida do robô nível ' + E.jog[i].nivel + ': ' + JSON.stringify(a) + ' -> ' + r.erro);
    } else if (m.pend === 'distribuir') P.distribuida(E);
    else break;
  }
  assert.ok(guard < 400, 'mão não terminou');
  if (E.fase === 'mao') assert.ok(false, 'ficou em mão: ' + E.m.pend);
}
const lv = (arr) => arr.map((n, i) => ({ nome: 'R' + i + 'n' + n, tipo: 'robo', nivel: n }));

t('robôs: partidas de 2 a 9 jogadores com níveis misturados terminam sem ação inválida', () => {
  for (let k = 0; k < 36; k++) {
    const n = 2 + (k % 8), niveis = [];
    for (let i = 0; i < n; i++) niveis.push(1 + ((i + k) % 5));
    const E = P.novo({ fis: false, jogadores: lv(niveis), fichas: 1000, mpn: 6, semente: 'rb' + k });
    let guard = 0;
    while (E.fase !== 'fim' && guard++ < 1500) {
      jogarMao(E);
      let soma = 0; E.jog.forEach((j) => { soma += j.fichas; });
      assert.strictEqual(soma, E.total, 'fichas');
      assert.ok(P.validar(E), 'validar');
    }
    assert.strictEqual(E.fase, 'fim', 'partida ' + k + ' não terminou (mãos ' + guard + ')');
  }
});

t('robôs: a visão não vaza as cartas dos outros', () => {
  const E = P.novo({ fis: false, jogadores: lv([3, 4, 5, 2]), fichas: 1000, mpn: 8, semente: 'vz' });
  for (let h = 0; h < 15 && E.fase !== 'fim'; h++) {
    jogarMao(E, (v, E2, i) => {
      const txt = JSON.stringify(v);
      E2.m.maos.forEach((mao, s) => { if (s === i || !mao) return; assert.ok(!('maos' in v)); });
      assert.ok(v.minhas.length === 2);
      assert.ok(!/"maos"|"bar"/.test(txt), 'campo secreto na visão');
    });
  }
});

t('robôs: mesma situação e mesma semente dá a mesma jogada', () => {
  const mk = () => { const E = P.novo({ fis: false, jogadores: lv([4, 5, 3]), fichas: 1000, mpn: 8, semente: 'det' }); P.novaMao(E); return E; };
  const a = mk(), b = mk();
  for (let i = 0; i < 30 && a.fase === 'mao' && a.m.pend === 'apostar'; i++) {
    const da = R.decidir(P.visao(a, a.m.vez)), db = R.decidir(P.visao(b, b.m.vez));
    assert.deepStrictEqual(da, db);
    P.aplicar(a, da); P.aplicar(b, db);
  }
});

t('robôs: nenhum travessão nos textos', () => {
  const fs = require('fs'); const txt = fs.readFileSync(__dirname + '/../robo.js', 'utf8');
  assert.ok(!/[–—]/.test(txt));
});

/* Torneio de força: 6 lugares, 1 de cada nível 1..5 + um repetido, rodando as cadeiras */
t('robôs: níveis mais altos ganham mais fichas no longo prazo', () => {
  const MAOS = +process.env.MAOS || 600, ganho = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, cont = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const base = [1, 2, 3, 4, 5];
  for (let rod = 0; rod < 5; rod++) {
    const niveis = base.slice(rod).concat(base.slice(0, rod));
    for (let rep = 0; rep < 6; rep++) {
      const E = P.novo({ fis: false, jogadores: lv(niveis), fichas: 2000, sb: 10, bb: 20, mpn: 0, semente: 'torneio' + rod + '_' + rep });
      const ini = E.jog.map((j) => j.fichas);
      for (let h = 0; h < MAOS / 6 && E.fase !== 'fim'; h++) {
        // repõe quem ficou sem fichas para manter 5 na mesa
        E.jog.forEach((j) => { if (!j.fora && j.fichas === 0) { /* digital: eliminado */ } });
        jogarMao(E);
      }
      E.jog.forEach((j, i) => { ganho[j.nivel] += j.fichas - ini[i]; cont[j.nivel]++; });
    }
  }
  const media = {}; for (const k in ganho) media[k] = Math.round(ganho[k] / cont[k]);
  console.log('     ganho médio por partida (2000 iniciais):', JSON.stringify(media));
});
console.log('\n' + ok + ' ok, ' + falhas + ' falhas');
process.exit(falhas ? 1 : 0);

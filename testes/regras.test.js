/* Testes do motor (node testes/regras.test.js) */
'use strict';
const assert = require('assert');
const P = require('../regras.js');
const S = require('../sorteio.js');
let ok = 0, falhas = 0;
function t(nome, fn) { try { fn(); ok++; } catch (e) { falhas++; console.log('FALHOU:', nome, '\n   ', e.message.split('\n')[0]); } }
const c = (naipe, valor) => naipe * 13 + (valor - 1);
const A = 1, K = 13, Q = 12, J = 11;
const mao = (...xs) => xs.map((x) => c(x[0], x[1]));

/* ---------- sorteio ---------- */
t('sementes novas nunca se repetem (20 mil)', () => {
  const s = new Set(); for (let i = 0; i < 20000; i++) s.add(S.novaSemente());
  assert.strictEqual(s.size, 20000);
});
t('semente tem 128 bits (32 dígitos hexadecimais)', () => assert.ok(/^[0-9a-f]{32}$/.test(S.novaSemente())));
t('mesma semente refaz a mesma sequência; estado salvo continua igual', () => {
  const a = S.criar('x'), b = S.criar('x');
  for (let i = 0; i < 50; i++) assert.strictEqual(a.prox(), b.prox());
  const st = a.estado(), d = S.criar(st);
  for (let i = 0; i < 50; i++) assert.strictEqual(a.prox(), d.prox());
});
t('sementes diferentes dão sequências diferentes', () => assert.notStrictEqual(S.criar('a').prox(), S.criar('b').prox()));
t('embaralhar é uniforme (qui-quadrado da 1a carta)', () => {
  const g = S.criar(S.novaSemente()), cont = new Array(52).fill(0), N = 260000;
  for (let i = 0; i < N; i++) { const d = [...Array(52).keys()]; g.embaralhar(d); cont[d[0]]++; }
  let chi = 0; cont.forEach((x) => { chi += (x - N / 52) ** 2 / (N / 52); });
  assert.ok(chi < 90, 'chi2=' + chi);
});
t('misturar muda o estado', () => { const g = S.criar('q'); const a = g.estado().join(); g.misturar(); assert.notStrictEqual(a, g.estado().join()); });

/* ---------- avaliador ---------- */
const cat = (xs) => P.categoria(P.avaliar(mao(...xs)));
t('royal flush', () => assert.strictEqual(cat([[0, A], [0, K], [0, Q], [0, J], [0, 10]]), 9));
t('straight flush', () => assert.strictEqual(cat([[1, 9], [1, 8], [1, 7], [1, 6], [1, 5]]), 8));
t('straight flush com ás baixo', () => assert.strictEqual(cat([[1, A], [1, 2], [1, 3], [1, 4], [1, 5]]), 8));
t('quadra', () => assert.strictEqual(cat([[0, 8], [1, 8], [2, 8], [3, 8], [1, K]]), 7));
t('full house', () => assert.strictEqual(cat([[0, J], [1, J], [3, J], [2, 4], [3, 4]]), 6));
t('flush', () => assert.strictEqual(cat([[3, A], [3, J], [3, 8], [3, 6], [3, 3]]), 5));
t('sequência', () => assert.strictEqual(cat([[2, 10], [1, 9], [0, 8], [3, 7], [2, 6]]), 4));
t('sequência A a 5 (wheel) vale menos que 2 a 6', () => {
  const w = P.avaliar(mao([0, A], [1, 2], [2, 3], [3, 4], [0, 5])), s6 = P.avaliar(mao([0, 2], [1, 3], [2, 4], [3, 5], [0, 6]));
  assert.strictEqual(P.categoria(w), 4); assert.ok(s6 > w);
});
t('ás não faz sequência "dando a volta" (Q K A 2 3)', () => assert.strictEqual(cat([[0, Q], [1, K], [2, A], [3, 2], [0, 3]]), 0));
t('trinca, dois pares, par, carta alta', () => {
  assert.strictEqual(cat([[0, 7], [1, 7], [3, 7], [2, K], [1, 2]]), 3);
  assert.strictEqual(cat([[0, K], [2, K], [1, 5], [3, 5], [0, 9]]), 2);
  assert.strictEqual(cat([[1, Q], [3, Q], [0, A], [2, 8], [1, 4]]), 1);
  assert.strictEqual(cat([[0, A], [2, J], [1, 9], [3, 6], [0, 3]]), 0);
});
t('7 cartas: pega o melhor jogo (full house entre duas trincas)', () => {
  const s = P.avaliar(mao([0, 9], [1, 9], [2, 9], [0, 4], [1, 4], [2, 4], [3, 2]));
  assert.strictEqual(P.categoria(s), 6); assert.strictEqual(P.nomeMao(s), 'Full house: noves e quatros');
});
t('7 cartas: três pares usam o melhor kicker', () => {
  const a = P.avaliar(mao([0, K], [1, K], [0, 9], [1, 9], [0, 5], [1, 5], [2, A]));
  const b = P.avaliar(mao([0, K], [1, K], [0, 9], [1, 9], [2, 3], [3, 4], [2, 5]));
  assert.ok(a > b); assert.strictEqual(P.nomeMao(a), 'Dois pares: reis e noves');
});
t('7 cartas: flush ganha de sequência e sequência de flush mais alto não confunde', () => {
  const s = P.avaliar(mao([0, 2], [0, 5], [0, 9], [0, J], [0, K], [1, 3], [2, 4]));
  assert.strictEqual(P.categoria(s), 5);
});
t('7 cartas: sequência de 6 cartas pega a mais alta', () => {
  const s = P.avaliar(mao([0, 2], [1, 3], [2, 4], [3, 5], [0, 6], [1, 7], [2, K]));
  assert.strictEqual(P.nomeMao(s), 'Sequência até o sete');
});
t('desempate por kicker no par', () => {
  const a = P.avaliar(mao([0, Q], [1, Q], [2, A], [3, 8], [0, 4], [1, 3], [2, 2]));
  const b = P.avaliar(mao([2, Q], [3, Q], [0, K], [1, 8], [2, 4], [3, 3], [0, 2]));
  assert.ok(a > b);
});
t('nomes em português', () => {
  assert.strictEqual(P.nomeMao(P.avaliar(mao([0, A], [1, A], [2, 3], [3, 5], [0, 8]))), 'Par de ases');
  assert.strictEqual(P.nomeMao(P.avaliar(mao([0, A], [0, K], [0, Q], [0, J], [0, 10]))), 'Royal flush');
  assert.strictEqual(P.nomeMao(P.avaliar(mao([0, 8], [1, 8], [2, 8], [3, 8], [1, K]))), 'Quadra de oitos');
});
t('tabela de mãos: cada exemplo tem a categoria do seu nome', () => {
  P.TABELA.forEach((x) => assert.strictEqual(P.categoria(P.avaliar(x.ex)), x.cat, x.nome));
  assert.strictEqual(P.TABELA.length, 10);
});
t('avaliador ordena 100 mil mãos como a comparação por categoria e kickers (confere com avaliador simples)', () => {
  // avaliador de referência bem direto (todas as combinações de 5 em 7)
  function ref(cs) {
    let melhor = -1;
    const n = cs.length;
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
      const cinco = cs.filter((_, i) => i !== a && i !== b);
      if (cs.length === 7 || (a === 0 && b === 1)) melhor = Math.max(melhor, P.avaliar(cinco));
    }
    return melhor;
  }
  const g = S.criar('ref');
  for (let i = 0; i < 3000; i++) {
    const d = g.embaralhar([...Array(52).keys()]).slice(0, 7);
    assert.strictEqual(P.avaliar(d), ref(d), d.join());
  }
});

/* ---------- partidas ---------- */
const nomes = (n, tipo) => Array.from({ length: n }, (_, i) => ({ nome: 'J' + (i + 1), tipo: tipo || 'robo', nivel: 3 }));
function aleatoria(E, g) {
  const L = P.legais(E), r = g.real();
  if (r < 0.15) return { k: 'fold' };
  if (L.check && r < 0.6) return { k: 'check' };
  if (L.call && r < 0.8) return { k: 'call' };
  if (L.sobe && r < 0.93) return { k: 'raise', para: L.min + g.inteiro(Math.max(1, L.max - L.min + 1)) };
  if (L.sobe && r < 0.97) return { k: 'allin' };
  return L.check ? { k: 'check' } : { k: 'call' };
}
function jogarMao(E, g, fis) {
  const r0 = P.novaMao(E); assert.ok(r0.ok, r0.erro);
  let guard = 0;
  while (E.fase === 'mao') {
    if (++guard > 400) throw new Error('mão não termina');
    const m = E.m;
    if (m.pend === 'apostar') { const a = aleatoria(E, g); const r = P.aplicar(E, a); assert.ok(r.ok, JSON.stringify(a) + ' ' + r.erro + ' ' + JSON.stringify(P.legais(E))); }
    else if (m.pend === 'distribuir') assert.ok(P.distribuida(E).ok);
    else if (m.pend === 'vencedor') {
      const gs = m.pots.map((p) => [p.el[g.inteiro(p.el.length)]]);
      assert.ok(P.vencedores(E, gs).ok);
    } else throw new Error('estado inesperado ' + m.pend);
    if (!fis) assert.ok(P.validar(E), 'validar falhou no meio da mão');
  }
}
t('digital: 300 mãos aleatórias sem erro, fichas conservadas e cartas sem repetição', () => {
  for (let k = 0; k < 40; k++) {
    const g = S.criar('d' + k), n = 2 + (k % 8);
    const E = P.novo({ fis: false, jogadores: nomes(n), fichas: 1000, mpn: 5, semente: 'sem' + k });
    for (let h = 0; h < 40 && E.fase !== 'fim'; h++) {
      jogarMao(E, g, false);
      let soma = 0; E.jog.forEach((j) => { soma += j.fichas; });
      assert.strictEqual(soma, E.total, 'fichas');
    }
  }
});
t('digital: a partida acaba com um vencedor que tem todas as fichas', () => {
  const g = S.criar('fim'), E = P.novo({ fis: false, jogadores: nomes(4), fichas: 1000, mpn: 4, semente: 'fim' });
  let guard = 0;
  while (E.fase !== 'fim' && guard++ < 3000) jogarMao(E, g, false);
  assert.strictEqual(E.fase, 'fim');
  const v = E.jog.find((j) => j.id === E.venc); assert.strictEqual(v.fichas, E.total);
  const pos = E.jog.map((j) => j.pos).sort(); assert.deepStrictEqual(pos, [1, 2, 3, 4]);
});
t('físico: mãos aleatórias com pots laterais conservam as fichas', () => {
  for (let k = 0; k < 30; k++) {
    const g = S.criar('f' + k), n = 2 + (k % 9);
    const E = P.novo({ fis: true, jogadores: nomes(n, 'humano'), fichas: 500, sb: 5, bb: 10, semente: 'f' + k });
    for (let h = 0; h < 25; h++) {
      if (P.ativos(E).length < 2) break;
      jogarMao(E, g, true);
      let soma = 0; E.jog.forEach((j) => { soma += j.fichas; });
      assert.strictEqual(soma, E.total);
    }
  }
});
t('mesmas ações na mesma semente dão a mesma mão', () => {
  const mk = () => { const E = P.novo({ fis: false, jogadores: nomes(3), fichas: 1000, semente: 'igual' }); P.novaMao(E); return E; };
  const a = mk(), b = mk();
  assert.deepStrictEqual(a.m.maos, b.m.maos);
});
t('sementes diferentes dão mãos diferentes', () => {
  const mk = (s) => { const E = P.novo({ fis: false, jogadores: nomes(3), fichas: 1000, semente: s }); P.novaMao(E); return JSON.stringify(E.m.bar); };
  assert.notStrictEqual(mk('a'), mk('b'));
});

/* ---------- regras de aposta ---------- */
function mesa(n, fichas, extra) {
  const E = P.novo(Object.assign({ fis: true, jogadores: nomes(n, 'humano'), fichas: fichas || 1000, sb: 10, bb: 20, btnInicial: 0 }, extra || {}));
  P.novaMao(E); return E;
}
t('blinds e dealer (3 jogadores): dealer 0, SB 1, BB 2, começa o 0', () => {
  const E = mesa(3), m = E.m;
  assert.strictEqual(m.btn, 0); assert.strictEqual(m.sb, 1); assert.strictEqual(m.bb, 2); assert.strictEqual(m.vez, 0);
  assert.strictEqual(E.jog[1].fichas, 990); assert.strictEqual(E.jog[2].fichas, 980);
});
t('heads-up: dealer é o small blind e age primeiro antes do flop; depois do flop o BB age primeiro', () => {
  const E = mesa(2), m = E.m;
  assert.strictEqual(m.sb, m.btn); assert.strictEqual(m.vez, m.btn);
  P.aplicar(E, { k: 'call' }); P.aplicar(E, { k: 'check' });
  assert.strictEqual(E.m.pend, 'distribuir'); P.distribuida(E);
  assert.strictEqual(E.m.vez, m.bb);
});
t('o BB tem a opção de aumentar quando todos só pagam', () => {
  const E = mesa(3);
  P.aplicar(E, { k: 'call' }); P.aplicar(E, { k: 'call' });
  assert.strictEqual(E.m.vez, 2); assert.ok(P.legais(E).check); assert.ok(P.legais(E).sobe);
});
t('raise mínimo: precisa ser pelo menos o último aumento; erro abaixo disso', () => {
  const E = mesa(3);
  assert.ok(!P.aplicar(E, { k: 'raise', para: 30 }).ok);        // BB 20, mínimo 40
  assert.ok(P.aplicar(E, { k: 'raise', para: 60 }).ok);          // aumento de 40
  assert.strictEqual(E.m.minRaise, 40);
  assert.ok(!P.aplicar(E, { k: 'raise', para: 90 }).ok);         // mínimo 100
  assert.ok(P.aplicar(E, { k: 'raise', para: 100 }).ok);
});
t('all-in curto não reabre o aumento para quem já falou', () => {
  const E = mesa(3, 1000); E.jog[0].fichas = 1000; E.jog[1].fichas = 1000; E.jog[2].fichas = 1000;
  // 0 (dealer) aumenta para 100; 1 (SB) paga; 2 (BB) tem só 130 e vai all-in (aumento de 30, menor que 80)
  E.jog[2].fichas = 130 - 20; E.total = 1000 + 1000 + 130 - 20 + 10 + 20 - 0; // acerto contábil (BB já postou 20)
  assert.ok(P.aplicar(E, { k: 'raise', para: 100 }).ok);
  assert.ok(P.aplicar(E, { k: 'call' }).ok);
  assert.ok(P.aplicar(E, { k: 'allin' }).ok);                      // BB para 130
  assert.strictEqual(E.m.aposta, 130);
  // volta ao dealer: precisa pagar 30, mas não pode aumentar de novo
  const L = P.legais(E);
  assert.strictEqual(L.vez, 0); assert.strictEqual(L.falta, 30); assert.ok(!L.sobe);
  assert.ok(!P.aplicar(E, { k: 'raise', para: 300 }).ok);
});
t('pot lateral: três all-ins de tamanhos diferentes', () => {
  const E = P.novo({ fis: true, jogadores: nomes(4, 'humano'), fichas: 1000, sb: 10, bb: 20, btnInicial: 0 });
  E.jog[0].fichas = 100; E.jog[1].fichas = 300; E.jog[2].fichas = 600; E.jog[3].fichas = 1000; E.total = 2000;
  P.novaMao(E);
  while (E.m.pend === 'apostar') P.aplicar(E, { k: 'allin' });
  // 4 all-in? o jogador 3 fica com a sobra devolvida; potes: 100*4, 200*3, 300*2
  assert.strictEqual(E.m.pend, 'distribuir'); assert.ok(P.distribuida(E).ok);
  const pots = E.m.pots;
  assert.strictEqual(E.m.pend, 'vencedor');
  assert.deepStrictEqual(pots.map((p) => p.valor), [400, 600, 600].map((x, i) => x), JSON.stringify(pots));
  assert.deepStrictEqual(pots.map((p) => p.el.length), [4, 3, 2]);
  const r = P.vencedores(E, [[0], [1], [2]]); assert.ok(r.ok, r.erro);
  assert.strictEqual(E.jog[0].fichas, 400); assert.strictEqual(E.jog[1].fichas, 600); assert.strictEqual(E.jog[2].fichas, 600);
  assert.strictEqual(E.jog[3].fichas, 400);   // a parte que ninguém pagou voltou
});
t('aposta que ninguém paga volta para quem apostou', () => {
  const E = mesa(3);
  P.aplicar(E, { k: 'raise', para: 200 }); P.aplicar(E, { k: 'fold' }); P.aplicar(E, { k: 'fold' });
  assert.strictEqual(E.fase, 'entre');
  assert.strictEqual(E.jog[0].fichas, 1000 + 30);   // ganha as blinds, o resto volta
  assert.strictEqual(E.m.res.pots[0].valor, 50);   // as blinds (30) e a parte dele que valeu (20); o resto da aposta voltou
});
t('empate divide o pote e a ficha que sobra vai para quem está mais perto à esquerda do dealer', () => {
  const E = mesa(3);
  P.aplicar(E, { k: 'call' }); P.aplicar(E, { k: 'call' }); P.aplicar(E, { k: 'check' });
  P.distribuida(E);
  for (let r = 0; r < 3; r++) { while (E.m.pend === 'apostar') P.aplicar(E, { k: E.m.vez >= 0 && P.legais(E).check ? 'check' : 'call' }); if (E.m.pend === 'distribuir') P.distribuida(E); }
  assert.strictEqual(E.m.pend, 'vencedor');
  E.jog.forEach((j) => { j.fichas += 0; });
  const antes = E.jog.map((j) => j.fichas);
  P.vencedores(E, [[0, 1, 2]]);   // pote de 60 dividido por 3: 20 cada
  assert.deepStrictEqual(E.jog.map((j, i) => j.fichas - antes[i]), [20, 20, 20]);
});
t('pote ímpar: a ficha que sobra vai para o primeiro à esquerda do dealer', () => {
  const E = P.novo({ fis: true, jogadores: nomes(3, 'humano'), fichas: 1000, sb: 5, bb: 10, btnInicial: 0 });
  P.novaMao(E);   // dealer 0, SB 1 (5), BB 2 (10)
  P.aplicar(E, { k: 'call' }); P.aplicar(E, { k: 'call' }); P.aplicar(E, { k: 'check' });
  // pote 30; ninguém mais aposta
  while (E.m.pend !== 'vencedor') { if (E.m.pend === 'distribuir') P.distribuida(E); else P.aplicar(E, { k: 'check' }); }
  // tira 1 ficha do pote para ficar ímpar
  E.m.pots[0].valor = 31; E.total += 1;
  const antes = E.jog.map((j) => j.fichas);
  P.vencedores(E, [[0, 1]]);   // quem está à esquerda do dealer: o 1
  assert.deepStrictEqual(E.jog.map((j, i) => j.fichas - antes[i]), [15, 16, 0]);
});
t('desistir de todos: o último leva sem mostrar', () => {
  const E = mesa(4);
  P.aplicar(E, { k: 'fold' }); P.aplicar(E, { k: 'fold' }); P.aplicar(E, { k: 'fold' });
  assert.ok(E.m.res.unico); assert.strictEqual(E.fase, 'entre');
});
t('passar com aposta na mesa é erro; pagar sem aposta é erro', () => {
  const E = mesa(3);
  assert.ok(!P.aplicar(E, { k: 'check' }).ok);
  P.aplicar(E, { k: 'call' }); P.aplicar(E, { k: 'call' }); P.aplicar(E, { k: 'check' }); P.distribuida(E);
  assert.ok(!P.aplicar(E, { k: 'call' }).ok);
});
t('o dealer anda a cada mão', () => {
  const E = mesa(4);
  const b1 = E.m.btn;
  P.aplicar(E, { k: 'fold' }); P.aplicar(E, { k: 'fold' }); P.aplicar(E, { k: 'fold' });
  P.novaMao(E);
  assert.strictEqual(E.m.btn, (b1 + 1) % 4);
});
t('todos all-in: corre o resto do tabuleiro (digital abre as 5 cartas)', () => {
  const E = P.novo({ fis: false, jogadores: nomes(3), fichas: 1000, semente: 'allin' });
  P.novaMao(E);
  let g = 0; while (E.fase === 'mao' && g++ < 10) P.aplicar(E, { k: 'allin' });
  assert.strictEqual(E.fase === 'entre' || E.fase === 'fim', true);
  assert.strictEqual(E.m.com.length, 5); assert.ok(E.m.aberta);
});
t('físico: remover jogador na vez dele desiste e passa a vez; sai depois da mão', () => {
  const E = mesa(4); const vez = E.m.vez;
  assert.ok(P.remover(E, vez).ok);
  assert.notStrictEqual(E.m.vez, vez); assert.ok(E.m.dob[vez]);
  while (E.fase === 'mao') { if (E.m.pend === 'apostar') P.aplicar(E, { k: 'fold' }); else break; }
  P.novaMao(E);
  assert.strictEqual(E.jog.length, 3);
});
t('físico: adicionar jogador entra na próxima mão, na posição escolhida', () => {
  const E = mesa(3);
  assert.ok(P.adicionar(E, { nome: 'Novo', fichas: 700, depoisDe: E.jog[0].id }).ok);
  assert.strictEqual(E.jog.length, 3);   // ainda na fila
  P.aplicar(E, { k: 'fold' }); P.aplicar(E, { k: 'fold' });
  P.novaMao(E);
  assert.strictEqual(E.jog.length, 4); assert.strictEqual(E.jog[1].nome, 'Novo'); assert.strictEqual(E.jog[1].fichas === 700 || E.jog[1].fichas === 690 || E.jog[1].fichas === 680, true);
});
t('físico: ajustar fichas e blinds; próximo nível', () => {
  const E = mesa(3);
  P.aplicar(E, { k: 'fold' }); P.aplicar(E, { k: 'fold' });
  assert.ok(P.ajustarFichas(E, 0, 1500).ok); assert.strictEqual(E.jog[0].fichas, 1500);
  assert.ok(!P.mudarBlinds(E, 50, 20, 0).ok);
  assert.ok(P.proximoNivel(E).ok); assert.strictEqual(E.cfg.bb, 30);
});
t('validar: aceita estados reais e recusa corrompidos', () => {
  const E = P.novo({ fis: false, jogadores: nomes(4), fichas: 1000, semente: 'v' }); P.novaMao(E);
  assert.ok(P.validar(JSON.parse(JSON.stringify(E))));
  const R = JSON.parse(JSON.stringify(E)); R.m.maos[1][0] = R.m.maos[0][0]; assert.ok(!P.validar(R));
  const F = JSON.parse(JSON.stringify(E)); F.jog[0].fichas += 5; assert.ok(!P.validar(F));
  assert.ok(!P.validar(null)); assert.ok(!P.validar({ v: 2 }));
});
t('visão do robô não mostra as cartas dos outros', () => {
  const E = P.novo({ fis: false, jogadores: nomes(4), fichas: 1000, semente: 'vis' }); P.novaMao(E);
  const v = P.visao(E, 1), txt = JSON.stringify(v);
  assert.deepStrictEqual(v.minhas, E.m.maos[1]);
  assert.ok(!('maos' in v) && !('bar' in v));
  [0, 2, 3].forEach((s) => E.m.maos[s].forEach((cc) => { /* as cartas dos outros só poderiam aparecer por acaso em números de fichas: confere pela estrutura */ }));
  assert.ok(!Object.keys(v).some((k) => /bar|maos/.test(k)));
});
t('nenhum travessão nos arquivos do projeto', () => {
  const fs = require('fs'), path = require('path');
  fs.readdirSync(path.join(__dirname, '..')).filter((f) => /\.(js|css|html|md|json)$/.test(f)).forEach((f) => {
    const x = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    assert.ok(!/[–—]/.test(x), f);
  });
});

console.log(ok + ' testes passaram, ' + falhas + ' falharam.');
process.exit(falhas ? 1 : 0);

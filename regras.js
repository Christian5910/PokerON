/* ==========================================================================
   PokerON! - regras.js (motor do Texas Hold'em sem limite, sem DOM)
   Roda no navegador e no Node (module.exports). Os dois modos usam o mesmo motor de apostas:
     - digital (fis = false): o motor embaralha, dá as cartas, abre o flop, o turn e o river e decide
       quem ganha cada pote;
     - mesa com cartas reais (fis = true): o motor cuida de blinds, dealer, vez, apostas, pots
       laterais e fichas, e quem joga diz quem ganhou cada pote (as cartas estão na mesa de verdade).

   Carta: número de 0 a 51 = naipe * 13 + (valor - 1) (a mesma de cartas.js).
   Naipes: 0 espadas, 1 copas, 2 paus, 3 ouros. Valor: 1 (ás) a 13 (rei). O ás vale 14 (ou 1 na sequência A-2-3-4-5).
   Toda a sorte vem de Sorteio (sorteio.js): semente de 128 bits e gerador com estado salvo na partida.
   ========================================================================== */
(function (raiz, fabrica) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrica(raiz, require('./sorteio.js'));
  else raiz.Poker = fabrica(raiz, raiz.Sorteio);
})(typeof window !== 'undefined' ? window : globalThis, function (raiz, Sorteio) {
  'use strict';

  var MAX_DIG = 9, MAX_FIS = 10;
  /* estrutura de blinds [pequena, grande], do começo da partida em diante */
  var NIVEIS = [[10, 20], [15, 30], [20, 40], [30, 60], [40, 80], [50, 100], [75, 150], [100, 200], [150, 300], [200, 400],
    [300, 600], [400, 800], [500, 1000], [750, 1500], [1000, 2000], [1500, 3000], [2000, 4000], [3000, 6000], [4000, 8000], [5000, 10000]];

  /* ----------------------------------------------------------------------
     Cartas e mãos
     ---------------------------------------------------------------------- */
  var naipe = function (b) { return (b / 13) | 0; };
  var valor = function (b) { return (b % 13) + 1; };
  var rangoDe = function (b) { var v = (b % 13) + 1; return v === 1 ? 14 : v; };

  var P4 = 15 * 15 * 15 * 15, P5 = P4 * 15;
  var CNT = new Int8Array(15), SM = new Int32Array(4);
  var CATS = ['Carta alta', 'Par', 'Dois pares', 'Trinca', 'Sequência', 'Flush', 'Full house', 'Quadra', 'Straight flush', 'Royal flush'];
  var SG = ['dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'valete', 'dama', 'rei', 'ás'];
  var PL = ['dois', 'três', 'quatros', 'cincos', 'seis', 'setes', 'oitos', 'noves', 'dez', 'valetes', 'damas', 'reis', 'ases'];

  function enc(cat, a, b, c, d, e) {
    return cat * P5 + (a || 0) * P4 + (b || 0) * 3375 + (c || 0) * 225 + (d || 0) * 15 + (e || 0);
  }
  /* maior carta de uma sequência de 5 dentro da máscara de valores (bits 2 a 14), ou 0 */
  function reta(mask) {
    var m = mask | (((mask >> 14) & 1) << 1);
    for (var h = 14; h >= 5; h--) if (((m >> (h - 4)) & 31) === 31) return h;
    return 0;
  }

  /* avalia de 5 a 7 cartas; maior pontuação ganha */
  function avaliar(cs) {
    var i, b, s, r, n = cs.length;
    for (i = 0; i < 15; i++) CNT[i] = 0;
    SM[0] = SM[1] = SM[2] = SM[3] = 0;
    for (i = 0; i < n; i++) { b = cs[i]; s = (b / 13) | 0; r = b % 13 + 1; if (r === 1) r = 14; CNT[r]++; SM[s] |= 1 << r; }
    var fm = 0, rm = 0, h;
    for (s = 0; s < 4; s++) {
      var m = SM[s], k = 0;
      for (r = 2; r <= 14; r++) if ((m >> r) & 1) k++;
      if (k >= 5) fm = m;
    }
    if (fm) {
      h = reta(fm);
      if (h) return h === 14 ? enc(9, 14) : enc(8, h);
    }
    var quad = 0, trips = [], pares = [], resto = [];
    for (r = 14; r >= 2; r--) {
      var c = CNT[r];
      if (c) rm |= 1 << r;
      if (c === 4) quad = r; else if (c === 3) trips.push(r); else if (c === 2) pares.push(r); else if (c === 1) resto.push(r);
    }
    var k1;
    if (quad) {
      k1 = 0;
      for (r = 14; r >= 2; r--) if (r !== quad && CNT[r]) { k1 = r; break; }
      return enc(7, quad, k1);
    }
    if (trips.length && (pares.length || trips.length > 1)) {
      var pp = pares.length ? pares[0] : 0;
      if (trips.length > 1 && trips[1] > pp) pp = trips[1];
      return enc(6, trips[0], pp);
    }
    if (fm) {
      var top = [];
      for (r = 14; r >= 2 && top.length < 5; r--) if ((fm >> r) & 1) top.push(r);
      return enc(5, top[0], top[1], top[2], top[3], top[4]);
    }
    h = reta(rm);
    if (h) return enc(4, h);
    if (trips.length) {
      var ks = [];
      for (r = 14; r >= 2 && ks.length < 2; r--) if (r !== trips[0] && CNT[r]) ks.push(r);
      return enc(3, trips[0], ks[0], ks[1]);
    }
    if (pares.length >= 2) {
      var kk = 0;
      for (r = 14; r >= 2; r--) if (r !== pares[0] && r !== pares[1] && CNT[r]) { kk = r; break; }
      return enc(2, pares[0], pares[1], kk);
    }
    if (pares.length === 1) {
      var ks2 = [];
      for (r = 14; r >= 2 && ks2.length < 3; r--) if (r !== pares[0] && CNT[r]) ks2.push(r);
      return enc(1, pares[0], ks2[0], ks2[1], ks2[2]);
    }
    var alt = [];
    for (r = 14; r >= 2 && alt.length < 5; r--) if (CNT[r]) alt.push(r);
    return enc(0, alt[0], alt[1], alt[2], alt[3], alt[4]);
  }

  var categoria = function (sc) { return Math.floor(sc / P5); };
  function digitos(sc) {
    var d = [], x = sc % P5;
    d.push(Math.floor(x / P4)); x %= P4;
    d.push(Math.floor(x / 3375)); x %= 3375;
    d.push(Math.floor(x / 225)); x %= 225;
    d.push(Math.floor(x / 15)); d.push(x % 15);
    return d;
  }
  var sg = function (r) { return SG[r - 2]; };
  var pl = function (r) { return PL[r - 2]; };
  var art = function (r) { return (r === 14 ? 'o ' : r === 12 || r === 11 ? 'a ' : 'o ') + sg(r); };
  /* nome da mão em português: "Par de damas", "Full house, reis e noves" */
  function nomeMao(sc) {
    var c = categoria(sc), d = digitos(sc);
    switch (c) {
      case 0: return 'Carta alta: ' + sg(d[0]);
      case 1: return 'Par de ' + pl(d[0]);
      case 2: return 'Dois pares: ' + pl(d[0]) + ' e ' + pl(d[1]);
      case 3: return 'Trinca de ' + pl(d[0]);
      case 4: return 'Sequência até ' + (d[0] === 14 ? 'o ás' : art(d[0]));
      case 5: return 'Flush, ' + sg(d[0]) + ' alto';
      case 6: return 'Full house: ' + pl(d[0]) + ' e ' + pl(d[1]);
      case 7: return 'Quadra de ' + pl(d[0]);
      case 8: return 'Straight flush até ' + art(d[0]);
      default: return 'Royal flush';
    }
  }

  /* tabela de mãos, da mais forte para a mais fraca (exemplos de 5 cartas; "chance" é a de ter essa mão como a melhor
     de 7 cartas, contada por todas as 133.784.560 combinações; preenchida abaixo) */
  var C = function (n, v) { return n * 13 + (v - 1); };   // naipe, valor (1 ás ... 13 rei)
  var TABELA = [
    { cat: 9, nome: 'Royal flush', desc: 'A, K, Q, J e 10 do mesmo naipe.', ex: [C(0, 1), C(0, 13), C(0, 12), C(0, 11), C(0, 10)] },
    { cat: 8, nome: 'Straight flush', desc: 'Cinco cartas em sequência, todas do mesmo naipe.', ex: [C(1, 9), C(1, 8), C(1, 7), C(1, 6), C(1, 5)] },
    { cat: 7, nome: 'Quadra', desc: 'Quatro cartas do mesmo valor.', ex: [C(0, 8), C(1, 8), C(2, 8), C(3, 8), C(1, 13)] },
    { cat: 6, nome: 'Full house', desc: 'Uma trinca e um par.', ex: [C(0, 11), C(1, 11), C(3, 11), C(2, 4), C(3, 4)] },
    { cat: 5, nome: 'Flush', desc: 'Cinco cartas do mesmo naipe, fora de sequência.', ex: [C(3, 1), C(3, 11), C(3, 8), C(3, 6), C(3, 3)] },
    { cat: 4, nome: 'Sequência', desc: 'Cinco cartas em sequência, de naipes variados. O ás vale no alto (10 a A) ou no baixo (A a 5).', ex: [C(2, 10), C(1, 9), C(0, 8), C(3, 7), C(2, 6)] },
    { cat: 3, nome: 'Trinca', desc: 'Três cartas do mesmo valor.', ex: [C(0, 7), C(1, 7), C(3, 7), C(2, 13), C(1, 2)] },
    { cat: 2, nome: 'Dois pares', desc: 'Dois pares de valores diferentes.', ex: [C(0, 13), C(2, 13), C(1, 5), C(3, 5), C(0, 9)] },
    { cat: 1, nome: 'Par', desc: 'Duas cartas do mesmo valor.', ex: [C(1, 12), C(3, 12), C(0, 1), C(2, 8), C(1, 4)] },
    { cat: 0, nome: 'Carta alta', desc: 'Nenhuma das mãos acima: vale a carta mais alta.', ex: [C(0, 1), C(2, 11), C(1, 9), C(3, 6), C(0, 3)] }
  ];

  /* quantas das 133.784.560 combinações de 7 cartas têm cada mão como a melhor (contagem completa, testes/enumerar7.js) */
  var CONT7 = [23294460, 58627800, 31433400, 6461620, 6180020, 4047644, 3473184, 224848, 37260, 4324];
  var TOTAL7 = 133784560;
  function pct7(p) { return (p >= 1 ? p.toFixed(2) : p >= 0.1 ? p.toFixed(3) : p.toFixed(4)).replace('.', ',') + '%'; }
  TABELA.forEach(function (h) { h.cont = CONT7[h.cat]; h.pct = h.cont * 100 / TOTAL7; h.chance = pct7(h.pct); });

  /* ----------------------------------------------------------------------
     Criação e salvamento
     ---------------------------------------------------------------------- */
  function nomeAleatorioPadrao(i) { return 'Jogador ' + (i + 1); }

  /* cfg: { fis, jogadores: [{ nome, tipo: 'humano' | 'robo', nivel }], fichas, sb, bb, ante, mpn, semente } */
  function novo(cfg) {
    var sem = cfg.semente || Sorteio.novaSemente();
    var g = Sorteio.criar(sem);
    var fis = !!cfg.fis;
    var lim = fis ? MAX_FIS : MAX_DIG;
    var lista = (cfg.jogadores || []).slice(0, lim);
    if (lista.length < 2) throw new Error('Poker: são necessários pelo menos 2 jogadores');
    var fichas = Math.max(1, Math.floor(cfg.fichas || 2000));
    var E = {
      v: 1, fis: fis, sem: sem, rng: g.estado(),
      cfg: { sb: Math.max(1, Math.floor(cfg.sb || 10)), bb: Math.max(2, Math.floor(cfg.bb || 20)), ante: Math.max(0, Math.floor(cfg.ante || 0)), mpn: fis ? 0 : Math.max(0, Math.floor(cfg.mpn || 0)), nivel: 0, ini: fichas },
      jog: [], proxId: 0, total: 0, btn: -1, nmao: 0, m: null, fase: 'entre', venc: -1, elim: [], est: {}
    };
    if (!fis) { E.cfg.sb = NIVEIS[0][0]; E.cfg.bb = NIVEIS[0][1]; }
    lista.forEach(function (j, i) {
      var id = E.proxId++;
      E.jog.push({ id: id, nome: String(j.nome || nomeAleatorioPadrao(i)), tipo: j.tipo === 'robo' ? 'robo' : 'humano', nivel: j.nivel | 0, fichas: fichas, fora: false, pos: 0 });
      E.est[id] = { m: 0, vol: 0, ag: 0, ch: 0 };
      E.total += fichas;
    });
    if (cfg.btnInicial !== undefined && cfg.btnInicial >= 0 && cfg.btnInicial < E.jog.length) {
      E.btn = prevAtivo(E, cfg.btnInicial);
    } else {
      var k = g.inteiro(E.jog.length);
      E.btn = E.jog[(k + E.jog.length - 1) % E.jog.length].id;   // o dealer da primeira mão é o seguinte
    }
    E.rng = g.estado();
    return E;
  }
  function prevAtivo(E, i) { return E.jog[(i + E.jog.length - 1) % E.jog.length].id; }

  var idx = function (E, id) { for (var i = 0; i < E.jog.length; i++) if (E.jog[i].id === id) return i; return -1; };

  /* ----------------------------------------------------------------------
     Auxiliares da mão
     ---------------------------------------------------------------------- */
  function vivos(m) { var r = []; for (var i = 0; i < m.dob.length; i++) if (m.dentro[i] && !m.dob[i]) r.push(i); return r; }
  function podem(m) { var r = []; for (var i = 0; i < m.dob.length; i++) if (m.dentro[i] && !m.dob[i] && !m.tudo[i]) r.push(i); return r; }
  function prox(m, de, cond) {
    var n = m.dob.length;
    for (var k = 1; k <= n; k++) { var i = (de + k) % n; if (cond(i)) return i; }
    return -1;
  }
  /* precisa agir: está na mão, tem fichas e ainda não igualou ou ainda não falou na rua (havendo contra quem apostar) */
  function precisaAgir(m, i) {
    if (!m.dentro[i] || m.dob[i] || m.tudo[i]) return false;
    if (m.ap[i] < m.aposta) return true;
    if (m.vista[i] >= 0) return false;
    var outros = 0;
    for (var j = 0; j < m.dob.length; j++) if (j !== i && m.dentro[j] && !m.dob[j] && !m.tudo[j]) outros++;
    return outros > 0;
  }
  var proxAgir = function (m, de) { return prox(m, de, function (i) { return precisaAgir(m, i); }); };

  function poteTotal(m) { var s = 0; for (var i = 0; i < m.tot.length; i++) s += m.tot[i]; return s; }

  function log(E, s, k, v) { var m = E.m; m.log.push({ s: s, k: k, v: v || 0, r: m.rua }); if (m.log.length > 400) m.log.splice(0, m.log.length - 400); }

  /* ----------------------------------------------------------------------
     Nova mão
     ---------------------------------------------------------------------- */
  function nivelDaMao(E) {
    if (E.fis || !E.cfg.mpn) return;
    var n = Math.min(NIVEIS.length - 1, Math.floor(E.nmao / E.cfg.mpn));
    E.cfg.nivel = n; E.cfg.sb = NIVEIS[n][0]; E.cfg.bb = NIVEIS[n][1];
  }

  /* arruma a mesa entre as mãos: tira quem saiu e põe quem chegou */
  function arrumarMesa(E) {
    if (E.fila && E.fila.length) {
      E.fila.forEach(function (n) {
        var pos = n.depoisDe !== undefined ? idx(E, n.depoisDe) : -1;
        var id = E.proxId++;
        var j = { id: id, nome: n.nome, tipo: n.tipo === 'robo' ? 'robo' : 'humano', nivel: n.nivel | 0, fichas: n.fichas, fora: false, pos: 0 };
        if (pos < 0) E.jog.push(j); else E.jog.splice(pos + 1, 0, j);
        E.est[id] = { m: 0, vol: 0, ag: 0, ch: 0 };
        E.total += n.fichas;
      });
      E.fila = [];
    }
    if (E.fis) {
      // quem saiu da mesa some (a posição do dealer é por identidade, então não se perde)
      var btnId = E.btn;
      var manter = E.jog.filter(function (j) { return !j.fora; });
      if (manter.length !== E.jog.length) {
        if (idx(E, btnId) >= 0 && E.jog[idx(E, btnId)].fora) {
          // o dealer saiu: o botão volta para quem estava antes dele
          var i = idx(E, btnId), t = i;
          do { t = (t + E.jog.length - 1) % E.jog.length; } while (E.jog[t].fora && t !== i);
          E.btn = E.jog[t].fora ? -1 : E.jog[t].id;
        }
        E.jog = manter;
        if (!E.jog.length) E.btn = -1;
      }
    }
  }

  function ativos(E) { var r = []; for (var i = 0; i < E.jog.length; i++) if (!E.jog[i].fora && E.jog[i].fichas > 0) r.push(i); return r; }

  function novaMao(E) {
    if (E.fase !== 'entre') return { ok: false, erro: 'A mão anterior ainda não terminou.' };
    arrumarMesa(E);
    var at = ativos(E);
    if (at.length < 2) {
      if (!E.fis) { E.fase = 'fim'; E.venc = at.length ? E.jog[at[0]].id : -1; }
      return { ok: false, erro: 'São necessários pelo menos 2 jogadores com fichas.' };
    }
    nivelDaMao(E);
    var n = E.jog.length, g = Sorteio.criar(E.rng);
    var bi = idx(E, E.btn);
    var btn = -1;
    for (var k = 1; k <= n; k++) { var i = (bi + k + n) % n; if (bi < 0) i = (k - 1) % n; if (!E.jog[i].fora && E.jog[i].fichas > 0) { btn = i; break; } }
    var m = {
      n: ++E.nmao, btn: btn, sb: -1, bb: -1, rua: 0,
      dentro: [], ap: [], tot: [], dob: [], tudo: [], vista: [], vol: [], ini: [],
      aposta: 0, minRaise: E.cfg.bb, vez: -1, pend: 'apostar', log: [], com: [], maos: [], bar: [], bi: 0, aberta: false, res: null, pots: null
    };
    for (var s = 0; s < n; s++) {
      var dentro = !E.jog[s].fora && E.jog[s].fichas > 0;
      m.dentro.push(dentro); m.ap.push(0); m.tot.push(0); m.dob.push(!dentro); m.tudo.push(false); m.vista.push(-1); m.vol.push(false);
      m.ini.push(E.jog[s].fichas); m.maos.push(null);
      if (dentro) E.est[E.jog[s].id].m++;
    }
    E.m = m;
    E.btn = E.jog[btn].id;
    // blinds
    var dentroLista = ativos(E);
    if (dentroLista.length === 2) { m.sb = btn; m.bb = dentroLista[0] === btn ? dentroLista[1] : dentroLista[0]; }
    else {
      m.sb = prox(m, btn, function (i) { return m.dentro[i]; });
      m.bb = prox(m, m.sb, function (i) { return m.dentro[i]; });
    }
    function paga(i, q, tipo) {
      var j = E.jog[i], v = Math.min(q, j.fichas);
      j.fichas -= v; m.tot[i] += v; if (tipo !== 'ante') m.ap[i] += v;
      if (j.fichas === 0) m.tudo[i] = true;
      return v;
    }
    if (E.cfg.ante > 0) for (var a = 0; a < n; a++) if (m.dentro[a]) { var va = paga(a, E.cfg.ante, 'ante'); log(E, a, 'ante', va); }
    var vsb = paga(m.sb, E.cfg.sb, 'sb'); log(E, m.sb, 'sb', vsb);
    var vbb = paga(m.bb, E.cfg.bb, 'bb'); log(E, m.bb, 'bb', vbb);
    m.aposta = Math.max(m.ap[m.sb], m.ap[m.bb], Math.min(E.cfg.bb, Math.max(m.ap[m.bb], 0)));
    m.aposta = E.cfg.bb;
    if (m.ap[m.sb] > m.aposta) m.aposta = m.ap[m.sb];
    // baralho e cartas (só no digital)
    if (!E.fis) {
      m.bar = g.embaralhar(Array.apply(null, Array(52)).map(function (_, q) { return q; }));
      var c = 0;
      for (var q = 0; q < 2; q++) for (var t = 1; t <= n; t++) { var si = (btn + t) % n; if (m.dentro[si]) { if (!m.maos[si]) m.maos[si] = []; m.maos[si].push(m.bar[c++]); } }
      m.bi = c;
    }
    E.rng = g.estado();
    E.fase = 'mao';
    var primeiro = proxAgir(m, m.bb);
    if (primeiro < 0) { m.vez = -1; fimDaRua(E); }
    else m.vez = primeiro;
    return { ok: true };
  }

  /* acrescenta entropia nova ao gerador (o app chama a cada mão) */
  function reforcar(E) { var g = Sorteio.criar(E.rng); g.misturar(); E.rng = g.estado(); }

  /* ----------------------------------------------------------------------
     Ações
     ---------------------------------------------------------------------- */
  function podeSubirAgora(m, i) {
    if (m.vista[i] >= 0 && m.aposta - m.vista[i] < m.minRaise) return false;
    for (var j = 0; j < m.dob.length; j++) if (j !== i && m.dentro[j] && !m.dob[j] && !m.tudo[j]) return true;
    return false;
  }

  /* o que quem está na vez pode fazer */
  function legais(E) {
    var m = E.m;
    if (!m || m.pend !== 'apostar' || m.vez < 0) return null;
    var i = m.vez, j = E.jog[i];
    var aPagar = Math.min(m.aposta - m.ap[i], j.fichas);
    var max = m.ap[i] + j.fichas;
    var sobe = j.fichas > m.aposta - m.ap[i] && podeSubirAgora(m, i);
    return {
      vez: i, aPagar: aPagar, falta: m.aposta - m.ap[i], check: m.ap[i] >= m.aposta, call: m.ap[i] < m.aposta,
      sobe: sobe, min: Math.min(m.aposta + m.minRaise, max), max: max, aposta: m.aposta, minRaise: m.minRaise,
      tudoNoCall: m.ap[i] < m.aposta && j.fichas <= m.aposta - m.ap[i], pote: poteTotal(m)
    };
  }

  /* acao: { k: 'fold' | 'check' | 'call' | 'raise' (com para) | 'allin' } */
  function aplicar(E, a) {
    var m = E.m, L = legais(E);
    if (!L) return { ok: false, erro: 'Não é hora de apostar.' };
    var i = L.vez, j = E.jog[i], est = E.est[j.id];
    var k = a.k;
    if (k === 'allin') {
      if (!L.sobe && !L.tudoNoCall && j.fichas > L.falta) return { ok: false, erro: 'Aqui só dá para pagar ou desistir.' };
      k = j.fichas <= L.falta ? 'call' : 'raise'; a = { k: k, para: L.max };
    }
    if (k === 'fold') {
      m.dob[i] = true; log(E, i, 'fold');
    } else if (k === 'check') {
      if (!L.check) return { ok: false, erro: 'Há aposta para pagar: passar não é possível.' };
      m.vista[i] = m.aposta; log(E, i, 'check');
    } else if (k === 'call') {
      if (!L.call) return { ok: false, erro: 'Não há aposta para pagar.' };
      var v = L.aPagar;
      j.fichas -= v; m.ap[i] += v; m.tot[i] += v; if (j.fichas === 0) m.tudo[i] = true;
      m.vista[i] = m.aposta; log(E, i, m.tudo[i] ? 'allin' : 'call', m.ap[i]);
      if (m.rua === 0 && !m.vol[i]) { m.vol[i] = true; est.vol++; }
      est.ch++;
    } else if (k === 'raise') {
      var para = Math.floor(+a.para);
      if (!(para > m.aposta)) return { ok: false, erro: 'O valor precisa ser maior que a aposta atual.' };
      if (!L.sobe) return { ok: false, erro: 'Aqui só dá para pagar ou desistir.' };
      if (para > L.max) return { ok: false, erro: 'Você não tem tantas fichas.' };
      var todas = para === L.max;
      if (para < m.aposta + m.minRaise && !todas) return { ok: false, erro: 'O mínimo é ' + (m.aposta + m.minRaise) + '.' };
      var pagar = para - m.ap[i];
      j.fichas -= pagar; m.ap[i] = para; m.tot[i] += pagar; if (j.fichas === 0) m.tudo[i] = true;
      var inc = para - m.aposta;
      if (inc >= m.minRaise) m.minRaise = inc;
      var abriu = m.aposta === 0;
      m.aposta = para; m.vista[i] = para;
      log(E, i, m.tudo[i] ? 'allin' : (abriu ? 'bet' : 'raise'), para);
      if (m.rua === 0 && !m.vol[i]) { m.vol[i] = true; est.vol++; }
      est.ag++;
    } else return { ok: false, erro: 'Ação desconhecida.' };
    depoisDaAcao(E, i);
    return { ok: true };
  }

  function depoisDaAcao(E, i) {
    var m = E.m;
    if (vivos(m).length <= 1) { m.vez = -1; return fimDaRua(E); }
    var p = proxAgir(m, i);
    if (p < 0) { m.vez = -1; return fimDaRua(E); }
    m.vez = p;
  }

  /* devolve a parte de uma aposta que ninguém pagou */
  function devolverExcesso(E) {
    var m = E.m, top = -1, ti = -1, seg = 0, n = m.ap.length, i;
    for (i = 0; i < n; i++) if (m.ap[i] > top) { top = m.ap[i]; ti = i; }
    for (i = 0; i < n; i++) if (i !== ti && m.ap[i] > seg) seg = m.ap[i];
    if (top > seg) {
      var d = top - seg;
      m.ap[ti] -= d; m.tot[ti] -= d; E.jog[ti].fichas += d;
      log(E, ti, 'volta', d);
    }
  }

  function fimDaRua(E) {
    var m = E.m;
    devolverExcesso(E);
    if (vivos(m).length === 1) return premiarUnico(E);
    if (m.rua >= 3) return chegouAoShow(E);
    // próxima rua
    var n = m.ap.length, i;
    for (i = 0; i < n; i++) { m.ap[i] = 0; m.vista[i] = -1; }
    m.aposta = 0; m.minRaise = E.cfg.bb;
    var corre = podem(m).length <= 1;
    if (corre) {
      m.aberta = true;
      if (E.fis) { m.rua = 3; m.corre = true; m.pend = 'distribuir'; m.vez = -1; log(E, -1, 'corre'); return; }
      while (m.rua < 3) abrirRua(E);
      return chegouAoShow(E);
    }
    abrirRua(E);
    m.vez = proxAgir(m, m.btn);
    if (E.fis) m.pend = 'distribuir';
    else m.pend = 'apostar';
    if (m.vez < 0) { m.vez = -1; fimDaRua(E); }
  }

  function abrirRua(E) {
    var m = E.m;
    m.rua++;
    if (!E.fis) {
      var q = m.rua === 1 ? 3 : 1;
      for (var c = 0; c < q; c++) m.com.push(m.bar[m.bi++]);
    }
    log(E, -1, 'rua', m.rua);
  }

  /* modo físico: depois de distribuir as cartas na mesa, a aposta da rua começa */
  function distribuida(E) {
    var m = E.m;
    if (!E.fis || !m || m.pend !== 'distribuir') return { ok: false, erro: 'Nada para distribuir agora.' };
    if (m.corre) { m.pend = 'vencedor'; m.pots = calcPots(E); m.vez = -1; return { ok: true }; }
    m.pend = 'apostar';
    return { ok: true };
  }

  /* ----------------------------------------------------------------------
     Potes, showdown e fim da mão
     ---------------------------------------------------------------------- */
  function calcPots(E) {
    var m = E.m, n = m.tot.length, niveis = [], i, s;
    for (i = 0; i < n; i++) if (m.dentro[i] && !m.dob[i] && m.tot[i] > 0 && niveis.indexOf(m.tot[i]) < 0) niveis.push(m.tot[i]);
    niveis.sort(function (a, b) { return a - b; });
    var pots = [], prev = 0;
    niveis.forEach(function (L) {
      var v = 0, el = [];
      for (s = 0; s < n; s++) {
        v += Math.min(m.tot[s], L) - Math.min(m.tot[s], prev);
        if (m.dentro[s] && !m.dob[s] && m.tot[s] >= L) el.push(s);
      }
      if (v > 0) {
        var ult = pots[pots.length - 1];
        if (ult && ult.el.join() === el.join()) ult.valor += v; else pots.push({ valor: v, el: el });
      }
      prev = L;
    });
    // dinheiro de quem desistiu acima do maior nível dos que ficaram (não acontece, mas não pode se perder)
    var sobra = 0;
    for (s = 0; s < n; s++) sobra += Math.max(0, m.tot[s] - (niveis.length ? niveis[niveis.length - 1] : 0));
    if (sobra > 0 && pots.length) pots[pots.length - 1].valor += sobra;
    return pots;
  }

  /* ordem de quem recebe as fichas que sobram de um pote dividido: a partir da esquerda do dealer */
  function ordemDoBotao(m, seats) {
    var n = m.tot.length, r = [];
    for (var k = 1; k <= n; k++) { var i = (m.btn + k) % n; if (seats.indexOf(i) >= 0) r.push(i); }
    return r;
  }

  function pagarPote(E, pote, ganhadores) {
    var m = E.m, ord = ordemDoBotao(m, ganhadores), parte = {}, base = Math.floor(pote.valor / ord.length), resto = pote.valor - base * ord.length;
    ord.forEach(function (s, q) { var v = base + (q < resto ? 1 : 0); parte[s] = v; E.jog[s].fichas += v; });
    return { valor: pote.valor, el: pote.el, ganhadores: ord, parte: parte };
  }

  function premiarUnico(E) {
    var m = E.m, w = vivos(m)[0], v = poteTotal(m);
    E.jog[w].fichas += v;
    var pot = { valor: v, el: [w], ganhadores: [w], parte: {} }; pot.parte[w] = v;
    m.res = { unico: true, pots: [pot], mostra: [], nomes: {}, score: {} };
    m.pend = 'fim'; m.vez = -1;
    log(E, w, 'ganha', v);
    fecharMao(E);
  }

  function chegouAoShow(E) {
    var m = E.m;
    m.vez = -1; m.aberta = true;
    if (E.fis) { m.pend = 'vencedor'; m.pots = calcPots(E); return; }
    var sc = {}, nomes = {}, mostra = vivos(m), pots = calcPots(E), res = [];
    mostra.forEach(function (s) { sc[s] = avaliar(m.maos[s].concat(m.com)); nomes[s] = nomeMao(sc[s]); });
    pots.forEach(function (p) {
      var melhor = -1, g = [];
      p.el.forEach(function (s) { if (sc[s] > melhor) { melhor = sc[s]; g = [s]; } else if (sc[s] === melhor) g.push(s); });
      res.push(pagarPote(E, p, g));
    });
    m.res = { unico: false, pots: res, mostra: mostra, nomes: nomes, score: sc };
    m.pend = 'fim';
    res.forEach(function (p) { p.ganhadores.forEach(function (s) { log(E, s, 'ganha', p.parte[s]); }); });
    fecharMao(E);
  }

  /* modo físico: quem joga diz quem ganhou cada pote. ganhadores: lista de listas de assentos, uma por pote (em m.pots) */
  function vencedores(E, ganhadores) {
    var m = E.m;
    if (!E.fis || !m || m.pend !== 'vencedor') return { ok: false, erro: 'Não é hora de escolher o vencedor.' };
    if (!Array.isArray(ganhadores) || ganhadores.length !== m.pots.length) return { ok: false, erro: 'Escolha quem ganhou cada pote.' };
    for (var p = 0; p < m.pots.length; p++) {
      var g = ganhadores[p];
      if (!Array.isArray(g) || !g.length) return { ok: false, erro: 'Falta escolher quem ganhou o pote ' + (p + 1) + '.' };
      for (var q = 0; q < g.length; q++) if (m.pots[p].el.indexOf(g[q]) < 0) return { ok: false, erro: 'Esse jogador não disputa esse pote.' };
    }
    var res = m.pots.map(function (pt, p) { return pagarPote(E, pt, ganhadores[p]); });
    m.res = { unico: false, pots: res, mostra: vivos(m), nomes: {}, score: {} };
    m.pend = 'fim';
    res.forEach(function (pt) { pt.ganhadores.forEach(function (s) { log(E, s, 'ganha', pt.parte[s]); }); });
    fecharMao(E);
    return { ok: true };
  }

  function fecharMao(E) {
    var m = E.m, n = E.jog.length, i;
    E.fase = 'entre';
    if (E.fis) return;
    // eliminações (digital): quem tinha menos fichas no começo da mão fica numa posição pior
    var fora = [];
    for (i = 0; i < n; i++) if (m.dentro[i] && E.jog[i].fichas === 0 && !E.jog[i].fora) fora.push(i);
    var restam = 0;
    for (i = 0; i < n; i++) if (!E.jog[i].fora && E.jog[i].fichas > 0) restam++;
    fora.sort(function (a, b) { return m.ini[b] - m.ini[a] || a - b; });
    fora.forEach(function (s, q) { E.jog[s].fora = true; E.jog[s].pos = restam + 1 + q; E.elim.push(E.jog[s].id); });
    if (restam <= 1) {
      E.fase = 'fim';
      for (i = 0; i < n; i++) if (!E.jog[i].fora && E.jog[i].fichas > 0) { E.venc = E.jog[i].id; E.jog[i].pos = 1; }
    }
  }

  /* ----------------------------------------------------------------------
     Mesa física: mudanças durante a partida
     ---------------------------------------------------------------------- */
  /* quem sai da mesa: se estiver numa mão, desiste dela; sai de vez quando a mão acaba */
  function remover(E, i) {
    var j = E.jog[i];
    if (!j || j.fora) return { ok: false, erro: 'Esse jogador já saiu.' };
    if (!E.fis) return { ok: false, erro: 'Só na mesa com cartas reais.' };
    j.fora = true;
    var m = E.m;
    if (E.fase === 'mao' && m && m.dentro[i] && !m.dob[i]) {
      var eraVez = m.vez === i;
      m.dob[i] = true; log(E, i, 'sai');
      if (m.pend === 'apostar') {
        if (vivos(m).length <= 1) { m.vez = -1; fimDaRua(E); }
        else if (eraVez) depoisDaAcao(E, i);
        else if (proxAgir(m, m.vez) < 0 && !precisaAgir(m, m.vez)) { /* a rua pode ter acabado */ var p = proxAgir(m, m.vez); if (p < 0) { m.vez = -1; fimDaRua(E); } }
      } else if (m.pend === 'distribuir' || m.pend === 'vencedor') {
        if (vivos(m).length <= 1) { m.vez = -1; devolverExcesso(E); premiarUnico(E); }
        else if (m.pend === 'vencedor') m.pots = calcPots(E);
      }
    }
    return { ok: true };
  }

  /* chega alguém: entra na próxima mão (ou agora, se ninguém está no meio de uma) */
  function adicionar(E, o) {
    if (!E.fis) return { ok: false, erro: 'Só na mesa com cartas reais.' };
    var vivosMesa = E.jog.filter(function (j) { return !j.fora; }).length + (E.fila ? E.fila.length : 0);
    if (vivosMesa >= MAX_FIS) return { ok: false, erro: 'A mesa já está cheia (' + MAX_FIS + ').' };
    var nome = String(o.nome || '').trim().slice(0, 12);
    if (!nome) return { ok: false, erro: 'Digite um nome.' };
    var f = Math.max(1, Math.floor(o.fichas || E.cfg.ini));
    if (!E.fila) E.fila = [];
    E.fila.push({ nome: nome, fichas: f, depoisDe: o.depoisDe, tipo: 'humano', nivel: 0 });
    if (E.fase === 'entre') arrumarMesa(E);
    return { ok: true };
  }

  /* acerto manual das fichas (corrigir um erro, recompra) */
  function ajustarFichas(E, i, v) {
    var j = E.jog[i]; v = Math.floor(v);
    if (!j || !E.fis || !(v >= 0)) return { ok: false, erro: 'Valor inválido.' };
    E.total += v - j.fichas; j.fichas = v;
    return { ok: true };
  }
  function renomear(E, i, nome) {
    nome = String(nome || '').trim().slice(0, 12);
    if (!E.jog[i] || !nome) return { ok: false, erro: 'Nome inválido.' };
    E.jog[i].nome = nome; return { ok: true };
  }
  function mudarBlinds(E, sb, bb, ante) {
    sb = Math.floor(sb); bb = Math.floor(bb); ante = Math.floor(ante || 0);
    if (!(sb >= 1) || !(bb >= sb) || !(ante >= 0)) return { ok: false, erro: 'Blinds inválidas (a grande não pode ser menor que a pequena).' };
    E.cfg.sb = sb; E.cfg.bb = bb; E.cfg.ante = ante;
    return { ok: true };
  }
  function proximoNivel(E) {
    var bb = E.cfg.bb, n = null;
    for (var i = 0; i < NIVEIS.length; i++) if (NIVEIS[i][1] > bb) { n = NIVEIS[i]; break; }
    if (!n) { var g = Math.round(bb * 1.5 / 100) * 100 || Math.round(bb * 1.5); n = [Math.round(g / 2), g]; }
    E.cfg.nivel = (E.cfg.nivel || 0) + 1;
    return mudarBlinds(E, n[0], n[1], E.cfg.ante);
  }
  /* o dealer escolhido na mão: o botão vai para o jogador i na próxima mão */
  function definirDealer(E, i) {
    if (E.fase === 'mao') return { ok: false, erro: 'Só entre uma mão e outra.' };
    var n = E.jog.length; if (!E.jog[i]) return { ok: false, erro: 'Jogador inválido.' };
    E.btn = E.jog[(i + n - 1) % n].id; return { ok: true };
  }

  /* ----------------------------------------------------------------------
     Visão de quem decide (robôs): só o que um jogador de verdade sabe
     ---------------------------------------------------------------------- */
  function visao(E, i) {
    var m = E.m, L = legais(E);
    return {
      seat: i, minhas: m.maos[i] ? m.maos[i].slice() : [], com: m.com.slice(), rua: m.rua, n: m.dob.length,
      btn: m.btn, sb: m.sb, bb: m.bb, ap: m.ap.slice(), tot: m.tot.slice(), dob: m.dob.slice(), tudo: m.tudo.slice(), dentro: m.dentro.slice(),
      fichas: E.jog.map(function (j) { return j.fichas; }), aposta: m.aposta, minRaise: m.minRaise, vista: m.vista.slice(),
      cfg: { sb: E.cfg.sb, bb: E.cfg.bb, ante: E.cfg.ante }, legais: L, pote: poteTotal(m), nmao: m.n,
      est: E.jog.map(function (j) { return E.est[j.id]; }), log: m.log.slice(), semente: E.sem, nivel: E.jog[i].nivel
    };
  }

  /* ----------------------------------------------------------------------
     Conferência do salvamento
     ---------------------------------------------------------------------- */
  function validar(E) {
    try {
      if (!E || E.v !== 1 || !Array.isArray(E.jog) || E.jog.length < 2 || E.jog.length > MAX_FIS) return false;
      if (!Array.isArray(E.rng) || E.rng.length !== 4) return false;
      var ok = E.jog.every(function (j) { return j && typeof j.nome === 'string' && Number.isInteger(j.fichas) && j.fichas >= 0 && Number.isInteger(j.id); });
      if (!ok) return false;
      if (['entre', 'mao', 'fim'].indexOf(E.fase) < 0) return false;
      if (!E.fis && E.jog.length > MAX_DIG) return false;
      var m = E.m, n = E.jog.length;
      if (E.fase === 'mao') {
        if (!m) return false;
        var arrs = ['dentro', 'ap', 'tot', 'dob', 'tudo', 'vista', 'ini', 'maos'];
        for (var a = 0; a < arrs.length; a++) if (!Array.isArray(m[arrs[a]]) || m[arrs[a]].length !== n) return false;
        for (var i = 0; i < n; i++) {
          if (!Number.isInteger(m.ap[i]) || m.ap[i] < 0 || !Number.isInteger(m.tot[i]) || m.tot[i] < m.ap[i]) return false;
        }
        if (['apostar', 'distribuir', 'vencedor', 'fim'].indexOf(m.pend) < 0) return false;
        if (m.pend === 'apostar' && (m.vez < 0 || m.vez >= n || !m.dentro[m.vez] || m.dob[m.vez] || m.tudo[m.vez])) return false;
        if (!E.fis) {
          var vistas = {}, cartas = [];
          for (var s = 0; s < n; s++) if (m.maos[s]) cartas = cartas.concat(m.maos[s]);
          cartas = cartas.concat(m.com);
          for (var c = 0; c < cartas.length; c++) { if (!Number.isInteger(cartas[c]) || cartas[c] < 0 || cartas[c] > 51 || vistas[cartas[c]]) return false; vistas[cartas[c]] = 1; }
          var soma = 0, d;
          for (d = 0; d < n; d++) soma += E.jog[d].fichas + m.tot[d];
          if (soma !== E.total) return false;
        }
      } else if (!E.fis) {
        var s2 = 0; for (var e = 0; e < n; e++) s2 += E.jog[e].fichas;
        if (s2 !== E.total) return false;
      }
      return true;
    } catch (e) { return false; }
  }

  return {
    MAX_DIG: MAX_DIG, MAX_FIS: MAX_FIS, NIVEIS: NIVEIS, CATS: CATS, TABELA: TABELA,
    naipe: naipe, valor: valor, rango: rangoDe, avaliar: avaliar, categoria: categoria, digitos: digitos, nomeMao: nomeMao, sg: sg, pl: pl,
    novo: novo, novaMao: novaMao, aplicar: aplicar, legais: legais, distribuida: distribuida, vencedores: vencedores,
    remover: remover, adicionar: adicionar, ajustarFichas: ajustarFichas, renomear: renomear, mudarBlinds: mudarBlinds, proximoNivel: proximoNivel, definirDealer: definirDealer,
    calcPots: calcPots, visao: visao, validar: validar, reforcar: reforcar, ativos: ativos, vivos: vivos, podem: podem, poteTotal: poteTotal, idx: idx
  };
});

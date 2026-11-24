/* ==========================================================================
   PokerON! - robo.js (os robôs, sem DOM, testados no Node)
   Robo.decidir(visao) devolve uma ação { k: 'fold' | 'check' | 'call' | 'raise' (com para) | 'allin' }.
   O robô só recebe a visão de Poker.visao(): o que está na mesa, as próprias cartas, as fichas e o que cada um
   fez na mão. Não vê as cartas de ninguém. Toda a sorte dele vem de Sorteio, com semente derivada da partida,
   então a mesma situação com a mesma semente dá a mesma jogada.

   Níveis (comportamento):
     1 Iniciante  joga quase ao acaso, paga demais, quase nunca aumenta
     2 Fácil      joga poucas mãos e passivo; só aposta forte com mão muito boa; não blefa
     3 Médio      conta as chances de ganhar (equidade) e compara com o preço de pagar; abre mais de posição tardia;
                  empurra tudo quando está com poucas fichas; não blefa
     4 Difícil    como o 3, e também blefa com chances de melhorar, aposta fino por valor, desconfia de quem aumenta
     5 Mestre     como o 4, e ainda estima a mão de cada adversário pelo que ele fez e se adapta a quem paga demais ou de menos
   ========================================================================== */
(function (raiz, fabrica) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./regras.js'), require('./sorteio.js'));
  else raiz.Robo = fabrica(raiz.Poker, raiz.Sorteio);
})(typeof window !== 'undefined' ? window : globalThis, function (P, Sorteio) {
  'use strict';

  var NOMES = { 0: 'Variados', 1: 'Iniciante', 2: 'Fácil', 3: 'Médio', 4: 'Difícil', 5: 'Mestre' };
  var DESCRICAO = {
    0: 'Cada robô joga num nível diferente, do 2 ao 5.',
    1: 'Joga quase ao acaso, paga demais e quase nunca aumenta.',
    2: 'Joga poucas mãos, passivo: só aposta forte com mão muito boa e nunca blefa.',
    3: 'Conta as chances de ganhar e compara com o preço de pagar. Empurra tudo quando as fichas acabam. Não blefa.',
    4: 'Como o 3, e ainda blefa quando pode melhorar, aposta fino com mão boa e desconfia de quem aumenta.',
    5: 'Como o 4, e ainda estima a mão de cada adversário pelo que ele fez e se adapta a quem paga demais ou de menos.'
  };

  /* ----------------------------------------------------------------------
     Força das duas cartas iniciais (fórmula de Chen) e a posição dela entre as 1326 combinações
     ---------------------------------------------------------------------- */
  function chen(a, b) {
    var ra = P.rango(a), rb = P.rango(b), hi = Math.max(ra, rb), lo = Math.min(ra, rb);
    var pts = function (r) { return r === 14 ? 10 : r === 13 ? 8 : r === 12 ? 7 : r === 11 ? 6 : r / 2; };
    var s = pts(hi);
    if (ra === rb) return Math.max(5, s * 2);
    if (P.naipe(a) === P.naipe(b)) s += 2;
    var gap = hi - lo - 1;
    s -= gap === 0 ? 0 : gap === 1 ? 1 : gap === 2 ? 2 : gap === 3 ? 4 : 5;
    if (gap <= 1 && hi < 12) s += 1;
    return Math.ceil(s);
  }
  var PCT = null;
  function montarPct() {
    var xs = [], a, b;
    for (a = 0; a < 52; a++) for (b = a + 1; b < 52; b++) xs.push(chen(a, b));
    xs.sort(function (x, y) { return x - y; });
    var tab = {};
    xs.forEach(function (x) { if (!(x in tab)) { var menos = xs.indexOf(x), iguais = xs.lastIndexOf(x) - menos + 1; tab[x] = (menos + iguais / 2) / xs.length; } });
    PCT = tab;
  }
  /* posição da mão: 0 = a pior, 1 = a melhor */
  function pct(a, b) { if (!PCT) montarPct(); return PCT[chen(a, b)]; }
  /* chance aproximada de ganhar contra uma mão qualquer */
  var eqPre = function (p) { return 0.31 + 0.54 * p; };

  /* ----------------------------------------------------------------------
     Chance de ganhar (equidade) por sorteios
     filtros[k] (opcional, um por adversário): { pre: posição mínima da mão, feito: aceita só quem acertou algo na mesa }
     ---------------------------------------------------------------------- */
  function equidade(minhas, com, opp, N, g, filtros) {
    var usadas = {}, i;
    minhas.forEach(function (c) { usadas[c] = 1; });
    com.forEach(function (c) { usadas[c] = 1; });
    var deck = [];
    for (i = 0; i < 52; i++) if (!usadas[i]) deck.push(i);
    var falta = 5 - com.length, nd = deck.length, ganhos = 0, board = com.slice(), sb = com.length >= 3 ? P.avaliar(com) : -1;
    var holes = [];
    for (var it = 0; it < N; it++) {
      var pos = 0, k;
      function sacar() { var j = pos + g.inteiro(nd - pos), t = deck[pos]; deck[pos] = deck[j]; deck[j] = t; return deck[pos++]; }
      for (k = 0; k < opp; k++) {
        var h1 = sacar(), h2 = sacar(), f = filtros && filtros[k];
        if (f) {
          for (var tent = 0; tent < 6; tent++) {
            var okF = true;
            if (f.pre !== undefined && pct(h1, h2) < f.pre) okF = false;
            if (okF && f.feito && sb >= 0 && P.avaliar([h1, h2].concat(com)) <= sb) okF = false;
            if (okF) break;
            pos -= 2; h1 = sacar(); h2 = sacar();
          }
        }
        holes[k] = [h1, h2];
      }
      board.length = com.length;
      for (k = 0; k < falta; k++) board.push(sacar());
      var meu = P.avaliar(minhas.concat(board)), melhor = true, empates = 1;
      for (k = 0; k < opp; k++) {
        var so = P.avaliar(holes[k].concat(board));
        if (so > meu) { melhor = false; break; }
        if (so === meu) empates++;
      }
      if (melhor) ganhos += 1 / empates;
    }
    return ganhos / N;
  }

  /* ----------------------------------------------------------------------
     Auxiliares
     ---------------------------------------------------------------------- */
  function unidade(cfg) { return cfg.sb >= 100 ? 25 : cfg.sb >= 10 ? 5 : 1; }
  function arredonda(x, u) { return Math.round(x / u) * u; }

  function contexto(v) {
    var L = v.legais, n = v.n, i = v.seat, c = { L: L, v: v };
    c.bb = v.cfg.bb; c.pote = v.pote; c.aPagar = L.aPagar; c.falta = L.falta;
    c.pf = 0; var vivos = 0, opp = 0;
    for (var s = 0; s < n; s++) if (v.dentro[s] && !v.dob[s]) { vivos++; if (s !== i) opp++; }
    c.opp = opp; c.vivos = vivos;
    var na = 0; for (s = 0; s < n; s++) if (v.dentro[s]) na++;
    c.na = na;
    var dist = (v.btn - i + n) % n;      // 0 = dealer
    c.pf = Math.max(0, 1 - dist / Math.max(2, na));
    if (na === 2) c.pf = i === v.btn ? 1 : 0.5;
    c.minha = v.fichas[i] + v.ap[i];      // fichas totais na rua
    c.efetivo = v.fichas[i];
    var maior = 0;
    for (s = 0; s < n; s++) if (s !== i && v.dentro[s] && !v.dob[s]) maior = Math.max(maior, v.fichas[s] + v.ap[s]);
    c.efBB = Math.min(v.fichas[i] + v.ap[i], maior || v.fichas[i]) / c.bb;
    c.po = c.aPagar > 0 ? c.aPagar / (c.pote + c.aPagar) : 0;
    return c;
  }

  /* quantos aumentos já houve antes do flop */
  function aumentosPre(v) { var q = 0; v.log.forEach(function (e) { if (e.r === 0 && (e.k === 'raise' || e.k === 'bet' || (e.k === 'allin' && e.v > v.cfg.bb))) q++; }); return q; }
  function limpers(v) { var q = 0; v.log.forEach(function (e) { if (e.r === 0 && e.k === 'call' && v.aposta <= v.cfg.bb) q++; }); return q; }

  function legalizar(a, c) {
    var L = c.L;
    if (a.k === 'raise') {
      if (!L.sobe) return L.check ? { k: 'check' } : (L.call ? { k: 'call' } : { k: 'fold' });
      var para = Math.max(L.min, Math.min(L.max, Math.round(a.para)));
      // não deixa só migalhas: perto do total, vai de uma vez
      if (L.max - para < Math.max(c.bb, 0.25 * (para - c.v.ap[c.v.seat]))) para = L.max;
      return { k: 'raise', para: para };
    }
    if (a.k === 'allin') return L.sobe || L.tudoNoCall ? { k: 'allin' } : (L.call ? { k: 'call' } : { k: 'check' });
    if (a.k === 'check') return L.check ? a : { k: 'fold' };
    if (a.k === 'call') return L.call ? a : { k: 'check' };
    return a;
  }

  function tamanho(c, frac, v) {
    var u = unidade(v.cfg);
    if (v.aposta === 0) return arredonda(Math.max(c.bb, c.pote * frac), u);
    return arredonda(v.aposta + frac * (c.pote + c.aPagar), u);
  }

  /* ----------------------------------------------------------------------
     Antes do flop
     ---------------------------------------------------------------------- */
  function pre(c, nivel, g) {
    var v = c.v, L = c.L, p = pct(v.minhas[0], v.minhas[1]), bb = c.bb;
    var quem = aumentosPre(v), lim = limpers(v);
    var r = g.real();
    var pareada = P.rango(v.minhas[0]) === P.rango(v.minhas[1]);

    if (nivel === 1) {
      if (!L.call) { if (L.sobe && r < 0.07 + 0.1 * p) return { k: 'raise', para: tamanho(c, 0.6 + 0.4 * g.real(), v) }; return { k: 'check' }; }
      var cheap = c.aPagar <= 3 * bb;
      var joga = cheap ? 0.55 + 0.4 * p : 0.12 + 0.5 * p;
      if (r < joga) return { k: 'call' };
      return { k: 'fold' };
    }
    if (nivel === 2) {
      if (!L.call) { if (p >= 0.85 && L.sobe && r < 0.7) return { k: 'raise', para: arredonda(3 * bb, unidade(v.cfg)) }; return { k: 'check' }; }
      if (quem === 0) { if (p >= 0.9 && L.sobe) return { k: 'raise', para: arredonda(3 * bb, unidade(v.cfg)) }; if (p >= 0.3 && c.aPagar <= 3 * bb) return { k: 'call' }; if (p >= 0.2 && c.po < 0.12) return { k: 'call' }; return { k: 'fold' }; }
      if (p >= 0.95 && L.sobe && r < 0.4) return { k: 'raise', para: tamanho(c, 1, v) };
      if (p >= 0.6 && c.aPagar <= 0.2 * c.minha) return { k: 'call' };
      return { k: 'fold' };
    }

    // 3, 4 e 5: faixas por posição, preço e tamanho das fichas
    var curto = c.efBB <= 12;
    if (curto) {
      var faixa = Math.max(0.12, Math.min(0.75, 0.95 - c.efBB * 0.06)) * (c.na <= 3 ? 1.25 : 1);
      if (quem === 0) {
        if (p >= 1 - faixa * (0.7 + 0.5 * c.pf) && L.sobe) return { k: 'allin' };
        if (!L.call) return { k: 'check' };
        return eqPre(p) * 1.0 > c.po * (c.aPagar < bb * 1.5 ? 1.0 : 1.3) ? { k: 'call' } : { k: 'fold' };
      }
      // alguém já aumentou: paga ou empurra se a mão for boa para o preço
      if (p >= 0.9 && L.sobe) return { k: 'allin' };
      if (L.call && eqPre(p) > c.po * 1.15 + (c.na > 2 ? 0.05 : 0)) return { k: 'call' };
      return L.call ? { k: 'fold' } : { k: 'check' };
    }
    var abre = (nivel === 3 ? 0.14 + 0.30 * c.pf : 0.15 + 0.34 * c.pf) * (c.na <= 3 ? 1.35 : c.na >= 8 ? 0.85 : 1);
    abre = Math.min(0.75, abre);
    if (nivel >= 4 && quem === 0 && p >= 0.35 && p < 1 - abre && c.pf > 0.6 && g.real() < (nivel === 5 ? 0.14 : 0.08) && pct(v.minhas[0], v.minhas[1]) >= 0.4 && P.naipe(v.minhas[0]) === P.naipe(v.minhas[1])) {
      return { k: 'raise', para: tamanho(c, 0.9, v) };
    }
    if (quem === 0) {
      var pele = 2.5 + lim;            // abertura (e mais um por quem pagou antes)
      if (p >= 1 - abre) { if (L.sobe) return { k: 'raise', para: arredonda(pele * bb + (nivel >= 4 ? (g.real() - 0.5) * bb * 0.6 : 0), unidade(v.cfg)) }; }
      if (!L.call) return { k: 'check' };
      if (lim >= 0 && c.po <= 0.14 && p >= 0.4 && eqPre(p) > c.po * 1.5) return { k: 'call' };   // completar o small blind / pagar barato
      return { k: 'fold' };
    }
    var tam = v.aposta / bb;       // tamanho do aumento em big blinds
    var fator = 1 + Math.max(0, tam - 3) * 0.06 + (quem - 1) * 0.12;
    var premium = p >= 0.965 - (quem >= 2 ? 0 : 0.03);
    if (premium && L.sobe && (quem === 1 || p >= 0.985 || g.real() < 0.5)) return quem >= 2 && p < 0.985 ? { k: 'call' } : { k: 'raise', para: Math.min(L.max, arredonda(v.aposta * 3 + (c.pote - v.aposta) * 0.2, unidade(v.cfg))) };
    if (nivel >= 4 && L.sobe && quem === 1 && p >= 0.55 && p < 0.8 && c.pf > 0.55 && g.real() < (nivel === 5 ? 0.12 : 0.06)) return { k: 'raise', para: arredonda(v.aposta * 3, unidade(v.cfg)) };
    var meu = eqPre(p) / (1 + (c.opp > 1 ? 0.04 * (c.opp - 1) : 0));
    var preciso = c.po * 1.12 * fator - (c.pf < 0.4 ? 0 : 0.02);
    if (L.call && meu > preciso && p >= 0.5 - 0.1 * c.pf) return { k: 'call' };
    return L.call ? { k: 'fold' } : { k: 'check' };
  }

  /* ----------------------------------------------------------------------
     Depois do flop
     ---------------------------------------------------------------------- */
  function agrediu(v, s, rua) { for (var i = 0; i < v.log.length; i++) { var e = v.log[i]; if (e.s === s && (rua === undefined || e.r === rua) && (e.k === 'bet' || e.k === 'raise' || e.k === 'allin')) return true; } return false; }

  function filtrosDe(c, nivel) {
    var v = c.v, f = [], s;
    if (nivel < 5) return null;
    for (s = 0; s < v.n; s++) {
      if (s === v.seat || !v.dentro[s] || v.dob[s]) continue;
      var o = {}, estS = v.est[s] || { m: 1, vol: 0, ag: 0, ch: 0 }, m = Math.max(4, estS.m);
      var preAg = false, preCh = false;
      v.log.forEach(function (e) { if (e.s === s && e.r === 0) { if (e.k === 'raise' || e.k === 'bet' || e.k === 'allin') preAg = true; else if (e.k === 'call') preCh = true; } });
      var folgado = estS.m >= 8 ? estS.vol / m : 0.4;
      o.pre = preAg ? Math.max(0.6, 0.97 - folgado) : preCh ? Math.max(0.3, 0.8 - folgado) : 0;
      var agr = estS.ag / Math.max(1, estS.ag + estS.ch);
      if (agrediu(v, s) && v.rua > 0 && estS.m >= 8 && agr < 0.4) o.feito = true;
      f.push(o);
    }
    return f;
  }

  function pos(c, nivel, g) {
    var v = c.v, L = c.L, bb = c.bb, i = v.seat;
    var N = nivel === 1 ? 0 : nivel === 2 ? 60 : nivel === 3 ? 160 : nivel === 4 ? 300 : 520;
    var r = g.real();
    var e;
    if (nivel === 1) {
      var feito = P.categoria(P.avaliar(v.minhas.concat(v.com))) - P.categoria(v.com.length >= 3 ? P.avaliar(v.com) : 0);
      var forte = feito > 0 && P.categoria(P.avaliar(v.minhas.concat(v.com))) >= 2;
      var par = feito > 0 || P.categoria(P.avaliar(v.minhas.concat(v.com))) >= 1 && (P.rango(v.minhas[0]) === P.rango(v.minhas[1]) || v.com.some(function (x) { return P.rango(x) === P.rango(v.minhas[0]) || P.rango(x) === P.rango(v.minhas[1]); }));
      if (!L.call) { if (forte && L.sobe && r < 0.5) return { k: 'raise', para: tamanho(c, 0.4 + 0.6 * g.real(), v) }; if (par && L.sobe && r < 0.2) return { k: 'raise', para: tamanho(c, 0.3 + 0.3 * g.real(), v) }; return { k: 'check' }; }
      if (forte) return { k: 'call' };
      if (par) return r < (c.aPagar <= 0.7 * c.pote ? 0.85 : 0.4) ? { k: 'call' } : { k: 'fold' };
      return r < (c.aPagar <= 0.25 * c.pote ? 0.4 : 0.12) ? { k: 'call' } : { k: 'fold' };
    }
    var filtros = filtrosDe(c, nivel);
    e = equidade(v.minhas, v.com, Math.max(1, c.opp), N, g, filtros);
    if (nivel === 2) {
      if (!L.call) { if (e >= 0.72 && L.sobe) return { k: 'raise', para: tamanho(c, 0.7, v) }; return { k: 'check' }; }
      if (e >= 0.93 && L.sobe && r < 0.5) return { k: 'raise', para: tamanho(c, 1, v) };
      return e > c.po - 0.02 ? { k: 'call' } : { k: 'fold' };
    }

    var multi = Math.max(0, c.opp - 1);
    var apostaDoOutro = c.aPagar > 0;
    if (apostaDoOutro) {
      var frac = c.aPagar / Math.max(1, c.pote - c.aPagar);
      var ea = e;
      if (nivel === 4) ea = e - 0.09 * Math.min(1.5, frac) - (v.rua >= 2 ? 0.02 : 0);
      if (nivel === 5) ea = e - 0.14 * Math.min(1.5, frac) - (v.rua >= 2 ? 0.02 : 0);
      if (nivel === 3) ea = e - 0.06 * Math.min(1.5, frac) - (v.rua >= 2 ? 0.02 : 0);
      var margem = nivel === 3 ? 0.04 : 0.01;
      var vez = v.rua === 3 ? 0 : 0.025;       // chances de melhorar ainda contam um pouco antes do river
      if (ea >= 0.82 - 0.02 * Math.min(2, multi) && L.sobe && r < (nivel >= 4 ? 0.7 : 0.55)) return { k: 'raise', para: Math.min(L.max, tamanho(c, nivel >= 4 ? 0.8 + 0.4 * g.real() : 0.8, v)) };
      if (nivel >= 4 && L.sobe && ea < 0.3 && ea > 0.12 && v.rua < 3 && c.opp === 1 && r < (nivel === 5 ? 0.07 : 0.04)) return { k: 'raise', para: Math.min(L.max, tamanho(c, 1, v)) };
      if (ea + vez > c.po + margem) return { k: 'call' };
      return { k: 'fold' };
    }
    // vez de apostar primeiro
    var forte = 0.68 + 0.04 * multi, fino = 0.55 + 0.04 * multi;
    var opcoes = nivel === 3 ? 0 : 1;
    if (e >= forte && L.sobe) {
      if (opcoes && v.rua === 1 && e > 0.88 && r < 0.14) return { k: 'check' };          // armadilha
      var fr = e > 0.85 ? 0.6 + 0.3 * g.real() : 0.45 + 0.3 * g.real();
      return { k: 'raise', para: tamanho(c, nivel === 3 ? 0.6 : fr, v) };
    }
    if (nivel >= 4 && e >= fino && L.sobe && r < 0.55) return { k: 'raise', para: tamanho(c, 0.33 + 0.2 * g.real(), v) };
    if (nivel >= 4 && L.sobe && v.rua < 3 && e >= 0.2 && e < 0.5) {
      var estS = c.opp === 1 ? 1 : 0.55 / c.opp;
      var f0 = nivel === 5 ? 0.3 : 0.22;
      if (nivel === 5) {
        // contra quem paga demais, blefa menos; contra quem desiste, blefa mais
        var pagadores = 0, tot = 0;
        for (var s = 0; s < v.n; s++) if (s !== v.seat && v.dentro[s] && !v.dob[s]) { var q = v.est[s]; if (q && q.m >= 8) { tot++; if (q.ch / Math.max(1, q.m) > 0.35) pagadores++; } }
        if (tot) f0 *= 1.3 - 0.9 * (pagadores / tot);
      }
      if (r < f0 * estS) return { k: 'raise', para: tamanho(c, 0.5 + 0.2 * g.real(), v) };
    }
    if (nivel === 5 && v.rua === 3 && c.opp === 1 && L.sobe && e < 0.15 && r < 0.12) return { k: 'raise', para: tamanho(c, 0.65, v) };
    return L.check ? { k: 'check' } : { k: 'fold' };
  }

  /* ----------------------------------------------------------------------
     Decisão
     ---------------------------------------------------------------------- */
  function decidir(v) {
    var c = contexto(v);
    if (!c.L) return { k: 'fold' };
    var nivel = Math.max(1, Math.min(5, v.nivel | 0 || 3));
    var g = Sorteio.criar(v.semente + '|bot|' + v.nmao + '|' + v.log.length + '|' + v.seat);
    var a = v.rua === 0 ? pre(c, nivel, g) : pos(c, nivel, g);
    return legalizar(a, c);
  }

  return { NOMES: NOMES, DESCRICAO: DESCRICAO, decidir: decidir, equidade: equidade, pct: pct, chen: chen };
});

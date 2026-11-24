/* ==========================================================================
   PokerON! - javinhas.js (a tela e o jogo: mesa, vez de cada um, robôs, passar o aparelho, mesa com cartas reais,
   retroceder, jogadores, blinds, salvamento)
   Regras: regras.js. Robôs: robo.js. Sorte: sorteio.js. Cartas: cartas.js. Textos: textos.js.
   Os três primeiros não mexem na tela e são testados no Node. Menu, sons, vibração e estatísticas do menu: on.js.

   Índice
   1. Dados, preferências e salvamento
   2. Tamanho da mesa e desenho (mesa digital, lista da mesa real, cartas)
   3. Painel de ação (apostar, passar, desistir) e ferramentas
   4. Andamento da partida (vez, robôs, passar o aparelho, fim da mão e da partida)
   5. Mesa com cartas reais (retroceder, jogadores, blinds, quem ganhou)
   6. Telas, nova partida e Como Jogar
   7. Teclado, tamanho e início
   ========================================================================== */
(function () {
  'use strict';

  const P = window.Poker, RB = window.Robo, SO = window.Sorteio, CA = window.Cartas, TX = window.PTXT || {};
  const $ = (s) => document.querySelector(s);

  /* ==========================================================================
     1. Dados, preferências e salvamento
     ========================================================================== */
  const LS = { prefs: 'pokeron.prefs', jogo: 'pokeron.jogo', stats: 'pokeron.stats', visto: 'pokeron.visto' };
  const sget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const sset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem espaço ou bloqueado */ } };
  const sdel = (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignora */ } };

  const NOMES_NIVEL = RB.NOMES, DESC_NIVEL = RB.DESCRICAO;
  const VEL = { rapido: 140, normal: 700, lento: 1400 };
  const NOMES_ROBOS = ['Bia', 'Caio', 'Duda', 'Enzo', 'Fabi', 'Gabi', 'Hugo', 'Iris'];
  const FICHAS_DIG = [1000, 2000, 5000];
  const MPN_DIG = [0, 5, 10, 20];
  const MPN_FIS = [0, 5, 10, 20];
  const RUAS = ['Pré-flop', 'Flop', 'Turn', 'River'];
  const MODOS = [['digital', 'Poker no aparelho'], ['mesa', 'Mesa com cartas reais']];
  const MODO_DESC = {
    digital: 'As cartas aparecem na tela e o jogo embaralha, distribui e decide quem ganha. Jogue contra robôs de 5 níveis, passe o aparelho entre amigos ou misture os dois. Partida honesta: sem retroceder.',
    mesa: 'Você joga com baralho e fichas de verdade. O aparelho vira o dealer: controla blinds, vez, apostas, potes e fichas de cada um. Sem cartas na tela, com retroceder ação e jogadores que entram e saem.'
  };

  const prefs = Object.assign({
    modo: 'digital', n: 4, h: 1, nivel: 3, fichas: 2000, mpn: 10, nomes: [], vel: 'normal', nomemao: 'sim',
    fn: 4, fnomes: [], ff: 1000, fsb: 10, fbb: 20, fante: 0, fmpn: 0
  }, sget(LS.prefs, {}));
  const lim = (v, a, b, d) => { v = Math.floor(+v); return v >= a && v <= b ? v : d; };
  prefs.modo = prefs.modo === 'mesa' ? 'mesa' : 'digital';
  prefs.n = lim(prefs.n, 2, P.MAX_DIG, 4);
  prefs.h = lim(prefs.h, 1, prefs.n, 1);
  prefs.nivel = lim(prefs.nivel, 0, 5, 3);
  if (FICHAS_DIG.indexOf(prefs.fichas) < 0) prefs.fichas = 2000;
  if (MPN_DIG.indexOf(prefs.mpn) < 0) prefs.mpn = 10;
  if (!VEL[prefs.vel]) prefs.vel = 'normal';
  prefs.nomemao = prefs.nomemao === 'nao' ? 'nao' : 'sim';
  prefs.fn = lim(prefs.fn, 2, P.MAX_FIS, 4);
  prefs.ff = lim(prefs.ff, 2, 1000000, 1000);
  prefs.fsb = lim(prefs.fsb, 1, 1000000, 10);
  prefs.fbb = lim(prefs.fbb, 1, 1000000, 20);
  prefs.fante = lim(prefs.fante, 0, 1000000, 0);
  if (MPN_FIS.indexOf(prefs.fmpn) < 0) prefs.fmpn = 0;
  prefs.nomes = Array.isArray(prefs.nomes) ? prefs.nomes.filter((x) => typeof x === 'string').map((x) => x.slice(0, 12)).slice(0, 9) : [];
  prefs.fnomes = Array.isArray(prefs.fnomes) ? prefs.fnomes.filter((x) => typeof x === 'string').map((x) => x.slice(0, 12)).slice(0, 10) : [];
  const gravarPrefs = () => sset(LS.prefs, prefs);

  const el = {
    area: $('#game-area'), mesa: $('#mesa-box'), dig: $('#mesa-dig'), fis: $('#mesa-fis'), tela: $('#tela'), telaTitulo: $('#tela-titulo'),
    telaCorpo: $('#tela-corpo'), telaBtn: $('#tela-btn'), telaBtn2: $('#tela-btn2'), msg: $('#message-area'),
    modoNome: $('#modo-nome'), modoSub: $('#modo-sub'), modoMini: $('#modo-mini'),
    v1: $('#hud-v1'), v2: $('#hud-v2'), v3: $('#hud-v3'), r1: $('#hud-r1'),
    dica: $('#dica'), acao: $('#painel-acao'), minhas: $('#minhas'), minhasCartas: $('#minhas-cartas'), minhasMao: $('#minhas-mao'), minhasRot: $('#minhas-rot'),
    chipsJog: $('#chips-jog'), diario: $('#diario'), restart: $('#restart-btn'),
    assentos: $('#assentos'), board: $('#board'), poteCentro: $('#pote-centro'),
    fisPote: $('#fis-pote'), fisRua: $('#fis-rua'), fisLista: $('#fis-lista'),
    undo: $('#undo-btn'), jogBtn: $('#jog-btn'), blindsBtn: $('#blinds-btn')
  };

  const reduzido = () => !!(window.ON && ON.cfg && ON.cfg.reduzir);
  let msgT = 0;
  function dizer(t, ms) {
    el.msg.textContent = t;
    clearTimeout(msgT);
    if (t) msgT = setTimeout(() => { el.msg.textContent = ''; }, ms || 7000);
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n) => Math.round(+n || 0).toLocaleString('pt-BR');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // E: estado das regras (regras.js). U: estado da tela (não é regra do jogo).
  let E = null;
  let U = null;

  const novoU = () => ({ ver: -1, botT: 0, rapido: false, pausa: false, diario: [], logPos: 0, nmao: -1, undo: [], valor: 0, chave: '', abriuVenc: -1, bd: 0, esp: false });
  const ehHumano = (i) => E.jog[i].tipo === 'humano';
  const vivosJ = () => E.jog.filter((j) => !j.fora);
  const nHumanos = () => E.jog.filter((j) => j.tipo === 'humano' && !j.fora).length;
  const nome = (i) => (E.jog[i] ? E.jog[i].nome : '?');
  const unico = () => !E.fis && nHumanos() === 1;
  const eu = () => E.jog.findIndex((j) => j.tipo === 'humano' && !j.fora);

  function gravar() {
    if (!E) return;
    if (E.fase === 'fim') { sdel(LS.jogo); return; }
    sset(LS.jogo, { E, U: { diario: U.diario.slice(-12), logPos: U.logPos, nmao: U.nmao, undo: U.undo.slice(-25), pausa: false } });
  }

  function lerSalvo() {
    const L = sget(LS.jogo, null);
    if (!L || typeof L !== 'object' || !P.validar(L.E)) return null;
    const u = L.U && typeof L.U === 'object' ? L.U : {};
    const U2 = novoU();
    U2.diario = Array.isArray(u.diario) ? u.diario.filter((x) => typeof x === 'string').slice(-12).map((x) => x.slice(0, 140)) : [];
    U2.logPos = Number.isInteger(u.logPos) && u.logPos >= 0 ? u.logPos : 0;
    U2.nmao = Number.isInteger(u.nmao) ? u.nmao : -1;
    U2.undo = Array.isArray(u.undo) ? u.undo.filter((x) => typeof x === 'string' && x.length < 60000).slice(-25) : [];
    return { E: L.E, U: U2 };
  }

  /* --- estatísticas (só partidas no aparelho com uma única pessoa) --- */
  const novasStats = () => ({ solo: { j: 0, v: 0 }, grupo: 0, maos: 0, ganhas: 0, maior: 0, melhor: -1, melhorNome: '', elim: 0, mesaMaos: 0 });
  function lerStats() {
    const s = Object.assign(novasStats(), sget(LS.stats, {}));
    s.solo = Object.assign({ j: 0, v: 0 }, s.solo || {});
    return s;
  }
  function contar(tipo, d) {
    const st = lerStats();
    if (tipo === 'inicio') { if (E.fis) { /* mesa real não conta */ } else if (nHumanos() === 1) st.solo.j++; else st.grupo++; }
    if (tipo === 'mao' && E.fis) st.mesaMaos++;
    if (tipo === 'mao' && !E.fis && unico()) {
      st.maos++;
      const meu = eu(), m = E.m;
      if (d.ganhou) st.ganhas++;
      if (d.pote > st.maior) st.maior = d.pote;
      if (m.res && !m.res.unico && m.res.score && m.res.score[meu] !== undefined && m.dentro[meu] && !m.dob[meu]) {
        const c = P.categoria(m.res.score[meu]);
        if (c > st.melhor) { st.melhor = c; st.melhorNome = P.TABELA.find((h) => h.cat === c).nome; }
      }
    }
    if (tipo === 'elim') st.elim += d.n;
    if (tipo === 'fim' && !E.fis && nHumanos() === 1 && d.venc === eu()) st.solo.v++;
    sset(LS.stats, st);
  }
  function estatisticas() {
    const st = lerStats();
    const L = [
      { rotulo: 'Partidas contra robôs', valor: st.solo.j },
      { rotulo: 'Vitórias', valor: st.solo.v },
      { rotulo: 'Partidas passando o aparelho', valor: st.grupo },
      { rotulo: 'Mãos jogadas contra robôs', valor: st.maos },
      { rotulo: 'Mãos ganhas', valor: st.ganhas },
      { rotulo: 'Maior pote ganho', valor: fmt(st.maior) },
      { rotulo: 'Robôs eliminados por você', valor: st.elim },
      { rotulo: 'Mãos na mesa com cartas reais', valor: st.mesaMaos }
    ];
    if (st.melhor >= 0) L.push({ rotulo: 'Melhor mão num showdown', valor: st.melhorNome });
    return L;
  }

  /* ==========================================================================
     2. Tamanho da mesa e desenho
     ========================================================================== */
  const slotEl = () => {
    const s = document.createElement('div');
    s.className = 'slot vazio';
    const c = CA.criar(0, 'x');
    c.setAttribute('aria-label', 'Carta virada para baixo');
    s.appendChild(c);
    return s;
  };

  /* mostra (b = número da carta), vira para baixo (b = -1) ou esvazia (b = null) um espaço de carta */
  function pintarCarta(slot, b, atraso) {
    const c = slot.firstChild, k = b === null ? 'v0' : b < 0 ? 'vb' : 'f' + b;
    if (slot.dataset.k === k) return;
    slot.dataset.k = k;
    if (b === null) { slot.classList.add('vazio'); c.classList.add('oculta'); CA.face(c, 0); c.setAttribute('aria-label', 'Carta virada para baixo'); return; }
    slot.classList.remove('vazio');
    const gi = c.querySelector('.giro');
    if (b < 0) { CA.face(c, 0); c.setAttribute('aria-label', 'Carta virada para baixo'); c.classList.add('oculta'); return; }
    CA.face(c, b);
    if (atraso && !reduzido()) {
      gi.style.transitionDelay = atraso + 'ms';
      c.classList.add('oculta');
      void c.offsetWidth;
      c.classList.remove('oculta');
      setTimeout(() => { gi.style.transitionDelay = ''; }, atraso + 600);
    } else c.classList.remove('oculta');
  }

  let G = { n: 0, w: 0, h: 0 };   // geometria atual da mesa digital

  function assentosPos(n, a, b) {
    const r = [];
    for (let i = 0; i < n; i++) { const t = Math.PI / 2 + (i * 2 * Math.PI) / n; r.push([a * Math.cos(t), b * Math.sin(t)]); }
    return r;
  }

  function geometria(n, mw, mh) {
    const swMax = Math.max(112, Math.min(156, Math.floor(mw * 0.19)));
    const bwMax = Math.max(46, Math.min(80, Math.floor(mh * 0.115)));
    const medidas = (sw) => {
      const cw = Math.max(14, Math.floor(sw * 0.36)), fs = Math.max(11, Math.min(15, Math.round(sw * 0.105))), lh = Math.ceil(fs * 1.25);
      return { sw, cw, fs, sh: Math.ceil(cw * 1.4 + 3 * lh + 9) };
    };
    let melhor = null;
    for (let sw = Math.min(swMax, Math.floor(mw * 0.3)); sw >= 50; sw -= 2) {
      const md = medidas(sw), sh = md.sh;
      const a = (mw - sw) / 2 - 3, b = (mh - sh) / 2 - 3;
      if (a < 20 || b < 20) continue;
      const pts = assentosPos(n, a, b);
      let ok = true;
      for (let i = 0; i < n && ok; i++) for (let j = i + 1; j < n; j++) if (Math.abs(pts[i][0] - pts[j][0]) < sw + 4 && Math.abs(pts[i][1] - pts[j][1]) < sh + 4) { ok = false; break; }
      if (!ok) continue;
      for (const cols of [5, 3]) {
        for (let bw = bwMax; bw >= 22; bw -= 2) {
          const rows = cols === 5 ? 1 : 2, w = cols * bw + (cols - 1) * 3, h = rows * bw * 1.4 + (rows - 1) * 3 + 24;
          const livre = pts.every((p) => !(Math.abs(p[0]) < w / 2 + sw / 2 + 4 && Math.abs(p[1]) < h / 2 + sh / 2 + 4));
          if (livre) { melhor = Object.assign({ bw, cols, pts, a, b }, md); break; }
        }
        if (melhor) break;
      }
      if (melhor) break;
    }
    if (!melhor) {
      const md = medidas(50), a = (mw - 50) / 2 - 3, b = (mh - md.sh) / 2 - 3;
      melhor = Object.assign({ bw: 22, cols: 3, pts: assentosPos(n, a, b), a, b }, md, { cw: 18 });
    }
    return melhor;
  }

  function ajustar() {
    const lado = window.matchMedia('(orientation: landscape) and (min-width: 540px)').matches;
    const areaW = el.area.clientWidth;
    const hh = (document.querySelector('header') || {}).offsetHeight || 60;
    const vh = window.innerHeight || 700;
    const gap = parseFloat(getComputedStyle(el.area).columnGap) || 10;
    const colW = lado ? Math.max(200, areaW - $('#modo-btn').offsetWidth - gap) : areaW;
    if (E && E.fis) {
      el.mesa.style.setProperty('--mw', Math.floor(colW) + 'px');
      el.mesa.style.minHeight = '';
      return;
    }
    const n = E ? E.jog.length : 4;
    let mw, mh;
    if (lado) {
      mh = Math.max(260, Math.min(vh - hh - 24, 780));
      mw = Math.min(colW, Math.round(mh * 1.75));
    } else {
      mw = Math.max(200, Math.min(colW, 560));
      const k = n <= 2 ? 1.0 : n <= 4 ? 1.2 : n <= 6 ? 1.35 : 1.55;
      mh = Math.round(mw * k);
      mh = Math.max(260, Math.min(mh, Math.max(420, Math.round(vh * 0.86))));
    }
    mw = Math.floor(mw);
    el.mesa.style.setProperty('--mw', mw + 'px');
    el.mesa.style.setProperty('--mh', mh + 'px');
    const g = geometria(n, mw, mh);
    G = { n, w: mw, h: mh, g };
    el.dig.style.setProperty('--sw', g.sw + 'px');
    el.dig.style.setProperty('--cw', g.cw + 'px');
    el.dig.style.setProperty('--fs', g.fs + 'px');
    el.dig.style.setProperty('--bw', g.bw + 'px');
    el.dig.style.setProperty('--bcols', String(g.cols));
    Array.from(el.assentos.children).forEach((s, i) => {
      if (!g.pts[i]) return;
      s.style.left = (mw / 2 + g.pts[i][0]) + 'px';
      s.style.top = (mh / 2 + g.pts[i][1]) + 'px';
    });
    if (!el.tela.hidden) { const card = el.tela.querySelector('.tela-card'); if (card) el.mesa.style.minHeight = Math.ceil(card.offsetHeight + 18) + 'px'; }
  }
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(ajustar, 60); });
  window.addEventListener('orientationchange', () => setTimeout(ajustar, 200));

  /* monta os assentos e as cartas uma vez por partida */
  function montarMesa() {
    el.dig.hidden = !!E.fis;
    el.fis.hidden = !E.fis;
    el.assentos.innerHTML = '';
    el.board.innerHTML = '';
    if (E.fis) return;
    for (let k = 0; k < 5; k++) el.board.appendChild(slotEl());
    E.jog.forEach((j, i) => {
      const s = document.createElement('div');
      s.className = 'assento';
      s.dataset.i = i;
      s.innerHTML = '<div class="par"></div><b class="a-nome"></b><span class="a-fichas"></span><span class="a-estado"></span><span class="a-marca"></span>';
      s.querySelector('.par').append(slotEl(), slotEl());
      el.assentos.appendChild(s);
    });
    U.bd = 0;
  }

  /* --- texto de cada jogador --- */
  function estadoTxt(i, curto) {
    const j = E.jog[i], m = E.m;
    if (j.fora) return j.pos ? j.pos + 'º lugar' : 'Fora da mesa';
    if (!m || !m.dentro[i]) return j.fichas === 0 ? 'Sem fichas' : 'Esperando';
    if (m.res && E.fase !== 'mao') {
      let ganho = 0; m.res.pots.forEach((p) => { if (p.parte[i]) ganho += p.parte[i]; });
      if (ganho) return 'Ganhou ' + fmt(ganho);
    }
    if (m.dob[i]) return 'Desistiu';
    if (m.tudo[i]) return 'All-in';
    if (E.fase === 'mao' && m.ap[i] > 0) return curto ? fmt(m.ap[i]) : 'Aposta ' + fmt(m.ap[i]);
    if (E.fase === 'mao' && m.vista[i] >= 0 && m.pend === 'apostar') return 'Passou';
    return '';
  }
  const marcas = (i) => {
    const m = E.m, r = [];
    if (E.jog[i].id === E.btn) r.push('<i class="marca d" title="Dealer">D</i>');
    if (m && m.sb === i) r.push('<i class="marca sb" title="Blind pequeno">SB</i>');
    if (m && m.bb === i) r.push('<i class="marca bb" title="Blind grande">BB</i>');
    return r.join('');
  };
  const vencedoresDaMao = () => {
    const s = new Set();
    if (E.m && E.m.res && E.fase !== 'mao') E.m.res.pots.forEach((p) => p.ganhadores.forEach((x) => s.add(x)));
    return s;
  };
  const vezAtual = () => (E && E.fase === 'mao' && E.m && E.m.pend === 'apostar' ? E.m.vez : -1);

  function pintarDig() {
    const m = E.m, venc = vencedoresDaMao(), vez = vezAtual();
    const mostra = m && m.res && !m.res.unico ? new Set(m.res.mostra) : new Set();
    const solo = unico() ? eu() : -2;
    Array.from(el.assentos.children).forEach((s, i) => {
      const j = E.jog[i];
      s.classList.toggle('vez', i === vez);
      s.classList.toggle('dob', !!(m && m.dentro[i] && m.dob[i] && !j.fora));
      s.classList.toggle('fora', j.fora);
      s.classList.toggle('venc', venc.has(i));
      s.querySelector('.a-nome').textContent = j.nome;
      s.querySelector('.a-fichas').textContent = fmt(j.fichas);
      const curto = !!(G.g && G.g.sw < 78), ae = s.querySelector('.a-estado');
      ae.textContent = estadoTxt(i, curto);
      ae.classList.toggle('ap', !!(curto && E.fase === 'mao' && m && m.dentro[i] && !m.dob[i] && !m.tudo[i] && m.ap[i] > 0));
      s.querySelector('.a-marca').innerHTML = j.fora ? '' : marcas(i);
      const slots = s.querySelectorAll('.slot');
      const naMao = !!(m && m.maos[i] && m.dentro[i] && !m.dob[i] && !j.fora);
      s.setAttribute('aria-label', j.nome + ', ' + fmt(j.fichas) + ' fichas' + (estadoTxt(i) ? ', ' + estadoTxt(i) : ''));
      slots.forEach((sl, q) => {
        if (!naMao) pintarCarta(sl, null);
        else if (mostra.has(i) || i === solo) pintarCarta(sl, m.maos[i][q]);
        else pintarCarta(sl, -1);
      });
    });
    const com = m ? m.com : [];
    const slots = el.board.querySelectorAll('.slot');
    const antes = U.bd;
    slots.forEach((sl, k) => { if (k < com.length) pintarCarta(sl, com[k], Math.max(0, k - antes) * 130 + (k >= antes ? 40 : 0)); else pintarCarta(sl, null); });
    U.bd = com.length;
    el.poteCentro.textContent = E.fase === 'mao' || (m && m.res) ? 'Pote ' + fmt(m ? P.poteTotal(m) : 0) : 'Pote 0';
  }

  function pintarFis() {
    const m = E.m, venc = vencedoresDaMao(), vez = vezAtual();
    el.fisPote.textContent = 'Pote ' + fmt(m && E.fase !== 'entre' ? P.poteTotal(m) : (m && m.res ? P.poteTotal(m) : 0));
    el.fisRua.textContent = ruaTxt();
    el.fisLista.innerHTML = E.jog.map((j, i) => {
      if (j.fora) return '';
      const est = estadoTxt(i);
      const cls = ['fis-j'];
      if (i === vez) cls.push('vez');
      if (m && m.dentro[i] && m.dob[i]) cls.push('dob');
      if (venc.has(i)) cls.push('venc');
      return '<li class="' + cls.join(' ') + '"><span class="a-marca">' + marcas(i) + '</span><span class="fis-nome">' + esc(j.nome) + '</span><span class="fis-fichas">' + fmt(j.fichas) + '</span>' +
        (est ? '<span class="fis-sub">' + esc(est) + '</span>' : '') + '</li>';
    }).join('');
    const fila = E.fila && E.fila.length ? '<li class="fis-j"><span></span><span class="fis-sub" style="grid-column:1/-1">Entram na próxima mão: ' + esc(E.fila.map((x) => x.nome).join(', ')) + '</span></li>' : '';
    el.fisLista.insertAdjacentHTML('beforeend', fila);
  }

  function ruaTxt() {
    const m = E.m;
    if (!m) return 'Mesa pronta';
    if (E.fase === 'entre' || E.fase === 'fim') return m.res ? 'Fim da mão ' + m.n : 'Mesa pronta';
    if (m.pend === 'vencedor') return 'Showdown';
    return RUAS[Math.min(3, m.rua)];
  }

  function pintarHud() {
    const m = E.m;
    el.r1.textContent = 'Pote';
    el.v1.textContent = m && (E.fase === 'mao') ? fmt(P.poteTotal(m)) : '0';
    el.v2.textContent = ruaTxt();
    el.v3.textContent = fmt(E.cfg.sb) + '/' + fmt(E.cfg.bb) + (E.cfg.ante > 0 ? ' +' + fmt(E.cfg.ante) : '');
  }

  const MINI_SVG = '<svg viewBox="0 0 46 46" width="46" height="46" aria-hidden="true"><rect x="5" y="9" width="21" height="29" rx="3" fill="#fff" stroke="#0d3c75" stroke-width="2" transform="rotate(-10 15 24)"/><text x="9" y="26" font-size="15" font-weight="800" fill="#c62828" transform="rotate(-10 15 24)">A</text><rect x="19" y="8" width="21" height="29" rx="3" fill="#fff" stroke="#0d3c75" stroke-width="2" transform="rotate(8 29 22)"/><text x="23" y="26" font-size="15" font-weight="800" fill="#14263a" transform="rotate(8 29 22)">K</text></svg>';
  const MINI_FIS = '<svg viewBox="0 0 46 46" width="46" height="46" aria-hidden="true"><ellipse cx="23" cy="30" rx="16" ry="6" fill="#c62828" stroke="#0d3c75" stroke-width="2"/><ellipse cx="23" cy="24" rx="16" ry="6" fill="#1976d2" stroke="#0d3c75" stroke-width="2"/><ellipse cx="23" cy="18" rx="16" ry="6" fill="#fff" stroke="#0d3c75" stroke-width="2"/><ellipse cx="23" cy="18" rx="9" ry="3" fill="none" stroke="#0d3c75" stroke-width="1.5"/></svg>';

  function pintarModo() {
    el.modoNome.textContent = E.fis ? 'Mesa com cartas reais' : 'Poker no aparelho';
    el.modoMini.innerHTML = E.fis ? MINI_FIS : MINI_SVG;
    const ativos = vivosJ().length;
    if (E.fis) el.modoSub.textContent = ativos + ' jogadores · mão ' + Math.max(E.nmao, 0);
    else {
      const rob = E.jog.filter((j) => j.tipo === 'robo').length;
      el.modoSub.textContent = E.jog.length + ' jogadores' + (rob ? ' · ' + (new Set(E.jog.filter((j) => j.tipo === 'robo').map((j) => j.nivel)).size > 1 ? 'robôs variados' : 'robôs ' + NOMES_NIVEL[E.jog.find((j) => j.tipo === 'robo').nivel]) : ' · só pessoas') + ' · mão ' + Math.max(E.nmao, 0);
    }
  }

  function pintarChips() {
    const vez = vezAtual();
    el.chipsJog.innerHTML = E.jog.map((j, i) => {
      const cls = ['chip-j'];
      if (i === vez) cls.push('vez');
      if (j.fora) cls.push('morto');
      let sub = j.tipo === 'robo' ? 'Robô ' + NOMES_NIVEL[j.nivel] : (E.fis ? '' : 'Pessoa');
      const est = estadoTxt(i);
      const partes = [fmt(j.fichas) + ' fichas'];
      if (sub) partes.push(sub);
      if (est && !j.fora) partes.push(est);
      if (j.fora && j.pos) partes.push(j.pos + 'º lugar');
      if (E.fis && j.fora) return '';
      return '<div class="' + cls.join(' ') + '" role="listitem"><b>' + esc(j.nome) + '</b><small>' + esc(partes.join(' · ')) + '</small></div>';
    }).join('');
  }

  function registrar(t, rua) {
    U.diario.push((rua ? '#' : '') + t);
    if (U.diario.length > 40) U.diario.splice(0, U.diario.length - 40);
  }
  function pintarDiario() {
    const L = U.diario.slice(-14).reverse();
    el.diario.innerHTML = L.length ? L.map((t) => t.charAt(0) === '#' ? '<li class="rua">' + esc(t.slice(1)) + '</li>' : '<li>' + esc(t) + '</li>').join('') : '<li class="vazio">As jogadas aparecem aqui.</li>';
  }
  function descrever(e) {
    const n = e.s >= 0 ? nome(e.s) : '';
    switch (e.k) {
      case 'ante': return n + ' pagou o ante (' + fmt(e.v) + ').';
      case 'sb': return n + ' pagou o blind pequeno (' + fmt(e.v) + ').';
      case 'bb': return n + ' pagou o blind grande (' + fmt(e.v) + ').';
      case 'fold': return n + ' desistiu.';
      case 'check': return n + ' passou.';
      case 'call': return n + ' pagou (' + fmt(e.v) + ' na rodada).';
      case 'bet': return n + ' apostou ' + fmt(e.v) + '.';
      case 'raise': return n + ' aumentou para ' + fmt(e.v) + '.';
      case 'allin': return n + ' foi all-in (' + fmt(e.v) + ').';
      case 'volta': return 'Voltaram ' + fmt(e.v) + ' para ' + n + ' (ninguém pagou).';
      case 'corre': return 'Todos em all-in: as cartas que faltam vão para a mesa.';
      case 'ganha': return n + ' ganhou ' + fmt(e.v) + '.';
      case 'sai': return n + ' saiu da mesa.';
      default: return '';
    }
  }
  function atualizarDiario() {
    const m = E.m;
    if (!m) return;
    if (U.nmao !== m.n) {
      U.nmao = m.n; U.logPos = 0;
      registrar('Mão ' + m.n + (E.jog[m.btn] ? ' · dealer: ' + nome(m.btn) : ''), true);
    }
    for (; U.logPos < m.log.length; U.logPos++) {
      const e = m.log[U.logPos];
      if (e.k === 'rua') { registrar(RUAS[Math.min(3, e.v)] + (E.fis ? '' : ': ' + m.com.map((c) => CA.nome(c)).join(', ')), true); continue; }
      const t = descrever(e);
      if (t) registrar(t);
    }
  }

  function pintar() {
    if (!E) return;
    atualizarDiario();
    pintarModo();
    pintarHud();
    if (E.fis) pintarFis(); else pintarDig();
    pintarMinhas();
    pintarAcao();
    pintarChips();
    pintarDiario();
    pintarFerramentas();
    pintarAjudas();
  }

  /* --- as minhas cartas (só quem está na vez, depois de tocar em Estou pronto) --- */
  let minhasSlots = [];
  function montarMinhas() {
    el.minhasCartas.innerHTML = '';
    minhasSlots = [slotEl(), slotEl()];
    minhasSlots.forEach((s) => el.minhasCartas.appendChild(s));
  }
  function nomeDaMao(mao, com) {
    if (com.length >= 3) return P.nomeMao(P.avaliar(mao.concat(com)));
    const a = P.rango(mao[0]), b = P.rango(mao[1]), hi = Math.max(a, b), lo = Math.min(a, b);
    if (a === b) return 'Par de ' + P.pl(a);
    return cap(P.sg(hi)) + ' e ' + P.sg(lo) + (P.naipe(mao[0]) === P.naipe(mao[1]) ? ', do mesmo naipe' : '');
  }
  function pintarMinhas() {
    const m = E.m;
    const ok = !E.fis && E.fase === 'mao' && m && U.ver >= 0 && m.maos[U.ver] && m.dentro[U.ver];
    el.minhas.hidden = !ok;
    if (!ok) { minhasSlots.forEach((s) => pintarCarta(s, null)); return; }
    const mao = m.maos[U.ver];
    minhasSlots.forEach((s, q) => pintarCarta(s, mao[q]));
    el.minhasRot.textContent = unico() ? 'Suas cartas' : 'Cartas de ' + nome(U.ver);
    el.minhasMao.textContent = m.dob[U.ver] ? 'Você desistiu desta mão' : (prefs.nomemao === 'sim' ? nomeDaMao(mao, m.com) : '');
    el.minhasMao.hidden = !el.minhasMao.textContent;
  }

  /* ==========================================================================
     3. Painel de ação e ferramentas
     ========================================================================== */
  const unid = () => { const bb = E.cfg.bb; return bb < 10 ? 1 : bb < 40 ? 5 : bb < 200 ? 10 : bb < 1000 ? 50 : 100; };
  const valDeIdx = (L, k) => Math.min(L.max, L.min + k * unid());
  const nPassos = (L) => Math.max(0, Math.ceil((L.max - L.min) / unid()));
  const idxDeVal = (L, v) => Math.max(0, Math.min(nPassos(L), Math.round((v - L.min) / unid())));
  const arred = (L, v) => Math.max(L.min, Math.min(L.max, v >= L.max ? L.max : L.min + Math.round((v - L.min) / unid()) * unid()));
  const ate = (L, f) => arred(L, L.aposta === 0 ? L.pote * f : L.aposta + f * (L.pote + L.aPagar));

  let htmlAcao = '';
  function rotuloSubir(L) {
    const v = U.valor;
    if (v >= L.max) return 'All-in ' + fmt(L.max);
    return (L.aposta === 0 ? 'Apostar ' : 'Aumentar para ') + fmt(v);
  }

  function painelApostar() {
    const L = P.legais(E);
    if (!L) return '';
    const i = L.vez;
    const podeAgir = E.fis || (ehHumano(i) && U.ver === i);
    if (!podeAgir) return '';
    const chave = E.m.n + ':' + E.m.log.length;
    if (U.chave !== chave) { U.chave = chave; U.valor = L.min; }
    U.valor = Math.max(L.min, Math.min(L.max, U.valor));
    const call = L.check ? 'Passar' : (L.tudoNoCall ? 'Pagar tudo (' + fmt(L.aPagar) + ')' : 'Pagar ' + fmt(L.aPagar));
    let h = '<div class="acoes">' +
      '<button type="button" class="btn perigo" data-a="fold"' + (L.check ? ' disabled title="Passar não custa nada"' : '') + '>Desistir</button>' +
      '<button type="button" class="btn btn-primary" data-a="' + (L.check ? 'check' : 'call') + '">' + call + '</button>' +
      '<button type="button" class="btn btn-secondary" id="btn-subir" data-a="raise"' + (L.sobe ? '' : ' disabled') + '>' + (L.sobe ? '' : 'Aumentar') + '</button></div>';
    if (L.sobe) {
      h += '<div class="subir"><div class="subir-topo"><span class="nivel-rotulo">' + (L.aposta === 0 ? 'Valor da aposta' : 'Aumentar para') + '</span><span class="subir-valor" id="sub-val"></span></div>' +
        '<input type="range" id="sub-r" min="0" max="' + nPassos(L) + '" step="1" value="0" aria-label="Valor da aposta"' + (nPassos(L) === 0 ? ' disabled' : '') + ' />' +
        '<div class="atalhos"><button type="button" class="seg-btn" data-q="min">Mín</button><button type="button" class="seg-btn" data-q="m">½ pote</button><button type="button" class="seg-btn" data-q="p">Pote</button><button type="button" class="seg-btn" data-q="t">Tudo</button></div></div>';
    }
    return h;
  }
  function ligarSubir() {
    const L = P.legais(E);
    const r = $('#sub-r');
    if (!L || !r) return;
    const mostrar = () => {
      const v = $('#sub-val'), b = $('#btn-subir');
      if (v) v.textContent = fmt(U.valor);
      if (b) b.textContent = rotuloSubir(L);
    };
    r.value = String(idxDeVal(L, U.valor));
    mostrar();
    r.oninput = () => { U.valor = valDeIdx(L, +r.value); mostrar(); };
    el.acao.querySelectorAll('[data-q]').forEach((b) => {
      b.onclick = () => {
        const q = b.dataset.q;
        U.valor = q === 'min' ? L.min : q === 'm' ? ate(L, 0.5) : q === 'p' ? ate(L, 1) : L.max;
        r.value = String(idxDeVal(L, U.valor)); mostrar();
        ON.som('toque');
      };
    });
  }

  function resumoPotes() {
    const m = E.m;
    if (!m || !m.res) return '';
    const mostrou = !m.res.unico && Object.keys(m.res.nomes || {}).length;
    let h = '<div class="res">';
    m.res.pots.forEach((p, k) => {
      const q = p.ganhadores.map((s) => esc(nome(s)) + (m.res.nomes && m.res.nomes[s] ? ' (' + esc(m.res.nomes[s]) + ')' : '') + (p.ganhadores.length > 1 ? ' +' + fmt(p.parte[s]) : '')).join(', ');
      h += '<div class="res-lin"><span>' + (m.res.pots.length > 1 ? (k === 0 ? 'Pote principal' : 'Pote lateral ' + k) : 'Pote') + '</span><b>' + fmt(p.valor) + '</b><small>' + q + '</small></div>';
    });
    if (mostrou) {
      const outros = m.res.mostra.filter((s) => !m.res.pots.some((p) => p.ganhadores.indexOf(s) >= 0));
      outros.forEach((s) => { h += '<div class="res-lin"><span>' + esc(nome(s)) + '</span><b></b><small>' + esc(m.res.nomes[s] || '') + '</small></div>'; });
    }
    return h + '</div>';
  }

  function painelEntre() {
    const m = E.m;
    if (E.fis) {
      if (!m || !m.res) return '<button type="button" class="btn btn-primary" data-a="comecar">Começar a mão ' + (E.nmao + 1) + '</button>';
      return resumoPotes() + '<button type="button" class="btn btn-primary" data-a="comecar">Próxima mão (' + (E.nmao + 1) + ')</button>';
    }
    if (U.esp) return resumoPotes() + '<button type="button" class="btn btn-secondary" data-a="acelerar">Acelerar até o fim</button>';
    return resumoPotes() + '<button type="button" class="btn btn-primary" data-a="prox" data-foco>Próxima mão</button>';
  }
  function painelDistribuir() {
    const m = E.m;
    const t = m.corre ? 'Todos estão all-in. Coloque na mesa as cartas que faltam, até o river.' :
      m.rua === 1 ? 'Abra o flop: 3 cartas na mesa.' : m.rua === 2 ? 'Abra o turn: mais 1 carta na mesa.' : 'Abra o river: mais 1 carta na mesa.';
    return '<p class="vez-aviso">' + t + '</p><button type="button" class="btn btn-primary" data-a="dist">' + (m.corre ? 'Cartas na mesa, ver quem ganhou' : 'Cartas na mesa, continuar') + '</button>';
  }
  function painelVencedor() {
    return '<p class="vez-aviso">Mostrem as cartas. Diga quem ganhou cada pote.</p><button type="button" class="btn btn-primary" data-a="venc">Quem ganhou?</button>';
  }

  function textoDica() {
    const m = E.m;
    if (E.fase === 'fim') return '';
    if (E.fase === 'entre') {
      if (E.fis && (!m || !m.res)) return 'Embaralhe, distribua duas cartas para cada um e toque em Começar a mão.';
      return '';
    }
    if (m.pend === 'apostar') {
      const L = P.legais(E), i = L.vez, quem = nome(i);
      if (!E.fis && E.jog[i].tipo === 'robo') return quem + ' está pensando...';
      const sobre = 'Pote: ' + fmt(L.pote) + '.';
      if (!E.fis && nHumanos() > 1 && U.ver !== i) return 'Vez de ' + quem + '.';
      return (E.fis || nHumanos() > 1 ? 'Vez de ' + quem + '. ' : 'Sua vez. ') + (L.check ? 'Ninguém apostou: você pode passar. ' : 'Para continuar: pagar ' + fmt(L.aPagar) + (L.tudoNoCall ? ' (todas as suas fichas)' : '') + '. ') + sobre;
    }
    return '';
  }

  function pintarAcao() {
    let h = '';
    const m = E.m;
    if (E.fase === 'entre') h = painelEntre();
    else if (E.fase === 'mao' && m) {
      if (m.pend === 'apostar') h = painelApostar();
      else if (m.pend === 'distribuir') h = painelDistribuir();
      else if (m.pend === 'vencedor') h = painelVencedor();
    }
    el.dica.textContent = textoDica();
    if (h !== htmlAcao) { htmlAcao = h; el.acao.innerHTML = h; const f = el.acao.querySelector('[data-foco]'); if (f && !ON.modal.aberto() && el.tela.hidden) setTimeout(() => f.focus({ preventScroll: true }), 30); }
    ligarSubir();
  }

  el.acao.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-a]');
    if (!b || b.disabled || !E) return;
    const a = b.dataset.a;
    if (a === 'fold' || a === 'check' || a === 'call') { executar({ k: a }); return; }
    if (a === 'raise') {
      const L = P.legais(E);
      if (!L || !L.sobe) return;
      executar(U.valor >= L.max ? { k: 'allin' } : { k: 'raise', para: U.valor });
      return;
    }
    if (a === 'prox') { proxMao(); return; }
    if (a === 'acelerar') { U.rapido = true; ON.som('toque'); dizer('Os robôs jogam bem mais depressa agora.'); avancar(); return; }
    if (a === 'comecar') { fisComecar(); return; }
    if (a === 'dist') { fisDist(); return; }
    if (a === 'venc') { abrirVenc(); return; }
  });

  function pintarFerramentas() {
    const fis = !!E.fis;
    el.undo.hidden = !fis; el.jogBtn.hidden = !fis; el.blindsBtn.hidden = !fis;
    if (fis) {
      el.undo.disabled = !U.undo.length;
      el.undo.innerHTML = 'Retroceder ação' + (U.undo.length ? '<small>' + U.undo.length + ' para trás</small>' : '');
      el.blindsBtn.innerHTML = 'Blinds<small>' + fmt(E.cfg.sb) + '/' + fmt(E.cfg.bb) + '</small>';
    }
  }

  function pintarAjudas() {
    $('#lin-vel').hidden = !!E.fis || E.jog.every((j) => j.tipo === 'humano');
    $('#lin-mao').hidden = !!E.fis;
    $('#op-vel').querySelectorAll('.seg-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === prefs.vel)));
    $('#op-nomemao').querySelectorAll('.seg-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === prefs.nomemao)));
    const t = E.fis ? 'Mesa com cartas reais: sem ajustes' : 'Robôs ' + ({ rapido: 'rápidos', normal: 'em velocidade normal', lento: 'lentos' }[prefs.vel]) + (prefs.nomemao === 'sim' ? ', com nome da mão' : '');
    $('#ajuda-atual').textContent = t;
  }
  $('#op-vel').addEventListener('click', (ev) => { const b = ev.target.closest('.seg-btn'); if (!b) return; prefs.vel = b.dataset.v; gravarPrefs(); pintarAjudas(); ON.som('toque'); });
  $('#op-nomemao').addEventListener('click', (ev) => { const b = ev.target.closest('.seg-btn'); if (!b) return; prefs.nomemao = b.dataset.v; gravarPrefs(); pintar(); ON.som('toque'); });

  /* ==========================================================================
     4. Andamento da partida
     ========================================================================== */
  const tempoBot = () => (U.rapido ? 25 : VEL[prefs.vel]);
  const SOM_ACAO = { fold: 'toque', check: 'toque', call: 'mover', raise: 'mover', allin: 'captura' };

  function empilhar() {
    if (!E.fis) return;
    U.undo.push(JSON.stringify({ E, d: U.diario.slice(), lp: U.logPos, nm: U.nmao, ab: U.abriuVenc, fm: U.fim, bd: U.bd }));
    if (U.undo.length > 40) U.undo.shift();
  }

  /* uma jogada de quem está na vez (pessoa ou robô) */
  function executar(a) {
    if (!E || E.fase !== 'mao' || !E.m || E.m.pend !== 'apostar') return false;
    const i = E.m.vez, rua0 = E.m.rua, ehPessoa = E.jog[i].tipo === 'humano';
    empilhar();
    const r = P.aplicar(E, a);
    if (!r.ok) { if (E.fis) U.undo.pop(); dizer(r.erro || 'Jogada inválida.'); ON.som('erro'); return false; }
    ON.som(SOM_ACAO[a.k] || 'toque');
    if (ehPessoa) ON.vibrar('leve');
    if (E.m.rua > rua0) ON.som('junta');
    if (!E.fis && ehPessoa && nHumanos() > 1) U.ver = -1;
    dizer('');
    avancar();
    return true;
  }

  function jogaBot(i) {
    if (!E || E.fase !== 'mao' || !E.m || E.m.pend !== 'apostar' || E.m.vez !== i) { avancar(); return; }
    let a = null;
    try { a = RB.decidir(P.visao(E, i)); } catch (e) { a = null; }
    if (!a || !executar(a)) {
      const L = P.legais(E);
      executar(L && L.check ? { k: 'check' } : { k: 'fold' });
    }
  }

  function avancar() {
    clearTimeout(U.botT);
    if (!E || U.pausa) return;
    gravar();
    pintar();
    if (E.fase === 'fim') { fimDaPartida(); return; }
    if (E.fase === 'entre') { fimDaMao(); return; }
    const m = E.m;
    if (E.fis) {
      if (m.pend === 'vencedor' && U.abriuVenc !== m.n) { U.abriuVenc = m.n; abrirVenc(); }
      return;
    }
    if (m.pend === 'apostar') {
      const i = m.vez;
      if (E.jog[i].tipo === 'robo') { U.botT = setTimeout(() => jogaBot(i), tempoBot()); return; }
      if (nHumanos() > 1 && U.ver !== i) { mostrarPassar(i); return; }
      if (U.ver !== i) { U.ver = i; pintar(); }
    }
  }

  function mostrarPassar(i) {
    mostrarTela({
      titulo: 'Passe o aparelho',
      corpo: '<p>Agora é a vez de <b>' + esc(nome(i)) + '</b>.</p><p class="tela-sub">As outras pessoas não devem olhar a tela. As cartas só aparecem depois do toque.</p>',
      opaca: true, btn: 'Estou pronto',
      fn: () => { U.ver = i; fecharTela(); pintar(); }
    });
  }

  function resumoDaMao() {
    const m = E.m;
    if (!m || !m.res) return '';
    const g = {};
    m.res.pots.forEach((p) => p.ganhadores.forEach((s) => { g[s] = (g[s] || 0) + p.parte[s]; }));
    const ids = Object.keys(g).map(Number);
    return ids.map((s) => nome(s) + ' ganhou ' + fmt(g[s]) + (m.res.nomes && m.res.nomes[s] ? ' com ' + m.res.nomes[s].toLowerCase() : '')).join('. ') + '.';
  }

  function fimDaMao() {
    const m = E.m;
    if (!m || !m.res) return;
    if (U.fim !== m.n) {
      U.fim = m.n;
      const ganhos = {};
      m.res.pots.forEach((p) => p.ganhadores.forEach((s) => { ganhos[s] = (ganhos[s] || 0) + p.parte[s]; }));
      const t = resumoDaMao();
      dizer(t, 12000);
      registrar(t);
      if (!E.fis) {
        const novos = E.elim.length - (U.elimVisto || 0);
        U.elimVisto = E.elim.length;
        const meu = unico() ? eu() : -1;
        const ganhou = meu >= 0 && ganhos[meu] !== undefined;
        contar('mao', { ganhou, pote: ganhou ? ganhos[meu] : 0 });
        if (novos > 0) {
          const robosFora = E.elim.slice(-novos).filter((id) => { const j = E.jog.find((x) => x.id === id); return j && j.tipo === 'robo'; }).length;
          if (robosFora && unico() && !E.jog[eu() < 0 ? 0 : eu()].fora) contar('elim', { n: robosFora });
        }
        if (unico()) { ON.som(ganhou ? 'acerto' : 'toque'); if (ganhou) ON.vibrar('toque'); }
        else ON.som('acerto');
        const semHumano = nHumanos() === 0;
        if (semHumano && !U.esp) {
          U.esp = true;
          const h = E.jog.findIndex((j) => j.tipo === 'humano');
          dizer((h >= 0 ? nome(h) + ' foi eliminado' + (E.jog[h].pos ? ' em ' + E.jog[h].pos + 'º lugar' : '') + '. ' : '') + 'A partida continua só entre os robôs.', 9000);
        }
      } else {
        contar('mao', {});
        ON.som('acerto');
      }
      pintar();
    }
    if (!E.fis && nHumanos() === 0) U.botT = setTimeout(proxMao, U.rapido ? 150 : 1700);
  }

  function proxMao() {
    if (!E || E.fase !== 'entre') return;
    clearTimeout(U.botT);
    const nv = E.cfg.nivel;
    if (!E.fis) P.reforcar(E);
    const r = P.novaMao(E);
    if (!r.ok) { dizer(r.erro || 'Não foi possível começar a mão.'); return; }
    if (!E.fis && E.cfg.nivel > nv) dizer('Os blinds subiram para ' + fmt(E.cfg.sb) + '/' + fmt(E.cfg.bb) + '.', 8000);
    if (!E.fis) U.ver = -1;
    U.bd = 0;
    U.valor = 0; U.chave = '';
    avancar();
  }

  function fimDaPartida() {
    clearTimeout(U.botT);
    const venc = E.jog.findIndex((j) => j.id === E.venc);
    const meu = unico() ? eu() : -1;
    const euVenci = meu >= 0 && venc === meu;
    if (U.fimPartida !== E.nmao) {
      U.fimPartida = E.nmao;
      contar('mao', { ganhou: false, pote: 0 });
      contar('fim', { venc });
      sdel(LS.jogo);
      pintar();
      ON.som(euVenci || (nHumanos() > 1 && venc >= 0 && ehHumano(venc)) ? 'vitoria' : 'derrota');
      ON.vibrar(euVenci ? 'vitoria' : 'derrota');
    }
    const ord = E.jog.map((j, i) => ({ i, p: j.id === E.venc ? 1 : (j.pos || 99) })).sort((a, b) => a.p - b.p);
    let h = '<div class="res"><p class="res-motivo">' + esc(resumoDaMao()) + '</p>';
    ord.forEach((o) => { h += '<div class="res-lin"><span>' + o.p + 'º ' + esc(nome(o.i)) + '</span><b>' + fmt(E.jog[o.i].fichas) + '</b>' + (E.jog[o.i].tipo === 'robo' ? '<small>Robô ' + NOMES_NIVEL[E.jog[o.i].nivel] + '</small>' : '') + '</div>'; });
    h += '</div>';
    mostrarTela({
      titulo: euVenci ? 'Você venceu a partida!' : (meu >= 0 ? 'Fim de partida' : nome(venc) + ' venceu a partida!'),
      corpo: (euVenci ? '<p>Você ficou com todas as fichas depois de ' + E.nmao + ' mãos.</p>' : '<p>' + esc(nome(venc)) + ' ficou com todas as fichas depois de ' + E.nmao + ' mãos.</p>') + h,
      opaca: false, btn: 'Nova partida', btn2: 'Ver a mesa',
      fn: () => { fecharTela(); novaPartida(opcoes()); },
      fn2: () => { fecharTela(); }
    });
  }

  /* ==========================================================================
     5. Mesa com cartas reais
     ========================================================================== */
  function snapshot() { return JSON.parse(JSON.stringify(E)); }

  function fisComecar() {
    if (E.fase !== 'entre') return;
    empilhar();
    const antes = E.cfg.bb;
    if (E.fmpn > 0 && E.nmao >= 1 && E.nmao % E.fmpn === 0) { P.proximoNivel(E); dizer('Os blinds subiram para ' + fmt(E.cfg.sb) + '/' + fmt(E.cfg.bb) + '.', 9000); }
    void antes;
    const r = P.novaMao(E);
    if (!r.ok) { U.undo.pop(); dizer(r.erro || 'Não foi possível começar a mão.'); return; }
    ON.som('toque');
    U.valor = 0; U.chave = '';
    avancar();
  }
  function fisDist() {
    empilhar();
    const r = P.distribuida(E);
    if (!r.ok) { U.undo.pop(); dizer(r.erro); return; }
    ON.som('junta');
    avancar();
  }

  function retroceder() {
    if (!E || !E.fis || !U.undo.length) return;
    let snap;
    try { snap = JSON.parse(U.undo.pop()); } catch (e) { return; }
    if (!snap || !P.validar(snap.E)) { dizer('Não deu para desfazer essa ação.'); return; }
    E = snap.E; U.diario = snap.d || []; U.logPos = snap.lp || 0; U.nmao = snap.nm === undefined ? -1 : snap.nm;
    U.abriuVenc = snap.ab === undefined ? -1 : snap.ab; U.fim = snap.fm; U.bd = snap.bd || 0;
    U.chave = ''; htmlAcao = '';
    registrar('Ação desfeita.');
    ON.som('toque'); ON.vibrar('leve');
    dizer('Ação desfeita.');
    ON.modal.aberto() && ON.modal.fechar();
    avancar();
  }
  el.undo.addEventListener('click', retroceder);

  /* --- quem ganhou cada pote --- */
  let vencSel = [];
  function abrirVenc() {
    const m = E.m;
    if (!m || m.pend !== 'vencedor') return;
    vencSel = m.pots.map(() => []);
    const pot = (p, k) => '<div class="pote-bloco"><h4>' + (m.pots.length > 1 ? (k === 0 ? 'Pote principal' : 'Pote lateral ' + k) : 'Pote') + ': ' + fmt(p.valor) + ' fichas</h4>' +
      '<div class="seg seg-wrap" role="group" aria-label="Quem ganhou este pote">' + p.el.map((s) => '<button type="button" class="seg-btn" data-p="' + k + '" data-s="' + s + '" aria-pressed="false">' + esc(nome(s)) + '</button>').join('') + '</div>' +
      (p.el.length === 1 ? '' : '<p class="aviso-modal">Se der empate, marque mais de uma pessoa: o pote é dividido.</p>') + '</div>';
    $('#venc-corpo').innerHTML = (m.pots.length > 1 ? '<p class="aviso-modal">Houve all-in com fichas diferentes, então há mais de um pote. Marque quem ganhou cada um.</p>' : '<p class="aviso-modal">Mostrem as cartas na mesa e marque quem fez a melhor mão.</p>') + m.pots.map(pot).join('');
    $('#venc-ok').disabled = true;
    // pote com um único candidato já vem marcado
    m.pots.forEach((p, k) => { if (p.el.length === 1) { vencSel[k] = [p.el[0]]; const b = $('#venc-corpo [data-p="' + k + '"]'); if (b) b.setAttribute('aria-pressed', 'true'); } });
    $('#venc-ok').disabled = !vencSel.every((x) => x.length);
    ON.modal.abrir('venc-modal');
  }
  $('#venc-corpo').addEventListener('click', (ev) => {
    const b = ev.target.closest('.seg-btn'); if (!b) return;
    const k = +b.dataset.p, s = +b.dataset.s, i = vencSel[k].indexOf(s);
    if (i >= 0) vencSel[k].splice(i, 1); else vencSel[k].push(s);
    b.setAttribute('aria-pressed', String(i < 0));
    $('#venc-ok').disabled = !vencSel.every((x) => x.length);
    ON.som('toque');
  });
  $('#venc-ok').addEventListener('click', () => {
    if (!E || !E.m || E.m.pend !== 'vencedor') return;
    empilhar();
    const r = P.vencedores(E, vencSel.map((x) => x.slice().sort((a, b) => a - b)));
    if (!r.ok) { U.undo.pop(); dizer(r.erro); ON.som('erro'); return; }
    ON.modal.fechar();
    avancar();
  });

  /* --- jogadores e fichas --- */
  const fisEntre = () => E.fase === 'entre';
  function desenharJog() {
    const entre = fisEntre();
    let h = '<p class="aviso-modal">' + (entre ? 'Você pode corrigir fichas, trocar nomes, tirar ou chamar gente e escolher o dealer.' : 'No meio da mão só dá para tirar alguém da mesa (ele desiste da mão) ou chamar alguém para a próxima. Fichas só entre uma mão e outra.') + '</p>';
    E.jog.forEach((j, i) => {
      if (j.fora) return;
      h += '<div class="lin-jog" data-i="' + i + '">' +
        '<div class="campo"><label for="jn' + i + '">Nome</label><input id="jn' + i + '" type="text" maxlength="12" value="' + esc(j.nome) + '" /></div>' +
        '<div class="campo"><label for="jf' + i + '">Fichas</label><input id="jf' + i + '" type="number" inputmode="numeric" min="0" step="1" value="' + j.fichas + '"' + (entre ? '' : ' disabled') + ' /></div>' +
        '<div class="acoes-lin"><button type="button" class="btn btn-secondary" data-g="salvar">Salvar</button>' +
        (entre ? '<button type="button" class="btn btn-secondary" data-g="dealer">' + (j.id === E.btn ? 'É o dealer da última mão' : 'Dealer na próxima mão') + '</button>' : '') +
        '<button type="button" class="btn btn-secondary" data-g="tirar">Tirar da mesa</button></div></div>';
    });
    const cheia = vivosJ().length + (E.fila ? E.fila.length : 0) >= P.MAX_FIS;
    h += '<div class="novo-jog"><h3 class="sec-tit">Chamar mais um jogador</h3>' +
      '<div class="campos"><div class="campo"><label for="nj-nome">Nome</label><input id="nj-nome" type="text" maxlength="12" /></div>' +
      '<div class="campo"><label for="nj-fichas">Fichas</label><input id="nj-fichas" type="number" inputmode="numeric" min="1" step="1" value="' + E.cfg.ini + '" /></div>' +
      '<div class="campo"><label for="nj-depois">Senta depois de</label><select id="nj-depois">' + E.jog.filter((j) => !j.fora).map((j) => '<option value="' + j.id + '">' + esc(j.nome) + '</option>').join('') + '</select></div></div>' +
      '<p class="aviso-modal erro" id="nj-erro" role="alert" hidden></p>' +
      '<button type="button" class="btn btn-secondary" data-g="novo"' + (cheia ? ' disabled' : '') + '>Chamar jogador' + (cheia ? ' (mesa cheia)' : '') + '</button>' +
      '<button type="button" class="btn btn-secondary" data-g="sortear"' + (entre ? '' : ' disabled') + '>Sortear o dealer da próxima mão</button></div>';
    $('#jog-corpo').innerHTML = h;
  }
  $('#jog-btn').addEventListener('click', () => { desenharJog(); ON.modal.abrir('jog-modal'); });
  $('#jog-corpo').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-g]'); if (!b || b.disabled) return;
    const g = b.dataset.g, lin = b.closest('.lin-jog'), i = lin ? +lin.dataset.i : -1;
    if (g === 'salvar') {
      empilhar();
      const n = $('#jn' + i).value, f = $('#jf' + i);
      let r = P.renomear(E, i, n);
      if (r.ok && f && !f.disabled) { const v = +f.value; if (v !== E.jog[i].fichas) r = P.ajustarFichas(E, i, v); }
      if (!r.ok) { U.undo.pop(); dizer(r.erro); ON.som('erro'); return; }
      registrar(nome(i) + ': nome e fichas atualizados.');
      ON.som('acerto'); dizer('Salvo.'); pintar(); gravar(); desenharJog();
    } else if (g === 'dealer') {
      empilhar();
      const r = P.definirDealer(E, i);
      if (!r.ok) { U.undo.pop(); dizer(r.erro); return; }
      registrar(nome(i) + ' será o dealer da próxima mão.');
      ON.som('acerto'); dizer(nome(i) + ' será o dealer da próxima mão.'); pintar(); gravar(); desenharJog();
    } else if (g === 'tirar') {
      if (vivosJ().length <= 2) { dizer('A mesa precisa de pelo menos 2 jogadores.'); ON.som('erro'); return; }
      ON.confirmar({ titulo: 'Tirar ' + nome(i) + ' da mesa?', texto: 'As fichas dele saem do jogo' + (E.fase === 'mao' ? ' e ele desiste da mão atual' : '') + '. Dá para retroceder logo depois.', sim: 'Sim, tirar', nao: 'Cancelar' }).then((ok) => {
        if (!ok) return;
        empilhar();
        const r = P.remover(E, i);
        if (!r.ok) { U.undo.pop(); dizer(r.erro); return; }
        registrar(nome(i) + ' saiu da mesa.');
        ON.som('toque'); dizer(nome(i) + ' saiu da mesa.');
        pintar(); gravar(); avancar(); desenharJog();
      });
    } else if (g === 'novo') {
      empilhar();
      const nm = $('#nj-nome').value, f = +$('#nj-fichas').value, dep = +$('#nj-depois').value;
      const r = P.adicionar(E, { nome: nm, fichas: f, depoisDe: dep });
      const er = $('#nj-erro');
      if (!r.ok) { U.undo.pop(); er.textContent = r.erro; er.hidden = false; ON.som('erro'); return; }
      registrar(nm.trim() + ' entrou na mesa' + (E.fase === 'mao' ? ' (joga a partir da próxima mão)' : '') + '.');
      ON.som('acerto'); dizer(nm.trim() + ' entrou na mesa' + (E.fase === 'mao' ? ', a partir da próxima mão' : '') + '.');
      pintar(); gravar(); desenharJog();
    } else if (g === 'sortear') {
      empilhar();
      const g2 = SO.criar(E.rng);
      g2.misturar();
      const cand = []; E.jog.forEach((j, k) => { if (!j.fora && j.fichas > 0) cand.push(k); });
      const k = cand[g2.inteiro(cand.length)];
      E.rng = g2.estado();
      const r = P.definirDealer(E, k);
      if (!r.ok) { U.undo.pop(); dizer(r.erro); return; }
      registrar('Dealer sorteado: ' + nome(k) + '.');
      ON.som('acerto'); dizer('Dealer sorteado: ' + nome(k) + '.', 9000); pintar(); gravar(); desenharJog();
    }
  });

  /* --- blinds --- */
  $('#blinds-btn').addEventListener('click', () => {
    $('#b-sb').value = E.cfg.sb; $('#b-bb').value = E.cfg.bb; $('#b-ante').value = E.cfg.ante;
    $('#blinds-erro').hidden = true;
    $('#blinds-atual').textContent = 'Agora: ' + fmt(E.cfg.sb) + '/' + fmt(E.cfg.bb) + (E.cfg.ante ? ' com ante de ' + fmt(E.cfg.ante) : '') + '.' + (E.fase === 'mao' ? ' A mudança vale a partir da próxima mão.' : '');
    const prox = P.NIVEIS.find((n) => n[1] > E.cfg.bb);
    $('#blinds-prox').textContent = prox ? 'Subir para o próximo nível (' + fmt(prox[0]) + '/' + fmt(prox[1]) + ')' : 'Subir os blinds em 50%';
    $('#blinds-quando').textContent = E.fmpn > 0 ? 'Subida automática: a cada ' + E.fmpn + ' mãos.' : 'Subida automática desligada. Você sobe quando quiser.';
    ON.modal.abrir('blinds-modal');
  });
  $('#blinds-ok').addEventListener('click', () => {
    empilhar();
    const r = P.mudarBlinds(E, +$('#b-sb').value, +$('#b-bb').value, +$('#b-ante').value || 0);
    if (!r.ok) { U.undo.pop(); const er = $('#blinds-erro'); er.textContent = r.erro; er.hidden = false; ON.som('erro'); return; }
    registrar('Blinds: ' + fmt(E.cfg.sb) + '/' + fmt(E.cfg.bb) + (E.cfg.ante ? ' +' + fmt(E.cfg.ante) : '') + '.');
    ON.modal.fechar(); ON.som('acerto'); dizer('Blinds: ' + fmt(E.cfg.sb) + '/' + fmt(E.cfg.bb) + '.'); pintar(); gravar();
  });
  $('#blinds-prox').addEventListener('click', () => {
    empilhar();
    const r = P.proximoNivel(E);
    if (!r.ok) { U.undo.pop(); dizer(r.erro); return; }
    registrar('Blinds subiram para ' + fmt(E.cfg.sb) + '/' + fmt(E.cfg.bb) + '.');
    ON.modal.fechar(); ON.som('acerto'); dizer('Blinds subiram para ' + fmt(E.cfg.sb) + '/' + fmt(E.cfg.bb) + '.'); pintar(); gravar();
  });

  /* ==========================================================================
     6. Telas, nova partida, tabela de mãos e Como Jogar
     ========================================================================== */
  function mostrarTela(o) {
    el.telaTitulo.textContent = o.titulo || '';
    el.telaCorpo.innerHTML = o.corpo || '';
    el.tela.classList.toggle('opaca', !!o.opaca);
    el.dig.inert = !!o.opaca; el.fis.inert = !!o.opaca;
    el.telaBtn.hidden = !o.btn;
    el.telaBtn.textContent = o.btn || '';
    el.telaBtn.onclick = o.fn || null;
    el.telaBtn2.hidden = !o.btn2;
    el.telaBtn2.textContent = o.btn2 || '';
    el.telaBtn2.onclick = o.fn2 || null;
    el.tela.hidden = false;
    el.mesa.style.minHeight = '';
    const card = el.tela.querySelector('.tela-card');
    if (card) el.mesa.style.minHeight = Math.ceil(card.offsetHeight + 18) + 'px';
    if (o.btn && !ON.modal.aberto()) setTimeout(() => { if (!el.tela.hidden && !el.telaBtn.hidden) el.telaBtn.focus({ preventScroll: true }); }, 60);
  }
  function fecharTela() { el.tela.hidden = true; el.dig.inert = false; el.fis.inert = false; el.mesa.style.minHeight = ''; }

  /* --- tabela de mãos (modal e Como Jogar) --- */
  function htmlTabela(minha) {
    let mel = -1;
    if (minha && E && !E.fis && E.fase === 'mao' && E.m && U.ver >= 0 && E.m.maos[U.ver] && E.m.com.length >= 3) mel = P.categoria(P.avaliar(E.m.maos[U.ver].concat(E.m.com)));
    return '<ul class="tab-maos">' + P.TABELA.map((h, k) =>
      '<li' + (h.cat === mel ? ' class="minha"' : '') + '><span class="tab-pos" aria-hidden="true">' + (k + 1) + '</span><span class="tab-cartas" role="img" aria-label="Exemplo: ' + h.ex.map((c) => CA.nome(c)).join(', ') + '">' + h.ex.map((c) => CA.mini(c)).join('') + '</span>' +
      '<span class="tab-txt"><b>' + h.nome + (h.cat === mel ? ' (a sua agora)' : '') + '</b><span>' + h.desc + '</span><small>Chance de aparecer em 7 cartas: ' + h.chance + '</small></span></li>').join('') + '</ul>';
  }
  function abrirTabela() {
    $('#tabela-corpo').innerHTML = htmlTabela(true) +
      '<p class="tabela-nota">Da mais forte (1) para a mais fraca (10). Vale a melhor combinação de 5 cartas entre as suas 2 e as 5 da mesa. Se duas pessoas têm a mesma mão, vale a carta mais alta e, depois, as cartas de desempate. Os naipes não têm valor. As chances são contadas sobre todas as 133.784.560 combinações de 7 cartas.</p>';
  }
  $('#tabela-btn').addEventListener('click', abrirTabela);

  /* --- nova partida --- */
  const esc2 = {};
  const opcoes = () => ({ modo: prefs.modo, n: prefs.n, h: prefs.h, nivel: prefs.nivel, fichas: prefs.fichas, mpn: prefs.mpn, nomes: prefs.nomes.slice(), fn: prefs.fn, fnomes: prefs.fnomes.slice(), ff: prefs.ff, fsb: prefs.fsb, fbb: prefs.fbb, fante: prefs.fante, fmpn: prefs.fmpn });
  function abrirPartida() { Object.assign(esc2, opcoes()); esc2.modo = E ? (E.fis ? 'mesa' : 'digital') : prefs.modo; desenharEscolha(); }
  function segHtml(lista, atual, chave) {
    return lista.map((x) => '<button type="button" class="seg-btn" data-' + chave + '="' + x[0] + '" aria-pressed="' + (String(x[0]) === String(atual)) + '">' + x[1] + '</button>').join('');
  }
  const MPN_TXT = (n) => (n === 0 ? 'Nunca' : 'A cada ' + n + ' mãos');
  function lerCampos() {
    document.querySelectorAll('#nomes-dig input').forEach((i, k) => { esc2.nomes[k] = i.value; });
    document.querySelectorAll('#nomes-fis input').forEach((i, k) => { esc2.fnomes[k] = i.value; });
    if ($('#f-fichas').dataset.pronto) {
      esc2.ff = $('#f-fichas').value; esc2.fsb = $('#f-sb').value; esc2.fbb = $('#f-bb').value; esc2.fante = $('#f-ante').value;
    }
  }
  const padraoNome = (k, h) => (h === 1 ? 'Você' : 'Jogador ' + (k + 1));
  function desenharEscolha() {
    if (esc2.h > esc2.n) esc2.h = esc2.n;
    $('#tiles-modo').innerHTML = MODOS.map((m) => '<button type="button" class="tile" data-modo="' + m[0] + '" aria-current="' + (m[0] === esc2.modo) + '"><span class="tile-mini">' + (m[0] === 'mesa' ? MINI_FIS : MINI_SVG) + '</span><span class="tile-txt"><span class="tile-nome">' + m[1] + '</span><span class="tile-desc">' + MODO_DESC[m[0]] + '</span></span></button>').join('');
    $('#bloco-dig').hidden = esc2.modo !== 'digital';
    $('#bloco-fis').hidden = esc2.modo !== 'mesa';
    if (esc2.modo === 'digital') {
      $('#op-n').innerHTML = segHtml(Array.from({ length: P.MAX_DIG - 1 }, (_, i) => [i + 2, String(i + 2)]), esc2.n, 'n');
      $('#op-h').innerHTML = segHtml(Array.from({ length: esc2.n }, (_, i) => [i + 1, String(i + 1)]), esc2.h, 'h');
      const r = esc2.n - esc2.h;
      $('#h-desc').textContent = esc2.h === esc2.n ? 'Só pessoas. O aparelho passa de mão em mão e uma tela esconde as cartas entre as vezes.' :
        esc2.h === 1 ? 'Você joga contra ' + r + (r === 1 ? ' robô.' : ' robôs.') : esc2.h + ' pessoas no mesmo aparelho e ' + r + (r === 1 ? ' robô.' : ' robôs.');
      $('#nomes-dig').innerHTML = Array.from({ length: esc2.h }, (_, k) => '<div class="campo"><label for="nd' + k + '">' + (esc2.h === 1 ? 'Seu nome' : 'Nome da pessoa ' + (k + 1)) + '</label><input id="nd' + k + '" type="text" maxlength="12" placeholder="' + padraoNome(k, esc2.h) + '" value="' + esc(esc2.nomes[k] || '') + '" /></div>').join('');
      $('#bloco-nivel').hidden = r === 0;
      $('#op-niveis').innerHTML = segHtml([1, 2, 3, 4, 5, 0].map((n) => [n, n === 0 ? 'Variados' : n + ' ' + NOMES_NIVEL[n]]), esc2.nivel, 'nv');
      $('#niveis-desc').textContent = DESC_NIVEL[esc2.nivel] || '';
      $('#op-fichas').innerHTML = segHtml(FICHAS_DIG.map((n) => [n, fmt(n)]), esc2.fichas, 'f');
      $('#op-mpn').innerHTML = segHtml(MPN_DIG.map((n) => [n, MPN_TXT(n)]), esc2.mpn, 'mpn');
      $('#mpn-desc').textContent = 'Os blinds começam em 10/20 e vão dobrando de valor em degraus. ' + (esc2.mpn ? 'Sobem a cada ' + esc2.mpn + ' mãos, para a partida chegar ao fim.' : 'Sem subir, uma partida com robôs fortes pode durar muito.');
    } else {
      $('#fn-valor').textContent = esc2.fn;
      $('#fn-menos').disabled = esc2.fn <= 2; $('#fn-mais').disabled = esc2.fn >= P.MAX_FIS;
      $('#nomes-fis').innerHTML = Array.from({ length: esc2.fn }, (_, k) => '<div class="campo"><label for="nf' + k + '">Jogador ' + (k + 1) + '</label><input id="nf' + k + '" type="text" maxlength="12" placeholder="Jogador ' + (k + 1) + '" value="' + esc(esc2.fnomes[k] || '') + '" /></div>').join('');
      const set = (id, v) => { const x = $(id); x.value = v; x.dataset.pronto = '1'; };
      set('#f-fichas', esc2.ff); set('#f-sb', esc2.fsb); set('#f-bb', esc2.fbb); set('#f-ante', esc2.fante);
      $('#op-fmpn').innerHTML = segHtml(MPN_FIS.map((n) => [n, MPN_TXT(n)]), esc2.fmpn, 'fm');
      $('#fis-erro').hidden = true;
    }
  }
  const delegar = (sel, fn) => $(sel).addEventListener('click', (ev) => { const b = ev.target.closest('.seg-btn'); if (!b) return; lerCampos(); fn(b); desenharEscolha(); ON.som('toque'); });
  delegar('#op-n', (b) => { esc2.n = +b.dataset.n; });
  delegar('#op-h', (b) => { esc2.h = +b.dataset.h; });
  delegar('#op-niveis', (b) => { esc2.nivel = +b.dataset.nv; });
  delegar('#op-fichas', (b) => { esc2.fichas = +b.dataset.f; });
  delegar('#op-mpn', (b) => { esc2.mpn = +b.dataset.mpn; });
  delegar('#op-fmpn', (b) => { esc2.fmpn = +b.dataset.fm; });
  $('#tiles-modo').addEventListener('click', (ev) => { const b = ev.target.closest('.tile'); if (!b) return; lerCampos(); esc2.modo = b.dataset.modo; desenharEscolha(); ON.som('toque'); });
  $('#fn-menos').addEventListener('click', () => { lerCampos(); esc2.fn = Math.max(2, esc2.fn - 1); desenharEscolha(); });
  $('#fn-mais').addEventListener('click', () => { lerCampos(); esc2.fn = Math.min(P.MAX_FIS, esc2.fn + 1); desenharEscolha(); });

  const emAndamento = () => !!(E && E.fase !== 'fim' && (E.fis ? E.nmao > 0 : true));
  const TXT_ABANDONA = { texto: 'A partida em andamento será abandonada.', sim: 'Sim, começar outra' };
  $('#partida-jogar').addEventListener('click', () => {
    lerCampos();
    const o = Object.assign({}, esc2);
    if (o.modo === 'mesa') {
      const ff = Math.floor(+o.ff), sb = Math.floor(+o.fsb), bb = Math.floor(+o.fbb), ante = Math.floor(+o.fante || 0);
      const er = $('#fis-erro'); let msg = '';
      if (!(ff >= 2)) msg = 'Digite as fichas de cada jogador.';
      else if (!(sb >= 1) || !(bb >= 1)) msg = 'Digite os dois blinds.';
      else if (bb < sb) msg = 'O blind grande não pode ser menor que o pequeno.';
      else if (ff <= bb) msg = 'As fichas de cada um precisam ser maiores que o blind grande.';
      else if (ante < 0) msg = 'O ante não pode ser negativo.';
      if (msg) { er.textContent = msg; er.hidden = false; ON.som('erro'); return; }
      o.ff = ff; o.fsb = sb; o.fbb = bb; o.fante = ante;
    }
    ON.novoJogo(emAndamento(), () => { ON.modal.fechar(); novaPartida(o); }, TXT_ABANDONA);
  });
  $('#modo-btn').addEventListener('click', abrirPartida);
  el.restart.addEventListener('click', () => { ON.novoJogo(emAndamento(), () => novaPartida(opcoes()), TXT_ABANDONA); });

  function nomesUnicos(lista) {
    const usados = {};
    return lista.map((n) => {
      let b = n, k = 2;
      while (usados[b.toLowerCase()]) b = n.slice(0, 10) + ' ' + k++;
      usados[b.toLowerCase()] = 1;
      return b;
    });
  }

  function novaPartida(o) {
    if (U) clearTimeout(U.botT);
    prefs.modo = o.modo === 'mesa' ? 'mesa' : 'digital';
    const sem = SO.novaSemente();
    let jog;
    if (prefs.modo === 'digital') {
      prefs.n = o.n; prefs.h = Math.min(o.h, o.n); prefs.nivel = o.nivel; prefs.fichas = o.fichas; prefs.mpn = o.mpn;
      prefs.nomes = (o.nomes || []).slice(0, prefs.h).map((x) => String(x || '').trim().slice(0, 12));
      const g = SO.criar(sem + '|elenco');
      const humanos = Array.from({ length: prefs.h }, (_, k) => ({ nome: prefs.nomes[k] || padraoNome(k, prefs.h), tipo: 'humano', nivel: 0 }));
      const usados = humanos.map((h) => h.nome.toLowerCase());
      const pool = g.embaralhar(NOMES_ROBOS.filter((x) => usados.indexOf(x.toLowerCase()) < 0));
      const niv = g.embaralhar([2, 3, 4, 5]);
      const robos = Array.from({ length: prefs.n - prefs.h }, (_, k) => ({ nome: pool[k % pool.length] + (k >= pool.length ? ' ' + (1 + Math.floor(k / pool.length)) : ''), tipo: 'robo', nivel: prefs.nivel > 0 ? prefs.nivel : niv[k % niv.length] }));
      const todos = humanos.concat(robos);
      const nn = nomesUnicos(todos.map((x) => x.nome));
      jog = todos.map((x, k) => ({ nome: nn[k], tipo: x.tipo, nivel: x.nivel }));
      E = P.novo({ fis: false, jogadores: jog, fichas: prefs.fichas, mpn: prefs.mpn, semente: sem });
    } else {
      prefs.fn = o.fn; prefs.fnomes = (o.fnomes || []).slice(0, prefs.fn).map((x) => String(x || '').trim().slice(0, 12));
      prefs.ff = o.ff; prefs.fsb = o.fsb; prefs.fbb = o.fbb; prefs.fante = o.fante; prefs.fmpn = o.fmpn;
      const nn = nomesUnicos(Array.from({ length: prefs.fn }, (_, k) => prefs.fnomes[k] || 'Jogador ' + (k + 1)));
      jog = nn.map((n) => ({ nome: n, tipo: 'humano', nivel: 0 }));
      E = P.novo({ fis: true, jogadores: jog, fichas: prefs.ff, sb: prefs.fsb, bb: prefs.fbb, ante: prefs.fante, semente: sem });
      E.fmpn = prefs.fmpn;
    }
    gravarPrefs();
    U = novoU();
    htmlAcao = '';
    fecharTela();
    dizer('');
    montarMesa();
    ajustar();
    contar('inicio');
    if (E.fis) { registrar('Mesa pronta. O dealer é sorteado pelo aparelho.'); avancar(); } else proxMao();
  }

  function restaurar() {
    const L = lerSalvo();
    if (!L) { sdel(LS.jogo); return false; }
    E = L.E; U = L.U;
    U.pausa = true;
    U.fim = E.m && E.m.res ? E.m.n : undefined;
    U.elimVisto = E.elim ? E.elim.length : 0;
    U.esp = !E.fis && nHumanos() === 0;
    prefs.modo = E.fis ? 'mesa' : 'digital';
    htmlAcao = '';
    montarMesa();
    ajustar();
    pintar();
    mostrarTela({
      titulo: 'Partida salva',
      corpo: '<p>Sua partida estava em andamento neste aparelho.</p><p class="tela-sub">' + (E.fis ? 'Mesa com cartas reais' : 'Poker no aparelho') + ' · ' + vivosJ().length + ' jogadores · mão ' + E.nmao + '</p>',
      opaca: true, btn: 'Continuar',
      fn: () => { U.pausa = false; fecharTela(); avancar(); }
    });
    return true;
  }

  /* --- Como Jogar --- */
  let abas = [];
  function mostrarAba(aba) {
    abas.forEach((a) => {
      const s = a === aba;
      a.setAttribute('aria-selected', String(s)); a.tabIndex = s ? 0 : -1;
      document.getElementById(a.getAttribute('aria-controls')).hidden = !s;
    });
    document.getElementById(aba.getAttribute('aria-controls')).scrollTop = 0;
  }
  function montarAjuda() {
    const tab = htmlTabela(false);
    const f = (t) => String(t || '').replace('{{tabela}}', tab);
    $('#painel-site').innerHTML = f(TX.site);
    $('#painel-jogo').innerHTML = f(TX.jogo);
    $('#painel-estr').innerHTML = f(TX.estrategia);
  }
  function ligarAbas() {
    abas = Array.from(document.querySelectorAll('.aba'));
    abas.forEach((a) => {
      a.addEventListener('click', () => mostrarAba(a));
      a.addEventListener('keydown', (ev) => {
        if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
        const novo = abas[(abas.indexOf(a) + (ev.key === 'ArrowRight' ? 1 : -1) + abas.length) % abas.length];
        mostrarAba(novo); novo.focus(); ev.preventDefault();
      });
    });
    $('#howto-btn').addEventListener('click', () => mostrarAba(abas[0]));
  }
  const acBtn = $('#ajuda-btn');
  acBtn.addEventListener('click', () => {
    const abre = acBtn.getAttribute('aria-expanded') !== 'true';
    acBtn.setAttribute('aria-expanded', String(abre));
    $('#acc-ajuda').classList.toggle('aberto', abre);
  });

  /* ==========================================================================
     7. Teclado, tamanho e início
     ========================================================================== */
  document.addEventListener('keydown', (ev) => {
    if (!E || ON.modal.aberto() || !el.tela.hidden) return;
    const t = ev.target;
    if (t && t.closest && t.closest('input,textarea,select,[role="dialog"]')) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = ev.key.toLowerCase();
    if (k === 't') { abrirTabela(); ON.modal.abrir('tabela-modal'); ev.preventDefault(); return; }
    if (E.fase !== 'mao' || !E.m || E.m.pend !== 'apostar' || (t && t.closest && t.closest('button'))) return;
    const L = P.legais(E);
    if (!L || !(E.fis || (ehHumano(L.vez) && U.ver === L.vez))) return;
    if (k === 'f' && !L.check) { executar({ k: 'fold' }); ev.preventDefault(); }
    else if (k === 'c') { executar({ k: L.check ? 'check' : 'call' }); ev.preventDefault(); }
  });

  document.addEventListener('visibilitychange', () => { if (document.hidden) gravar(); });
  window.addEventListener('pagehide', gravar);

  /* ==========================================================================
     Início
     ========================================================================== */
  ON.init({
    id: 'pokeron',
    nome: 'PokerON!',
    configuracoes: ['som', 'vibracao', 'escuro', 'reduzir'],
    estatisticas,
    zerarEstatisticas: () => { sdel(LS.stats); },
    pronto: () => {
      CA.iniciar();
      document.getElementById('modo-chevron').innerHTML = ON.icone('chevron', 16);
      document.getElementById('ajuda-chevron').innerHTML = ON.icone('chevron', 18);
      montarMinhas();
      montarAjuda();
      ligarAbas();
      if (!restaurar()) novaPartida(opcoes());
      ajustar();
      // primeira visita: o Como Jogar abre sozinho
      if (!ON.store.get(LS.visto, false)) {
        ON.store.set(LS.visto, true);
        setTimeout(() => ON.modal.abrir('howto-modal'), 400);
      }
    }
  });
})();

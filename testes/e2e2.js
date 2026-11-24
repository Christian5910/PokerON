/* mesa com cartas reais e passar o aparelho, clicando de verdade. uso: node testes/e2e2.js mesa|hot */
const { chromium } = require('playwright');
const SD = '/tmp/claude-0/-home-claude/b5735e4c-ab2c-5e7c-9d08-683153cedede/scratchpad/shots/';
const modo = process.argv[2] || 'mesa';
const falhas = [];
const ok = (c, t) => { if (!c) { falhas.push(t); console.log('FALHA: ' + t); } else console.log('ok   ' + t); };
const estado = (p) => p.evaluate(() => { try { return JSON.parse(localStorage.getItem('pokeron.jogo')); } catch (e) { return null; } });
const conta = (E) => E.jog.reduce((s, j) => s + j.fichas, 0) + (E.m && E.fase === 'mao' ? E.m.tot.reduce((a, b) => a + b, 0) : 0);
async function abrir(browser, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { try { localStorage.setItem('pokeron.visto', 'true'); localStorage.setItem('pokeron.prefs', JSON.stringify({ vel: 'rapido' })); } catch (e) {} });
  const p = await ctx.newPage(); const erros = [];
  p.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/404|navigator.vibrate/.test(m.text())) erros.push('console: ' + m.text()); });
  await p.goto('http://localhost:8123/index.html'); await p.waitForTimeout(900);
  return { ctx, p, erros };
}
const confirma = async (p) => { if (await p.$('#confirm-modal[aria-hidden="false"]')) { await p.click('#confirm-yes'); await p.waitForTimeout(250); } };

(async () => {
  const b = await chromium.launch();
  if (modo === 'mesa') {
    const { ctx, p, erros } = await abrir(b, 390, 844);
    await p.click('#modo-btn'); await p.click('#tiles-modo [data-modo="mesa"]');
    await p.fill('#f-fichas', '1000'); await p.fill('#f-sb', '10'); await p.fill('#f-bb', '20');
    await p.fill('#nf0', 'Ana'); await p.fill('#nf1', 'Beto');
    await p.click('#partida-jogar'); await confirma(p); await p.waitForTimeout(300);
    ok(await p.isVisible('#mesa-fis') && !(await p.isVisible('#mesa-dig')), 'mesa real mostra a lista e não a mesa oval');
    ok(!(await p.$('#mesa-fis .carta, #mesa-fis svg use')), 'sem cartas na tela (lista)');
    ok(await p.isVisible('[data-a="comecar"]'), 'botão Começar a mão aparece');
    await p.click('[data-a="comecar"]'); await p.waitForTimeout(200);
    let E = (await estado(p)).E;
    ok(E.fase === 'mao' && E.m.pend === 'apostar', 'mão começou e espera a primeira aposta');
    // undo
    const lenAntes = E.m.log.length;
    await p.click('[data-a="call"],[data-a="check"]'); await p.waitForTimeout(150);
    E = (await estado(p)).E; ok(E.m.log.length > lenAntes, 'ação registrada');
    await p.click('#undo-btn'); await p.waitForTimeout(200);
    E = (await estado(p)).E; ok(E.m.log.length === lenAntes, 'retroceder desfez a ação');
    // joga 5 mãos
    let maos = 0, passos = 0, undos = 0;
    while (maos < 5 && passos++ < 600) {
      const info = await p.evaluate(() => { const q = (s) => document.querySelector(s); return { comecar: !!q('[data-a="comecar"]'), dist: !!q('[data-a="dist"]'), venc: !!q('#venc-modal.aberto, #venc-modal[aria-hidden="false"]'), call: !!q('[data-a="call"],[data-a="check"]'), subir: !!q('#btn-subir:not(:disabled)') }; });
      if (info.venc) {
        const grupos = await p.$$('#venc-corpo .pote-bloco');
        for (const g of grupos) { const marcado = await g.$('[aria-pressed="true"]'); if (!marcado) await (await g.$('.seg-btn')).click(); }
        await p.click('#venc-ok'); await p.waitForTimeout(200); continue;
      }
      if (info.dist) { await p.click('[data-a="dist"]'); continue; }
      if (info.comecar) { maos++; const E2 = (await estado(p)).E; ok(conta(E2) === E2.total, 'fichas conservadas depois da mão ' + maos); await p.click('[data-a="comecar"]'); continue; }
      if (info.call) {
        const r = Math.random();
        if (r < 0.15 && info.subir) { await p.click('[data-q="p"]'); await p.click('#btn-subir'); }
        else if (r < 0.25 && !(await p.$('[data-a="fold"]:disabled'))) await p.click('[data-a="fold"]');
        else await p.click('[data-a="call"],[data-a="check"]');
        const E3 = (await estado(p)).E; if (E3.fase === 'mao') { if (conta(E3) !== E3.total) ok(false, 'fichas conservadas no meio da mão'); }
        if (Math.random() < 0.08 && undos < 6) { undos++; await p.click('#undo-btn'); await p.waitForTimeout(120); }
        continue;
      }
      await p.waitForTimeout(60);
    }
    ok(maos >= 5, 'jogou 5 mãos até o fim (' + maos + ')');
    // jogadores: adicionar, renomear, tirar
    await p.waitForSelector('[data-a="comecar"]', { timeout: 5000 }).catch(() => {});
    await p.click('#jog-btn');
    await p.fill('#nj-nome', 'Carla'); await p.fill('#nj-fichas', '800'); await p.click('[data-g="novo"]'); await p.waitForTimeout(200);
    let S = await estado(p);
    ok(S && (S.E.jog.some((j) => j.nome === 'Carla') || (S.E.fila || []).some((j) => j.nome === 'Carla')), 'adicionou Carla');
    await p.fill('#jn0', 'Ana Maria'); await p.click('.lin-jog[data-i="0"] [data-g="salvar"]'); await p.waitForTimeout(200);
    S = await estado(p); ok(S.E.jog[0].nome === 'Ana Maria', 'renomeou o jogador 1');
    const antes = S.E.jog.filter((j) => !j.fora).length;
    const idxBeto = S.E.jog.findIndex((j) => j.nome === 'Beto');
    await p.click('.lin-jog[data-i="' + idxBeto + '"] [data-g="tirar"]'); await confirma(p); await p.waitForTimeout(250);
    S = await estado(p); ok(S.E.jog.filter((j) => !j.fora).length === antes - 1 && !S.E.jog.some((j) => j.nome === 'Beto' && !j.fora), 'tirou o Beto da mesa');
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    // blinds
    await p.click('#blinds-btn'); await p.fill('#b-sb', '25'); await p.fill('#b-bb', '50'); await p.click('#blinds-ok'); await p.waitForTimeout(250);
    S = await estado(p); ok(S.E.cfg.sb === 25 && S.E.cfg.bb === 50, 'blinds mudaram para 25/50');
    await p.click('#blinds-btn'); await p.click('#blinds-prox'); await p.waitForTimeout(250);
    S = await estado(p); ok(S.E.cfg.bb > 50, 'subiu o nível dos blinds (' + S.E.cfg.sb + '/' + S.E.cfg.bb + ')');
    // recarrega: partida salva volta
    await p.reload(); await p.waitForTimeout(900);
    ok(await p.isVisible('#tela-btn'), 'ao recarregar aparece Partida salva');
    await p.click('#tela-btn'); await p.waitForTimeout(200);
    ok(await p.isVisible('#mesa-fis'), 'mesa real restaurada');
    await p.screenshot({ path: SD + 'e2e-mesa-390.png', fullPage: true });
    ok(!erros.length, 'sem erros de código: ' + erros.join(' | '));
    await ctx.close();
  }
  if (modo === 'hot') {
    const { ctx, p, erros } = await abrir(b, 390, 844);
    await p.click('#modo-btn');
    await p.click('#op-n [data-n="3"]'); await p.click('#op-h [data-h="2"]'); await p.click('#op-niveis [data-nv="3"]');
    await p.fill('#nd0', 'Lia'); await p.fill('#nd1', 'Rui');
    await p.click('#partida-jogar'); await confirma(p); await p.waitForTimeout(500);
    let passou = 0, vazou = 0, maos = 0, passos = 0;
    while (maos < 6 && passos++ < 800) {
      const info = await p.evaluate(() => {
        const q = (s) => document.querySelector(s);
        const tela = !!q('#tela:not([hidden])');
        const minhasVisivel = !q('#minhas').hidden;
        const seatsReveladas = Array.from(document.querySelectorAll('.assento .carta:not(.oculta)')).length;
        const labels = Array.from(document.querySelectorAll('.assento .carta.oculta')).map((c) => c.getAttribute('aria-label'));
        return { tela, btn: tela ? q('#tela-btn').textContent : '', minhasVisivel, seatsReveladas, labels, prox: !!q('[data-a="prox"]'), call: !!q('[data-a="call"],[data-a="check"]'), res: !!q('.res') };
      });
      if (info.tela && /Estou pronto/.test(info.btn)) { if (info.minhasVisivel) vazou++; passou++; await p.click('#tela-btn'); continue; }
      if (info.tela && info.btn) { await p.click('#tela-btn'); continue; }
      if (info.labels.some((l) => l !== 'Carta virada para baixo')) vazou++;
      if (info.prox) { maos++; await p.click('[data-a="prox"]'); continue; }
      if (info.call) { await p.click('[data-a="call"],[data-a="check"]'); continue; }
      await p.waitForTimeout(60);
    }
    ok(passou >= 4, 'a tela de passar o aparelho apareceu (' + passou + ' vezes)');
    ok(vazou === 0, 'cartas escondidas durante a troca e nas cartas viradas (vazamentos: ' + vazou + ')');
    ok(maos >= 6, 'jogou 6 mãos (' + maos + ')');
    ok(!erros.length, 'sem erros de código: ' + erros.join(' | '));
    await ctx.close();
  }
  await b.close();
  console.log(falhas.length ? falhas.length + ' falhas' : 'tudo certo');
  process.exit(falhas.length ? 1 : 0);
})();

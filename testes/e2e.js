/* Teste de ponta a ponta no navegador: joga de verdade clicando. uso: node testes/e2e.js [modo] */
const { chromium } = require('playwright');
const SD = '/tmp/claude-0/-home-claude/b5735e4c-ab2c-5e7c-9d08-683153cedede/scratchpad/shots/';
const modo = process.argv[2] || 'digital';
const falhas = [];
const ok = (c, t) => { if (!c) { falhas.push(t); console.log('FALHA: ' + t); } };

async function novo(browser, w, h, tema) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: tema === 'escuro' ? 'dark' : 'light' });
  await ctx.addInitScript(() => { try { localStorage.setItem('pokeron.visto', 'true'); localStorage.setItem('pokeron.prefs', JSON.stringify({ vel: 'rapido' })); } catch (e) {} });
  const p = await ctx.newPage(); const erros = [];
  p.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/404|navigator.vibrate/.test(m.text())) erros.push('console: ' + m.text()); });
  await p.goto('http://localhost:8123/index.html'); await p.waitForTimeout(900);
  return { ctx, p, erros };
}
const estado = (p) => p.evaluate(() => { try { return JSON.parse(localStorage.getItem('pokeron.jogo')); } catch (e) { return null; } });
const soma = (E) => E.jog.reduce((s, j) => s + j.fichas, 0) + (E.m && E.fase === 'mao' ? E.m.tot.reduce((a, b) => a + b, 0) : 0);

async function iniciar(p, o) {
  await p.click('#modo-btn');
  await p.click('#tiles-modo [data-modo="' + o.modo + '"]');
  if (o.modo === 'digital') {
    await p.click('#op-n [data-n="' + o.n + '"]'); await p.click('#op-h [data-h="' + o.h + '"]');
    if (o.n > o.h) await p.click('#op-niveis [data-nv="' + o.nivel + '"]');
    await p.click('#op-fichas [data-f="' + (o.fichas || 1000) + '"]'); await p.click('#op-mpn [data-mpn="' + (o.mpn === undefined ? 5 : o.mpn) + '"]');
  } else {
    for (let i = 4; i < o.fn; i++) await p.click('#fn-mais');
    await p.fill('#f-fichas', String(o.ff || 1000)); await p.fill('#f-sb', '10'); await p.fill('#f-bb', '20');
  }
  await p.click('#partida-jogar');
  await p.waitForTimeout(300);
  if (await p.$('#confirm-modal[aria-hidden="false"]')) { await p.click('#confirm-yes'); await p.waitForTimeout(300); }
}

(async () => {
  const b = await chromium.launch();
  if (modo === 'digital') {
    for (const [w, h, tema] of [[390, 844, 'claro'], [260, 600, 'escuro'], [844, 390, 'claro'], [1280, 800, 'escuro']]) {
      const { ctx, p, erros } = await novo(b, w, h, tema);
      await iniciar(p, { modo: 'digital', n: 6, h: 1, nivel: 0, fichas: 1000, mpn: 5 });
      let maos = 0, passos = 0, visto = new Set(); const t0 = Date.now(); let ultimo = Date.now(), ult = '', acelerou = false;
      while (passos++ < 4000 && Date.now() - t0 < 70000 && maos < 40) {
        const info = await p.evaluate(() => {
          const q = (s) => document.querySelector(s);
          const tela = q('#tela:not([hidden])');
          return { tela: !!tela, telaBtn: tela && !q('#tela-btn').hidden ? q('#tela-btn').textContent : '', prox: !!q('[data-a="prox"]'), acel: !!q('[data-a="acelerar"]'), fold: !!q('[data-a="fold"]:not(:disabled)'), call: !!q('[data-a="call"],[data-a="check"]'), subir: !!q('#btn-subir:not(:disabled)'), dica: q('#dica').textContent };
        });
        const chave = info.dica + info.prox + info.tela; if (chave !== ult) { ult = chave; ultimo = Date.now(); } else if (Date.now() - ultimo > 12000) { ok(false, 'travou: ' + JSON.stringify(info)); break; }
        if (info.tela && /Nova partida/.test(info.telaBtn)) break;
        if (info.tela && info.telaBtn) { await p.click('#tela-btn', { timeout: 4000 }).catch(() => {}); continue; }
        if (info.prox) { await p.click('[data-a="prox"]', { timeout: 4000 }).then(() => { maos++; }, () => {}); continue; }
        if (info.acel) { if (!acelerou) { acelerou = true; await p.evaluate(() => { const b = document.querySelector('[data-a="acelerar"]'); if (b) b.click(); }); } await p.waitForTimeout(150); ultimo = Date.now(); continue; }
        if (info.call) {
          const r = Math.random();
          if (r < 0.06 && info.subir) { await p.click('[data-q="p"]', { timeout: 3000 }).catch(() => {}); await p.click('#btn-subir', { timeout: 3000 }).catch(() => {}); }
          else if (r < 0.12 && info.fold) await p.click('[data-a="fold"]', { timeout: 4000 }).catch(() => {});
          else await p.click('[data-a="call"],[data-a="check"]', { timeout: 3000 }).catch(() => {});
          const E = await estado(p);
          if (E && E.E && E.E.fase === 'mao') ok(soma(E.E) === E.E.total, 'fichas conservadas (' + soma(E.E) + ' vs ' + E.E.total + ')');
          continue;
        }
        await p.waitForTimeout(40);
        if (passos % 300 === 0) visto.add(info.dica);
      }
      const E = await estado(p);
      if (E && E.E) ok(soma(E.E) === E.E.total, 'fichas conservadas no fim');
      ok(!erros.length, 'sem erros de código em ' + w + 'x' + h + ': ' + erros.join(' | '));
      await p.screenshot({ path: SD + 'e2e-dig-' + w + '.png', fullPage: true });
      console.log(w + 'x' + h + ' ' + tema + ': mãos jogadas ' + maos + ', passos ' + passos + (erros.length ? ' ERROS ' + erros.join('|') : ''));
      await ctx.close();
    }
  }
  await b.close();
  console.log(falhas.length ? falhas.length + ' falhas' : 'tudo certo');
  process.exit(falhas.length ? 1 : 0);
})();

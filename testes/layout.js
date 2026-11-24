/* auditoria de layout: 7 tamanhos, claro e escuro, digital e mesa real; fonte < 11px, rolagem horizontal, assentos sobrepostos, cortes */
const { chromium } = require('playwright');
const SD = '/tmp/claude-0/-home-claude/b5735e4c-ab2c-5e7c-9d08-683153cedede/scratchpad/shots/';
const tamanhos = [[260, 600], [320, 568], [390, 844], [768, 1024], [844, 390], [1280, 800], [1920, 1080]];
const n9 = process.argv.includes('9');
const falhas = [];
(async () => {
  const b = await chromium.launch();
  for (const tema of ['claro', 'escuro']) for (const [w, h] of tamanhos) for (const modo of ['digital', 'mesa']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: tema === 'escuro' ? 'dark' : 'light' });
    await ctx.addInitScript(([m, n]) => { try { localStorage.setItem('pokeron.visto', 'true'); localStorage.setItem('pokeron.prefs', JSON.stringify({ modo: m, n: n, h: 1, nivel: 3, vel: 'lento', fn: 6 })); } catch (e) {} }, [modo, n9 ? 9 : 6]);
    const p = await ctx.newPage(); const erros = [];
    p.on('pageerror', (e) => erros.push(e.message));
    await p.goto('http://localhost:8123/index.html'); await p.waitForTimeout(1200);
    if (modo === 'mesa') { const bt = await p.$('[data-a="comecar"]'); if (bt) { await bt.click(); await p.waitForTimeout(300); } }
    const r = await p.evaluate(() => {
      const out = { pequenas: [], overflowX: document.documentElement.scrollWidth > innerWidth + 1, sobrepoe: [], cortes: [] };
      document.querySelectorAll('body *').forEach((e) => {
        if (!e.childNodes.length) return;
        const tem = Array.from(e.childNodes).some((c) => c.nodeType === 3 && c.textContent.trim());
        if (!tem) return;
        const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
        if (e.closest('[hidden],.modal:not(.aberto)')) return;
        const fs = parseFloat(cs.fontSize); if (fs < 10.99) out.pequenas.push(e.tagName + '.' + e.className + ' ' + fs + ' "' + e.textContent.trim().slice(0, 20) + '"');
      });
      const seats = Array.from(document.querySelectorAll('.assento')).map((s) => s.getBoundingClientRect());
      for (let i = 0; i < seats.length; i++) for (let j = i + 1; j < seats.length; j++) {
        const a = seats[i], c = seats[j];
        if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) out.sobrepoe.push(i + 'x' + j);
      }
      const centro = document.querySelector('.centro'); if (centro && seats.length) { const c = centro.getBoundingClientRect(); seats.forEach((a, i) => { if (a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom) out.sobrepoe.push('centro x ' + i); }); }
      const caixa = document.querySelector('#mesa-dig'); if (caixa && getComputedStyle(caixa).display !== 'none') { const cb = caixa.getBoundingClientRect(); document.querySelectorAll('.assento').forEach((s, i) => { const a = s.getBoundingClientRect(); if (a.left < cb.left - 8 || a.right > cb.right + 8 || a.top < cb.top - 8 || a.bottom > cb.bottom + 8) out.cortes.push('assento ' + i + ' fora da mesa'); }); }
      document.querySelectorAll('.assento .a-nome,.assento .a-fichas,.assento .a-estado,.hud-box b,.acoes .btn,.chip-j b').forEach((e) => { if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).textOverflow !== 'ellipsis') out.cortes.push('texto cortado: ' + e.textContent.trim().slice(0, 20)); });
      return out;
    });
    const rot = modo + ' ' + w + 'x' + h + ' ' + tema;
    const probs = [].concat(r.pequenas.slice(0, 4).map((x) => 'fonte <11px: ' + x), r.overflowX ? ['rolagem horizontal'] : [], r.sobrepoe.map((x) => 'sobreposição ' + x), r.cortes.slice(0, 5), erros);
    if (probs.length) { falhas.push(rot); console.log('PROBLEMA ' + rot + '\n   ' + probs.join('\n   ')); }
    if (tema === 'claro' || w <= 390) await p.screenshot({ path: SD + 'lay-' + modo + '-' + w + '-' + tema + (n9 ? '-9' : '') + '.png', fullPage: true });
    await ctx.close();
  }
  await b.close();
  console.log(falhas.length ? falhas.length + ' combinações com problema' : 'layout limpo em todas as combinações');
})();

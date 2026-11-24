const { chromium } = require('playwright');
async function jogo(b, w, h, esc, fn) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: esc, colorScheme: 'dark' });
  await ctx.addInitScript(() => { try { localStorage.setItem('pokeron.visto', 'true'); localStorage.setItem('pokeron.prefs', JSON.stringify({ vel: 'rapido', n: 6, h: 1, nivel: 0 })); localStorage.setItem('pokeron.cfg', JSON.stringify({ tema: 'escuro' })); } catch (e) {} });
  const p = await ctx.newPage(); await p.goto('http://localhost:8123/index.html'); await p.waitForTimeout(900);
  await fn(p); await ctx.close();
}
const ate = async (p, min) => {
  for (let i = 0; i < 300; i++) {
    const n = await p.evaluate(() => document.querySelectorAll('#board .slot:not(.vazio)').length);
    const vez = await p.$('[data-a="call"],[data-a="check"]');
    if (n >= min && vez) return true;
    if (vez) await p.click('[data-a="call"],[data-a="check"]'); else { const nx = await p.$('[data-a="prox"]'); if (nx) await nx.click(); await p.waitForTimeout(120); }
  }
  return false;
};
(async () => {
  const b = await chromium.launch();
  await jogo(b, 390, 844, 2, async (p) => { await ate(p, 3); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1200); await p.screenshot({ path: 'screenshots/mobile.png' }); });
  await jogo(b, 1280, 800, 1, async (p) => { await ate(p, 4); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1200); await p.screenshot({ path: 'screenshots/desktop.png' }); });
  await jogo(b, 390, 844, 2, async (p) => { await ate(p, 3); await p.click('#tabela-btn'); await p.waitForTimeout(700); await p.screenshot({ path: 'screenshots/tabela.png' }); });
  await jogo(b, 390, 844, 2, async (p) => {
    await p.click('#modo-btn'); await p.click('#tiles-modo [data-modo="mesa"]');
    await p.fill('#nf0', 'Ana'); await p.fill('#nf1', 'Beto'); await p.fill('#nf2', 'Carla'); await p.fill('#nf3', 'Davi');
    await p.click('#partida-jogar'); await p.waitForTimeout(250);
    if (await p.$('#confirm-modal[aria-hidden="false"]')) await p.click('#confirm-yes');
    await p.waitForTimeout(300); await p.click('[data-a="comecar"]'); await p.waitForTimeout(300);
    await p.click('[data-a="call"]'); await p.click('[data-a="call"],[data-a="check"]'); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500);
    await p.screenshot({ path: 'screenshots/mesa-real.png' });
  });
  await b.close();
})();

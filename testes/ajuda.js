const { chromium } = require('playwright');
const S = '/tmp/claude-0/-home-claude/b5735e4c-ab2c-5e7c-9d08-683153cedede/scratchpad/shots/';
(async () => {
  const b = await chromium.launch();
  for (const [w, h, nome] of [[260, 600, '260'], [390, 844, '390'], [1280, 800, 'desk']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: 'dark' });
    const p = await ctx.newPage(); await p.goto('http://localhost:8123/index.html'); await p.waitForTimeout(900);
    const abas = await p.$$('.aba');
    const aberto = await p.evaluate(() => !!document.querySelector('.modal[aria-hidden="false"]'));
    console.log(nome, 'abas', abas.length, 'modal aberto', aberto);
    for (let i = 0; i < Math.max(abas.length, 1); i++) {
      if (abas[i]) await abas[i].click();
      await p.waitForTimeout(250);
      await p.screenshot({ path: S + `ajuda-${nome}-${i}.png`, fullPage: false });
      const body = await p.$('.modal[aria-hidden="false"] .modal-body');
      if (body) { await body.evaluate(e => e.scrollTo(0, 9999)); await p.waitForTimeout(150); await p.screenshot({ path: S + `ajuda-${nome}-${i}b.png` }); }
    }
    await ctx.close();
  }
  await b.close();
})();

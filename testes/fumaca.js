const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: +(process.argv[2] || 390), height: +(process.argv[3] || 844) }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const erros = [];
  p.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
  p.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
  p.on('response', (r) => { if (r.status() >= 400) erros.push(r.status() + ' ' + r.url()); });
  await p.goto('http://localhost:8123/index.html'); await p.waitForTimeout(1500);
  await p.screenshot({ path: process.argv[4] || '/tmp/s1.png', fullPage: true });
  console.log(erros.join('\n') || 'sem erros');
  await b.close();
})();

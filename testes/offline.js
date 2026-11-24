const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('pokeron.visto', 'true'); } catch (e) {} });
  const p = await ctx.newPage(); const ruins = []; const erros = [];
  p.on('response', (r) => { if (r.status() >= 400) ruins.push(r.status() + ' ' + r.url()); });
  p.on('pageerror', (e) => erros.push(e.message));
  await p.goto('http://localhost:8123/index.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => navigator.serviceWorker.ready); await p.waitForTimeout(1500);
  console.log('respostas 4xx/5xx:', ruins.join(' | ') || 'nenhuma');
  await ctx.setOffline(true);
  await p.reload(); await p.waitForTimeout(1500);
  const ok = await p.evaluate(() => !!document.querySelector('.assento') && document.title === 'PokerON!');
  console.log('offline abre o jogo com mesa:', ok, erros.join('|') || '');
  const manifest = await p.evaluate(() => fetch('manifest.json').then((r) => r.json()).then((m) => m.name));
  console.log('manifest offline:', manifest);
  await b.close();
})();

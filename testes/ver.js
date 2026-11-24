const { chromium } = require('playwright');
const SD = '/tmp/claude-0/-home-claude/b5735e4c-ab2c-5e7c-9d08-683153cedede/scratchpad/shots/';
(async () => {
  const [w, h, nome, tema, passos] = [+process.argv[2] || 390, +process.argv[3] || 844, process.argv[4] || 'v', process.argv[5] || 'claro', process.argv[6] || ''];
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: tema === 'escuro' ? 'dark' : 'light' });
  await ctx.addInitScript(() => { try { localStorage.setItem('pokeron.visto', 'true'); } catch (e) {} });
  const p = await ctx.newPage(); const erros = [];
  p.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) erros.push('console: ' + m.text()); });
  await p.goto('http://localhost:8123/index.html'); await p.waitForTimeout(1200);
  for (const s of passos.split(',').filter(Boolean)) {
    if (s.startsWith('#') || s.startsWith('.') || s.startsWith('[')) await p.click(s); else if (s.startsWith('w')) await p.waitForTimeout(+s.slice(1));
  }
  await p.screenshot({ path: SD + nome + '.png', fullPage: true });
  console.log(erros.join('\n') || 'sem erros');
  await b.close();
})();

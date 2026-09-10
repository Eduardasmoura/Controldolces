/**
 * Verificação da landing page num navegador real.
 *
 * Checa, em cada largura da lista, três coisas que não dá para garantir lendo o
 * código: se a página rola na horizontal, se o console acusa erro e se algum
 * elemento vaza para fora da tela. Também confere que os CTAs apontam para as
 * rotas de cadastro e login de verdade.
 *
 * Uso: node scripts/verificar-landing.mjs [http://localhost:3000]
 */
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:3000';

/**
 * Em ambientes que já trazem o Chromium instalado (contêineres de CI), usa o
 * binário existente em vez de baixar outro. Localmente, o Playwright resolve
 * sozinho.
 */
const CHROMIUM_DO_AMBIENTE = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
].find((caminho) => caminho && existsSync(caminho));
const LARGURAS = [360, 390, 414, 768, 1024, 1440];
const ROTAS = ['/', '/como-funciona', '/suporte', '/termos', '/privacidade', '/entrar', '/criar-conta'];

const browser = await chromium.launch(
  CHROMIUM_DO_AMBIENTE ? { executablePath: CHROMIUM_DO_AMBIENTE } : {},
);
let falhas = 0;

function reportar(ok, texto) {
  if (!ok) falhas += 1;
  console.log(`${ok ? '  ok  ' : ' FALHA'} ${texto}`);
}

// ---------------------------------------------------------------- overflow
console.log('\nOverflow horizontal e erros de console\n');

for (const largura of LARGURAS) {
  const context = await browser.newContext({
    viewport: { width: largura, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  for (const rota of ROTAS) {
    const erros = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erros.push(msg.text());
    });
    page.on('pageerror', (erro) => erros.push(String(erro)));

    await page.goto(`${BASE}${rota}`, { waitUntil: 'networkidle' });

    const medida = await page.evaluate(() => {
      const doc = document.documentElement;
      // Maior borda direita entre todos os elementos visíveis da página.
      let maiorDireita = 0;
      let culpado = '';
      for (const el of document.body.querySelectorAll('*')) {
        const caixa = el.getBoundingClientRect();
        if (caixa.width === 0 && caixa.height === 0) continue;
        if (caixa.right > maiorDireita) {
          maiorDireita = caixa.right;
          culpado = `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`;
        }
      }
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        maiorDireita: Math.round(maiorDireita),
        culpado,
      };
    });

    const rolaHorizontal = medida.scrollWidth > medida.clientWidth + 1;
    reportar(
      !rolaHorizontal && erros.length === 0,
      `${String(largura).padStart(4)}px ${rota.padEnd(18)} scroll ${medida.scrollWidth}/${medida.clientWidth}` +
        (rolaHorizontal ? `  ← vaza em ${medida.culpado}` : '') +
        (erros.length ? `  ← console: ${erros[0]}` : ''),
    );

    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
  }

  await context.close();
}

// ------------------------------------------------------------------- CTAs
console.log('\nCTAs e navegação\n');

const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

const cadastro = await page.locator('a[href="/criar-conta"]').count();
const login = await page.locator('a[href="/entrar"]').count();
reportar(cadastro >= 3, `${cadastro} links para /criar-conta na página`);
reportar(login >= 1, `${login} link(s) para /entrar na página`);

// Todo link interno precisa levar a algum lugar que responda.
const hrefs = await page.$$eval('a[href^="/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
for (const href of hrefs.sort()) {
  const resposta = await page.request.get(`${BASE}${href}`);
  reportar(resposta.status() < 400, `${href} → ${resposta.status()}`);
}

// O CTA principal precisa realmente abrir o cadastro.
await page.locator('a[href="/criar-conta"]').first().click();
await page.waitForURL('**/criar-conta');
const temFormulario = await page.locator('form input[name="email"]').count();
reportar(temFormulario === 1, 'CTA "Começar agora" abre o formulário de cadastro real');

// ------------------------------------------------------------------- fim
await browser.close();
console.log(falhas === 0 ? '\nTudo certo.\n' : `\n${falhas} verificação(ões) falharam.\n`);
process.exit(falhas === 0 ? 0 : 1);

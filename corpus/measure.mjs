// Manual network benchmark. Run `npm run build && node corpus/measure.mjs`.
// This is deliberately outside tests/: public pages are not stable CI fixtures.
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { capturePage } from '../dist/extract/accessibility.js';
import { mergeSemanticNodes } from '../dist/semantic/merger.js';
import { generateSemanticIds } from '../dist/semantic/identity.js';
import { buildContentStructure } from '../dist/semantic/structure.js';
import { serializeText } from '../dist/serialize/text.js';

const pages = [
  { group: 'Simple', url: 'https://example.com/' },
  { group: 'Simple', url: 'https://en.wikipedia.org/wiki/HTML' },
  { group: 'Simple', url: 'https://www.paulgraham.com/startupideas.html' },
  { group: 'Simple', url: 'https://motherfuckingwebsite.com/' },
  { group: 'SPA', url: 'https://github.com/microsoft/playwright' },
  { group: 'SPA', url: 'https://vuejs.org/examples/#hello-world' },
  { group: 'SPA', url: 'https://react.dev/learn' },
  { group: 'Dashboard', url: 'https://adminlte.io/themes/v3/index.html' },
  { group: 'Dashboard', url: 'https://preview.tabler.io/' },
  { group: 'Ecommerce', url: 'https://demowebshop.tricentis.com/build-your-own-computer' },
  { group: 'Ecommerce', url: 'https://magento.softwaretestingboard.com/gear/bags.html' },
  { group: 'Form', url: 'https://getbootstrap.com/docs/5.3/examples/checkout/' },
  { group: 'Form', url: 'https://demoqa.com/automation-practice-form' },
  { group: 'Modal/dropdown', url: 'https://getbootstrap.com/docs/5.3/components/modal/' },
  { group: 'Modal/dropdown', url: 'https://getbootstrap.com/docs/5.3/components/dropdowns/' },
  { group: 'Iframe', url: 'https://the-internet.herokuapp.com/iframe' },
  { group: 'Iframe', url: 'https://the-internet.herokuapp.com/nested_frames' },
  { group: 'Custom component', url: 'https://shoelace.style/components/input' },
  { group: 'Custom component', url: 'https://shoelace.style/components/dialog' },
  { group: 'SPA', url: 'https://svelte.dev/repl/hello-world' },
  { group: 'Ecommerce', url: 'https://www.demoblaze.com/prod.html?idp_=1' },
  { group: 'Custom component', url: 'https://lit.dev/tutorials/content/intro-to-lit/00/' },
  { group: 'Custom component', url: 'https://lit.dev/playground/' },
  { batch: 2, group: 'Iframe', url: 'https://testpages.eviltester.com/pages/embedded-pages/iframes/' },
  { batch: 2, group: 'Iframe', url: 'https://testpages.eviltester.com/pages/embedded-pages/external-content/' },
  { batch: 2, group: 'Iframe', url: 'https://testpages.eviltester.com/pages/embedded-pages/external-sites/' },
  { batch: 2, group: 'Iframe', url: 'https://www.w3schools.com/html/tryit.asp?filename=tryhtml_iframe' },
  { batch: 2, group: 'Custom component', url: 'https://testpages.eviltester.com/pages/web-components/shadow-dom-style/' },
  { batch: 2, group: 'Custom component', url: 'https://testpages.eviltester.com/pages/web-components/shadow-web-component/' },
  { batch: 2, group: 'Custom component', url: 'https://testpages.eviltester.com/pages/web-components/shadow-widget/' },
  { batch: 2, group: 'Custom component', url: 'https://material-web.dev/components/button/' },
  { batch: 2, group: 'Dashboard', url: 'https://adminlte.io/themes/v3/index2.html' },
  { batch: 2, group: 'Dashboard', url: 'https://adminlte.io/themes/v3/index3.html' },
  { batch: 2, group: 'Dashboard', url: 'https://laravel.adminlte.io/demo/dashboard-v2' },
  { batch: 2, group: 'Ecommerce', url: 'https://demowebshop.tricentis.com/books' },
  { batch: 2, group: 'Ecommerce', url: 'https://demowebshop.tricentis.com/digital-downloads' },
  { batch: 2, group: 'Ecommerce', url: 'https://demowebshop.tricentis.com/apparel-shoes' },
  { batch: 2, group: 'Form', url: 'https://adminlte.io/themes/v3/pages/forms/general.html' },
  { batch: 2, group: 'Form', url: 'https://adminlte.io/themes/v3/pages/forms/advanced.html' },
  { batch: 2, group: 'Form', url: 'https://testpages.eviltester.com/apps/client-server-form-validation/' },
  { batch: 2, group: 'Modal/dropdown', url: 'https://getbootstrap.com/docs/5.3/components/offcanvas/' },
  { batch: 2, group: 'Modal/dropdown', url: 'https://getbootstrap.com/docs/5.3/components/popovers/' },
  { batch: 2, group: 'Modal/dropdown', url: 'https://getbootstrap.com/docs/5.3/components/navs-tabs/' },
  { batch: 3, group: 'Simple', url: 'https://en.wikipedia.org/wiki/Alan_Turing' },
  { batch: 3, group: 'Simple', url: 'https://en.wikipedia.org/wiki/Photosynthesis' },
  { batch: 3, group: 'Simple', url: 'https://en.wikipedia.org/wiki/List_of_countries_by_population_(United_Nations)' },
  { batch: 3, group: 'Simple', url: 'https://news.ycombinator.com/' },
  { batch: 3, group: 'Simple', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table' },
  { batch: 3, group: 'Simple', url: 'https://www.gnu.org/philosophy/free-sw.html' },
  { batch: 3, group: 'Simple', url: 'https://www.w3.org/TR/WCAG22/' },
  { batch: 3, group: 'Simple', url: 'https://www.rfc-editor.org/rfc/rfc8259.html' },
  { batch: 3, group: 'Simple', url: 'https://www.paulgraham.com/greatwork.html' },
  { batch: 3, group: 'Simple', url: 'https://www.sqlite.org/lang_select.html' },
  { batch: 3, group: 'SPA', url: 'https://github.com/vercel/next.js/issues' },
  { batch: 3, group: 'SPA', url: 'https://github.com/vuejs/core' },
  { batch: 3, group: 'SPA', url: 'https://gitlab.com/gitlab-org/gitlab' },
  { batch: 3, group: 'SPA', url: 'https://vuejs.org/guide/introduction.html' },
  { batch: 3, group: 'SPA', url: 'https://angular.dev/tutorials/learn-angular' },
  { batch: 3, group: 'SPA', url: 'https://app.diagrams.net/' },
  { batch: 3, group: 'SPA', url: 'https://excalidraw.com/' },
  { batch: 3, group: 'SPA', url: 'https://nextjs.org/showcase' },
  { batch: 3, group: 'SPA', url: 'https://web.dev/learn/performance' },
  { batch: 3, group: 'SPA', url: 'https://developer.chrome.com/docs/devtools/' },
  { batch: 3, group: 'SPA', url: 'https://github.com/microsoft/TypeScript/issues' },
  { batch: 3, group: 'SPA', url: 'https://angular.dev/overview' },
  { batch: 4, group: 'Dashboard', url: 'https://adminlte.io/themes/v3/pages/charts/chartjs.html' },
  { batch: 4, group: 'Dashboard', url: 'https://adminlte.io/themes/v3/pages/tables/data.html' },
  { batch: 4, group: 'Dashboard', url: 'https://laravel.adminlte.io/demo/dashboard-v3' },
  { batch: 4, group: 'Dashboard', url: 'https://laravel.adminlte.io/demo/widgets/small-box' },
  { batch: 4, group: 'Ecommerce', url: 'https://demowebshop.tricentis.com/electronics' },
  { batch: 4, group: 'Ecommerce', url: 'https://demowebshop.tricentis.com/jewelry' },
  { batch: 4, group: 'Ecommerce', url: 'https://www.demoblaze.com/prod.html?idp_=2' },
  { batch: 4, group: 'Form', url: 'https://demoqa.com/text-box' },
  { batch: 4, group: 'Form', url: 'https://demoqa.com/checkbox' },
  { batch: 4, group: 'Form', url: 'https://laravel.adminlte.io/demo/forms/validation' },
  { batch: 4, group: 'Form', url: 'https://laravel.adminlte.io/demo/forms/wizard' },
  { batch: 4, group: 'Modal/dropdown', url: 'https://getbootstrap.com/docs/5.3/components/accordion/' },
  { batch: 4, group: 'Modal/dropdown', url: 'https://getbootstrap.com/docs/5.3/components/tooltips/' },
  { batch: 4, group: 'Modal/dropdown', url: 'https://mui.com/material-ui/react-dialog/' },
  { batch: 4, group: 'Modal/dropdown', url: 'https://mui.com/material-ui/react-menu/' },
  { batch: 4, group: 'Iframe', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe' },
  { batch: 4, group: 'Iframe', url: 'https://www.w3schools.com/html/html_iframe.asp' },
  { batch: 4, group: 'Iframe', url: 'https://testpages.eviltester.com/pages/embedded-pages/', excludedReason: 'Index page has no iframe after render' },
  { batch: 4, group: 'Custom component', url: 'https://material-web.dev/components/checkbox/' },
  { batch: 4, group: 'Custom component', url: 'https://material-web.dev/components/dialog/' },
  { batch: 4, group: 'Iframe', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/object' },
  { batch: 4, group: 'Iframe', url: 'https://the-internet.herokuapp.com/tinymce' },
];

if (new Set(pages.map((page) => page.url)).size !== pages.length) {
  throw new Error('Duplicate corpus URL');
}

// Same Unicode regex as tests/acceptance.test.ts. It counts markup punctuation.
function tokenCount(value) {
  return value.match(/[\p{L}\p{N}_]+|[^\s]/gu)?.length ?? 0;
}

async function measure(browser, entry) {
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);
  let timer;
  try {
    const task = (async () => {
      const response = await page.goto(entry.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      if (process.argv[2] === '--worker') process.stderr.write(`loaded ${entry.url}\n`);
      await page.waitForTimeout(1_200);
      const [html, title] = await Promise.all([page.content(), page.title()]);
      if (process.argv[2] === '--worker') process.stderr.write(`dom ${html.length} chars ${entry.url}\n`);
      if (!response || response.status() >= 400) throw new Error(`HTTP ${response?.status() ?? 'no response'}`);
      if (/captcha|access denied|just a moment|verify you are human/i.test(title)) throw new Error(`Possible bot block: ${title}`);
      const captured = await capturePage(page);
      if (process.argv[2] === '--worker') process.stderr.write(`captured ${entry.url}\n`);
      const nodes = generateSemanticIds(mergeSemanticNodes(captured));
      const snapshot = serializeText(captured, buildContentStructure(nodes));
      if (process.argv[2] === '--worker') process.stderr.write(`serialized ${entry.url}\n`);
      const rawTokens = tokenCount(html);
      const snapshotTokens = tokenCount(snapshot);
      if (!rawTokens) throw new Error('Empty DOM token count');
      return { ...entry, finalUrl: page.url(), title, rawTokens, snapshotTokens,
        ratio: snapshotTokens / rawTokens, htmlBytes: Buffer.byteLength(html),
        frameCount: page.frames().length - 1, snapshotChars: snapshot.length };
    })();
    return await Promise.race([
      task,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('45-second page deadline exceeded')), 45_000); }),
    ]);
  } catch (error) {
    return { ...entry, finalUrl: page.url(), error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
    await page.close({ runBeforeUnload: false }).catch(() => {});
  }
}

if (process.argv[2] === '--worker') {
  const browser = await chromium.launch({ headless: true });
  try {
    process.stdout.write(JSON.stringify(await measure(browser, pages[Number(process.argv[3])])) + '\n');
  } finally {
    await browser.close();
  }
} else {
  const start = process.argv[2] === '--from' ? Number(process.argv[3]) : 0;
  if (!Number.isInteger(start) || start < 0 || start > pages.length) throw new Error('Invalid --from index');
  const existing = start ? JSON.parse(await readFile(new URL('./results.json', import.meta.url), 'utf8')) : null;
  const previous = existing?.results ?? [];
  if (previous.length !== start || previous.some((row, index) => row.url !== pages[index].url)) {
    throw new Error('Existing results do not match the URL list before --from');
  }
  const results = [...previous];
  for (const [index, entry] of pages.entries()) {
    if (index < start) continue;
    const child = spawnSync(process.execPath, ['--max-old-space-size=768', new URL(import.meta.url).pathname, '--worker', String(index)], {
      timeout: 55_000, encoding: 'utf8', maxBuffer: 1024 * 1024,
    });
    let result;
    try {
      result = JSON.parse(child.stdout.trim());
    } catch {
      result = { ...entry, error: child.error?.message ?? (child.signal
        ? `Worker killed by ${child.signal}` : `Worker exit ${child.status}: ${child.stderr.slice(-300).trim()}`) };
    }
    results.push(result);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    // Keep partial results if the process is interrupted.
    await writeFile(new URL('./results.json', import.meta.url), JSON.stringify({
      measuredAt: existing?.measuredAt ?? new Date().toISOString(),
      batch2MeasuredAt: existing?.batch2MeasuredAt ?? new Date().toISOString(),
      ...(results.some((row) => row.batch === 3) && {
        batch3MeasuredAt: existing?.batch3MeasuredAt ?? new Date().toISOString(),
      }),
      ...(results.some((row) => row.batch === 4) && {
        batch4MeasuredAt: existing?.batch4MeasuredAt ?? new Date().toISOString(),
      }),
      method: 'Chromium page.content() before capturePage; same page; 1200ms stabilization; Unicode regex from tests/acceptance.test.ts',
      results,
    }, null, 2) + '\n');
  }
}

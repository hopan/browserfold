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
];

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
  const previous = start ? JSON.parse(await readFile(new URL('./results.json', import.meta.url), 'utf8')).results : [];
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
      measuredAt: new Date().toISOString(),
      method: 'Chromium page.content() before capturePage; same page; 1200ms stabilization; Unicode regex from tests/acceptance.test.ts',
      results,
    }, null, 2) + '\n');
  }
}

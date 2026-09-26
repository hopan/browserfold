// Manual real-page pilot. Run `npm run build && node corpus/measure_recall.mjs`.
// The oracle is deliberately independent of src/semantic/interactive.ts.
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { capturePage } from '../dist/extract/accessibility.js';
import { mergeSemanticNodes } from '../dist/semantic/merger.js';
import { generateSemanticIds } from '../dist/semantic/identity.js';
import { buildContentStructure } from '../dist/semantic/structure.js';
import { serializeText } from '../dist/serialize/text.js';

const source = JSON.parse(await readFile(new URL('./results.json', import.meta.url), 'utf8'));
const selection = [
  ['Simple', 0], ['Simple', 2], ['Simple', 7], ['Simple', 14],
  ['SPA', 0], ['SPA', 1], ['SPA', 5], ['SPA', 9],
  ['Dashboard', 0], ['Dashboard', 2],
  ['Ecommerce', 0], ['Ecommerce', 2],
  ['Form', 0], ['Form', 2],
  ['Modal/dropdown', 0], ['Modal/dropdown', 1],
  ['Iframe', 1], ['Custom component', 5],
];
const pages = selection.map(([group, index]) => {
  const choices = source.results.filter((row) => row.group === group && !row.error && !row.excludedReason);
  if (!choices[index]) throw new Error(`Missing corpus URL for ${group} index ${index}`);
  return { group, url: choices[index].url };
});

// Evaluated in every reachable frame. ID is only a temporary probe, not a product attribute.
function tagOracleElements(frameNumber) {
  const selector = 'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="tab"], [role="combobox"], [role="option"], [role="slider"], [role="spinbutton"], [role="searchbox"], [role="textbox"], [contenteditable=""], [contenteditable="true"], [tabindex]';
  const nonTabSelector = selector.replace(', [tabindex]', '');
  const result = [];
  let ordinal = 0;
  function parent(element) {
    return element.parentElement ?? element.getRootNode()?.host ?? null;
  }
  function visitRoot(root) {
    for (const element of root.querySelectorAll('*')) {
      if (element.matches(selector)) {
        const tabOnly = !element.matches(nonTabSelector);
        const rawTabIndex = element.getAttribute('tabindex')?.trim();
        const tabIndex = rawTabIndex ? Number(rawTabIndex) : NaN;
        if (!tabOnly || (element.hasAttribute('tabindex') && Number.isFinite(tabIndex) && tabIndex >= 0)) {
          let visible = true;
          for (let ancestor = element; ancestor; ancestor = parent(ancestor)) {
            const style = getComputedStyle(ancestor);
            if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse'
                || Number(style.opacity) <= 0 || ancestor.getAttribute('aria-hidden') === 'true') {
              visible = false;
              break;
            }
          }
          const rect = element.getBoundingClientRect();
          if (visible && rect.width > 0 && rect.height > 0
              && !('disabled' in element && element.disabled)
              && element.getAttribute('aria-disabled') !== 'true') {
            const id = `bf-oracle-${frameNumber}-${++ordinal}`;
            element.setAttribute('data-bf-oracle-id', id);
            result.push({ id, tag: element.localName, role: element.getAttribute('role'),
              label: (element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 100) });
          }
        }
      }
      if (element.shadowRoot) visitRoot(element.shadowRoot);
    }
  }
  visitRoot(document);
  return result;
}

function markerMap(root) {
  const ids = new Map();
  function visit(node) {
    const attrs = node.attributes ?? [];
    for (let index = 0; index < attrs.length; index += 2) {
      if (attrs[index] === 'data-bf-oracle-id' && node.backendNodeId !== undefined) {
        ids.set(node.backendNodeId, attrs[index + 1]);
      }
    }
    for (const child of node.children ?? []) visit(child);
    for (const shadow of node.shadowRoots ?? []) visit(shadow);
    if (node.contentDocument) visit(node.contentDocument);
  }
  visit(root);
  return ids;
}

async function measure(entry) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);
  try {
    const response = await page.goto(entry.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1_200);
    const title = await page.title();
    if (!response || response.status() >= 400) throw new Error(`HTTP ${response?.status() ?? 'no response'}`);
    if (/captcha|access denied|just a moment|verify you are human/i.test(title)) throw new Error(`Possible bot block: ${title}`);
    const oracle = [];
    const frameErrors = [];
    for (const [index, frame] of page.frames().entries()) {
      try { oracle.push(...await frame.evaluate(tagOracleElements, index)); }
      catch (error) { frameErrors.push(`${frame.url()}: ${String(error).slice(0, 140)}`); }
    }
    if (frameErrors.length) throw new Error(`Oracle could not inspect ${frameErrors.length} frame(s): ${frameErrors.join('; ')}`);
    const captured = await capturePage(page);
    const nodes = generateSemanticIds(mergeSemanticNodes(captured));
    const snapshot = serializeText(captured, buildContentStructure(nodes));
    const markers = markerMap(captured.dom.root);
    // Product DOM capture does not pierce shadow roots. A read-only CDP tree here
    // resolves marker IDs for AX-only semantic nodes sourced from those roots.
    const session = await page.context().newCDPSession(page);
    try {
      const pierced = await session.send('DOM.getDocument', { depth: -1, pierce: true });
      for (const [backendId, id] of markerMap(pierced.root)) markers.set(backendId, id);
    } finally {
      await session.detach();
    }
    const detected = nodes.filter((node) => node.visible && node.interactive && snapshot.includes(`[${node.id}]`));
    const oracleIds = new Set(oracle.map((item) => item.id));
    const matchedIds = new Set(detected.map((node) => markers.get(node.source?.backendNodeId)).filter((id) => id && oracleIds.has(id)));
    const unmatchedDetected = detected.filter((node) => !oracleIds.has(markers.get(node.source?.backendNodeId)));
    const missing = oracle.filter((item) => !matchedIds.has(item.id));
    return { ...entry, finalUrl: page.url(), title, oracle: oracle.length, detected: detected.length,
      matched: matchedIds.size, recall: oracle.length ? matchedIds.size / oracle.length : null,
      precision: detected.length ? matchedIds.size / detected.length : null,
      mappedOracle: [...markers.values()].filter((id) => oracleIds.has(id)).length,
      frameCount: page.frames().length - 1, frameErrors,
      missingExamples: missing.slice(0, 8),
      falsePositiveExamples: unmatchedDetected.slice(0, 8).map((node) => ({ tag: node.tag, role: node.role, name: node.name?.slice(0, 100) })),
    };
  } catch (error) {
    return { ...entry, error: error instanceof Error ? error.message : String(error) };
  } finally {
    await page.close({ runBeforeUnload: false }).catch(() => {});
    await browser.close();
  }
}

if (process.argv[2] === '--worker') {
  process.stdout.write(`${JSON.stringify(await measure(pages[Number(process.argv[3])]))}\n`);
} else {
  const results = [];
  function summary() {
    const valid = results.filter((row) => !row.error && row.recall !== null && row.precision !== null);
    const sum = (key) => valid.reduce((total, row) => total + row[key], 0);
    const oracle = sum('oracle');
    const detected = sum('detected');
    const matched = sum('matched');
    return { attempted: results.length, measured: valid.length, oracle, detected, matched,
      meanRecall: valid.length ? sum('recall') / valid.length : null,
      meanPrecision: valid.length ? sum('precision') / valid.length : null,
      pooledRecall: oracle ? matched / oracle : null,
      pooledPrecision: detected ? matched / detected : null };
  }
  for (const [index, entry] of pages.entries()) {
    const child = spawnSync(process.execPath, ['--max-old-space-size=768', new URL(import.meta.url).pathname, '--worker', String(index)], {
      timeout: 60_000, encoding: 'utf8', maxBuffer: 1024 * 1024,
    });
    let result;
    try { result = JSON.parse(child.stdout.trim()); }
    catch { result = { ...entry, error: child.error?.message ?? (child.signal
      ? `Worker killed by ${child.signal}` : `Worker exit ${child.status}: ${child.stderr.slice(-300).trim()}`) }; }
    results.push(result);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    await writeFile(new URL('./recall_pilot.json', import.meta.url), `${JSON.stringify({ measuredAt: new Date().toISOString(), summary: summary(), results }, null, 2)}\n`);
  }
}

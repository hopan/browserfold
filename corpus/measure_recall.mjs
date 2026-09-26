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
  ['Iframe', 0], ['Iframe', 2], ['Iframe', 3], ['Iframe', 4], ['Iframe', 6],
  ['Custom component', 0], ['Custom component', 2], ['Custom component', 3], ['Custom component', 6],
  ['Dashboard', 1], ['Dashboard', 3], ['Dashboard', 5],
  ['Ecommerce', 1], ['Ecommerce', 3], ['Ecommerce', 4],
  ['Form', 1], ['Form', 3], ['Form', 4],
  ['Modal/dropdown', 2], ['Modal/dropdown', 5], ['Modal/dropdown', 7],
  ['Simple', 1], ['Simple', 8],
  ['SPA', 6], ['SPA', 11],
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
              label: (element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 100),
              frameNumber, inShadow: element.getRootNode() instanceof ShadowRoot,
              ancestors: (() => { const names = []; for (let current = parent(element); current && names.length < 5; current = parent(current)) names.push(current.localName + (current.getAttribute('role') ? `[role=${current.getAttribute('role')}]` : '')); return names; })(),
              html: element.outerHTML.slice(0, 300) });
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

async function measure(entry, inspect = false) {
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
    const diagnostic = inspect ? {
      oracle, missing, nodes: nodes.filter((node) => markers.has(node.source?.backendNodeId)).map((node) => ({
        oracleId: markers.get(node.source?.backendNodeId), tag: node.tag, role: node.role,
        name: node.name, id: node.id, visible: node.visible, interactive: node.interactive,
        inText: snapshot.includes(`[${node.id}]`), enabled: node.enabled,
      })), snapshot: snapshot.slice(0, 12000),
    } : {};
    return { ...entry, finalUrl: page.url(), title, oracle: oracle.length, detected: detected.length,
      matched: matchedIds.size, recall: oracle.length ? matchedIds.size / oracle.length : null,
      precision: detected.length ? matchedIds.size / detected.length : null,
      mappedOracle: [...markers.values()].filter((id) => oracleIds.has(id)).length,
      frameCount: page.frames().length - 1, frameErrors,
      missingExamples: missing.slice(0, 8),
      falsePositiveExamples: unmatchedDetected.slice(0, 8).map((node) => ({ tag: node.tag, role: node.role, name: node.name?.slice(0, 100) })),
      ...diagnostic,
    };
  } catch (error) {
    return { ...entry, error: error instanceof Error ? error.message : String(error) };
  } finally {
    await page.close({ runBeforeUnload: false }).catch(() => {});
    await browser.close();
  }
}

if (process.argv[2] === '--inspect-url') {
  process.stdout.write(`${JSON.stringify(await measure({ group: 'Iframe', url: process.argv[3] }, true))}\n`);
} else if (process.argv[2] === '--worker-pilot') {
  const previous = JSON.parse(await readFile(new URL('./recall_pilot.json', import.meta.url), 'utf8'));
  const pilot = previous.results.filter((row) => row.batch !== 2);
  const entry = pilot[Number(process.argv[3])];
  if (!entry) throw new Error(`Missing pilot row ${process.argv[3]}`);
  process.stdout.write(`${JSON.stringify(await measure({ group: entry.group, url: entry.url }))}\n`);
} else if (process.argv[2] === '--worker-existing') {
  const previous = JSON.parse(await readFile(new URL('./recall_pilot.json', import.meta.url), 'utf8'));
  const entry = previous.results.filter((row) => !row.error)[Number(process.argv[3])];
  if (!entry) throw new Error(`Missing existing row ${process.argv[3]}`);
  process.stdout.write(`${JSON.stringify(await measure({ group: entry.group, url: entry.url }))}\n`);
} else if (process.argv[2] === '--worker') {
  process.stdout.write(`${JSON.stringify(await measure(pages[Number(process.argv[3])]))}\n`);
} else {
  const output = new URL('./recall_pilot.json', import.meta.url);
  const previous = JSON.parse(await readFile(output, 'utf8'));
  const results = [...previous.results];
  const existingUrls = new Set(results.map((row) => row.url));
  if (existingUrls.size !== results.length) throw new Error('Duplicate URL in existing recall results');
  if (new Set(pages.map((row) => row.url)).size !== pages.length) throw new Error('Duplicate URL in selection');
  const overlap = pages.filter((row) => existingUrls.has(row.url) && results.find((result) => result.url === row.url)?.batch !== 2);
  if (overlap.length) throw new Error(`Selection overlaps earlier batch: ${overlap.map((row) => row.url).join(', ')}`);
  function summary(rows) {
    const valid = rows.filter((row) => !row.error && row.recall !== null && row.precision !== null);
    const sum = (key) => valid.reduce((total, row) => total + row[key], 0);
    const oracle = sum('oracle');
    const detected = sum('detected');
    const matched = sum('matched');
    return { attempted: rows.length, measured: valid.length, oracle, detected, matched,
      meanRecall: valid.length ? sum('recall') / valid.length : null,
      meanPrecision: valid.length ? sum('precision') / valid.length : null,
      pooledRecall: oracle ? matched / oracle : null,
      pooledPrecision: detected ? matched / detected : null };
  }
  if (process.argv[2] === '--rerun-all') {
    const entries = results.filter((row) => !row.error);
    if (entries.length !== 42 || new Set(entries.map((row) => row.url)).size !== 42) {
      throw new Error(`Expected 42 distinct measured URLs, found ${entries.length}`);
    }
    const rerun = [];
    for (const [index, entry] of entries.entries()) {
      const child = spawnSync(process.execPath, ['--max-old-space-size=768', new URL(import.meta.url).pathname, '--worker-existing', String(index)], {
        timeout: 60_000, encoding: 'utf8', maxBuffer: 1024 * 1024,
      });
      let result;
      try { result = JSON.parse(child.stdout.trim()); }
      catch { result = { group: entry.group, url: entry.url, error: child.error?.message ?? (child.signal
        ? `Worker killed by ${child.signal}` : `Worker exit ${child.status}: ${child.stderr.slice(-300).trim()}`) }; }
      rerun.push({ ...result, batch: entry.batch });
      process.stdout.write(`${index + 1}/${entries.length} ${JSON.stringify({ url: entry.url,
        oracle: result.oracle, detected: result.detected, matched: result.matched, error: result.error })}\n`);
    }
    await writeFile(output, `${JSON.stringify({
      measuredAt: new Date().toISOString(), baseline: 'post-dispatch-17',
      baselineProductCommit: spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).stdout.trim(),
      summary: summary(rerun), pilotSummary: summary(rerun.filter((row) => row.batch !== 2)),
      batch2Summary: summary(rerun.filter((row) => row.batch === 2)), results: rerun,
    }, null, 2)}\n`);
    process.exit(0);
  }
  if (process.argv[2] === '--rerun-pilot') {
    const pilot = results.filter((row) => row.batch !== 2);
    if (pilot.length !== 18) throw new Error(`Expected 18 pilot URLs, found ${pilot.length}`);
    const rerun = [];
    for (const [index, entry] of pilot.entries()) {
      const child = spawnSync(process.execPath, ['--max-old-space-size=768', new URL(import.meta.url).pathname, '--worker-pilot', String(index)], {
        timeout: 60_000, encoding: 'utf8', maxBuffer: 1024 * 1024,
      });
      let result;
      try { result = JSON.parse(child.stdout.trim()); }
      catch { result = { group: entry.group, url: entry.url, error: child.error?.message ?? (child.signal
        ? `Worker killed by ${child.signal}` : `Worker exit ${child.status}: ${child.stderr.slice(-300).trim()}`) }; }
      rerun.push(result);
      process.stdout.write(`${index + 1}/${pilot.length} ${JSON.stringify(result)}\n`);
    }
    const batch2 = results.filter((row) => row.batch === 2);
    const updated = [...rerun.map((row) => ({ ...row, batch: 1 })), ...batch2];
    const pilotRemeasuredAt = new Date().toISOString();
    await writeFile(output, `${JSON.stringify({ ...previous,
      pilotOriginalMeasuredAt: previous.pilotOriginalMeasuredAt ?? previous.measuredAt,
      measuredAt: pilotRemeasuredAt, pilotRemeasuredAt,
      baseline: 'post-dispatch-14',
      baselineProductCommit: spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).stdout.trim(),
      summary: summary(updated), pilotSummary: summary(rerun), results: updated }, null, 2)}\n`);
    process.exit(0);
  }
  for (const [index, entry] of pages.entries()) {
    if (existingUrls.has(entry.url)) continue;
    const child = spawnSync(process.execPath, ['--max-old-space-size=768', new URL(import.meta.url).pathname, '--worker', String(index)], {
      timeout: 60_000, encoding: 'utf8', maxBuffer: 1024 * 1024,
    });
    let result;
    try { result = JSON.parse(child.stdout.trim()); }
    catch { result = { ...entry, error: child.error?.message ?? (child.signal
      ? `Worker killed by ${child.signal}` : `Worker exit ${child.status}: ${child.stderr.slice(-300).trim()}`) }; }
    results.push({ ...result, batch: 2 });
    existingUrls.add(entry.url);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    await writeFile(output, `${JSON.stringify({ measuredAt: previous.measuredAt, batch2MeasuredAt: new Date().toISOString(), summary: summary(results), batch2Summary: summary(results.filter((row) => row.batch === 2)), results }, null, 2)}\n`);
  }
}

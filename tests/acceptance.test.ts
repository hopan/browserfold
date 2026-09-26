import { describe, expect, it } from 'vitest';
import { launchUrl } from '../src/browser/launcher.js';
import { capturePage } from '../src/extract/accessibility.js';
import { mergeSemanticNodes } from '../src/semantic/merger.js';
import { generateSemanticIds } from '../src/semantic/identity.js';
import { buildContentStructure } from '../src/semantic/structure.js';
import { serializeText } from '../src/serialize/text.js';
import type { SemanticNode } from '../src/semantic/node.js';

const fixtures = [
  {
    name: 'login',
    url: new URL('./fixtures/acceptance-login.html', import.meta.url).href,
    actionable: ['email', 'password', 'remember', 'sign-in', 'forgot-password'],
  },
  {
    name: 'management',
    url: new URL('./fixtures/acceptance-management.html', import.meta.url).href,
    actionable: [
      'query', 'status', 'status-all', 'status-open', 'status-closed', 'urgent-only',
      'apply-filters', 'export', ...Array.from({ length: 8 }, (_, i) => `open-${101 + i}`),
      'previous', 'next', 'task-102', 'task-106',
    ],
  },
] as const;

// A deterministic approximation of tokens for both raw DOM and output. It splits words
// and punctuation, so markup syntax counts instead of disappearing in whitespace chunks.
function tokenCount(value: string): number {
  return value.match(/[\p{L}\p{N}_]+|[^\s]/gu)?.length ?? 0;
}

interface Measurement {
  name: string;
  rawTokens: number;
  snapshotTokens: number;
  text: string;
  nodes: SemanticNode[];
  actionable: readonly string[];
}

async function measureFixture(fixture: typeof fixtures[number]): Promise<Measurement> {
  const session = await launchUrl(fixture.url);
  try {
    const rawHtml = await session.page.content();
    const page = await capturePage(session.page);
    const nodes = generateSemanticIds(mergeSemanticNodes(page));
    const text = serializeText(page, buildContentStructure(nodes));
    return {
      name: fixture.name,
      rawTokens: tokenCount(rawHtml),
      snapshotTokens: tokenCount(text),
      text,
      nodes,
      actionable: fixture.actionable,
    };
  } finally {
    await session.close();
  }
}

describe('SPEC.md section 28 MVP acceptance measurements on Chromium', () => {
  it('reports functional coverage, token ratio, actionable recall and interactive precision', async () => {
    const measurements = [];
    for (const fixture of fixtures) measurements.push(await measureFixture(fixture));

    const login = measurements[0].text;
    const management = measurements[1].text;
    expect.soft(login).toMatch(/textbox "Email address"/);
    expect.soft(login).toMatch(/textbox "Password"/);
    expect.soft(login).toMatch(/button "Sign in"/);
    expect.soft(login).toMatch(/checkbox "Remember this device"/);
    expect.soft(login).toMatch(/alert "Email address is required"/);
    expect.soft(login).toMatch(/link "Forgot password\?"/);
    expect.soft(management).toMatch(/TABLE Orders\ncolumns: Order \| Customer \| Status \| Total \| Action/);
    expect.soft(management).toMatch(/ORD-102 \| Ben Tran \| Address review \| \$84\.50\n  \[e[0-9a-f]+\] button "Open"/);
    expect.soft(management).toMatch(/LIST Follow-up tasks/);
    expect.soft(management).toMatch(/value="September"/);
    expect.soft(management).toMatch(/value="Open"/);
    expect.soft(management).toMatch(/Showing 8 of 42 orders/);
    expect.soft(management).toMatch(/Page 1 of 6/);
    expect.soft(management).toMatch(/One shipment needs an address review/);

    const rawTokens = measurements.reduce((sum, item) => sum + item.rawTokens, 0);
    const snapshotTokens = measurements.reduce((sum, item) => sum + item.snapshotTokens, 0);
    const expected = measurements.flatMap((item) => item.actionable.map((id) => ({ item, id })));
    const represented = expected.filter(({ item, id }) => {
      const node = item.nodes.find((candidate) => candidate.source?.domId === id);
      return node?.visible && node.interactive && item.text.includes(`[${node.id}]`);
    });
    const knownActionable = new Set(expected.map(({ id }) => id));
    const marked = measurements.flatMap((item) => item.nodes.filter((node) => node.visible && node.interactive)
      .map((node) => ({ fixture: item.name, id: node.source?.domId ?? null, role: node.role ?? null })));
    const falsePositive = marked.filter((node) => !node.id || !knownActionable.has(node.id));
    const result = {
      tokenRatio: snapshotTokens / rawTokens,
      fixtures: measurements.map(({ name, rawTokens, snapshotTokens }) => ({ name, rawTokens, snapshotTokens, ratio: snapshotTokens / rawTokens })),
      recall: represented.length / expected.length,
      represented: represented.length,
      expected: expected.length,
      missing: expected.filter(({ item, id }) => !represented.some((found) => found.item === item && found.id === id))
        .map(({ item, id }) => `${item.name}:${id}`),
      precision: (marked.length - falsePositive.length) / marked.length,
      falseInteractiveRate: falsePositive.length / marked.length,
      marked: marked.length,
      falsePositive,
    };
    console.info(`ACCEPTANCE_METRICS ${JSON.stringify(result)}`);
    expect.soft(result.tokenRatio).toBeLessThanOrEqual(0.10);
    expect.soft(result.recall).toBeGreaterThanOrEqual(0.95);
    expect.soft(result.falseInteractiveRate).toBeLessThan(0.05);
  });

  it('produces identical text and semantic IDs in three captures of one unchanged page', async () => {
    const session = await launchUrl(fixtures[1].url);
    try {
      const captures = [];
      for (let i = 0; i < 3; i++) {
        const page = await capturePage(session.page);
        const nodes = generateSemanticIds(mergeSemanticNodes(page));
        captures.push({ text: serializeText(page, buildContentStructure(nodes)), ids: nodes.map((node) => node.id) });
      }
      const identical = captures.every((capture) => capture.text === captures[0].text
        && JSON.stringify(capture.ids) === JSON.stringify(captures[0].ids));
      console.info(`ACCEPTANCE_DETERMINISM ${JSON.stringify({ captures: captures.length, identical, ids: captures[0].ids.length })}`);
      expect(identical).toBe(true);
    } finally {
      await session.close();
    }
  });
});

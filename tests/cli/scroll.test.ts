import { describe, expect, it } from 'vitest';
import { launchUrl } from '../../src/browser/launcher.js';
import { runCli } from '../../src/cli/index.js';

interface SnapshotNode {
  id: string;
  role?: string;
  name?: string;
  visible: boolean;
  interactive: boolean;
  source?: { domId?: string };
  children: SnapshotNode[];
}

const cases = [
  { kind: 'page', container: null, axis: 'y', controls: [
    ['page-start', 'Page start', 'button'],
    ['page-middle', 'Page middle link', 'link'],
    ['page-end', 'Page end', 'button'],
  ] },
  { kind: 'horizontal', container: 'horizontal-container', axis: 'x', controls: [
    ['horizontal-start', 'Horizontal start', 'button'],
    ['horizontal-end', 'Horizontal end link', 'link'],
  ] },
  { kind: 'vertical', container: 'vertical-container', axis: 'y', controls: [
    ['vertical-item-1', 'Vertical item 1', 'button'],
    ['vertical-item-25', 'Vertical item 25', 'button'],
    ['vertical-item-50', 'Vertical item 50', 'button'],
  ] },
] as const;

function flatten(nodes: SnapshotNode[]): SnapshotNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

describe('scroll coverage through the CLI', () => {
  for (const { kind, container, axis, controls } of cases) {
    it(`keeps controls beyond the initial ${kind} scroll position`, async () => {
      const url = new URL(`../fixtures/scroll-${kind}.html`, import.meta.url).href;
      const jsonOutput: string[] = [];
      const textOutput: string[] = [];
      expect(await runCli(['capture', url, '--format', 'json'], { write: (value) => jsonOutput.push(value) })).toBe(0);
      expect(await runCli(['capture', url, '--format', 'text'], { write: (value) => textOutput.push(value) })).toBe(0);
      const nodes = flatten((JSON.parse(jsonOutput.join('')) as { nodes: SnapshotNode[] }).nodes);
      const text = textOutput.join('');
      for (const [domId, name, role] of controls) {
        const node = nodes.find((entry) => entry.source?.domId === domId);
        expect(node, domId).toMatchObject({ name, role, visible: true, interactive: true });
        expect(text).toContain(`${role} "${name}"`);
      }
      if (kind === 'vertical') {
        expect(nodes.filter((node) => /^vertical-item-\d+$/.test(node.source?.domId ?? ''))).toHaveLength(50);
      }

      const session = await launchUrl(url);
      try {
        const target = session.page.locator(`#${controls.at(-1)![0]}`);
        const before = await session.page.evaluate(({ container, axis, targetId }) => {
          const owner = container ? document.getElementById(container)! : document.documentElement;
          const target = document.getElementById(targetId)!;
          const parentRect = container ? owner.getBoundingClientRect() : { right: innerWidth, bottom: innerHeight };
          const rect = target.getBoundingClientRect();
          return {
            outside: axis === 'x' ? rect.left >= parentRect.right : rect.top >= parentRect.bottom,
            scroll: axis === 'x' ? owner.scrollLeft : owner.scrollTop,
          };
        }, { container, axis, targetId: controls.at(-1)![0] });
        expect(before.outside).toBe(true);
        expect(before.scroll).toBe(0);
        await target.click();
        const after = await session.page.evaluate(({ container, axis }) => {
          const owner = container ? document.getElementById(container)! : document.documentElement;
          return axis === 'x' ? owner.scrollLeft : owner.scrollTop;
        }, { container, axis });
        expect(after).toBeGreaterThan(0);
      } finally {
        await session.close();
      }
    });
  }
});

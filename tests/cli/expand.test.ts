import { describe, expect, it } from 'vitest';
import { runCli } from '../../src/cli/index.js';

interface SnapshotNode {
  id: string;
  role?: string;
  name?: string;
  visible: boolean;
  interactive: boolean;
  expanded?: boolean;
  hasPopup?: string;
  source?: { domId?: string };
  children: SnapshotNode[];
}

function flatten(nodes: SnapshotNode[]): SnapshotNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

async function capture(kind: string, open: boolean): Promise<{ nodes: SnapshotNode[]; text: string }> {
  const url = new URL(`../fixtures/expand-${kind}.html`, import.meta.url);
  if (open) url.search = '?open';
  const jsonOutput: string[] = [];
  const textOutput: string[] = [];
  expect(await runCli(['capture', url.href, '--format', 'json'], { write: (value) => jsonOutput.push(value) })).toBe(0);
  expect(await runCli(['capture', url.href, '--format', 'text'], { write: (value) => textOutput.push(value) })).toBe(0);
  return { nodes: flatten((JSON.parse(jsonOutput.join('')) as { nodes: SnapshotNode[] }).nodes), text: textOutput.join('') };
}

function byDomId(nodes: SnapshotNode[], id: string): SnapshotNode {
  const node = nodes.find((entry) => entry.source?.domId === id);
  expect(node, id).toBeDefined();
  return node!;
}

describe('expandable controls through the CLI', () => {
  it('captures ARIA accordion state and visible children', async () => {
    for (const open of [false, true]) {
      const { nodes, text } = await capture('aria', open);
      expect(byDomId(nodes, 'aria-trigger')).toMatchObject({ role: 'button', expanded: open, visible: true, interactive: true });
      expect(text).toContain(`button "Account options" expanded=${open}`);
      for (const id of ['aria-link', 'aria-action']) expect(byDomId(nodes, id).visible).toBe(open);
      expect(text.includes('link "Account link"')).toBe(open);
      expect(text.includes('button "Account action"')).toBe(open);
    }
  });

  it('confirms an unannotated custom dropdown has no state or popup signal', async () => {
    for (const open of [false, true]) {
      const { nodes, text } = await capture('custom', open);
      const trigger = byDomId(nodes, 'custom-trigger');
      expect(trigger).toMatchObject({ role: 'button', visible: true, interactive: true });
      expect(trigger).not.toHaveProperty('expanded');
      expect(trigger).not.toHaveProperty('hasPopup');
      expect(text).toContain('button "More tools"');
      expect(text).not.toContain('expanded=');
      expect(text).not.toContain('hasPopup=');
      expect(byDomId(nodes, 'custom-link').visible).toBe(open);
      expect(text.includes('link "Tool link"')).toBe(open);
    }
  });

  it('captures native details disclosure and hides collapsed descendants', async () => {
    for (const open of [false, true]) {
      const { nodes, text } = await capture('details', open);
      expect(byDomId(nodes, 'native-summary')).toMatchObject({ expanded: open, visible: true, interactive: true });
      expect(text).toContain(`"Click to expand" expanded=${open}`);
      expect(byDomId(nodes, 'native-content').visible).toBe(open);
      expect(byDomId(nodes, 'native-action').visible).toBe(open);
      expect(text.includes('Hidden content')).toBe(open);
      expect(text.includes('button "Details action"')).toBe(open);
    }
  });

  it('captures menu popup type, expansion state and menu items', async () => {
    for (const open of [false, true]) {
      const { nodes, text } = await capture('menu', open);
      expect(byDomId(nodes, 'menu-trigger')).toMatchObject({ role: 'button', expanded: open, hasPopup: 'menu', visible: true, interactive: true });
      expect(text).toContain(`button "Actions" expanded=${open} hasPopup=menu`);
      for (const id of ['menu-view', 'menu-edit']) expect(byDomId(nodes, id).visible).toBe(open);
      expect(text.includes('menuitem "View item"')).toBe(open);
      expect(text.includes('menuitem "Edit item"')).toBe(open);
    }
  });
});

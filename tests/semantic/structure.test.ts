import { describe, expect, it } from 'vitest';
import { launchUrl } from '../../src/browser/launcher.js';
import { capturePage } from '../../src/extract/accessibility.js';
import { mergeSemanticNodes } from '../../src/semantic/merger.js';
import { buildContentStructure, type StructuredNode } from '../../src/semantic/structure.js';

function descendant(root: StructuredNode, predicate: (node: StructuredNode) => boolean): StructuredNode | undefined {
  if (predicate(root)) return root;
  for (const child of root.children) {
    const found = descendant(child, predicate);
    if (found) return found;
  }
}

describe('content structure', () => {
  it('nests headers, rows and actions in tables and preserves list/card items', async () => {
    const html = `<!doctype html><title>Structure</title><main>
      <table aria-label="Users"><thead><tr><th>Name</th><th>Status</th><th>Action</th></tr></thead>
      <tbody><tr><td>Alice</td><td>Active</td><td><button>Edit Alice</button></td></tr>
      <tr><td>Bob</td><td>Locked</td><td><button>Unlock Bob</button></td></tr></tbody></table>
      <ul aria-label="Tasks"><li>Review invoice <button>Open invoice</button></li><li>Pay bill</li></ul>
      <section aria-label="Projects"><article><h2>Project Alpha</h2><p>Active</p><button>Archive Alpha</button></article>
      <div class="card"><h2>Project Beta</h2><button>Open Beta</button></div></section>
    </main>`;
    const session = await launchUrl(`data:text/html,${encodeURIComponent(html)}`);
    try {
      const roots = buildContentStructure(mergeSemanticNodes(await capturePage(session.page)));
      const table = roots.flatMap((root) => [descendant(root, (entry) => entry.node.contentKind === 'table')]).find(Boolean)!;
      const alice = descendant(table, (entry) => entry.node.contentKind === 'row' && !!descendant(entry, (child) => child.node.text === 'Alice'))!;
      const bob = descendant(table, (entry) => entry.node.contentKind === 'row' && !!descendant(entry, (child) => child.node.text === 'Bob'))!;
      expect(descendant(alice, (entry) => entry.node.name === 'Edit Alice')).toBeDefined();
      expect(descendant(bob, (entry) => entry.node.name === 'Unlock Bob')).toBeDefined();
      expect(descendant(alice, (entry) => entry.node.text === 'Status')).toBeUndefined();
      const list = roots.flatMap((root) => [descendant(root, (entry) => entry.node.contentKind === 'list')]).find(Boolean)!;
      const task = descendant(list, (entry) => entry.node.contentKind === 'item' && entry.node.text?.includes('Review invoice') === true)!;
      expect(descendant(task, (entry) => entry.node.name === 'Open invoice')).toBeDefined();
      const card = roots.flatMap((root) => [descendant(root, (entry) => entry.node.contentKind === 'card' && !!descendant(entry, (child) => child.node.name === 'Archive Alpha'))]).find(Boolean)!;
      expect(descendant(card, (entry) => entry.node.text === 'Project Alpha')).toBeDefined();
      expect(roots.some((root) => descendant(root, (entry) => entry.node.contentKind === 'card' && !!descendant(entry, (child) => child.node.name === 'Open Beta')))).toBe(true);
    } finally {
      await session.close();
    }
  });
});

import { describe, expect, it } from 'vitest';
import { launchUrl } from '../../src/browser/launcher.js';
import { capturePage } from '../../src/extract/accessibility.js';
import { mergeSemanticNodes } from '../../src/semantic/merger.js';
import { generateSemanticIds } from '../../src/semantic/identity.js';
import { buildContentStructure } from '../../src/semantic/structure.js';
import { linkControlContent } from '../../src/semantic/relationships.js';

describe('semantic IDs', () => {
  it('stays deterministic across Chromium captures and preserves references', async () => {
    const html = `<!doctype html><title>Identity</title><main><form><label for="search">Search</label><input id="search"><button>Go</button></form><table><tbody><tr><td>Alice</td><td><button>Edit</button></td></tr><tr><td>Bob</td><td><button>Edit</button></td></tr></tbody></table></main>`;
    const session = await launchUrl(`data:text/html,${encodeURIComponent(html)}`);
    try {
      const snapshot = async () => {
        const nodes = mergeSemanticNodes(await capturePage(session.page));
        generateSemanticIds(nodes);
        buildContentStructure(nodes);
        const relations = linkControlContent(nodes);
        return { nodes, relations };
      };
      const first = await snapshot();
      const second = await snapshot();
      expect(second.nodes.map((node) => node.id)).toEqual(first.nodes.map((node) => node.id));
      expect(new Set(first.nodes.map((node) => node.id)).size).toBe(first.nodes.length);
      expect(first.nodes.every((node) => /^e[0-9a-f]+$/.test(node.id))).toBe(true);
      const ids = new Set(first.nodes.map((node) => node.id));
      expect(first.nodes.every((node) => !node.parentId || ids.has(node.parentId))).toBe(true);
      expect(first.nodes.every((node) => !node.semanticParentId || ids.has(node.semanticParentId))).toBe(true);
      expect(first.relations.every((relation) => ids.has(relation.controlId) && ids.has(relation.contentId))).toBe(true);
      expect(first.nodes.filter((node) => node.tag === 'button' && node.name === 'Edit').map((node) => node.id)).toHaveLength(2);
      expect(new Set(first.nodes.filter((node) => node.tag === 'button' && node.name === 'Edit').map((node) => node.id)).size).toBe(2);
      await session.page.locator('button').first().evaluate((button) => { button.setAttribute('disabled', ''); });
      const third = await snapshot();
      expect(third.nodes.map((node) => node.id)).toEqual(first.nodes.map((node) => node.id));
    } finally {
      await session.close();
    }
  });
});

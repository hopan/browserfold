import { describe, expect, it } from 'vitest';
import { launchUrl } from '../../src/browser/launcher.js';
import { capturePage } from '../../src/extract/accessibility.js';
import { mergeSemanticNodes } from '../../src/semantic/merger.js';
import { buildContentStructure } from '../../src/semantic/structure.js';
import { linkControlContent } from '../../src/semantic/relationships.js';

describe('control/content relationships', () => {
  it('connects labels, descriptions, forms, row actions and card actions', async () => {
    const html = `<!doctype html><title>Relations</title><main>
      <form><label for="query">Find user</label><input id="query" aria-describedby="hint"><small id="hint">Search by email</small><button>Search</button></form>
      <table><tbody><tr><td>Alice</td><td><button>Edit</button></td></tr><tr><td>Bob</td><td><button>Edit</button></td></tr></tbody></table>
      <article><h2>Project Alpha</h2><button>Archive</button></article>
    </main>`;
    const session = await launchUrl(`data:text/html,${encodeURIComponent(html)}`);
    try {
      const nodes = mergeSemanticNodes(await capturePage(session.page));
      buildContentStructure(nodes);
      const relations = linkControlContent(nodes);
      const query = nodes.find((node) => node.tag === 'input')!;
      const label = nodes.find((node) => node.tag === 'label')!;
      const hint = nodes.find((node) => node.tag === 'small')!;
      const form = nodes.find((node) => node.tag === 'form')!;
      expect(relations).toContainEqual({ controlId: query.id, contentId: label.id, type: 'label' });
      expect(relations).toContainEqual({ controlId: query.id, contentId: hint.id, type: 'description' });
      expect(relations).toContainEqual({ controlId: query.id, contentId: form.id, type: 'form' });
      const edits = nodes.filter((node) => node.tag === 'button' && node.name === 'Edit');
      const rows = nodes.filter((node) => node.tag === 'tr' && node.text === undefined).filter((node) => relations.some((relation) => relation.contentId === node.id && relation.type === 'row-action'));
      expect(edits).toHaveLength(2);
      expect(rows).toHaveLength(2);
      expect(relations.filter((relation) => relation.type === 'row-action' && edits.some((edit) => edit.id === relation.controlId)).map((relation) => relation.contentId)).toEqual(rows.map((row) => row.id));
      const archive = nodes.find((node) => node.name === 'Archive')!;
      const card = nodes.find((node) => node.contentKind === 'card')!;
      expect(relations).toContainEqual({ controlId: archive.id, contentId: card.id, type: 'card-action' });
    } finally {
      await session.close();
    }
  });
});

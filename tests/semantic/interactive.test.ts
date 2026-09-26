import { describe, expect, it } from 'vitest';
import { launchUrl } from '../../src/browser/launcher.js';
import { capturePage } from '../../src/extract/accessibility.js';
import { mergeSemanticNodes } from '../../src/semantic/merger.js';

describe('interactive detection', () => {
  it('marks native, ARIA, editable, focusable and inline-handler controls', async () => {
    const html = `<!doctype html><title>Controls</title><main>
      <button>Save</button><a href="/next">Next</a><input aria-label="Search"><select aria-label="Status"><option>Open</option></select><textarea aria-label="Notes"></textarea>
      <div role="button" aria-label="Custom">Custom</div><div contenteditable="true" aria-label="Editor"></div>
      <div tabindex="0" aria-label="Keyboard">Keyboard</div><div onclick="void 0" aria-label="Click">Click</div>
      <div tabindex="-1" aria-label="Skip">Skip</div><p>Plain text</p>
    </main>`;
    const session = await launchUrl(`data:text/html,${encodeURIComponent(html)}`);
    try {
      const nodes = mergeSemanticNodes(await capturePage(session.page));
      for (const name of ['Save', 'Next', 'Search', 'Status', 'Notes', 'Custom', 'Editor', 'Keyboard', 'Click']) {
        expect(nodes.find((node) => node.name === name)?.interactive, name).toBe(true);
      }
      expect(nodes.find((node) => node.name === 'Skip')?.interactive).toBe(false);
      expect(nodes.find((node) => node.tag === 'p')?.interactive).toBe(false);
    } finally {
      await session.close();
    }
  });
});

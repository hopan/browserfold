import { expect, it } from 'vitest';
import { launchUrl } from '../../src/browser/launcher.js';
import { capturePage } from '../../src/extract/accessibility.js';
import { mergeSemanticNodes } from '../../src/semantic/merger.js';
import { generateSemanticIds } from '../../src/semantic/identity.js';
import { buildContentStructure } from '../../src/semantic/structure.js';
import { serializeText } from '../../src/serialize/text.js';

it('captures a native button inside nested open shadow roots with its DOM identity', async () => {
  const html = `<!doctype html><title>Nested shadow</title><outer-control></outer-control>
    <script>
      const outer = document.querySelector('outer-control');
      outer.attachShadow({mode:'open'}).innerHTML = '<inner-control></inner-control>';
      outer.shadowRoot.querySelector('inner-control').attachShadow({mode:'open'}).innerHTML = '<button aria-label="Save">Save</button>';
    </script>`;
  const session = await launchUrl(`data:text/html,${encodeURIComponent(html)}`);
  try {
    const captured = await capturePage(session.page);
    const nodes = generateSemanticIds(mergeSemanticNodes(captured));
    const button = nodes.find(node => node.tag === 'button' && node.name === 'Save');
    expect(button?.source?.backendNodeId).toEqual(expect.any(Number));
    expect(button?.interactive).toBe(true);
    expect(button?.visible).toBe(true);
    expect(serializeText(captured, buildContentStructure(nodes))).toContain(`[${button?.id}] button "Save"`);
  } finally {
    await session.close();
  }
});

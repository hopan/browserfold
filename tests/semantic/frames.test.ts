import { describe, expect, it } from 'vitest';
import { launchUrl } from '../../src/browser/launcher.js';
import { capturePage } from '../../src/extract/accessibility.js';
import { mergeSemanticNodes } from '../../src/semantic/merger.js';
import { generateSemanticIds } from '../../src/semantic/identity.js';
import { buildContentStructure } from '../../src/semantic/structure.js';
import { serializeText } from '../../src/serialize/text.js';

describe('same-origin iframe capture', () => {
  it('keeps frame controls under their iframe with source context in text', async () => {
    const inner = '<title>Payment</title><label for="card">Card number</label><input id="card"><button>Pay</button>';
    const html = `<!doctype html><title>Checkout</title><button>Back</button><iframe title="Payment" srcdoc="${inner.replaceAll('"', '&quot;')}"></iframe>`;
    const session = await launchUrl(`data:text/html,${encodeURIComponent(html)}`);
    try {
      await session.page.frameLocator('iframe').locator('button').waitFor();
      const page = await capturePage(session.page);
      const nodes = generateSemanticIds(mergeSemanticNodes(page));
      const frame = nodes.find((node) => node.tag === 'iframe');
      const pay = nodes.find((node) => node.tag === 'button' && node.name === 'Pay');
      expect(frame).toBeDefined();
      expect(pay).toBeDefined();
      expect(pay?.frameId).toBeTruthy();
      expect(pay?.frameId).not.toBe(frame?.frameId);
      const byId = new Map(nodes.map((node) => [node.id, node]));
      let parent = pay?.parentId ? byId.get(pay.parentId) : undefined;
      while (parent && parent.id !== frame?.id) parent = parent.parentId ? byId.get(parent.parentId) : undefined;
      expect(parent?.id).toBe(frame?.id);
      expect(serializeText(page, buildContentStructure(nodes))).toMatch(/FRAME "Payment"[\s\S]*button "Pay"/);
    } finally {
      await session.close();
    }
  });
});

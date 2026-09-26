import { describe, expect, it } from 'vitest';
import { launchUrl } from '../../src/browser/launcher.js';
import { capturePage } from '../../src/extract/accessibility.js';

describe('raw page capture', () => {
  it('captures DOM and accessibility data from a live Chromium page', async () => {
    const session = await launchUrl('data:text/html,<title>Capture</title><label for="email">Email</label><input id="email" type="email"><button>Send</button>');
    try {
      const captured = await capturePage(session.page);
      expect(captured.url).toBe(session.page.url());
      expect(captured.title).toBe('Capture');
      expect(captured.capturedAt).toEqual(expect.any(Number));
      expect(captured.accessibility.nodes.some((node) => node.role?.value === 'button' && node.name?.value === 'Send')).toBe(true);
      expect(captured.accessibility.nodes.some((node) => node.role?.value === 'textbox' && node.name?.value === 'Email')).toBe(true);
      expect(captured.dom.root.nodeName).toBe('#document');
      expect(JSON.stringify(captured.dom.root)).toContain('BUTTON');
      expect(JSON.stringify(captured.dom.root)).toContain('INPUT');
    } finally {
      await session.close();
    }
  });
});

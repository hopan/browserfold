import { describe, expect, it } from 'vitest';
import { launchUrl } from '../../src/browser/launcher.js';
import { capturePage } from '../../src/extract/accessibility.js';
import { mergeSemanticNodes } from '../../src/semantic/merger.js';
import { extractVisibleContent } from '../../src/semantic/content.js';

describe('visible automation content', () => {
  it('excludes zero-opacity controls and controls inside zero-opacity menus', async () => {
    const html = `<!doctype html><button style="opacity:0" aria-label="Remove dependency">×</button>
      <nav style="opacity:0;pointer-events:none"><div role="menuitem" tabindex="-1">New File</div></nav>
      <button>Visible action</button>`;
    const session = await launchUrl(`data:text/html,${encodeURIComponent(html)}`);
    try {
      const nodes = mergeSemanticNodes(await capturePage(session.page));
      expect(nodes.find((node) => node.name === 'Remove dependency')?.visible).toBe(false);
      expect(nodes.find((node) => node.name === 'New File')?.visible).toBe(false);
      expect(nodes.find((node) => node.name === 'Visible action')?.visible).toBe(true);
    } finally {
      await session.close();
    }
  });

  it('keeps actionable context and removes hidden, decorative and duplicate content', async () => {
    const html = `<!doctype html><title>Content</title><main>
      <style>.gone{display:none}.invisible{visibility:hidden}</style><script>window.secret='script noise'</script>
      <h1>Orders</h1><p>Choose an order to inspect.</p><p>Long unrelated marketing prose.</p>
      <form><label for="search">Search orders</label><input id="search"><button>Apply</button></form>
      <div role="status">3 results</div><div role="alert">Search failed</div>
      <p hidden>Hidden attribute</p><p aria-hidden="true">ARIA hidden</p>
      <p class="gone">Display hidden</p><p class="invisible">Visibility hidden</p>
      <span style="display:block;width:0;height:0;overflow:hidden">Tiny decoration</span>
      <svg aria-hidden="true"><path d="M0 0"/></svg><noscript>Noscript text</noscript>
    </main>`;
    const session = await launchUrl(`data:text/html,${encodeURIComponent(html)}`);
    try {
      const merged = mergeSemanticNodes(await capturePage(session.page));
      for (const value of ['Hidden attribute', 'ARIA hidden', 'Display hidden', 'Visibility hidden', 'Tiny decoration']) {
        expect(merged.find((node) => node.text === value)?.visible, value).toBe(false);
      }
      const content = extractVisibleContent(merged);
      const serialized = JSON.stringify(content);
      for (const value of ['Orders', 'Search orders', 'Apply', '3 results', 'Search failed']) expect(serialized).toContain(value);
      for (const value of ['Hidden attribute', 'ARIA hidden', 'Display hidden', 'Visibility hidden', 'Tiny decoration', 'script noise', 'Noscript text', 'Long unrelated marketing prose']) expect(serialized).not.toContain(value);
      expect(content.filter((node) => node.text === 'Orders' || node.name === 'Orders')).toHaveLength(1);
    } finally {
      await session.close();
    }
  });
});

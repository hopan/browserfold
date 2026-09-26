import { describe, expect, it } from 'vitest';
import { launchUrl } from '../../src/browser/launcher.js';
import { capturePage } from '../../src/extract/accessibility.js';
import { mergeSemanticNodes } from '../../src/semantic/merger.js';
import { generateSemanticIds } from '../../src/semantic/identity.js';
import { buildContentStructure } from '../../src/semantic/structure.js';
import { serializeText } from '../../src/serialize/text.js';

describe('compact text serialization', () => {
  it('keeps controls placed in a table header', async () => {
    const html = '<!doctype html><title>Header</title><table><tr><th>Topic <button>Show</button> <a href="/help">Help</a></th></tr><tr><td>Row</td></tr></table>';
    const session = await launchUrl(`data:text/html,${encodeURIComponent(html)}`);
    try {
      const page = await capturePage(session.page);
      const nodes = generateSemanticIds(mergeSemanticNodes(page));
      const text = serializeText(page, buildContentStructure(nodes));
      expect(text).toMatch(/\[e[0-9a-f]+\] button "Show"/);
      expect(text).toMatch(/\[e[0-9a-f]+\] link "Help"/);
    } finally {
      await session.close();
    }
  });

  it('emits deterministic page, controls, state and grouped business content', async () => {
    const html = `<!doctype html><title>Orders</title><main><h1>Orders</h1>
      <label for="search">Search</label><input id="search" value="Alice" required><button disabled>Apply</button>
      <input type="checkbox" aria-label="Active only" checked><div role="alert">Search failed</div>
      <table aria-label="Users"><thead><tr><th>Name</th><th>Status</th><th>Action</th></tr></thead>
      <tbody><tr><td>Alice</td><td>Active</td><td><button>Edit</button></td></tr>
      <tr><td>Bob</td><td>Locked</td><td><button>Unlock</button></td></tr></tbody></table>
      <ul aria-label="Tasks"><li>Review invoice <button>Open</button></li></ul>
      <article><h2>Project Alpha</h2><p>Active</p><button>Archive</button></article>
      <p>Irrelevant marketing paragraph.</p><button hidden>Secret</button></main>`;
    const session = await launchUrl(`data:text/html,${encodeURIComponent(html)}`);
    try {
      const snapshot = async () => {
        const page = await capturePage(session.page);
        const nodes = generateSemanticIds(mergeSemanticNodes(page));
        return serializeText(page, buildContentStructure(nodes));
      };
      const text = await snapshot();
      expect(await snapshot()).toBe(text);
      expect(text).toContain(`PAGE\nurl: ${session.page.url()}\ntitle: Orders\n\nUI\n`);
      expect(text).toMatch(/\[e[0-9a-f]+\] heading "Orders" level=1/);
      expect(text).toMatch(/\[e[0-9a-f]+\] textbox "Search" value="Alice" required/);
      expect(text).toMatch(/\[e[0-9a-f]+\] button "Apply" disabled/);
      expect(text).toMatch(/\[e[0-9a-f]+\] checkbox "Active only" checked=true/);
      expect(text).toContain('alert "Search failed"');
      expect(text).toMatch(/TABLE Users\ncolumns: Name \| Status \| Action/);
      expect(text).toMatch(/\[r[0-9a-f]+\] Alice \| Active\n  \[e[0-9a-f]+\] button "Edit"/);
      expect(text).toMatch(/\[r[0-9a-f]+\] Bob \| Locked\n  \[e[0-9a-f]+\] button "Unlock"/);
      expect(text).toMatch(/LIST Tasks\n\[item[0-9a-f]+\] Review invoice\n  \[e[0-9a-f]+\] button "Open"/);
      expect(text).toMatch(/Project Alpha \| Active\n  \[e[0-9a-f]+\] button "Archive"/);
      const ui = text.split('\nUI\n')[1];
      expect(ui).not.toContain('Secret');
      expect(ui).not.toContain('Irrelevant marketing');
      expect(text).not.toContain('enabled=true');
      expect(text).not.toContain('visible=true');
    } finally {
      await session.close();
    }
  });
});

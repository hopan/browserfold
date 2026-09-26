import { describe, expect, it } from 'vitest';
import { launchUrl } from '../../src/browser/launcher.js';
import { capturePage } from '../../src/extract/accessibility.js';
import { mergeSemanticNodes } from '../../src/semantic/merger.js';

describe('semantic merger', () => {
  it('joins AX roles and state to DOM tags, attributes, text and ancestry', async () => {
    const html = `<!doctype html><title>Merge</title><main>
      <h1>Account</h1>
      <label for="email">Email address</label><input id="email" type="email" placeholder="you@example.com" value="alice@example.com" required>
      <label for="pass">Password</label><input id="pass" type="password" value="secret123">
      <label><input type="checkbox" checked>Remember me</label>
      <button disabled>Continue</button><a href="/help">Help</a>
      <p>Account details</p>
    </main>`;
    const session = await launchUrl(`data:text/html,${encodeURIComponent(html)}`);
    try {
      const nodes = mergeSemanticNodes(await capturePage(session.page));
      const find = (tag: string, name?: string) => nodes.find((node) => node.tag === tag && (name === undefined || node.name === name));
      const email = find('input', 'Email address');
      expect(email).toMatchObject({ role: 'textbox', type: 'email', placeholder: 'you@example.com', value: 'alice@example.com', required: true, visible: true });
      expect(email?.source?.backendNodeId).toEqual(expect.any(Number));
      expect(find('input', 'Password')).toMatchObject({ type: 'password', value: '<redacted>' });
      expect(JSON.stringify(nodes)).not.toContain('secret123');
      expect(find('input', 'Remember me')).toMatchObject({ role: 'checkbox', checked: true });
      expect(find('button', 'Continue')).toMatchObject({ role: 'button', enabled: false, text: 'Continue' });
      expect(find('h1', 'Account')).toMatchObject({ role: 'heading', level: 1, text: 'Account' });
      expect(find('a', 'Help')?.href).toBe('/help');
      expect(find('p')?.text).toBe('Account details');
      const main = find('main');
      expect(email?.parentId).toBe(main?.id);
      expect(new Set(nodes.map((node) => node.id)).size).toBe(nodes.length);
    } finally {
      await session.close();
    }
  });
});

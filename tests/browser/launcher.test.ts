import { afterEach, describe, expect, it } from 'vitest';
import { chromium, type BrowserContext } from 'playwright';
import { createServer } from 'node:net';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { launchUrl } from '../../src/browser/launcher.js';
import { attachCdp } from '../../src/browser/cdp.js';

const url = 'data:text/html,<title>BrowserFold fixture</title><h1>Ready</h1>';
const closeables: Array<() => Promise<void>> = [];

afterEach(async () => {
  for (const close of closeables.splice(0).reverse()) await close();
});

async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No TCP port');
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return address.port;
}

describe('browser connections', () => {
  it('launches headless Chromium and navigates to the requested URL', async () => {
    const session = await launchUrl(url);
    closeables.push(session.close);
    expect(session.page.url()).toBe(url);
    expect(await session.page.title()).toBe('BrowserFold fixture');
    expect(await session.page.locator('h1').textContent()).toBe('Ready');
  });

  it('attaches over CDP and selects the current page or an explicit page index', async () => {
    const port = await freePort();
    const userDataDir = join(process.cwd(), 'tests', `.tmp-cdp-${process.pid}-${port}`);
    await mkdir(userDataDir, { recursive: true });
    let context: BrowserContext | undefined;
    try {
      context = await chromium.launchPersistentContext(userDataDir, {
        headless: true,
        args: [`--remote-debugging-port=${port}`],
      });
      const first = context.pages()[0] ?? await context.newPage();
      await first.goto(url);
      const second = await context.newPage();
      await second.goto('data:text/html,<title>Second</title>');

      const latest = await attachCdp(`http://127.0.0.1:${port}`);
      closeables.push(latest.close);
      expect(await latest.page.title()).toBe('Second');

      const indexed = await attachCdp(`http://127.0.0.1:${port}`, 0);
      closeables.push(indexed.close);
      expect(await indexed.page.title()).toBe('BrowserFold fixture');
    } finally {
      await context?.close();
      await rm(userDataDir, { recursive: true, force: true });
    }
  });
});

import { chromium } from 'playwright';
import { selectPage } from './page-selector.js';
import type { BrowserSession } from './launcher.js';

export async function attachCdp(endpoint: string, pageIndex?: number): Promise<BrowserSession> {
  const browser = await chromium.connectOverCDP(endpoint);
  try {
    const page = await selectPage(browser, pageIndex);
    return { browser, page, close: () => browser.close() };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

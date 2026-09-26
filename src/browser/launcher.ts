import { chromium, type Browser, type Page } from 'playwright';

export interface BrowserSession {
  browser: Browser;
  page: Page;
  close(): Promise<void>;
}

export async function launchUrl(url: string): Promise<BrowserSession> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url);
    return { browser, page, close: () => browser.close() };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

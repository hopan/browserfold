import type { Browser, Page } from 'playwright';

/** Select a tab from the attached browser. CDP does not expose OS tab focus. */
export async function selectPage(browser: Browser, pageIndex?: number): Promise<Page> {
  const pages = browser.contexts().flatMap((context) => context.pages());
  const timedPages = await Promise.all(pages.map(async (page) => ({
    page,
    timeOrigin: await page.evaluate(() => performance.timeOrigin).catch(() => 0),
  })));
  timedPages.sort((a, b) => a.timeOrigin - b.timeOrigin);
  const orderedPages = timedPages.map(({ page }) => page);
  if (pageIndex !== undefined) {
    if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= orderedPages.length) {
      throw new RangeError(`Page index ${pageIndex} is out of range (0..${orderedPages.length - 1})`);
    }
    return orderedPages[pageIndex];
  }
  const page = [...orderedPages].reverse().find((candidate) => candidate.url() !== 'about:blank') ?? orderedPages.at(-1);
  if (!page) throw new Error('No page available in the CDP browser');
  return page;
}

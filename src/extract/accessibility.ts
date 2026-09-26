import type { CDPSession, Page } from 'playwright';
import { captureDom, type RawDomTree } from './dom.js';

export interface RawAxValue {
  type: string;
  value?: string | number | boolean;
}

export interface RawAxNode {
  nodeId: string;
  ignored: boolean;
  role?: RawAxValue;
  name?: RawAxValue;
  value?: RawAxValue;
  properties?: Array<{ name: string; value: RawAxValue }>;
  parentId?: string;
  childIds?: string[];
  backendDOMNodeId?: number;
}

export interface RawAccessibilityTree {
  nodes: RawAxNode[];
}

export interface CapturedPage {
  url: string;
  title: string;
  capturedAt: number;
  accessibility: RawAccessibilityTree;
  dom: RawDomTree;
}

export async function captureAccessibility(session: CDPSession): Promise<RawAccessibilityTree> {
  return await session.send('Accessibility.getFullAXTree') as RawAccessibilityTree;
}

export async function capturePage(page: Page): Promise<CapturedPage> {
  const session = await page.context().newCDPSession(page);
  try {
    const capturedAt = Date.now();
    const [title, accessibility, dom] = await Promise.all([
      page.title(),
      captureAccessibility(session),
      captureDom(session),
    ]);
    return { url: page.url(), title, capturedAt, accessibility, dom };
  } finally {
    await session.detach();
  }
}

import type { CDPSession } from 'playwright';

export interface RawDomNode {
  nodeId: number;
  backendNodeId?: number;
  nodeType: number;
  nodeName: string;
  nodeValue: string;
  attributes?: string[];
  children?: RawDomNode[];
  contentDocument?: RawDomNode;
  shadowRoots?: RawDomNode[];
  shadowRootType?: string;
  layout?: { display?: string; visibility?: string; cursor?: string; width?: number; height?: number };
}

export interface RawDomTree {
  root: RawDomNode;
}

export async function captureDom(session: CDPSession): Promise<RawDomTree> {
  const tree = await session.send('DOM.getDocument', { depth: -1, pierce: true }) as RawDomTree;
  // CDP also returns browser-internal shadow trees (including password input
  // internals). Only page-created open roots belong in the captured DOM.
  function keepOpenShadows(node: RawDomNode): void {
    node.shadowRoots = node.shadowRoots?.filter((shadow) => shadow.shadowRootType === 'open');
    for (const child of node.children ?? []) keepOpenShadows(child);
    for (const shadow of node.shadowRoots ?? []) keepOpenShadows(shadow);
    if (node.contentDocument) keepOpenShadows(node.contentDocument);
  }
  keepOpenShadows(tree.root);
  async function expandFrames(node: RawDomNode): Promise<void> {
    if (node.contentDocument) {
      const described = await session.send('DOM.describeNode', { nodeId: node.contentDocument.nodeId, depth: -1, pierce: false }) as { node: RawDomNode };
      node.contentDocument = described.node;
      await expandFrames(node.contentDocument);
    }
    for (const child of node.children ?? []) await expandFrames(child);
    for (const shadow of node.shadowRoots ?? []) await expandFrames(shadow);
  }
  await expandFrames(tree.root);
  await session.send('CSS.enable');
  const elements: RawDomNode[] = [];
  function collect(node: RawDomNode): void {
    if (node.nodeType === 1) elements.push(node);
    for (const child of node.children ?? []) collect(child);
    for (const shadow of node.shadowRoots ?? []) collect(shadow);
    if (node.contentDocument) collect(node.contentDocument);
  }
  collect(tree.root);
  // Full pages can contain thousands of nodes. Keep CDP style responses bounded
  // instead of retaining one pending promise (and response) per element.
  let nextElement = 0;
  async function inspectElements(): Promise<void> {
    while (nextElement < elements.length) {
      const node = elements[nextElement++];
      const [style, box] = await Promise.all([
        session.send('CSS.getComputedStyleForNode', { nodeId: node.nodeId }).catch(() => undefined),
        session.send('DOM.getBoxModel', { nodeId: node.nodeId }).catch(() => undefined),
      ]);
      const entries = (style as { computedStyle?: Array<{ name: string; value: string }> } | undefined)?.computedStyle;
      const model = (box as { model?: { width: number; height: number } } | undefined)?.model;
      node.layout = {
        display: entries?.find((entry) => entry.name === 'display')?.value,
        visibility: entries?.find((entry) => entry.name === 'visibility')?.value,
        cursor: entries?.find((entry) => entry.name === 'cursor')?.value,
        width: model?.width,
        height: model?.height,
      };
    }
  }
  await Promise.all(Array.from({ length: Math.min(24, elements.length) }, () => inspectElements()));
  return tree;
}

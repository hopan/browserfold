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
  layout?: { display?: string; visibility?: string; width?: number; height?: number };
}

export interface RawDomTree {
  root: RawDomNode;
}

export async function captureDom(session: CDPSession): Promise<RawDomTree> {
  const tree = await session.send('DOM.getDocument', { depth: -1, pierce: false }) as RawDomTree;
  async function expandFrames(node: RawDomNode): Promise<void> {
    if (node.contentDocument) {
      const described = await session.send('DOM.describeNode', { nodeId: node.contentDocument.nodeId, depth: -1, pierce: false }) as { node: RawDomNode };
      node.contentDocument = described.node;
      await expandFrames(node.contentDocument);
    }
    for (const child of node.children ?? []) await expandFrames(child);
  }
  await expandFrames(tree.root);
  await session.send('CSS.enable');
  const elements: RawDomNode[] = [];
  function collect(node: RawDomNode): void {
    if (node.nodeType === 1) elements.push(node);
    for (const child of node.children ?? []) collect(child);
    if (node.contentDocument) collect(node.contentDocument);
  }
  collect(tree.root);
  await Promise.all(elements.map(async (node) => {
    const [style, box] = await Promise.all([
      session.send('CSS.getComputedStyleForNode', { nodeId: node.nodeId }).catch(() => undefined),
      session.send('DOM.getBoxModel', { nodeId: node.nodeId }).catch(() => undefined),
    ]);
    const entries = (style as { computedStyle?: Array<{ name: string; value: string }> } | undefined)?.computedStyle;
    const model = (box as { model?: { width: number; height: number } } | undefined)?.model;
    node.layout = {
      display: entries?.find((entry) => entry.name === 'display')?.value,
      visibility: entries?.find((entry) => entry.name === 'visibility')?.value,
      width: model?.width,
      height: model?.height,
    };
  }));
  return tree;
}

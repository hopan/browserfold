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
}

export interface RawDomTree {
  root: RawDomNode;
}

export async function captureDom(session: CDPSession): Promise<RawDomTree> {
  return await session.send('DOM.getDocument', { depth: -1, pierce: false }) as RawDomTree;
}

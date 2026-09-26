import type { CapturedPage } from '../extract/accessibility.js';
import type { SemanticNode } from '../semantic/node.js';
import type { SemanticRelation } from '../semantic/relationships.js';

export interface DebugNode extends SemanticNode {
  children: DebugNode[];
}

/** Serialize every semantic node, including hidden and unretained nodes, for inspection. */
export function serializeJson(page: CapturedPage, nodes: SemanticNode[], relations: SemanticRelation[]): string {
  const byId = new Map(nodes.map((node) => [node.id, { ...node, children: [] as DebugNode[] }]));
  const roots: DebugNode[] = [];
  for (const node of nodes) {
    const entry = byId.get(node.id)!;
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(entry);
    else roots.push(entry);
  }
  return `${JSON.stringify({
    page: { url: page.url, title: page.title, capturedAt: page.capturedAt },
    nodes: roots,
    relations,
  }, null, 2)}\n`;
}

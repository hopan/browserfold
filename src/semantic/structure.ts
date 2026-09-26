import { extractVisibleContent } from './content.js';
import type { SemanticNode } from './node.js';

export interface StructuredNode {
  node: SemanticNode;
  children: StructuredNode[];
}

/** Reconnect retained nodes to their nearest retained ancestor, preserving DOM order. */
export function buildContentStructure(nodes: SemanticNode[]): StructuredNode[] {
  const retained = extractVisibleContent(nodes);
  const allById = new Map(nodes.map((node) => [node.id, node]));
  const structured = new Map(retained.map((node) => [node.id, { node, children: [] as StructuredNode[] }]));
  const roots: StructuredNode[] = [];
  for (const entry of structured.values()) {
    let parentId = entry.node.parentId;
    while (parentId && !structured.has(parentId)) parentId = allById.get(parentId)?.parentId;
    if (parentId) {
      entry.node.semanticParentId = parentId;
      structured.get(parentId)!.children.push(entry);
    } else {
      roots.push(entry);
    }
  }
  return roots;
}

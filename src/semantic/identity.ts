import { createHash } from 'node:crypto';
import type { SemanticNode } from './node.js';

/** Replace capture-local CDP keys with deterministic IDs and remap ancestry references. */
export function generateSemanticIds(nodes: SemanticNode[]): SemanticNode[] {
  const oldToNew = new Map<string, string>();
  const keys = new Map<string, string>();
  const occurrences = new Map<string, number>();
  const used = new Set<string>();

  for (const node of nodes) {
    const oldId = node.id;
    const parentKey = node.parentId ? keys.get(node.parentId) ?? '' : '';
    const signature = JSON.stringify([
      node.frameId ?? '', node.role ?? '', node.name ?? '', node.tag ?? '',
      node.type ?? '', node.source?.domId ?? '', node.href ?? '',
      node.placeholder ?? '', node.name ? '' : node.text ?? '',
    ]);
    const siblingKey = JSON.stringify([parentKey, signature]);
    const occurrence = occurrences.get(siblingKey) ?? 0;
    occurrences.set(siblingKey, occurrence + 1);
    const stableKey = JSON.stringify([parentKey, signature, occurrence]);
    const digest = createHash('sha256').update(stableKey).digest('hex');
    // Keep ancestry keys bounded on deep real-world DOM trees.
    keys.set(oldId, digest);
    let length = 10;
    let id = `e${digest.slice(0, length)}`;
    while (used.has(id) && length < digest.length) id = `e${digest.slice(0, ++length)}`;
    if (used.has(id)) throw new Error('Unable to assign a unique semantic ID');
    used.add(id);
    oldToNew.set(oldId, id);
  }

  for (const node of nodes) {
    node.id = oldToNew.get(node.id)!;
    if (node.parentId) node.parentId = oldToNew.get(node.parentId);
    if (node.semanticParentId) node.semanticParentId = oldToNew.get(node.semanticParentId);
  }
  return nodes;
}

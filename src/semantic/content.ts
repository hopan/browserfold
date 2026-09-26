import type { SemanticNode } from './node.js';

const structuralTags = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'form', 'fieldset']);

/** Keep visible automation context while excluding empty wrappers and duplicate AX text. */
export function extractVisibleContent(nodes: SemanticNode[]): SemanticNode[] {
  const kept: SemanticNode[] = [];
  const textSeen = new Set<string>();
  for (const node of nodes) {
    if (!node.visible) continue;
    const role = node.role ?? '';
    const tag = node.tag ?? '';
    const kind = role === 'heading' || /^h[1-6]$/.test(tag) ? 'heading'
      : role === 'status' ? 'status'
      : role === 'alert' ? 'alert'
      : tag === 'table' ? 'table'
      : tag === 'tr' ? 'row'
      : ['td', 'th'].includes(tag) ? 'cell'
      : ['ul', 'ol'].includes(tag) ? 'list'
      : tag === 'li' ? 'item'
      : undefined;
    if (kind) node.contentKind = kind;
    const useful = node.interactive || kind !== undefined || structuralTags.has(tag)
      || tag === 'label' || role === 'dialog' || role === 'navigation'
      || (node.text !== undefined && /error|invalid|failed|required/i.test(node.text));
    if (!useful) continue;
    const content = (node.text ?? node.name ?? '').trim();
    const duplicateKey = `${kind ?? ''}:${content}`;
    if (content && textSeen.has(duplicateKey) && !node.interactive && !structuralTags.has(tag)) continue;
    if (content) textSeen.add(duplicateKey);
    kept.push(node);
  }
  return kept;
}

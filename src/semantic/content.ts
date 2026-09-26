import type { SemanticNode } from './node.js';

const structuralTags = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'form', 'fieldset']);
const paginationText = /\bpage\s+\d+\s*(of|\/)\s*\d+\b|\b\d+\s*[-–]\s*\d+\s+of\s+\d+\b/i;

/** Keep visible automation context while excluding empty wrappers and duplicate AX text. */
export function extractVisibleContent(nodes: SemanticNode[]): SemanticNode[] {
  const kept: SemanticNode[] = [];
  const textSeen = new Set<string>();
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const referencedDescriptions = new Set(nodes.flatMap((node) => node.source?.describedBy?.split(/\s+/) ?? []));
  function inCard(node: SemanticNode): boolean {
    let ancestor = node.parentId ? byId.get(node.parentId) : undefined;
    while (ancestor) {
      if (ancestor.contentKind === 'card') return true;
      ancestor = ancestor.parentId ? byId.get(ancestor.parentId) : undefined;
    }
    return false;
  }
  function inNavigation(node: SemanticNode): boolean {
    let ancestor = node.parentId ? byId.get(node.parentId) : undefined;
    while (ancestor) {
      if (ancestor.role === 'navigation' || ancestor.tag === 'nav') return true;
      ancestor = ancestor.parentId ? byId.get(ancestor.parentId) : undefined;
    }
    return false;
  }
  for (const node of nodes) {
    if (!node.visible) continue;
    const role = node.role ?? '';
    const tag = node.tag ?? '';
    const kind = node.contentKind ?? (role === 'heading' || /^h[1-6]$/.test(tag) ? 'heading'
      : role === 'status' ? 'status'
      : role === 'alert' ? 'alert'
      : tag === 'table' ? 'table'
      : tag === 'tr' ? 'row'
      : ['td', 'th'].includes(tag) ? 'cell'
      : ['ul', 'ol'].includes(tag) ? 'list'
      : tag === 'li' ? 'item'
      : undefined);
    const contextText = !node.interactive && node.text !== undefined && node.text.length <= 60
      && /[\p{L}\p{N}]/u.test(node.text)
      && (paginationText.test(node.text) || inNavigation(node));
    if (kind) node.contentKind = kind;
    else if (contextText) node.contentKind = 'text';
    const useful = node.interactive || kind !== undefined || structuralTags.has(tag)
      || contextText
      || tag === 'label' || tag === 'iframe' || role === 'dialog' || role === 'navigation'
      || (node.source?.domId !== undefined && referencedDescriptions.has(node.source.domId))
      || (tag === 'p' && inCard(node))
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

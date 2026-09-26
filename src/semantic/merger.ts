import type { CapturedPage, RawAxNode, RawAxValue } from '../extract/accessibility.js';
import type { RawDomNode } from '../extract/dom.js';
import type { SemanticNode } from './node.js';
import { isInteractive } from './interactive.js';

function stringValue(value?: RawAxValue): string | undefined {
  return value?.value === undefined ? undefined : String(value.value);
}

function property(ax: RawAxNode | undefined, name: string): string | number | boolean | undefined {
  return ax?.properties?.find((entry) => entry.name === name)?.value.value;
}

function boolProperty(ax: RawAxNode | undefined, name: string): boolean | undefined {
  const value = property(ax, name);
  return typeof value === 'boolean' ? value : undefined;
}

function attributes(dom: RawDomNode): Map<string, string> {
  const result = new Map<string, string>();
  const pairs = dom.attributes ?? [];
  for (let index = 0; index < pairs.length; index += 2) result.set(pairs[index], pairs[index + 1]);
  return result;
}

function directText(dom: RawDomNode): string | undefined {
  const text = dom.children?.filter((child) => child.nodeType === 3).map((child) => child.nodeValue).join(' ').trim();
  return text || undefined;
}

function enrich(node: SemanticNode, ax?: RawAxNode): void {
  if (!ax) return;
  node.role = stringValue(ax.role);
  node.name = stringValue(ax.name);
  node.visible = !ax.ignored;
  const value = stringValue(ax.value);
  if (value !== undefined) node.value = value;
  const disabled = boolProperty(ax, 'disabled');
  if (disabled !== undefined) node.enabled = !disabled;
  node.editable = boolProperty(ax, 'editable');
  node.focusable = boolProperty(ax, 'focusable');
  const checked = property(ax, 'checked');
  if (typeof checked === 'boolean' || checked === 'mixed') node.checked = checked;
  node.selected = boolProperty(ax, 'selected');
  node.expanded = boolProperty(ax, 'expanded');
  node.pressed = boolProperty(ax, 'pressed');
  node.required = boolProperty(ax, 'required');
  node.readonly = boolProperty(ax, 'readonly');
  const level = property(ax, 'level');
  if (typeof level === 'number') node.level = level;
}

/** Preserve raw DOM ancestry and enrich each element with its matching AX node. */
export function mergeSemanticNodes(captured: CapturedPage): SemanticNode[] {
  const axByBackend = new Map<number, RawAxNode>();
  for (const ax of captured.accessibility.nodes) {
    if (ax.backendDOMNodeId !== undefined && !ax.ignored) axByBackend.set(ax.backendDOMNodeId, ax);
  }
  const nodes: SemanticNode[] = [];
  const matchedAx = new Set<string>();

  function visit(dom: RawDomNode, parentId?: string): void {
    let nextParentId = parentId;
    if (dom.nodeType === 1) {
      const attrs = attributes(dom);
      const ax = dom.backendNodeId === undefined ? undefined : axByBackend.get(dom.backendNodeId);
      const id = `dom:${dom.backendNodeId ?? dom.nodeId}`;
      const node: SemanticNode = {
        id,
        tag: dom.nodeName.toLowerCase(),
        visible: !attrs.has('hidden') && attrs.get('aria-hidden') !== 'true',
        interactive: false,
        parentId,
        source: dom.backendNodeId === undefined ? undefined : { backendNodeId: dom.backendNodeId },
      };
      node.type = attrs.get('type');
      node.text = directText(dom);
      node.href = attrs.get('href');
      node.placeholder = attrs.get('placeholder');
      node.value = attrs.get('value');
      if (attrs.has('required')) node.required = true;
      if (attrs.has('readonly')) node.readonly = true;
      if (attrs.has('disabled')) node.enabled = false;
      if (attrs.has('checked')) node.checked = true;
      enrich(node, ax);
      node.interactive = isInteractive(node, attrs);
      if (node.type === 'password') node.value = '<redacted>';
      if (ax) matchedAx.add(ax.nodeId);
      nodes.push(node);
      nextParentId = id;
    }
    for (const child of dom.children ?? []) visit(child, nextParentId);
  }

  visit(captured.dom.root);
  for (const ax of captured.accessibility.nodes) {
    if (ax.ignored || matchedAx.has(ax.nodeId)) continue;
    const node: SemanticNode = { id: `ax:${ax.nodeId}`, visible: true, interactive: false };
    enrich(node, ax);
    node.interactive = isInteractive(node);
    if (ax.backendDOMNodeId !== undefined) node.source = { backendNodeId: ax.backendDOMNodeId };
    nodes.push(node);
  }
  return nodes;
}

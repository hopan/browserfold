import type { SemanticNode } from './node.js';

const interactiveRoles = new Set([
  'button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'option',
  'slider', 'spinbutton', 'switch', 'tab', 'menuitem', 'treeitem',
]);
const interactiveTags = new Set(['a', 'area', 'button', 'input', 'select', 'textarea', 'option']);
const nativeTags = new Set(['button', 'input', 'select', 'textarea', 'option', 'summary']);
const handlerNames = new Set(['onclick', 'onkeydown', 'onkeyup', 'onkeypress']);

function tabbable(attributes: ReadonlyMap<string, string>): boolean {
  return attributes.has('tabindex') && Number(attributes.get('tabindex')) >= 0;
}

function hasHandler(attributes: ReadonlyMap<string, string>): boolean {
  return [...attributes.keys()].some((name) => handlerNames.has(name));
}

export function isControlCandidate(node: SemanticNode, attributes: ReadonlyMap<string, string>): boolean {
  return interactiveRoles.has(node.role ?? '')
    || interactiveTags.has(node.tag ?? '')
    || attributes.get('contenteditable') === 'true'
    || tabbable(attributes)
    || hasHandler(attributes);
}

export function isInteractive(node: SemanticNode, attributes: ReadonlyMap<string, string> = new Map(), cursor?: string): boolean {
  if (node.enabled === false) return false;
  const tag = node.tag ?? '';
  if (tag === 'a' || tag === 'area') return attributes.has('href') || hasHandler(attributes);
  if (nativeTags.has(tag) && node.type !== 'hidden') return true;
  if (attributes.get('contenteditable') === 'true') return true;
  const intent = hasHandler(attributes) || cursor === 'pointer'
    || attributes.has('aria-label') || attributes.has('aria-labelledby');
  if (interactiveRoles.has(node.role ?? '')) return tabbable(attributes) || intent;
  if (tabbable(attributes)) return intent;
  return hasHandler(attributes);
}

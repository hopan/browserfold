import type { SemanticNode } from './node.js';

const interactiveRoles = new Set([
  'button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'option',
  'slider', 'spinbutton', 'switch', 'tab', 'menuitem', 'treeitem',
]);
const interactiveTags = new Set(['a', 'button', 'input', 'select', 'textarea']);
const handlerNames = new Set(['onclick', 'onkeydown', 'onkeyup', 'onkeypress']);

export function isInteractive(node: SemanticNode, attributes: ReadonlyMap<string, string> = new Map()): boolean {
  return interactiveRoles.has(node.role ?? '')
    || interactiveTags.has(node.tag ?? '')
    || attributes.get('contenteditable') === 'true'
    || (attributes.has('tabindex') && Number(attributes.get('tabindex')) >= 0)
    || [...attributes.keys()].some((name) => handlerNames.has(name));
}

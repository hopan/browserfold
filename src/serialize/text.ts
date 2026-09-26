import type { CapturedPage } from '../extract/accessibility.js';
import type { SemanticNode } from '../semantic/node.js';
import type { StructuredNode } from '../semantic/structure.js';

function compact(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function quoted(value: string): string {
  return JSON.stringify(compact(value));
}

function descendants(entry: StructuredNode): StructuredNode[] {
  return entry.children.flatMap((child) => [child, ...descendants(child)]);
}

function controlLine(node: SemanticNode): string {
  const role = node.role && node.role !== 'generic' ? node.role : node.tag ?? 'element';
  const name = compact(node.name || node.text);
  const parts = [`[${node.id}] ${role}${name ? ` ${quoted(name)}` : ''}`];
  if (node.level !== undefined && role === 'heading') parts.push(`level=${node.level}`);
  if (node.value && node.value !== '<redacted>') parts.push(`value=${quoted(node.value)}`);
  if (node.value === '<redacted>') parts.push('value="<redacted>"');
  if (node.enabled === false) parts.push('disabled');
  if (node.checked !== undefined) parts.push(`checked=${node.checked}`);
  if (node.selected === true) parts.push('selected');
  if (node.expanded !== undefined) parts.push(`expanded=${node.expanded}`);
  if (node.pressed !== undefined) parts.push(`pressed=${node.pressed}`);
  if (node.required === true) parts.push('required');
  if (node.readonly === true) parts.push('readonly');
  return parts.join(' ');
}

const optionOwners = new Set(['combobox', 'listbox']);
const MAX_OPTIONS = 25;
const controlRoles = new Set(['button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'option', 'slider', 'spinbutton', 'switch', 'tab', 'menuitem', 'treeitem']);

function renderableControl(node: SemanticNode): boolean {
  return node.interactive || (node.enabled === false && controlRoles.has(node.role ?? ''));
}

function controlLines(entry: StructuredNode, indent: string): string[] {
  const out = [`${indent}${controlLine(entry.node)}`];
  if (!optionOwners.has(entry.node.role ?? '')) return out;
  const options = descendants(entry).filter((child) => child.node.role === 'option' && child.node.visible);
  for (const option of options.slice(0, MAX_OPTIONS)) {
    out.push(`${indent}  [${option.node.id}] option ${quoted(option.node.name || option.node.text || '')}${option.node.enabled === false ? ' disabled' : ''}`);
  }
  if (options.length > MAX_OPTIONS) out.push(`${indent}  options: ${MAX_OPTIONS} of ${options.length} shown`);
  return out;
}

function itemText(entry: StructuredNode): string {
  return [entry.node.text, ...descendants(entry).filter((child) => !child.node.interactive && !child.children.some((grandchild) => grandchild.node.interactive))
    .map((child) => child.node.text)]
    .map(compact).filter(Boolean).filter((value, index, all) => all.indexOf(value) === index).join(' | ');
}

/** Render the retained semantic tree as the compact Semantic UI Snapshot text format. */
export function serializeText(page: Pick<CapturedPage, 'url' | 'title'>, roots: StructuredNode[]): string {
  const lines = ['PAGE', `url: ${page.url}`, `title: ${compact(page.title)}`, '', 'UI'];

  function render(entry: StructuredNode, indent = ''): void {
    const node = entry.node;
    if (!node.visible) return;
    if (node.tag === 'iframe') {
      lines.push(`${indent}FRAME ${quoted(node.name || node.source?.domId || 'iframe')}`);
      for (const child of entry.children) render(child, indent);
      return;
    }
    if (node.contentKind === 'table') {
      lines.push(`${indent}TABLE${node.name ? ` ${compact(node.name)}` : ''}`);
      const rows = descendants(entry).filter((child) => child.node.contentKind === 'row');
      const header = rows.find((row) => descendants(row).some((cell) => cell.node.tag === 'th'));
      if (header) {
        const columns = descendants(header).filter((cell) => cell.node.contentKind === 'cell').map((cell) => compact(cell.node.text || cell.node.name));
        if (columns.length) lines.push(`${indent}columns: ${columns.join(' | ')}`);
        for (const child of descendants(header).filter((child) => renderableControl(child.node))) lines.push(...controlLines(child, `${indent}  `));
      }
      for (const row of rows) {
        if (row === header) continue;
        const cells = descendants(row).filter((cell) => cell.node.contentKind === 'cell' && !descendants(cell).some((child) => renderableControl(child.node)));
        const values = cells.map((cell) => compact(cell.node.text || cell.node.name)).filter(Boolean);
        lines.push(`${indent}[r${row.node.id.slice(1)}]${values.length ? ` ${values.join(' | ')}` : ''}`);
        for (const child of descendants(row).filter((child) => renderableControl(child.node))) lines.push(...controlLines(child, `${indent}  `));
      }
      return;
    }
    if (node.contentKind === 'list') {
      lines.push(`${indent}LIST${node.name ? ` ${compact(node.name)}` : ''}`);
      for (const child of entry.children) render(child, indent);
      return;
    }
    if (node.contentKind === 'item' || node.contentKind === 'card') {
      const summary = itemText(entry);
      lines.push(`${indent}[item${node.id.slice(1)}]${summary ? ` ${summary}` : ''}`);
      for (const child of descendants(entry).filter((child) => renderableControl(child.node))) lines.push(...controlLines(child, `${indent}  `));
      return;
    }
    if (node.contentKind === 'text') {
      lines.push(`${indent}text: ${quoted(node.text!)}`);
      return;
    }
    if (renderableControl(node) || ['heading', 'alert', 'status'].includes(node.contentKind ?? '')) {
      lines.push(...controlLines(entry, indent));
      return;
    }
    for (const child of entry.children) render(child, indent);
  }

  for (const root of roots) render(root);
  return `${lines.join('\n')}\n`;
}

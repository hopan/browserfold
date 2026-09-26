import type { SemanticNode } from './node.js';

export interface SemanticRelation {
  controlId: string;
  contentId: string;
  type: 'label' | 'description' | 'form' | 'row-action' | 'card-action';
}

/** Connect a control to content that names, describes, or scopes its action. */
export function linkControlContent(nodes: SemanticNode[]): SemanticRelation[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const byDomId = new Map(nodes.filter((node) => node.source?.domId).map((node) => [node.source!.domId!, node]));
  const labels = nodes.filter((node) => node.tag === 'label' && node.visible);
  const relations: SemanticRelation[] = [];
  const add = (control: SemanticNode, content: SemanticNode | undefined, type: SemanticRelation['type']): void => {
    if (content?.visible) relations.push({ controlId: control.id, contentId: content.id, type });
  };
  for (const control of nodes) {
    if (!control.visible || !control.interactive) continue;
    const domId = control.source?.domId;
    for (const label of labels) {
      if (domId && label.source?.htmlFor === domId) add(control, label, 'label');
    }
    for (const id of control.source?.describedBy?.split(/\s+/) ?? []) add(control, byDomId.get(id), 'description');
    let ancestor = control.parentId ? byId.get(control.parentId) : undefined;
    while (ancestor) {
      if (ancestor.tag === 'label' && !relations.some((relation) => relation.controlId === control.id && relation.contentId === ancestor!.id)) add(control, ancestor, 'label');
      if (ancestor.tag === 'form') add(control, ancestor, 'form');
      if (ancestor.contentKind === 'row' || ancestor.tag === 'tr') {
        add(control, ancestor, 'row-action');
        control.relation = 'row-action';
        break;
      }
      if (ancestor.contentKind === 'card') {
        add(control, ancestor, 'card-action');
        control.relation = 'card-action';
        break;
      }
      ancestor = ancestor.parentId ? byId.get(ancestor.parentId) : undefined;
    }
  }
  return relations;
}

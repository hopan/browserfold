/** Intermediate node before interactive detection, filtering, and public IDs. */
export interface SemanticNode {
  id: string;
  role?: string;
  name?: string;
  tag?: string;
  type?: string;
  text?: string;
  value?: string;
  visible: boolean;
  enabled?: boolean;
  editable?: boolean;
  focusable?: boolean;
  checked?: boolean | 'mixed';
  selected?: boolean;
  expanded?: boolean;
  hasPopup?: string;
  pressed?: boolean;
  required?: boolean;
  readonly?: boolean;
  level?: number;
  href?: string;
  placeholder?: string;
  bounds?: { x: number; y: number; width: number; height: number };
  interactive: boolean;
  frameId?: string;
  parentId?: string;
  semanticParentId?: string;
  relation?: string;
  contentKind?: 'heading' | 'text' | 'table' | 'row' | 'cell' | 'list' | 'item' | 'card' | 'status' | 'alert';
  source?: { selector?: string; backendNodeId?: number; domId?: string; htmlFor?: string; describedBy?: string };
}

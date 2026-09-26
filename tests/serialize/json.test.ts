import { describe, expect, it } from 'vitest';
import { runCli } from '../../src/cli/index.js';

interface DebugNode {
  id: string;
  parentId?: string;
  frameId?: string;
  tag?: string;
  name?: string;
  visible: boolean;
  source?: { backendNodeId?: number };
  children: DebugNode[];
}

describe('JSON debug output', () => {
  it('emits the full semantic tree and relations from a real Chromium page', async () => {
    const inner = '<button>Pay</button>';
    const html = `<!doctype html><title>Debug</title><label for="email">Email</label><input id="email"><button hidden>Secret</button><iframe title="Payment" srcdoc="${inner}"></iframe>`;
    const output: string[] = [];
    expect(await runCli(['capture', `data:text/html,${encodeURIComponent(html)}`, '--format', 'json'], { write: (text) => output.push(text) })).toBe(0);
    const result = JSON.parse(output.join('')) as {
      page: { url: string; title: string; capturedAt: number };
      nodes: DebugNode[];
      relations: Array<{ controlId: string; contentId: string; type: string }>;
    };
    expect(result.page.title).toBe('Debug');
    expect(result.page.capturedAt).toEqual(expect.any(Number));
    const flatten = (nodes: DebugNode[]): DebugNode[] => nodes.flatMap((node) => [node, ...flatten(node.children)]);
    const nodes = flatten(result.nodes);
    const iframe = nodes.find((node) => node.tag === 'iframe');
    const pay = nodes.find((node) => node.tag === 'button' && node.name === 'Pay');
    const secret = nodes.find((node) => node.tag === 'button' && node.name === 'Secret');
    const input = nodes.find((node) => node.tag === 'input');
    const label = nodes.find((node) => node.tag === 'label');
    expect(pay?.frameId).toBeTruthy();
    expect(iframe && flatten(iframe.children).some((node) => node.id === pay?.id)).toBe(true);
    expect(secret?.visible).toBe(false);
    expect(input?.source?.backendNodeId).toEqual(expect.any(Number));
    expect(result.relations).toContainEqual({ controlId: input?.id, contentId: label?.id, type: 'label' });
  });
});

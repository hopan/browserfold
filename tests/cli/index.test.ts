import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCli } from '../../src/cli/index.js';

describe('capture CLI', () => {
  it('captures a real Chromium page to stdout and an output file', async () => {
    const html = '<!doctype html><title>CLI fixture</title><h1>Welcome</h1><button>Continue</button>';
    const url = `data:text/html,${encodeURIComponent(html)}`;
    const output: string[] = [];
    const directory = await mkdtemp(join(tmpdir(), 'browserfold-cli-'));
    try {
      expect(await runCli(['capture', url], { write: (text) => output.push(text) })).toBe(0);
      expect(output.join('')).toContain('title: CLI fixture');
      expect(output.join('')).toMatch(/button "Continue"/);
      const filename = join(directory, 'snapshot.txt');
      expect(await runCli(['capture', url, '-o', filename], { write: (text) => output.push(text) })).toBe(0);
      expect(await readFile(filename, 'utf8')).toContain('button "Continue"');
      expect(output).toHaveLength(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

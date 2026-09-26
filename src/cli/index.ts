#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { attachCdp } from '../browser/cdp.js';
import { launchUrl } from '../browser/launcher.js';
import { capturePage } from '../extract/accessibility.js';
import { mergeSemanticNodes } from '../semantic/merger.js';
import { generateSemanticIds } from '../semantic/identity.js';
import { buildContentStructure } from '../semantic/structure.js';
import { linkControlContent } from '../semantic/relationships.js';
import { serializeText } from '../serialize/text.js';
import { serializeJson } from '../serialize/json.js';

export interface CliOutput { write(text: string): void }

interface CaptureOptions {
  url?: string;
  cdp?: string;
  page?: number;
  output?: string;
  format: 'text' | 'json';
}

function parseArgs(args: string[]): CaptureOptions {
  if (args.shift() !== 'capture') throw new Error('Usage: browserfold capture [URL | --cdp ENDPOINT] [--page INDEX] [-o FILE] [--format text|json]');
  const options: CaptureOptions = { format: 'text' };
  while (args.length) {
    const arg = args.shift()!;
    if (arg === '--cdp') options.cdp = required(args, arg);
    else if (arg === '--page') {
      const value = required(args, arg);
      if (!/^\d+$/.test(value)) throw new Error('--page must be a nonnegative integer');
      options.page = Number(value);
    } else if (arg === '-o' || arg === '--output') options.output = required(args, arg);
    else if (arg === '--format') {
      const value = required(args, arg);
      if (value !== 'text' && value !== 'json') throw new Error(`Unsupported format: ${value}`);
      options.format = value;
    } else if (arg === '--mode') {
      const value = required(args, arg);
      if (value !== 'automation') throw new Error(`Unsupported mode: ${value}`);
    } else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
    else if (options.url) throw new Error('Only one URL can be captured');
    else options.url = arg;
  }
  if (Boolean(options.url) === Boolean(options.cdp)) throw new Error('Provide exactly one URL or --cdp endpoint');
  if (options.page !== undefined && !options.cdp) throw new Error('--page requires --cdp');
  return options;
}

function required(args: string[], option: string): string {
  const value = args.shift();
  if (!value || value.startsWith('-')) throw new Error(`${option} requires a value`);
  return value;
}

export async function runCli(args: string[], output: CliOutput = process.stdout): Promise<number> {
  const options = parseArgs([...args]);
  const session = options.cdp ? await attachCdp(options.cdp, options.page) : await launchUrl(options.url!);
  try {
    const page = await capturePage(session.page);
    const nodes = generateSemanticIds(mergeSemanticNodes(page));
    const roots = buildContentStructure(nodes);
    const snapshot = options.format === 'json'
      ? serializeJson(page, nodes, linkControlContent(nodes))
      : serializeText(page, roots);
    if (options.output) await writeFile(options.output, snapshot, 'utf8');
    else output.write(snapshot);
    return 0;
  } finally {
    await session.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(process.argv.slice(2)).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

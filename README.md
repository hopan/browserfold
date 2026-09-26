# BrowserFold

BrowserFold turns a browser page's DOM, accessibility information, and runtime state into a compact **Semantic UI Snapshot**: plain text that an LLM browser agent can read to find controls, visible content, and their relationships. It aims to reduce the tokens spent on raw HTML while retaining the context needed to choose UI actions. The current project is a capture CLI; it does not execute agent actions.

## Install

Requires Node.js and Chromium for Playwright. From this repository:

```bash
npm install
npx playwright install chromium
npm run build
```

## Capture a page

```bash
node dist/cli/index.js capture https://example.com
node dist/cli/index.js capture https://example.com -o snapshot.txt
```

The `browserfold` executable points to `dist/cli/index.js` after a build. The CLI also accepts `capture --cdp http://127.0.0.1:9222` to attach to an existing Chromium session, with optional `--page INDEX`. Use `--format json` for a detailed debug representation; text is the default. The supported `--mode` value is `automation`.

Here is the **UI section of an actual text snapshot** from the CLI on a small static page with a heading, labeled input, and button:

```text
UI
[ec0e79225fd] heading "Welcome" level=1
[e6816218de2] textbox "Search"
[e64a1a08309] button "Go"
```

The full output also begins with a `PAGE` section containing the URL and title. Element IDs are generated from page semantics and can differ when the page changes.

## Benchmark status

In the recorded real page corpus, 103 distinct URLs were attempted and 89 usable samples contributed to the token ratio. Snapshot text used **3.41%** of raw DOM tokens in aggregate; the mean ratio per page was **5.38%**. These are ratios from a regex based token estimate, not a model tokenizer, and they do not establish semantic coverage. The fixed two page acceptance fixture remains at **24.84%**, above the specification's 10% MVP target, so overall MVP acceptance is still open. See the [corpus report](docs/CORPUS_REPORT.md) for methods, exclusions, and limits, and the [specification](docs/SPEC.md) and [progress log](docs/PROGRESS.md) for scope and test history.

The reusable corpus data and measurement script are in [`corpus/`](corpus/). They load public web pages and are intentionally outside CI.

## License

MIT. See [LICENSE](LICENSE).

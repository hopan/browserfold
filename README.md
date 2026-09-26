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

In the recorded real page corpus, 103 distinct URLs were attempted and 89 usable samples contributed to the token ratio. Snapshot text used **3.41%** of raw DOM tokens in aggregate; the mean ratio per page was **5.38%**. These are ratios from a regex based token estimate, not a model tokenizer, and they do not establish semantic coverage. By project owner Hoàng's decision on 2026-09-27, the MVP token-ratio criterion of ≤10% is met on this 89-page real-world corpus. The two fixed acceptance fixtures measure **535/2,142 = 24.98%** now (**532/2,142 = 24.84%** before the popup-signal change); they are small and unusually dense with controls, so their ratio is still logged but no longer gates MVP token ratio in CI. This decision changes which sample is used for the gate; it does not change the measured fixture result or the 10% target. Other MVP criteria require separate assessment. See the [corpus report](docs/CORPUS_REPORT.md) for methods, exclusions, and limits, and the [specification](docs/SPEC.md) and [progress log](docs/PROGRESS.md) for scope and test history.

Actionable recall and precision were measurable on **87/89 URLs** under the prior recall accounting (**86/89 representative token-ratio samples**; the additional Lit tutorial is not representative). Across the 87 measured URLs, the per-page mean was **95.90% recall** and **93.84% precision**; pooling elements gave **21,502/24,708 = 87.02% recall** and **21,502/22,480 = 95.65% precision**. The corpus does **not meet both SPEC thresholds together under either calculation** (recall at least 95% and false interactive below 5%, equivalent to precision above 95%). Measurement uncovered and fixed two real bugs in shadow root traversal and alert rendering; see the [corpus report](docs/CORPUS_REPORT.md) for per-page misses, causes, and full details.

The reusable corpus data and measurement script are in [`corpus/`](corpus/). They load public web pages and are intentionally outside CI.

## License

MIT. See [LICENSE](LICENSE).

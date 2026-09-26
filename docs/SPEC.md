# BrowserFold
## Design Specification for AI Browser Automation

**Version:** 0.1  
**Status:** Draft for Implementation  
**Primary goal:** Convert a browser page/session into a compact, deterministic semantic browser-state representation optimized for LLM reasoning and automation testing.

**Project name:** BrowserFold  
**CLI:** `browserfold`  
**Concept:** Fold a live browser state into a compact semantic representation containing controls, visible content, structural relationships, and runtime state for LLMs.

---

# 1. Problem

LLM-based browser automation currently has three common input representations:

1. Screenshot
   - High token / vision cost
   - Hard to identify exact controls
   - Weak for deterministic testing
   - Necessary only for visual/layout-specific cases

2. Raw HTML / DOM
   - Extremely noisy
   - Contains CSS, JS, framework internals, hidden nodes, duplicated text
   - Expensive in tokens

3. Markdown
   - Good for document/content extraction
   - Loses UI semantics such as:
     - role
     - enabled/disabled
     - checked/selected
     - input type
     - interaction target
     - dialog/menu structure
     - actionable element identity

This project introduces a fourth representation:

> **Semantic UI Snapshot**

A compact text representation of the current browser UI state that preserves information needed by an LLM to understand and manipulate the UI.

---

# 2. Core Principle

```text
Browser State
    ↓
DOM + Accessibility + Runtime State
    ↓
Semantic Extraction
    ↓
Filtering / Normalization
    ↓
Stable Element Identification
    ↓
Compact Text Serialization
    ↓
LLM
```

Do not send the whole browser page to the LLM.

BrowserFold must preserve four semantic layers:

1. **Controls** — buttons, inputs, filters, tabs, checkboxes, menus, pagination, row actions.
2. **Visible Content** — text, table rows, list items, status messages, values, labels, summaries.
3. **Structure / Relationships** — which control belongs to which form, row, table, dialog, section, filter group, pagination block, etc.
4. **Runtime State** — enabled/disabled, checked, selected, expanded, current value, loading, validation state.

Only send information relevant to:

- understanding current state
- understanding visible data
- choosing actions
- relating actions to the correct data/context
- validating results
- detecting UI changes

---

# 3. Scope

## 3.1 Input

The extractor MUST support two operating modes.

### Mode A — URL

```bash
browserfold capture https://example.com/login
```

The system launches a browser, navigates to the URL and captures the semantic state.

### Mode B — Existing browser / remote Chrome

```bash
browserfold capture --cdp http://127.0.0.1:9222
```

The system attaches to an existing Chromium session through CDP and captures the currently active page.

Optional:

```bash
browserfold capture --cdp http://127.0.0.1:9222 --page 2
```

---

# 4. Output

Primary output is UTF-8 plain text.

Example:

```text
PAGE
url: https://example.com/users
title: Users

FILTERS
[e1] textbox "Search"
[e2] combobox "Status" value="Active"
[e3] button "Apply"

ACTIONS
[e4] button "Export"
[e5] button "Add user"

TABLE Users
columns: Name | Email | Status | Role

[r1] Nguyen Van A | a@example.com | Active | Admin
  [e11] button "View"
  [e12] button "Edit"

[r2] Tran Van B | b@example.com | Locked | User
  [e13] button "View"
  [e14] button "Unlock"

PAGINATION
[e20] button "Previous" disabled
[e21] button "Next"
text: "1-20 of 245"
```

The output should be directly consumable by an LLM.

Optional formats:

```text
--format text
--format json
--format yaml
```

`text` is the default and canonical LLM representation.

---

# 5. Design Goals

Priority order:

1. Semantic correctness
2. Preserve visible business/data context
3. Preserve structural relationships between content and controls
4. Deterministic output
5. Low token count
6. Stable interaction identifiers
7. Compatibility with Playwright/CDP
8. Framework independence
9. LLM independence
10. Fast snapshot generation

Non-goals for MVP:

- autonomous agent
- browser planning
- LLM integration
- CAPTCHA solving
- OCR
- visual regression testing
- automatic test generation

---

# 6. Architecture

```text
                  ┌────────────────────┐
                  │       Input        │
                  │ URL / CDP Session  │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │ Browser Adapter    │
                  │ Playwright + CDP   │
                  └─────────┬──────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      ┌───────────────┐          ┌────────────────┐
      │ ARIA Snapshot │          │ DOM Enrichment │
      │ Accessibility │          │ Runtime State  │
      └───────┬───────┘          └────────┬───────┘
              │                           │
              ▼                           ▼
      ┌───────────────┐          ┌────────────────┐
      │ Control       │          │ Visible Content│
      │ Extractor     │          │ Extractor      │
      └───────┬───────┘          └────────┬───────┘
              └─────────────┬─────────────┘
                            ▼
                  ┌────────────────────┐
                  │ Structure Builder  │
                  │ + Semantic Merger  │
                  └─────────┬──────────┘
                            ▼
                  ┌────────────────────┐
                  │ Filter / Normalize │
                  └─────────┬──────────┘
                            ▼
                  ┌────────────────────┐
                  │ ID / Relation Map  │
                  └─────────┬──────────┘
                            ▼
                  ┌────────────────────┐
                  │ Serializer         │
                  │ text/json/yaml     │
                  └────────────────────┘
```

---

# 7. Recommended Technology

## Runtime

- TypeScript
- Node.js

## Browser layer

- Playwright
- Chromium DevTools Protocol

Reason:

- attach to existing Chrome
- query DOM and accessibility information
- inspect frames
- execute JS in page context
- robust browser automation primitives

---

# 8. Semantic Node Model

Internal representation:

```ts
interface SemanticNode {
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

  checked?: boolean | "mixed";
  selected?: boolean;
  expanded?: boolean;
  pressed?: boolean;

  required?: boolean;
  readonly?: boolean;

  level?: number;

  href?: string;

  placeholder?: string;

  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  interactive: boolean;

  frameId?: string;

  parentId?: string;

  semanticParentId?: string;
  relation?: string;

  contentKind?: "heading" | "text" | "table" | "row" | "cell" | "list" | "item" | "status" | "alert";

  source?: {
    selector?: string;
    backendNodeId?: number;
  };
}
```

Do NOT serialize all fields by default.

Only serialize fields that add semantic value.

---

# 10. Browser State Model

BrowserFold does not model the page as a flat list of elements.

The canonical internal model has four layers:

```text
BrowserState
├── Controls
├── Content
├── Structure
└── State
```

## 9.1 Controls

Examples:

```text
button
textbox
combobox
checkbox
radio
tab
menuitem
link
pagination control
row action
```

## 9.2 Visible Content

Examples:

```text
headings
paragraphs
table headers
table rows
list items
labels
status
alerts
validation errors
summary values
current filter values
pagination text
```

## 9.3 Structure / Relationships

Examples:

```text
control -> form
filter -> table
row action -> table row
cell -> table row -> table
button -> dialog
tab -> tabpanel
pagination -> table/list
label -> input
```

Relationships are critical for automation.

Example:

```text
[r2] Tran Van B | Locked
  [e14] button "Unlock"
```

is preferred over:

```text
[e14] button "Unlock"
```

because the first representation tells the LLM **which user the action applies to**.

## 9.4 Runtime State

Examples:

```text
enabled / disabled
checked
selected
expanded
pressed
loading
readonly
required
current value
validation error
visibility
```

---

# 10. Data Sources

The extractor SHOULD merge information from several browser sources.

## 9.1 Accessibility / ARIA

Primary semantic source.

Collect:

- role
- accessible name
- checked
- selected
- expanded
- disabled
- required
- level
- value

## 9.2 DOM

Use to enrich missing information:

- tag name
- input type
- placeholder
- href
- contenteditable
- data attributes if needed
- visibility
- event listeners where practical

## 9.3 Layout

Optional but recommended:

- bounding box
- viewport intersection
- z-index related visibility when necessary

Geometry is internal by default.

Only expose to LLM when needed.

---

# 11. Interactive Element Detection

A node should be considered interactive if one or more conditions apply:

```text
role ∈ {
  button,
  link,
  textbox,
  checkbox,
  radio,
  combobox,
  option,
  slider,
  spinbutton,
  switch,
  tab,
  menuitem,
  treeitem
}
```

OR:

```text
tag ∈ {
  a,
  button,
  input,
  select,
  textarea
}
```

OR:

```text
contenteditable=true
```

OR:

```text
tabindex >= 0
```

OR a supported click/keyboard handler is detected.

---

# 12. Filtering Rules

## MUST remove

- script
- style
- noscript
- hidden elements
- aria-hidden=true
- display:none
- visibility:hidden
- zero-sized non-semantic elements
- framework wrapper noise
- duplicated text nodes
- decorative icons without accessible meaning

## SHOULD retain

- actionable elements
- form fields
- labels
- validation errors
- dialogs
- alerts
- headings
- tables
- important navigation
- visible status messages
- text required to understand the action context

---

# 14. Content and Table Extraction

BrowserFold MUST capture visible content required to understand the current business state.

## 13.1 Tables

A table should be serialized structurally, not as disconnected cell text.

Preferred:

```text
TABLE Users
columns: Name | Email | Status | Role

[r1] Nguyen Van A | a@example.com | Active | Admin
  [e11] button "View"
  [e12] button "Edit"

[r2] Tran Van B | b@example.com | Locked | User
  [e13] button "View"
  [e14] button "Unlock"
```

Avoid:

```text
Nguyen Van A
a@example.com
Active
Admin
View
Edit
Tran Van B
...
```

The row relationship must be retained.

## 13.2 Filters

Filters should be grouped and connected to the content they affect where detectable.

```text
FILTERS -> TABLE Users

[e1] textbox "Search"
[e2] combobox "Status" value="Active"
[e3] button "Apply"
```

## 13.3 Lists / Cards

For repeated card/list UIs:

```text
LIST Projects

[item1] Project Alpha | Active | Owner: Alice
  [e20] button "Open"
  [e21] button "Archive"
```

## 13.4 Content Limits

For very large tables or lists, support configurable limits:

```text
--max-rows 100
--max-items 100
--max-text-chars 20000
```

When truncated, output MUST explicitly state it:

```text
TABLE Users
showing: 100 of 245 rows
truncated: true
```

Never silently truncate.

---

# 14. Text Retention Strategy

Not every paragraph should be emitted.

Text should be classified:

```text
ACTION_CONTEXT
FORM_CONTEXT
STATUS
ERROR
NAVIGATION
CONTENT
DECORATIVE
```

Default modes:

### automation

Retain:

- interactive controls
- headings
- labels
- errors
- alerts
- status
- visible table/list/card data needed for decision making
- current filter/sort/pagination state
- nearby action context
- structural relationships between actions and data

Do not retain irrelevant prose or decorative content.

### content

Retain more page text.

Example:

```bash
browserfold capture URL --mode automation
browserfold capture URL --mode content
```

Default:

```text
automation
```

---

# 15. Compact Serialization

Canonical text format supports both controls and content structures.

Control:

```text
[e12] <role> "<accessible-name>" <properties>
```

Structured content:

```text
[r3] <cell1> | <cell2> | <cell3>
  [e17] button "Action"
```

Examples:

```text
[e1] heading "Checkout" level=1
[e2] textbox "Card number" required
[e3] combobox "Country" value="Vietnam"
[e4] checkbox "Save card" checked=false
[e5] button "Pay" disabled
[e6] alert "Card number is invalid"
```

Avoid verbose forms:

```text
role=button name="Pay" enabled=true visible=true interactive=true
```

Prefer:

```text
[e5] button "Pay"
```

Properties with default values are omitted.

---

# 16. Element IDs

LLM actions need stable identifiers.

Format:

```text
e1
e2
e3
...
```

For a single snapshot, incremental IDs are sufficient.

For multi-step automation, IDs should remain stable where possible.

Recommended stable-key input:

```text
frame
+
role
+
accessible name
+
DOM ancestry fingerprint
+
element attributes
```

Example hash:

```text
stable_key = hash(
  frameId +
  role +
  name +
  tag +
  id +
  nameAttr +
  nearestSemanticParent
)
```

Expose short ID:

```text
e17
```

Internally map:

```text
e17 -> stable_key -> DOM node
```

---

# 17. Snapshot Diff

Version 2 SHOULD support state diff.

Input:

```text
snapshot_N
snapshot_N+1
```

Output:

```diff
+ [e9] alert "Invalid password"
~ [e4] button "Sign in" disabled → enabled
- [e7] progressbar "Signing in"

~ TABLE Users
- [r2] Tran Van B | Locked | User
+ [r2] Tran Van B | Active | User
```

This allows the LLM to process only page changes after an action.

Architecture:

```text
Snapshot N
   +
Snapshot N+1
   ↓
Semantic Diff
   ↓
LLM
```

This is a major token-saving mechanism.

---

# 18. Action Interface

The extractor itself does not need to execute actions in MVP.

However, element IDs MUST support future actions:

```text
click(e5)
type(e2, "user@example.com")
select(e3, "Vietnam")
check(e4)
press(e2, "Enter")
```

Future module:

```text
LLM
 ↓
Action DSL
 ↓
Resolver
 ↓
Playwright
```

---

# 19. Frames and Shadow DOM

## iframe

Each node should carry frame context internally.

Serialized format only exposes frame boundaries when useful:

```text
FRAME "Payment"

[e21] textbox "Card number"
[e22] textbox "Expiry"
[e23] textbox "CVV"
```

## Shadow DOM

Traverse open shadow roots.

Closed shadow roots may remain unsupported.

---

# 20. Dynamic UI

The system must capture:

- modal dialogs
- menus
- toast messages
- dropdowns
- lazy-rendered controls
- SPA route changes

Before capture, optional stabilization:

```text
network idle OR
DOM quiet period = 300 ms
```

Configurable timeout.

Do not rely solely on `networkidle` because modern applications may keep persistent connections open.

---

# 21. Visual Fallback

Screenshot is NOT part of the default representation.

Use visual capture only when:

- canvas
- chart
- map
- visual layout assertion
- non-semantic custom controls
- inaccessible web component
- semantic extraction confidence is low

Future output may include:

```text
VISUAL_FALLBACK_REQUIRED:
- canvas#chart
```

The LLM/controller can then request a screenshot selectively.

---

# 22. CLI Specification

## Capture URL

```bash
browserfold capture https://example.com
```

## Remote Chrome

```bash
browserfold capture --cdp http://localhost:9222
```

## Save file

```bash
browserfold capture https://example.com -o snapshot.txt
```

## JSON

```bash
browserfold capture https://example.com --format json
```

## Automation mode

```bash
browserfold capture https://example.com --mode automation
```

## Content mode

```bash
browserfold capture https://example.com --mode content
```

## Include geometry

```bash
browserfold capture https://example.com --geometry
```

## Limit large content structures

```bash
browserfold capture https://example.com --max-rows 100 --max-items 100 --max-text-chars 20000
```

---

# 23. Library API

Example:

```ts
import { captureSnapshot } from "@browserfold/core";

const result = await captureSnapshot({
  url: "https://example.com",
  mode: "automation",
  format: "text"
});

console.log(result.text);
```

Remote browser:

```ts
const result = await captureSnapshot({
  cdpEndpoint: "http://localhost:9222",
  mode: "automation"
});
```

---

# 24. Module Structure

```text
src/
├── browser/
│   ├── launcher.ts
│   ├── cdp.ts
│   └── page-selector.ts
│
├── extract/
│   ├── accessibility.ts
│   ├── dom.ts
│   ├── layout.ts
│   └── frames.ts
│
├── semantic/
│   ├── node.ts
│   ├── merger.ts
│   ├── interactive.ts
│   ├── content.ts
│   ├── structure.ts
│   ├── relationships.ts
│   └── normalize.ts
│
├── filter/
│   ├── visibility.ts
│   ├── noise.ts
│   └── relevance.ts
│
├── identity/
│   ├── fingerprint.ts
│   └── element-map.ts
│
├── serialize/
│   ├── text.ts
│   ├── json.ts
│   └── yaml.ts
│
├── diff/
│   └── semantic-diff.ts
│
├── cli/
│   └── index.ts
│
└── index.ts
```

---

# 25. MVP

MVP includes only:

1. Launch URL or attach CDP
2. Capture current page
3. Extract accessibility + DOM information
4. Detect visible interactive elements
5. Extract visible content needed for automation
6. Preserve table/list/card structure
7. Preserve relationships between controls and content
8. Generate semantic IDs
9. Output compact text
10. Handle iframe
11. CLI
12. JSON debug output
13. Automated tests

Exclude:

- LLM
- autonomous browser agent
- screenshot analysis
- test generation
- semantic diff

---

# 26. Phase 2

Add:

- stable IDs across page states
- snapshot diff
- action executor
- selective contextual text
- shadow DOM
- token budgeting

---

# 27. Phase 3

Add:

```text
Goal
 ↓
Semantic Snapshot
 ↓
LLM Planner
 ↓
Action DSL
 ↓
Browser
 ↓
Semantic Diff
 ↓
LLM
```

This becomes a complete AI browser automation runtime.

---

# 28. Acceptance Criteria

## Functional

Given a normal login page, extractor MUST identify:

- username/email field
- password field
- submit button
- checkbox if present
- validation errors
- relevant links

Given a data-management page, extractor MUST also preserve:

- visible table/list/card content
- column/header structure
- filter values
- pagination state
- row-level action relationships
- status/error text

without screenshot processing.

## Token efficiency

Compare:

```text
raw HTML tokens
vs
semantic snapshot tokens
```

Target MVP:

```text
semantic snapshot <= 10% of raw DOM token count
```

Stretch target:

```text
<= 5%
```

## Semantic coverage

On benchmark pages:

```text
>= 95% of visible actionable controls represented
```

## Precision

False interactive elements:

```text
< 5%
```

## Determinism

Two snapshots of an unchanged page should produce semantically identical output.

---

# 29. Benchmark

Build a test corpus:

```text
20 simple websites
20 SPA applications
10 dashboards
10 ecommerce pages
10 enterprise forms
10 pages with modal/dropdown
10 iframe-heavy pages
10 custom component pages
```

Metrics:

| Metric | Meaning |
|---|---|
| Actionable Recall | % actual controls captured |
| Actionable Precision | % captured controls actually actionable |
| Token Ratio | snapshot tokens / raw DOM tokens |
| Snapshot Latency | extraction time |
| ID Stability | % unchanged controls retaining identity |
| Test Success Rate | agent action success using snapshot |

---

# 30. Reference Baseline

Compare implementation against:

- Playwright ARIA snapshots
- Browser Use DOM representation
- accessibility tree only
- raw HTML
- screenshot-based vision

The project should not clone Browser Use.

The intended design is a smaller, deterministic extraction layer reusable by any LLM or automation framework.

---

# 31. Security

Never serialize by default:

- password values
- authentication tokens
- cookies
- localStorage
- sessionStorage
- hidden secrets
- Authorization headers

Password fields:

```text
[e3] textbox "Password" type=password value=<redacted>
```

For general form values, support:

```text
--redact-values
```

Default for sensitive input types is always redact.

---

# 32. Project Naming

Final name:

> **BrowserFold**

Meaning:

```text
Browser State
    ↓
BrowserFold
    ↓
Compact Semantic Representation
    ↓
LLM
```

The name reflects the product's core function: **folding a large, noisy browser state into a compact semantic context while preserving the information required for reasoning and interaction**.

Repository:

```text
browserfold
```

Recommended package names:

```text
@browserfold/core
@browserfold/cli
```

CLI:

```bash
browserfold
```

Optional short alias:

```bash
bfold
```

# 32. Final Product Boundary

The key abstraction is:

```text
Browser
   ↓
Semantic Browser-State Snapshot
   ├── Controls
   ├── Visible Content
   ├── Relationships
   └── Runtime State
```

NOT:

```text
Browser
   ↓
LLM Agent
```

This separation allows the extractor to be used by:

- autonomous agents
- AI QA tools
- test generators
- accessibility tools
- browser copilots
- RPA systems
- LLM evaluation frameworks

The output should be deterministic enough for machines and compact enough for LLMs.

---

# 32. Definition of Done — MVP

MVP is complete when this command:

```bash
browserfold capture --cdp http://localhost:9222
```

can reliably turn the currently displayed Chrome page into:

```text
PAGE
url: ...
title: ...

UI
[e1] ...
[e2] ...
[e3] ...
```

with:

- visible/actionable controls represented
- visible business/data content represented
- table/list/card structure preserved
- relationships between controls and content preserved
- useful runtime state preserved
- framework noise removed
- no screenshot required for normal DOM-based interfaces
- output small enough to send directly to an LLM

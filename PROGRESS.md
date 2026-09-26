# BrowserFold — tiến độ dispatch 1

Phạm vi: chỉ các item 1–3 của mục 25 trong `SPEC.md`.

## Setup

- Chọn TypeScript với `tsc` để kiểm tra kiểu và biên dịch thư viện Node; chọn Vitest vì chạy test TypeScript trực tiếp, lọc theo từng file, phù hợp với kiểm thử tích hợp Playwright/Chromium thật.
- `src/index.ts` là điểm vào rỗng để `tsc` kiểm tra được ngay ở bước setup; public API thuộc dispatch sau.
- Lệnh setup: `npm install --save-dev typescript vitest @types/node` — thành công, 0 vulnerabilities.
- Mã lưu local: `66263b7` (`chore: set up TypeScript and Vitest for BrowserFold`). `npm run typecheck` pass khi setup.

## Item 1 — Launch URL / attach CDP

Hoàn tất. Test: `tests/browser/launcher.test.ts`; code: `src/browser/launcher.ts`, `src/browser/cdp.ts`, `src/browser/page-selector.ts`.

- Red: `npm test -- tests/browser/launcher.test.ts` — fail (exit 1), thiếu module `src/browser/launcher.js`, 0 test chạy.
- Green: cùng lệnh — pass, 1 file / 2 test với Chromium thật (launch URL và attach CDP).
- Mã lưu local: `a1d76a0` (`feat: launch URL and attach to Chromium over CDP`). `npm run typecheck` pass.

## Item 2 — Capture page

Hoàn tất. Test: `tests/extract/accessibility.test.ts`; code: `src/extract/accessibility.ts`, `src/extract/dom.ts`.

- Red: `npm test -- tests/extract/accessibility.test.ts` — fail (exit 1), thiếu module `src/extract/accessibility.js`, 0 test chạy.
- Green: cùng lệnh — pass, 1 file / 1 test với Chromium thật. `npm run typecheck` pass.
- Mã lưu local: `83c6f2f` (`feat: capture raw DOM and accessibility trees`).

## Item 3 — Extract accessibility + DOM

Hoàn tất. Test: `tests/semantic/merger.test.ts`; code: `src/semantic/node.ts`, `src/semantic/merger.ts`.

- Red: `npm test -- tests/semantic/merger.test.ts` — fail (exit 1), thiếu module `src/semantic/merger.js`, 0 test chạy.
- Green: `npm run typecheck && npm test -- tests/semantic/merger.test.ts` — pass, 1 file / 1 test với Chromium thật.
- Mã lưu local: sẽ bổ sung sau commit item 3.

## Sai khác với SPEC.md

- CDP không cung cấp trạng thái tab đang được hệ điều hành focus qua Playwright. Mặc định chọn trang không rỗng có `performance.timeOrigin` mới nhất; `pageIndex` chọn theo thứ tự thời điểm điều hướng tăng dần. Đây là heuristic để xác định "current page"; trang cũ được focus lại cần chỉ định `pageIndex`.
- Trường `id` ở bước này chỉ là khóa nội bộ `dom:<backendNodeId>` / `ax:<nodeId>`, chưa phải semantic ID của item 8. `interactive` để `false` tạm thời cho đến item 4; `visible` dựa trên AX `ignored`/thuộc tính DOM cơ bản, chưa phải lọc visibility đầy đủ.

## Dispatch sau

4. Detect visible interactive elements.
5. Extract visible content needed for automation.
6. Preserve table/list/card structure.
7. Preserve relationships between controls and content.
8. Generate semantic IDs.
9. Output compact text.
10. Handle iframe.
11. CLI.
12. JSON debug output.
13. Automated tests cho toàn MVP và các tiêu chí chấp nhận (token ratio, recall, precision, determinism).

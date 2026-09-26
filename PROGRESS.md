# BrowserFold — tiến độ dispatch 1–2

Phạm vi đã hoàn tất: item 1–7 của mục 25 trong `SPEC.md`.

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
- Mã lưu local: `fe05091` (`feat: merge accessibility and DOM into semantic nodes`).

## Kiểm tra cuối dispatch 1

- `npm test` — pass, 3 file / 4 test. Chạy toàn bộ test đã viết đúng một lần sau khi hoàn tất ba item.
- `npm run typecheck` — pass.
- `npm run build` — pass.

## Sai khác với SPEC.md

- CDP không cung cấp trạng thái tab đang được hệ điều hành focus qua Playwright. Mặc định chọn trang không rỗng có `performance.timeOrigin` mới nhất; `pageIndex` chọn theo thứ tự thời điểm điều hướng tăng dần. Đây là heuristic để xác định "current page"; trang cũ được focus lại cần chỉ định `pageIndex`.
- Trường `id` ở bước này chỉ là khóa nội bộ `dom:<backendNodeId>` / `ax:<nodeId>`, chưa phải semantic ID của item 8.
- Detection handler hiện nhận diện inline `onclick`/keyboard handler, chưa phát hiện listener gắn bằng `addEventListener`. Visibility xét AX, thuộc tính ẩn, CSS `display`/`visibility` và kích thước bằng 0; chưa xét che khuất bởi phần tử khác hoặc viewport intersection.
- Automation content hiện dùng quy tắc giữ control, heading, label, status/alert, cấu trúc table/list/card và mô tả tham chiếu bởi `aria-describedby`. Chưa có bộ phân loại ngữ cảnh văn bản tổng quát; đoạn văn tự do ngoài card được bỏ qua. Card hiện nhận diện bằng `<article>` hoặc class `card`.

## Dispatch 2 — item 4–7

### Item 4 — Detect visible interactive elements

Hoàn tất. Test: `tests/semantic/interactive.test.ts`; code: `src/semantic/interactive.ts`, `src/semantic/merger.ts`.

- Red: `npm test -- tests/semantic/interactive.test.ts` — fail (1 test), nút Save vẫn có `interactive: false`.
- Green: cùng lệnh — pass, 1 file / 1 test với Chromium thật; `npm run typecheck` pass.
- Mã lưu local: `02953a0` (`feat: detect interactive semantic nodes`).

### Item 5 — Extract visible automation content

Hoàn tất. Test: `tests/semantic/content.test.ts`; code: `src/extract/dom.ts`, `src/semantic/merger.ts`, `src/semantic/content.ts`.

- Red: `npm test -- tests/semantic/content.test.ts` — fail (exit 1), thiếu module `src/semantic/content.js`. Trong vòng chỉnh sửa test, phát hiện fixture span inline không tạo box 0×0; sửa fixture thành block 0×0 để kiểm tra đúng quy tắc và test xanh.
- Green: cùng lệnh — pass, 1 file / 1 test với Chromium thật; `npm run typecheck` pass.
- Mã lưu local: `5841384` (`feat: filter visible automation content`).

### Item 6 — Preserve table/list/card structure

Hoàn tất. Test: `tests/semantic/structure.test.ts`; code: `src/semantic/node.ts`, `src/semantic/merger.ts`, `src/semantic/content.ts`, `src/semantic/structure.ts`.

- Red: `npm test -- tests/semantic/structure.test.ts` — fail (exit 1), thiếu module `src/semantic/structure.js`.
- Green: cùng lệnh — pass, 1 file / 1 test với Chromium thật; `npm run typecheck` pass.
- Mã lưu local: `b5c16d1` (`feat: preserve table list and card structure`).

### Item 7 — Preserve control/content relationships

Hoàn tất. Test: `tests/semantic/relationships.test.ts`; code: `src/semantic/node.ts`, `src/semantic/merger.ts`, `src/semantic/content.ts`, `src/semantic/relationships.ts`.

- Red: `npm test -- tests/semantic/relationships.test.ts` — fail (exit 1), thiếu module `src/semantic/relationships.js`.
- Green: cùng lệnh — pass, 1 file / 1 test với Chromium thật; `npm run typecheck` pass.
- Mã lưu local: `1afd532` (`feat: link controls to labels descriptions and content groups`).

## Kiểm tra cuối dispatch 2

- `npm test` — pass, 7 file / 8 test (dispatch 1+2), chạy toàn bộ một lần sau item 7.
- `npm run typecheck` — pass.
- `npm run build` — pass.

## Dispatch sau

8. Generate semantic IDs.
9. Output compact text.
10. Handle iframe.
11. CLI.
12. JSON debug output.
13. Automated tests cho toàn MVP và các tiêu chí chấp nhận (token ratio, recall, precision, determinism).

# BrowserFold — tiến độ dispatch 1

Phạm vi: chỉ các item 1–3 của mục 25 trong `SPEC.md`.

## Setup

- Chọn TypeScript với `tsc` để kiểm tra kiểu và biên dịch thư viện Node; chọn Vitest vì chạy test TypeScript trực tiếp, lọc theo từng file, phù hợp với kiểm thử tích hợp Playwright/Chromium thật.
- `src/index.ts` là điểm vào rỗng để `tsc` kiểm tra được ngay ở bước setup; public API thuộc dispatch sau.
- Lệnh setup: `npm install --save-dev typescript vitest @types/node` — thành công, 0 vulnerabilities.
- Mã lưu local: sẽ bổ sung sau commit setup.

## Item 1 — Launch URL / attach CDP

Chưa làm.

## Item 2 — Capture page

Chưa làm.

## Item 3 — Extract accessibility + DOM

Chưa làm.

## Sai khác với SPEC.md

Chưa có.

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

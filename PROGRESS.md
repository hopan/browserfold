# BrowserFold — tiến độ dispatch 1–5

Đã triển khai item 1–13 của mục 25 trong `SPEC.md`. Các ngưỡng chấp nhận ở mục 28 chưa đạt; chi tiết ở dispatch 5.

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

## Dispatch 3 — item 8–9

### Item 8 — Generate semantic IDs

Hoàn tất. Test: `tests/semantic/identity.test.ts`; code: `src/semantic/identity.ts`.

- Red: `npm test -- tests/semantic/identity.test.ts` — fail (exit 1), thiếu module `src/semantic/identity.js`, 0 test chạy.
- Green: cùng lệnh — pass, 1 file / 1 test với Chromium thật; hai lần capture cùng trang cho cùng ID, đổi trạng thái disabled vẫn giữ ID, các tham chiếu cha và quan hệ hợp lệ. `npm run typecheck` pass.
- Semantic ID là `e` + 10 ký tự đầu SHA-256 của fingerprint gồm frame, role/name, tag, thuộc tính định danh, tổ tiên và thứ tự trong nhóm anh em cùng fingerprint; khi trùng prefix hash sẽ kéo dài ID.
- Mã lưu local: `5bdf3b9` (`feat: generate deterministic semantic IDs`).

### Item 9 — Output compact text

Hoàn tất. Test: `tests/serialize/text.test.ts`; code: `src/serialize/text.ts`.

- Red: `npm test -- tests/serialize/text.test.ts` — fail (exit 1), thiếu module `src/serialize/text.js`, 0 test chạy.
- Green: cùng lệnh — pass, 1 file / 1 test với Chromium thật; hai capture cùng trang cho cùng output, bao gồm PAGE/UI, trạng thái control, hàng bảng và hành động đúng hàng, list/card, lọc nội dung ẩn và prose không liên quan. Trong vòng chỉnh sửa, test phát hiện tên nút bị lặp trong ô bảng; sửa serializer để ô chứa control không xuất thành dữ liệu.
- `npm run typecheck` pass.
- Mã lưu local: `fd1528f` (`feat: serialize compact semantic UI snapshots`).

## Kiểm tra cuối dispatch 3

- `npm test` — pass, 9 file / 10 test (dispatch 1+2+3), chạy toàn bộ một lần sau item 9.
- `npm run typecheck` — pass.
- `npm run build` — pass.

## Sai khác với SPEC.md — dispatch 3

- ID xuất ra dùng `e` + 10 ký tự hash hex thay vì số tăng dần `e1`, để cùng node giữ ID qua nhiều capture. Row/list item dùng prefix `r`/`item` với cùng hậu tố hash. Chưa có bản đồ ID riêng để resolve hành động (thuộc action interface ngoài MVP).
- Chưa có giới hạn số hàng, item hay ký tự trong serializer; giới hạn cấu hình và thông báo truncate thuộc phần yêu cầu rộng hơn, chưa có trong item 8–9 của MVP.

## Dispatch 4 — item 10–12

### Item 10 — Handle iframe

Hoàn tất iframe cùng origin. Test: `tests/semantic/frames.test.ts`; code: `src/extract/dom.ts`, `src/semantic/merger.ts`, `src/semantic/content.ts`, `src/serialize/text.ts`.

- Red: `npm test -- tests/semantic/frames.test.ts` — fail (1 test), không tìm thấy nút Pay trong iframe.
- Green: cùng lệnh — pass, 1 file / 1 test với Chromium thật và iframe `srcdoc` cùng origin. DOM trong `contentDocument` được mở rộng bằng `DOM.describeNode`, node con giữ `frameId` và ancestry qua iframe; text có `FRAME "Payment"`.
- Mã lưu local: `b82f707` (`feat: capture same-origin iframe content with frame context`). `npm run typecheck` pass.

### Item 11 — CLI

Hoàn tất. Test: `tests/cli/index.test.ts`; code: `src/cli/index.ts`, `package.json`.

- Red: `npm test -- tests/cli/index.test.ts` — fail (exit 1), thiếu module `src/cli/index.js`.
- Green: cùng lệnh — pass, 1 file / 1 test với Chromium thật; `capture URL` xuất text ra stdout, `-o` ghi file. CLI có đường CDP với `--page`, parser lỗi đầu vào rõ ràng và bin `browserfold`.
- Mã lưu local: `bd21bac` (`feat: add capture CLI for text snapshots`). `npm run typecheck` pass.

### Item 12 — JSON debug output

Hoàn tất. Test: `tests/serialize/json.test.ts`; code: `src/serialize/json.ts`, `src/cli/index.ts`.

- Red: `npm test -- tests/serialize/json.test.ts` — fail (1 test), CLI báo `JSON output is not yet available`.
- Green: cùng lệnh — pass, 1 file / 1 test với Chromium thật; `--format json` xuất page metadata, toàn bộ cây semantic node (kể cả node ẩn/không được giữ trong text compact), frame context, source và các quan hệ control/content.
- Mã lưu local: `6274e08` (`feat: expose full semantic tree as JSON debug output`). `npm run typecheck` pass.

## Kiểm tra cuối dispatch 4

- `npm test` — pass, 12 file / 13 test (dispatch 1+2+3+4), chạy toàn bộ một lần sau item 12.
- `npm run typecheck` — pass.
- `npm run build` — pass.

## Sai khác với SPEC.md — dispatch 4

- Nội dung iframe cross-origin chưa được bảo đảm: Chromium có thể đặt frame ở CDP target riêng và không cung cấp `contentDocument` qua session trang cha. Bước này chỉ xác nhận iframe cùng origin.
- CLI hiện hỗ trợ chế độ `automation` mặc định; `content`, `--geometry` và các giới hạn `--max-*` trong SPEC chưa có cơ chế tương ứng ở pipeline hiện tại, nên chưa nhận các option đó. `--format json` thuộc item 12.

## Item 13 — Đo tiêu chí chấp nhận MVP

Hoàn tất bộ đo ở `tests/acceptance.test.ts` với hai fixture HTML cố định: `tests/fixtures/acceptance-login.html` và `tests/fixtures/acceptance-management.html`. Mỗi phép đo mở trang bằng `launchUrl`, lấy DOM Chromium thật bằng `page.content()`, chạy `capturePage` → `mergeSemanticNodes` → `generateSemanticIds` → `buildContentStructure` → `serializeText`. Không dùng mock. Fixture quản lý có bảng 8 hàng, list, filter, phân trang, status/alert, văn bản dài và cả các trường hợp dễ gắn nhầm `interactive`.

- TDD red: `npm test -- tests/acceptance.test.ts` lần đầu exit 1 vì text thiếu `Page 1 of 6`. Chuyển các assertion độc lập sang `expect.soft` để in đầy đủ số đo ngay cả khi một tiêu chí lỗi; không đổi fixture, ngưỡng, oracle hay cách tính để làm test pass. Lần chạy tiếp exit 1 với 4 assertion thất bại (phân trang, token ratio, recall, precision); determinism pass.
- Đếm token bằng regex Unicode `/[\p{L}\p{N}_]+|[^\s]/gu` áp dụng giống nhau cho HTML DOM do `page.content()` trả về và Semantic UI Snapshot text. Đây là phép xấp xỉ ổn định, đếm cả cú pháp markup và dấu câu, không phải số token của một model cụ thể. Mẫu số là HTML/DOM gốc thực tế sau Chromium parse, không phải URL `data:` hay JSON debug. Tỷ lệ tổng được tính `Σ token snapshot / Σ token DOM` trên hai trang; cũng báo từng trang.
- Ngưỡng nguyên văn trong SPEC.md mục 28: `semantic snapshot <= 10% of raw DOM token count`; `Stretch target: <= 5%`. Đo được login **112/546 = 20,51%**, quản lý **418/1596 = 26,19%**, tổng **530/2142 = 24,74%**. **Không đạt** ngưỡng MVP 10% và mốc mở rộng 5%. Snapshot vẫn chứa ID hash dài, dòng URL và một dòng mỗi hành động/hàng; `src/serialize/text.ts` là nơi trực tiếp quyết định chi phí này. Fixture chỉ gồm hai trang nên số đo là baseline hữu hạn, chưa phải benchmark 90 trang ở mục 29.
- Ngưỡng nguyên văn: `>= 95% of visible actionable controls represented`. Oracle là danh sách ID của 25 control thực sự khả dụng trên hai fixture, gồm cả ba `<option>` của select; mỗi control chỉ được tính là có mặt khi node đúng ID được đánh dấu visible/interactive và semantic ID của nó thực sự có trong text. Đo được **22/25 = 88%**, **không đạt**. Thiếu `status-all`, `status-open`, `status-closed`: `src/serialize/text.ts` xuất combobox và giá trị hiện tại nhưng không xuất từng option. Đây là recall của control khả dụng trong snapshot text, không phải recall của mọi DOM node.
- Ngưỡng nguyên văn: `False interactive elements: < 5%`. Mẫu số là toàn bộ node visible được `mergeSemanticNodes` đánh dấu `interactive: true`; false positive là node không thuộc oracle control khả dụng. Đo được **4/29 = 13,79% false interactive**, tương ứng **25/29 = 86,21% precision**, **không đạt**. Bốn node là nút disabled `unavailable`, thẻ `a` không `href` `empty-anchor`, `role=button` không handler `fake-button`, và phần trang trí có `tabindex=0` `focus-decoration`. `src/semantic/interactive.ts` hiện dùng role/tag/tabindex mà chưa xét khả dụng hoặc handler thực tế. Định nghĩa precision này theo mục 29 (`% captured controls actually actionable`), không dùng false-positive rate trên toàn bộ DOM.
- SPEC.md chỉ ghi `Two snapshots of an unchanged page should produce semantically identical output`, **không định lượng số lần hay một tỷ lệ pass cụ thể**. Test chạy **3 capture** liên tiếp trên cùng trang quản lý không đổi, so sánh toàn bộ text và danh sách semantic ID theo đúng thứ tự: **3/3 giống hệt**, đạt yêu cầu hai snapshot giống nhau.
- Tiêu chí chức năng mục 28: trang login giữ email, password, submit, checkbox, validation error và link. Trang quản lý giữ bảng/hàng/header, giá trị filter, list, status/alert và quan hệ hành động theo hàng; các mục này **đạt** trên fixture. Riêng trạng thái phân trang `Page 1 of 6` bị mất dù link Previous/Next còn: **không đạt** phần pagination state. Nội dung span này bị `extractVisibleContent` lọc trước khi `serializeText` chạy. Không dùng screenshot.
- SPEC.md mục 29 nêu corpus 90 trang và các metric latency, ID stability qua state, test success rate nhưng **không định lượng ngưỡng chấp nhận MVP** cho các metric đó. Bộ đo hiện chỉ bao phủ hai fixture đại diện; chưa thể suy rộng số liệu thành chất lượng trên toàn bộ corpus. Các metric cần agent thực thi hành động hoặc nhiều trạng thái trang nằm ngoài item 13 và không được bịa ngưỡng.

## MVP HOÀN TẤT — tổng kết

| Item mục 25 | Trạng thái |
|---|---|
| 1. Launch URL / attach CDP | Đã triển khai, test pass; chọn tab CDP theo heuristic đã ghi |
| 2. Capture current page | Đã triển khai, test pass |
| 3. Extract accessibility + DOM | Đã triển khai, test pass |
| 4. Detect visible interactive elements | Đã triển khai; phép đo precision chưa đạt |
| 5. Extract visible automation content | Đã triển khai; pagination state còn thiếu |
| 6. Preserve table/list/card structure | Đã triển khai, test pass |
| 7. Preserve control/content relationships | Đã triển khai, test pass |
| 8. Generate semantic IDs | Đã triển khai; test determinism 3 lần pass |
| 9. Output compact text | Đã triển khai; token ratio và recall chưa đạt |
| 10. Handle iframe | Đã triển khai cho iframe cùng origin; cross-origin chưa bảo đảm |
| 11. CLI | Đã triển khai cho chế độ automation; các option còn thiếu đã ghi ở dispatch 4 |
| 12. JSON debug output | Đã triển khai, test pass |
| 13. Automated acceptance measurements | Đã hoàn tất; các assertion thất bại phản ánh số đo thực tế |

13 item đã có implementation hoặc bộ test đo tương ứng. **MVP chưa được chấp nhận theo mục 28 của SPEC.md** vì token ratio, actionable recall, interactive precision và pagination state không đạt. Không hạ ngưỡng hoặc sửa oracle để che kết quả.

## Kiểm tra cuối dispatch 5

- `npm test` — exit 1: 13 file / 15 test, **12 file pass**, 1 file acceptance có 1 test đo fail với 4 assertion (pagination state, ratio, recall, precision), test determinism pass. Các số đo lặp lại đúng baseline ở trên.
- `npm run typecheck` — pass.
- `npm run build` — pass.
- `git diff --check` — pass.

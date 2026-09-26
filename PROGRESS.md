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

## Dispatch 6 — fix gap 2/3/4

Sửa theo thứ tự Gap 4 → Gap 2 → Gap 3. Trước mỗi sửa đổi, chạy lại `npm test -- tests/acceptance.test.ts` để xác nhận assertion tương ứng vẫn đỏ; sau mỗi sửa đổi, chạy lại acceptance và toàn bộ `npm test`. Không đổi fixture, oracle, ngưỡng hay assertion acceptance.

| Tiêu chí | Trước dispatch 6 | Sau Gap 4 | Sau Gap 2 | Sau Gap 3 | Ngưỡng SPEC |
|---|---:|---:|---:|---:|---|
| Pagination state `Page 1 of 6` | Thiếu | Có | Có | Có | Giữ được — **đạt** |
| Recall actionable | 22/25 = 88% | 22/25 = 88% | 25/25 = 100% | 25/25 = 100% | ≥95% — **đạt** |
| False interactive / precision | 4/29 = 13,79% / 86,21% | 4/29 = 13,79% / 86,21% | 4/29 = 13,79% / 86,21% | 0/25 = 0% / 100% | False interactive <5% — **đạt** |

- Gap 4: giữ text ngắn có pattern phân trang hoặc nằm trong navigation, rồi in `text:` trong snapshot. Red thiếu `Page 1 of 6`; Green assertion này pass. Bộ test cũ gồm 12 file pass; acceptance còn 3 assertion fail ở các gap chưa sửa. Commit local `2704706` (`fix: preserve pagination text in serialized output`).
- Gap 2: in tối đa 25 option hiển thị của combobox/listbox kèm thông báo khi bị cắt, áp dụng ở control thường, table và item/card. Red thiếu 3 option; Green recall 25/25. Bộ test cũ pass; acceptance còn 2 assertion fail. Commit local `e0036cf` (`fix: include combobox options in text snapshots`).
- Gap 3: tách control candidate dùng để giữ `name`/semantic ID khỏi actionable `interactive`; đọc `cursor` từ computed style đã lấy, loại disabled và false control, vẫn in disabled control kèm ID trong text. Red false interactive 4/29; Green 0/25. **Quyết định đã chốt:** dùng `aria-label`/`aria-labelledby` trong heuristic intent để tương thích `interactive.test.ts`, chấp nhận khả năng bỏ sót widget thật dùng event delegation mà không gắn aria-label. `identity.test.ts` xác nhận ID ổn định khi toggle disabled. Bộ test cũ pass; acceptance còn duy nhất assertion token ratio của Gap 1 fail.
- Gap 1 không được sửa. Số đo baseline ở Item 13 giữ nguyên: login 112/546 = 20,51%, quản lý 418/1596 = 26,19%, tổng 530/2142 = 24,74%. **Ảnh hưởng phụ** của ba fix lên token ratio đo lại: login 112/546 = 20,51%, quản lý 420/1596 = 26,32%, tổng 532/2142 = 24,84%. Vẫn **không đạt** ngưỡng ≤10% của SPEC; không đổi logic đo hay tối ưu token trong dispatch này.
- Kiểm tra cuối: `npm test` có 12 file / 13 test pass và 1 file acceptance có determinism pass, phép đo fail duy nhất ở token ratio; `npm run typecheck` pass. Pagination, recall và precision đều đạt ngưỡng trên hai fixture hiện có; chưa suy rộng sang corpus 90 trang.

## Dispatch 7 — pilot corpus trang thật (token ratio)

Chạy script thủ công `corpus/measure.mjs` trên 23 URL công khai, ngoài `tests/` và không thuộc `npm test`. Có 17 URL trả số đo; 16 mẫu đạt tiêu chí đại diện ở cả tám nhóm SPEC mục 29, một tutorial Lit chỉ có custom tag không render shadow root được ghi nhưng loại khỏi tổng, sáu URL lỗi được ghi đầy đủ. Mỗi phép đo dùng `page.content()` sau render và cùng regex token của acceptance, trên cùng page với pipeline capture → merge → ID → structure → serialize. Không click, nhập liệu hoặc submit.

- Tổng 16 mẫu: **30.739/1.353.732 = 2,27%**; trung bình cộng tỷ lệ từng trang: **5,02%**. Theo tổng token đạt ngưỡng MVP ≤10% và stretch ≤5%; theo trung bình trang đạt MVP nhưng vượt stretch khoảng 0,02 điểm %. Ba trang riêng vượt 10%.
- Baseline fixture hiện hành sau dispatch 6: **532/2.142 = 24,84%**. Pilot thấp hơn đáng kể, nhưng DOM lớn chứa framework/script làm tỷ lệ theo tổng token nhỏ; chưa đo recall/precision trên oracle trang thật và chưa thể suy rộng sang corpus 100 trang.
- Pipeline được sửa để giới hạn truy vấn style/box CDP đồng thời ở 24 và giữ khóa tổ tiên semantic ID bằng hash độ dài cố định. Trước sửa, trang thật DOM lớn có thể làm Node hết bộ nhớ. `npm run build` và `tests/extract/accessibility.test.ts`, `tests/semantic/identity.test.ts` pass; acceptance vẫn fail duy nhất ở ngưỡng token fixture 10%, với số đo 24,84%.

Bảng từng URL, lỗi, cách đo và giới hạn: [`CORPUS_REPORT.md`](CORPUS_REPORT.md). Dữ liệu máy đọc được: `corpus/results.json`.

## Dispatch 8 — corpus batch 2

Mở rộng `corpus/measure.mjs` bằng **20 URL mới** (4 iframe, 4 custom component/Web Component, 3 dashboard, 3 ecommerce, 3 enterprise form, 3 modal/dropdown), không trùng 23 URL batch 1. Chạy `npm run build && node corpus/measure.mjs --from 23`; script dùng lại toàn bộ pipeline, timeout và phép đếm token của dispatch 7, giữ nguyên 23 dòng batch 1 rồi nối kết quả batch 2 vào `corpus/results.json`. URL form Test Pages ban đầu sai trả 404, đã sửa sang đường dẫn hợp lệ và đo lại. Chỉ load và đọc trang, không click, nhập liệu hoặc gửi form.

- Batch 2: **20 URL thử, 19 đo được và đạt tiêu chí nhóm, 1 lỗi CDP** ở W3Schools iframe; không gán token ratio cho lỗi. Kiểm tra DOM sau render xác nhận ba trang iframe Test Pages có 2/2/1 iframe và bốn trang Web Component có shadow root (1/2/1/74). Không thử vượt bot detection.
- Tích luỹ batch 1 + 2: **43 URL riêng biệt**, 36 trả số đo; loại một Lit tutorial batch 1 chưa render shadow root, còn **35 mẫu** tính tổng. Theo tổng token **61.835/2.259.702 = 2,74%**; trung bình tỷ lệ từng trang **5,12%**. Cả hai đạt MVP ≤10%; tổng token đạt stretch ≤5%, trung bình trang vượt stretch khoảng 0,12 điểm %. Bảy trang riêng vượt 10%.
- Tiến độ tính cả lỗi và mẫu bị loại: Simple **4/20**, SPA **4/20**, Dashboard **5/10**, Ecommerce **6/10**, Enterprise form **5/10**, Modal/dropdown **5/10**, Iframe **6/10**, Custom component **8/10**. Bối cảnh đầu dispatch ghi SPA 3/20 và Custom component 3/10, nhưng mỗi nhóm đã có 4 URL trong `results.json` batch 1; bảng tiến độ dùng dữ liệu thô thực tế.
- Giới hạn giữ nguyên: DOM `page.content()` không gồm nội dung iframe/shadow DOM; modal, popover và dropdown được đọc ở trạng thái đóng; form là demo công khai. Bảng từng URL, lỗi và diễn giải số đo: [`CORPUS_REPORT.md`](CORPUS_REPORT.md).

## Dispatch 9 — corpus batch 3

Thêm **22 URL mới** vào `corpus/measure.mjs`: 10 Simple và 12 SPA/JS-heavy, không trùng 43 URL cũ. Chạy `npm run build`, rồi `node corpus/measure.mjs --from 43` cho 20 URL đầu; sau hai lỗi, thêm hai URL SPA thay thế và chạy `--from 63`. Script giữ nguyên dữ liệu batch 1+2 và dấu thời gian batch 2, nối kết quả batch 3 vào `corpus/results.json`. Chỉ load và đọc trang; không click, nhập liệu, gửi form hay thử vượt bot detection.

- Batch 3: **22 URL thử, 20 đo được và tính tổng, 2 lỗi**. Next.js Showcase trả HTTP 403; developer.chrome.com gặp lỗi CDP `DOM.describeNode`. Hai URL thay thế trên GitHub và Angular đều đo được. Batch 3 riêng: **107.871/3.639.975 = 2,96%** theo tổng token; **5,72%** trung bình trang.
- Tích luỹ batch 1+2+3: **65 URL riêng biệt**, 56 trả số đo, loại một tutorial Lit chưa render shadow root, còn **55 mẫu** tính tổng. Theo tổng token **169.706/5.899.677 = 2,88%**; trung bình tỷ lệ từng trang **5,34%**. Cả hai đạt MVP ≤10%; tổng token đạt stretch ≤5%, trung bình trang vượt stretch khoảng 0,34 điểm %. Có 12 mẫu riêng vượt 10%, gồm 5 Simple của batch 3.
- Tiến độ tính cả URL lỗi: Simple **14/20**, SPA **16/20**; các nhóm còn lại giữ nguyên. Các trang tài liệu và ứng dụng canvas có thể cho tỷ lệ thấp vì DOM lớn hoặc snapshot ngắn; phép đo token không xác nhận độ đầy đủ semantic. Bảng từng URL và giới hạn diễn giải: [`CORPUS_REPORT.md`](CORPUS_REPORT.md).

## Dispatch 10 — corpus batch 4

Thêm **22 URL mới** vào `corpus/measure.mjs`: 4 Dashboard, 3 Ecommerce, 4 Enterprise form, 4 Modal/dropdown, 5 Iframe, 2 Custom component. Chạy `npm run build`, `node corpus/measure.mjs --from 65`, rồi thêm hai URL iframe hợp lệ và chạy `--from 85`. Script giữ nguyên 65 dòng batch 1–3, nối batch 4 vào `corpus/results.json` và ghi `batch4MeasuredAt`. Không click, nhập liệu hoặc gửi form.

- Batch 4: **22 URL thử, 21 đo được**, một W3Schools iframe lỗi CDP; trang chỉ mục Embedded Content đo được nhưng không chứa iframe, được gắn `excludedReason` và loại khỏi tổng. **20 mẫu** phù hợp được tính; hai trang Material Web có 52 và 49 shadow root, ba trang iframe hợp lệ có 6/4/1 frame sau render.
- Batch 4 riêng: **32.324/779.635 = 4,15%** theo tổng token, **5,51%** trung bình trang. Tích luỹ bốn batch: **87 URL riêng biệt**, 77 trả số đo, 75 mẫu tính tổng; **202.030/6.679.312 = 3,02%** theo tổng token và **5,39%** trung bình trang. Có **16/75** mẫu riêng vượt 10%.
- Token ratio tích luỹ **đạt ngưỡng MVP ≤10%** ở cả hai phép tổng hợp; stretch ≤5% chỉ đạt theo tổng token. **Corpus mục 29 chưa đạt 100 trang** và baseline fixture **24,84%** vẫn vượt 10%, nên **chấp nhận MVP tổng thể theo mục 28 không đạt**. Chưa có oracle recall/precision trên trang thật; modal/menu chỉ ở trạng thái mặc định. Bảng từng URL, tiến độ nhóm và tổng kết ở [`CORPUS_REPORT.md`](CORPUS_REPORT.md).

## Dispatch 11 — corpus batch 5 (cuối)

Thêm **16 URL mới** vào `corpus/measure.mjs`: 7 Simple, 5 SPA, và một URL cho mỗi nhóm Dashboard, Ecommerce, Enterprise form, Modal/dropdown. Chạy `npm run build`, `node corpus/measure.mjs --from 87`, sau đó thêm hai URL thay thế cho GNU hết thời gian tải và Gradio lỗi CDP rồi chạy `--from 101`. Script giữ nguyên 87 dòng batch 1–4, nối batch 5 vào `corpus/results.json` và ghi `batch5MeasuredAt`. Chỉ tải và đọc trang; không click, nhập liệu, gửi form hoặc thử vượt chặn.

- Batch 5: **16 URL thử, 14 đo được và tính tổng, 2 lỗi**. Riêng batch 5: **71.886/1.350.319 = 5,32%** theo tổng token và **5,34%** trung bình tỷ lệ từng trang; ba mẫu riêng vượt 10%.
- Tích luỹ năm batch: **103 URL riêng biệt đã thử**, đủ hoặc vượt mục tiêu URL ở cả tám nhóm; **91** trả số đo, loại hai mẫu không phù hợp, còn **89 mẫu** tính tổng. Theo tổng token **273.916/8.029.631 = 3,41%**; trung bình tỷ lệ từng trang **5,38%**; **19/89** mẫu riêng vượt 10%.
- Corpus **hoàn tất chỉ tiêu 100 URL đã thử theo nhóm**, nhưng chưa có 100 mẫu đo được và chưa đo các metric khác của SPEC mục 29. Token ratio tích luỹ đạt MVP ≤10% theo cả hai phép tổng hợp; stretch ≤5% chỉ đạt theo tổng token. Baseline fixture vẫn **24,84%**, nên **MVP tổng thể chưa được chấp nhận**. Bảng từng URL, tiến độ và kết luận cuối ở [`CORPUS_REPORT.md`](CORPUS_REPORT.md).

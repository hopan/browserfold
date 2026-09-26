# Corpus trang thật — dispatch 7–11: token ratio

Đo ngày **2026-09-26** trên Chromium/Playwright, không click, nhập liệu hoặc gửi form. Đây là corpus thủ công theo [SPEC.md](SPEC.md) mục 28–29, không phải test CI. Năm batch đã thử **103 URL công khai riêng biệt**; **91** trả về phép đo, trong đó **89** là mẫu đạt tiêu chí đại diện; **12** lỗi và **2** mẫu đo được nhưng không phù hợp nhóm. Số URL đã thử đạt hoặc vượt mục tiêu ở cả tám nhóm của mục 29. Dữ liệu thô, gồm URL lỗi, ở [`corpus/results.json`](../corpus/results.json); script chạy lại ở [`corpus/measure.mjs`](../corpus/measure.mjs).

## Cách đo

Chạy `npm run build && node corpus/measure.mjs`. Mỗi URL mở trong tiến trình Chromium/Node riêng; đợi `domcontentloaded` và thêm 1,2 giây cho JS render. Trên **cùng page**, lấy `page.content()` trước, rồi chạy `capturePage → mergeSemanticNodes → generateSemanticIds → buildContentStructure → serializeText`. Cả hai chuỗi được đếm bằng đúng regex của `tests/acceptance.test.ts`: `/[\p{L}\p{N}_]+|[^\s]/gu`. Tỷ lệ = token snapshot / token DOM. Đây là phép xấp xỉ token ổn định, không phải tokenizer của một model. Mỗi URL có giới hạn navigation 30 giây, đo 45 giây và tiến trình con 55 giây; giới hạn heap 768 MB để lỗi một trang không làm mất các phép đo khác.

`page.content()` là HTML của **main frame** sau render, gồm markup/script/style đang trong DOM; nó không tuần tự hóa shadow DOM hoặc nội dung iframe vào mẫu số. Snapshot có thể đọc một phần iframe/shadow DOM qua CDP/AX. Do đó tỷ lệ đo đúng theo baseline fixture nhưng không chứng minh độ đầy đủ semantic hoặc chi phí token khi đưa toàn bộ frame/shadow DOM vào mẫu số.

## Kết quả từng URL — batch 1 (dispatch 7)

| Nhóm SPEC | URL | Snapshot tokens | DOM tokens | Tỷ lệ | Trạng thái |
|---|---|---:|---:|---:|---|
| Simple | https://example.com/ | 35 | 215 | 16,28% | Đạt mẫu |
| Simple | https://en.wikipedia.org/wiki/HTML | 11.330 | 409.236 | 2,77% | Đạt mẫu |
| Simple | https://www.paulgraham.com/startupideas.html | 399 | 13.704 | 2,91% | Đạt mẫu |
| Simple | https://motherfuckingwebsite.com/ | 222 | 1.325 | 16,75% | Đạt mẫu |
| SPA | https://github.com/microsoft/playwright | 4.781 | 177.853 | 2,69% | Đạt mẫu |
| SPA | https://vuejs.org/examples/#hello-world | 476 | 46.359 | 1,03% | Đạt mẫu |
| SPA | https://react.dev/learn | — | — | — | HTTP 403 |
| Dashboard | https://adminlte.io/themes/v3/index.html | 1.060 | 62.559 | 1,69% | Đạt mẫu |
| Dashboard | https://preview.tabler.io/ | 1.453 | 335.836 | 0,43% | Đạt mẫu |
| Ecommerce | https://demowebshop.tricentis.com/build-your-own-computer | 1.255 | 10.757 | 11,67% | Đạt mẫu |
| Ecommerce | https://magento.softwaretestingboard.com/gear/bags.html | — | — | — | HTTP 526 |
| Enterprise form | https://getbootstrap.com/docs/5.3/examples/checkout/ | 394 | 5.362 | 7,35% | Đạt mẫu; checkout demo |
| Enterprise form | https://demoqa.com/automation-practice-form | 228 | 17.571 | 1,30% | Đạt mẫu; practice form |
| Modal/dropdown | https://getbootstrap.com/docs/5.3/components/modal/ | 3.658 | 80.866 | 4,52% | Đạt mẫu; modal đóng khi đọc |
| Modal/dropdown | https://getbootstrap.com/docs/5.3/components/dropdowns/ | 4.335 | 150.391 | 2,88% | Đạt mẫu; dropdown đóng khi đọc |
| Iframe | https://the-internet.herokuapp.com/iframe | 205 | 5.977 | 3,43% | Đạt mẫu; 1 iframe |
| Iframe | https://the-internet.herokuapp.com/nested_frames | — | — | — | Lỗi `DOM.describeNode`: không tìm thấy node ID |
| Custom component | https://shoelace.style/components/input | — | — | — | HTTP 403 |
| Custom component | https://shoelace.style/components/dialog | — | — | — | HTTP 403 |
| SPA | https://svelte.dev/repl/hello-world | — | — | — | HTTP 403 |
| Ecommerce | https://www.demoblaze.com/prod.html?idp_=1 | 188 | 13.243 | 1,42% | Đạt mẫu; product demo |
| Custom component | https://lit.dev/tutorials/content/intro-to-lit/00/ | 34 | 929 | 3,66% | **Không tính tổng**: trang tutorial chỉ có một custom tag, không có shadow root đã render |
| Custom component | https://lit.dev/playground/ | 720 | 22.478 | 3,20% | Đạt mẫu; kiểm tra thấy 38 custom elements, 37 shadow roots |

Hai trang Bootstrap minh họa modal/dropdown trong trạng thái mặc định; giới hạn chỉ đọc trang khiến pilot này **chưa đo trạng thái mở**. Nhóm enterprise form dùng các form demo công khai, chưa đại diện phần mềm doanh nghiệp cần đăng nhập. Với Lit tutorial, phép đếm có thật nhưng nội dung chưa phải một custom component đã render, nên giữ số trong bảng và loại khỏi cả hai phép tổng hợp. Kiểm tra thủ công bằng DOM cho thấy DemoQA có form đăng ký hiển thị và Demoblaze có chi tiết sản phẩm; snapshot ngắn của hai trang này không phải trang trống.

## Tổng hợp lịch sử batch 1 — 16 mẫu đạt tiêu chí

| Phép tổng hợp | Công thức | Kết quả | So với SPEC mục 28 |
|---|---|---:|---|
| Theo tổng token | 30.739 / 1.353.732 | **2,27%** | Đạt ≤10% và stretch ≤5% |
| Trung bình tỷ lệ từng trang | Σ 16 tỷ lệ / 16 | **5,02%** | Đạt ≤10%; vượt stretch ≤5% khoảng 0,02 điểm % |

Baseline hai fixture trên HEAD `ad865b1`, đo lại bằng `npm test -- tests/acceptance.test.ts`, là **532/2.142 = 24,84%** (login 112/546; management 420/1596). [PROGRESS.md](PROGRESS.md) ghi 24,74% ở phép đo trước dispatch 6; sau ba fix ở dispatch 6, baseline hiện hành là 24,84%. So với baseline hiện hành, pilot thấp hơn **22,57 điểm %** theo tổng token và **19,82 điểm %** theo trung bình trang. Ba mẫu riêng vẫn vượt 10%: example.com, motherfuckingwebsite.com và sản phẩm Demo Web Shop.

## URL lỗi và giới hạn diễn giải

- `https://react.dev/learn`, `https://shoelace.style/components/input`, `https://shoelace.style/components/dialog`, `https://svelte.dev/repl/hello-world`: HTTP 403; không thử vượt chặn.
- `https://magento.softwaretestingboard.com/gear/bags.html`: HTTP 526.
- `https://the-internet.herokuapp.com/nested_frames`: CDP `DOM.describeNode` báo không tìm thấy node ID khi mở rộng nested frame.

Không URL lỗi nào có token ratio giả định hoặc được tính vào tổng. Trước phép đo cuối, DOM sâu của Wikipedia/GitHub làm `generateSemanticIds` tạo khóa tổ tiên quá lớn và các truy vấn style đồng thời làm tăng bộ nhớ. Dispatch này giới hạn truy vấn CDP đồng thời và hash khóa tổ tiên có độ dài cố định; cùng script sau sửa đã đo được cả hai trang. Đây là sửa lỗi pipeline, không phải thay đổi công thức token.

**Kết luận batch 1:** Trên 16 trang thật được chọn, tỷ lệ token thấp hơn đáng kể so với hai fixture nhỏ và theo tổng token đã đạt cả mốc 10% lẫn 5%. Trung bình trang vừa trên mốc stretch, và ba trang riêng vẫn không đạt 10%. DOM framework/script lớn ở Wikipedia, GitHub và Tabler kéo mạnh tỷ lệ theo tổng token xuống thấp; vì vậy không thể suy ra mọi trang sẽ đạt ngưỡng. Pilot chưa đo recall/precision bằng oracle trên trang thật, chưa đo modal mở, và chưa thay thế corpus 100 trang hoặc đánh giá độ đầy đủ của snapshot.

## Kết quả từng URL — batch 2 (dispatch 8)

Batch 2 thử **20 URL mới**, không trùng bất kỳ URL nào trong batch 1; **19** trang đo được và đạt tiêu chí nhóm, **1** lỗi. Cột trạng thái “Đạt mẫu” nghĩa là trang phù hợp để tính token ratio theo nhóm, không có nghĩa tỷ lệ của trang đạt ngưỡng 10%. Các trang Test Pages có menu điều hướng lớn trong DOM; các trang Web Component được kiểm tra sau render và có shadow root (ba trang Test Pages: mỗi trang ít nhất một; Material Web Buttons: 74). Ba trang iframe của Test Pages lần lượt có 2, 2 và 1 iframe trong DOM. Đường dẫn form Test Pages ban đầu sai và trả 404; đã sửa sang URL hợp lệ rồi đo, nên bảng chỉ ghi URL mới thực sự được chọn cho batch.

| Nhóm SPEC | URL | Snapshot tokens | DOM tokens | Tỷ lệ | Trạng thái |
|---|---|---:|---:|---:|---|
| Iframe | https://testpages.eviltester.com/pages/embedded-pages/iframes/ | 1.786 | 62.205 | 2,87% | Đạt mẫu; 2 iframe |
| Iframe | https://testpages.eviltester.com/pages/embedded-pages/external-content/ | 1.142 | 62.470 | 1,83% | Đạt mẫu; 2 iframe |
| Iframe | https://testpages.eviltester.com/pages/embedded-pages/external-sites/ | 1.124 | 62.739 | 1,79% | Đạt mẫu; 1 iframe |
| Iframe | https://www.w3schools.com/html/tryit.asp?filename=tryhtml_iframe | — | — | — | Lỗi `DOM.describeNode`: không tìm thấy node ID |
| Custom component | https://testpages.eviltester.com/pages/web-components/shadow-dom-style/ | 1.038 | 62.329 | 1,67% | Đạt mẫu; 1 shadow root |
| Custom component | https://testpages.eviltester.com/pages/web-components/shadow-web-component/ | 1.032 | 62.332 | 1,66% | Đạt mẫu; 2 shadow roots |
| Custom component | https://testpages.eviltester.com/pages/web-components/shadow-widget/ | 1.021 | 62.417 | 1,64% | Đạt mẫu; 1 shadow root |
| Custom component | https://material-web.dev/components/button/ | 3.116 | 24.267 | 12,84% | Đạt mẫu; 74 shadow roots |
| Dashboard | https://adminlte.io/themes/v3/index2.html | 1.123 | 51.365 | 2,19% | Đạt mẫu |
| Dashboard | https://adminlte.io/themes/v3/index3.html | 676 | 17.101 | 3,95% | Đạt mẫu |
| Dashboard | https://laravel.adminlte.io/demo/dashboard-v2 | 1.221 | 66.588 | 1,83% | Đạt mẫu |
| Ecommerce | https://demowebshop.tricentis.com/books | 950 | 8.251 | 11,51% | Đạt mẫu |
| Ecommerce | https://demowebshop.tricentis.com/digital-downloads | 839 | 7.045 | 11,91% | Đạt mẫu |
| Ecommerce | https://demowebshop.tricentis.com/apparel-shoes | 1.055 | 8.942 | 11,80% | Đạt mẫu |
| Enterprise form | https://adminlte.io/themes/v3/pages/forms/general.html | 1.925 | 21.301 | 9,04% | Đạt mẫu; form demo |
| Enterprise form | https://adminlte.io/themes/v3/pages/forms/advanced.html | 1.398 | 28.133 | 4,97% | Đạt mẫu; form demo |
| Enterprise form | https://testpages.eviltester.com/apps/client-server-form-validation/ | 1.325 | 65.738 | 2,02% | Đạt mẫu; validation demo |
| Modal/dropdown | https://getbootstrap.com/docs/5.3/components/offcanvas/ | 2.999 | 63.616 | 4,71% | Đạt mẫu; offcanvas đóng |
| Modal/dropdown | https://getbootstrap.com/docs/5.3/components/popovers/ | 3.709 | 47.696 | 7,78% | Đạt mẫu; popover đóng |
| Modal/dropdown | https://getbootstrap.com/docs/5.3/components/navs-tabs/ | 3.617 | 121.435 | 2,98% | Đạt mẫu; dropdown đóng |

## Tổng hợp tích luỹ batch 1 + 2 — 35 mẫu đạt tiêu chí

Giữ nguyên 23 dòng batch 1, thêm 20 dòng batch 2. Trong 36 trang trả số đo, tutorial Lit batch 1 vẫn bị loại khỏi cả hai phép tổng hợp vì custom tag chưa render shadow root. Không tính 7 URL lỗi. Batch 2 riêng có 31.096/905.970 = **3,43%** theo tổng token và **5,21%** trung bình trang; bảng dưới đây tính trên **cả hai batch**.

| Phép tổng hợp | Công thức | Kết quả | So với SPEC mục 28 |
|---|---|---:|---|
| Theo tổng token | 61.835 / 2.259.702 | **2,74%** | Đạt ≤10% và stretch ≤5% |
| Trung bình tỷ lệ từng trang | Σ 35 tỷ lệ / 35 | **5,12%** | Đạt ≤10%; vượt stretch ≤5% khoảng 0,12 điểm % |

So với baseline fixture hiện hành **532/2.142 = 24,84%**, corpus tích luỹ thấp hơn **22,10 điểm %** theo tổng token và **19,72 điểm %** theo trung bình trang. Bảy mẫu riêng vượt 10%: ba mẫu batch 1 đã nêu ở trên, Material Web Buttons và ba danh mục Demo Web Shop của batch 2. Mẫu số `page.content()` không gồm nội dung iframe/shadow DOM; tỷ lệ thấp ở các trang Test Pages còn chịu ảnh hưởng từ menu/markup dùng chung lớn. Đây vẫn chỉ là token ratio, chưa phải phép đánh giá độ đầy đủ nội dung, recall/precision hay trạng thái modal/dropdown mở.

## Kết quả từng URL — batch 3 (dispatch 9)

Batch 3 thử **22 URL mới**: 10 Simple và 12 SPA. **20** trang đo được và được tính tổng; 2 URL SPA lỗi được giữ trong dữ liệu. Hai trang thay thế được thêm sau khi Next.js Showcase trả 403 và developer.chrome.com gặp lỗi CDP; không thử vượt chặn hoặc tương tác với trang. Danh sách Simple gồm bài bách khoa, bảng dân số, tin, tài liệu kỹ thuật và blog. SPA gồm giao diện repo/issues, trang tài liệu nhiều JS và hai ứng dụng canvas. “Đạt mẫu” ở đây xác nhận trang tải và pipeline đo được, không xác nhận snapshot giữ đủ nội dung hoặc tỷ lệ riêng đạt 10%.

| Nhóm SPEC | URL | Snapshot tokens | DOM tokens | Tỷ lệ | Trạng thái |
|---|---|---:|---:|---:|---|
| Simple | https://en.wikipedia.org/wiki/Alan_Turing | 20.878 | 640.993 | 3,26% | Đạt mẫu |
| Simple | https://en.wikipedia.org/wiki/Photosynthesis | 20.432 | 460.131 | 4,44% | Đạt mẫu |
| Simple | https://en.wikipedia.org/wiki/List_of_countries_by_population_(United_Nations) | 13.768 | 422.971 | 3,26% | Đạt mẫu |
| Simple | https://news.ycombinator.com/ | 4.268 | 14.563 | 29,31% | Đạt mẫu |
| Simple | https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table | 6.640 | 47.321 | 14,03% | Đạt mẫu |
| Simple | https://www.gnu.org/philosophy/free-sw.html | 2.058 | 15.409 | 13,36% | Đạt mẫu |
| Simple | https://www.w3.org/TR/WCAG22/ | 19.742 | 159.829 | 12,35% | Đạt mẫu |
| Simple | https://www.rfc-editor.org/rfc/rfc8259.html | 1.494 | 10.344 | 14,44% | Đạt mẫu |
| Simple | https://www.paulgraham.com/greatwork.html | 444 | 20.292 | 2,19% | Đạt mẫu |
| Simple | https://www.sqlite.org/lang_select.html | 2.041 | 979.007 | 0,21% | Đạt mẫu |
| SPA | https://github.com/vercel/next.js/issues | 2.545 | 134.610 | 1,89% | Đạt mẫu |
| SPA | https://github.com/vuejs/core | 2.662 | 130.670 | 2,04% | Đạt mẫu |
| SPA | https://gitlab.com/gitlab-org/gitlab | 3.368 | 102.654 | 3,28% | Đạt mẫu |
| SPA | https://vuejs.org/guide/introduction.html | 1.518 | 56.104 | 2,71% | Đạt mẫu |
| SPA | https://angular.dev/tutorials/learn-angular | 402 | 57.791 | 0,70% | Đạt mẫu |
| SPA | https://app.diagrams.net/ | 186 | 80.894 | 0,23% | Đạt mẫu; ứng dụng canvas |
| SPA | https://excalidraw.com/ | 286 | 30.419 | 0,94% | Đạt mẫu; ứng dụng canvas |
| SPA | https://nextjs.org/showcase | — | — | — | HTTP 403 |
| SPA | https://web.dev/learn/performance | 678 | 31.513 | 2,15% | Đạt mẫu |
| SPA | https://developer.chrome.com/docs/devtools/ | — | — | — | Lỗi `DOM.describeNode`: không tìm thấy node ID |
| SPA | https://github.com/microsoft/TypeScript/issues | 2.126 | 126.768 | 1,68% | Đạt mẫu |
| SPA | https://angular.dev/overview | 2.335 | 117.692 | 1,98% | Đạt mẫu |

## Tổng hợp tích luỹ batch 1 + 2 + 3 — 55 mẫu đạt tiêu chí

Batch 3 riêng có **107.871/3.639.975 = 2,96%** theo tổng token và **5,72%** trung bình trang. Trên cả ba batch, giữ nguyên loại trừ một tutorial Lit chưa render shadow root; không tính 9 URL lỗi. Không cộng các tỷ lệ đã làm tròn trong bảng để tính trung bình.

| Phép tổng hợp | Công thức | Kết quả | So với SPEC mục 28 |
|---|---|---:|---|
| Theo tổng token | 169.706 / 5.899.677 | **2,88%** | Đạt ≤10% và stretch ≤5% |
| Trung bình tỷ lệ từng trang | Σ 55 tỷ lệ / 55 | **5,34%** | Đạt ≤10%; vượt stretch ≤5% khoảng 0,34 điểm % |

So với baseline fixture hiện hành **532/2.142 = 24,84%**, corpus tích luỹ thấp hơn **21,96 điểm %** theo tổng token và **19,50 điểm %** theo trung bình trang. **12/55 mẫu riêng vượt 10%**, gồm 5 mẫu Simple mới: Hacker News, MDN, GNU, WCAG 2.2 và RFC 8259. Trang SQLite có DOM gần một triệu token nhưng snapshot chỉ 2.041 token; Paul Graham chỉ 444 token trong snapshot. Hai ứng dụng canvas cũng cho snapshot rất ngắn. Các tỷ lệ này không chứng minh nội dung chính đã được giữ đầy đủ; kích thước DOM và giao diện canvas ảnh hưởng mạnh đến phép so sánh. Chưa đo recall/precision bằng oracle trên trang thật.

## Kết quả từng URL — batch 4 (dispatch 10)

Batch 4 thử **22 URL mới**, không trùng 65 URL cũ: 4 Dashboard, 3 Ecommerce, 4 Enterprise form, 4 Modal/dropdown, 5 Iframe và 2 Custom component. **21** URL trả số đo; một trang W3Schools lỗi CDP. Trang chỉ mục Embedded Content không chứa iframe sau render nên giữ số đo nhưng loại khỏi tổng; **20** mẫu còn lại được tính. Hai URL iframe bổ sung được thêm sau khi phát hiện trang chỉ mục không phù hợp và W3Schools lỗi. Không click, nhập liệu hoặc thử vượt chặn.

| Nhóm SPEC | URL | Snapshot tokens | DOM tokens | Tỷ lệ | Trạng thái |
|---|---|---:|---:|---:|---|
| Dashboard | https://adminlte.io/themes/v3/pages/charts/chartjs.html | 650 | 17.875 | 3,64% | Đạt mẫu; trang biểu đồ |
| Dashboard | https://adminlte.io/themes/v3/pages/tables/data.html | 1.131 | 19.285 | 5,86% | Đạt mẫu; trang bảng |
| Dashboard | https://laravel.adminlte.io/demo/dashboard-v3 | 675 | 51.967 | 1,30% | Đạt mẫu |
| Dashboard | https://laravel.adminlte.io/demo/widgets/small-box | 542 | 15.157 | 3,58% | Đạt mẫu; widget dashboard |
| Ecommerce | https://demowebshop.tricentis.com/electronics | 660 | 5.868 | 11,25% | Đạt mẫu; vượt 10% riêng lẻ |
| Ecommerce | https://demowebshop.tricentis.com/jewelry | 937 | 7.949 | 11,79% | Đạt mẫu; vượt 10% riêng lẻ |
| Ecommerce | https://www.demoblaze.com/prod.html?idp_=2 | 188 | 13.232 | 1,42% | Đạt mẫu; trang sản phẩm |
| Enterprise form | https://demoqa.com/text-box | 176 | 14.540 | 1,21% | Đạt mẫu; form nhập text |
| Enterprise form | https://demoqa.com/checkbox | 144 | 14.398 | 1,00% | Đạt mẫu; cây checkbox |
| Enterprise form | https://laravel.adminlte.io/demo/forms/validation | 782 | 16.394 | 4,77% | Đạt mẫu; form validation |
| Enterprise form | https://laravel.adminlte.io/demo/forms/wizard | 570 | 17.618 | 3,24% | Đạt mẫu; form wizard |
| Modal/dropdown | https://getbootstrap.com/docs/5.3/components/accordion/ | 2.464 | 54.051 | 4,56% | Đạt mẫu; accordion mặc định |
| Modal/dropdown | https://getbootstrap.com/docs/5.3/components/tooltips/ | 3.585 | 46.454 | 7,72% | Đạt mẫu; tooltip đóng |
| Modal/dropdown | https://mui.com/material-ui/react-dialog/ | 3.221 | 176.599 | 1,82% | Đạt mẫu; dialog đóng |
| Modal/dropdown | https://mui.com/material-ui/react-menu/ | 3.475 | 194.037 | 1,79% | Đạt mẫu; menu đóng |
| Iframe | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe | 6.108 | 45.200 | 13,51% | Đạt mẫu; 6 frame |
| Iframe | https://www.w3schools.com/html/html_iframe.asp | — | — | — | Lỗi `DOM.describeNode`: không tìm thấy node ID |
| Iframe | https://testpages.eviltester.com/pages/embedded-pages/ | 993 | 62.081 | 1,60% | **Không tính tổng**: trang chỉ mục không có iframe |
| Custom component | https://material-web.dev/components/checkbox/ | 849 | 11.456 | 7,41% | Đạt mẫu; 52 shadow roots |
| Custom component | https://material-web.dev/components/dialog/ | 1.214 | 15.696 | 7,73% | Đạt mẫu; 49 shadow roots |
| Iframe | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/object | 4.748 | 35.882 | 13,23% | Đạt mẫu; 4 frame |
| Iframe | https://the-internet.herokuapp.com/tinymce | 205 | 5.977 | 3,43% | Đạt mẫu; 1 iframe |

`frameCount` được lấy từ Playwright sau render; số shadow root được kiểm tra bằng DOM read-only trên hai trang Material Web. Các trang MDN `<iframe>` và `<object>` là tài liệu có ví dụ nhúng, không phải ứng dụng iframe nghiệp vụ. DemoQA và AdminLTE là form demo công khai, không thay thế ứng dụng doanh nghiệp cần đăng nhập. Các component modal/menu được đọc ở trạng thái mặc định, chưa đánh giá trạng thái mở.

## Tổng hợp tích luỹ batch 1 + 2 + 3 + 4 — 75 mẫu đạt tiêu chí

Batch 4 riêng: **32.324/779.635 = 4,15%** theo tổng token và **5,51%** trung bình tỷ lệ từng trang. Trên toàn bộ dữ liệu, loại tutorial Lit batch 1 chưa render shadow root và trang chỉ mục iframe batch 4; không tính 10 URL lỗi. Tính từ token chưa làm tròn, không cộng phần trăm hiển thị trong bảng.

| Phép tổng hợp | Công thức | Kết quả | So với SPEC mục 28 |
|---|---|---:|---|
| Theo tổng token | 202.030 / 6.679.312 | **3,02%** | **Đạt** ≤10% và stretch ≤5% |
| Trung bình tỷ lệ từng trang | Σ 75 tỷ lệ / 75 | **5,39%** | **Đạt** ≤10%; **không đạt** stretch ≤5% (vượt 0,39 điểm %) |

So với baseline hai fixture hiện hành **532/2.142 = 24,84%**, corpus thấp hơn **21,82 điểm %** theo tổng token và **19,45 điểm %** theo trung bình trang. **16/75 mẫu riêng vượt 10%**; batch 4 góp bốn mẫu (hai danh mục Demo Web Shop và hai trang MDN có iframe). DOM lớn, script/markup dùng chung và mẫu số `page.content()` không gồm nội dung iframe/shadow DOM có thể làm tỷ lệ thấp; token ratio không chứng minh snapshot đầy đủ hay chính xác. Chưa có oracle để đo recall/precision trên trang thật, latency, ID stability qua state hoặc test success rate.

## Kết quả từng URL — batch 5 (dispatch 11)

Batch cuối thử **16 URL mới**: 7 Simple, 5 SPA và mỗi nhóm Dashboard, Ecommerce, Enterprise form, Modal/dropdown một URL. Hai URL cuối là mẫu thay thế sau khi GNU hết thời gian tải và Gradio gặp lỗi CDP. **14** URL đo được và phù hợp nhóm; hai lỗi giữ nguyên trong dữ liệu. Không click, nhập liệu, gửi form hoặc thử vượt chặn. “Đạt mẫu” chỉ có nghĩa là phép đo dùng được trong tổng token ratio, không xác nhận snapshot đầy đủ nội dung.

| Nhóm SPEC | URL | Snapshot tokens | DOM tokens | Tỷ lệ | Trạng thái |
|---|---|---:|---:|---:|---|
| Simple | https://en.wikipedia.org/wiki/Graph_theory | 11.950 | 308.635 | 3,87% | Đạt mẫu |
| Simple | https://docs.python.org/3/tutorial/controlflow.html | 3.688 | 57.903 | 6,37% | Đạt mẫu |
| Simple | https://www.gnu.org/licenses/gpl-3.0.html | — | — | — | Navigation quá 30 giây |
| Simple | https://www.rfc-editor.org/rfc/rfc9110.html | 40.310 | 419.018 | 9,62% | Đạt mẫu |
| Simple | https://lobste.rs/ | 2.162 | 19.613 | 11,02% | Đạt mẫu; vượt 10% riêng lẻ |
| Simple | https://requests.readthedocs.io/en/latest/user/quickstart/ | 765 | 41.430 | 1,85% | Đạt mẫu |
| SPA | https://gitlab.com/inkscape/inkscape | 2.315 | 79.346 | 2,92% | Đạt mẫu |
| SPA | https://angular.dev/tutorials/first-app | 783 | 64.981 | 1,20% | Đạt mẫu; 4 frame |
| SPA | https://huggingface.co/spaces/gradio/hello_world | — | — | — | Lỗi `DOM.describeNode`: không tìm thấy node ID |
| SPA | https://stackblitz.com/edit/angular-ivy?file=src%2Fapp%2Fapp.component.ts | 1.115 | 80.953 | 1,38% | Đạt mẫu; 3 frame |
| Dashboard | https://adminlte.io/themes/v3/pages/calendar.html | 622 | 27.568 | 2,26% | Đạt mẫu; lịch dashboard |
| Ecommerce | https://demowebshop.tricentis.com/computers | 678 | 6.002 | 11,30% | Đạt mẫu; vượt 10% riêng lẻ |
| Enterprise form | https://adminlte.io/themes/v3/pages/forms/editors.html | 745 | 38.494 | 1,94% | Đạt mẫu; editor demo |
| Modal/dropdown | https://getbootstrap.com/docs/5.3/components/toasts/ | 2.768 | 70.653 | 3,92% | Đạt mẫu; toast ở trạng thái mặc định |
| Simple | https://www.fsf.org/about/what-is-free-software | 1.928 | 12.517 | 15,40% | Đạt mẫu; vượt 10% riêng lẻ |
| SPA | https://github.com/facebook/react/issues | 2.057 | 123.206 | 1,67% | Đạt mẫu; URL chuyển hướng đến `github.com/react/react/issues` |

## Tổng hợp tích luỹ CUỐI CÙNG — batch 1 + 2 + 3 + 4 + 5

Batch 5 riêng có **71.886/1.350.319 = 5,32%** theo tổng token và **5,34%** trung bình tỷ lệ từng trang trên 14 mẫu. Trên toàn bộ dữ liệu, giữ nguyên hai loại trừ đã ghi ở batch trước: tutorial Lit batch 1 chưa render shadow root và trang chỉ mục iframe batch 4 không chứa iframe. Dòng Lit cũ không có `excludedReason` trong JSON, nên phép tổng hợp nhận diện bằng URL; không sửa batch 1–4. Không tính 12 URL lỗi. Tính từ token và tỷ lệ chưa làm tròn.

| Phép tổng hợp | Công thức | Kết quả | So với SPEC mục 28 |
|---|---|---:|---|
| Theo tổng token | 273.916 / 8.029.631 | **3,41%** | **Đạt** ≤10% và stretch ≤5% |
| Trung bình tỷ lệ từng trang | Σ 89 tỷ lệ / 89 | **5,38%** | **Đạt** ≤10%; **không đạt** stretch ≤5% (vượt 0,38 điểm %) |

So với baseline hai fixture hiện hành **532/2.142 = 24,84%**, corpus thấp hơn **21,43 điểm %** theo tổng token và **19,46 điểm %** theo trung bình trang. **19/89 mẫu riêng vượt 10%**. Mẫu số `page.content()` gồm script/markup main frame nhưng không gồm nội dung iframe/shadow DOM; tỷ lệ token thấp không chứng minh snapshot đầy đủ hoặc chính xác. Chưa có oracle để đo recall/precision trên trang thật, latency, ID stability qua state hoặc test success rate.

## TỔNG KẾT CORPUS

**Hoàn tất chỉ tiêu URL đã thử của corpus SPEC mục 29:** **103 URL riêng biệt** trên tám nhóm, từng nhóm đạt hoặc vượt số URL mục tiêu; trong đó **91** trả số đo, **89** phù hợp và được tính token ratio, **12** lỗi, **2** đo được nhưng bị loại. Simple có 20 mẫu đo được trên 21 URL thử; SPA có 16 mẫu trên 21 URL thử. Các nhóm Ecommerce, Iframe và Custom component còn dưới 10 mẫu đo được vì lỗi hoặc mẫu không phù hợp. Vì vậy kết quả đáp ứng mốc **100 URL đã thử theo phân bổ nhóm** mà dispatch này đặt ra, nhưng **chưa phải benchmark 100 mẫu đo được**, và chưa hoàn tất bộ metric mục 29 ngoài token ratio. Không quy lỗi tải trang hoặc CDP thành số đo giả.

**Kết luận ngưỡng SPEC mục 28:** token ratio tích luỹ **đạt mốc MVP ≤10%** theo cả hai phép tổng hợp; mốc stretch **đạt theo tổng token, không đạt theo trung bình trang**. **Chấp nhận MVP tổng thể vẫn chưa đạt**: baseline hai fixture cố định là **24,84% >10%** và corpus trang thật chưa xác nhận semantic coverage ≥95% hay false interactive <5%. Không suy kết luận chất lượng semantic từ riêng token ratio.

## Tiến độ corpus theo nhóm

Đếm **mọi URL đã thử, kể cả lỗi và mẫu bị loại khỏi tổng**, theo 100 trang mục tiêu của SPEC mục 29:

| Nhóm | Batch 1 | Thêm batch 2 | Thêm batch 3 | Thêm batch 4 | Thêm batch 5 | Tích luỹ / mục tiêu | Mẫu tính tổng tích luỹ |
|---|---:|---:|---:|---:|---:|---:|---:|
| Simple | 4 | 0 | 10 | 0 | 7 | 21/20 | 20 |
| SPA | 4 | 0 | 12 | 0 | 5 | 21/20 | 16 |
| Dashboard | 2 | 3 | 0 | 4 | 1 | 10/10 | 10 |
| Ecommerce | 3 | 3 | 0 | 3 | 1 | 10/10 | 9 |
| Enterprise form | 2 | 3 | 0 | 4 | 1 | 10/10 | 10 |
| Modal/dropdown | 2 | 3 | 0 | 4 | 1 | 10/10 | 10 |
| Iframe | 2 | 4 | 0 | 5 | 0 | 11/10 | 7 |
| Custom component | 4 | 4 | 0 | 2 | 0 | 10/10 | 7 |
| **Tổng** | **23** | **20** | **22** | **22** | **16** | **103/100** | **89** |

Lưu ý: số đếm SPA 3/20 và Custom component 3/10 trong phần bối cảnh dispatch 8 thấp hơn dữ liệu `results.json` batch 1 một URL mỗi nhóm. Batch 1 thực tế có 4 URL SPA (kể cả Svelte 403) và 4 URL custom component (kể cả Lit tutorial), nên bảng dùng số đếm trực tiếp từ dữ liệu. Batch 4 thêm 5 URL Iframe nhưng chỉ 3 mẫu phù hợp và đo được: W3Schools lỗi CDP, trang chỉ mục Test Pages không có iframe. Batch 5 thêm hai URL thay thế để Simple và SPA đều vượt một URL đã thử so với mục tiêu. Không giả định tỷ lệ cho URL lỗi hoặc tính hai mẫu không phù hợp vào tổng.

## Actionable Recall/Precision — PILOT (đang xác thực phương pháp)

Dispatch 13 đo ngày 2026-09-26 trên **18 URL đã có trong `corpus/results.json`**: 4 Simple, 4 SPA, 2 Dashboard, 2 Ecommerce, 2 Enterprise form, 2 Modal/dropdown, 1 Iframe và 1 Custom component. Script riêng [`corpus/measure_recall.mjs`](../corpus/measure_recall.mjs) tải lại trang vì oracle phải chạy trước capture; kết quả từng node mẫu và số đo ở [`corpus/recall_pilot.json`](../corpus/recall_pilot.json). Chỉ load/đọc DOM, không click, nhập liệu hoặc mở modal. Mỗi trang dùng `domcontentloaded` + 1,2 giây, navigation timeout 30 giây, tiến trình con timeout 60 giây và heap 768 MB. Trang HTTP lỗi/bot block hoặc frame mà oracle không đọc được bị loại khỏi trung bình, không gán điểm giả; lần này **18/18 trang đo được**.

**Oracle độc lập:** DOM query mới trong script chọn `button`, `a[href]`, `input:not([type="hidden"])`, `select`, `textarea`, các role `button/link/checkbox/radio/switch/menuitem/menuitemcheckbox/menuitemradio/tab/combobox/option/slider/spinbutton/searchbox/textbox`, `[contenteditable=""]`, `[contenteditable="true"]` và `[tabindex]` chỉ khi giá trị là số không âm. Phần tử phải có bounding rect rộng/cao dương, computed style và mọi ancestor không `display:none`/`visibility:hidden` (cũng loại `visibility:collapse` và opacity 0), không có `disabled` property, `aria-disabled="true"` hoặc `aria-hidden="true"` trên chính nó, và không nằm dưới ancestor `aria-hidden="true"`. Oracle duyệt cả frame đọc được và shadow root mở. Nó **không import/gọi** `src/semantic/interactive.ts`. Theo đúng selector được giao, `<option>` native thiếu role tường minh không thuộc oracle; đây là khác biệt với oracle ID thủ công của hai fixture acceptance.

**Match chính xác theo DOM identity:** `--format json` hiện đã có `source.backendNodeId` cho semantic node, nên không cần sửa output hoặc logic sản phẩm. Oracle gắn `data-bf-oracle-id` tạm lên phần tử đạt điều kiện; sau capture, script nối attribute này với `backendNodeId` trong cây DOM CDP, cộng cây CDP đọc riêng với `pierce:true` để bao phủ shadow root. Một node BrowserFold là *detected* khi `visible && interactive` **và** `[semantic ID]` của nó thực sự có trong text snapshot. Giao là detected node có `source.backendNodeId` trùng oracle ID; không ghép theo label/role/bounding box. Định nghĩa này đo control có trong output text như acceptance recall, còn precision dùng chính tập detected đó. Lần chạy cuối map được **3.316/3.316** oracle ID; không có mất match do thiếu backend ID ở mẫu này. Script lưu số `mappedOracle` để phát hiện lỗi tương tự ở lần chạy sau.

| Nhóm | URL | Oracle | Detected | Match | Recall | Precision |
|---|---|---:|---:|---:|---:|---:|
| Simple | https://example.com/ | 1 | 1 | 1 | 100,00% | 100,00% |
| Simple | https://www.paulgraham.com/startupideas.html | 24 | 24 | 24 | 100,00% | 100,00% |
| Simple | https://news.ycombinator.com/ | 230 | 230 | 230 | 100,00% | 100,00% |
| Simple | https://en.wikipedia.org/wiki/Graph_theory | 1.344 | 1.080 | 1.032 | 76,79% | 95,56% |
| SPA | https://github.com/microsoft/playwright | 252 | 267 | 245 | 97,22% | 91,76% |
| SPA | https://vuejs.org/examples/#hello-world | 46 | 45 | 45 | 97,83% | 100,00% |
| SPA | https://vuejs.org/guide/introduction.html | 117 | 116 | 111 | 94,87% | 95,69% |
| SPA | https://web.dev/learn/performance | 56 | 56 | 53 | 94,64% | 94,64% |
| Dashboard | https://adminlte.io/themes/v3/index.html | 72 | 78 | 72 | 100,00% | 92,31% |
| Dashboard | https://adminlte.io/themes/v3/index2.html | 89 | 89 | 89 | 100,00% | 100,00% |
| Ecommerce | https://demowebshop.tricentis.com/build-your-own-computer | 83 | 85 | 80 | 96,39% | 94,12% |
| Ecommerce | https://demowebshop.tricentis.com/books | 69 | 74 | 63 | 91,30% | 85,14% |
| Enterprise form | https://getbootstrap.com/docs/5.3/examples/checkout/ | 25 | 29 | 25 | 100,00% | 86,21% |
| Enterprise form | https://adminlte.io/themes/v3/pages/forms/general.html | 93 | 134 | 93 | 100,00% | 69,40% |
| Modal/dropdown | https://getbootstrap.com/docs/5.3/components/modal/ | 248 | 247 | 247 | 99,60% | 100,00% |
| Modal/dropdown | https://getbootstrap.com/docs/5.3/components/dropdowns/ | 346 | 345 | 345 | 99,71% | 100,00% |
| Iframe | https://testpages.eviltester.com/pages/embedded-pages/iframes/ | 101 | 101 | 101 | 100,00% | 100,00% |
| Custom component | https://material-web.dev/components/button/ | 120 | 90 | 57 | 47,50% | 63,33% |

Tổng **3.316 oracle, 3.091 detected, 2.913 match**. Trung bình cộng 18 tỷ lệ trang: **Recall 94,21%; Precision 92,68%**. Tính theo tổng phần tử: **Recall 2.913/3.316 = 87,85%; Precision 2.913/3.091 = 94,24%**. Hai cách tổng hợp khác nhau vì Wikipedia có 1.344 oracle, còn example.com chỉ có 1. Đây là số pilot, không phải kết quả của 89 mẫu hay ngưỡng chấp nhận MVP đã xác nhận.

**Đánh giá phương pháp:** Match theo backend ID đáng tin hơn ghép xấp xỉ và đã map hết ID oracle trên 18 trang. Kết quả 100%/100% của vài trang đơn giản phản ánh URL có tập control dễ nhận diện, không phải bằng chứng hệ thống hoàn hảo: Wikipedia chỉ đạt 76,79% recall; Material Web Buttons chỉ **57/120 = 47,50%**, dù cả 120 ID đã được map xuyên shadow root. Form AdminLTE có precision **93/134 = 69,40%**. Dispatch 14 bên dưới đã phân loại từng nhóm miss/false positive bằng capture mới; các con số ở bảng trên vẫn là baseline pilot trước sửa. Tương tự, các trang modal/dropdown chỉ ở trạng thái đóng.

**Khuyến nghị trước full 89:** Giữ cơ chế match chính xác này, nhưng chạy lặp một số URL động và kiểm tra tay vài miss/false positive ở Wikipedia, form và Material Web trước khi suy rộng số liệu. Ngay trong quá trình xác thực, web.dev có 35 oracle ở một lần tải và 56 ở lần cuối; DOM động khiến một lần đo không đủ để kết luận độ ổn định. Cần giữ định nghĩa oracle được giao khi so sánh, ghi riêng các native `<option>` ngoài oracle và trạng thái shadow/frame. Chưa chạy 89 trang trong dispatch này.

## Điều tra nguyên nhân gap recall/precision — Dispatch 14

Ngày 2026-09-26, tải lại đúng ba URL bằng Chromium `domcontentloaded` + 1,2 giây, navigation timeout 30 giây và tiến trình timeout 180 giây cho ba trang. Gắn oracle ID trước capture, xuất debug JSON bằng cùng `serializeJson` với CLI `--format json`, rồi match chính xác `backendNodeId` và chỉ tính control có semantic ID trong text. Cả ba lần tải **trước sửa** tái hiện đúng pilot: Material 57/120, Wikipedia 1032/1344, AdminLTE 93/134; mọi oracle ID đều map được. Các ID `probe-*` dưới đây là ID tạm của lần tải này, không ổn định qua lần tải khác. Không click hay mở nội dung gập.

### Material Web Buttons

Trong 63 oracle miss trước sửa, **62 ở shadow root mở**: 37 chỉ có AX-only semantic node nhưng `interactive:false`, 25 không có semantic node tương ứng; một `<main tabindex="0">` ở light DOM bị heuristic interactive loại. Các nút thực nằm sâu trong shadow root của `md-*`, bao gồm root lồng trong `top-app-bar`, `nav-drawer`, `lit-island` và `copy-code-button`. Dòng `src/extract/dom.ts:21` cũ gọi CDP với `pierce:false`; các vòng duyệt `expandFrames`/`collect` cũ chỉ theo `children` và `contentDocument`. `src/semantic/merger.ts:108-112` cũ cũng chỉ theo hai nhánh đó. AX fallback ở `merger.ts:121-127` không có DOM attributes; `interactive.ts:27-37` chỉ cho role button/link tương tác khi có `tabindex` hoặc dấu hiệu intent trên chính node. Đây là mất DOM identity và thuộc tính của control bên trong shadow root, không phải lỗi ghép ID. Không thấy bằng chứng merge/dedupe xóa control liền kề: `merger.ts` tạo một node cho mỗi DOM element và bỏ qua AX node đã ghép theo backend ID (`:55-59`, `:103-128`). Closed root không được oracle JS duyệt; điều tra này chỉ nói về open root.

Mẫu **20 miss cụ thể trước sửa** (role oracle đều không khai báo tường minh; `—` là label DOM rỗng vì nội dung nằm ở slot/AX). Cột shadow/custom là quan sát trên chính element; thứ tự custom từ gần ra xa:

| Oracle ID | Tag | Text/label | Shadow | Custom ancestor gần nhất |
|---|---|---|---|---|
| probe-1 | button | — | Có | md-icon-button |
| probe-2 | a | Material Web | Có | top-app-bar |
| probe-3 | a | — | Có | md-icon-button |
| probe-4 | button | — | Có | md-icon-button |
| probe-38 | main | Buttons… | Không | nav-drawer |
| probe-44 | button | — | Có | md-elevated-button |
| probe-45 | button | — | Có | md-filled-button |
| probe-46 | button | — | Có | md-filled-tonal-button |
| probe-47 | button | — | Có | md-outlined-button |
| probe-48 | button | — | Có | md-text-button |
| probe-54 | button | — | Có | md-outlined-button |
| probe-55 | button | — | Có | md-filled-button |
| probe-56 | button | — | Có | md-icon-button → copy-code-button |
| probe-57 | button | — | Có | md-filled-tonal-button |
| probe-58 | button | — | Có | md-text-button |
| probe-59 | button | — | Có | md-icon-button → copy-code-button |
| probe-61 | button | — | Có | md-icon-button → copy-code-button |
| probe-63 | button | — | Có | md-icon-button → copy-code-button |
| probe-65 | button | — | Có | md-elevated-button |
| probe-66 | button | — | Có | md-icon-button → copy-code-button |

Test fixture mới có hai **open** shadow root lồng nhau và `<button>` nội bộ: đỏ vì không có DOM node/backend ID; sau khi CDP pierce và duyệt `shadowRoots` đệ quy, xanh. Chỉ giữ `shadowRootType === 'open'`: CDP `pierce:true` còn trả user-agent shadow root của `<input type="password">`, từng làm lộ giá trị vào semantic text trong lần chạy trung gian; test redaction cũ bắt được và đã xanh lại sau lọc. Trên URL thật sau sửa: **118/120 recall = 98,33%**, detected 153, precision 118/153 = 77,12%. Hai miss còn lại là `<main tabindex="0">` không có intent và một `<a>` lồng trong `md-list-item` mà text renderer không in ID riêng; không mở rộng heuristic/tabindex hoặc in cả control lồng nhau vì có nguy cơ tạo action trùng.

### Wikipedia Graph theory

Trước sửa có 312 miss: **295 link ở dưới `<tr hidden="until-found">` của navbox gập** bị BrowserFold đánh `visible:false`; 17 control ở hàng tiêu đề bảng có `visible:true`, `interactive:true` nhưng thiếu ID trong text (4 button và 13 link). Oracle pilot kiểm tra `display`/`visibility`/`opacity` và bounding rect của từng ancestor, nhưng **không kiểm tra thuộc tính `hidden`** (`corpus/measure_recall.mjs`, hàm `tagOracleElements`); child link trong tr gập vẫn có bounding rect dương trong CDP/JS. Đối chiếu raw path cho cả 295 miss đều tìm thấy ancestor `tr[hidden="until-found"]` với CDP box 0×0; ví dụ link “History” có box 50×16 nhưng ancestor tr 0×0. `merger.ts:72-76` loại mọi ancestor có `hidden`. Đây là bất đồng định nghĩa visibility của oracle, không phải 295 link thật bị merge/dedupe mất; **không sửa sản phẩm để hiện nội dung đang gập**. Kết luận 76,79% pilot vì vậy không thể đọc như recall trên control đang hiện.

Mẫu **20 miss cụ thể trước sửa** (tất cả không ở shadow root, không ở custom element; role HTML mặc định button/link, thuộc tính role không khai báo):

| Oracle ID | Tag | Text/label | Nguyên nhân |
|---|---|---|---|
| probe-1014 | button | show | Tiêu đề bảng không được in |
| probe-1015 | a | v | Tiêu đề bảng không được in |
| probe-1016 | a | t | Tiêu đề bảng không được in |
| probe-1017 | a | e | Tiêu đề bảng không được in |
| probe-1018 | a | mathematics | Tiêu đề bảng không được in |
| probe-1019 | a | History | `tr[hidden="until-found"]` |
| probe-1020 | a | Timeline | `tr[hidden="until-found"]` |
| probe-1021 | a | Future | `tr[hidden="until-found"]` |
| probe-1022 | a | Lists | `tr[hidden="until-found"]` |
| probe-1023 | a | Glossary | `tr[hidden="until-found"]` |
| probe-1024 | a | Foundations | `tr[hidden="until-found"]` |
| probe-1025 | a | Category theory | `tr[hidden="until-found"]` |
| probe-1026 | a | Information theory | `tr[hidden="until-found"]` |
| probe-1027 | a | Mathematical logic | `tr[hidden="until-found"]` |
| probe-1028 | a | Order theory | `tr[hidden="until-found"]` |
| probe-1029 | a | Philosophy of mathematics | `tr[hidden="until-found"]` |
| probe-1030 | a | Set theory | `tr[hidden="until-found"]` |
| probe-1031 | a | Type theory | `tr[hidden="until-found"]` |
| probe-1032 | a | Algebra | `tr[hidden="until-found"]` |
| probe-1033 | a | Abstract | `tr[hidden="until-found"]` |

Lỗi 17 control có thật ở `src/serialize/text.ts:71-86`: renderer chọn hàng đầu có `<th>` làm header, in `columns`, rồi `continue` khi duyệt rows nên không in control dưới header. Fixture bảng nhỏ có button/link trong `<th>` đỏ trước sửa và xanh sau khi in control ở header. Chạy lại Wikipedia: **1049/1344 = 78,05%** theo oracle pilot, đúng 17 match tăng thêm; 295 miss còn lại đều dưới `hidden="until-found"`. Nếu loại đúng 295 phần tử này khỏi mẫu số visibility thì 1049/1049 control đang hiện được match trong lần tải đó; đây là phép phân tích nguyên nhân, **không phải sửa lại số pilot hay đổi oracle**.

### AdminLTE form

Toàn bộ **41/41 detected không match** được phân loại: **29 `<option>` native = 70,73%** (không có role tường minh, oracle selector cố ý không gồm `option`), còn **12 `<input>` = 29,27%**: 2 file, 6 checkbox, 4 radio. Kiểm tra computed style trên URL thật: cả 12 input này thuộc lớp custom-file/custom-control và có `opacity:0` cùng box dương (ví dụ `#exampleInputFile` 378×38, `#customCheckbox1` 16×20); oracle loại theo `opacity <= 0`, trong khi `merger.ts:72-76` không xét opacity và `interactive.ts:8,27-31` coi input native là interactive. Đây là mismatch visibility đo được, không phải đoán rằng tất cả đều là option. Control custom có label nhìn thấy và vẫn là input hành động; không sửa bằng cách loại mọi opacity-zero input vì sẽ làm mất thao tác qua những control này. `interactive.ts:8,31` và `serialize/text.ts:44-49` giải thích `<option>` xuất hiện như control con của select; giữ nguyên để không phá fixture acceptance cần option.

Mẫu **20 detected ngoài oracle** (backend ID của lần tải; tất cả light DOM, không nằm trong custom element):

| Backend ID | Tag/role | Label/ngữ cảnh |
|---:|---|---|
| 654 | input/button | File input Choose file Browse |
| 697 | option/option | Value 1 |
| 700 | option/option | Value 2 |
| 703 | option/option | Value 3 |
| 979 | option/option | option 1 |
| 982 | option/option | option 2 |
| 985 | option/option | option 3 |
| 988 | option/option | option 4 |
| 991 | option/option | option 5 |
| 1073 | input/checkbox | Custom Checkbox |
| 1076 | input/checkbox | Custom Checkbox checked |
| 1082 | input/checkbox | Custom Checkbox with custom color |
| 1085 | input/checkbox | Custom Checkbox with custom color outline |
| 1090 | input/radio | Custom Radio |
| 1093 | input/radio | Custom Radio checked |
| 1099 | input/radio | Custom Radio with custom color |
| 1102 | input/radio | Custom Radio with custom color outline |
| 1202 | input/checkbox | Toggle this custom switch element |
| 1206 | input/checkbox | Toggle this custom switch element with custom colors |
| 1232 | input/button | Choose file Browse |

**Kiểm tra cuối:** test RED rồi GREEN cho nested shadow và table header. `npm run typecheck` và `npm run build` pass. Toàn bộ `npm test`: **13/14 file, 16/17 test pass**; assertion duy nhất fail vẫn là token ratio fixture cũ **532/2142 = 24,84% > 10%**, trong khi acceptance recall 25/25, false interactive 0/25 và determinism đều pass. Không sửa `tests/acceptance.test.ts` hoặc ngưỡng.

# Corpus trang thật — dispatch 7 và 8: token ratio

Đo ngày **2026-09-26** trên Chromium/Playwright, không click, nhập liệu hoặc gửi form. Đây là corpus thủ công theo SPEC.md mục 28–29, không phải test CI hay corpus mục tiêu 100 trang. Hai batch đã thử **43 URL công khai riêng biệt**; **36** trả về phép đo, trong đó **35** là mẫu đạt tiêu chí đại diện; **7** lỗi. Tám nhóm của mục 29 đều có ít nhất một mẫu đạt tiêu chí. Dữ liệu thô, gồm URL lỗi, ở [`corpus/results.json`](corpus/results.json); script chạy lại ở [`corpus/measure.mjs`](corpus/measure.mjs).

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

Baseline hai fixture trên HEAD `ad865b1`, đo lại bằng `npm test -- tests/acceptance.test.ts`, là **532/2.142 = 24,84%** (login 112/546; management 420/1596). PROGRESS.md ghi 24,74% ở phép đo trước dispatch 6; sau ba fix ở dispatch 6, baseline hiện hành là 24,84%. So với baseline hiện hành, pilot thấp hơn **22,57 điểm %** theo tổng token và **19,82 điểm %** theo trung bình trang. Ba mẫu riêng vẫn vượt 10%: example.com, motherfuckingwebsite.com và sản phẩm Demo Web Shop.

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

## Tiến độ corpus theo nhóm

Đếm **mọi URL đã thử, kể cả lỗi và mẫu bị loại khỏi tổng**, theo 100 trang mục tiêu của SPEC mục 29:

| Nhóm | Batch 1 | Thêm batch 2 | Tích luỹ / mục tiêu | Mẫu tính tổng tích luỹ |
|---|---:|---:|---:|---:|
| Simple | 4 | 0 | 4/20 | 4 |
| SPA | 4 | 0 | 4/20 | 2 |
| Dashboard | 2 | 3 | 5/10 | 5 |
| Ecommerce | 3 | 3 | 6/10 | 5 |
| Enterprise form | 2 | 3 | 5/10 | 5 |
| Modal/dropdown | 2 | 3 | 5/10 | 5 |
| Iframe | 2 | 4 | 6/10 | 4 |
| Custom component | 4 | 4 | 8/10 | 5 |
| **Tổng** | **23** | **20** | **43/100** | **35** |

Lưu ý: số đếm SPA 3/20 và Custom component 3/10 trong phần bối cảnh dispatch 8 thấp hơn dữ liệu `results.json` batch 1 một URL mỗi nhóm. Batch 1 thực tế có 4 URL SPA (kể cả Svelte 403) và 4 URL custom component (kể cả Lit tutorial), nên bảng dùng số đếm trực tiếp từ dữ liệu. Iframe chỉ thêm 3 mẫu đo được vì W3Schools gặp lỗi CDP; không giả định tỷ lệ cho URL lỗi hoặc ép thay bằng trang không phù hợp.

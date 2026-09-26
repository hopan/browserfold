# Dispatch 7 — pilot corpus trang thật: token ratio

Đo ngày **2026-09-26** trên Chromium/Playwright, không click, nhập liệu hoặc gửi form. Đây là pilot thủ công theo SPEC.md mục 28–29, không phải test CI hay corpus mục tiêu 100 trang. Thử **23 URL công khai**; **17** trả về phép đo, trong đó **16** là mẫu đạt tiêu chí đại diện; **6** lỗi. Tám nhóm của mục 29 đều có ít nhất một mẫu đạt tiêu chí. Dữ liệu thô, gồm URL lỗi, ở [`corpus/results.json`](corpus/results.json); script chạy lại ở [`corpus/measure.mjs`](corpus/measure.mjs).

## Cách đo

Chạy `npm run build && node corpus/measure.mjs`. Mỗi URL mở trong tiến trình Chromium/Node riêng; đợi `domcontentloaded` và thêm 1,2 giây cho JS render. Trên **cùng page**, lấy `page.content()` trước, rồi chạy `capturePage → mergeSemanticNodes → generateSemanticIds → buildContentStructure → serializeText`. Cả hai chuỗi được đếm bằng đúng regex của `tests/acceptance.test.ts`: `/[\p{L}\p{N}_]+|[^\s]/gu`. Tỷ lệ = token snapshot / token DOM. Đây là phép xấp xỉ token ổn định, không phải tokenizer của một model. Mỗi URL có giới hạn navigation 30 giây, đo 45 giây và tiến trình con 55 giây; giới hạn heap 768 MB để lỗi một trang không làm mất các phép đo khác.

`page.content()` là HTML của **main frame** sau render, gồm markup/script/style đang trong DOM; nó không tuần tự hóa shadow DOM hoặc nội dung iframe vào mẫu số. Snapshot có thể đọc một phần iframe/shadow DOM qua CDP/AX. Do đó tỷ lệ đo đúng theo baseline fixture nhưng không chứng minh độ đầy đủ semantic hoặc chi phí token khi đưa toàn bộ frame/shadow DOM vào mẫu số.

## Kết quả từng URL

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

## Tổng hợp 16 mẫu đạt tiêu chí

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

**Kết luận:** Trên 16 trang thật được chọn, tỷ lệ token thấp hơn đáng kể so với hai fixture nhỏ và theo tổng token đã đạt cả mốc 10% lẫn 5%. Trung bình trang vừa trên mốc stretch, và ba trang riêng vẫn không đạt 10%. DOM framework/script lớn ở Wikipedia, GitHub và Tabler kéo mạnh tỷ lệ theo tổng token xuống thấp; vì vậy không thể suy ra mọi trang sẽ đạt ngưỡng. Pilot chưa đo recall/precision bằng oracle trên trang thật, chưa đo modal mở, và chưa thay thế corpus 100 trang hoặc đánh giá độ đầy đủ của snapshot.

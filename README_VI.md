# Locket Gold — phần được tách từ Module_IOS

Nguồn: [duyvinh09/Module_IOS](https://github.com/duyvinh09/Module_IOS).

Phiên bản đã đọc: `4936c663773284c7ef429da1d0ea1ee71144790e`.
Ngày tách: 23/10/2026. Tác giả mã gốc: @duyvinh09; thông tin tác giả trong các tệp được giữ nguyên.

Đây là bộ cấu hình và JavaScript sửa request/response trong môi trường proxy iOS. Gói này chứa phần liên quan đến Locket Gold của repository, không phải dự án ứng dụng iOS để build bằng Xcode.

## 1. Các tệp chính

| Tệp | Vai trò | Trạng thái trong cấu hình gốc |
| --- | --- | --- |
| `modules/Locket_tduc.sgmodule` | Điểm vào: khai báo quy tắc gọi script và hai hostname MITM. | Ba quy tắc đang bật, một quy tắc bị comment. |
| `js/Locket_tduc.js` | Đọc JSON trả về từ RevenueCat, thêm subscription `locket_1600_1y` và entitlement `Gold`, rồi trả JSON đã sửa. | Được quy tắc `revenuecat` gọi. |
| `js/deleteHeader.js` | Đặt giá trị header `X-RevenueCat-ETag` thành chuỗi rỗng. | Được quy tắc `deleteHeader` gọi ở bước request. |
| `js/Locket_Unlocked.js` | Sửa `entries` của Firebase Remote Config khi User-Agent chứa `Locket`. Gồm cấu hình tính năng, camera/video, bộ lọc, bạn bè, chat, widget, cache và caption. | Được quy tắc `locket_rc` gọi. |
| `js/Locket_rc_us.js` | Thử sửa `country_code` và `time_zone` trong request POST thành vùng Mỹ. | Quy tắc `locket_rc_us` đang bị comment, nên không tự chạy. |

Luồng xử lý được khai báo trong module:

1. Request RevenueCat đi qua `deleteHeader.js`.
2. Response RevenueCat đi qua `Locket_tduc.js`.
3. Response Firebase Remote Config của dự án `locket-4252a` đi qua `Locket_Unlocked.js`.

Các biến `$request`, `$response`, `$done` do ứng dụng proxy cung cấp. Các script này không phải chương trình Node.js chạy độc lập. Lệnh `node --check` chỉ được dùng để kiểm tra cú pháp.

## 2. Các tệp phụ và biến thể

| Tệp | Nội dung |
| --- | --- |
| `assets/LocketGold.mobileconfig` | Hồ sơ DNS-over-HTTPS tới dịch vụ `my.ublockdns.com`. Không khai báo danh sách `SupplementalMatchDomains` để giới hạn tên miền. |
| `assets/locket.mobileconfig` | Hồ sơ DNS-over-HTTPS tới `api.p12.vn`, có danh sách `SupplementalMatchDomains` gồm RevenueCat, Firebase Remote Config và một số miền khác. |
| `reference/Egern_Locket.fragment.yaml` | Đoạn cấu hình tham khảo được tách từ `Egern_LockGold.yaml`: giữ phần sửa header RevenueCat, quy tắc `Locket_Gold` và hostname liên quan. Đây không phải cấu hình Egern hoàn chỉnh. |
| `SOURCES.json` | Commit nguồn, đường dẫn tệp, SHA-256 và kết quả kiểm tra gói. |

Hai hồ sơ DNS được trang web gốc liên kết như phần bổ sung; module `.sgmodule` không gọi chúng. Việc đọc mã không xác minh được tuyên bố “duy trì vĩnh viễn” trong mô tả của tác giả. Các hồ sơ này thay đổi cấu hình DNS trên thiết bị, không chứa logic JavaScript Gold.

Biến thể Egern gốc tham chiếu `https://raw.githubusercontent.com/vuong2023/shad/main/js/Locket.js`, là mã ở repository khác. Tệp đó không nằm trong gói này và chưa được kiểm tra. Đoạn tham khảo không bao gồm proxy, định tuyến, thiết lập CA, capture hay các module ứng dụng khác của cấu hình Egern gốc.

## 3. Phạm vi tách và phụ thuộc còn lại

Bảy tệp trong `modules/`, `js/` và `assets/` được sao chép nguyên byte. Không đổi logic, tên tác giả, trạng thái comment hay URL trong các tệp này. Chỉ đoạn tham khảo Egern được rút gọn như mô tả ở trên.

Module vẫn giữ `script-path` và `#!url` trỏ tới nhánh `main` của GitHub tác giả. Do đó, khi được ứng dụng proxy nạp, nó vẫn có thể tải mã mới từ nguồn gốc; nó không tự sử dụng bản JavaScript nằm cạnh trong ZIP. Đây là bản tách mã nguồn để đọc và quản lý, chưa phải gói hoạt động hoàn toàn ngoại tuyến. Nếu đưa lên repository riêng, cần cập nhật các URL tới nơi chứa mã của bạn và kiểm tra lại trên ứng dụng đích.

`Locket_Unlocked.js` cũng chứa URL ảnh, tài nguyên hiển thị và liên kết mạng xã hội của tác giả. Chúng được giữ nguyên; các tài nguyên trực tuyến đó không được tải vào ZIP.

Các phần không đưa vào gói:

- `All_In_One.conf` và `All_In_One.sgmodule`: khối Locket trùng với module riêng, các phần còn lại dành cho ứng dụng khác.
- `js/revenuecat.js`: script dùng chung cho nhiều ứng dụng, có mục ánh xạ Locket nhưng không được module Locket riêng gọi.
- Website `index.html`, ảnh hướng dẫn chung, cấu hình proxy tổng quát và module ứng dụng khác: không phải phụ thuộc của ba quy tắc Locket đang bật.

## 4. Những điểm đáng chú ý khi đọc mã

- `Locket_tduc.js` sửa dữ liệu phản hồi tại phía thiết bị. Việc thấy giá trị Gold trong JSON không chứng minh tài khoản đã có thuê bao hợp lệ ở máy chủ hoặc mọi tính năng sẽ hoạt động.
- Hai phần Filter Pack trong `Locket_tduc.js` đang bị comment. Việc `Locket_Unlocked.js` khai báo danh sách bộ lọc là một cơ chế khác, không chứng minh các gói mua bộ lọc đã được cấp quyền.
- Quy tắc RevenueCat khớp endpoint chung. `Locket_tduc.js` đọc User-Agent nhưng không dùng nó để giới hạn xử lý cho Locket; `deleteHeader.js` cũng không lọc theo ứng dụng. Vì vậy, tách riêng tệp không đồng nghĩa quy tắc chỉ tác động lưu lượng của Locket.
- `Locket_Unlocked.js` có kiểm tra User-Agent chứa `Locket`, phân biệt chữ hoa/thường. Cả script này và script Gold đều phân tích JSON đầu vào mà không có `try/catch` bao quanh thao tác phân tích ban đầu.
- Các giá trị hạn dùng, giới hạn bạn bè và thời lượng video là giá trị do script ghi vào phản hồi; chưa được xác minh trên iPhone hoặc máy chủ hiện tại.

## 5. Kiểm tra đã thực hiện

- Đối chiếu nội dung của cả 7 tệp sao chép với commit nguồn: khớp từng byte.
- Kiểm tra cú pháp 4 tệp JavaScript bằng `node --check`: đạt.
- Phân tích 2 tệp `.mobileconfig` bằng bộ đọc plist: hợp lệ về cấu trúc.
- Kiểm tra đủ cả 4 đích script trong module, gồm cả script đang tắt.

Chưa cài hoặc chạy trên iPhone, chưa kiểm tra khả năng tương thích của ứng dụng proxy, chưa gọi API Locket/RevenueCat và chưa kiểm chứng các dịch vụ DNS. Gói giữ thông tin nguồn và lời nhắc của tác giả; không bổ sung giấy phép phân phối mới.

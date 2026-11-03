# 💛 Locket Gold VIP — by @tduc

> Bộ cấu hình và kịch bản can thiệp mạng tối ưu dành cho **Locket Camera** trên iOS (Shadowrocket, Loon, Surge, Quantumult X và DNS-over-HTTPS).
> Phát triển & Duy trì bởi: **tduc** ([Facebook](https://www.facebook.com/tduck.2007/))

---

## 📁 1. Cấu trúc thư mục tối ưu

```text
LocketGold/
├── assets/                               # Tài nguyên & Cấu hình DNS iOS
│   ├── DNSTduc.mobileconfig             # Profile DNS đã ký số (PKCS#7) chống thu hồi
│   ├── TducGold_Worker.mobileconfig      # Profile DNS XML chuẩn trỏ về Cloudflare Worker
│   └── frame.png                         # Khung ảnh widget trong suốt (640x640 RGBA)
├── cloudflare-worker/                    # Máy chủ DNS DoH riêng biệt
│   ├── dns-worker.js                     # Bản build đã tối ưu & bảo vệ deploy lên Cloudflare
│   ├── dns-worker.dev.js                 # Mã nguồn Worker phát triển
│   └── README.md                         # Hướng dẫn triển khai Worker
├── js/                                   # Kịch bản can thiệp dữ liệu (Đã mã hóa 100%)
│   ├── Locket_tduc.js                   # Mở khóa RevenueCat (Gói Gold 1 năm, Entitlements)
│   ├── Locket_Unlocked.js               # Mở khóa Firebase Remote Config (Quay 60s, Khung, Caption)
│   ├── locket_profile.js                # Duy trì Huy hiệu Gold Badge trên hồ sơ cá nhân
│   ├── deleteHeader.js                  # Xóa ETag header chống trả lời 304 rỗng
│   └── Locket_rc_us.js                  # Tùy chọn Fake vùng US
├── modules/
│   └── Locket_tduc.sgmodule             # Module cài đặt 1-chạm cho Shadowrocket / Loon / Surge
└── scripts/
    └── encrypt_all.py                   # Công cụ mã hóa tự động toàn bộ mã nguồn
```

---

## ⚡ 2. Hướng dẫn cài đặt nhanh trên iPhone

### Bước 1: Nạp Module vào Shadowrocket (Chỉ cần làm 1 lần)
1. Mở **Shadowrocket** > mục **Mô-đun (Modules)** > nhấn dấu **`+`**.
2. Dán liên kết module:
   ```text
   https://raw.githubusercontent.com/tduck1412/LocketGold/dev/modules/Locket_tduc.sgmodule
   ```
3. Bật công tắc kết nối VPN (chế độ **Cấu hình / Config**).
4. Mở ứng dụng **Locket** để nạp dữ liệu Gold và các tính năng mở khóa.

### Bước 2: Khóa trạng thái Gold vĩnh viễn bằng DNS
1. Sau khi Locket đã nhận Gold, bạn có thể tắt Shadowrocket.
2. Cài đặt file cấu hình **`assets/DNSTduc.mobileconfig`** vào iPhone:
   * Vào **Cài đặt** > **Đã tải về hồ sơ** > Bấm **Cài đặt**.
   * Vào **Cài đặt chung** > **VPN & Quản lý thiết bị** > **DNS** > Chọn cấu hình **tduc**.
3. Từ thời điểm này, Cloudflare DNS Worker sẽ tự động bảo vệ tài khoản của bạn lâu dài.

---

## 🛠️ 3. Quy trình phát triển & Mã hóa bảo mật

* Toàn bộ mã nguồn gốc được lưu dưới dạng file `.dev.js` (không đẩy lên Git công khai nhờ `.gitignore`).
* Khi có cập nhật mới, chỉ cần chạy một lệnh để đóng gói và mã hóa tự động:
  ```bash
  python3 scripts/encrypt_all.py
  ```
* Toàn bộ file `.js` công khai sẽ được biên dịch và mã hóa bảo mật chống dịch ngược logic.

# 🌐 TducGold DNS Worker - Hướng Dẫn Deploy & Xử Lý Sự Cố

**Tác giả:** @tduc  
**Công nghệ:** Cloudflare Workers (miễn phí vĩnh viễn, 100,000 request/ngày)

---

## 🚀 BƯỚC 1: Deploy lên Cloudflare (5 phút)

### Tạo tài khoản (nếu chưa có)
1. Vào **https://dash.cloudflare.com** → Sign Up miễn phí
2. Không cần thêm domain, không cần thẻ tín dụng

### Deploy Worker
1. Vào **Workers & Pages** → **Create Worker**
2. Đặt tên worker (ví dụ: `locket-dns`)
3. Xóa hết code mẫu → Copy toàn bộ nội dung file `dns-worker.js` vào
4. Bấm **Save and Deploy**
5. Lấy URL worker: `https://locket-dns.YOUR_NAME.workers.dev`

### Cập nhật mobileconfig
Mở file `TducGold_Worker.mobileconfig`, tìm dòng:
```xml
<string>https://locket-dns.tduc.workers.dev/dns-query</string>
```
Thay `tduc` bằng tên Cloudflare của bạn.

---

## 📱 BƯỚC 2: Cài lên iPhone

1. Upload file `TducGold_Worker.mobileconfig` lên GitHub của bạn
2. Mở link raw trên Safari iPhone
3. Cài đặt → Tin cậy profile

> **Kiểm tra:** Mở Safari → vào `https://locket-dns.YOUR_NAME.workers.dev/health`  
> Nếu thấy JSON `{"status":"ok"}` → Worker đang chạy tốt ✅

---

## 🔧 XỬ LÝ CÁC TÌNH HUỐNG ĐẶC BIỆT

---

### ❌ Tình huống 1: Mất Gold sau khi reinstall Locket

**Nguyên nhân:**  
Uninstall app xóa sạch cache Firebase Remote Config và RevenueCat trên máy. Khi cài lại, Locket đọc giá trị mặc định trong binary = Free tier.

**Cách fix:**
1. Tắt DNS profile (Cài đặt → VPN & Quản lý thiết bị → TducGold DNS → Tắt)
2. Bật Shadowrocket → chạy script Locket Gold
3. Mở Locket, lướt vài giây để Gold nạp vào cache
4. Kill app → Bật lại DNS profile → Kill Shadowrocket
5. Mở Locket → Gold trở lại ✅

---

### ❌ Tình huống 2: DNS không hoạt động trên WiFi trường/công ty/khách sạn (Captive Portal)

**Nguyên nhân:**  
Một số mạng WiFi dùng Captive Portal (màn hình đăng nhập WiFi). iOS bắt buộc phải dùng DNS của họ để hiển thị trang đăng nhập. DNS profile tự động bị tạm ngưng.

**Cách fix:**
- Đây là hành vi bình thường của iOS. Sau khi đăng nhập WiFi xong, DNS profile tự động bật lại.
- Nếu DNS vẫn không bật lại: Cài đặt → Wi-Fi → (i) → "Cấu hình DNS" → Kiểm tra đang dùng DNS nào.

---

### ❌ Tình huống 3: Gold mất sau khi đổi SIM hoặc reset network

**Nguyên nhân:**  
Reset mạng trên iOS (`Cài đặt → Cài đặt chung → Chuyển hoặc Đặt lại iPhone → Đặt lại → Cài đặt mạng`) sẽ **xóa toàn bộ DNS profile đã cài!**

**Cách fix:**  
Cài lại `TducGold_Worker.mobileconfig` từ đầu. Sau đó làm lại Bước 1 (Shadowrocket → cache).

---

### ❌ Tình huống 4: Locket báo lỗi mạng, không gửi được ảnh

**Nguyên nhân có thể:**
- Worker bị lỗi tạm thời (Cloudflare Worker có SLA 99.9%)
- Domain `api.locketcamera.com` bị chặn nhầm

**Cách kiểm tra:**
```bash
# Kiểm tra worker còn sống không (trên máy tính)
curl https://locket-dns.YOUR_NAME.workers.dev/health

# Kiểm tra domain có bị chặn không
curl "https://locket-dns.YOUR_NAME.workers.dev/dns-query?name=api.locketcamera.com&type=A"
```

**Cách fix nhanh:**  
Tắt DNS profile tạm thời → Thử gửi ảnh → Nếu được thì lỗi do DNS. Kiểm tra lại file `dns-worker.js`.

---

### ❌ Tình huống 5: Dùng VPN (ExpressVPN, NordVPN...) xung đột với DNS

**Nguyên nhân:**  
VPN thường tự đặt DNS riêng, ghi đè DNS profile của bạn.

**Giải pháp:**
- **Không thể dùng đồng thời VPN + DNS profile** trên iOS (giới hạn của Apple).
- Nếu cần VPN: Tắt DNS profile → Bật VPN. Cần chấp nhận một trong hai.
- Hoặc dùng VPN hỗ trợ custom DNS → set DNS của VPN trỏ về worker URL.

---

### ❌ Tình huống 6: iOS 18 thỉnh thoảng bỏ qua DNS profile

**Nguyên nhân:**  
Bug trên iOS 16-18: Khi app chạy background và mạng switch (WiFi ↔ 4G), iOS đôi khi dùng DNS cũ trong vài giây trước khi profile kịp load.

**Cách giảm thiểu:**
- Trong file mobileconfig, đã thêm `OnDemandRules` cho cả WiFi lẫn Cellular.
- Nếu vẫn gặp: Tắt/Bật Airplane Mode → iOS sẽ re-apply DNS profile ngay.

---

### ❌ Tình huống 7: Cloudflare Worker đạt giới hạn miễn phí (100k request/ngày)

**Triệu chứng:**  
Worker trả về HTTP 429. DNS không phân giải được → iPhone mất một phần mạng.

**Cách fix:**
- Gói miễn phí: 100,000 request/ngày = ~1 request/giây. Với DNS split (chỉ RevenueCat + Firebase), rất khó đạt giới hạn này.
- Nếu vẫn đạt: Vào Cloudflare Dashboard → Workers → Upgrade lên $5/tháng (10 triệu request).

---

### ❌ Tình huống 8: Muốn thêm domain chặn/mở mà không cài lại profile

**Cách:**  
Vào Cloudflare Dashboard → Worker → Edit Code → Thêm domain vào `BLOCKED_DOMAINS` hoặc `ALWAYS_ALLOWED_DOMAINS` → Save.  
Thay đổi có hiệu lực **ngay lập tức** mà không cần cài lại profile trên iPhone!

---

### ❌ Tình huống 9: Người dùng khác muốn dùng DNS của bạn

Họ chỉ cần cài file `TducGold_Worker.mobileconfig` là xong. Không cần Cloudflare account, không cần cấu hình gì thêm. Worker của bạn phục vụ được mọi người dùng.

---

### ❌ Tình huống 10: Muốn kiểm tra xem iPhone đang dùng DNS nào

**Cách 1:** Mở Safari → vào `https://1.1.1.1/cdn-cgi/trace` → xem dòng `loc=` và `uag=`

**Cách 2 (chính xác hơn):** Trên máy tính Linux (đã kết nối idevicesyslog):
```bash
idevicesyslog | grep -i "dns\|revenuecat"
```

---

## 📋 CHECKLIST ĐỦ CÁC ĐIỀU KIỆN ĐỂ GOLD VĨNH VIỄN

- [ ] Worker đã deploy và `/health` trả về OK
- [ ] `TducGold_Worker.mobileconfig` đã cài và đang **Bật** trên iPhone
- [ ] Đã chạy Shadowrocket với script Gold **ÍT NHẤT 1 LẦN** sau khi cài DNS
- [ ] Mở Locket, thấy badge Gold, thấy widget frame hoạt động
- [ ] Kill Locket → mở lại → vẫn còn Gold (không cần Shadowrocket nữa)
- [ ] Đợi 10 phút → mở lại → vẫn còn Gold ✅

---

## 🔍 DEBUG: Xem Worker log thực tế

```bash
# Cài Wrangler CLI
npm install -g wrangler
wrangler login

# Xem log real-time của worker
wrangler tail locket-dns
```

Output sẽ hiện từng domain được query:
```
[BLOCKED] api.revenuecat.com
[ALLOWED] firebaseremoteconfig.googleapis.com
[ALLOWED] api.locketcamera.com
```


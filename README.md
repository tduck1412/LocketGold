# Hướng dẫn cấu hình Frame Locket

### 1. Thay link Frame (Mục 6 trong file `js/Locket_Unlocked.js`):
- `FRAME_URL`: Dán link ảnh frame của bạn vào đây (hỗ trợ cả ảnh nền trắng lẫn PNG trong suốt).

### 2. Tự động xóa nền trắng qua Cloudinary:
- Đăng ký tài khoản miễn phí tại [cloudinary.com](https://cloudinary.com/users/register_free).
- Lấy **Cloud Name** trên Dashboard và điền vào biến `CLOUDINARY_CLOUD_NAME`.
- Vào **Settings (bánh răng) > Security > Kéo xuống Restricted media types > Bỏ tích ô "Fetched URL" > Nhấn Save**.
- Từ giờ bất kỳ ảnh nền trắng nào bạn dán vào `FRAME_URL` sẽ được tự động lọc nền trắng thành trong suốt.


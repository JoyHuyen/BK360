# BK360 — Hướng dẫn cho đội Media 🎨

Tài liệu này giúp đội nội dung/media bắt đầu nhập liệu cho ứng dụng **BK360 – Hành trình 70 năm**.

- **Trang xem (public):** https://limio.vn/BK360/
- **Trang quản trị:** vào trang trên → bấm biểu tượng 🔒 ở góc trên phải → đăng nhập.

---

## 1. Tài khoản

- Mỗi thành viên sẽ được cấp một tài khoản **Biên tập (EDITOR)**.
- Quản trị viên tạo tài khoản ở mục **👥 Người dùng** (chỉ SUPERADMIN thấy mục này):
  1. Bấm **+ Thêm tài khoản** → nhập email, tên, mật khẩu (≥ 6 ký tự), vai trò **Biên tập**.
  2. Gửi email + mật khẩu cho thành viên. Họ tự đổi mật khẩu sau bằng cách báo quản trị reset.
- Vai trò:
  - **Biên tập (EDITOR):** thêm/sửa địa điểm, media, sự kiện, import Excel.
  - **Quản trị cao nhất (SUPERADMIN):** thêm cả tài khoản người dùng.
  - **Chỉ xem (VIEWER):** chỉ đăng nhập xem, không sửa.

---

## 2. Hai cách nhập nội dung

### Cách A — Nhập trực tiếp trong trang Quản trị (khuyên dùng cho sửa lẻ)
Mục **📍 Địa điểm** → chọn một địa điểm hoặc **+ Thêm**. Mỗi địa điểm có 4 thẻ:

| Thẻ | Nội dung |
|-----|----------|
| **Thông tin** | Mã (slug), loại, ẩn/hiện, tên VI/EN, nhãn ngắn, năm, mô tả, lời thuyết minh |
| **Vị trí** | Bấm/kéo **pin 📍** đặt vị trí ngay trên bản đồ thật (xem mục 4) |
| **Media** | Ảnh **Xưa**, ảnh **Nay**, ảnh **360°**, **audio** thuyết minh — dán link hoặc tải file |
| **Lịch sử** | Dòng thời gian, mỗi mốc 1 dòng dạng `năm | nội dung` |

### Cách B — Import hàng loạt bằng Excel (khuyên dùng khi nhập nhiều)
Mục **📥 Nhập liệu**:
1. **Bước 1:** bấm **⬇️ Tải template Excel** → gửi file mẫu cho cả đội điền.
2. **Bước 2:** chọn file đã điền → xem trước số dòng → **✅ Áp dụng**.

> ⚠️ Giữ nguyên **tên các sheet** và **dòng tiêu đề (dòng 2)** trong file Excel. Chỉ điền từ dòng 3 trở đi.

---

## 3. Link ảnh / audio (Google Drive & OneDrive)

1. Tải ảnh/audio lên Google Drive hoặc OneDrive.
2. Đặt quyền chia sẻ: **"Bất kỳ ai có đường liên kết đều xem được"**.
3. Sao chép **link chia sẻ** rồi dán vào ô tương ứng (hoặc cột `link_anh_xua`, `link_anh_nay`, `link_anh_360`, `link_audio` trong Excel).
4. Hệ thống **tự chuyển** link chia sẻ sang link nhúng — không cần xử lý thủ công.

Hoặc bấm **Tải file** ngay trong thẻ Media để upload thẳng lên server (ảnh sẽ được tối ưu tự động).

> 🔴 **Ngày sự kiện (đông người xem):** ưu tiên **Tải file** lên server. Link Google Drive/OneDrive có thể bị Google/Microsoft **chặn khi hàng nghìn người truy cập cùng lúc** → ảnh không hiện.
> Nếu đã lỡ dán link ngoài: trong thẻ Media bấm **⬇️ Về server** — hệ thống tải file về server 1 lần rồi phục vụ ổn định (ô nào là link ngoài sẽ có nhãn **link ngoài** màu đỏ).

**Gợi ý loại file:**
- Ảnh Xưa/Nay: JPG/PNG ngang, nên ≥ 1600px.
- Ảnh 360°: ảnh **equirectangular** (tỉ lệ 2:1, ví dụ 4096×2048).
- Audio: MP3/M4A.

---

## 4. Toạ độ & đặt pin trên bản đồ

- Bản đồ dùng hệ toạ độ **X: 0–1250** (ngang), **Y: 0–1070** (dọc).
- Trong thẻ **Vị trí**: bấm thẳng lên bản đồ hoặc **kéo pin** để đặt — toạ độ hiển thị bên dưới và **khớp chính xác** với bản đồ người xem.
- Trong Excel: điền `map_x`, `map_y` theo hệ trên (có thể để trống rồi chỉnh pin sau).

Một vài vị trí tham khảo: C1 ≈ (427, 305) · Thư viện ≈ (647, 715) · Hội trường C2 ≈ (248, 450) · Cổng Parabol ≈ (92, 560).

---

## 5. Sự kiện 70 năm & lịch trình

Mục **⭐ Sự kiện**:
- Bật/tắt một sự kiện bằng công tắc (sự kiện tắt sẽ không hiện ở trang xem).
- **+ Thêm sự kiện** (vd: Khai giảng, BK Ngày trở về): nhập mã, icon, tên.
- **Lịch trình** — mỗi dòng: `giờ | mã địa điểm | live(1/0) | tiêu đề`.
  - `live = 1` → địa điểm đó hiển thị **tín hiệu 📡 LIVE** nhấp nháy trên bản đồ ở chế độ Sự kiện.

Trong Excel: sheet **SuKien** (sự kiện) + sheet **LichTrinh** (lịch trình, nối qua `su_kien_id`).

---

## 6. Nội dung hiển thị ở đâu trên app

| Trường nhập | Hiển thị tại |
|-------------|--------------|
| Tên, nhãn ngắn | Bản đồ 2D, danh sách VR360 |
| Mô tả, lịch sử | Bảng thông tin khi chạm địa điểm |
| Ảnh Xưa / Nay | Thanh trượt so sánh "Xưa & Nay" |
| Ảnh 360° | Chế độ VR360 (xoay 360°) |
| Audio / Thuyết minh | Nút 🎧 Nghe (có audio → phát file; không có → máy tự đọc) |

Mục **🏠 Tổng quan** có danh sách **"Cần bổ sung"** — liệt kê địa điểm còn thiếu mô tả/ảnh/360/audio/lịch sử để đội biết việc cần làm.

---

## 7. Quy trình đề xuất cho cả đội

1. Quản trị tạo tài khoản cho từng thành viên (mục Người dùng).
2. Tải template Excel, chia nhau điền nội dung + link ảnh/audio.
3. Import file → kiểm tra ở trang xem.
4. Tinh chỉnh vị trí pin & media trực tiếp trong Quản trị.
5. Theo dõi mục **Cần bổ sung** đến khi tất cả địa điểm đủ nội dung ✅.

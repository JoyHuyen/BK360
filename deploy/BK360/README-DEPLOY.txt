GÓI DEPLOY TĨNH — BK360  (chạy dưới http://limio.vn/BK360/)
==========================================================
Bản này KHÔNG cần server Node/DB — chỉ là file tĩnh, upload là chạy.

NỘI DUNG:
  index.html          → 2D map hotspot + Admin Import (mở mặc định)
  bk360-data.json     → dữ liệu (sinh từ Excel; admin Import sẽ ghi đè trong trình duyệt)
  ban-do-vetay.html   → bản đồ vẽ tay (tham khảo)
  assets/map.jpg      → ẢNH NỀN 2D map (bạn bỏ vào đây)

CÁCH UPLOAD (chọn 1):
  • cPanel / File Manager: vào thư mục public_html → tạo thư mục "BK360" → Upload toàn bộ nội dung thư mục này vào đó.
  • FTP (FileZilla): kéo cả thư mục "BK360" vào public_html.
  • SSH:  scp -r BK360 user@limio.vn:/var/www/html/   (hoặc đường dẫn web root)

KIỂM TRA:
  Mở http://limio.vn/BK360/  → thấy 2D map.
  Admin (góc trên) → mật khẩu demo: bk70 → Import Excel / Ảnh nền / Kiểm tra link.

LƯU Ý:
  - Mọi đường dẫn trong index.html đều TƯƠNG ĐỐI nên chạy được dưới /BK360/.
  - Dữ liệu admin import lưu trong trình duyệt (localStorage) của máy đang dùng — phù hợp để TEST.
    Khi cần nhiều người chỉnh chung + lưu tập trung → triển khai bản production (Node + PostgreSQL).
  - Cần HTTPS để bật micro/cảm biến; ảnh Drive/OneDrive nhớ để "Anyone with the link".

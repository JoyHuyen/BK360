# BK360 – Hành trình 70 năm · Tài liệu triển khai

> Ứng dụng tham quan ảo 360° Đại học Bách khoa Hà Nội, nhân kỷ niệm **70 năm (1956–2026)**.
> Prototype: 1 file [`index.html`](index.html) chạy được ngay trên trình duyệt, không cần build.

---

## 1. Tổng quan

| Hạng mục | Hiện trạng (prototype) | Mục tiêu sản phẩm thật |
|----------|------------------------|------------------------|
| Panorama 360° | Ảnh **mô phỏng** sinh bằng canvas | Ảnh 360° thật (equirectangular) |
| Ảnh "Xưa & Nay" | Mô phỏng đen-trắng/màu | Ảnh tư liệu cũ + ảnh hiện tại |
| Dữ liệu địa điểm | 5 điểm mẫu HUST | Bổ sung/điều chỉnh theo thực tế |
| Nội dung lịch sử | Tóm tắt sơ bộ | Xác minh với Phòng Truyền thống |
| Nền tảng | Web (PWA-ready) | Deploy lên domain trường |

**Công nghệ:** HTML/CSS/JS thuần · [Three.js](https://threejs.org) (cầu panorama) · [qrcodejs](https://github.com/davidshimjs/qrcodejs) (mã QR). Cả hai nạp qua CDN.

**Tính năng đã có:** xoay nhìn 360° (chuột/cảm ứng), chế độ con quay hồi chuyển trên điện thoại, hotspot di chuyển + xem lịch sử, bản đồ campus, danh sách điểm, dòng thời gian, slider Xưa & Nay, thuyết minh giọng nói (Web Speech), mã QR + in bảng QR, định tuyến theo `#id`.

---

## 2. Cấu trúc file `index.html`

| Vùng | Vị trí | Vai trò |
|------|--------|---------|
| `<style>` | đầu file | Toàn bộ giao diện, mobile-first + `@media print` |
| `LOCATIONS` | đầu `<script>` | **Dữ liệu địa điểm** – sửa ở đây là chính |
| `makePano()` | | Sinh panorama mô phỏng → **thay bằng ảnh thật** |
| `makeFacade()` | | Sinh ảnh Xưa/Nay mô phỏng → **thay bằng ảnh thật** |
| `initThree / animate` | | Dựng & render cầu 360° |
| `toggleGyro / onOrient` | | Chế độ xoay điện thoại |
| `buildHotspots / openInfo` | | Hotspot & panel lịch sử + Xưa&Nay |
| `openQR / printSheet` | | Mã QR & bảng in |

---

## 3. Chỉnh sửa dữ liệu địa điểm

Mỗi điểm là một object trong mảng `LOCATIONS`:

```js
{
  id:"library",                       // mã duy nhất, dùng cho URL #library và QR
  name:"Thư viện Tạ Quang Bửu",       // tên hiển thị
  short:"Thư viện",                   // nhãn ngắn trên bản đồ & danh sách
  year:"Khánh thành 2006",            // dòng phụ
  map:[205,76],                       // toạ độ pin trên bản đồ (viewBox 320×200)
  type:"spot",                        // "spot" hoặc "event" (điểm sự kiện, màu tím)
  palette:{sky:"#aacdf0",ground:"#7d8a6a",bld:"#1565c0"}, // màu panorama mô phỏng
  links:["c1","c2"],                  // các điểm tới được từ đây (hotspot di chuyển)
  pano:"images/360/library.jpg",      // (THÊM khi có ảnh thật – xem mục 4)
  before:"images/old/library.jpg",    // (THÊM ảnh xưa – xem mục 5)
  after:"images/new/library.jpg",     // (THÊM ảnh nay)
  history:[ {y:"2006", t:"..."}, ... ],
  desc:"Mô tả + dùng cho thuyết minh giọng nói"
}
```

**Thêm điểm mới:** copy một object, đổi `id`, đặt `map` (toạ độ trên ảnh nền 320×200), khai báo `links`. Pin và danh sách tự sinh.

---

## 4. Thay panorama mô phỏng bằng ảnh 360° thật

1. Đặt ảnh **equirectangular** (tỉ lệ **2:1**, ví dụ 4096×2048) vào `images/360/`.
2. Thêm trường `pano:"images/360/<id>.jpg"` cho mỗi điểm trong `LOCATIONS`.
3. Sửa hàm `loadLocation()` – đoạn nạp texture:

```js
// THAY khối makePano hiện tại bằng:
if(loc.pano){
  new THREE.TextureLoader().load(loc.pano, tex=>{
    sphere.material.map=tex; sphere.material.needsUpdate=true;
  });
}else{
  sphere.material.map=makePano(loc); sphere.material.needsUpdate=true; // fallback
}
```

> Giữ lại `makePano()` làm phương án dự phòng cho điểm chưa có ảnh.

---

## 5. Thay ảnh "Xưa & Nay" thật

Trong hàm `openInfo()`, đổi 2 dòng `<img>` của khối `.cmp`:

```js
<img class="before" src="${loc.before || makeFacade(loc,'xua')}" alt="xưa">
<img class="after"  id="cmpAfter" src="${loc.after || makeFacade(loc,'nay')}" alt="nay">
```

Khai báo `before` / `after` trong `LOCATIONS`. Nếu điểm nào chưa có ảnh, tự dùng ảnh mô phỏng.

> Mẹo: chuẩn hoá ảnh xưa & nay **cùng khung hình, cùng góc chụp** để slider so sánh ăn khớp.

---

## 6. Hướng dẫn chụp ảnh 360°

- **Thiết bị:** Insta360 ONE X2/X3, GoPro MAX, hoặc DSLR + đầu panorama. Xuất định dạng **equirectangular 2:1**.
- **Thời điểm:** sáng sớm/chiều muộn, trời quang, **ít người qua lại**.
- **Đặt máy:** chân máy cao ~1.6 m (tầm mắt), giữa không gian, cân bằng (level).
- **Hậu kỳ:** che chân máy (nadir patch), cân sáng, giảm dung lượng (~1–3 MB/ảnh để tải nhanh trên mạng trường).
- **Đặt tên** theo `id`: `parabol.jpg`, `c1.jpg`, `library.jpg`…
- Mỗi điểm 1 ảnh; các điểm liền kề nên có **góc nhìn thấy nhau** để hotspot di chuyển hợp lý.

---

## 7. Mã QR & triển khai tại sự kiện

- Nút **⊞** hiển thị QR điểm hiện tại; **In bảng tất cả điểm** sinh trang in 2 cột để dán tại trường.
- QR mã hoá URL `…/index.html#<id>` → quét vào **thẳng** điểm đó.
- Khi deploy lên domain thật, QR **tự dùng domain mới** (không cần sửa code). Hãy in QR **sau khi đã có domain chính thức**.

---

## 8. Deploy

Vì là web tĩnh, chọn 1 trong các cách:

| Cách | Phù hợp | Ghi chú |
|------|---------|---------|
| Hosting trường (Apache/Nginx) | Chính thức | Upload thư mục, trỏ subdomain `bk360.hust.edu.vn` |
| GitHub Pages / Netlify / Vercel | Nhanh, miễn phí | Kéo-thả thư mục, có HTTPS sẵn |
| Cloudflare Pages | Tải nhanh, CDN | Tốt cho lượng truy cập lớn dịp lễ |

**Yêu cầu quan trọng:**
- **HTTPS bắt buộc** – chế độ con quay (gyroscope) và thuyết minh chỉ chạy trên HTTPS.
- Nên **tải Three.js & qrcodejs về cùng thư mục** (thay link CDN) để không phụ thuộc mạng ngoài khi sự kiện đông.
- Thêm `manifest.json` + service worker để cài như app (PWA) – tuỳ chọn ở Phase 3.

---

## 9. Lộ trình đề xuất

- **Phase 1 – MVP (kịp lễ):** 5–10 điểm ảnh 360° thật + lịch sử đã xác minh + QR. ✅ Khung đã sẵn sàng.
- **Phase 2:** thuyết minh thu âm thật (thay giọng máy), ảnh Xưa & Nay tư liệu, lịch sự kiện theo giờ, song ngữ Việt/Anh.
- **Phase 3:** 1–2 mô hình 3D điểm nhấn (glTF + model-viewer), kính VR Cardboard, PWA cài đặt offline.

---

## 10. Việc cần chuẩn bị (ngoài kỹ thuật)

1. **Chốt danh sách điểm** quan trọng nhất (5–10).
2. **Xin tư liệu lịch sử & ảnh cũ** từ Phòng Truyền thống / cựu sinh viên (xác minh mốc thời gian).
3. **Lịch chụp ảnh 360°** (mượn/thuê thiết bị, chọn ngày trời đẹp).
4. **Đăng ký subdomain & SSL** với phòng CNTT của trường.
5. **Bản quyền ảnh/nhạc** thuyết minh nếu dùng nội dung bên ngoài.

---

*Tài liệu cho prototype `index.html`. Mọi thay đổi nội dung tập trung ở mảng `LOCATIONS`; thay ảnh thật ở mục 4–5; phần render và tính năng không cần đụng tới.*

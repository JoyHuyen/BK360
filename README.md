# BK360 — Hành trình 70 năm 🎓

Ứng dụng tham quan ảo Đại học Bách khoa Hà Nội nhân kỷ niệm **70 năm (1956–2026)**.

## 🌐 Demo (GitHub Pages)
Sau khi bật Pages: **https://JoyHuyen.github.io/BK360/**

> Bật Pages: repo → **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`** → Save. Đợi ~1 phút.

## Các trang (chạy tĩnh, không cần server)
| File | Mô tả |
|------|------|
| `index.html` | **Bản demo chính**: màn welcome + 3 chế độ (Bản đồ 2D · VR360 360° · Sự kiện 70 năm) + Admin (localStorage). Tự chứa, không cần backend. |
| `map2d-hotspot.html` | 2D map **ảnh nền + hotspot** + **Admin Import Excel** (Drive/OneDrive), Xưa/Nay, thuyết minh, kiểm tra link. |
| `ban-do-bk-vetay.html` | Bản đồ **vẽ tay dễ thương** (C1 mái vòm 9 ngọn + logo BK, C7 chữ E, B1, Thư viện, các cổng…). |
| `mo-phong-ban-do-bk.html` | Bản đồ phẳng mô phỏng theo bản đồ chính thức. |

## Nhập liệu
- `BK360-Template-2Dmap.xlsx` — template để nhóm nội dung điền (địa điểm, lịch sử, sự kiện, link ảnh/audio Drive/OneDrive, toạ độ %).
- `excel-to-data.py` — chuyển Excel → `bk360-data.json` (tự đổi link Drive/OneDrive sang link nhúng).

## Bản production (deploy server riêng)
Thư mục `production/` — full stack **NestJS API + React + PostgreSQL + Docker**: đăng nhập thật, phân quyền, upload media, đa ngôn ngữ, multi-project (sẵn `projectId`). Xem `production/README.md`.

## Admin (bản tĩnh)
Mở trang → nút 🔒 Admin → mật khẩu demo: `bk70` (chỉ dùng để thử; bản production dùng tài khoản thật).

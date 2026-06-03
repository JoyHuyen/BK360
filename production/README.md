# BK360 – Production scaffold (Giai đoạn 0–1)

Khung production cho BK360: **Nginx + API (NestJS) + PostgreSQL + Redis** chạy bằng Docker Compose, self-host trên server trường. Bao gồm xác thực JWT + RBAC, CRUD địa điểm/sự kiện, upload media, audit log và seed dữ liệu từ prototype.

> Giai đoạn 2 (Frontend React/Vite) sẽ build vào thư mục `web/`. Hiện `web/` là placeholder.

## Cấu trúc
```
production/
├─ docker-compose.yml      # nginx · api · postgres · redis
├─ .env.example            # copy thành .env, đổi secret
├─ nginx/nginx.conf        # reverse proxy + media tĩnh
├─ web/                    # (placeholder) frontend build
└─ api/                    # NestJS + Prisma
   ├─ prisma/schema.prisma # schema DB
   ├─ prisma/seed.ts       # seed admin + dữ liệu prototype
   └─ src/
      ├─ auth/             # login/refresh/logout/me (JWT + cookie refresh)
      ├─ common/           # guards (JWT, RBAC), decorators
      ├─ locations/        # CRUD địa điểm + ẩn/hiện
      ├─ campaigns/        # CRUD sự kiện + bật/tắt
      ├─ media/            # upload ảnh 360°/audio/xưa-nay
      ├─ audit/            # nhật ký thao tác
      └─ prisma/           # PrismaService
```

## Chạy nhanh (Docker)
```bash
cd production
cp .env.example .env          # ⚠️ đổi toàn bộ secret (DB pass, JWT, admin pass)
docker compose up -d --build  # khởi động; api tự chạy migrate khi start

# Seed dữ liệu lần đầu (admin + địa điểm + sự kiện)
docker compose exec api npm run seed
```
Mở: `http://localhost:8080` → placeholder. API: `http://localhost:8080/api/health`.

## Chạy API ở chế độ dev (không Docker)
```bash
cd api
npm install
# cần PostgreSQL + Redis đang chạy; đặt DATABASE_URL trỏ tới DB của bạn
npx prisma migrate dev --name init   # tạo migration + bảng
npm run seed
npm run start:dev
```

## API chính
| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/api/health`, `/api/config` | công khai |
| GET | `/api/locations`, `/api/locations/:slug` | công khai |
| GET | `/api/campaigns` (sự kiện đang bật) | công khai |
| POST | `/api/auth/login` → access token + cookie refresh | công khai |
| POST | `/api/auth/refresh`, `/api/auth/logout` | công khai (cookie) |
| GET | `/api/auth/me` | đã đăng nhập |
| GET/POST/PUT/DELETE | `/api/admin/locations...` | EDITOR+ |
| PATCH | `/api/admin/locations/:id/visibility` | EDITOR+ |
| GET/POST/PUT/DELETE | `/api/admin/campaigns...` | EDITOR+ |
| PATCH | `/api/admin/campaigns/:id/toggle` | EDITOR+ |
| POST/DELETE | `/api/admin/media...` (multipart `file`) | EDITOR+ |
| GET | `/api/admin/audit` | EDITOR+ |

**Đăng nhập (ví dụ):**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@bk360.local","password":"<ADMIN_PASSWORD>"}'
# → { user, accessToken }  (kèm cookie rt = refresh token, HttpOnly)

# Gọi API quản trị:
curl http://localhost:8080/api/admin/locations -H "Authorization: Bearer <accessToken>"
```

## Phân quyền (RBAC)
`SUPERADMIN > EDITOR > VIEWER`. Endpoint admin yêu cầu `EDITOR` trở lên. Mật khẩu hash bằng **argon2**; access token ngắn hạn + refresh token trong cookie HttpOnly.

## Bảo mật cần làm trước khi lên production
- Đổi **toàn bộ secret** trong `.env` (DB, `JWT_*`, admin password) — dùng `openssl rand -hex 32`.
- Đặt `COOKIE_SECURE=true` và chạy sau **HTTPS** (Let's Encrypt hoặc CA của trường).
- Thêm rate-limit đăng nhập (Redis) và CSP chặt trong `nginx.conf`.
- Bật backup `pg_dump` + media định kỳ (xem KIEN-TRUC-PRODUCTION.md mục 9).

## Frontend (Giai đoạn 2 — React/Vite)
Mã nguồn ở `web-src/`, build ra `web/` (Nginx phục vụ tĩnh). Gọi API thật, đa ngữ vi/en.

```bash
cd web-src
npm install
npm run dev      # dev: http://localhost:5173 (proxy /api → :3000)
npm run build    # build → ../web (cho docker nginx phục vụ)
```

Cấu trúc `web-src/src/`:
```
api.ts          # client gọi API + lưu access token
i18n.ts         # đa ngữ (vi/en) + lấy field i18n
generate.ts     # panorama & ảnh Xưa/Nay mô phỏng (fallback khi chưa có ảnh thật)
components/      # Panorama (three.js) · CampusMap (SVG + tín hiệu) · InfoPanel · CompareSlider
screens/         # Welcome · Map2D · Event · VR360 · Admin (login + CRUD gọi API)
```

Tính năng FE: 3 chế độ (Bản đồ 2D / VR360 / Sự kiện), panel Xưa & Nay + dòng thời gian + thuyết minh, tín hiệu LIVE theo chiến dịch, admin đăng nhập + sửa địa điểm/sự kiện qua API. Khi có ảnh 360°/ảnh tư liệu thật (upload qua admin → media), FE tự dùng thay ảnh mô phỏng.

## Giai đoạn 3 — Nâng cao (đã có)
- **PWA offline**: cài như app; service worker cache app-shell + API (NetworkFirst) + media (CacheFirst). Cấu hình ở `web-src/vite.config.ts` (VitePWA). Dùng được khi mạng yếu tại sự kiện.
- **Code-split**: VR360 (kéo theo three.js) và Admin tách thành chunk riêng, chỉ tải khi mở → bundle khởi động **~159KB** (trước ~630KB).
- **Gyroscope + fullscreen** trong VR360: nút "🧭 Xoay máy" (nghiêng điện thoại để nhìn quanh) + "⛶" toàn màn hình. iOS 13+ tự xin quyền cảm biến.
- **Rate-limit** (backend): `@nestjs/throttler` — 120 req/phút/IP toàn cục, **5 lần/phút** cho `/api/auth/login`. Đa instance nên cấu hình storage Redis.
- **Pipeline ảnh** (backend): upload ảnh → `sharp` sinh bản **WebP tối ưu** (PANO360 ≤4096px, ảnh thường ≤1600px) + ghi kích thước vào `media.meta.optimized`.

## Việc tiếp theo (Giai đoạn 4+)
- Icon PWA dạng PNG đa kích thước (hiện dùng `icon.svg`); tách thêm chunk theo route.
- 3D điểm nhấn (glTF + `<model-viewer>`), kính VR Cardboard (stereo).
- Throttler dùng Redis storage; monitoring (Prometheus/Grafana hoặc Netdata) + Uptime Kuma.
- Sinh tile ảnh 360° (đa mức) + AVIF; CDN/Cloudflare đứng trước.

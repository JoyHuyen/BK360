# BK360 – Kế hoạch kiến trúc Production

> Chuyển BK360 từ prototype (1 file HTML, dữ liệu client-side, ảnh mô phỏng) thành **sản phẩm production đầy đủ**, **self-host trên hạ tầng Đại học Bách khoa Hà Nội**.
> Phạm vi: dài hạn, đa ngôn ngữ, 3D, PWA offline, admin phân quyền, chịu tải dịp lễ.

---

## 1. Mục tiêu & nguyên tắc

| Mục tiêu | Yêu cầu cụ thể |
|----------|----------------|
| Trải nghiệm | VR360 ảnh thật, bản đồ 2D, lịch sử, Xưa/Nay, sự kiện, thuyết minh |
| Quản trị | Admin thật: đăng nhập, phân quyền, CRUD địa điểm/sự kiện/media, audit log |
| Hạ tầng | **Self-host** trên server trường, HTTPS, sao lưu, khôi phục |
| Chịu tải | Hàng nghìn lượt quét QR đồng thời dịp lễ (đọc nhiều, ghi ít) |
| Bền vững | Dễ vận hành, cập nhật nội dung không cần lập trình viên |

**Nguyên tắc kiến trúc:**
- **Tách media khỏi app** — ảnh 360°/audio phục vụ qua web server tĩnh + cache, không qua app.
- **Đọc nhiều – ghi ít** → tối ưu cache mạnh cho nội dung công khai.
- **Stateless backend** → dễ chạy nhiều bản, dễ khởi động lại.
- **Hạ tầng dạng container** → tái lập môi trường dev = staging = prod.

---

## 2. Sơ đồ kiến trúc tổng thể (self-host)

```
                 Internet / khách tham quan (điện thoại)
                              │  HTTPS (443)
                  ┌───────────▼───────────┐
                  │   Nginx (reverse proxy │  ← TLS, gzip/brotli, cache tĩnh,
                  │   + static + cache)    │     rate-limit, security headers
                  └───┬──────────┬─────────┘
        /api/* (động) │          │ /, /assets, /media/* (tĩnh)
            ┌─────────▼───┐   ┌──▼─────────────────────┐
            │  Backend API │   │  Frontend build (SPA)  │
            │ (Node/NestJS │   │  + Media store (360°,  │
            │  hoặc tương) │   │   audio, ảnh xưa/nay)  │
            └───┬─────┬────┘   └────────────────────────┘
        ┌───────▼─┐ ┌─▼────────┐
        │PostgreSQL│ │  Redis   │  ← cache + session/rate-limit
        └──────────┘ └──────────┘
            │
        ┌───▼─────────────┐
        │ Backup (pg_dump  │  → lưu off-site / NAS trường
        │ + media rsync)   │
        └──────────────────┘
```

Tất cả service chạy trong **Docker Compose** trên 1 (hoặc cụm) VM của trường.

---

## 3. Tech stack đề xuất

| Lớp | Lựa chọn chính | Vì sao |
|-----|----------------|--------|
| Frontend | **React + Vite + TypeScript**, **three.js** (VR360), **MapLibre/SVG** (bản đồ), **i18next** (đa ngữ), **Workbox** (PWA) | Hệ sinh thái lớn, build tĩnh, dễ tuyển người |
| Backend | **Node.js + NestJS (TypeScript)** REST API (có thể thêm GraphQL sau) | Cùng ngôn ngữ FE, cấu trúc rõ, validation/DI sẵn |
| Database | **PostgreSQL 16** | Quan hệ, JSONB cho nội dung linh hoạt, ổn định, free |
| Cache/session | **Redis** | Cache nội dung công khai, rate-limit, session |
| Media | File trên đĩa + Nginx; tùy chọn **MinIO** (S3 tự host) | Self-host hoàn toàn, không phụ thuộc cloud |
| Auth | **JWT (access) + refresh cookie HttpOnly**, bcrypt/argon2 | Chuẩn, stateless, hợp self-host |
| Reverse proxy | **Nginx** (TLS, cache, nén, headers) | Chuẩn self-host, hiệu năng cao |
| Container | **Docker + Docker Compose** | Tái lập môi trường, dễ bàn giao |
| CI/CD | **GitLab CI** (hoặc GitHub Actions + runner nội bộ) | Build/test/deploy tự động |
| Giám sát | **Prometheus + Grafana + Loki** (hoặc Netdata gọn nhẹ) | Theo dõi tải, log, cảnh báo |

> Phương án thay thế nhẹ hơn nếu đội nhỏ: backend **Node + Fastify + Prisma**; giám sát **Netdata + Uptime Kuma**.

---

## 4. Frontend production

- **Chuyển từ 1 file HTML → dự án Vite/React** có module hoá: `VR360Viewer`, `Map2D`, `EventMode`, `InfoPanel`, `AdminPanel`.
- **VR360 ảnh thật**: thay `makePano()` bằng `TextureLoader` tải ảnh equirectangular; hỗ trợ **đa độ phân giải** (tải bản nhẹ trước, nét sau) hoặc **tiles** cho ảnh lớn.
- **Đa ngôn ngữ (Việt/Anh…)**: nội dung lưu đa ngữ trong DB; FE chọn theo `i18next` + cờ ngôn ngữ.
- **PWA offline**: service worker (Workbox) cache app shell + media các điểm chính → dùng được khi mạng yếu tại sự kiện. Có nút "Tải gói offline".
- **3D điểm nhấn**: `model-viewer`/three.js tải glTF cho Cổng Parabol, v.v.
- **SEO/chia sẻ**: prerender trang từng điểm (thẻ OpenGraph) để link cựu SV chia sẻ đẹp.
- Build ra tĩnh → Nginx phục vụ + cache dài hạn (hash file).

---

## 5. Thiết kế API (REST, ví dụ)

**Công khai (đọc, cache mạnh):**
```
GET  /api/locations                 # danh sách điểm (đã publish, không ẩn)
GET  /api/locations/:id             # chi tiết: lịch sử, media, voice
GET  /api/campaigns?active=1        # sự kiện đang bật + lịch trình
GET  /api/config                    # cấu hình hiển thị (ngôn ngữ, bản đồ)
```

**Quản trị (cần JWT + quyền):**
```
POST   /api/auth/login              # trả access token + set refresh cookie
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/admin/locations         # tạo
PUT    /api/admin/locations/:id     # sửa
DELETE /api/admin/locations/:id
PUT    /api/admin/locations/:id/visibility   # ẩn/hiện pin
POST   /api/admin/media             # upload ảnh 360°/xưa-nay/audio (multipart)
POST   /api/admin/campaigns         # tạo sự kiện (Khai giảng, Ngày trở về…)
PUT    /api/admin/campaigns/:id     # sửa lịch trình
PUT    /api/admin/campaigns/:id/toggle   # bật/tắt
GET    /api/admin/audit             # nhật ký thao tác
```

Mọi response công khai gắn `ETag`/`Cache-Control`; Nginx + Redis cache; admin ghi → **purge cache** liên quan.

---

## 6. Lược đồ Database (PostgreSQL)

```sql
users        (id, email, password_hash, role, name, created_at, last_login)
             -- role: 'superadmin' | 'editor' | 'viewer'
locations    (id, slug, type, map_x, map_y, shape_json, palette_json,
              is_hidden, order_idx, created_at, updated_at)
location_i18n(location_id, lang, name, short, year, description, voice_text)
history_items(id, location_id, year_label, content, order_idx)
media        (id, location_id, kind, url, lang, meta_json)
             -- kind: 'pano360' | 'old' | 'now' | 'audio' | 'model3d'
campaigns    (id, slug, icon, enabled, starts_at, ends_at, created_at)
campaign_i18n(campaign_id, lang, name, description)
schedule     (id, campaign_id, time, location_id, is_live, order_idx)
campaign_i18n_items (schedule_id, lang, title)
audit_log    (id, user_id, action, entity, entity_id, diff_json, at)
```

- Nội dung đa ngữ tách bảng `_i18n` → thêm ngôn ngữ không đổi schema.
- `voice_text` dùng cho TTS; nếu thu âm thật thì lưu file ở `media(kind='audio')`.

---

## 7. Xác thực & phân quyền (thay password cứng)

- **Đăng nhập** bằng email + mật khẩu (hash **argon2/bcrypt**), KHÔNG còn mật khẩu hard-code.
- **JWT access token** (ngắn hạn ~15') + **refresh token** trong cookie **HttpOnly + Secure + SameSite**.
- **RBAC 3 vai trò**:
  - `superadmin`: toàn quyền + quản lý người dùng.
  - `editor`: CRUD nội dung, không quản user.
  - `viewer`: chỉ xem trang quản trị (báo cáo).
- **Bảo vệ**: rate-limit đăng nhập, khoá tạm sau N lần sai, **audit log** mọi thay đổi (ai – sửa gì – khi nào).
- Tùy chọn: tích hợp **SSO/LDAP của trường** để dùng tài khoản cán bộ.

---

## 8. Pipeline media (ảnh 360°, audio, Xưa/Nay)

1. **Upload** qua admin (multipart) → backend kiểm định loại/dung lượng.
2. **Xử lý**:
   - Ảnh 360° equirectangular → tạo **nhiều mức** (2k/4k/8k) + bản preview mờ; tùy chọn cắt **tiles**.
   - Ảnh Xưa/Nay → chuẩn hoá khung, nén **WebP/AVIF**.
   - Audio thuyết minh → chuẩn hoá, nén (mp3/opus).
3. **Lưu**: thư mục `media/` (hoặc MinIO bucket). Tên theo `id` + hash để cache vĩnh viễn.
4. **Phục vụ**: Nginx trả trực tiếp, cache dài hạn; bật **brotli/gzip**, **HTTP/2**.
5. Có thể đặt **Cloudflare (free) đứng trước** chỉ để CDN/chống DDoS dù vẫn self-host gốc.

---

## 9. Hạ tầng self-host trên server trường

**Yêu cầu VM (đề xuất tối thiểu cho dịp lễ):**
- 4 vCPU / 8 GB RAM / 100 GB SSD (ảnh 360° chiếm nhiều — dự trù dung lượng theo số điểm).
- Ubuntu Server LTS, mở **443** ra ngoài (qua tường lửa trường), 80 → redirect 443.
- Tên miền/subdomain: vd `bk360.hust.edu.vn` (xin DNS + chứng chỉ).

**Thành phần (Docker Compose):**
```
services: nginx · frontend(static) · api(nestjs) · postgres · redis · (minio?) · backup
```
- **HTTPS**: Let's Encrypt (certbot) **hoặc** chứng chỉ do trung tâm CNTT trường cấp.
- **Process**: container tự restart; healthcheck; `api` chạy ≥2 bản sau Nginx để rolling update.
- **Backup**: cron `pg_dump` hằng ngày + `rsync` media → NAS/ô đĩa khác; kiểm thử khôi phục định kỳ.
- **Bảo mật máy chủ**: fail2ban, cập nhật bản vá, chỉ mở cổng cần thiết, tách user.

---

## 10. Bảo mật (checklist)

- [ ] HTTPS bắt buộc + HSTS; **gyroscope & TTS chỉ chạy trên HTTPS**.
- [ ] Security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- [ ] Validate & sanitize toàn bộ input (chống XSS/SQLi); ORM tham số hoá.
- [ ] Rate-limit API ghi & đăng nhập (Redis).
- [ ] Mật khẩu hash argon2; refresh token xoay vòng; logout thu hồi.
- [ ] Giới hạn loại/dung lượng upload; quét tên file; lưu ngoài web-root nếu cần.
- [ ] Audit log + sao lưu log; phân quyền tối thiểu (least privilege).
- [ ] Secrets qua biến môi trường/`.env` (không commit); cân nhắc Vault.

---

## 11. DevOps: môi trường, CI/CD, giám sát

- **3 môi trường**: `dev` (máy lập trình) → `staging` (thử nghiệm nội bộ) → `prod`.
- **CI/CD** (GitLab CI / Actions):
  - Pipeline: lint → test → build image → push registry → deploy (SSH/compose) lên staging → duyệt → prod.
  - Migration DB tự động (Prisma/TypeORM) có kiểm soát.
- **Giám sát & cảnh báo**:
  - Uptime (Uptime Kuma), metrics (Prometheus/Grafana hoặc Netdata), log tập trung (Loki).
  - Cảnh báo qua email/Telegram khi CPU/RAM/đĩa/độ trễ vượt ngưỡng — quan trọng **ngày lễ**.

---

## 12. Hiệu năng & chịu tải (đặc thù ngày lễ)

- Nội dung công khai **gần như tĩnh** → cache tầng Nginx + Redis + trình duyệt → chịu tải rất tốt.
- Ảnh 360° nén nhiều mức + lazy-load + preconnect; tránh tải ảnh 8k trên 3G.
- **Tải thử (load test)** trước lễ (k6/Locust) mô phỏng vài nghìn lượt quét QR đồng thời.
- Bật **PWA offline** để giảm phụ thuộc Wi-Fi tại trường.
- Có **trang tĩnh dự phòng** (fallback) nếu API quá tải — vẫn xem được điểm chính.

---

## 13. Tính năng đầy đủ (dài hạn)

- 🌐 **Đa ngôn ngữ** Việt/Anh (mở rộng được).
- 🧊 **3D** điểm nhấn (glTF) + kính VR Cardboard.
- 📲 **PWA** cài đặt & dùng offline.
- 👥 **Admin phân quyền** + nhật ký thao tác + quản lý người dùng.
- 🗓️ **Nhiều chiến dịch sự kiện** (70 năm, Khai giảng, BK Ngày trở về) bật/tắt + tín hiệu LIVE.
- 🎧 **Thuyết minh**: TTS hoặc audio thu âm thật, đa ngữ.
- 📊 **Analytics** (lượt xem từng điểm, đường đi, thiết bị) — tự host Matomo để giữ dữ liệu.
- 🔗 **QR động** theo domain; trang chia sẻ OpenGraph.

---

## 14. Migration từ prototype → production

1. **Trích dữ liệu**: chuyển `LOCATIONS`, `BUILDINGS`, `CAMPAIGNS` (đang hard-code/localStorage) thành **seed** nhập vào PostgreSQL.
2. **Tách media**: thay panorama/Xưa-Nay mô phỏng bằng **ảnh thật** đưa vào media store.
3. **Refactor FE**: bê logic three.js/bản đồ/sự kiện hiện có sang component React; giữ nguyên UX đã chốt.
4. **Backend hoá admin**: thay localStorage bằng API + DB; thay mật khẩu cứng bằng auth thật.
5. **Kiểm thử** song song với prototype để đảm bảo không hụt tính năng.

> Prototype hiện tại đóng vai trò **đặc tả sống (living spec)** — UX đã được duyệt, production chỉ "thay ruột".

---

## 15. Lộ trình, nhân sự, ước lượng

| Giai đoạn | Nội dung | Thời gian* | Vai trò |
|-----------|----------|-----------|---------|
| 0. Khởi tạo | Hạ tầng, repo, CI/CD, domain, HTTPS | 1–2 tuần | DevOps |
| 1. Backend + DB | Schema, API, auth, admin | 3–4 tuần | BE |
| 2. Frontend | Port prototype → React, VR360 ảnh thật | 3–5 tuần | FE |
| 3. Media + nội dung | Chụp 360°, xử lý, nhập liệu, thuyết minh | 2–4 tuần (song song) | Nội dung + media |
| 4. Đa ngữ/3D/PWA | Tính năng nâng cao | 2–3 tuần | FE |
| 5. Kiểm thử + tải thử + bảo mật | QA, load test, pentest nhẹ | 1–2 tuần | Cả nhóm |
| 6. Go-live + vận hành | Triển khai, giám sát, runbook | liên tục | DevOps |

*Ước lượng cho đội ~3–4 người (1 BE, 1–2 FE, 1 DevOps kiêm QA) + nhóm nội dung. Có thể rút gọn nếu chốt MVP trước.

**Nhân sự tối thiểu:** 1 Backend, 1 Frontend, 1 DevOps (kiêm), 1 phụ trách nội dung/ảnh 360°.

---

## 16. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|--------|-----------|
| Quá tải ngày lễ | Cache mạnh, PWA offline, load test, fallback tĩnh, Cloudflare phía trước |
| Mất dữ liệu | Backup hằng ngày + kiểm thử khôi phục + lưu off-site |
| Chậm có ảnh 360° | Chốt danh sách sớm, thuê thiết bị, ưu tiên điểm chính trước |
| Chính sách CNTT trường | Làm việc sớm về domain/SSL/cổng/đặt máy; tuân thủ bảo mật |
| Phụ thuộc CDN ngoài | Tự host media; CDN chỉ là lớp tăng tốc tùy chọn |

---

## 17. Vận hành & bàn giao

- **Runbook**: hướng dẫn khởi động/khởi động lại, deploy, khôi phục backup, xử lý sự cố thường gặp.
- **Sổ tay nội dung**: cách thêm/sửa địa điểm, sự kiện, upload ảnh 360°/thuyết minh cho cán bộ không chuyên IT.
- **Tài khoản & phân quyền** bàn giao cho đơn vị quản lý (Phòng Truyền thống/CNTT).
- **Bảo trì**: lịch cập nhật bản vá, gia hạn chứng chỉ (tự động hoá certbot), kiểm tra backup hằng tháng.

---

## Tóm tắt khuyến nghị

> **Self-host trên VM Ubuntu của trường**, toàn bộ chạy **Docker Compose**: Nginx (TLS + cache) → Frontend tĩnh (React/Vite) + API (NestJS) + PostgreSQL + Redis + media store. Auth JWT + RBAC thay mật khẩu cứng. Cache mạnh cho nội dung công khai để chịu tải ngày lễ; PWA offline làm lớp dự phòng. Bắt đầu từ **Giai đoạn 0–1** (hạ tầng + backend) song song **chụp ảnh 360° thật**.

---

*Tài liệu kiến trúc cho BK360. Bước tiếp theo đề xuất: chốt hạ tầng với phòng CNTT (domain, SSL, VM) và khởi tạo repo + CI/CD (Giai đoạn 0).*

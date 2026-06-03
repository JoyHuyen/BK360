#!/usr/bin/env python3
"""Chuyển BK360-Template-2Dmap.xlsx -> bk360-data.json (dữ liệu cho 2D map).
Dùng:  python3 excel-to-data.py [file.xlsx] [assets_base]
"""
import sys, json, re, base64, openpyxl

# --- Tự chuyển link CHIA SẺ Google Drive / OneDrive -> link nhúng trực tiếp ---
_GID = [re.compile(r"/file/d/([\w-]+)"), re.compile(r"[?&]id=([\w-]+)")]
def _drive_id(u):
    for rx in _GID:
        m = rx.search(u)
        if m: return m.group(1)
    return None
def normalize(v, kind="image"):
    u = str(v).strip() if v else ""
    if not u: return None
    low = u.lower()
    if "drive.google.com" in low or "docs.google.com" in low:
        gid = _drive_id(u)
        if gid:
            return (f"https://drive.google.com/thumbnail?id={gid}&sz=w2000"
                    if kind == "image"
                    else f"https://drive.google.com/uc?export=download&id={gid}")
        return u
    if "1drv.ms" in low or "onedrive.live.com" in low or "sharepoint.com" in low:
        enc = base64.urlsafe_b64encode(u.encode()).decode().rstrip("=")
        return f"https://api.onedrive.com/v1.0/shares/u!{enc}/root/content"
    return u  # link trực tiếp khác giữ nguyên

XLSX = sys.argv[1] if len(sys.argv) > 1 else "BK360-Template-2Dmap.xlsx"
ASSET = sys.argv[2] if len(sys.argv) > 2 else "assets"   # tiền tố đường dẫn ảnh/audio

def rows(ws):
    headers = [ws.cell(row=2, column=c).value for c in range(1, ws.max_column+1)]
    out = []
    for r in range(3, ws.max_row+1):
        vals = [ws.cell(row=r, column=c).value for c in range(1, ws.max_column+1)]
        if all(v in (None, "") for v in vals):
            continue
        out.append({h: (v if v is not None else "") for h, v in zip(headers, vals)})
    return out

def yes(v): return str(v).strip().lower() in ("có", "co", "yes", "x", "1", "true")

wb = openpyxl.load_workbook(XLSX, data_only=True)

# lịch sử gom theo địa điểm
hist = {}
for h in rows(wb["LichSu"]):
    hist.setdefault(str(h["dia_diem_id"]), []).append(
        {"order": h.get("thu_tu") or 0, "year": str(h.get("nam") or ""), "content": h.get("noi_dung") or ""})
for k in hist:
    hist[k].sort(key=lambda x: x["order"])
    for x in hist[k]:
        x.pop("order", None)

locations = []
for d in rows(wb["DiaDiem"]):
    lid = str(d["id"]).strip()
    if not lid:
        continue
    locations.append({
        "id": lid,
        "type": (str(d.get("loai") or "spot").strip().lower()),
        "mapX": d.get("map_x") or None,
        "mapY": d.get("map_y") or None,
        "hidden": not yes(d.get("hien") or "Có"),
        "i18n": {
            "vi": {"name": d.get("ten_vi") or lid, "short": d.get("nhan_ngan") or "",
                   "year": d.get("nam") or "", "description": d.get("mo_ta_vi") or "",
                   "voiceText": d.get("thuyet_minh_vi") or ""},
            "en": {"name": d.get("ten_en") or "", "description": d.get("mo_ta_en") or ""},
        },
        "media": {
            "old": normalize(d.get("link_anh_xua"), "image"),
            "now": normalize(d.get("link_anh_nay"), "image"),
            "pano360": normalize(d.get("link_anh_360"), "image"),
            "audio": normalize(d.get("link_audio"), "audio"),
        },
        "history": hist.get(lid, []),
    })

# lịch trình gom theo sự kiện
sched = {}
for t in rows(wb["LichTrinh"]):
    sched.setdefault(str(t["su_kien_id"]), []).append({
        "time": str(t.get("gio") or ""), "loc": str(t.get("dia_diem_id") or ""),
        "live": yes(t.get("dang_dien_ra")),
        "title": {"vi": t.get("tieu_de_vi") or "", "en": t.get("tieu_de_en") or ""}})

campaigns = []
for s in rows(wb["SuKien"]):
    sid = str(s["id"]).strip()
    if not sid:
        continue
    campaigns.append({
        "id": sid, "icon": s.get("icon") or "⭐", "enabled": yes(s.get("bat")),
        "i18n": {"vi": {"name": s.get("ten_vi") or sid}, "en": {"name": s.get("ten_en") or ""}},
        "schedule": sched.get(sid, []),
    })

data = {"locations": locations, "campaigns": campaigns}
with open("bk360-data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print(f"WROTE bk360-data.json — {len(locations)} địa điểm, {len(campaigns)} sự kiện")

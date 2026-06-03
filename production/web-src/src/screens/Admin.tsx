import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { api, setToken } from '../api';
import type { Lang, Location, Campaign, User, Project, Vr360Config, Scene } from '../types';
import Panorama from '../components/Panorama';

/* ---------- helpers: chuẩn hoá link Drive/OneDrive ---------- */
function driveId(u: string) {
  const m = u.match(/\/file\/d\/([\w-]+)/) || u.match(/[?&]id=([\w-]+)/);
  return m ? m[1] : null;
}
function normalize(v: any, kind: 'image' | 'audio') {
  const u = (v == null ? '' : String(v)).trim();
  if (!u) return '';
  const low = u.toLowerCase();
  if (low.includes('drive.google.com') || low.includes('docs.google.com')) {
    const id = driveId(u);
    if (id)
      return kind === 'image'
        ? `https://drive.google.com/thumbnail?id=${id}&sz=w2000`
        : `https://drive.google.com/uc?export=download&id=${id}`;
    return u;
  }
  if (low.includes('1drv.ms') || low.includes('onedrive.live.com') || low.includes('sharepoint.com')) {
    const enc = btoa(unescape(encodeURIComponent(u))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `https://api.onedrive.com/v1.0/shares/u!${enc}/root/content`;
  }
  return u;
}
const yes = (v: any) => ['có', 'co', 'yes', 'x', '1', 'true'].includes(String(v == null ? '' : v).trim().toLowerCase());

// Bản đồ nền dùng chung với public (CampusMap). Toạ độ pin nằm trong hệ này.
const MAP_URL = `${import.meta.env.BASE_URL}campus-map.svg`;
const MAP_W = 1250;
const MAP_H = 1070;

// Bộ icon line đồng bộ (stroke currentColor) cho toàn admin.
function NavIcon({ name, size = 20 }: { name: string; size?: number }) {
  const p: Record<string, any> = {
    dashboard: (<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>),
    image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>),
    pin: (<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>),
    globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" /></>),
    calendar: (<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>),
    upload: (<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></>),
    users: (<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
    eye: (<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>),
    logout: (<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>),
    edit: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></>),
    trash: (<><path d="M3 6h18" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>),
    plus: (<path d="M12 5v14M5 12h14" />),
    'chevron-up': (<path d="M18 15l-6-6-6 6" />),
    'chevron-down': (<path d="M6 9l6 6 6-6" />),
    check: (<path d="M20 6L9 17l-5-5" />),
    arrow: (<><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></>),
    link: (<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>),
    home: (<><path d="M3 9.5L12 3l9 6.5" /><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" /></>),
  };
  return (
    <svg className="nav-ic" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">{p[name]}</svg>
  );
}

// Sidebar gom nhóm theo tính năng: Bản đồ 2D · VR360 · Sự kiện · Hệ thống.
const NAV_GROUPS: { title?: string; items: { id: string; icon: string; label: string; super?: boolean }[] }[] = [
  { items: [
    { id: 'overview', icon: 'dashboard', label: 'Dashboard' },
    { id: 'welcome', icon: 'home', label: 'Trang chào' },
  ] },
  {
    title: 'Bản đồ 2D',
    items: [
      { id: 'map', icon: 'image', label: 'Ảnh nền 2D' },
      { id: 'locations', icon: 'pin', label: 'Địa điểm' },
    ],
  },
  {
    title: 'VR360',
    items: [{ id: 'vr360', icon: 'globe', label: 'Điểm 360 & tour' }],
  },
  {
    title: 'Sự kiện',
    items: [{ id: 'campaigns', icon: 'calendar', label: 'Lịch sự kiện' }],
  },
  {
    title: 'Hệ thống',
    items: [
      // Tạm ẩn Nhập liệu (bật lại: bỏ comment dòng dưới)
      // { id: 'import', icon: 'upload', label: 'Nhập liệu' },
      { id: 'users', icon: 'users', label: 'Người dùng', super: true },
    ],
  },
];

// Tỉ lệ khung khuyến nghị theo loại ảnh (để CẢNH BÁO khi lệch — không chặn).
const RATIO_EXP: Record<string, { r: number; label: string }> = {
  old: { r: 16 / 10, label: '16:10' },
  now: { r: 16 / 10, label: '16:10' },
  pano360: { r: 2 / 1, label: '2:1' },
};
const RATIO_TOL = 0.12; // sai số ±12%

export default function Admin(props: {
  lang: Lang;
  user: User | null;
  setUser: (u: User | null) => void;
  onBack: () => void;
  reloadPublic: () => void;
}) {
  if (!props.user) return <Login onLogin={props.setUser} onBack={props.onBack} />;
  return <Dashboard {...props} user={props.user} />;
}

/* ===================== LOGIN ===================== */
function Login({ onLogin, onBack }: { onLogin: (u: User) => void; onBack: () => void }) {
  const [email, setEmail] = useState('admin@bk360.local');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const submit = async () => {
    try {
      const r = await api.login(email, password);
      setToken(r.accessToken);
      onLogin(r.user);
    } catch (e: any) {
      setErr(e.message || 'Đăng nhập thất bại');
    }
  };
  return (
    <div className="screen show login-screen">
      <div className="login-card">
        <h3>🔒 Đăng nhập quản trị BK360</h3>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Mật khẩu" value={password}
          onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        {err && <div className="err">{err}</div>}
        <div className="am-acts">
          <button className="aprim" onClick={submit}>Đăng nhập</button>
          <button className="asec" onClick={onBack}>Huỷ</button>
        </div>
      </div>
    </div>
  );
}

/* ===================== DASHBOARD ===================== */
function Dashboard({ user, setUser, onBack, reloadPublic }: any) {
  const [nav, setNav] = useState('locations');
  const [locs, setLocs] = useState<Location[]>([]);
  const [camps, setCamps] = useState<Campaign[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const reload = async () => {
    setLocs(await api.adminLocations());
    setCamps(await api.adminCampaigns());
    setProject(await api.project().catch(() => null));
    reloadPublic();
  };
  useEffect(() => { reload(); }, []);
  const logout = async () => { await api.logout().catch(() => {}); setToken(null); setUser(null); onBack(); };
  const isSuper = user.role === 'SUPERADMIN';
  const groups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !i.super || isSuper) })).filter((g) => g.items.length);
  const label = groups.flatMap((g) => g.items).find((n) => n.id === nav)?.label || '';

  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <div className="adm-brand">
          <span className="adm-logo">BK</span>
          <span className="brand-txt">BK360<small>Quản trị</small></span>
        </div>
        {groups.map((g, gi) => (
          <div className="adm-grp" key={gi}>
            {g.title && <div className="adm-grp-title">{g.title}</div>}
            {g.items.map((n) => (
              <button key={n.id} className={nav === n.id ? 'on' : ''} onClick={() => setNav(n.id)}>
                <NavIcon name={n.icon} /><span className="lbl">{n.label}</span>
              </button>
            ))}
          </div>
        ))}
        <div className="adm-spacer" />
        <button onClick={onBack}><NavIcon name="eye" /><span className="lbl">Về trang xem</span></button>
        <button onClick={logout}><NavIcon name="logout" /><span className="lbl">Đăng xuất</span></button>
      </aside>
      <main className="adm-main">
        <div className="adm-top"><b>{label}</b><span>{user.email} · {user.role}</span></div>
        {nav === 'overview' && <Overview locs={locs} camps={camps} go={setNav} />}
        {nav === 'welcome' && <WelcomePanel welcome={project?.welcome} reload={reload} />}
        {nav === 'locations' && <LocationsPanel locs={locs} mapBg={project?.mapBg} reload={reload} />}
        {nav === 'map' && <MapPanel mapBg={project?.mapBg} reload={reload} />}
        {nav === 'vr360' && <VR360Panel locs={locs} vr360={project?.vr360} reload={reload} />}
        {nav === 'campaigns' && <CampaignsPanel camps={camps} locs={locs} reload={reload} />}
        {nav === 'import' && <ImportPanel locs={locs} reload={reload} />}
        {nav === 'users' && user.role === 'SUPERADMIN' && <UsersPanel meId={user.id || user.sub} />}
      </main>
    </div>
  );
}

/* ===================== OVERVIEW ===================== */
// Liệt kê phần còn thiếu của một địa điểm (giúp đội media biết việc cần làm).
function missingOf(l: Location): string[] {
  const k = l.links || {};
  const m: string[] = [];
  if (!l.i18n?.vi?.description) m.push('Mô tả');
  if (!(l.history && l.history.length)) m.push('Lịch sử');
  if (!k.old) m.push('Ảnh Xưa');
  if (!k.now) m.push('Ảnh Nay');
  if (!k.pano360) m.push('360°');
  if (!k.audio && !l.i18n?.vi?.voiceText) m.push('Thuyết minh');
  return m;
}

function Overview({ locs, camps, go }: any) {
  const visible = locs.filter((l: Location) => !l.isHidden).length;
  const on = camps.filter((c: Campaign) => c.enabled).length;
  const todo = locs
    .map((l: Location) => ({ l, miss: missingOf(l) }))
    .filter((x: any) => x.miss.length > 0)
    .sort((a: any, b: any) => b.miss.length - a.miss.length);
  const complete = locs.length - todo.length;
  const cards = [
    ['📍', locs.length, 'Địa điểm'],
    ['👁', visible, 'Đang hiển thị'],
    ['⭐', on, 'Sự kiện đang bật'],
    ['✅', complete, 'Đã đủ nội dung'],
  ];
  return (
    <div className="adm-body">
      <div className="adm-stats">
        {cards.map((c, i) => (
          <div className="stat" key={i}><div className="ic">{c[0]}</div><b>{c[1]}</b><span>{c[2]}</span></div>
        ))}
      </div>
      <div className="adm-quick">
        <button className="aprim" onClick={() => go('locations')}>+ Quản lý địa điểm</button>
        <button className="asec" onClick={() => go('import')}>📥 Import Excel</button>
        <button className="asec" onClick={() => go('campaigns')}>⭐ Sự kiện</button>
      </div>
      <div className="adm-card">
        <h4 style={{ margin: '0 0 8px' }}>📝 Cần bổ sung nội dung ({todo.length})</h4>
        {todo.length === 0 ? (
          <p className="muted">Tất cả địa điểm đã đủ nội dung 🎉</p>
        ) : (
          <div className="todo-list">
            {todo.map(({ l, miss }: any) => (
              <div className="todo-row" key={l.id} onClick={() => go('locations')}>
                <b>{l.i18n?.vi?.name || l.slug}</b>
                <div className="miss-tags">
                  {miss.map((m: string) => <span className="miss-tag" key={m}>{m}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== LOCATIONS ===================== */
function LocationsPanel({ locs, mapBg, reload }: any) {
  const [sel, setSel] = useState<Location | 'new' | null>(null);
  const [q, setQ] = useState('');
  const filtered = locs.filter((l: Location) =>
    (l.i18n?.vi?.name || l.slug).toLowerCase().includes(q.toLowerCase()) || l.slug.includes(q.toLowerCase()));
  return (
    <div className="adm-2col">
      <div className="adm-list">
        <div className="adm-listhd">
          <input placeholder="Tìm địa điểm…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="aprim" onClick={() => setSel('new')}>+ Thêm</button>
        </div>
        {filtered.map((l: Location) => (
          <div key={l.id} className={'loc-row ' + (sel !== 'new' && sel?.id === l.id ? 'on' : '')} onClick={() => setSel(l)}>
            <div><b>{l.i18n?.vi?.name || l.slug}</b><span>{l.slug} · {l.type}{l.isHidden ? ' · ẩn' : ''}</span></div>
            <div className="dotz">
              {l.links?.old && <i title="Xưa">🖼️</i>}{l.links?.pano360 && <i title="360°">🌐</i>}{l.links?.audio && <i title="Audio">🎧</i>}
            </div>
          </div>
        ))}
      </div>
      <div className="adm-edit">
        {sel ? (
          <LocationEditor key={sel === 'new' ? 'new' : sel.id} loc={sel === 'new' ? null : sel} mapBg={mapBg}
            onSaved={() => { reload(); }} onClose={() => setSel(null)} onDeleted={() => { setSel(null); reload(); }} />
        ) : <div className="adm-empty">Chọn một địa điểm bên trái, hoặc bấm <b>+ Thêm</b>.</div>}
      </div>
    </div>
  );
}

function LocationEditor({ loc, mapBg, onSaved, onClose, onDeleted }: any) {
  const [tab, setTab] = useState('info');
  const [f, setF] = useState<any>(() => ({
    slug: loc?.slug || '', type: loc?.type || 'SPOT', isHidden: !!loc?.isHidden,
    mapX: loc?.mapX ?? Math.round(MAP_W / 2), mapY: loc?.mapY ?? Math.round(MAP_H / 2),
    vi: { ...(loc?.i18n?.vi || {}) }, en: { ...(loc?.i18n?.en || {}) },
    links: { ...(loc?.links || {}) },
    hist: (loc?.history || []).map((h: any) => `${h.year} | ${h.content}`).join('\n'),
  }));
  const [msg, setMsg] = useState('');
  const [aspectWarn, setAspectWarn] = useState<Record<string, string>>({});
  // Kiểm tra tỉ lệ ảnh khi load — chỉ CẢNH BÁO, không chặn lưu.
  const checkAspect = (key: string, img: HTMLImageElement) => {
    const exp = RATIO_EXP[key];
    if (!exp || !img.naturalWidth || !img.naturalHeight) return;
    const r = img.naturalWidth / img.naturalHeight;
    const off = Math.abs(r - exp.r) / exp.r > RATIO_TOL;
    setAspectWarn((p) => {
      const next = { ...p };
      if (off) next[key] = `Ảnh đang ~${(r).toFixed(2)}:1 (${img.naturalWidth}×${img.naturalHeight}) — khác tỉ lệ khuyến nghị ${exp.label}, khi hiển thị sẽ bị cắt. Vẫn dùng được, nên cân nhắc thay ảnh.`;
      else delete next[key];
      return next;
    });
  };
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const setVi = (k: string, v: any) => setF((p: any) => ({ ...p, vi: { ...p.vi, [k]: v } }));
  const setEn = (k: string, v: any) => setF((p: any) => ({ ...p, en: { ...p.en, [k]: v } }));
  const setLink = (k: string, v: any) => setF((p: any) => ({ ...p, links: { ...p.links, [k]: v } }));

  const save = async () => {
    if (!f.slug.trim()) { setMsg('Cần nhập mã (slug).'); return; }
    const history = f.hist.split('\n').map((s: string) => s.trim()).filter(Boolean).map((s: string) => {
      const i = s.indexOf('|'); return i < 0 ? { year: '', content: s } : { year: s.slice(0, i).trim(), content: s.slice(i + 1).trim() };
    });
    const payload = {
      slug: f.slug.trim(), type: f.type, isHidden: f.isHidden,
      mapX: Math.round(Number(f.mapX) || 0), mapY: Math.round(Number(f.mapY) || 0),
      i18n: { vi: f.vi, en: f.en }, history, links: f.links,
    };
    try {
      if (loc) await api.updateLocation(loc.id, payload); else await api.createLocation(payload);
      setMsg('Đã lưu ✓'); onSaved();
    } catch (e: any) { setMsg('Lỗi: ' + e.message); }
  };
  const del = async () => { if (loc && confirm('Xoá địa điểm này?')) { await api.deleteLocation(loc.id); onDeleted(); } };

  const uploadFile = (mk: string, key: string) => {
    if (!loc) { setMsg('Lưu địa điểm trước rồi mới tải file.'); return; }
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = mk === 'AUDIO' ? 'audio/*' : 'image/*';
    inp.onchange = async () => {
      const file = inp.files?.[0]; if (!file) return;
      setMsg('Đang tải…');
      try { const r: any = await api.uploadMedia(file, mk, loc.id); setLink(key, (r?.meta?.optimized) || r?.url || ''); setMsg('Đã tải ✓'); }
      catch (e: any) { setMsg('Lỗi tải: ' + e.message); }
    };
    inp.click();
  };

  // Kéo link ngoài (Drive/OneDrive) về host trên server — tránh Drive bị chặn khi đông người xem.
  const importToServer = async (mk: string, key: string) => {
    if (!loc) { setMsg('Lưu địa điểm trước rồi mới kéo về server.'); return; }
    const link = String(f.links[key] || '').trim();
    if (!/^https?:\/\//i.test(link)) { setMsg('Ô này chưa có link ngoài để kéo.'); return; }
    setMsg('Đang kéo về server…');
    try { const r: any = await api.importMediaUrl(link, mk, loc.id); setLink(key, r?.meta?.optimized || r?.url || ''); setMsg('Đã lưu về server ✓'); }
    catch (e: any) { setMsg('Lỗi: ' + e.message); }
  };
  const isExternal = (u: any) => /^https?:\/\//i.test(String(u || ''));

  return (
    <div className="editor">
      <div className="editor-hd">
        <h3>{loc ? f.vi.name || loc.slug : 'Địa điểm mới'}</h3>
        <span className="cls" onClick={onClose}>×</span>
      </div>
      <div className="tabs">
        {[['info', 'Thông tin'], ['pos', 'Vị trí'], ['media', 'Media'], ['hist', 'Lịch sử']].map(([k, t]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>
        ))}
      </div>
      <div className="editor-body">
        {tab === 'info' && (
          <>
            {(() => { const slugTip = 'Mã định danh không dấu (chữ thường, số, gạch ngang). Dùng để liên kết với lịch sử/sự kiện. KHÔNG đổi sau khi tạo. VD: c1, library, hoi-truong-c2'; return (
            <>
            <label title={slugTip}>Mã (slug) <span className="hint-q" title={slugTip}>ⓘ</span></label>
            <input value={f.slug} disabled={!!loc} title={slugTip} onChange={(e) => set('slug', e.target.value)} placeholder="vd: c1, library" />
            </>); })()}
            <div className="frow">
              <div><label title="Địa điểm = toà nhà thường. Điểm sự kiện = nơi gắn với hoạt động (sân lễ…)">Loại <span className="hint-q" title="Địa điểm = toà nhà thường. Điểm sự kiện = nơi gắn với hoạt động (sân lễ…)">ⓘ</span></label><select value={f.type} onChange={(e) => set('type', e.target.value)}><option value="SPOT">Địa điểm</option><option value="EVENT">Điểm sự kiện</option></select></div>
              <div><label title="Ẩn = không hiển thị trên bản đồ/VR cho người xem (vẫn lưu trong hệ thống)">Hiển thị <span className="hint-q" title="Ẩn = không hiển thị cho người xem (vẫn lưu trong hệ thống)">ⓘ</span></label><select value={f.isHidden ? '1' : '0'} onChange={(e) => set('isHidden', e.target.value === '1')}><option value="0">Hiện</option><option value="1">Ẩn</option></select></div>
            </div>
            <label>Tên (vi)</label><input value={f.vi.name || ''} onChange={(e) => setVi('name', e.target.value)} />
            <label>Tên (en)</label><input value={f.en.name || ''} onChange={(e) => setEn('name', e.target.value)} />
            <div className="frow">
              <div><label title="Nhãn ngắn hiển thị ở chip danh sách VR360 (vd: Thư viện, Hội trường)">Nhãn ngắn <span className="hint-q" title="Nhãn ngắn hiển thị ở chip danh sách VR360 (vd: Thư viện, Hội trường)">ⓘ</span></label><input value={f.vi.short || ''} onChange={(e) => setVi('short', e.target.value)} placeholder="vd: Thư viện" /></div>
              <div><label title="Dòng chú thích nhỏ dưới tên (vd: Khánh thành 2006)">Năm/chú thích <span className="hint-q" title="Dòng chú thích nhỏ dưới tên (vd: Khánh thành 2006)">ⓘ</span></label><input value={f.vi.year || ''} onChange={(e) => setVi('year', e.target.value)} placeholder="vd: Khánh thành 2006" /></div>
            </div>
            <label>Mô tả (vi)</label><textarea rows={3} value={f.vi.description || ''} onChange={(e) => setVi('description', e.target.value)} />
            <label>Mô tả (en)</label><textarea rows={2} value={f.en.description || ''} onChange={(e) => setEn('description', e.target.value)} />
            <label>Thuyết minh (vi) — đọc bằng máy nếu không có audio</label>
            <textarea rows={2} value={f.vi.voiceText || ''} onChange={(e) => setVi('voiceText', e.target.value)} />
          </>
        )}
        {tab === 'pos' && <PinPlacer x={Number(f.mapX) || 0} y={Number(f.mapY) || 0} mapBg={mapBg} onChange={(x: number, y: number) => setF((p: any) => ({ ...p, mapX: x, mapY: y }))} />}
        {tab === 'media' && (
          <>
            <p className="muted">Dán <b>link chia sẻ</b> (Drive/OneDrive — tự chuyển sang link nhúng) hoặc <b>Tải file</b> lên server.</p>
            <div className="size-box">
              📐 <b>Kích thước ảnh khuyến nghị (hiển thị đẹp nhất):</b>
              <ul>
                <li><b>Ảnh Xưa & Nay:</b> ngang, tỉ lệ <b>16:10</b> — nên <b>1600×1000px</b> (tối thiểu 1200×750). Hai ảnh <b>cùng góc chụp / cùng khung</b> để so sánh khớp. Khung xem sẽ <i>cắt giữa</i> nếu sai tỉ lệ.</li>
                <li><b>Ảnh 360°:</b> equirectangular tỉ lệ <b>2:1</b> — ~<b>4096×2048px</b>.</li>
                <li><b>Audio:</b> MP3/M4A, &lt; ~10MB.</li>
              </ul>
              Server tự nén ảnh về ≤1600px (360° ≤4096px) định dạng WebP — bạn cứ tải bản gốc chất lượng cao.
            </div>
            <div className="warn-box">
              ⚠️ <b>Ngày sự kiện đông người xem:</b> ưu tiên <b>Tải file</b> lên server. Link Google Drive/OneDrive
              có thể bị chặn khi hàng nghìn người truy cập. Nếu đã lỡ dán link ngoài, bấm <b>⬇️ Về server</b> để
              hệ thống tải về (chỉ tải 1 lần) rồi phục vụ ổn định từ server.
            </div>
            {[
              ['old', 'Ảnh Xưa', 'OLD', 'image', 'Ảnh cũ/lịch sử của địa điểm. Ngang 16:10, nên 1600×1000px — chụp/chọn CÙNG KHUNG với ảnh Nay để thanh trượt so sánh khớp.'],
              ['now', 'Ảnh Nay', 'NOW', 'image', 'Ảnh hiện tại, CÙNG GÓC CHỤP với ảnh Xưa. Ngang 16:10, ~1600×1000px.'],
              ['pano360', 'Ảnh 360°', 'PANO360', 'image', 'Ảnh panorama equirectangular (chụp 360°), tỉ lệ 2:1, ~4096×2048px.'],
              ['audio', 'Audio thuyết minh', 'AUDIO', 'audio', 'File thuyết minh giọng đọc. MP3/M4A, < ~10MB. Nếu để trống, app tự đọc bằng máy từ ô "Thuyết minh".'],
            ].map(([key, lbl, mk, kind, hint]) => (
              <div className="media-row" key={key}>
                <label title={hint}>{lbl} <span className="hint-q" title={hint}>ⓘ</span> {isExternal(f.links[key]) && <span className="ext-badge" title="Link ngoài — nên kéo về server">link ngoài</span>}</label>
                <div className="frow">
                  <input value={f.links[key] || ''} placeholder="Dán link…" title={hint}
                    onChange={(e) => setLink(key, e.target.value)}
                    onBlur={(e) => setLink(key, normalize(e.target.value, kind as any))} />
                  {isExternal(f.links[key]) && <button className="asec" type="button" title="Kéo file từ link ngoài về host trên server (chỉ tải 1 lần)" onClick={() => importToServer(mk as string, key as string)}>⬇️ Về server</button>}
                  <button className="asec" type="button" title="Tải file từ máy lên server (được tối ưu tự động)" onClick={() => uploadFile(mk as string, key as string)}>Tải file</button>
                </div>
                <div className="field-hint">{hint}</div>
                {f.links[key] && aspectWarn[key] && <div className="aspect-warn">⚠️ {aspectWarn[key]}</div>}
                {f.links[key] && kind === 'image' && <img className="media-prev" src={f.links[key]} alt="" onLoad={(e: any) => checkAspect(key as string, e.target)} onError={(e: any) => (e.target.style.opacity = 0.25)} />}
                {f.links[key] && kind === 'audio' && <audio controls src={f.links[key]} style={{ width: '100%', marginTop: 6 }} />}
              </div>
            ))}
          </>
        )}
        {tab === 'hist' && (
          <>
            <label>Dòng thời gian — mỗi mốc 1 dòng: <b>năm | nội dung</b></label>
            <textarea rows={8} value={f.hist} onChange={(e) => set('hist', e.target.value)} />
          </>
        )}
      </div>
      <div className="editor-ft">
        {msg && <span className="msg">{msg}</span>}
        <div className="spacer" />
        {loc && <button className="adel" onClick={del}><NavIcon name="trash" size={16} /> Xoá</button>}
        <button className="aprim" onClick={save}>💾 Lưu</button>
      </div>
    </div>
  );
}

// Đặt pin trên CHÍNH bản đồ vẽ tay của public (hệ toạ độ 1250 x 1070).
// Bấm hoặc kéo-thả pin; toạ độ lưu khớp tuyệt đối với CampusMap → không lệch.
function PinPlacer({ x, y, mapBg, onChange }: any) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState(false);

  const toMap = (clientX: number, clientY: number) => {
    const svg = svgRef.current; if (!svg) return null;
    const r = svg.getBoundingClientRect();
    // preserveAspectRatio xMidYMid meet: tính vùng vẽ thực (letterbox) để map đúng tỉ lệ.
    const scale = Math.min(r.width / MAP_W, r.height / MAP_H);
    const dw = MAP_W * scale, dh = MAP_H * scale;
    const ox = (r.width - dw) / 2, oy = (r.height - dh) / 2;
    const mx = (clientX - r.left - ox) / scale;
    const my = (clientY - r.top - oy) / scale;
    return { mx: Math.max(0, Math.min(MAP_W, Math.round(mx))), my: Math.max(0, Math.min(MAP_H, Math.round(my))) };
  };
  const place = (e: any) => {
    const pt = 'touches' in e && e.touches[0] ? e.touches[0] : e;
    const p = toMap(pt.clientX, pt.clientY); if (p) onChange(p.mx, p.my);
  };

  return (
    <>
      <p className="muted">Bấm lên bản đồ (hoặc <b>kéo pin 📍</b>) để đặt vị trí. Toạ độ khớp với bản đồ người xem.</p>
      <div className="pinmap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseDown={(e) => { setDrag(true); place(e); }}
          onMouseMove={(e) => drag && place(e)}
          onMouseUp={() => setDrag(false)}
          onMouseLeave={() => setDrag(false)}
          onTouchStart={place}
          onTouchMove={place}
          style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: 'crosshair', background: '#bcd49a', borderRadius: 14 }}
        >
          <image href={mapBg || MAP_URL} x={0} y={0} width={MAP_W} height={MAP_H} preserveAspectRatio="none" />
          <g pointerEvents="none">
            <ellipse cx={x} cy={y + 3} rx={14} ry={5} fill="rgba(0,0,0,.25)" />
            <path
              d={`M ${x} ${y} C ${x - 20} ${y - 28} ${x - 17} ${y - 56} ${x} ${y - 56} C ${x + 17} ${y - 56} ${x + 20} ${y - 28} ${x} ${y} Z`}
              fill="#c8102e" stroke="#fff" strokeWidth={4}
            />
            <circle cx={x} cy={y - 38} r={9} fill="#fff" />
          </g>
        </svg>
      </div>
      <div className="frow">
        <div><label title="Toạ độ ngang trên bản đồ (0–1250). Dễ nhất là bấm/kéo pin ở trên thay vì gõ số.">map_x (0–{MAP_W}) <span className="hint-q" title="Toạ độ ngang (0–1250). Nên bấm/kéo pin thay vì gõ số.">ⓘ</span></label><input type="number" value={x} onChange={(e) => onChange(Math.max(0, Math.min(MAP_W, +e.target.value)), y)} /></div>
        <div><label title="Toạ độ dọc trên bản đồ (0–1070). Dễ nhất là bấm/kéo pin ở trên.">map_y (0–{MAP_H}) <span className="hint-q" title="Toạ độ dọc (0–1070). Nên bấm/kéo pin thay vì gõ số.">ⓘ</span></label><input type="number" value={y} onChange={(e) => onChange(x, Math.max(0, Math.min(MAP_H, +e.target.value)))} /></div>
      </div>
    </>
  );
}

/* ===================== CAMPAIGNS ===================== */
function CampaignsPanel({ camps, locs, reload }: any) {
  const [edit, setEdit] = useState<Campaign | 'new' | null>(null);
  return (
    <div className="adm-body">
      <button className="aprim" onClick={() => setEdit('new')}>+ Thêm sự kiện</button>
      {camps.map((c: Campaign) => (
        <div className="arow" key={c.id}>
          <div className="arow-main"><b>{c.icon} {c.i18n?.vi?.name}</b><span>{c.schedule?.length || 0} hoạt động · {c.enabled ? 'ĐANG BẬT' : 'tắt'}</span></div>
          <label className="aswitch"><input type="checkbox" checked={c.enabled} onChange={async (e) => { await api.toggleCampaign(c.id, e.target.checked); reload(); }} /><span /></label>
          <button className="aic" onClick={() => setEdit(c)} title="Sửa"><NavIcon name="edit" size={17} /></button>
          <button className="aic" title="Xoá" onClick={async () => { if (confirm('Xoá sự kiện?')) { await api.deleteCampaign(c.id); reload(); } }}><NavIcon name="trash" size={17} /></button>
        </div>
      ))}
      {edit && <CampaignEditor camp={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />}
    </div>
  );
}
function CampaignEditor({ camp, onClose, onSaved }: any) {
  const [slug, setSlug] = useState(camp?.slug || '');
  const [name, setName] = useState(camp?.i18n?.vi?.name || '');
  const [icon, setIcon] = useState(camp?.icon || '⭐');
  const [sched, setSched] = useState((camp?.schedule || []).map((e: any) => `${e.time} | ${e.loc} | ${e.live ? 1 : 0} | ${e.title?.vi || ''}`).join('\n'));
  const [err, setErr] = useState('');
  const save = async () => {
    if (!slug.trim()) { setErr('Cần mã.'); return; }
    const schedule = sched.split('\n').map((s: string) => s.trim()).filter(Boolean).map((s: string) => {
      const p = s.split('|').map((x: string) => x.trim());
      return { time: p[0] || '', loc: p[1] || '', live: p[2] === '1', title: { vi: p[3] || '' } };
    });
    const d = { slug: slug.trim(), icon, i18n: { vi: { name: name || slug } }, schedule };
    try { if (camp) await api.updateCampaign(camp.id, d); else await api.createCampaign({ ...d, enabled: true }); onSaved(); }
    catch (e: any) { setErr(e.message); }
  };
  return (
    <div className="admin-modal open" onClick={(e: any) => e.target === e.currentTarget && onClose()}>
      <div className="am-card">
        <span className="am-cls" onClick={onClose}>×</span>
        <h3 className="am-ttl">{camp ? 'Sửa sự kiện' : 'Thêm sự kiện'}</h3>
        <label title="Mã định danh sự kiện, không dấu. VD: anniv70, khaigiang">Mã (slug) <span className="hint-q" title="Mã định danh sự kiện, không dấu. VD: anniv70, khaigiang">ⓘ</span></label><input value={slug} disabled={!!camp} onChange={(e) => setSlug(e.target.value)} placeholder="vd: khaigiang" />
        <div className="frow"><div style={{ flex: '0 0 80px' }}><label title="Biểu tượng emoji hiển thị cạnh tên sự kiện">Icon <span className="hint-q" title="Biểu tượng emoji hiển thị cạnh tên sự kiện">ⓘ</span></label><input value={icon} onChange={(e) => setIcon(e.target.value)} /></div><div><label>Tên (vi)</label><input value={name} onChange={(e) => setName(e.target.value)} /></div></div>
        <label title="Mỗi hoạt động 1 dòng, ngăn cách bằng dấu | theo thứ tự: giờ | mã địa điểm (slug) | live (1=đang diễn ra/0=chưa) | tiêu đề. VD: 08:00 | stadium | 1 | Lễ khai mạc">
          Lịch trình — mỗi dòng: <b>giờ | mã địa điểm | live(1/0) | tiêu đề</b> <span className="hint-q" title="VD: 08:00 | stadium | 1 | Lễ khai mạc 70 năm. 'mã địa điểm' chính là slug của địa điểm; live=1 sẽ bật tín hiệu 📡 LIVE trên bản đồ.">ⓘ</span>
        </label>
        <textarea rows={7} value={sched} onChange={(e) => setSched(e.target.value)} placeholder="08:00 | stadium | 1 | Lễ khai mạc 70 năm" />
        {err && <div className="err">{err}</div>}
        <div className="am-acts"><button className="aprim" onClick={save}>💾 Lưu</button><button className="asec" onClick={onClose}>Huỷ</button></div>
      </div>
    </div>
  );
}

/* ===================== TEMPLATE EXCEL ===================== */
// Sinh file mẫu khớp đúng tên sheet/cột mà bộ Import đọc (header ở dòng 2).
function downloadTemplate() {
  const sheet = (rows: any[][]) => XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();

  const huongDan = sheet([
    ['BK360 — Template nhập liệu (đội Media)'],
    [''],
    ['Cách dùng:'],
    ['1) Mỗi sheet là một loại dữ liệu. KHÔNG đổi tên sheet và KHÔNG đổi dòng tiêu đề (dòng 2).'],
    ['2) Điền dữ liệu từ dòng 3 trở đi.'],
    ['3) Link ảnh/audio: dán link CHIA SẺ Google Drive hoặc OneDrive (đặt quyền "Ai có link đều xem"). Hệ thống tự chuyển sang link nhúng.'],
    ['   • Ảnh Xưa & Nay: ngang 16:10, ~1600×1000px, hai ảnh CÙNG góc chụp. • Ảnh 360°: equirectangular 2:1, ~4096×2048px. • Audio: MP3/M4A.'],
    ['4) Toạ độ map_x / map_y: vị trí trên bản đồ, hệ 0–1250 (ngang) và 0–1070 (dọc). Có thể bỏ trống rồi chỉnh bằng cách kéo pin trong trang Quản trị.'],
    ['5) Cột "hien": Có/Không (ẩn–hiện). Cột "bat" (sự kiện): Có/Không. Cột "live"/"dang_dien_ra": Có/Không.'],
    [''],
    ['Sheet DiaDiem: thông tin từng toà nhà/địa điểm.'],
    ['Sheet LichSu: dòng thời gian (nhiều dòng cho 1 địa điểm, nối qua dia_diem_id).'],
    ['Sheet SuKien: các sự kiện (vd 70 năm, khai giảng).'],
    ['Sheet LichTrinh: lịch trình của từng sự kiện (nối qua su_kien_id).'],
  ]);

  const diaDiem = sheet([
    ['Mã', 'Loại spot/event', 'Toạ độ X (0-1250)', 'Toạ độ Y (0-1070)', 'Hiện?', 'Tên (VI)', 'Nhãn ngắn', 'Năm/chú thích', 'Mô tả (VI)', 'Thuyết minh (VI)', 'Tên (EN)', 'Mô tả (EN)', 'Link ảnh Xưa', 'Link ảnh Nay', 'Link ảnh 360', 'Link audio'],
    ['id', 'loai', 'map_x', 'map_y', 'hien', 'ten_vi', 'nhan_ngan', 'nam', 'mo_ta_vi', 'thuyet_minh_vi', 'ten_en', 'mo_ta_en', 'link_anh_xua', 'link_anh_nay', 'link_anh_360', 'link_audio'],
    ['c1', 'spot', 427, 305, 'Có', 'Tòa nhà C1', 'Nhà điều hành', 'Khu trung tâm', 'Khu nhà C1 là trung tâm khuôn viên…', 'Tòa nhà C1 là khu trung tâm lịch sử của Bách Khoa.', 'Building C1', 'Central admin block', '', '', '', ''],
    ['library', 'spot', 647, 715, 'Có', 'Thư viện Tạ Quang Bửu', 'Thư viện', 'Khánh thành 2006', 'Thư viện 10 tầng, trung tâm tri thức…', 'Chào mừng đến Thư viện Tạ Quang Bửu.', 'Ta Quang Buu Library', '', '', '', '', ''],
  ]);

  const lichSu = sheet([
    ['Mã địa điểm', 'Thứ tự', 'Năm', 'Nội dung'],
    ['dia_diem_id', 'thu_tu', 'nam', 'noi_dung'],
    ['c1', 1, '1956', 'Khu nhà học đầu tiên phục vụ khóa sinh viên kỹ thuật đầu tiên.'],
    ['c1', 2, '2022', 'Chuyển thành Đại học Bách khoa Hà Nội.'],
  ]);

  const suKien = sheet([
    ['Mã', 'Icon', 'Bật?', 'Tên (VI)', 'Tên (EN)'],
    ['id', 'icon', 'bat', 'ten_vi', 'ten_en'],
    ['anniv70', '⭐', 'Có', 'Sự kiện 70 năm', '70th Anniversary'],
    ['khaigiang', '🎓', 'Không', 'Lễ khai giảng', 'Opening Ceremony'],
  ]);

  const lichTrinh = sheet([
    ['Mã sự kiện', 'Giờ', 'Mã địa điểm', 'Đang diễn ra?', 'Tiêu đề (VI)', 'Tiêu đề (EN)'],
    ['su_kien_id', 'gio', 'dia_diem_id', 'dang_dien_ra', 'tieu_de_vi', 'tieu_de_en'],
    ['anniv70', '08:00', 'stadium', 'Có', 'Lễ khai mạc 70 năm', 'Opening'],
    ['anniv70', '09:30', 'library', 'Không', 'Triển lãm Xưa & Nay', 'Exhibition'],
  ]);

  XLSX.utils.book_append_sheet(wb, huongDan, 'HuongDan');
  XLSX.utils.book_append_sheet(wb, diaDiem, 'DiaDiem');
  XLSX.utils.book_append_sheet(wb, lichSu, 'LichSu');
  XLSX.utils.book_append_sheet(wb, suKien, 'SuKien');
  XLSX.utils.book_append_sheet(wb, lichTrinh, 'LichTrinh');
  XLSX.writeFile(wb, 'BK360-Template.xlsx');
}

/* ===================== IMPORT ===================== */
function ImportPanel({ locs, reload }: any) {
  const [preview, setPreview] = useState<any>(null);
  const [log, setLog] = useState('');

  const parse = (file: File) => {
    const rd = new FileReader();
    rd.onload = (ev: any) => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
        const rows = (name: string) => {
          const ws = wb.Sheets[name]; if (!ws) return [];
          const a: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' });
          const hdr = a[1] || []; const out: any[] = [];
          for (let i = 2; i < a.length; i++) { const r = a[i]; if (!r || r.every((c: any) => c === '' || c == null)) continue; const o: any = {}; hdr.forEach((h: any, j: number) => (o[String(h).trim()] = r[j] != null ? r[j] : '')); out.push(o); }
          return out;
        };
        const hist: any = {};
        rows('LichSu').forEach((h) => { const id = String(h.dia_diem_id || '').trim(); if (!id) return; (hist[id] = hist[id] || []).push({ order: Number(h.thu_tu) || 0, year: String(h.nam || ''), content: h.noi_dung || '' }); });
        Object.keys(hist).forEach((k) => { hist[k].sort((a: any, b: any) => a.order - b.order); hist[k].forEach((x: any) => delete x.order); });
        const locations = rows('DiaDiem').filter((d) => String(d.id || '').trim()).map((d) => ({
          slug: String(d.id).trim(), type: String(d.loai || 'spot').trim().toUpperCase() === 'EVENT' ? 'EVENT' : 'SPOT',
          mapX: d.map_x === '' ? 0 : Number(d.map_x), mapY: d.map_y === '' ? 0 : Number(d.map_y), isHidden: !yes(d.hien || 'Có'),
          i18n: { vi: { name: d.ten_vi || d.id, short: d.nhan_ngan || '', year: d.nam || '', description: d.mo_ta_vi || '', voiceText: d.thuyet_minh_vi || '' }, en: { name: d.ten_en || '', description: d.mo_ta_en || '' } },
          links: { old: normalize(d.link_anh_xua, 'image'), now: normalize(d.link_anh_nay, 'image'), pano360: normalize(d.link_anh_360, 'image'), audio: normalize(d.link_audio, 'audio') },
          history: hist[String(d.id).trim()] || [],
        }));
        const sched: any = {};
        rows('LichTrinh').forEach((t) => { const sid = String(t.su_kien_id || '').trim(); if (!sid) return; (sched[sid] = sched[sid] || []).push({ time: String(t.gio || ''), loc: String(t.dia_diem_id || ''), live: yes(t.dang_dien_ra), title: { vi: t.tieu_de_vi || '', en: t.tieu_de_en || '' } }); });
        const campaigns = rows('SuKien').filter((s) => String(s.id || '').trim()).map((s) => ({ slug: String(s.id).trim(), icon: s.icon || '⭐', enabled: yes(s.bat), i18n: { vi: { name: s.ten_vi || s.id }, en: { name: s.ten_en || '' } }, schedule: sched[String(s.id).trim()] || [] }));
        const existing = new Set(locs.map((l: Location) => l.slug));
        setPreview({ locations, campaigns, news: locations.filter((l: any) => !existing.has(l.slug)).length, upd: locations.filter((l: any) => existing.has(l.slug)).length });
        setLog('');
      } catch (e: any) { setLog('Lỗi đọc file: ' + e.message); }
    };
    rd.readAsArrayBuffer(file);
  };

  const apply = async () => {
    if (!preview) return;
    const existing: any = {}; locs.forEach((l: Location) => (existing[l.slug] = l.id));
    let ok = 0, fail = 0;
    for (const l of preview.locations) {
      try { if (existing[l.slug]) await api.updateLocation(existing[l.slug], l); else await api.createLocation(l); ok++; } catch { fail++; }
    }
    const camps = await api.adminCampaigns(); const cmap: any = {}; camps.forEach((c: Campaign) => (cmap[c.slug] = c.id));
    for (const c of preview.campaigns) {
      try { if (cmap[c.slug]) await api.updateCampaign(cmap[c.slug], c); else await api.createCampaign(c); ok++; } catch { fail++; }
    }
    setLog(`Áp dụng xong: ${ok} mục OK${fail ? `, ${fail} lỗi` : ''}.`);
    setPreview(null); reload();
  };

  const pickFile = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.xlsx,.xls'; i.onchange = () => i.files?.[0] && parse(i.files[0]); i.click(); };

  return (
    <div className="adm-body">
      <div className="adm-card import-step">
        <div className="step-num">1</div>
        <div className="step-body">
          <b>Tải file mẫu</b>
          <p className="muted" style={{ margin: '3px 0 0' }}>Gửi cho đội nội dung điền. Giữ nguyên tên sheet & dòng tiêu đề.</p>
        </div>
        <button className="asec" onClick={downloadTemplate}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
          </svg>
          Tải template
        </button>
      </div>

      <div className="adm-card">
        <b>Bước 2 — Import file đã điền</b>
        <div className="dropzone mapdrop" onClick={pickFile} role="button" style={{ marginTop: 10 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h8M8 9h2" />
          </svg>
          <b>Chọn file Excel (.xlsx)</b>
          <span>Bấm để chọn file đã điền theo template.</span>
        </div>

        {preview && (
          <div className="import-preview">
            <div className="ip-row">
              <span className="status-badge cus">Đọc được</span>
              <b>{preview.locations.length}</b> địa điểm <span className="muted">({preview.news} mới · {preview.upd} cập nhật)</span> · <b>{preview.campaigns.length}</b> sự kiện
            </div>
            <p className="muted" style={{ margin: '8px 0' }}>Link Drive/OneDrive đã tự chuyển sang link nhúng. Bấm Áp dụng để ghi vào hệ thống.</p>
            <div className="btn-row">
              <button className="aprim" onClick={apply}>✅ Áp dụng</button>
              <button className="asec" onClick={() => setPreview(null)}>Huỷ</button>
            </div>
          </div>
        )}
        {log && <div className="import-log">✓ {log}</div>}
      </div>
    </div>
  );
}

/* ===================== BẢN ĐỒ NỀN 2D ===================== */
function MapPanel({ mapBg, reload }: any) {
  const [bg, setBg] = useState<string | null>(mapBg ?? null);
  const [msg, setMsg] = useState('');
  useEffect(() => { setBg(mapBg ?? null); }, [mapBg]);

  const save = async (url: string | null) => {
    setMsg('Đang lưu…');
    try { await api.updateProject({ mapBg: url }); setBg(url); setMsg('Đã lưu ✓'); reload(); }
    catch (e: any) { setMsg('Lỗi: ' + e.message); }
  };
  const upload = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => {
      const file = inp.files?.[0]; if (!file) return; setMsg('Đang tải ảnh…');
      try { const r: any = await api.uploadMedia(file, 'MAPBG'); await save(r?.meta?.optimized || r?.url || ''); }
      catch (e: any) { setMsg('Lỗi tải: ' + e.message); }
    };
    inp.click();
  };
  const isDefault = !bg;

  return (
    <div className="adm-body">
      <div className="map-panel">
        <div className="adm-card">
          <h4 style={{ margin: '0 0 6px' }}>Ảnh nền bản đồ 2D</h4>
          <p className="muted" style={{ marginTop: 0 }}>
            Tải ảnh sơ đồ khuôn viên riêng để thay nền. Pin địa điểm (tab <b>Vị trí</b>) đặt trên chính ảnh này và khớp trang người xem.
            Bỏ trống = dùng <b>bản đồ vẽ tay</b> mặc định.
          </p>
          <div className="dropzone mapdrop" onClick={upload} role="button" title="Bấm để chọn ảnh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" />
            </svg>
            <b>Tải ảnh nền lên</b>
            <span>PNG/JPG ngang, tỉ lệ ~5:4 (≈1250×1070). Bấm để chọn.</span>
          </div>
          {msg && <div className="msg" style={{ marginTop: 10 }}>{msg}</div>}
        </div>

        <div className="adm-card">
          <div className="map-status">
            <span className={'status-badge ' + (isDefault ? 'def' : 'cus')}>
              {isDefault ? '● Bản đồ vẽ tay (mặc định)' : '● Ảnh nền tuỳ chọn'}
            </span>
            {!isDefault && <button className="asec" onClick={() => save(null)}>↺ Về bản đồ vẽ tay</button>}
          </div>
          <div className="pinmap">
            <svg viewBox="0 0 1250 1070" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block', background: '#bcd49a', borderRadius: 12 }}>
              <image href={bg || MAP_URL} x={0} y={0} width={1250} height={1070} preserveAspectRatio="none" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== TRANG CHÀO (WELCOME) ===================== */
function WelcomePanel({ welcome, reload }: any) {
  const init = () => ({
    ribbonVi: welcome?.ribbon?.vi || '', ribbonEn: welcome?.ribbon?.en || '',
    tagVi: welcome?.tagline?.vi || '', tagEn: welcome?.tagline?.en || '',
    subVi: welcome?.subtitle?.vi || '', subEn: welcome?.subtitle?.en || '',
    years: welcome?.years || '', effects: welcome?.effects !== false, bg: welcome?.bg || '',
  });
  const [f, setF] = useState<any>(init);
  const [msg, setMsg] = useState('');
  useEffect(() => { setF(init()); }, [welcome]);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const uploadBg = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => {
      const file = inp.files?.[0]; if (!file) return; setMsg('Đang tải ảnh nền…');
      try { const r: any = await api.uploadMedia(file, 'WELCOMEBG'); set('bg', r?.meta?.optimized || r?.url || ''); setMsg('Đã tải ✓ — nhớ bấm Lưu.'); }
      catch (e: any) { setMsg('Lỗi tải: ' + e.message); }
    };
    inp.click();
  };

  const save = async () => {
    const payload = {
      ribbon: { vi: f.ribbonVi || undefined, en: f.ribbonEn || undefined },
      tagline: { vi: f.tagVi || undefined, en: f.tagEn || undefined },
      subtitle: { vi: f.subVi || undefined, en: f.subEn || undefined },
      years: f.years || undefined, effects: !!f.effects, bg: f.bg || null,
    };
    setMsg('Đang lưu…');
    try { await api.updateProject({ welcome: payload }); setMsg('Đã lưu ✓'); reload(); }
    catch (e: any) { setMsg('Lỗi: ' + e.message); }
  };
  const reset = async () => {
    if (!confirm('Khôi phục mặc định cho màn hình chào?')) return;
    try { await api.updateProject({ welcome: null }); setMsg('Đã khôi phục mặc định ✓'); reload(); }
    catch (e: any) { setMsg('Lỗi: ' + e.message); }
  };

  return (
    <div className="adm-body">
      <div className="adm-card" style={{ maxWidth: 640 }}>
        <h4 style={{ margin: '0 0 6px' }}>Màn hình chào (Welcome)</h4>
        <p className="muted" style={{ marginTop: 0 }}>Tuỳ chỉnh chữ trên màn hình đầu tiên. Bỏ trống ô nào sẽ dùng <b>mặc định</b> (ghi sẵn trong ô gợi ý).</p>

        <div className="frow">
          <div><label>Ruy băng (VI)</label><input value={f.ribbonVi} onChange={(e) => set('ribbonVi', e.target.value)} placeholder="Chào mừng 70 năm" /></div>
          <div><label>Ruy băng (EN)</label><input value={f.ribbonEn} onChange={(e) => set('ribbonEn', e.target.value)} placeholder="Welcome · 70 Years" /></div>
        </div>
        <div className="frow">
          <div style={{ maxWidth: 200 }}><label>Dòng năm</label><input value={f.years} onChange={(e) => set('years', e.target.value)} placeholder="1956 — 2026" /></div>
        </div>
        <div className="frow">
          <div><label>Tiêu đề phụ (VI)</label><input value={f.tagVi} onChange={(e) => set('tagVi', e.target.value)} placeholder="Hành trình 70 năm" /></div>
          <div><label>Tiêu đề phụ (EN)</label><input value={f.tagEn} onChange={(e) => set('tagEn', e.target.value)} placeholder="70-Year Journey" /></div>
        </div>
        <label>Mô tả (VI)</label>
        <textarea rows={2} value={f.subVi} onChange={(e) => set('subVi', e.target.value)} placeholder="Khám phá Đại học Bách khoa Hà Nội — chọn cách bạn muốn tham quan." />
        <label>Mô tả (EN)</label>
        <textarea rows={2} value={f.subEn} onChange={(e) => set('subEn', e.target.value)} placeholder="Explore Hanoi University of Science and Technology — choose how to visit." />

        <label>Ảnh nền màn chào (tuỳ chọn)</label>
        {f.bg ? (
          <div className="welcome-bg-prev">
            <img src={f.bg} alt="" />
            <button className="asec" type="button" onClick={() => set('bg', '')}>Xoá ảnh nền</button>
          </div>
        ) : (
          <div className="dropzone mapdrop" onClick={uploadBg} role="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" />
            </svg>
            <b>Tải ảnh nền</b>
            <span>Ảnh ngang. App tự phủ lớp sáng mờ để chữ vẫn rõ. Bỏ trống = nền lễ hội mặc định.</span>
          </div>
        )}

        <label className="chk-row" style={{ marginTop: 14 }} title="Dây cờ + confetti trên màn chào">
          <input type="checkbox" checked={f.effects} onChange={(e) => set('effects', e.target.checked)} />
          <span>Hiệu ứng lễ hội (dây cờ + confetti)</span>
        </label>

        <div className="btn-row">
          <button className="aprim" onClick={save}>💾 Lưu</button>
          <button className="asec" onClick={reset}>↺ Khôi phục mặc định</button>
        </div>
        {msg && <div className="msg" style={{ marginTop: 10 }}>{msg}</div>}
      </div>
    </div>
  );
}

/* ===================== VR360 ===================== */
function VR360Panel({ locs, vr360, reload }: any) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [edit, setEdit] = useState<Scene | 'new' | null>(null);
  const [cfg, setCfg] = useState<Vr360Config>({ autorotate: false, speed: 6, startSlug: null });
  const [msg, setMsg] = useState('');
  const load = async () => { try { setScenes(await api.adminScenes()); } catch (e: any) { setMsg(e.message); } };
  useEffect(() => { load(); }, []);
  useEffect(() => { setCfg({ autorotate: vr360?.autorotate ?? false, speed: vr360?.speed ?? 6, startSlug: vr360?.startSlug ?? null }); }, [vr360]);

  const saveCfg = async (next: Vr360Config) => {
    setCfg(next);
    try { await api.updateProject({ vr360: next }); setMsg('Đã lưu cấu hình ✓'); reload(); }
    catch (e: any) { setMsg('Lỗi: ' + e.message); }
  };
  const move = async (i: number, dir: number) => {
    const j = i + dir; if (j < 0 || j >= scenes.length) return;
    const nl = [...scenes]; [nl[i], nl[j]] = [nl[j], nl[i]]; setScenes(nl);
    const ups = nl.map((s, k) => (s.order !== k ? api.updateScene(s.id, { order: k }) : null)).filter(Boolean);
    try { await Promise.all(ups as any); load(); reload(); } catch (e: any) { setMsg('Lỗi: ' + e.message); }
  };
  const toggle = async (s: Scene) => { await api.updateScene(s.id, { enabled: !s.enabled }); load(); reload(); };
  const del = async (s: Scene) => { if (confirm('Xoá điểm 360 "' + (s.title?.vi || s.slug) + '"?')) { await api.deleteScene(s.id); load(); reload(); } };

  return (
    <div className="adm-body">
      <div className="adm-card">
        <h4 style={{ margin: '0 0 8px' }}>Cấu hình tour VR360</h4>
        <label className="chk-row" title="Ảnh 360° tự quay chậm; tạm dừng khi người xem chạm/kéo, tự quay lại sau vài giây.">
          <input type="checkbox" checked={!!cfg.autorotate} onChange={(e) => saveCfg({ ...cfg, autorotate: e.target.checked })} />
          <span>Tự động xoay 360° <span className="hint-q" title="Ảnh tự quay chậm; tạm dừng khi người xem thao tác.">ⓘ</span></span>
        </label>
        {cfg.autorotate && (
          <div style={{ maxWidth: 220, marginTop: 8 }}>
            <label title="Tốc độ tự xoay, độ/giây (3–15 hợp lý)">Tốc độ xoay (độ/giây)</label>
            <input type="number" min={1} max={30} value={cfg.speed ?? 6}
              onChange={(e) => setCfg({ ...cfg, speed: Number(e.target.value) })} onBlur={() => saveCfg(cfg)} />
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <label title="Điểm 360 hiển thị đầu tiên khi mở VR360">Điểm bắt đầu <span className="hint-q" title="Điểm 360 hiển thị đầu tiên khi mở VR360">ⓘ</span></label>
          <select value={cfg.startSlug || ''} onChange={(e) => saveCfg({ ...cfg, startSlug: e.target.value || null })}>
            <option value="">(Điểm đầu danh sách)</option>
            {scenes.map((s) => <option key={s.id} value={s.slug}>{s.title?.vi || s.slug}</option>)}
          </select>
        </div>
        {msg && <div className="msg" style={{ marginTop: 8 }}>{msg}</div>}
      </div>

      <div className="adm-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h4 style={{ margin: 0, flex: 1 }}>Điểm 360 (Scene) — {scenes.length}</h4>
          <button className="aprim" onClick={() => setEdit('new')}><NavIcon name="plus" size={17} /> Thêm điểm 360</button>
        </div>
        <p className="muted">Mỗi điểm là một ảnh 360°. Thêm nhiều điểm (kể cả lối đi, góc sân) để tour mượt; đặt <b>mũi tên</b> trong ảnh để đi sang điểm khác. Dùng nút lên/xuống để sắp thứ tự.</p>
        {scenes.length === 0 && <p className="muted">Chưa có điểm 360 — VR360 đang <b>tạm dùng</b> các địa điểm có ảnh 360. Thêm điểm 360 để bật chế độ tour Street View.</p>}
        <div className="vr-list">
          {scenes.map((s, i) => (
            <div className={'vr-row' + (!s.enabled ? ' off' : '')} key={s.id}>
              <div className="vr-ord">
                <button className="aic" disabled={i === 0} onClick={() => move(i, -1)} title="Lên"><NavIcon name="chevron-up" size={15} /></button>
                <button className="aic" disabled={i === scenes.length - 1} onClick={() => move(i, 1)} title="Xuống"><NavIcon name="chevron-down" size={15} /></button>
              </div>
              <div className="vr-thumb" style={s.pano ? { backgroundImage: `url(${s.pano})` } : undefined}>
                {!s.pano && <NavIcon name="image" size={18} />}
              </div>
              <div className="vr-main">
                <b>{s.title?.vi || s.slug}</b>
                <span>
                  {s.pano
                    ? <span className="ok-tag"><NavIcon name="check" size={12} /> ảnh 360</span>
                    : <span className="miss-tag">chưa có ảnh</span>}
                  {(s.hotspots?.length ?? 0) > 0 && <span className="ok-tag"><NavIcon name="arrow" size={12} /> {s.hotspots.length} mũi tên</span>}
                  {s.locationId && <span className="ok-tag"><NavIcon name="link" size={12} /> địa điểm</span>}
                </span>
              </div>
              <label className="chk-row" title="Bật/tắt hiển thị trong tour">
                <input type="checkbox" checked={s.enabled} onChange={() => toggle(s)} /><span>Bật</span>
              </label>
              <button className="aic" onClick={() => setEdit(s)} title="Sửa"><NavIcon name="edit" size={17} /></button>
              <button className="aic" onClick={() => del(s)} title="Xoá"><NavIcon name="trash" size={17} /></button>
            </div>
          ))}
        </div>
      </div>

      {edit && (
        <SceneEditor scene={edit === 'new' ? null : edit} scenes={scenes} locs={locs}
          onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); reload(); }} />
      )}
    </div>
  );
}

function SceneEditor({ scene, scenes, locs, onClose, onSaved }: any) {
  const [f, setF] = useState<any>(() => ({
    slug: scene?.slug || '', vi: scene?.title?.vi || '', en: scene?.title?.en || '',
    pano: scene?.pano || '', yaw: scene?.yaw ?? 0, locationId: scene?.locationId || '',
    enabled: scene ? scene.enabled : true, hotspots: scene?.hotspots ? [...scene.hotspots] : [],
  }));
  const [msg, setMsg] = useState('');
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const others = (scenes as Scene[]).filter((s) => s.slug !== scene?.slug);

  const uploadPano = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => {
      const file = inp.files?.[0]; if (!file) return; setMsg('Đang tải ảnh 360…');
      try { const r: any = await api.uploadMedia(file, 'PANO360'); set('pano', r?.meta?.optimized || r?.url || ''); setMsg('Đã tải ✓'); }
      catch (e: any) { setMsg('Lỗi tải: ' + e.message); }
    };
    inp.click();
  };
  const addHotspot = (yaw: number, pitch: number) =>
    setF((p: any) => ({ ...p, hotspots: [...p.hotspots, { id: 'h' + (p.hotspots.length + 1) + '-' + yaw + pitch, yaw, pitch, to: '' }] }));
  const setHs = (i: number, patch: any) => setF((p: any) => { const hs = [...p.hotspots]; hs[i] = { ...hs[i], ...patch }; return { ...p, hotspots: hs }; });
  const delHs = (i: number) => setF((p: any) => ({ ...p, hotspots: p.hotspots.filter((_: any, k: number) => k !== i) }));

  const save = async () => {
    if (!f.slug.trim()) { setMsg('Cần nhập mã (slug).'); return; }
    const payload = {
      slug: f.slug.trim(), title: { vi: f.vi || f.slug, en: f.en || undefined },
      pano: f.pano || undefined, yaw: Number(f.yaw) || 0, locationId: f.locationId || null,
      enabled: f.enabled, hotspots: f.hotspots.filter((h: any) => h.to),
    };
    try { if (scene) await api.updateScene(scene.id, payload); else await api.createScene(payload); onSaved(); }
    catch (e: any) { setMsg('Lỗi: ' + e.message); }
  };

  const panoSrc = f.pano ? normalize(f.pano, 'image') : '';

  return (
    <div className="admin-modal open" onClick={(e: any) => e.target === e.currentTarget && onClose()}>
      <div className="am-card am-wide">
        <span className="am-cls" onClick={onClose}>×</span>
        <h3 className="am-ttl">{scene ? 'Sửa điểm 360' : 'Thêm điểm 360'}</h3>
        <div className="frow">
          <div><label title="Mã không dấu, duy nhất. VD: c1-sanh, loi-di-1">Mã (slug)</label>
            <input value={f.slug} disabled={!!scene} onChange={(e) => set('slug', e.target.value)} placeholder="vd: c1-sanh" /></div>
          <div><label title="Liên kết tới địa điểm để hiện thông tin/Xưa-Nay khi bấm ℹ️ (tuỳ chọn)">Gắn địa điểm (tuỳ chọn)</label>
            <select value={f.locationId} onChange={(e) => set('locationId', e.target.value)}>
              <option value="">(không gắn — chỉ là điểm ngắm/đường đi)</option>
              {(locs as Location[]).map((l) => <option key={l.id} value={l.id}>{l.i18n?.vi?.name || l.slug}</option>)}
            </select></div>
        </div>
        <div className="frow">
          <div><label>Tên (vi)</label><input value={f.vi} onChange={(e) => set('vi', e.target.value)} placeholder="vd: Sảnh C1" /></div>
          <div><label>Tên (en)</label><input value={f.en} onChange={(e) => set('en', e.target.value)} /></div>
        </div>
        <label>Ảnh 360° (equirectangular 2:1)</label>
        <div className="frow">
          <input value={f.pano} placeholder="Dán link…" onChange={(e) => set('pano', e.target.value)} onBlur={(e) => set('pano', normalize(e.target.value, 'image'))} />
          <button className="asec" type="button" onClick={uploadPano}>Tải ảnh</button>
        </div>

        {panoSrc ? (
          <>
            <div className="pano-edit-wrap">
              <div className="pano-edit">
                <Panorama key={panoSrc} src={panoSrc} fallbackLabel={f.vi || f.slug} lang="vi" editMode
                  hotspots={f.hotspots.map((h: any) => {
                    const t = (scenes as Scene[]).find((x) => x.slug === h.to);
                    return { ...h, thumb: t?.pano ? normalize(t.pano, 'image') : undefined, name: t ? (t.title?.vi || t.slug) : undefined };
                  })}
                  onPick={addHotspot} />
              </div>
            </div>
            <div className="hs-edit">
              <b>Mũi tên di chuyển ({f.hotspots.length})</b>
              {f.hotspots.length === 0 && <p className="muted" style={{ margin: '4px 0' }}>Bấm lên ảnh để đặt mũi tên, rồi chọn điểm đích.</p>}
              {f.hotspots.map((h: any, i: number) => (
                <div className="hs-item" key={h.id || i}>
                  <span className="muted">#{i + 1} ({Math.round(h.yaw)}°,{Math.round(h.pitch)}°) →</span>
                  <select value={h.to} onChange={(e) => setHs(i, { to: e.target.value })}>
                    <option value="">(chọn điểm đích)</option>
                    {others.map((s) => <option key={s.id} value={s.slug}>{s.title?.vi || s.slug}</option>)}
                  </select>
                  <button className="aic" onClick={() => delHs(i)} title="Xoá"><NavIcon name="trash" size={16} /></button>
                </div>
              ))}
            </div>
          </>
        ) : <p className="muted">Tải/dán ảnh 360 để đặt mũi tên di chuyển.</p>}

        <div className="frow" style={{ marginTop: 8 }}>
          <div style={{ maxWidth: 160 }}><label title="Hướng nhìn ban đầu (độ)">Góc nhìn ban đầu</label>
            <input type="number" value={f.yaw} onChange={(e) => set('yaw', e.target.value)} /></div>
          <label className="chk-row" style={{ alignSelf: 'flex-end', paddingBottom: 8 }}>
            <input type="checkbox" checked={f.enabled} onChange={(e) => set('enabled', e.target.checked)} /><span>Bật trong tour</span>
          </label>
        </div>
        {msg && <div className="err">{msg}</div>}
        <div className="am-acts"><button className="aprim" onClick={save}>💾 Lưu</button><button className="asec" onClick={onClose}>Huỷ</button></div>
      </div>
    </div>
  );
}

/* ===================== USERS (chỉ SUPERADMIN) ===================== */
const ROLE_LABEL: Record<string, string> = { SUPERADMIN: 'Quản trị cao nhất', EDITOR: 'Biên tập (đội media)', VIEWER: 'Chỉ xem' };

function UsersPanel({ meId }: { meId?: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [edit, setEdit] = useState<User | 'new' | null>(null);
  const [msg, setMsg] = useState('');
  const load = async () => { try { setUsers(await api.adminUsers()); } catch (e: any) { setMsg(e.message); } };
  useEffect(() => { load(); }, []);

  const del = async (u: User) => {
    if (!confirm(`Xoá tài khoản ${u.email}?`)) return;
    try { await api.deleteUser(u.id!); setMsg('Đã xoá ✓'); load(); } catch (e: any) { setMsg('Lỗi: ' + e.message); }
  };

  return (
    <div className="adm-body">
      <div className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <b>Tài khoản truy cập</b>
          <p className="muted" style={{ margin: '4px 0 0' }}>Tạo tài khoản <b>Biên tập</b> cho đội media để cùng nhập nội dung.</p>
        </div>
        <button className="aprim" onClick={() => setEdit('new')}>+ Thêm tài khoản</button>
      </div>
      {msg && <div className="adm-card">{msg}</div>}
      <div className="user-list">
        {users.map((u) => (
          <div className="arow" key={u.id}>
            <div className="arow-main">
              <b>{u.name || u.email} {u.id === meId && <span className="miss-tag">bạn</span>}</b>
              <span>{u.email} · {ROLE_LABEL[u.role] || u.role}</span>
            </div>
            <button className="aic" onClick={() => setEdit(u)} title="Sửa"><NavIcon name="edit" size={17} /></button>
            {u.id !== meId && <button className="aic" onClick={() => del(u)} title="Xoá"><NavIcon name="trash" size={17} /></button>}
          </div>
        ))}
      </div>
      {edit && (
        <UserEditor
          user={edit === 'new' ? null : edit}
          onClose={() => setEdit(null)}
          onSaved={() => { setEdit(null); setMsg('Đã lưu ✓'); load(); }}
        />
      )}
    </div>
  );
}

function UserEditor({ user, onClose, onSaved }: { user: User | null; onClose: () => void; onSaved: () => void }) {
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || 'EDITOR');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const save = async () => {
    try {
      if (user) await api.updateUser(user.id!, { name, role, ...(password ? { password } : {}) });
      else {
        if (!email.trim() || password.length < 6) { setErr('Cần email và mật khẩu ≥ 6 ký tự.'); return; }
        await api.createUser({ email: email.trim(), password, name, role });
      }
      onSaved();
    } catch (e: any) { setErr(e.message); }
  };
  return (
    <div className="admin-modal open" onClick={(e: any) => e.target === e.currentTarget && onClose()}>
      <div className="am-card">
        <span className="am-cls" onClick={onClose}>×</span>
        <h3 className="am-ttl">{user ? 'Sửa tài khoản' : 'Thêm tài khoản'}</h3>
        <label>Email</label>
        <input value={email} disabled={!!user} onChange={(e) => setEmail(e.target.value)} placeholder="vd: media@bk360.local" />
        <label>Tên hiển thị</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="vd: Nguyễn Văn A" />
        <label title="Biên tập: nhập/sửa nội dung. Quản trị cao nhất: thêm cả tài khoản. Chỉ xem: chỉ đăng nhập xem.">Vai trò <span className="hint-q" title="Biên tập: nhập/sửa nội dung. Quản trị cao nhất: thêm cả tài khoản. Chỉ xem: chỉ đăng nhập xem.">ⓘ</span></label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="EDITOR">Biên tập (đội media)</option>
          <option value="VIEWER">Chỉ xem</option>
          <option value="SUPERADMIN">Quản trị cao nhất</option>
        </select>
        <label>{user ? 'Đặt lại mật khẩu (bỏ trống nếu giữ nguyên)' : 'Mật khẩu (≥ 6 ký tự)'}</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
        {err && <div className="err">{err}</div>}
        <div className="am-acts"><button className="aprim" onClick={save}>💾 Lưu</button><button className="asec" onClick={onClose}>Huỷ</button></div>
      </div>
    </div>
  );
}

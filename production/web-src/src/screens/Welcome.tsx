import type { Lang, Screen, WelcomeConfig } from '../types';
import { t } from '../i18n';

// Hình học dây cờ võng (parabol): top0 = mép treo 2 đầu, dip = độ võng giữa.
const BT = (() => {
  const N = 13, top0 = 8, dip = 48;
  const curve = (x: number) => top0 + dip * (1 - Math.pow(2 * x - 1, 2));
  const flags = Array.from({ length: N }).map((_, i) => {
    const x = i / (N - 1);
    return {
      i,
      left: x * 100,
      top: curve(x), // bám đúng đường cong của dây
      rot: (2 * x - 1) * 18, // nghiêng theo độ dốc của dây
      delay: ((i * 0.37) % 2).toFixed(2),
      dur: (2.4 + ((i % 3) * 0.45)).toFixed(2),
    };
  });
  // Tua rua xoắn (streamer) thả từ dây ở vài điểm — vẽ bằng đường sin cuộn.
  const streamers = [0.16, 0.5, 0.84].map((x, k) => {
    const len = 62, amp = 8, waves = 3.6, steps = 40;
    const pts: string[] = [];
    for (let s = 0; s <= steps; s++) {
      const ty = s / steps;
      pts.push(`${(amp + amp * Math.sin(ty * Math.PI * 2 * waves)).toFixed(1)} ${(ty * len).toFixed(1)}`);
    }
    return {
      k, left: x * 100, top: curve(x), len, w: amp * 2 + 6,
      d: 'M' + pts.join(' L'),
      color: ['#3f8fd0', '#e2342f', '#ffcf4d'][k],
      delay: (k * 0.5).toFixed(2), dur: (3.2 + k * 0.6).toFixed(2),
    };
  });
  return { top0, dip, flags, streamers };
})();

export default function Welcome({
  lang,
  setLang,
  enabledCampaigns,
  isAdmin,
  welcome,
  onGo,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  enabledCampaigns: number;
  isAdmin: boolean;
  welcome?: WelcomeConfig | null;
  onGo: (s: Screen) => void;
}) {
  const w = welcome || {};
  const ribbonCustom = w.ribbon?.[lang];
  const years = w.years || '1956 — 2026';
  const tagline = w.tagline?.[lang] || t('appTag', lang);
  const subtitle = w.subtitle?.[lang] || t('subtitle', lang);
  const effects = w.effects !== false; // mặc định bật
  // Ảnh nền tuỳ chọn: phủ lớp kem trong suốt phía trên để giữ tông sáng & chữ dễ đọc.
  const bgStyle = w.bg
    ? { backgroundImage: `linear-gradient(rgba(255,248,238,.62), rgba(255,235,219,.82)), url(${w.bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;
  const tiles: { id: Screen; icon: string; bg: string; fg?: string; title: string; desc: string }[] = [
    { id: 'map2d', icon: '🗺️', bg: '#9e1b32', title: t('map2d', lang), desc: t('map2dDesc', lang) },
    { id: 'vr360', icon: '🌐', bg: '#0e8a8a', title: t('vr360', lang), desc: t('vr360Desc', lang) },
    ...(enabledCampaigns > 0
      ? [{ id: 'event' as Screen, icon: '⭐', bg: '#f5b301', fg: '#3a2b00', title: t('events', lang), desc: t('eventsDesc', lang) }]
      : []),
  ];

  return (
    <div className="screen show welcome" style={bgStyle}>
      {/* Trang trí lễ hội — bật/tắt theo cấu hình */}
      {effects && <>
      <div className="bunting" aria-hidden="true">
        <svg className="bstring" viewBox="0 0 100 124" preserveAspectRatio="none">
          <path d={`M0 ${BT.top0} Q50 ${BT.top0 + 2 * BT.dip} 100 ${BT.top0}`} fill="none" stroke="#bd7c42" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </svg>
        {BT.streamers.map((st) => (
          <svg
            key={'s' + st.k}
            className="streamer"
            width={st.w}
            height={st.len}
            viewBox={`0 0 ${st.w} ${st.len}`}
            style={{ left: `${st.left}%`, top: `${st.top}px`, animationDelay: `${st.delay}s`, animationDuration: `${st.dur}s` }}
          >
            <path d={st.d} fill="none" stroke={st.color} strokeWidth={3.5} strokeLinecap="round" />
          </svg>
        ))}
        {BT.flags.map((f) => (
          <span key={f.i} className="bflag" style={{ left: `${f.left}%`, top: `${f.top}px`, transform: `translateX(-50%) rotate(${f.rot}deg)` }}>
            <i className={`cr${f.i % 2}`} style={{ animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }} />
          </span>
        ))}
      </div>
      <div className="fest-rays" aria-hidden="true" />
      <div className="fest-glow" aria-hidden="true" />
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 22 }).map((_, i) => (
          <span
            key={i}
            className={`cf c${i % 7}`}
            style={{ left: `${(i * 4.6 + 2) % 100}%`, animationDelay: `${(i % 9) * 0.7}s`, animationDuration: `${6 + (i % 5)}s` }}
          />
        ))}
      </div>
      </>}

      <button className="lang-btn" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}>
        {lang === 'vi' ? 'EN' : 'VI'}
      </button>
      <button className="admin-btn" onClick={() => onGo('admin')} title={t('admin', lang)}>
        {isAdmin ? '🔓' : '🔒'}
      </button>

      <div className="wrap">
        <div className="ribbon">
          🎉 {ribbonCustom ? <>{ribbonCustom}</> : (lang === 'vi' ? <>Chào mừng <b>70 năm</b></> : <>Welcome · <b>70 Years</b></>)} 🎉
        </div>

        <div className="years">{years}</div>

        <h1 className="brand">{w.title?.trim() ? w.title : <>BK<span className="g">360</span></>}</h1>
        <div className="tag">{tagline}</div>
        <div className="sub">{subtitle}</div>

        <div className="opts">
          {tiles.map((tl) => (
            <div className="opt" key={tl.id} onClick={() => onGo(tl.id)}>
              <div className="ic" style={{ background: tl.bg, color: tl.fg || '#fff' }}>{tl.icon}</div>
              <div className="t"><b>{tl.title}</b><span>{tl.desc}</span></div>
              <div className="arw">›</div>
            </div>
          ))}
        </div>

        <div className="welcome-foot">Đại học Bách khoa Hà Nội · 1956–2026</div>
      </div>
    </div>
  );
}

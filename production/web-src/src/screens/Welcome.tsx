import type { Lang, Screen } from '../types';
import { t } from '../i18n';

export default function Welcome({
  lang,
  setLang,
  enabledCampaigns,
  isAdmin,
  onGo,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  enabledCampaigns: number;
  isAdmin: boolean;
  onGo: (s: Screen) => void;
}) {
  const tiles: { id: Screen; icon: string; bg: string; fg?: string; title: string; desc: string }[] = [
    { id: 'map2d', icon: '🗺️', bg: '#9e1b32', title: t('map2d', lang), desc: t('map2dDesc', lang) },
    { id: 'vr360', icon: '🌐', bg: '#0e8a8a', title: t('vr360', lang), desc: t('vr360Desc', lang) },
    ...(enabledCampaigns > 0
      ? [{ id: 'event' as Screen, icon: '⭐', bg: '#f5b301', fg: '#3a2b00', title: t('events', lang), desc: t('eventsDesc', lang) }]
      : []),
  ];

  return (
    <div className="screen show welcome">
      {/* Trang trí lễ hội */}
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

      <button className="lang-btn" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}>
        {lang === 'vi' ? 'EN' : 'VI'}
      </button>
      <button className="admin-btn" onClick={() => onGo('admin')} title={t('admin', lang)}>
        {isAdmin ? '🔓' : '🔒'}
      </button>

      <div className="wrap">
        <div className="ribbon">
          🎉 {lang === 'vi' ? <>Chào mừng <b>70 năm</b></> : <>Welcome · <b>70 Years</b></>} 🎉
        </div>

        <div className="emblem">
          <span className="em70">70</span>
          <span className="emyr">{lang === 'vi' ? 'NĂM' : 'YEARS'}</span>
        </div>
        <div className="years">1956 — 2026</div>

        <h1 className="brand">BK<span className="g">360</span></h1>
        <div className="tag">{t('appTag', lang)}</div>
        <div className="sub">{t('subtitle', lang)}</div>

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

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
  return (
    <div className="screen show welcome">
      <div className="wbg" />
      <button className="lang-btn" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}>
        {lang === 'vi' ? 'EN' : 'VI'}
      </button>
      <button className="admin-btn" onClick={() => onGo('admin')} title={t('admin', lang)}>
        {isAdmin ? '🔓' : '🔒'}
      </button>
      <div className="wrap">
        <span className="badge70">★ 1956 – 2026 · 70 {lang === 'vi' ? 'NĂM' : 'YEARS'}</span>
        <h1>BK360</h1>
        <div className="tag">{t('appTag', lang)}</div>
        <div className="sub">{t('subtitle', lang)}</div>
        <div className="opts">
          <div className="opt" onClick={() => onGo('map2d')}>
            <div className="ic" style={{ background: '#9e1b32' }}>🗺️</div>
            <div className="t"><b>{t('map2d', lang)}</b><span>{t('map2dDesc', lang)}</span></div>
            <div className="arw">›</div>
          </div>
          <div className="opt" onClick={() => onGo('vr360')}>
            <div className="ic" style={{ background: '#0a3d62' }}>🌐</div>
            <div className="t"><b>{t('vr360', lang)}</b><span>{t('vr360Desc', lang)}</span></div>
            <div className="arw">›</div>
          </div>
          {enabledCampaigns > 0 && (
            <div className="opt" onClick={() => onGo('event')}>
              <div className="ic" style={{ background: '#7a3cc8' }}>⭐</div>
              <div className="t"><b>{t('events', lang)}</b><span>{t('eventsDesc', lang)}</span></div>
              <div className="arw">›</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

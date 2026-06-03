import { useState } from 'react';
import type { Campaign, Lang, Location } from '../types';
import { t, tx } from '../i18n';
import CampusMap from '../components/CampusMap';
import InfoPanel from '../components/InfoPanel';

export default function EventScreen({
  campaigns,
  locations,
  lang,
  mapBg,
  onBack,
}: {
  campaigns: Campaign[];
  locations: Location[];
  lang: Lang;
  mapBg?: string | null;
  onBack: () => void;
}) {
  const [activeId, setActiveId] = useState(campaigns[0]?.id);
  const camp = campaigns.find((c) => c.id === activeId) ?? campaigns[0] ?? null;
  const [sel, setSel] = useState<Location | null>(null);

  const liveN = camp?.schedule.filter((e) => e.live).length ?? 0;
  const locOf = (slug: string) => locations.find((l) => l.slug === slug);
  const selEvents = sel ? (camp?.schedule.filter((e) => e.loc === sel.slug) ?? []) : [];

  return (
    <div className="screen show event">
      <div className="sbar">
        <div className="home" onClick={onBack}>‹</div>
        <div className="ttl">
          <b>{camp ? tx(camp.i18n, lang, 'name') : t('events', lang)}</b>
          <span>
            {liveN
              ? `${liveN} ${lang === 'vi' ? 'hoạt động đang diễn ra — chạm tín hiệu 📡' : 'live now — tap the signal 📡'}`
              : camp
                ? camp.icon + ' ' + tx(camp.i18n, lang, 'name')
                : ''}
          </span>
        </div>
      </div>
      <div className="mapstage">
        <CampusMap id="svgEvent" locations={locations} lang={lang} mode="event" campaign={camp} mapBg={mapBg} onSelect={setSel} />
      </div>
      <div className="sched">
        {campaigns.length > 1 && (
          <div className="camp-tabs">
            {campaigns.map((c) => (
              <button
                key={c.id}
                className={`camp-tab ${c.id === camp?.id ? 'on' : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                {c.icon} {tx(c.i18n, lang, 'name')}
              </button>
            ))}
          </div>
        )}
        <h3>
          {t('schedule', lang)} · {camp ? tx(camp.i18n, lang, 'name') : ''}
        </h3>
        {camp?.schedule.map((e, i) => {
          const l = locOf(e.loc);
          return (
            <div className="ev-item" key={i} onClick={() => l && setSel(l)}>
              <div className="tm">{e.time}</div>
              <div className="info-mini">
                <b>{e.title[lang] ?? e.title.vi}</b>
                <span>📍 {l ? tx(l.i18n, lang, 'name') : e.loc}</span>
                {e.live ? (
                  <div className="live-tag"><span className="live-dot" />{t('live', lang)}</div>
                ) : (
                  <div className="soon-tag">{t('soon', lang)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {sel && <InfoPanel location={sel} lang={lang} events={selEvents} onClose={() => setSel(null)} />}
    </div>
  );
}

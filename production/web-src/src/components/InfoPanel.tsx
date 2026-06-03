import type { Lang, Location, ScheduleItem } from '../types';
import { tx, t } from '../i18n';
import { makeFacade, mediaUrl } from '../generate';
import CompareSlider from './CompareSlider';

function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'vi-VN';
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

export default function InfoPanel({
  location,
  lang,
  events,
  onClose,
}: {
  location: Location;
  lang: Lang;
  events?: ScheduleItem[];
  onClose: () => void;
}) {
  const name = tx(location.i18n, lang, 'name');
  const desc = tx(location.i18n, lang, 'description');
  const voice = tx(location.i18n, lang, 'voiceText') || desc || name;
  const before = mediaUrl(location, 'OLD') ?? makeFacade(location.palette, 'xua', location.slug);
  const after = mediaUrl(location, 'NOW') ?? makeFacade(location.palette, 'nay', location.slug);

  return (
    <div className="info open">
      <div className="hd">
        <span className="cls" onClick={onClose}>×</span>
        <h3>{name}</h3>
      </div>
      <div className="body">
        <p>{desc}</p>
        <button className="voice-btn" onClick={() => speak(voice)}>
          {t('listen', lang)}
        </button>

        {events && events.length > 0 ? (
          <>
            <div className="map-title">{t('eventsHere', lang)}</div>
            {events.map((e, i) => (
              <div className="ev-item static" key={i}>
                <div className="tm">{e.time}</div>
                <div className="info-mini">
                  <b>{e.title[lang] ?? e.title.vi}</b>
                  {e.live ? (
                    <div className="live-tag"><span className="live-dot" />{t('live', lang)}</div>
                  ) : (
                    <div className="soon-tag">{t('soon', lang)}</div>
                  )}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="map-title">{t('thenNow', lang)}</div>
            <CompareSlider before={before} after={after} />
            <div className="cmp-hint">{t('dragCompare', lang)}</div>
            <div className="map-title">{t('timeline', lang)}</div>
            <div className="tl">
              {location.history?.map((h, i) => (
                <div className="ev" key={i}>
                  <b>{h.year}</b>
                  <p>{h.content}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

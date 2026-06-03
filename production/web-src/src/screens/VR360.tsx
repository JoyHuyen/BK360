import { useRef, useState } from 'react';
import type { Lang, Location, Vr360Config } from '../types';
import { tx } from '../i18n';
import Panorama from '../components/Panorama';
import InfoPanel from '../components/InfoPanel';

function toggleFullscreen(el: HTMLElement | null) {
  if (!el) return;
  if (document.fullscreenElement) document.exitFullscreen?.();
  else el.requestFullscreen?.().catch(() => {});
}

export default function VR360({
  locations,
  lang,
  vr360,
  onBack,
}: {
  locations: Location[];
  lang: Lang;
  vr360?: Vr360Config | null;
  onBack: () => void;
}) {
  // Tour gồm địa điểm đang hiện & không bị loại khỏi VR360.
  const visible = locations.filter((l) => !l.isHidden && !l.settings?.vrExclude);
  const [idx, setIdx] = useState(() => {
    const i = vr360?.startSlug ? visible.findIndex((l) => l.slug === vr360.startSlug) : -1;
    return i >= 0 ? i : 0;
  });
  const [info, setInfo] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = visible[idx];

  if (!current) {
    return (
      <div className="screen show vr">
        <div className="hud-top"><button className="icbtn" onClick={onBack}>‹</button></div>
        <p style={{ color: '#fff', margin: 'auto' }}>Chưa có địa điểm.</p>
      </div>
    );
  }

  return (
    <div className="screen show vr" ref={rootRef}>
      <Panorama
        location={current}
        lang={lang}
        autorotate={vr360?.autorotate}
        speed={vr360?.speed}
        initialYaw={current.settings?.vrYaw}
      />
      <div className="hud-top">
        <button className="icbtn" onClick={onBack}>‹</button>
        <div className="txt">
          <h2>{tx(current.i18n, lang, 'name')}</h2>
          <div className="yr">{tx(current.i18n, lang, 'year')}</div>
        </div>
        <button className="icbtn" onClick={() => toggleFullscreen(rootRef.current)} title="Toàn màn hình">⛶</button>
        <button className="icbtn" onClick={() => setInfo(true)}>ℹ️</button>
      </div>

      <div className="vr-strip">
        {visible.map((l, i) => (
          <button key={l.id} className={`chip ${i === idx ? 'on' : ''}`} onClick={() => setIdx(i)}>
            {tx(l.i18n, lang, 'short') || tx(l.i18n, lang, 'name')}
          </button>
        ))}
      </div>

      {info && <InfoPanel location={current} lang={lang} onClose={() => setInfo(false)} />}
    </div>
  );
}

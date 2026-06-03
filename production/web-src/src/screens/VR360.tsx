import { useRef, useState } from 'react';
import type { Lang, Location } from '../types';
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
  onBack,
}: {
  locations: Location[];
  lang: Lang;
  onBack: () => void;
}) {
  const visible = locations.filter((l) => !l.isHidden);
  const [idx, setIdx] = useState(0);
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
      <Panorama location={current} lang={lang} />
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

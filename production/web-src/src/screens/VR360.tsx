import { useRef, useState } from 'react';
import type { Lang, Location, Scene, Vr360Config, Hotspot } from '../types';
import { tx } from '../i18n';
import { mediaUrl } from '../generate';
import Panorama from '../components/Panorama';
import InfoPanel from '../components/InfoPanel';

interface Stop {
  slug: string;
  src?: string | null;
  label: string;
  palette?: any;
  yaw?: number;
  hotspots: Hotspot[];
  loc?: Location;
}

function toggleFullscreen(el: HTMLElement | null) {
  if (!el) return;
  if (document.fullscreenElement) document.exitFullscreen?.();
  else el.requestFullscreen?.().catch(() => {});
}

export default function VR360({
  scenes,
  locations,
  lang,
  vr360,
  onBack,
}: {
  scenes: Scene[];
  locations: Location[];
  lang: Lang;
  vr360?: Vr360Config | null;
  onBack: () => void;
}) {
  // Ưu tiên danh sách Scene; nếu chưa có scene nào → fallback dùng địa điểm có 360.
  const useScenes = (scenes?.length ?? 0) > 0;
  const stops: Stop[] = useScenes
    ? scenes
        .filter((s) => s.enabled)
        .map((s) => ({
          slug: s.slug,
          src: s.pano,
          label: s.title?.[lang] || s.title?.vi || s.slug,
          yaw: s.yaw ?? undefined,
          hotspots: s.hotspots || [],
          loc: locations.find((l) => l.id === s.locationId),
        }))
    : locations
        .filter((l) => !l.isHidden && !l.settings?.vrExclude)
        .map((l) => ({
          slug: l.slug,
          src: mediaUrl(l, 'PANO360'),
          label: tx(l.i18n, lang, 'name'),
          palette: l.palette,
          yaw: l.settings?.vrYaw,
          hotspots: [],
          loc: l,
        }));

  const [idx, setIdx] = useState(() => {
    const i = vr360?.startSlug ? stops.findIndex((s) => s.slug === vr360.startSlug) : -1;
    return i >= 0 ? i : 0;
  });
  const [info, setInfo] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = stops[idx];

  if (!current) {
    return (
      <div className="screen show vr">
        <div className="hud-top"><button className="icbtn" onClick={onBack}>‹</button></div>
        <p style={{ color: '#fff', margin: 'auto' }}>Chưa có điểm 360 nào.</p>
      </div>
    );
  }

  const go = (slug: string) => { const i = stops.findIndex((s) => s.slug === slug); if (i >= 0) setIdx(i); };

  return (
    <div className="screen show vr" ref={rootRef}>
      <Panorama
        key={current.slug}
        src={current.src}
        fallbackLabel={current.label}
        palette={current.palette}
        lang={lang}
        autorotate={vr360?.autorotate}
        speed={vr360?.speed}
        initialYaw={current.yaw}
        hotspots={current.hotspots}
        onHotspot={go}
      />
      <div className="hud-top">
        <button className="icbtn" onClick={onBack}>‹</button>
        <div className="txt">
          <h2>{current.label}</h2>
          {current.loc && <div className="yr">{tx(current.loc.i18n, lang, 'year')}</div>}
        </div>
        <button className="icbtn" onClick={() => toggleFullscreen(rootRef.current)} title="Toàn màn hình">⛶</button>
        {current.loc && <button className="icbtn" onClick={() => setInfo(true)}>ℹ️</button>}
      </div>

      {stops.length > 1 && (
        <>
          <button className="vr-nav prev" onClick={() => setIdx((idx - 1 + stops.length) % stops.length)} title="Trước">‹</button>
          <button className="vr-nav next" onClick={() => setIdx((idx + 1) % stops.length)} title="Tiếp">›</button>
        </>
      )}

      <div className="vr-strip">
        {stops.map((s, i) => (
          <button key={s.slug} className={`chip ${i === idx ? 'on' : ''}`} onClick={() => setIdx(i)}>
            {s.label}
          </button>
        ))}
      </div>

      {info && current.loc && <InfoPanel location={current.loc} lang={lang} onClose={() => setInfo(false)} />}
    </div>
  );
}

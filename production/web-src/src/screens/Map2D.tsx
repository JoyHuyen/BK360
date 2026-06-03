import { useState } from 'react';
import type { Lang, Location } from '../types';
import { t } from '../i18n';
import CampusMap from '../components/CampusMap';
import InfoPanel from '../components/InfoPanel';

export default function Map2D({
  locations,
  lang,
  onBack,
}: {
  locations: Location[];
  lang: Lang;
  onBack: () => void;
}) {
  const [sel, setSel] = useState<Location | null>(null);
  return (
    <div className="screen show">
      <div className="sbar">
        <div className="home" onClick={onBack}>‹</div>
        <div className="ttl">
          <b>{t('map2d', lang)}</b>
          <span>{lang === 'vi' ? 'Chạm vào một toà nhà để xem lịch sử' : 'Tap a building to see its history'}</span>
        </div>
      </div>
      <div className="mapstage">
        <CampusMap id="svgMap2d" locations={locations} lang={lang} mode="map" onSelect={setSel} />
        <div className="hint">{t('tapBuilding', lang)}</div>
      </div>
      {sel && <InfoPanel location={sel} lang={lang} onClose={() => setSel(null)} />}
    </div>
  );
}

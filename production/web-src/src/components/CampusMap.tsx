import type { Campaign, Lang, Location } from '../types';
import { tx } from '../i18n';

// Bản đồ nền vẽ tay (sinh từ ban-do-bk-vetay.html -> generate-map-svg.cjs).
// Toạ độ địa điểm (mapX/mapY) nằm trong hệ viewBox 1250 x 1070 của ảnh nền.
const MAP_URL = `${import.meta.env.BASE_URL}campus-map.svg`;
const VB_W = 1250;
const VB_H = 1070;

// Tín hiệu LIVE (vòng lan toả) cho địa điểm đang có sự kiện.
function Signal({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g pointerEvents="none">
      <circle cx={cx} cy={cy} r={24} fill="none" stroke="#16a34a" strokeWidth={5}>
        <animate attributeName="r" values="24;88" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.85;0" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={20} fill="#16a34a" stroke="#fff" strokeWidth={3} />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={20} pointerEvents="none">📡</text>
      <text className="siglab" x={cx} y={cy - 32} fontSize={15}>● LIVE</text>
    </g>
  );
}

// Pin đánh dấu địa điểm có thông tin (gợi ý chạm được).
function Pin({ cx, cy, evt }: { cx: number; cy: number; evt?: boolean }) {
  const color = evt ? '#7a3cc8' : '#c8102e';
  return (
    <g pointerEvents="none">
      <ellipse cx={cx} cy={cy + 2} rx={9} ry={3} fill="rgba(0,0,0,.25)" />
      <path
        d={`M ${cx} ${cy} C ${cx - 13} ${cy - 18} ${cx - 11} ${cy - 36} ${cx} ${cy - 36} C ${cx + 11} ${cy - 36} ${cx + 13} ${cy - 18} ${cx} ${cy} Z`}
        fill={color}
        stroke="#fff"
        strokeWidth={2.5}
      />
      <circle cx={cx} cy={cy - 24} r={6} fill="#fff" />
    </g>
  );
}

export default function CampusMap({
  id,
  locations,
  lang,
  mode,
  campaign,
  onSelect,
}: {
  id: string;
  locations: Location[];
  lang: Lang;
  mode: 'map' | 'event';
  campaign?: Campaign | null;
  onSelect: (l: Location) => void;
}) {
  const eventLocs = new Set(campaign?.schedule.map((e) => e.loc) ?? []);
  const liveLocs = new Set(campaign?.schedule.filter((e) => e.live).map((e) => e.loc) ?? []);
  const visible = locations.filter((l) => !l.isHidden);

  return (
    <svg id={id} className="campus" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
      {/* Nền bản đồ vẽ tay */}
      <image href={MAP_URL} x={0} y={0} width={VB_W} height={VB_H} />

      {/* Lớp tương tác: vùng chạm trong suốt + pin gợi ý cho từng địa điểm */}
      {visible.map((l) => {
        const evt = mode === 'event' && eventLocs.has(l.slug);
        return (
          <g
            key={l.id}
            className="hotspot"
            onClick={() => onSelect(l)}
            role="button"
            aria-label={tx(l.i18n, lang, 'name')}
          >
            <circle cx={l.mapX} cy={l.mapY} r={48} fill="transparent" style={{ cursor: 'pointer' }} />
            {!(mode === 'event' && liveLocs.has(l.slug)) && <Pin cx={l.mapX} cy={l.mapY} evt={evt} />}
          </g>
        );
      })}

      {/* Tín hiệu LIVE (chỉ ở chế độ sự kiện) */}
      {mode === 'event' &&
        visible
          .filter((l) => liveLocs.has(l.slug))
          .map((l) => <Signal key={'sig-' + l.id} cx={l.mapX} cy={l.mapY} />)}
    </svg>
  );
}

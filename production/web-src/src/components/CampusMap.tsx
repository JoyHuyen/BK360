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

// Điểm đánh dấu địa điểm có thông tin: vòng tròn trắng + chấm + nhãn tên.
// Hover (lớp .hotspot) → nhún lên + vòng lan toả (CSS).
function Marker({ cx, cy, name, evt }: { cx: number; cy: number; name: string; evt?: boolean }) {
  const color = evt ? '#f5b301' : '#c8102e';
  const w = Math.min(220, Math.max(60, name.length * 13 + 22));
  const ly = cy + 26; // nhãn dưới vòng tròn
  return (
    <g className="mk" pointerEvents="none">
      <circle className="mk-pulse" cx={cx} cy={cy} r={16} fill="none" stroke={color} strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={15} fill="#fff" stroke={color} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={6} fill={color} />
      <g className="mk-label">
        <rect x={cx - w / 2} y={ly} width={w} height={26} rx={13} fill="rgba(255,255,255,.95)" stroke="rgba(0,0,0,.08)" />
        <text x={cx} y={ly + 18} textAnchor="middle" fontSize={15} fontWeight={700} fill="#1d2b40">{name}</text>
      </g>
    </g>
  );
}

export default function CampusMap({
  id,
  locations,
  lang,
  mode,
  campaign,
  mapBg,
  onSelect,
}: {
  id: string;
  locations: Location[];
  lang: Lang;
  mode: 'map' | 'event';
  campaign?: Campaign | null;
  mapBg?: string | null;
  onSelect: (l: Location) => void;
}) {
  const eventLocs = new Set(campaign?.schedule.map((e) => e.loc) ?? []);
  const liveLocs = new Set(campaign?.schedule.filter((e) => e.live).map((e) => e.loc) ?? []);
  const visible = locations.filter((l) => !l.isHidden);

  return (
    <svg id={id} className="campus" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
      {/* Nền bản đồ: ảnh nền tuỳ chọn của project, mặc định bản đồ vẽ tay.
          preserveAspectRatio=none → fill khít khung 1250×1070 để pin khớp giữa admin & người xem. */}
      <image href={mapBg || MAP_URL} x={0} y={0} width={VB_W} height={VB_H} preserveAspectRatio="none" />

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
            <circle cx={l.mapX} cy={l.mapY} r={44} fill="transparent" style={{ cursor: 'pointer' }} />
            {!(mode === 'event' && liveLocs.has(l.slug)) && <Marker cx={l.mapX} cy={l.mapY} name={tx(l.i18n, lang, 'name')} evt={evt} />}
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

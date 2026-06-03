import type { Campaign, Lang, Location } from '../types';
import { tx } from '../i18n';

const DECOR = (
  <>
    <path className="road" d="M 150 250 V 800" />
    <path className="road" d="M 150 410 H 660" />
    <path className="road" d="M 485 250 V 660" />
    <ellipse className="green" cx="560" cy="370" rx="140" ry="80" />
    <ellipse className="green" cx="300" cy="540" rx="120" ry="70" />
    <ellipse className="green" cx="120" cy="760" rx="120" ry="70" />
  </>
);

function geom(l: Location) {
  const s = l.shape;
  if (s?.type === 'rect') {
    const w = s.w ?? 150, h = s.h ?? 120;
    return { cx: l.mapX, cy: l.mapY, laby: l.mapY + h / 2 + 26, w, h };
  }
  if (s?.type === 'stadium') return { cx: l.mapX, cy: l.mapY, laby: l.mapY + (s.ry ?? 80) + 26 };
  return { cx: l.mapX, cy: l.mapY, laby: l.mapY + 82 }; // arch
}

function Shape({ l }: { l: Location }) {
  const s = l.shape;
  if (s?.type === 'rect') {
    const w = s.w ?? 150, h = s.h ?? 120;
    return <rect className="shape" x={l.mapX - w / 2} y={l.mapY - h / 2} width={w} height={h} rx={10} />;
  }
  if (s?.type === 'stadium')
    return <ellipse className="shape" cx={l.mapX} cy={l.mapY} rx={s.rx ?? 140} ry={s.ry ?? 90} />;
  const c = l.mapX, y = l.mapY;
  const d = `M ${c - 58} ${y + 72} L ${c - 58} ${y - 12} Q ${c} ${y - 98} ${c + 58} ${y - 12} L ${c + 58} ${y + 72} L ${c + 34} ${y + 72} L ${c + 34} ${y + 2} Q ${c} ${y - 58} ${c - 34} ${y + 2} L ${c - 34} ${y + 72} Z`;
  return <path className="shape" d={d} />;
}

function Signal({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g pointerEvents="none">
      <circle cx={cx} cy={cy} r={16} fill="none" stroke="#16a34a" strokeWidth={4}>
        <animate attributeName="r" values="16;62" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.85;0" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={16} fill="#16a34a" stroke="#fff" strokeWidth={2} />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={16}>📡</text>
      <text className="siglab" x={cx} y={cy - 28}>● LIVE</text>
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
    <svg id={id} className="campus" viewBox="0 0 720 860" preserveAspectRatio="xMidYMid meet">
      {DECOR}
      {visible.map((l) => {
        const g = geom(l);
        const evt = mode === 'event' && eventLocs.has(l.slug);
        return (
          <g key={l.id} className={`bld ${evt ? 'evt' : ''}`} onClick={() => onSelect(l)}>
            <Shape l={l} />
            <text className="blab" x={g.cx} y={g.laby}>
              {tx(l.i18n, lang, 'name')}
            </text>
          </g>
        );
      })}
      {mode === 'event' &&
        visible
          .filter((l) => liveLocs.has(l.slug))
          .map((l) => <Signal key={'sig-' + l.id} cx={l.mapX} cy={l.mapY} />)}
    </svg>
  );
}

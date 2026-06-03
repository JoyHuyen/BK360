import { useEffect, useRef, useState } from 'react';
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

  // ----- Zoom & pan (imperative để không re-render mỗi khung hình → mượt trên mobile) -----
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const viewRef = useRef(view); viewRef.current = view;
  const drag = useRef<{ px: number; py: number; x0: number; y0: number } | null>(null);
  const pinch = useRef<{ d: number } | null>(null);
  const moved = useRef(false);
  const raf = useRef(0);
  const MIN_K = 1, MAX_K = 5;

  const toVB = (cx: number, cy: number) => {
    const svg = svgRef.current; if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    const s = Math.min(r.width / VB_W, r.height / VB_H);
    const ox = (r.width - VB_W * s) / 2, oy = (r.height - VB_H * s) / 2;
    return { x: (cx - r.left - ox) / s, y: (cy - r.top - oy) / s };
  };
  const clampV = (k: number, x: number, y: number) => ({
    k, x: Math.min(0, Math.max(VB_W * (1 - k), x)), y: Math.min(0, Math.max(VB_H * (1 - k), y)),
  });
  const applyT = (v: { k: number; x: number; y: number }) => {
    if (gRef.current) gRef.current.setAttribute('transform', `translate(${v.x} ${v.y}) scale(${v.k})`);
  };
  // Trong cử chỉ: chỉ đổi transform (gộp theo rAF), KHÔNG setState.
  const live = (v: any) => { viewRef.current = v; if (!raf.current) raf.current = requestAnimationFrame(() => { raf.current = 0; applyT(viewRef.current); }); };
  // Rời rạc (nút/cuộn/thả tay): cập nhật state để render & cursor.
  const commit = (v: any) => { viewRef.current = v; setView(v); };

  const zoomCompute = (P: { x: number; y: number }, kt: number) => {
    const v = viewRef.current;
    const k = Math.max(MIN_K, Math.min(MAX_K, kt));
    return clampV(k, P.x - (P.x - v.x) * (k / v.k), P.y - (P.y - v.y) * (k / v.k));
  };
  const center = () => ({ x: VB_W / 2, y: VB_H / 2 });
  const zoomBtn = (factor: number) => commit(zoomCompute(center(), viewRef.current.k * factor));
  const reset = () => commit({ k: 1, x: 0, y: 0 });

  const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const onDown = (cx: number, cy: number) => { drag.current = { px: cx, py: cy, x0: viewRef.current.x, y0: viewRef.current.y }; moved.current = false; };
  const onMoveTo = (cx: number, cy: number) => {
    if (!drag.current) return;
    const P0 = toVB(drag.current.px, drag.current.py), P1 = toVB(cx, cy);
    if (Math.abs(cx - drag.current.px) + Math.abs(cy - drag.current.py) > 6) moved.current = true;
    const v = viewRef.current;
    live(clampV(v.k, drag.current.x0 + (P1.x - P0.x), drag.current.y0 + (P1.y - P0.y)));
  };
  const end = () => {
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; }
    const wasGesture = !!(drag.current || pinch.current);
    drag.current = null; pinch.current = null;
    if (wasGesture) commit(viewRef.current);
  };

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const wheel = (e: WheelEvent) => { e.preventDefault(); commit(zoomCompute(toVB(e.clientX, e.clientY), viewRef.current.k * (e.deltaY < 0 ? 1.2 : 1 / 1.2))); };
    const mm = (e: MouseEvent) => onMoveTo(e.clientX, e.clientY);
    const mu = () => end();
    svg.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    return () => { svg.removeEventListener('wheel', wheel); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTouchStart = (e: any) => {
    if (e.touches.length === 2) { pinch.current = { d: dist(e.touches) }; drag.current = null; }
    else if (e.touches.length === 1) onDown(e.touches[0].clientX, e.touches[0].clientY);
  };
  const onTouchMove = (e: any) => {
    if (e.touches.length === 2 && pinch.current) {
      const d1 = dist(e.touches), mid = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
      live(zoomCompute(toVB(mid.x, mid.y), viewRef.current.k * (d1 / pinch.current.d))); pinch.current.d = d1; moved.current = true;
    } else if (e.touches.length === 1) onMoveTo(e.touches[0].clientX, e.touches[0].clientY);
  };

  return (
    <>
      <svg
        ref={svgRef}
        id={id}
        className="campus"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ cursor: view.k > 1 ? 'grab' : 'default', touchAction: 'none' }}
        onMouseDown={(e) => onDown(e.clientX, e.clientY)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={end}
      >
        <g ref={gRef} transform={`translate(${view.x} ${view.y}) scale(${view.k})`} style={{ willChange: 'transform' }}>
          <image href={mapBg || MAP_URL} x={0} y={0} width={VB_W} height={VB_H} preserveAspectRatio="none" />
          {visible.map((l) => {
            const evt = mode === 'event' && eventLocs.has(l.slug);
            return (
              <g
                key={l.id}
                className="hotspot"
                onClick={() => { if (!moved.current) onSelect(l); }}
                role="button"
                aria-label={tx(l.i18n, lang, 'name')}
              >
                <circle cx={l.mapX} cy={l.mapY} r={44} fill="transparent" style={{ cursor: 'pointer' }} />
                {!(mode === 'event' && liveLocs.has(l.slug)) && <Marker cx={l.mapX} cy={l.mapY} name={tx(l.i18n, lang, 'name')} evt={evt} />}
              </g>
            );
          })}
          {mode === 'event' &&
            visible.filter((l) => liveLocs.has(l.slug)).map((l) => <Signal key={'sig-' + l.id} cx={l.mapX} cy={l.mapY} />)}
        </g>
      </svg>
      <div className="zoom-ctrl">
        <button onClick={() => zoomBtn(1.4)} title="Phóng to" aria-label="Phóng to">＋</button>
        <button onClick={() => zoomBtn(1 / 1.4)} title="Thu nhỏ" aria-label="Thu nhỏ">−</button>
        {view.k > 1 && <button onClick={reset} title="Về mặc định" aria-label="Về mặc định">⤢</button>}
      </div>
    </>
  );
}

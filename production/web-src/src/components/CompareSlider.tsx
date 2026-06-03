import { useRef, useState } from 'react';

export default function CompareSlider({ before, after }: { before: string; after: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(50);
  const dragging = useRef(false);

  const set = (clientX: number) => {
    const box = boxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    setPct(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  const down = (e: React.MouseEvent | React.TouchEvent) => {
    dragging.current = true;
    set('touches' in e ? e.touches[0].clientX : e.clientX);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging.current) return;
    set('touches' in e ? e.touches[0].clientX : e.clientX);
  };
  const up = () => (dragging.current = false);

  return (
    <div
      ref={boxRef}
      className="cmp"
      onMouseDown={down}
      onMouseMove={move}
      onMouseUp={up}
      onMouseLeave={up}
      onTouchStart={down}
      onTouchMove={move}
      onTouchEnd={up}
    >
      <img className="before" src={before} alt="xưa" draggable={false} />
      <img className="after" src={after} alt="nay" style={{ clipPath: `inset(0 0 0 ${pct}%)` }} draggable={false} />
      <span className="tag l">◀ XƯA</span>
      <span className="tag r">NAY ▶</span>
      <div className="bar" style={{ left: pct + '%' }}>
        <div className="knob">↔</div>
      </div>
    </div>
  );
}

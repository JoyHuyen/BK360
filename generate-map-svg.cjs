/* Bake bản đồ vẽ tay (ban-do-bk-vetay.html) -> SVG tĩnh để nhúng vào production.
   Tái dùng nguyên logic vẽ; chỉ thay createElementNS bằng bộ dựng chuỗi.
   Chạy: node generate-map-svg.cjs > production/web-src/public/campus-map.svg */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

class El {
  constructor(tag) { this.tag = tag; this.attrs = {}; this.children = []; this._text = null; this.dataset = {}; }
  setAttribute(k, v) { this.attrs[k] = v; }
  appendChild(c) { this.children.push(c); return c; }
  addEventListener() {}
  get classList() { return { add: () => {} }; }
  set textContent(v) { this._text = v; }
  get textContent() { return this._text; }
  serialize() {
    const a = Object.keys(this.attrs).map((k) => `${k}="${escAttr(this.attrs[k])}"`).join(' ');
    const open = `<${this.tag}${a ? ' ' + a : ''}>`;
    if (this._text != null && this.children.length === 0) return `${open}${esc(this._text)}</${this.tag}>`;
    if (this.children.length === 0 && this._text == null) return `<${this.tag}${a ? ' ' + a : ''}/>`;
    return `${open}${this.children.map((c) => c.serialize()).join('')}</${this.tag}>`;
  }
}

const containers = {
  buildings: new El('g'), 'trees-back': new El('g'), 'trees-front': new El('g'), cars: new El('g'), bar: new El('div'),
};
const document = { getElementById: (id) => containers[id] };
const E = (t, a) => { const e = new El(t); if (a) for (const k in a) e.setAttribute(k, String(a[k])); return e; };

// ============ logic vẽ (copy từ ban-do-bk-vetay.html) ============
const OUT = '#4a4038', WIN = '#fdf3df', DOOR = '#a06a44';
function rrect(x, y, w, h, fill, rx = 5) { return E('rect', { x, y, width: w, height: h, rx, fill, stroke: OUT, 'stroke-width': 2 }); }

function house(o) {
  const { x, y, w, h, body, roof, floors = 2, door = true, accent, label, name, rot = 0 } = o;
  const cx = x + w / 2, cy = y + h / 2;
  const g = E('g', { class: 'bld' }); g.dataset.name = name || label; g.dataset.label = label;
  g.setAttribute('transform', `rotate(${rot} ${cx} ${cy})`);
  const r = E('g', { filter: 'url(#rough)' });
  const rh = Math.min(Math.max(h * 0.4, 14), 34);
  r.appendChild(rrect(x, y + rh - 2, w, h - rh + 2, body));
  if (o.arches) {
    const n = o.arches, aw = w / n;
    r.appendChild(rrect(x - 2, y + rh - 7, w + 4, 11, roof, 3));
    for (let i = 0; i < n; i++) { const ax = x + i * aw; r.appendChild(E('path', { d: `M${ax} ${y + rh} Q ${ax + aw / 2} ${y - rh * 0.5} ${ax + aw} ${y + rh} Z`, fill: roof, stroke: OUT, 'stroke-width': 1.5 })); }
  } else {
    const t = Math.min(w * 0.30, w / 2 - 6);
    r.appendChild(E('polygon', { points: `${x - 4},${y + rh} ${x + t},${y} ${x + w - t},${y} ${x + w + 4},${y + rh}`, fill: roof, stroke: OUT, 'stroke-width': 2 }));
  }
  const cols = Math.max(1, Math.min(Math.floor(w / 42), 6));
  const rows = Math.max(1, Math.min(Math.round((h - rh) / 30), floors));
  const gx = w / (cols + 1), gy = (h - rh) / (rows + 1);
  if (!o.vert && h > 40) for (let ri = 1; ri <= rows; ri++) for (let ci = 1; ci <= cols; ci++)
    r.appendChild(E('rect', { x: x + gx * ci - 7, y: y + rh + gy * ri - 7, width: 14, height: 14, rx: 3, fill: WIN, stroke: OUT, 'stroke-width': 1.5 }));
  if (door) r.appendChild(E('rect', { x: cx - 8, y: y + h - 17, width: 16, height: 17, rx: 3, fill: DOOR, stroke: OUT, 'stroke-width': 1.5 }));
  if (accent === 'cross') { r.appendChild(E('rect', { x: cx - 3, y: y - 26, width: 6, height: 20, fill: '#e23b3b' })); r.appendChild(E('rect', { x: cx - 10, y: y - 19, width: 20, height: 6, fill: '#e23b3b' })); }
  if (o.entrance) { const ew = Math.max(30, w * 0.088); r.appendChild(rrect(cx - ew / 2, y - 12, ew, h + 12, '#f4f7fa', 4)); }
  g.appendChild(r);
  if (o.entrance) { const ly = y + 15;
    g.appendChild(E('circle', { cx, cy: ly, r: 13, fill: '#fff', stroke: OUT, 'stroke-width': 1.4 }));
    g.appendChild(E('circle', { cx, cy: ly, r: 10.5, fill: '#c8102e' }));
    const lt = E('text', { x: cx, y: ly + 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-family': 'Baloo 2', 'font-weight': '800', 'font-size': '11', fill: '#fff' }); lt.textContent = 'BK'; g.appendChild(lt); }
  const fs = o.fs || 13, tw = label.length * fs * 0.6 + 14, lg = E('g');
  if (o.vert) lg.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
  lg.appendChild(E('rect', { x: cx - tw / 2, y: (o.vert ? cy - 10 : y + h + 4), width: tw, height: 20, rx: 10, fill: '#fffdf5', stroke: '#e7cf9a', 'stroke-width': 1.5 }));
  const tx = E('text', { x: cx, y: (o.vert ? cy + 1 : y + h + 15), class: 'lab', 'font-size': fs }); tx.textContent = label; lg.appendChild(tx);
  g.appendChild(lg);
  document.getElementById('buildings').appendChild(g);
}

const RED1 = '#d96a5e', RED2 = '#b84a3e', TAN = '#f0e2bf';
const B = [
  { x: 578, y: 300, w: 54, h: 40, body: TAN, roof: '#e07a5f', floors: 1, label: 'C1B', name: 'Nhà C1B' },
  { x: 216, y: 360, w: 64, h: 188, body: '#e8a7b6', roof: '#cf7f93', floors: 4, label: 'C2', name: 'Hội trường C2' },
  { x: 560, y: 346, w: 140, h: 42, body: TAN, roof: '#e07a5f', floors: 1, label: 'C3', name: 'Nhà C3' },
  { x: 560, y: 414, w: 140, h: 42, body: TAN, roof: '#6fb3a8', floors: 1, label: 'C4', name: 'Nhà C4' },
  { x: 560, y: 482, w: 140, h: 42, body: TAN, roof: '#8aa6c0', floors: 1, label: 'C5', name: 'Nhà C5' },
  { x: 556, y: 552, w: 152, h: 46, body: '#aacb7a', roof: '#7fa24f', floors: 1, label: 'C10', name: 'Nhà C10 (ITIMS)' },
  { x: 672, y: 330, w: 96, h: 40, body: '#f0c89a', roof: '#d98c63', floors: 1, rot: -34, label: 'C3B', name: 'Nhà C3B' },
  { x: 230, y: 556, w: 135, h: 46, body: '#8fc7c0', roof: '#5fa39a', floors: 1, label: 'C9', name: 'Nhà C9' },
  { x: 864, y: 378, w: 98, h: 42, body: '#8aa6c0', roof: '#5d7d9c', floors: 1, label: 'B6', name: 'KTX B6' },
  { x: 1058, y: 378, w: 92, h: 42, body: '#8aa6c0', roof: '#5d7d9c', floors: 1, label: 'B5', name: 'KTX B5' },
  { x: 1058, y: 460, w: 92, h: 42, body: '#8aa6c0', roof: '#5d7d9c', floors: 1, label: 'B9', name: 'KTX B9' },
  { x: 864, y: 506, w: 98, h: 42, body: '#8aa6c0', roof: '#5d7d9c', floors: 1, label: 'B7', name: 'KTX B7' },
  { x: 864, y: 560, w: 98, h: 42, body: '#8aa6c0', roof: '#5d7d9c', floors: 1, label: 'B8', name: 'KTX B8' },
  { x: 190, y: 660, w: 78, h: 48, body: TAN, roof: '#6fb3a8', floors: 1, label: 'D2A', name: 'Nhà D2A' },
  { x: 282, y: 660, w: 78, h: 48, body: TAN, roof: '#8aa6c0', floors: 1, label: 'D2B', name: 'Nhà D2B' },
  { x: 380, y: 656, w: 84, h: 54, body: RED1, roof: RED2, floors: 2, fs: 9, label: 'TT Việt-Đức', name: 'Trung tâm Việt-Đức' },
  { x: 498, y: 660, w: 78, h: 48, body: TAN, roof: '#e9b949', floors: 1, label: 'D2D', name: 'Nhà D2D' },
  { x: 215, y: 752, w: 120, h: 46, body: TAN, roof: '#d98c63', floors: 1, label: 'D6', name: 'Nhà D6' },
  { x: 70, y: 792, w: 46, h: 94, body: '#8fc7c0', roof: '#5fa39a', floors: 3, vert: true, label: 'D4', name: 'Nhà D4' },
  { x: 198, y: 820, w: 46, h: 94, body: '#e8a7b6', roof: '#cf7f93', floors: 3, vert: true, label: 'D8', name: 'Nhà D8' },
  { x: 740, y: 660, w: 92, h: 44, body: TAN, roof: '#e07a5f', floors: 1, label: 'D3', name: 'Nhà D3' },
  { x: 776, y: 712, w: 82, h: 40, body: TAN, roof: '#e9b949', floors: 1, fs: 10, label: 'D3-5', name: 'Nhà D3-5' },
  { x: 740, y: 736, w: 92, h: 44, body: TAN, roof: '#8aa6c0', floors: 1, label: 'D5', name: 'Nhà D5' },
  { x: 762, y: 782, w: 96, h: 44, body: '#f0c89a', roof: '#d98c63', floors: 1, rot: -40, label: 'D7', name: 'Nhà D7' },
];
B.forEach(house);

const buildings = document.getElementById('buildings'), bar = document.getElementById('bar');
function clickable(g, label, name) { g.classList.add('bld'); g.dataset.name = name; }
function parabol(x, base) {
  const g = E('g', {}), r = E('g', { filter: 'url(#rough)' }), h = 104, wf = 22, wi = 10;
  r.appendChild(E('path', { d: `M${x - wf} ${base} Q ${x} ${base - 2 * h} ${x + wf} ${base} L ${x + wi} ${base} Q ${x} ${base - 1.62 * h} ${x - wi} ${base} Z`, fill: '#e4e8ed', stroke: OUT, 'stroke-width': 2 }));
  r.appendChild(E('path', { d: `M${x - wf} ${base} Q ${x} ${base - 2 * h} ${x + wf} ${base}`, fill: 'none', stroke: '#c43b3b', 'stroke-width': '2.5', opacity: '.5' }));
  g.appendChild(r);
  const lg = E('g'), tw = 58; lg.appendChild(E('rect', { x: x - tw / 2, y: base + 4, width: tw, height: 18, rx: 9, fill: '#fffdf5', stroke: '#e7cf9a', 'stroke-width': 1.2 }));
  const tx = E('text', { x, y: base + 13, class: 'lab', 'font-size': 10 }); tx.textContent = 'Parabol'; lg.appendChild(tx); g.appendChild(lg);
  clickable(g, 'Cổng Parabol', 'Cổng Parabol'); buildings.appendChild(g);
}
function gate(x, y, label, name, rot) {
  rot = rot || 0; const g = E('g', { transform: `rotate(${rot} ${x} ${y})` }), r = E('g', { filter: 'url(#rough)' });
  r.appendChild(rrect(x - 24, y - 14, 9, 32, '#cbb08a')); r.appendChild(rrect(x + 15, y - 14, 9, 32, '#cbb08a'));
  r.appendChild(rrect(x - 27, y - 25, 54, 12, '#c0584a'));
  r.appendChild(E('polygon', { points: `${x - 30},${y - 25} ${x},${y - 36} ${x + 30},${y - 25}`, fill: '#a8463a', stroke: OUT, 'stroke-width': 1.5 }));
  g.appendChild(r);
  const tw = label.length * 6.6 + 12, lg = E('g');
  lg.appendChild(E('rect', { x: x - tw / 2, y: y + 20, width: tw, height: 18, rx: 9, fill: '#fffdf5', stroke: '#e7cf9a', 'stroke-width': 1.2 }));
  const tx = E('text', { x, y: y + 29, class: 'lab', 'font-size': 10 }); tx.textContent = label; lg.appendChild(tx); g.appendChild(lg);
  clickable(g, label, name); buildings.appendChild(g);
}
function iLoveBK(x, y) {
  const g = E('g', {}), r = E('g', { filter: 'url(#rough)' });
  r.appendChild(E('ellipse', { cx: x, cy: y + 24, rx: 52, ry: 9, fill: 'rgba(0,0,0,.13)' }));
  r.appendChild(rrect(x - 13, y + 4, 26, 20, '#c4cad3', 4)); r.appendChild(rrect(x - 48, y - 22, 96, 30, '#fffdf5', 10));
  g.appendChild(r);
  const tx = E('text', { x, y: y - 5, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-family': 'Baloo 2', 'font-weight': '800', 'font-size': '21' });
  [['I ', '#2c3e6b'], ['❤', '#e23b3b'], [' BK', '#2c3e6b']].forEach(([t, c]) => { const ts = E('tspan', { fill: c }); ts.textContent = t; tx.appendChild(ts); });
  g.appendChild(tx); clickable(g, 'I ❤ BK', 'I ❤ BK'); buildings.appendChild(g);
}

function drawC1() {
  const x = 280, y = 266, w = 294, h = 82, wall = '#e7edf2', edge = '#cdd5dd', glass = '#bcd6e6', cx = x + w / 2;
  const g = E('g', { class: 'bld' }); g.dataset.label = 'C1'; g.dataset.name = 'Nhà C1';
  const r = E('g', { filter: 'url(#rough)' });
  r.appendChild(rrect(x, y + 8, w, h - 8, wall, 4));
  r.appendChild(rrect(x - 2, y + 4, w + 4, 9, edge, 3));
  const tw = 62, tx = cx - tw / 2, ty = y - 8;
  r.appendChild(rrect(tx, ty, tw, (y + h) - ty, '#f4f7fa', 3));
  const n = 7, aw = tw / n; r.appendChild(rrect(tx - 3, ty - 4, tw + 6, 7, edge, 2));
  for (let i = 0; i < n; i++) { const ax = tx + i * aw; r.appendChild(E('path', { d: `M${ax} ${ty} Q ${ax + aw / 2} ${ty - 11} ${ax + aw} ${ty} Z`, fill: edge, stroke: OUT, 'stroke-width': 1.2 })); }
  for (let rr = 0; rr < 4; rr++) for (let cc = 0; cc < 4; cc++)
    r.appendChild(E('rect', { x: tx + 10 + cc * 11, y: ty + 26 + rr * 11, width: 8, height: 8, rx: 1, fill: '#cdd6df' }));
  function wing(a, b) { const rows = 4, cw = 22, cols = Math.max(1, Math.floor((b - a) / cw)), rh = (h - 26) / rows;
    for (let ri = 0; ri < rows; ri++) for (let ci = 0; ci < cols; ci++)
      r.appendChild(E('rect', { x: a + 6 + ci * cw, y: y + 18 + ri * rh, width: 14, height: rh - 5, rx: 2, fill: glass, stroke: OUT, 'stroke-width': 1.1 })); }
  wing(x, tx - 2); wing(tx + tw + 2, x + w);
  r.appendChild(rrect(cx - 15, y + h - 16, 30, 16, '#bfe3f0', 2));
  g.appendChild(r);
  const ly = ty + 14;
  g.appendChild(E('circle', { cx, cy: ly, r: 10, fill: '#fff', stroke: OUT, 'stroke-width': 1.3 }));
  g.appendChild(E('circle', { cx, cy: ly, r: 8, fill: '#c8102e' }));
  const lt = E('text', { x: cx, y: ly + 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-family': 'Baloo 2', 'font-weight': '800', 'font-size': '9', fill: '#fff' }); lt.textContent = 'BK'; g.appendChild(lt);
  const t2 = 34, lg = E('g');
  lg.appendChild(E('rect', { x: cx - t2 / 2, y: y + h + 4, width: t2, height: 20, rx: 10, fill: '#fffdf5', stroke: '#e7cf9a', 'stroke-width': 1.5 }));
  const txt = E('text', { x: cx, y: y + h + 15, class: 'lab', 'font-size': 13 }); txt.textContent = 'C1'; lg.appendChild(txt); g.appendChild(lg);
  buildings.appendChild(g);
}
drawC1();

function drawC7() {
  const x = 716, y = 468, w = 124, h = 124, body = '#d96a5e', edge = '#b84a3e';
  const cx = x + w / 2, sx = x + w - 30;
  const g = E('g', { class: 'bld' }); g.dataset.label = 'C7'; g.dataset.name = 'Nhà C7';
  const r = E('g', { filter: 'url(#rough)' });
  const armH = 30, armW = sx - x + 8, arms = [y + 2, y + h / 2 - armH / 2, y + h - armH - 2];
  r.appendChild(rrect(sx, y, 30, h, body));
  arms.forEach((ay) => r.appendChild(rrect(x, ay, armW, armH, body)));
  r.appendChild(E('rect', { x: sx, y: y, width: 30, height: 9, rx: 3, fill: edge }));
  arms.forEach((ay) => r.appendChild(E('rect', { x: x, y: ay, width: armW, height: 7, rx: 3, fill: edge })));
  arms.forEach((ay) => { for (let i = 0; i < 3; i++) r.appendChild(E('rect', { x: x + 12 + i * 28, y: ay + armH / 2 - 5, width: 13, height: 13, rx: 3, fill: WIN, stroke: OUT, 'stroke-width': 1.4 })); });
  g.appendChild(r);
  const tw = 34, lg = E('g');
  lg.appendChild(E('rect', { x: cx - tw / 2, y: y + h + 4, width: tw, height: 20, rx: 10, fill: '#fffdf5', stroke: '#e7cf9a', 'stroke-width': 1.5 }));
  const tx = E('text', { x: cx, y: y + h + 15, class: 'lab', 'font-size': 13 }); tx.textContent = 'C7'; lg.appendChild(tx); g.appendChild(lg);
  buildings.appendChild(g);
}
drawC7();

function drawLibrary() {
  const x = 590, y = 640, w = 114, h = 152, wall = '#eef1f4', edge = '#cdd5dd', glass = '#9ccfe6', cx = x + w / 2;
  const g = E('g', { class: 'bld' }); g.dataset.label = 'Thư Viện'; g.dataset.name = 'Thư viện Tạ Quang Bửu';
  const r = E('g', { filter: 'url(#rough)' });
  r.appendChild(rrect(x, y, w, h, wall, 4));
  r.appendChild(rrect(x - 3, y - 6, w + 6, 12, edge, 3));
  r.appendChild(rrect(cx - 24, y - 14, 48, 10, edge, 2));
  const cols = 6, rows = 6, mx = 10, gw = (w - 2 * mx) / cols, top = y + 14, bh = (h - 62) / rows;
  for (let ri = 0; ri < rows; ri++) for (let ci = 0; ci < cols; ci++)
    r.appendChild(E('rect', { x: x + mx + ci * gw + 2, y: top + ri * bh + 2, width: gw - 4, height: bh - 4, rx: 2, fill: glass, stroke: OUT, 'stroke-width': 1.1 }));
  const cyc = y + h - 34;
  r.appendChild(E('circle', { cx, cy: cyc, r: 13, fill: '#fff', stroke: OUT, 'stroke-width': 2 }));
  r.appendChild(E('circle', { cx, cy: cyc, r: 13, fill: 'none', stroke: '#c0584a', 'stroke-width': 2.5 }));
  r.appendChild(E('line', { x1: cx, y1: cyc, x2: cx, y2: cyc - 8, stroke: OUT, 'stroke-width': 1.8, 'stroke-linecap': 'round' }));
  r.appendChild(E('line', { x1: cx, y1: cyc, x2: cx + 6, y2: cyc + 3, stroke: OUT, 'stroke-width': 1.8, 'stroke-linecap': 'round' }));
  r.appendChild(rrect(x + 10, y + h - 16, w - 20, 16, glass, 3));
  g.appendChild(r);
  const tw = 64, lg = E('g');
  lg.appendChild(E('rect', { x: cx - tw / 2, y: y + h + 4, width: tw, height: 20, rx: 10, fill: '#fffdf5', stroke: '#e7cf9a', 'stroke-width': 1.5 }));
  const tx = E('text', { x: cx, y: y + h + 15, class: 'lab', 'font-size': 11 }); tx.textContent = 'Thư Viện'; lg.appendChild(tx); g.appendChild(lg);
  buildings.appendChild(g);
}
drawLibrary();

function drawB1() {
  const x = 900, y = 642, w = 152, h = 150, wall = '#eceff3', edge = '#cdd5dd', glass = '#bcd6e6', base = '#cf9a6b', cx = x + w / 2;
  const g = E('g', { class: 'bld' }); g.dataset.label = 'B1'; g.dataset.name = 'Nhà B1';
  const r = E('g', { filter: 'url(#rough)' });
  r.appendChild(rrect(x, y, w, h - 30, wall, 4));
  r.appendChild(rrect(x - 2, y - 5, w + 4, 9, edge, 3));
  r.appendChild(rrect(x + 6, y + h - 44, w - 12, 14, base, 3));
  const cols = 6, rows = 6, mx = 10, cw = (w - 2 * mx) / cols, top = y + 14, bh = (h - 30 - 22) / rows;
  for (let ri = 0; ri < rows; ri++) for (let ci = 0; ci < cols; ci++)
    r.appendChild(E('rect', { x: x + mx + ci * cw + 2, y: top + ri * bh + 2, width: cw - 5, height: bh - 4, rx: 2, fill: glass, stroke: OUT, 'stroke-width': 1.1 }));
  r.appendChild(rrect(cx - 46, y + h - 58, 92, 54, '#f2f5f8', 26));
  r.appendChild(rrect(cx - 40, y + h - 48, 80, 12, glass, 6));
  r.appendChild(rrect(cx - 40, y + h - 32, 80, 12, glass, 6));
  r.appendChild(rrect(cx - 12, y + h - 12, 24, 12, '#9aa6b2', 2));
  g.appendChild(r);
  const bt = E('text', { x: x + w - 14, y: y + 18, 'text-anchor': 'end', 'font-family': 'Baloo 2', 'font-weight': '800', 'font-size': '12', fill: '#2a6fb0' }); bt.textContent = 'B1'; g.appendChild(bt);
  const tw = 30, lg = E('g');
  lg.appendChild(E('rect', { x: cx - tw / 2, y: y + h + 4, width: tw, height: 20, rx: 10, fill: '#fffdf5', stroke: '#e7cf9a', 'stroke-width': 1.5 }));
  const tx = E('text', { x: cx, y: y + h + 15, class: 'lab', 'font-size': 13 }); tx.textContent = 'B1'; lg.appendChild(tx); g.appendChild(lg);
  buildings.appendChild(g);
}
drawB1();

parabol(92, 612);
gate(333, 118, 'Cổng ĐCV', 'Cổng Đại Cồ Việt (A)');
gate(510, 118, 'Cổng ĐCV', 'Cổng Đại Cồ Việt (V)');
gate(905, 624, 'Cổng B8', 'Cổng B8 - Trần Đại Nghĩa', 58);
iLoveBK(421, 402);

function pine(x, y) { const g = E('g', { filter: 'url(#rough)' });
  g.appendChild(E('rect', { x: x - 3, y: y + 18, width: 6, height: 10, fill: '#9b6b3f' }));
  [0, 1, 2].forEach((i) => g.appendChild(E('polygon', { points: `${x - 16 + i * 3},${y + 18 - i * 12} ${x},${y - 8 - i * 12} ${x + 16 - i * 3},${y + 18 - i * 12}`, fill: i ? '#5a9e5a' : '#4f8f4f', stroke: OUT, 'stroke-width': 1.5 })));
  document.getElementById('trees-back').appendChild(g); }
function roundT(x, y, c) { const g = E('g', { filter: 'url(#rough)' });
  g.appendChild(E('rect', { x: x - 3, y: y + 10, width: 6, height: 12, fill: '#9b6b3f' }));
  g.appendChild(E('circle', { cx: x, cy: y, r: 15, fill: c, stroke: OUT, 'stroke-width': 1.5 }));
  g.appendChild(E('circle', { cx: x - 5, cy: y - 4, r: 3, fill: '#fff', opacity: '.4' })); document.getElementById('trees-front').appendChild(g); }
function bare(x, y) { const g = E('g', { filter: 'url(#rough)', stroke: '#8a6b4a', 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' });
  g.appendChild(E('path', { d: `M${x} ${y + 20} L${x} ${y - 12} M${x} ${y} l-10 -10 M${x} ${y + 4} l10 -10 M${x} ${y - 6} l-8 -8` })); document.getElementById('trees-back').appendChild(g); }
[[140, 300], [160, 470], [330, 300], [640, 400], [820, 300]].forEach(([x, y]) => pine(x, y));
[[150, 640], [120, 560], [420, 640], [640, 650], [1000, 560], [330, 860], [600, 560], [860, 650]].forEach(([x, y], i) => roundT(x, y, ['#6db36d', '#84c272', '#5aa86a'][i % 3]));
[[700, 250], [140, 760], [660, 470]].forEach(([x, y]) => bare(x, y));

function car(x, y, c, rot = 0) { const g = E('g', { transform: `rotate(${rot} ${x} ${y})`, filter: 'url(#rough)' });
  g.appendChild(E('rect', { x: x - 16, y: y - 8, width: 32, height: 15, rx: 6, fill: c, stroke: OUT, 'stroke-width': 1.5 }));
  g.appendChild(E('rect', { x: x - 8, y: y - 14, width: 16, height: 9, rx: 3, fill: c, stroke: OUT, 'stroke-width': 1.5 }));
  g.appendChild(E('circle', { cx: x - 9, cy: y + 8, r: 4, fill: '#3a342c' })); g.appendChild(E('circle', { cx: x + 9, cy: y + 8, r: 4, fill: '#3a342c' }));
  document.getElementById('cars').appendChild(g); }
car(360, 118, '#e07a5f'); car(640, 112, '#6fb3a8'); car(200, 612, '#e9b949'); car(720, 620, '#6f9fc0'); car(950, 800, '#e07a5f', 58);

// ============ ráp SVG tĩnh ============
const inner = (c) => containers[c].children.map((n) => n.serialize()).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1250 1070" preserveAspectRatio="xMidYMid meet">
<style>.lab{font-family:'Baloo 2',system-ui,Arial,sans-serif;font-weight:800;fill:#4a4038;text-anchor:middle;dominant-baseline:middle}.rlab{font-family:'Baloo 2',system-ui,Arial,sans-serif;font-weight:700;fill:#8a8266;font-size:13px;letter-spacing:1px}text{font-family:'Baloo 2',system-ui,Arial,sans-serif}</style>
<rect x="0" y="0" width="1250" height="1070" fill="#faf5e6"/>
<defs><filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter></defs>
<g filter="url(#rough)">
<path d="M40 150 Q20 90 120 80 L1120 70 Q1210 80 1200 180 L1210 920 Q1200 1000 1110 990 L130 1000 Q30 1000 45 900 Z" fill="#c2d36a"/>
<path d="M40 150 Q20 90 120 80 L1120 70 Q1210 80 1200 180 L1210 920 Q1200 1000 1110 990 L130 1000 Q30 1000 45 900 Z" fill="none" stroke="#aac056" stroke-width="3"/>
</g>
<g filter="url(#rough)" fill="none" stroke-linecap="round">
<path d="M40 150 Q380 120 740 116 L1180 78" stroke="#fffdf5" stroke-width="40"/>
<path d="M740 120 Q900 430 985 700 Q1035 850 1000 990" stroke="#fffdf5" stroke-width="40"/>
<path d="M40 150 Q380 120 740 116 L1180 78" stroke="#cdbf9a" stroke-width="2.5" stroke-dasharray="14 12"/>
</g>
<text class="rlab" x="980" y="96">ĐẠI CỒ VIỆT</text>
<text class="rlab" x="900" y="430" transform="rotate(70 900 430)">TRẦN ĐẠI NGHĨA</text>
<text class="rlab" x="980" y="900" transform="rotate(74 980 900)">TRẦN ĐẠI NGHĨA</text>
<g filter="url(#rough)" fill="none" stroke-linecap="round">
<g stroke="#e3d4b0">
<path d="M70 612 Q470 600 905 620" stroke-width="30"/><path d="M276 150 Q278 380 276 884" stroke-width="24"/><path d="M548 150 Q550 380 547 600" stroke-width="20"/><path d="M905 350 Q905 490 905 618 Q905 760 952 848" stroke-width="24"/><path d="M120 726 Q360 720 600 728" stroke-width="20"/><path d="M636 616 L636 676" stroke-width="20"/>
</g>
<g stroke="#f3ead2">
<path d="M70 612 Q470 600 905 620" stroke-width="24"/><path d="M276 150 Q278 380 276 884" stroke-width="18"/><path d="M548 150 Q550 380 547 600" stroke-width="14"/><path d="M905 350 Q905 490 905 618 Q905 760 952 848" stroke-width="18"/><path d="M120 726 Q360 720 600 728" stroke-width="14"/><path d="M636 616 L636 676" stroke-width="14"/>
</g>
</g>
<g filter="url(#rough)"><rect x="356" y="384" width="180" height="178" rx="18" fill="#cdeccd"/></g>
<g filter="url(#rough)">
<rect x="370" y="398" width="70" height="76" rx="10" fill="#b7e4c7"/><rect x="452" y="398" width="70" height="76" rx="10" fill="#b7e4c7"/><rect x="370" y="486" width="70" height="62" rx="10" fill="#b7e4c7"/><rect x="452" y="486" width="70" height="62" rx="10" fill="#b7e4c7"/><circle cx="446" cy="473" r="22" fill="#cdeaf6"/><circle cx="446" cy="473" r="12" fill="#8fd4ec"/>
</g>
<g filter="url(#rough)">
<path d="M380 760 Q372 720 470 712 Q572 706 580 770 L580 870 Q580 902 480 900 Q384 898 380 860 Z" fill="#7ec7e0"/>
<path d="M410 740 q16 -8 32 0 M470 800 q16 -8 32 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
</g>
<text class="lab" x="480" y="810" font-size="16">Hồ Tiền 🦆</text>
<g>${inner('cars')}</g>
<g>${inner('trees-back')}</g>
<g>${inner('buildings')}</g>
<g>${inner('trees-front')}</g>
<text class="rlab" x="958" y="455" text-anchor="middle" font-size="11" fill="#6b6450">KÝ TÚC XÁ</text>
</svg>`;
// Bỏ filter nhám (feTurbulence) → SVG nét ở mọi mức zoom, nhẹ & mượt (không re-raster filter).
const out = svg.replace(/ filter="url\(#rough\)"/g, '');
process.stdout.write(out);

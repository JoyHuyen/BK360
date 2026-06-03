import type { Palette } from './types';

const DEFAULT: Palette = { sky: '#9cc4ec', ground: '#7d8a6a', bld: '#0a3d62' };

function rng(seedStr: string) {
  let seed = seedStr.length * 7 + 3;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/** Panorama equirectangular mô phỏng (fallback khi chưa có ảnh 360° thật). */
export function makePano(palette: Palette | null | undefined, label: string): string {
  const p = palette ?? DEFAULT;
  const W = 2048,
    H = 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;
  const sky = x.createLinearGradient(0, 0, 0, H * 0.55);
  sky.addColorStop(0, p.sky);
  sky.addColorStop(1, '#eef6ff');
  x.fillStyle = sky;
  x.fillRect(0, 0, W, H * 0.55);
  const gd = x.createLinearGradient(0, H * 0.55, 0, H);
  gd.addColorStop(0, p.ground);
  gd.addColorStop(1, '#3c4636');
  x.fillStyle = gd;
  x.fillRect(0, H * 0.55, W, H * 0.45);
  const rnd = rng(label || 'x');
  for (let i = 0; i < 26; i++) {
    const bw = 60 + rnd() * 120,
      bh = 120 + rnd() * 260,
      bx = rnd() * W,
      by = H * 0.55 - bh;
    x.fillStyle = i % 3 === 0 ? p.bld : i % 2 ? '#5b6b80' : '#48566b';
    x.globalAlpha = 0.92;
    x.fillRect(bx, by, bw, bh);
    x.fillStyle = 'rgba(255,255,255,.5)';
    for (let wy = by + 14; wy < by + bh - 14; wy += 26)
      for (let wx = bx + 10; wx < bx + bw - 10; wx += 22) if (rnd() > 0.35) x.fillRect(wx, wy, 10, 14);
    x.globalAlpha = 1;
  }
  x.globalAlpha = 0.16;
  x.fillStyle = '#fff';
  x.font = 'bold 140px Segoe UI, Arial';
  x.textAlign = 'center';
  x.fillText(label.split('&')[0].trim(), W / 2, H * 0.42);
  x.globalAlpha = 1;
  return c.toDataURL('image/jpeg', 0.85);
}

/** Ảnh mặt tiền Xưa/Nay mô phỏng. */
export function makeFacade(palette: Palette | null | undefined, era: 'xua' | 'nay', seedStr: string): string {
  const p = palette ?? DEFAULT;
  const W = 640,
    H = 400;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;
  const old = era === 'xua';
  const rnd = rng(seedStr + era);
  const sky = x.createLinearGradient(0, 0, 0, H * 0.6);
  if (old) {
    sky.addColorStop(0, '#b9ab8e');
    sky.addColorStop(1, '#e7ddc8');
  } else {
    sky.addColorStop(0, p.sky);
    sky.addColorStop(1, '#eef6ff');
  }
  x.fillStyle = sky;
  x.fillRect(0, 0, W, H);
  const bw = W * 0.5,
    bh = H * 0.62,
    bx = W * 0.25,
    by = H * 0.6 - bh;
  x.fillStyle = old ? '#8a7d63' : p.bld;
  x.fillRect(bx, by, bw, bh);
  x.fillStyle = old ? 'rgba(60,50,35,.55)' : 'rgba(255,255,255,.6)';
  for (let wy = by + 18; wy < by + bh - 18; wy += 34)
    for (let wx = bx + 14; wx < bx + bw - 14; wx += 30) x.fillRect(wx, wy, 16, 22);
  x.fillStyle = old ? '#5f5740' : p.ground;
  x.fillRect(0, H * 0.6, W, H * 0.4);
  if (!old) {
    x.fillStyle = '#3f7d3a';
    for (let i = 0; i < 6; i++) {
      x.beginPath();
      x.arc(40 + rnd() * (W - 40), H * 0.66, 16 + rnd() * 8, 0, 7);
      x.fill();
    }
  }
  if (old) {
    x.globalAlpha = 0.18;
    x.fillStyle = '#3a2c12';
    x.fillRect(0, 0, W, H);
    x.globalAlpha = 1;
    for (let i = 0; i < 2600; i++) {
      x.fillStyle = `rgba(0,0,0,${rnd() * 0.12})`;
      x.fillRect(rnd() * W, rnd() * H, 1, 1);
    }
    const vg = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(40,28,10,.5)');
    x.fillStyle = vg;
    x.fillRect(0, 0, W, H);
  }
  return c.toDataURL('image/jpeg', 0.85);
}

export function mediaUrl(
  loc: { media?: { kind: string; url: string }[]; links?: any },
  kind: string,
): string | null {
  // Ưu tiên link admin nhập (Excel/Import), sau đó tới media upload
  const lk: Record<string, string> = { PANO360: 'pano360', OLD: 'old', NOW: 'now', AUDIO: 'audio' };
  const key = lk[kind];
  if (key && loc.links && loc.links[key]) return loc.links[key];
  const m = loc.media?.find((x) => x.kind === kind);
  return m ? m.url : null;
}

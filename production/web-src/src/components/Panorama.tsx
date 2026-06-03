import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Lang, Hotspot, Palette } from '../types';
import { makePano } from '../generate';

const R = 500;

export default function Panorama({
  src,
  fallbackLabel,
  palette,
  lang,
  autorotate,
  speed,
  initialYaw,
  hotspots,
  onHotspot,
  editMode,
  onPick,
}: {
  src?: string | null;
  fallbackLabel: string;
  palette?: Palette | null;
  lang: Lang;
  autorotate?: boolean;
  speed?: number;
  initialYaw?: number;
  hotspots?: Hotspot[];
  onHotspot?: (toSlug: string) => void;
  editMode?: boolean;
  onPick?: (yaw: number, pitch: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lon = useRef(0);
  const lat = useRef(0);
  const gyro = useRef(false);
  const gyroBase = useRef<number | null>(null);
  const [gyroOn, setGyroOn] = useState(false);
  const rot = useRef(!!autorotate);
  const [rotOn, setRotOn] = useState(!!autorotate);
  const pauseRot = useRef(false);
  const pauseTimer = useRef<any>(null);
  // hotspot overlay
  const hsRef = useRef<Hotspot[]>(hotspots || []);
  hsRef.current = hotspots || [];
  const markerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const editRef = useRef(!!editMode);
  editRef.current = !!editMode;

  useEffect(() => {
    lon.current = initialYaw || 0;
    lat.current = 0;
    gyroBase.current = null;
    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 1, 1100);
    const geo = new THREE.SphereGeometry(R, 60, 40);
    geo.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geo, material);
    scene.add(mesh);

    const url = src || makePano(palette ?? null, fallbackLabel);
    new THREE.TextureLoader().load(url, (tex) => {
      material.map = tex;
      material.needsUpdate = true;
    });

    const raycaster = new THREE.Raycaster();
    let down = false, moved = 0, dx = 0, dy = 0, plon = 0, plat = 0, raf = 0;

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (gyro.current) return;
      down = true; moved = 0;
      pauseRot.current = true;
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
      const t = 'touches' in e ? e.touches[0] : e;
      dx = t.clientX; dy = t.clientY; plon = lon.current; plat = lat.current;
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!down || gyro.current) return;
      const t = 'touches' in e ? e.touches[0] : e;
      moved += Math.abs(t.clientX - dx) + Math.abs(t.clientY - dy);
      lon.current = (dx - t.clientX) * 0.16 + plon;
      lat.current = Math.max(-80, Math.min(80, (t.clientY - dy) * 0.16 + plat));
    };
    const onUp = (e: MouseEvent | TouchEvent) => {
      const wasDown = down;
      down = false;
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
      pauseTimer.current = setTimeout(() => (pauseRot.current = false), 2500);
      // Chế độ biên tập: bấm (không kéo) -> raycast lấy yaw/pitch
      if (wasDown && editRef.current && onPickRef.current && moved < 6) {
        const t = 'changedTouches' in e ? e.changedTouches[0] : (e as MouseEvent);
        const r = canvas.getBoundingClientRect();
        const ndc = new THREE.Vector2(((t.clientX - r.left) / r.width) * 2 - 1, -((t.clientY - r.top) / r.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObject(mesh)[0];
        if (hit) {
          const p = hit.point;
          const yaw = THREE.MathUtils.radToDeg(Math.atan2(p.z, p.x));
          const pitch = THREE.MathUtils.radToDeg(Math.asin(Math.max(-1, Math.min(1, p.y / R))));
          onPickRef.current(Math.round(yaw), Math.round(pitch));
        }
      }
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (!gyro.current || e.alpha == null) return;
      if (gyroBase.current === null) gyroBase.current = e.alpha;
      lon.current = -(e.alpha - gyroBase.current);
      lat.current = Math.max(-80, Math.min(80, (e.beta ?? 90) - 90));
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchend', onUp);
    window.addEventListener('resize', resize);
    window.addEventListener('deviceorientation', onOrient);
    resize();

    const tmp = new THREE.Vector3();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (rot.current && !down && !gyro.current && !pauseRot.current) lon.current += (speed || 6) / 60;
      const ph = THREE.MathUtils.degToRad(90 - lat.current), th = THREE.MathUtils.degToRad(lon.current);
      const fx = Math.sin(ph) * Math.cos(th), fy = Math.cos(ph), fz = Math.sin(ph) * Math.sin(th);
      camera.lookAt(R * fx, R * fy, R * fz);
      renderer.render(scene, camera);

      // Cập nhật vị trí mũi tên hotspot (chiếu 3D -> màn hình)
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const list = hsRef.current;
      for (let i = 0; i < markerRefs.current.length; i++) {
        const el = markerRefs.current[i]; const hs = list[i];
        if (!el || !hs) continue;
        const hph = THREE.MathUtils.degToRad(90 - (hs.pitch || 0)), hth = THREE.MathUtils.degToRad(hs.yaw || 0);
        const hx = Math.sin(hph) * Math.cos(hth), hy = Math.cos(hph), hz = Math.sin(hph) * Math.sin(hth);
        const dot = hx * fx + hy * fy + hz * fz; // >0: phía trước
        if (dot < 0.18) { el.style.display = 'none'; continue; }
        tmp.set(R * hx, R * hy, R * hz).project(camera);
        el.style.display = 'flex';
        el.style.left = ((tmp.x * 0.5 + 0.5) * w) + 'px';
        el.style.top = ((-tmp.y * 0.5 + 0.5) * h) + 'px';
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('touchend', onUp);
      window.removeEventListener('resize', resize);
      window.removeEventListener('deviceorientation', onOrient);
      geo.dispose();
      material.map?.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [src, initialYaw, fallbackLabel]);

  const toggleGyro = async () => {
    if (gyro.current) { gyro.current = false; gyroBase.current = null; setGyroOn(false); return; }
    const DOE = (window as any).DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      try { if ((await DOE.requestPermission()) !== 'granted') return; } catch { return; }
    }
    gyro.current = true; gyroBase.current = null; setGyroOn(true);
  };
  const reset = () => { lon.current = initialYaw || 0; lat.current = 0; gyroBase.current = null; };

  return (
    <>
      <canvas ref={canvasRef} className="pano-canvas" />
      {/* Mũi tên hotspot (Street View) */}
      <div className="hs-layer">
        {(hotspots || []).map((hs: any, i) => (
          <button
            key={hs.id || i}
            ref={(el) => (markerRefs.current[i] = el)}
            className={'hs-arrow' + (editMode ? ' edit' : '')}
            style={{ display: 'none' }}
            onClick={() => !editMode && onHotspot && onHotspot(hs.to)}
            title={hs.name || hs.label || hs.to}
          >
            <span className="hs-thumb" style={hs.thumb ? { backgroundImage: `url(${hs.thumb})` } : undefined}>
              {!hs.thumb && '➤'}
            </span>
            {(hs.name || hs.label) && <span className="hs-name">{hs.name || hs.label}</span>}
          </button>
        ))}
      </div>
      {editMode && <div className="pano-edit-hint">👆 Bấm lên ảnh để đặt mũi tên</div>}
      <div className="pano-ctrl">
        <button className={rotOn ? 'on' : ''} onClick={() => { const v = !rotOn; setRotOn(v); rot.current = v; if (v) pauseRot.current = false; }}>
          🔄 {lang === 'vi' ? 'Tự xoay' : 'Auto'}
        </button>
        <button className={gyroOn ? 'on' : ''} onClick={toggleGyro}>🧭 {lang === 'vi' ? 'Xoay máy' : 'Gyro'}</button>
        <button onClick={reset}>↺ {lang === 'vi' ? 'Giữa' : 'Center'}</button>
      </div>
    </>
  );
}

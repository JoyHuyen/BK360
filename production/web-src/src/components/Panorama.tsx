import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Lang, Location } from '../types';
import { makePano, mediaUrl } from '../generate';
import { tx } from '../i18n';

export default function Panorama({ location, lang }: { location: Location; lang: Lang }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lon = useRef(0);
  const lat = useRef(0);
  const gyro = useRef(false);
  const gyroBase = useRef<number | null>(null);
  const [gyroOn, setGyroOn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 1, 1100);
    const geo = new THREE.SphereGeometry(500, 60, 40);
    geo.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial();
    scene.add(new THREE.Mesh(geo, material));

    const url = mediaUrl(location, 'PANO360') ?? makePano(location.palette, tx(location.i18n, lang, 'name'));
    new THREE.TextureLoader().load(url, (tex) => {
      material.map = tex;
      material.needsUpdate = true;
    });

    let down = false,
      dx = 0,
      dy = 0,
      plon = 0,
      plat = 0,
      raf = 0;

    const resize = () => {
      const w = canvas.clientWidth,
        h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (gyro.current) return;
      down = true;
      const t = 'touches' in e ? e.touches[0] : e;
      dx = t.clientX;
      dy = t.clientY;
      plon = lon.current;
      plat = lat.current;
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!down || gyro.current) return;
      const t = 'touches' in e ? e.touches[0] : e;
      lon.current = (dx - t.clientX) * 0.16 + plon;
      lat.current = Math.max(-80, Math.min(80, (t.clientY - dy) * 0.16 + plat));
    };
    const onUp = () => (down = false);
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

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const ph = THREE.MathUtils.degToRad(90 - lat.current),
        th = THREE.MathUtils.degToRad(lon.current);
      camera.lookAt(
        500 * Math.sin(ph) * Math.cos(th),
        500 * Math.cos(ph),
        500 * Math.sin(ph) * Math.sin(th),
      );
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('resize', resize);
      window.removeEventListener('deviceorientation', onOrient);
      geo.dispose();
      material.map?.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [location, lang]);

  const toggleGyro = async () => {
    if (gyro.current) {
      gyro.current = false;
      gyroBase.current = null;
      setGyroOn(false);
      return;
    }
    const DOE = (window as any).DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      try {
        if ((await DOE.requestPermission()) !== 'granted') return;
      } catch {
        return;
      }
    }
    gyro.current = true;
    gyroBase.current = null;
    setGyroOn(true);
  };
  const reset = () => {
    lon.current = 0;
    lat.current = 0;
    gyroBase.current = null;
  };

  return (
    <>
      <canvas ref={canvasRef} className="pano-canvas" />
      <div className="pano-ctrl">
        <button className={gyroOn ? 'on' : ''} onClick={toggleGyro}>🧭 {lang === 'vi' ? 'Xoay máy' : 'Gyro'}</button>
        <button onClick={reset}>↺ {lang === 'vi' ? 'Giữa' : 'Center'}</button>
      </div>
    </>
  );
}

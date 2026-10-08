import * as THREE from 'three';
import { isMobile } from '../core/utils.js';

/**
 * Creates a renderer bound to a canvas, sized to its parent, which only
 * renders while the canvas is on screen and the tab is visible.
 */
export function createStage(canvas, { alpha = false, shadows = false, maxDpr = 1.75, fov = 35, fps = isMobile() ? 30 : 60 } = {}) {
  let dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.25 : maxDpr);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha,
    antialias: dpr < 2,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  if (shadows && !isMobile()) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 1200);
  const timer = new THREE.Timer();
  const updaters = new Set();
  let onScreen = true;
  let running = false;
  let width = 1;
  let height = 1;
  const resizers = new Set();

  const resize = () => {
    const box = canvas.parentElement.getBoundingClientRect();
    width = Math.max(1, box.width);
    height = Math.max(1, box.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    resizers.forEach((fn) => fn(width, height));
    if (!running) renderer.render(scene, camera);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);

  // Adaptive quality: if the device can't keep up, render fewer pixels and frames.
  let targetFps = fps;
  let degraded = false;
  let minFrameMs = 1000 / fps;
  const applyFps = () => (minFrameMs = 1000 / (degraded ? Math.min(targetFps, 24) : targetFps));
  let last = 0;
  let slowFrames = 0;
  let sampled = 0;
  let loopId = 0;
  const frame = (now) => {
    if (now - last < minFrameMs - 2) return;
    const cost = performance.now();
    last = now;
    timer.update(now);
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();
    updaters.forEach((fn) => fn(t, dt));
    renderer.render(scene, camera);
    if (sampled < 30) {
      sampled++;
      if (performance.now() - cost > 22) slowFrames++;
      if (sampled === 30 && slowFrames > 12) {
        degraded = true;
        dpr = Math.max(0.6, dpr * 0.6);
        applyFps();
        renderer.setPixelRatio(dpr);
        resize();
      }
    }
  };
  const sync = () => {
    const should = onScreen && !document.hidden;
    if (should && !running) {
      running = true;
      timer.update(performance.now()); // drop the time spent paused
      const id = ++loopId;
      const loop = (now) => {
        if (!running || id !== loopId) return;
        requestAnimationFrame(loop);
        frame(now);
      };
      requestAnimationFrame(loop);
    } else if (!should) running = false;
  };
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    sync();
  }, { rootMargin: '80px' });
  io.observe(canvas);
  document.addEventListener('visibilitychange', sync);

  resize();
  sync();

  return {
    THREE,
    renderer,
    scene,
    camera,
    get size() {
      return { width, height };
    },
    onTick: (fn) => updaters.add(fn),
    /** Change the frame-rate cap (e.g. drop it while nothing is moving). */
    setFps(n) {
      targetFps = n;
      applyFps();
    },
    onResize: (fn) => (resizers.add(fn), fn(width, height)),
    renderOnce: () => renderer.render(scene, camera),
    dispose() {
      running = false;
      ro.disconnect();
      io.disconnect();
      renderer.dispose();
    },
  };
}

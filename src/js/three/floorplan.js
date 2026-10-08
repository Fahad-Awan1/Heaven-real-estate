import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createStage } from './stage.js';

export const ROOM_COLORS = {
  living: '#e9a25f',
  kitchen: '#dcc39f',
  dining: '#c99f74',
  bedroom: '#b9c7b1',
  bath: '#a9c4cc',
  terrace: '#a77a52',
  office: '#d6b8c4',
};

/** Lays out a plausible main-level plan from bed/bath counts. Units ≈ metres. */
export function planRooms(p) {
  const W = 16;
  const front = [
    { type: 'living', name: 'Living room', w: 6.2 },
    { type: 'kitchen', name: 'Kitchen', w: 4 },
    { type: 'dining', name: 'Dining', w: 3.6 },
  ];
  if (p.sqft > 3000) front.push({ type: 'office', name: 'Study', w: 2.6 });
  const back = [];
  const beds = Math.min(p.beds, 4);
  const baths = Math.min(p.baths, 3);
  for (let i = 0; i < beds; i++) back.push({ type: 'bedroom', name: i === 0 ? 'Primary suite' : `Bedroom ${i + 1}`, w: i === 0 ? 4.6 : 3.4 });
  for (let i = 0; i < baths; i++) back.splice(Math.min(back.length, i * 2 + 1), 0, { type: 'bath', name: i === 0 ? 'En-suite' : `Bathroom ${i + 1}`, w: 2.1 });

  const rooms = [];
  const row = (list, z, d) => {
    const total = list.reduce((s, r) => s + r.w, 0);
    let x = -W / 2;
    list.forEach((r) => {
      const w = (r.w / total) * W;
      rooms.push({ ...r, x: x + w / 2, z, w, d });
      x += w;
    });
  };
  row(back, -3.2, 4.4);
  row(front, 2, 6);
  rooms.push({ type: 'terrace', name: 'Terrace', x: 0, z: 6.6, w: W, d: 3.2 });
  const area = rooms.reduce((s, r) => s + (r.type === 'terrace' ? 0 : r.w * r.d), 0);
  rooms.forEach((r) => (r.sqft = Math.round(((r.w * r.d) / area) * p.sqft * (r.type === 'terrace' ? 0.6 : 1))));
  return rooms;
}

export function initFloorplan(canvas, property, { onSelect } = {}) {
  const stage = createStage(canvas, { alpha: true, shadows: true, fov: 32 });
  const { scene, camera, renderer } = stage;
  renderer.setClearColor(0x000000, 0);
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x9a8a78, 1.5));
  const sun = new THREE.DirectionalLight(0xfff0dc, 1.6);
  sun.position.set(-10, 18, 8);
  if (renderer.shadowMap.enabled) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 });
  }
  scene.add(sun);

  const rooms = planRooms(property);
  const plan = new THREE.Group();
  scene.add(plan);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf6f0e8, roughness: 0.9 });
  const furnMat = new THREE.MeshStandardMaterial({ color: 0x6e5a4a, roughness: 0.9 });
  const softMat = new THREE.MeshStandardMaterial({ color: 0xece4d8, roughness: 1 });
  const H = 1.3;
  const T = 0.14;
  const pickables = [];

  const add = (geo, mat, x, y, z, parent = plan) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (renderer.shadowMap.enabled) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    parent.add(m);
    return m;
  };

  rooms.forEach((r) => {
    const g = new THREE.Group();
    plan.add(g);
    const floorMat = new THREE.MeshStandardMaterial({ color: ROOM_COLORS[r.type], roughness: 0.85, emissive: 0xffffff, emissiveIntensity: 0 });
    const floor = add(new THREE.BoxGeometry(r.w - 0.04, 0.16, r.d - 0.04), floorMat, r.x, 0.08, r.z, g);
    floor.userData.room = r;
    r.mesh = floor;
    r.group = g;
    pickables.push(floor);
    if (r.type !== 'terrace') {
      // perimeter walls with a doorway gap on the corridor side
      const hw = r.w / 2;
      const hd = r.d / 2;
      add(new THREE.BoxGeometry(r.w, H, T), wallMat, r.x, H / 2, r.z - hd, g);
      add(new THREE.BoxGeometry(T, H, r.d), wallMat, r.x - hw, H / 2, r.z, g);
      add(new THREE.BoxGeometry(T, H, r.d), wallMat, r.x + hw, H / 2, r.z, g);
      const door = Math.min(1.1, r.w * 0.4);
      const seg = (r.w - door) / 2;
      add(new THREE.BoxGeometry(seg, H, T), wallMat, r.x - hw + seg / 2, H / 2, r.z + hd, g);
      add(new THREE.BoxGeometry(seg, H, T), wallMat, r.x + hw - seg / 2, H / 2, r.z + hd, g);
    } else {
      add(new THREE.BoxGeometry(r.w, 0.5, T), new THREE.MeshStandardMaterial({ color: 0xfff6ea, transparent: true, opacity: 0.35 }), r.x, 0.4, r.z + r.d / 2, g);
    }
    // furniture hints
    const f = (w, h, d, dx, dz, mat = furnMat) => add(new THREE.BoxGeometry(w, h, d), mat, r.x + dx, 0.16 + h / 2, r.z + dz, g);
    if (r.type === 'bedroom') {
      f(Math.min(2, r.w * 0.55), 0.45, 2.1, 0, -r.d / 2 + 1.3, softMat);
      f(Math.min(2, r.w * 0.55), 0.7, 0.2, 0, -r.d / 2 + 0.25);
    } else if (r.type === 'living') {
      f(3, 0.55, 0.95, -0.4, -r.d / 2 + 1, softMat);
      f(1.4, 0.3, 0.8, -0.4, 0.2);
      f(0.9, 0.55, 0.9, r.w / 2 - 1, 0.6, softMat);
    } else if (r.type === 'kitchen') {
      f(r.w - 0.6, 0.9, 0.6, 0, -r.d / 2 + 0.45);
      f(Math.min(2.2, r.w * 0.55), 0.9, 0.9, 0, 0.6, softMat);
    } else if (r.type === 'dining') {
      f(Math.min(2.2, r.w * 0.65), 0.75, 1, 0, 0);
    } else if (r.type === 'bath') {
      f(r.w * 0.7, 0.55, 1.6, 0, -r.d / 2 + 1, softMat);
    } else if (r.type === 'office') {
      f(r.w * 0.6, 0.75, 0.7, 0, -r.d / 2 + 0.6);
    } else if (r.type === 'terrace') {
      f(2.4, 0.4, 0.9, -4, 0.3, softMat);
      f(2.4, 0.4, 0.9, 4, 0.3, softMat);
    }
  });

  // base slab
  add(new THREE.BoxGeometry(17.2, 0.3, 15.6), new THREE.MeshStandardMaterial({ color: 0xe5dccf, roughness: 1 }), 0, -0.15, 0.9);

  camera.position.set(-12, 15, 17);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0.8);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = 1.2;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.addEventListener('start', () => (controls.autoRotate = false));

  stage.onResize((w, h) => {
    const k = w / h < 1 ? 1.45 : 1;
    camera.position.setLength(31 * k);
  });

  let selected = null;
  let hovered = null;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(pickables)[0]?.object.userData.room || null;
  };
  const paint = () =>
    rooms.forEach((r) => {
      const on = r === selected || r === hovered;
      r.mesh.material.emissiveIntensity = r === selected ? 0.28 : r === hovered ? 0.14 : 0;
      r.group.position.y += ((on && r === selected ? 0.35 : 0) - r.group.position.y) * 0.2;
    });
  function select(room) {
    selected = room;
    onSelect?.(room);
  }
  let down = null;
  canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY }));
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    select(pick(e));
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    hovered = pick(e);
    canvas.style.cursor = hovered ? 'pointer' : 'grab';
  });

  stage.onTick(() => {
    controls.update();
    paint();
  });

  return { rooms, select };
}

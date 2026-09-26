import * as THREE from './three.module.js';

const SCALE = 0.035;
const SEGMENT_PX = 330;
const SEGMENT = SEGMENT_PX * SCALE;
const CROSS_STEP = 1100;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ec9df);
scene.fog = new THREE.Fog(0x9ec9df, 36, 150);

const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.08, 450);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.domElement.id = 'world3d';
renderer.domElement.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;display:block';
document.body.insertBefore(renderer.domElement, document.body.firstChild);

const hemi = new THREE.HemisphereLight(0xd8edff, 0x536044, 1.65);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffedc2, 2.4);
sun.position.set(-24, 42, -18);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 36;
sun.shadow.camera.bottom = -36;
sun.shadow.bias = -0.00035;
scene.add(sun);
scene.add(sun.target);

const mats = {
  grass: new THREE.MeshStandardMaterial({ color: 0x64844b, roughness: 1 }),
  road: new THREE.MeshStandardMaterial({ color: 0x30343a, roughness: 0.92, metalness: 0.03 }),
  sidewalk: new THREE.MeshStandardMaterial({ color: 0x9b9b91, roughness: 0.95 }),
  parking: new THREE.MeshStandardMaterial({ color: 0x595d62, roughness: 0.9 }),
  stripe: new THREE.MeshStandardMaterial({ color: 0xe6dfc6, roughness: 0.85 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xe3bf39, roughness: 0.85 }),
  curb: new THREE.MeshStandardMaterial({ color: 0xbfc2bf, roughness: 0.9 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x65452d, roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x34764b, roughness: 0.9 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x6f9ca9, roughness: 0.18, metalness: 0.08, transparent: true, opacity: 0.34, depthWrite: false }),
  tire: new THREE.MeshStandardMaterial({ color: 0x111316, roughness: 0.8 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xbcc5cc, metalness: 0.78, roughness: 0.24 }),
  interior: new THREE.MeshStandardMaterial({ color: 0x171a1e, roughness: 0.8 }),
  seat: new THREE.MeshStandardMaterial({ color: 0x292d32, roughness: 0.88 }),
  lamp: new THREE.MeshStandardMaterial({ color: 0xfff1c2, emissive: 0xffc34f, emissiveIntensity: 1.5 }),
  puddle: new THREE.MeshPhysicalMaterial({ color: 0x81909a, roughness: 0.1, metalness: 0.34, transparent: true, opacity: 0.32, depthWrite: false }),
};
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const worldGroup = new THREE.Group();
scene.add(worldGroup);
const chunks = new Map();
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const planeGeo = new THREE.PlaneGeometry(1, 1);
const puddleGeo = new THREE.CircleGeometry(1, 10);
const sharedMaterials = new Set(Object.values(mats));
function box(parent, x, y, z, sx, sy, sz, material, cast = false, receive = true) {
  const mesh = new THREE.Mesh(boxGeo, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
}
function flat(parent, x, y, z, sx, sz, material) {
  const mesh = new THREE.Mesh(planeGeo, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sz, 1);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function disposeObject(root) {
  root.traverse((obj) => {
    if (obj.geometry && obj.geometry !== boxGeo && obj.geometry !== planeGeo && obj.geometry !== puddleGeo) obj.geometry.dispose();
    if (obj.material) {
      for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) {
        if (!sharedMaterials.has(material)) material.dispose();
      }
    }
  });
}
function seeded(n) {
  const r = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return r - Math.floor(r);
}
function addTree(group, x, z, scale = 1) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * scale, 0.14 * scale, 1.35 * scale, 7), mats.trunk);
  trunk.position.set(x, 0.68 * scale, z);
  trunk.castShadow = true;
  group.add(trunk);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.85 * scale, 2.1 * scale, 8), mats.leaf);
  crown.position.set(x, 2.05 * scale, z);
  crown.castShadow = true;
  group.add(crown);
  const crown2 = new THREE.Mesh(new THREE.SphereGeometry(0.57 * scale, 8, 6), mats.leaf);
  crown2.position.set(x, 2.55 * scale, z);
  crown2.castShadow = true;
  group.add(crown2);
  for (const offset of [-0.46, 0.46]) {
    const branch = new THREE.Mesh(new THREE.SphereGeometry(0.48 * scale, 7, 5), mats.leaf);
    branch.position.set(x + offset * scale, 2.05 * scale, z + offset * 0.4 * scale);
    branch.castShadow = true;
    group.add(branch);
  }
}
function addLamp(group, x, z) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 3.8, 6), mats.chrome);
  pole.position.set(x, 1.9, z);
  group.add(pole);
  const arm = box(group, x - Math.sign(x) * 0.26, 3.76, z, 0.58, 0.055, 0.055, mats.chrome);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.2), mats.lamp);
  head.position.set(x - Math.sign(x) * 0.5, 3.68, z);
  group.add(head);
  return arm;
}
function addTrafficLight(group, x, z) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.06, 4.4, 6), mats.chrome);
  pole.position.set(x, 2.2, z);
  group.add(pole);
  const signalMat = new THREE.MeshStandardMaterial({ color: 0x20242a, roughness: 0.55 });
  box(group, x, 4.15, z, 0.38, 0.9, 0.32, signalMat);
  const bulbs = [];
  for (let i = 0; i < 3; i++) {
    const bulbMat = new THREE.MeshStandardMaterial({ color: [0xf12d26, 0xffbf2f, 0x35d477][i], emissive: [0xf12d26, 0xffbf2f, 0x35d477][i], emissiveIntensity: 0.5 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.105, 8, 6), bulbMat);
    bulb.position.set(x, 4.42 - i * 0.27, z - 0.17);
    group.add(bulb);
    bulbs.push(bulb);
  }
  return bulbs;
}
function addBuilding(group, side, index) {
  const r1 = seeded(index * 7 + side * 13);
  const depth = 6.3 + r1 * 5.7;
  const length = 5.4 + seeded(index * 11 + side * 3) * 4.8;
  const height = 5 + seeded(index * 19 + side * 5) * 14;
  const centerX = side * (20.5 + depth / 2 + r1 * 1.1);
  const centerZ = index * SEGMENT + (seeded(index * 23 + side) - 0.5) * (SEGMENT - length);
  const colors = [0xbfae94, 0xb8c1c4, 0xc7b6a1, 0x9daeb0, 0xd2c9b7, 0x8f9c9b, 0xb7a7a2];
  const material = new THREE.MeshStandardMaterial({ color: colors[Math.floor(seeded(index * 29 + side) * colors.length)], roughness: 0.88 });
  box(group, centerX, height / 2, centerZ, depth, height, length, material, true);
  box(group, centerX, height + 0.08, centerZ, depth + 0.18, 0.16, length + 0.18,
    new THREE.MeshStandardMaterial({ color: 0x646968, roughness: 0.9 }), false);
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x6f9bab, emissive: 0x162c35, roughness: 0.28, metalness: 0.1 });
  const faceX = centerX - side * (depth / 2 + 0.012);
  const windowGeo = new THREE.PlaneGeometry(0.48, 0.52);
  for (let floor = 0; floor < Math.floor((height - 1.1) / 1.35); floor++) {
    for (let col = 0; col < Math.max(2, Math.floor(length / 1.35)); col++) {
      const win = new THREE.Mesh(windowGeo, windowMat);
      win.position.set(faceX, 1.15 + floor * 1.35, centerZ - length * 0.38 + col * 1.1);
      win.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      group.add(win);
      if (floor === 0 && col % 2 === 0) {
        box(group, faceX, 1.03 + floor * 1.35, centerZ - length * 0.38 + col * 1.1, 0.12, 0.07, 0.72, mats.curb);
      }
    }
  }
  if (seeded(index * 31 + side) > 0.48) {
    const awningMat = new THREE.MeshStandardMaterial({ color: [0xa84632, 0x356e85, 0xd0a437][Math.floor(seeded(index * 37 + side) * 3)], roughness: 0.85 });
    box(group, centerX - side * (depth / 2 + 0.34), 2.9, centerZ, 0.72, 0.13, Math.min(length * 0.72, 4), awningMat);
  }
}
function makeChunk(index) {
  const group = new THREE.Group();
  const centerZ = (index + 0.5) * SEGMENT;
  flat(group, 0, -0.05, centerZ, 120, SEGMENT, mats.grass);
  flat(group, 0, 0.005, centerZ, 340 * SCALE, SEGMENT, mats.road);
  for (const side of [-1, 1]) {
    flat(group, side * ((170 + 270) * 0.5 * SCALE), 0.015, centerZ, (270 - 170) * SCALE, SEGMENT, mats.sidewalk);
    flat(group, side * ((330 + 570) * 0.5 * SCALE), 0.012, centerZ, (570 - 330) * SCALE, SEGMENT, mats.parking);
    flat(group, side * 5.82, 0.035, centerZ, 0.035, SEGMENT, mats.stripe);
    flat(group, side * 9.4, 0.04, centerZ, 0.075, SEGMENT, mats.curb);
    flat(group, side * 19.8, 0.025, centerZ, 0.06, SEGMENT, mats.curb);
    addBuilding(group, side, index);
    const treeCount = 2;
    for (let i = 0; i < treeCount; i++) {
      const tx = side * (8.65 + seeded(index * 41 + i * 9 + side) * 0.5);
      const tz = index * SEGMENT + (i + 0.3) * SEGMENT / treeCount;
      addTree(group, tx, tz, 0.85 + seeded(index * 47 + i + side) * 0.25);
      addLamp(group, side * 6.1, tz + 1.5);
    }
  }
  for (const laneX of [-3.96, -1.96, 1.96, 3.96]) {
    const dashCount = 4;
    for (let i = 0; i < dashCount; i++) {
      flat(group, laneX, 0.04, index * SEGMENT + (i + 0.5) * SEGMENT / dashCount, 0.045, SEGMENT / dashCount * 0.52, mats.stripe);
    }
  }
  flat(group, 0, 0.04, centerZ, 0.045, SEGMENT, mats.yellow);
  group.userData.puddles = [];
  for (let i = 0; i < 3; i++) {
    const puddle = new THREE.Mesh(puddleGeo, mats.puddle);
    puddle.rotation.x = -Math.PI / 2;
    puddle.rotation.z = seeded(index * 53 + i) * Math.PI;
    puddle.position.set((seeded(index * 59 + i) - 0.5) * 7.2, 0.026, index * SEGMENT + (i + 0.5) * SEGMENT / 3);
    puddle.scale.set(0.35 + seeded(index * 61 + i) * 0.5, 0.22 + seeded(index * 67 + i) * 0.32, 1);
    puddle.visible = renderedWeather === 'rain' || renderedWeather === 'storm';
    group.add(puddle);
    group.userData.puddles.push(puddle);
  }
  const intersectionY = Math.round(centerZ / (CROSS_STEP * SCALE)) * CROSS_STEP * SCALE;
  if (Math.abs(intersectionY - centerZ) < SEGMENT / 2) {
    flat(group, 0, 0.008, intersectionY, 44, 2.3, mats.road);
    for (let i = 0; i < 11; i++) {
      flat(group, (-5 + i) * 0.92, 0.055, intersectionY - 1.72, 0.58, 1.12, mats.stripe);
      flat(group, (-5 + i) * 0.92, 0.055, intersectionY + 1.72, 0.58, 1.12, mats.stripe);
    }
    group.userData.trafficLights = [
      { y: Math.round(intersectionY / SCALE), side: -1, bulbs: addTrafficLight(group, -5.45, intersectionY - 1.3) },
      { y: Math.round(intersectionY / SCALE), side: 1, bulbs: addTrafficLight(group, 5.45, intersectionY + 1.3) },
    ];
  }
  worldGroup.add(group);
  chunks.set(index, group);
}
function updateChunks(worldY) {
  const current = Math.floor(worldY / SEGMENT_PX);
  for (let i = current - 15; i <= current + 15; i++) if (!chunks.has(i)) makeChunk(i);
  for (const [i, group] of chunks) {
    if (i < current - 17 || i > current + 17) {
      worldGroup.remove(group);
      disposeObject(group);
      chunks.delete(i);
    }
  }
}

function makeCar(color = '#111318', type = 'sedan', isPlayer = false) {
  const root = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.58, roughness: 0.27 });
  const darkPaint = new THREE.MeshStandardMaterial({ color: 0x15191d, metalness: 0.45, roughness: 0.32 });
  const glass = mats.glass;
  const length = type === 'bus' || type === 'truck' ? 4.5 : type === 'suv' ? 3.9 : 3.7;
  const width = type === 'bus' ? 1.9 : type === 'suv' ? 1.82 : 1.72;
  const tall = type === 'suv' || type === 'van' || type === 'bus' ? 1.42 : 1.16;
  box(root, 0, 0.47, 0, width, 0.38, length, darkPaint, true);
  box(root, 0, 0.72, -length * 0.27, width * 0.98, 0.34, length * 0.43, paint, true);
  box(root, 0, 0.72, length * 0.32, width * 0.94, 0.35, length * 0.31, paint, true);
  box(root, 0, 1.4, 0.06, width * 0.62, 0.09, length * 0.38, paint, true);
  const windshield = box(root, 0, 1.05, -length * 0.15, width * 0.62, 0.48, 0.035, glass);
  windshield.rotation.x = -0.32;
  const rearGlass = box(root, 0, 1.04, length * 0.22, width * 0.6, 0.43, 0.035, glass);
  rearGlass.rotation.x = 0.34;
  for (const side of [-1, 1]) {
    const window = box(root, side * width * 0.34, 1.08, 0.04, 0.035, 0.37, length * 0.3, glass);
    window.material = glass;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.58, 0.09), paint);
    pillar.position.set(side * width * 0.32, 1.06, -length * 0.16);
    root.add(pillar);
    const rearPillar = pillar.clone(); rearPillar.position.z = length * 0.2; root.add(rearPillar);
    const doorTrim = box(root, side * (width * 0.49), 0.67, 0.06, 0.035, 0.25, length * 0.33, darkPaint);
    doorTrim.material = darkPaint;
    box(root, side * (width * 0.51), 0.81, 0.1, 0.045, 0.035, 0.16, mats.chrome);
    const mirror = box(root, side * (width * 0.57), 0.96, -0.49, 0.2, 0.12, 0.19, darkPaint);
    mirror.rotation.y = side * 0.12;
  }
  // Mercedes-inspired grille and three-point star badge, with no external assets
  box(root, 0, 0.68, -length * 0.505, width * 0.46, 0.34, 0.06, darkPaint);
  box(root, 0, 0.7, -length * 0.54, width * 0.32, 0.21, 0.035, mats.chrome);
  const badge = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), mats.chrome);
  badge.position.set(0, 0.72, -length * 0.565);
  root.add(badge);
  const starGeometry = new THREE.BufferGeometry().setFromPoints([
    v3(0, 0.11, -length * 0.57), v3(0, -0.1, -length * 0.57),
    v3(0, 0.11, -length * 0.57), v3(-0.095, -0.055, -length * 0.57),
    v3(0, 0.11, -length * 0.57), v3(0.095, -0.055, -length * 0.57),
  ]);
  root.add(new THREE.LineSegments(starGeometry, new THREE.LineBasicMaterial({ color: 0x20252a })));
  const indicators = [];
  const brakeLights = [];
  for (const side of [-1, 1]) {
    const headlightMat = new THREE.MeshStandardMaterial({ color: 0xf9f3d8, emissive: 0xdcc77c, emissiveIntensity: 0.72 });
    box(root, side * width * 0.36, 0.79, -length * 0.516, 0.42, 0.19, 0.045, headlightMat);
    const rearLamp = box(root, side * width * 0.37, 0.68, length * 0.51, 0.29, 0.13, 0.04,
      new THREE.MeshStandardMaterial({ color: 0xa52d2b, emissive: 0x51100e, emissiveIntensity: 0.3 }));
    brakeLights.push(rearLamp.material);
    const frontIndicator = box(root, side * width * 0.43, 0.79, -length * 0.519, 0.12, 0.08, 0.035,
      new THREE.MeshStandardMaterial({ color: 0x6d4b19, emissive: 0x241604, emissiveIntensity: 0.02 }));
    const rearIndicator = box(root, side * width * 0.43, 0.77, length * 0.519, 0.12, 0.08, 0.035,
      new THREE.MeshStandardMaterial({ color: 0x6d4b19, emissive: 0x241604, emissiveIntensity: 0.02 }));
    indicators.push({ side, materials: [frontIndicator.material, rearIndicator.material] });
    for (const z of [-length * 0.34, length * 0.34]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 14), mats.tire);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * width * 0.51, 0.38, z);
      wheel.castShadow = true;
      root.add(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.207, 12), mats.chrome);
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(wheel.position);
      root.add(hub);
    }
  }
  // Visible cockpit details for first-person mode
  box(root, 0, 0.91, -0.61, width * 0.77, 0.17, 0.25, mats.interior);
  for (const side of [-1, 1]) {
    box(root, side * width * 0.25, 0.91, 0.57, width * 0.27, 0.42, 0.28, mats.seat, true);
    box(root, side * width * 0.25, 1.17, 0.69, width * 0.27, 0.48, 0.13, mats.seat, true);
  }
  box(root, width * 0.18, 0.87, -0.25, 0.28, 0.16, 0.48, mats.interior);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.035, 7, 20), mats.interior);
  wheel.position.set(width * 0.27, 1.03, -0.35);
  wheel.rotation.x = Math.PI / 2;
  root.add(wheel);
  box(root, 0, 1.02, -0.51, 0.43, 0.12, 0.08, mats.interior);
  box(root, 0, 0.43, -length * 0.53, width * 0.96, 0.13, 0.12, mats.chrome);
  box(root, 0, 0.43, length * 0.53, width * 0.96, 0.13, 0.12, darkPaint);
  root.userData = { color, type, isPlayer, length, width, indicators, brakeLights };
  root.traverse((obj) => { if (obj.isMesh && obj.material !== mats.glass) obj.castShadow = true; });
  return root;
}
function makePedestrian() {
  const root = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color: [0x3782bb, 0xe06747, 0x54a77a, 0xa36abd, 0xd2a844][Math.floor(Math.random() * 5)], roughness: 0.9 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x303a47, roughness: 0.95 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc99470, roughness: 0.95 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.47, 3, 6), shirt);
  torso.position.y = 0.95; root.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), skin);
  head.position.y = 1.37; root.add(head);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.37, 2, 5), pants);
    leg.position.set(side * 0.1, 0.39, 0); root.add(leg);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.34, 2, 5), shirt);
    arm.position.set(side * 0.24, 0.94, 0); root.add(arm);
  }
  root.userData.isPedestrian = true;
  return root;
}
function replaceModel(container, index, styleKey, factory) {
  let model = container[index];
  if (!model || model.userData.styleKey !== styleKey) {
    if (model) { scene.remove(model); disposeObject(model); }
    model = factory();
    model.userData.styleKey = styleKey;
    container[index] = model;
    scene.add(model);
  }
  return model;
}
const trafficModels = [];
const parkedModels = [];
const pedestrianModels = [];
const playerCar = makeCar('#101318', 'sedan', true);
scene.add(playerCar);
const playerAvatar = makePedestrian();
scene.add(playerAvatar);

let cameraMode = 'chase';
let cameraDistance = 8.6;
let orbit = 0;
let pitch = 0.16;
let dragging = false;
let lastPointer = { x: 0, y: 0 };
let frameTime = performance.now();
let cameraReady = false;
window.drivingCameraMode = cameraMode;
window.toggleDrivingCamera = () => {
  cameraMode = cameraMode === 'chase' ? 'inside' : 'chase';
  window.drivingCameraMode = cameraMode;
  const label = document.getElementById('cameraTxt');
  if (label) label.textContent = cameraMode === 'inside' ? '🎥 SALON ICHIDA' : '🎥 ORQADAN';
};
window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'c' && !event.repeat && !window.drivingFrame?.shopOpen) window.toggleDrivingCamera();
});
renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  dragging = true;
  lastPointer = { x: event.clientX, y: event.clientY };
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const dx = event.clientX - lastPointer.x;
  const dy = event.clientY - lastPointer.y;
  lastPointer = { x: event.clientX, y: event.clientY };
  orbit -= dx * 0.006;
  pitch = THREE.MathUtils.clamp(pitch + dy * 0.003, -0.08, 0.55);
});
renderer.domElement.addEventListener('pointerup', () => { dragging = false; });
renderer.domElement.addEventListener('pointercancel', () => { dragging = false; });
renderer.domElement.addEventListener('wheel', (event) => {
  event.preventDefault();
  cameraDistance = THREE.MathUtils.clamp(cameraDistance + event.deltaY * 0.006, 4.5, 15);
}, { passive: false });

const rainCount = 430;
const rainPositions = new Float32Array(rainCount * 3);
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0xd9ebff, size: 0.045, transparent: true, opacity: 0.6, depthWrite: false }));
rain.visible = false;
scene.add(rain);
const weatherNames = ['sun', 'cloud', 'rain', 'fog', 'night', 'storm'];
let renderedWeather = 'sun';
let weatherBlend = 1;
const weatherColors = {
  sun: [0x9ec9df, 0x64844b, 0x30343a, 2.4, 150],
  cloud: [0x8496a3, 0x617260, 0x383b3e, 1.35, 112],
  rain: [0x5a7185, 0x52624e, 0x292e35, 0.92, 77],
  fog: [0xaebbc3, 0x768075, 0x41474a, 1.05, 48],
  night: [0x111d37, 0x202c27, 0x171a20, 0.4, 86],
  storm: [0x35445a, 0x39463c, 0x23272e, 0.7, 60],
};
const tempBg = new THREE.Color();
const tempGrass = new THREE.Color();
const tempRoad = new THREE.Color();
function setWeather(id, dt) {
  if (id !== renderedWeather) {
    renderedWeather = id;
    weatherBlend = 0;
    const wet = id === 'rain' || id === 'storm';
    for (const group of chunks.values()) for (const puddle of group.userData.puddles || []) puddle.visible = wet;
  }
  weatherBlend = Math.min(1, weatherBlend + dt * 0.23);
  const state = weatherColors[id] || weatherColors.sun;
  const blend = THREE.MathUtils.smoothstep(weatherBlend, 0, 1);
  tempBg.setHex(state[0]); tempGrass.setHex(state[1]); tempRoad.setHex(state[2]);
  scene.background.lerp(tempBg, blend);
  scene.fog.color.lerp(tempBg, blend);
  mats.grass.color.lerp(tempGrass, blend);
  mats.road.color.lerp(tempRoad, blend);
  sun.intensity += (state[3] - sun.intensity) * Math.min(1, dt * 0.6);
  scene.fog.near += (20 - scene.fog.near) * Math.min(1, dt * 0.4);
  scene.fog.far += (state[4] - scene.fog.far) * Math.min(1, dt * 0.45);
  hemi.intensity += ((id === 'night' ? 0.45 : id === 'rain' || id === 'storm' ? 0.9 : 1.65) - hemi.intensity) * Math.min(1, dt * 0.7);
  mats.road.roughness += ((id === 'rain' || id === 'storm' ? 0.32 : 0.92) - mats.road.roughness) * Math.min(1, dt * 0.8);
  mats.road.metalness += ((id === 'rain' || id === 'storm' ? 0.22 : 0.03) - mats.road.metalness) * Math.min(1, dt * 0.7);
  rain.visible = id === 'rain' || id === 'storm';
}

function poseCar(model, x, y, angle, isPlayer = false) {
  model.position.set(x * SCALE, 0, y * SCALE);
  model.rotation.y = -angle;
  model.visible = true;
  if (isPlayer && window.drivingFrame?.player?.mode === 'car') {
    playerAvatar.visible = false;
  }
}
function updateModels(frame) {
  const { player, traffic = [], parked = [], pedestrians = [], car } = frame;
  const playerKey = `${car?.id || 'mers'}:${car?.color || '#101318'}:${car?.type || 'sedan'}`;
  if (activePlayerCar.userData.styleKey !== playerKey) {
    scene.remove(activePlayerCar);
    disposeObject(activePlayerCar);
    activePlayerCar = makeCar(car?.color || '#101318', car?.type || 'sedan', true);
    activePlayerCar.userData.styleKey = playerKey;
    scene.add(activePlayerCar);
  }
  const carModel = activePlayerCar;
  if (player.mode === 'car') {
    poseCar(carModel, player.x, player.y, player.angle, true);
    playerAvatar.visible = false;
  } else {
    poseCar(carModel, player.x, player.y, player.angle, true);
    playerAvatar.visible = true;
    playerAvatar.position.set(player.fx * SCALE, 0, player.fy * SCALE);
    playerAvatar.rotation.y = -player.fa;
  }
  for (let i = 0; i < traffic.length; i++) {
    const car = traffic[i];
    const key = `${car.type}:${car.color}`;
    const model = replaceModel(trafficModels, i, key, () => makeCar(car.color || '#6d7883', car.type || 'sedan'));
    poseCar(model, car.x, car.y, car.angle ?? (car.dir === -1 ? 0 : Math.PI));
    model.visible = Math.abs(car.y - player.y) < 780;
    const blink = car.turnRoute === 'curve' && Math.floor(performance.now() / 420) % 2 === 0;
    const indicatorSide = car.dir === -1 ? car.routeSide : -car.routeSide;
    for (const indicator of model.userData.indicators || []) {
      const on = blink && indicator.side === indicatorSide;
      for (const material of indicator.materials) {
        material.color.setHex(on ? 0xffb52e : 0x6d4b19);
        material.emissive.setHex(on ? 0xff8a12 : 0x241604);
        material.emissiveIntensity = on ? 2.2 : 0.02;
      }
    }
    for (const material of model.userData.brakeLights || []) {
      material.emissiveIntensity = car.brake ? 1.8 : 0.3;
    }
  }
  for (let i = 0; i < parked.length; i++) {
    const car = parked[i];
    const key = `${car.type}:${car.color}`;
    const model = replaceModel(parkedModels, i, key, () => makeCar(car.color || '#777b80', car.type || 'sedan'));
    poseCar(model, car.x, car.y, car.angle || 0);
    model.visible = Math.abs(car.y - player.y) < 500;
  }
  for (let i = parked.length; i < parkedModels.length; i++) parkedModels[i].visible = false;
  for (let i = pedestrians.length; i < pedestrianModels.length; i++) pedestrianModels[i].visible = false;
  for (let i = 0; i < pedestrians.length; i++) {
    const ped = pedestrians[i];
    let model = pedestrianModels[i];
    if (!model) { model = makePedestrian(); pedestrianModels[i] = model; scene.add(model); }
    model.visible = Math.abs(ped.y - player.y) < 500;
    model.position.set(ped.x * SCALE, 0, ped.y * SCALE);
    model.rotation.y = ped.dir === -1 ? 0 : Math.PI;
    const swing = Math.sin(ped.phase || 0) * 0.35;
    model.children[2].rotation.x = swing;
    model.children[3].rotation.x = -swing;
    model.children[4].rotation.x = -swing;
    model.children[5].rotation.x = swing;
  }
}
function updateTrafficSignals(frame, now) {
  const colors = [0xf12d26, 0xffbf2f, 0x35d477];
  const dimColors = [0x451a1a, 0x45391a, 0x183c27];
  for (const group of chunks.values()) {
    for (const signal of group.userData.trafficLights || []) {
      const simSignal = frame.trafficLights?.find((item) => item.side === signal.side && Math.abs(item.y - signal.y) < 1);
      if (!simSignal) continue;
      const phase = ((simSignal.phase + now) % 13 + 13) % 13;
      const state = phase < 7 ? 2 : phase < 8.8 || phase >= 12.3 ? 1 : 0;
      signal.bulbs.forEach((bulb, index) => {
        const on = index === state;
        bulb.material.color.setHex(on ? colors[index] : dimColors[index]);
        bulb.material.emissiveIntensity = on ? 2.1 : 0.02;
      });
    }
  }
}
let activePlayerCar = playerCar;

const mapCanvas = document.getElementById('mapCanvas');
const mapCtx = mapCanvas?.getContext('2d');
function drawMiniMap(frame) {
  if (!mapCtx) return;
  const w = mapCanvas.width, h = mapCanvas.height;
  mapCtx.clearRect(0, 0, w, h);
  mapCtx.fillStyle = 'rgba(12,18,22,.96)'; mapCtx.fillRect(0, 0, w, h);
  mapCtx.fillStyle = '#373d43'; mapCtx.fillRect(w * 0.25, 0, w * 0.5, h);
  mapCtx.strokeStyle = 'rgba(235,226,183,.7)'; mapCtx.lineWidth = 2;
  mapCtx.setLineDash([12, 9]); mapCtx.beginPath(); mapCtx.moveTo(w / 2, 0); mapCtx.lineTo(w / 2, h); mapCtx.stroke(); mapCtx.setLineDash([]);
  const player = frame.player;
  const focusY = player.mode === 'car' ? player.y : player.fy;
  const sx = w / 760, sy = h / 1100;
  for (const car of frame.traffic) {
    const x = w / 2 + car.x * sx;
    const y = h / 2 + (car.y - focusY) * sy;
    if (x > 0 && x < w && y > 0 && y < h) { mapCtx.fillStyle = '#fb8b50'; mapCtx.fillRect(x - 3, y - 4, 6, 8); }
  }
  mapCtx.fillStyle = '#ffdb4d';
  mapCtx.save(); mapCtx.translate(w / 2 + player.x * sx, h / 2 + (player.y - focusY) * sy); mapCtx.rotate(-player.angle);
  mapCtx.beginPath(); mapCtx.moveTo(0, -9); mapCtx.lineTo(6, 7); mapCtx.lineTo(-6, 7); mapCtx.closePath(); mapCtx.fill(); mapCtx.restore();
  mapCtx.fillStyle = 'rgba(255,255,255,.82)'; mapCtx.font = 'bold 20px Segoe UI'; mapCtx.fillText('N', 14, 27);
}

function updateCamera(frame, dt) {
  const player = frame.player;
  const x = (player.mode === 'car' ? player.x : player.fx) * SCALE;
  const z = (player.mode === 'car' ? player.y : player.fy) * SCALE;
  const heading = player.mode === 'car' ? player.angle : player.fa;
  const focus = v3(x, player.mode === 'car' ? 0.8 : 0.95, z);
  const smooth = 1 - Math.exp(-5.5 * dt);
  if (cameraMode === 'inside' && player.mode === 'car') {
    const desired = v3(x, 1.31, z).add(v3(0, 0, 0.42).applyAxisAngle(v3(0, 1, 0), -heading));
    camera.position.lerp(desired, smooth);
    const look = focus.clone().add(v3(Math.sin(heading) * 9, 0.8 + pitch * 3, -Math.cos(heading) * 9));
    camera.lookAt(look);
  } else {
    const direction = -heading + orbit;
    const distance = cameraDistance;
    const desired = v3(x - Math.sin(direction) * distance, 2.8 + distance * (0.24 + pitch), z + Math.cos(direction) * distance);
    camera.position.lerp(desired, smooth);
    camera.lookAt(focus);
  }
}
function updateRain(frame, dt) {
  const pos = rainGeo.attributes.position.array;
  const x = (frame.player.mode === 'car' ? frame.player.x : frame.player.fx) * SCALE;
  const z = (frame.player.mode === 'car' ? frame.player.y : frame.player.fy) * SCALE;
  for (let i = 0; i < rainCount; i++) {
    const j = i * 3;
    if (pos[j + 1] <= 0 || Math.abs(pos[j] - x) > 18 || Math.abs(pos[j + 2] - z) > 18) {
      pos[j] = x + (Math.random() - 0.5) * 34;
      pos[j + 1] = 4 + Math.random() * 15;
      pos[j + 2] = z + (Math.random() - 0.5) * 34;
    } else {
      pos[j + 1] -= dt * 13;
      pos[j] -= dt * 1.2;
    }
  }
  rainGeo.attributes.position.needsUpdate = true;
}
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.05, (now - frameTime) / 1000);
  frameTime = now;
  const frame = window.drivingFrame;
  if (!frame) { renderer.render(scene, camera); return; }
  const player = frame.player;
  updateChunks(player.mode === 'car' ? player.y : player.fy);
  const shadowX = (player.mode === 'car' ? player.x : player.fx) * SCALE;
  const shadowZ = (player.mode === 'car' ? player.y : player.fy) * SCALE;
  sun.position.set(shadowX - 24, 42, shadowZ - 18);
  sun.target.position.set(shadowX, 0, shadowZ);
  updateModels(frame);
  updateTrafficSignals(frame, now * 0.001);
  updateCamera(frame, dt);
  setWeather(frame.weather?.id || 'sun', dt);
  updateRain(frame, dt);
  drawMiniMap(frame);
  renderer.render(scene, camera);
}
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight);
});

const fallbackCanvas = document.getElementById('game');
if (fallbackCanvas) fallbackCanvas.style.display = 'none';
if (window.enableThreeRenderer) window.enableThreeRenderer();
window.publishDrivingFrame?.();
cameraReady = true;
animate();

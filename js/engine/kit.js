// Building kit: materials, procedural textures, and a "Part" builder that
// collects simple shapes and merges them into a few meshes (fast on phones).
import * as THREE from 'three';

// ---------- random ----------
export function rng(seed = 1) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- textures ----------
const texCache = new Map();

function canvasTexture(key, size, draw, { repeat = true } = {}) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size, rng(key.length * 9973 + size));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

function noise(g, s, r, base, spots, n = 900, size = 3) {
  g.fillStyle = base; g.fillRect(0, 0, s, s);
  for (let i = 0; i < n; i++) {
    g.fillStyle = spots[Math.floor(r() * spots.length)];
    g.globalAlpha = 0.15 + r() * 0.35;
    const w = size * (0.5 + r());
    g.fillRect(r() * s, r() * s, w, w);
  }
  g.globalAlpha = 1;
}

export const tex = {
  thatch: () => canvasTexture('thatch', 256, (g, s, r) => {
    g.fillStyle = '#7d6a4c'; g.fillRect(0, 0, s, s);
    const cols = ['#5f4f36', '#8f7a58', '#9c8a66', '#6b5a3f', '#a39274', '#584a35'];
    for (let i = 0; i < 1400; i++) {
      g.strokeStyle = cols[Math.floor(r() * cols.length)];
      g.globalAlpha = 0.35 + r() * 0.5;
      g.lineWidth = 1 + r() * 1.6;
      const x = r() * s, y = r() * s, len = 14 + r() * 40;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y + len); g.stroke();
      if (y + len > s) { g.beginPath(); g.moveTo(x, y - s); g.lineTo(x, y - s + len); g.stroke(); }
    }
    g.globalAlpha = 0.18; g.fillStyle = '#3e3324';
    for (let y = 0; y < s; y += 64) g.fillRect(0, y, s, 5);
    g.globalAlpha = 1;
  }),
  darkWood: () => canvasTexture('darkWood', 128, (g, s, r) => {
    g.fillStyle = '#4a3324'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 160; i++) {
      g.strokeStyle = r() > 0.5 ? '#3b281b' : '#5a3f2c'; g.globalAlpha = 0.5;
      g.lineWidth = 1; const x = r() * s;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 6, s); g.stroke();
    }
    g.globalAlpha = 0.8; g.fillStyle = '#2a1c12';
    for (let x = 0; x < s; x += 32) g.fillRect(x, 0, 2, s);
    g.globalAlpha = 1;
  }),
  oldWood: () => canvasTexture('oldWood', 128, (g, s, r) => {
    g.fillStyle = '#8a7660'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 180; i++) {
      g.strokeStyle = r() > 0.5 ? '#6f5d4a' : '#9c8a74'; g.globalAlpha = 0.5;
      const x = r() * s; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 5, s); g.stroke();
    }
    g.globalAlpha = 0.7; g.fillStyle = '#4e4033';
    for (let x = 0; x < s; x += 21) g.fillRect(x, 0, 2, s);
    g.globalAlpha = 1;
  }),
  floorBoards: () => canvasTexture('floorBoards', 128, (g, s, r) => {
    g.fillStyle = '#6b4a30'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 200; i++) {
      g.strokeStyle = r() > 0.5 ? '#5a3c26' : '#7d5838'; g.globalAlpha = 0.45;
      const y = r() * s; g.beginPath(); g.moveTo(0, y); g.lineTo(s, y + (r() - 0.5) * 4); g.stroke();
    }
    g.globalAlpha = 0.9; g.fillStyle = '#3a2718';
    for (let y = 0; y < s; y += 32) g.fillRect(0, y, s, 2);
    g.globalAlpha = 1;
  }),
  shoji: () => canvasTexture('shoji', 128, (g, s) => {
    g.fillStyle = '#efe9da'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#5b4632';
    for (let i = 0; i <= 4; i++) g.fillRect(i * s / 4 - 2, 0, 4, s);
    for (let i = 0; i <= 6; i++) g.fillRect(0, i * s / 6 - 2, s, 4);
  }),
  fusuma: () => canvasTexture('fusuma', 128, (g, s, r) => {
    noise(g, s, r, '#d9cfb4', ['#cfc3a3', '#e3dac2', '#c9bc99'], 500, 4);
    g.strokeStyle = '#8f8467'; g.globalAlpha = 0.5; g.lineWidth = 2;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(r() * s, r() * s, 6 + r() * 10, 0, Math.PI * 2); g.stroke(); }
    g.globalAlpha = 1; g.fillStyle = '#2d2219'; g.fillRect(0, 0, 4, s); g.fillRect(s - 4, 0, 4, s);
  }),
  tatami: () => canvasTexture('tatami', 256, (g, s) => {
    // two mats side by side (0.9 m x 1.8 m each) in a 1.8 m tile
    g.fillStyle = '#b8b277'; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#a19b62'; g.lineWidth = 1;
    for (let y = 0; y < s; y += 3) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); }
    g.fillStyle = '#1f2a22';
    g.fillRect(0, 0, 6, s); g.fillRect(s / 2 - 3, 0, 6, s); g.fillRect(s - 6, 0, 6, s);
  }),
  plaster: () => canvasTexture('plaster', 64, (g, s, r) => noise(g, s, r, '#d8d0bf', ['#cbc2ae', '#e2dbcc'], 300, 3)),
  earth: () => canvasTexture('earth', 128, (g, s, r) => noise(g, s, r, '#6b5843', ['#5a4936', '#7c6850', '#4f402f'], 1200, 3)),
  stone: () => canvasTexture('stone', 64, (g, s, r) => noise(g, s, r, '#8b8a84', ['#77766f', '#9e9d97', '#6a6964'], 400, 4)),
  grass: () => canvasTexture('grass', 128, (g, s, r) => noise(g, s, r, '#6f8f45', ['#5f7f3a', '#7f9e52', '#58763a', '#8aa95c'], 1500, 3)),
  autumnGrass: () => canvasTexture('autumnGrass', 128, (g, s, r) => noise(g, s, r, '#7a8048', ['#6a7040', '#8f8a50', '#646b3a', '#9a9058'], 1500, 3)),
  rice: () => canvasTexture('rice', 128, (g, s, r) => {
    noise(g, s, r, '#c2a94e', ['#b39a42', '#d1b95c', '#a88f3c'], 900, 3);
    g.globalAlpha = 0.35; g.fillStyle = '#8a7a34';
    for (let y = 0; y < s; y += 8) g.fillRect(0, y, s, 2);
    g.globalAlpha = 1;
  }),
  silkworm: () => canvasTexture('silkworm', 128, (g, s, r) => {
    noise(g, s, r, '#5f7d3b', ['#4f6b30', '#6f8f47'], 400, 6);
    g.fillStyle = '#f2efe4';
    for (let i = 0; i < 90; i++) {
      g.save(); g.translate(r() * s, r() * s); g.rotate(r() * Math.PI);
      g.fillRect(-5, -1.5, 10, 3); g.restore();
    }
  }),
  // ---- 1949 suburb ----
  siding: () => canvasTexture('siding', 128, (g, s, r) => {
    noise(g, s, r, '#ffffff', ['#f2f2f2', '#e8e8e8'], 200, 3);
    g.fillStyle = '#9a9a9a';
    for (let y = 0; y < s; y += 16) { g.globalAlpha = 0.55; g.fillRect(0, y, s, 2); g.globalAlpha = 0.2; g.fillRect(0, y + 2, s, 3); }
    g.globalAlpha = 0.25;
    for (let y = 0; y < s; y += 16) { const off = (y / 16) % 2 ? 0 : s / 4; for (let x = off; x < s; x += s / 2) g.fillRect(x, y, 2, 16); }
    g.globalAlpha = 1;
  }),
  shingles: () => canvasTexture('shingles', 128, (g, s, r) => {
    g.fillStyle = '#4a4c50'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 16) {
      const off = (y / 16) % 2 ? 0 : 16;
      for (let x = -16 + off; x < s; x += 32) {
        const v = 60 + Math.floor(r() * 30);
        g.fillStyle = `rgb(${v},${v + 2},${v + 6})`; g.fillRect(x + 1, y + 1, 30, 14);
      }
      g.fillStyle = '#2e3033'; g.fillRect(0, y + 14, s, 2);
    }
  }),
  brick: () => canvasTexture('brick', 128, (g, s, r) => {
    g.fillStyle = '#cfc6b8'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 16) {
      const off = (y / 16) % 2 ? 0 : 16;
      for (let x = -16 + off; x < s; x += 32) {
        const v = Math.floor(r() * 30);
        g.fillStyle = `rgb(${150 + v},${70 + v / 2},${55})`; g.fillRect(x + 2, y + 2, 28, 12);
      }
    }
  }),
  concrete: () => canvasTexture('concrete', 128, (g, s, r) => {
    noise(g, s, r, '#b9b6ae', ['#a9a69e', '#c8c5bd', '#9e9b93'], 1200, 2);
    g.globalAlpha = 0.35; g.fillStyle = '#85827b'; g.fillRect(0, 0, s, 2); g.fillRect(0, 0, 2, s); g.globalAlpha = 1;
  }),
  asphalt: () => canvasTexture('asphalt', 128, (g, s, r) => noise(g, s, r, '#3d3f42', ['#333538', '#4a4c50', '#2c2e30'], 1600, 2)),
  gravel: () => canvasTexture('gravel', 128, (g, s, r) => noise(g, s, r, '#8d8578', ['#6f675b', '#a59d90', '#7c7468'], 2200, 3)),
  dirt: () => canvasTexture('dirt', 128, (g, s, r) => noise(g, s, r, '#8a7051', ['#7a6145', '#9a805f', '#6e573d'], 1500, 3)),
  lumber: () => canvasTexture('lumber', 64, (g, s, r) => {
    g.fillStyle = '#d4b483'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 60; i++) {
      g.strokeStyle = r() > 0.5 ? '#c4a06c' : '#e0c597'; g.globalAlpha = 0.6;
      const y = r() * s; g.beginPath(); g.moveTo(0, y); g.lineTo(s, y + (r() - 0.5) * 3); g.stroke();
    }
    g.globalAlpha = 1;
  }),
  plywood: () => canvasTexture('plywood', 128, (g, s, r) => {
    noise(g, s, r, '#c9a873', ['#b8945e', '#d6b787', '#bf9c66'], 500, 6);
    g.globalAlpha = 0.5; g.fillStyle = '#8a6c42'; g.fillRect(0, 0, s, 2); g.fillRect(0, 0, 2, s); g.globalAlpha = 1;
  }),
  floorTile: () => canvasTexture('floorTile', 128, (g, s, r) => {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const v = Math.floor(r() * 14);
      g.fillStyle = (x + y) % 2 ? `rgb(${118 + v},${96 + v},${78 + v})` : `rgb(${92 + v},${74 + v},${60 + v})`;
      g.fillRect(x * s / 4, y * s / 4, s / 4, s / 4);
    }
  }),
  linoleum: () => canvasTexture('linoleum', 128, (g, s) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      g.fillStyle = (x + y) % 2 ? '#e9e4d6' : '#b5413b';
      g.fillRect(x * s / 8, y * s / 8, s / 8, s / 8);
    }
  }),
  rug: () => canvasTexture('rug', 128, (g, s) => {
    g.fillStyle = '#7a3b2e'; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#d9b36c'; g.lineWidth = 6; g.strokeRect(10, 10, s - 20, s - 20);
    g.lineWidth = 2; g.strokeRect(22, 22, s - 44, s - 44);
  }, { repeat: false }),
  tvScreen: () => canvasTexture('tvScreen', 128, (g, s) => {
    g.fillStyle = '#9fb0b0'; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#2f3a3a'; g.lineWidth = 3;
    g.beginPath(); g.arc(s / 2, s / 2, s * 0.32, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(s / 2, s / 2, s * 0.14, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(0, s / 2); g.lineTo(s, s / 2); g.moveTo(s / 2, 0); g.lineTo(s / 2, s); g.stroke();
    g.fillStyle = '#2f3a3a';
    for (let i = 0; i < 6; i++) g.fillRect(s * 0.14 + i * s * 0.12, s * 0.8, s * 0.06, s * 0.08);
  }, { repeat: false }),
};

// ---------- materials ----------
const matCache = new Map();

/**
 * Cached Lambert material. opts.uv = metres per texture repeat; when set the
 * Part builder generates "world" UVs so textures keep a constant scale.
 */
export function mat(color, opts = {}) {
  const { uv, ...rest } = opts;
  const key = color + '|' + (uv || '') + '|' + Object.entries(rest)
    .map(([k, v]) => k + ':' + (v && v.isTexture ? v.uuid : v)).join(',');
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, ...rest });
    if (uv) m.userData.uvScale = uv;
    matCache.set(key, m);
  }
  return m;
}

// ---------- geometry helpers ----------
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);

function ensureUV(g) {
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
  return g;
}

function worldUV(g, scale) {
  const p = g.attributes.position.array, n = g.attributes.normal.array, uv = g.attributes.uv.array;
  for (let i = 0, j = 0; i < p.length; i += 3, j += 2) {
    const ax = Math.abs(n[i]), ay = Math.abs(n[i + 1]), az = Math.abs(n[i + 2]);
    let u, v;
    if (ax >= ay && ax >= az) { u = p[i + 2]; v = p[i + 1]; }
    else if (ay >= az) { u = p[i]; v = p[i + 2]; }
    else { u = p[i]; v = p[i + 1]; }
    uv[j] = u / scale; uv[j + 1] = v / scale;
  }
  g.attributes.uv.needsUpdate = true;
}

export function mergeGeometries(list) {
  let count = 0;
  for (const g of list) count += g.attributes.position.count;
  const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3), uv = new Float32Array(count * 2);
  let o = 0;
  for (const g of list) {
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    uv.set(g.attributes.uv.array, o * 2);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingBox(); out.computeBoundingSphere();
  return out;
}

/** Collects shapes; build() merges them per material into one Group. */
export class Part {
  constructor(name = 'part') { this.name = name; this.buckets = new Map(); }

  addGeometry(geo, material, matrix) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    geo.dispose();
    if (matrix) g.applyMatrix4(matrix);
    ensureUV(g);
    if (!this.buckets.has(material)) this.buckets.set(material, []);
    this.buckets.get(material).push(g);
    return this;
  }

  add(geo, material, pos = [0, 0, 0], rot, scl) {
    rot = rot || [0, 0, 0]; scl = scl || [1, 1, 1];
    _m.compose(_p.set(pos[0], pos[1], pos[2]), _q.setFromEuler(_e.set(rot[0], rot[1], rot[2], rot[3] || 'XYZ')), _s.set(scl[0], scl[1], scl[2]));
    return this.addGeometry(geo, material, _m);
  }

  /** Box by centre. */
  box(w, h, d, x, y, z, material, rot) { return this.add(new THREE.BoxGeometry(w, h, d), material, [x, y, z], rot); }

  /** Axis-aligned box by min/max corners. */
  block(x0, y0, z0, x1, y1, z1, material) {
    return this.box(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, material);
  }

  cyl(r, h, x, y, z, material, rot, seg = 8, rTop) {
    return this.add(new THREE.CylinderGeometry(rTop ?? r, r, h, seg), material, [x, y, z], rot);
  }

  /** Beam (square or round) running from point a to point b. */
  beam(a, b, size, material, round = false, seg = 6) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const d = B.clone().sub(A), len = d.length();
    const geo = round ? new THREE.CylinderGeometry(size, size, len, seg) : new THREE.BoxGeometry(size, len, size);
    _q.setFromUnitVectors(_up, d.normalize());
    _m.compose(A.add(B).multiplyScalar(0.5), _q, _s.set(1, 1, 1));
    return this.addGeometry(geo, material, _m);
  }

  /** Extrude a 2D polygon (x,y pairs) along z from z0 to z1. */
  prism(points, z0, z1, material) {
    const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: z1 - z0, bevelEnabled: false });
    return this.add(geo, material, [0, 0, z0]);
  }

  /**
   * A flat wall from (a) to (b) along one axis, with rectangular openings.
   * axis 'x': wall runs along x at fixed z; axis 'z': runs along z at fixed x.
   * openings: [{from, to, y0, y1}] in wall-axis coordinates.
   */
  wall(axis, from, to, fixed, y0, y1, thick, material, openings = []) {
    const ops = openings.slice().sort((a, b) => a.from - b.from);
    const seg = (a, b, ya, yb) => {
      if (b - a < 0.001 || yb - ya < 0.001) return;
      if (axis === 'x') this.block(a, ya, fixed - thick / 2, b, yb, fixed + thick / 2, material);
      else this.block(fixed - thick / 2, ya, a, fixed + thick / 2, yb, b, material);
    };
    let cur = from;
    for (const o of ops) {
      seg(cur, o.from, y0, y1);
      seg(o.from, o.to, y0, o.y0);
      seg(o.from, o.to, o.y1, y1);
      cur = o.to;
    }
    seg(cur, to, y0, y1);
    return this;
  }

  isEmpty() { return this.buckets.size === 0; }

  build({ center = true, shadows = true } = {}) {
    const group = new THREE.Group();
    group.name = this.name;
    const merged = [];
    const box = new THREE.Box3();
    for (const [material, list] of this.buckets) {
      if (material.userData.uvScale) list.forEach(g => worldUV(g, material.userData.uvScale));
      const geo = mergeGeometries(list);
      list.forEach(g => g.dispose());
      box.union(geo.boundingBox);
      merged.push([geo, material]);
    }
    const c = center && !box.isEmpty() ? box.getCenter(new THREE.Vector3()) : new THREE.Vector3();
    for (const [geo, material] of merged) {
      if (c.lengthSq()) { geo.translate(-c.x, -c.y, -c.z); geo.computeBoundingBox(); geo.computeBoundingSphere(); }
      const mesh = new THREE.Mesh(geo, material);
      const transparent = material.transparent;
      mesh.castShadow = shadows && !transparent;
      mesh.receiveShadow = shadows;
      group.add(mesh);
    }
    group.position.copy(c);
    group.userData.size = box.isEmpty() ? new THREE.Vector3() : box.getSize(new THREE.Vector3());
    this.buckets.clear();
    return group;
  }
}

/** Bake a whole hierarchy into one Group with one mesh per material (for cheap clones). */
export function bake(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  root.traverse(o => {
    if (!o.isMesh || !o.visible) return;
    let hidden = false;
    for (let p = o; p && p !== root; p = p.parent) if (!p.visible) hidden = true;
    if (hidden) return;
    const g = o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    if (!buckets.has(o.material)) buckets.set(o.material, []);
    buckets.get(o.material).push(g);
  });
  const group = new THREE.Group();
  for (const [material, list] of buckets) {
    const mesh = new THREE.Mesh(mergeGeometries(list), material);
    list.forEach(g => g.dispose());
    mesh.castShadow = !material.transparent; mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

// ---------- shared scenery ----------

export function sky(top, bottom) {
  const geo = new THREE.SphereGeometry(900, 24, 12);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float h; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.05, 0.45, h)), 1.0); }',
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.renderOrder = -10;
  return mesh;
}

export function ground(material, size = 1400) {
  const geo = new THREE.PlaneGeometry(size, size, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * size / 3, uv.getY(i) * size / 3);
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

/** Low-poly mountain ring. */
export function mountains(r, { count = 26, inner = 240, outer = 380, hMin = 70, hMax = 170, colors }) {
  const part = new Part('mountains');
  const mats = colors.map(c => mat(c, { flatShading: true }));
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + r() * 0.2;
    const d = inner + r() * (outer - inner);
    const h = hMin + r() * (hMax - hMin);
    const geo = new THREE.ConeGeometry(Math.min(h * (1.0 + r() * 0.5), d * 0.45), h, 7, 3);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) {
      if (p.getY(k) < h / 2 - 0.01) {
        p.setX(k, p.getX(k) + (r() - 0.5) * h * 0.25);
        p.setZ(k, p.getZ(k) + (r() - 0.5) * h * 0.25);
        p.setY(k, p.getY(k) + (r() - 0.5) * h * 0.12);
      }
    }
    geo.computeVertexNormals();
    part.add(geo, mats[i % mats.length], [Math.cos(a) * d, h / 2 - 4, Math.sin(a) * d], [0, r() * 6, 0]);
  }
  return part.build({ center: false, shadows: false });
}

export function addCedar(part, x, z, h, r) {
  const trunk = mat('#4b3626'), leaf = mat('#2f4a32', { flatShading: true }), leaf2 = mat('#3a5a3a', { flatShading: true });
  part.cyl(0.18 * h / 10, h * 0.3, x, h * 0.15, z, trunk, null, 5);
  for (let i = 0; i < 3; i++) {
    const cr = (h * 0.22) * (1 - i * 0.25);
    part.add(new THREE.ConeGeometry(cr, h * 0.45, 6), i % 2 ? leaf2 : leaf, [x, h * (0.38 + i * 0.2), z], [0, r() * 3, 0]);
  }
}

export function addRoundTree(part, x, z, h, r, colors = ['#6a8f3f', '#7d9e48'], y = 0) {
  const trunk = mat('#5b4331');
  part.cyl(0.12 * h / 5, h * 0.5, x, y + h * 0.25, z, trunk, null, 5);
  const geo = new THREE.IcosahedronGeometry(h * 0.32, 0);
  part.add(geo, mat(colors[Math.floor(r() * colors.length)], { flatShading: true }), [x, y + h * 0.68, z], [r(), r(), r()]);
}

/** A simple standing person (base at y = 0). */
export function person(r, { shirt = '#2e3f66', pants = '#2a2a33', hat = null, cap = null, skin = '#d9a77c' } = {}) {
  const p = new Part('person');
  const ms = mat(shirt), mp = mat(pants), mk = mat(skin);
  p.box(0.13, 0.8, 0.16, -0.1, 0.4, 0, mp); p.box(0.13, 0.8, 0.16, 0.1, 0.4, 0, mp);
  p.cyl(0.24, 0.62, 0, 1.1, 0, ms, null, 8, 0.2);
  p.box(0.1, 0.55, 0.1, -0.3, 1.1, 0, ms, [0, 0, 0.15]); p.box(0.1, 0.55, 0.1, 0.3, 1.1, 0, ms, [0, 0, -0.15]);
  p.add(new THREE.SphereGeometry(0.14, 10, 8), mk, [0, 1.56, 0]);
  if (hat) p.add(new THREE.ConeGeometry(0.34, 0.16, 12), mat(hat), [0, 1.72, 0]);
  if (cap) { p.cyl(0.15, 0.09, 0, 1.67, 0, mat(cap), null, 10); p.box(0.2, 0.02, 0.14, 0, 1.63, 0.14, mat(cap)); }
  return p.build({ center: false });
}

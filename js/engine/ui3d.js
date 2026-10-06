// In-world UI for VR: text panels, viewpoint markers, info hotspots, reticle.
import * as THREE from 'three';

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

function wrap(g, text, maxW) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (g.measureText(test).width > maxW && line) { lines.push(line); line = word; } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

/** A flat panel whose content is drawn on a canvas. */
export class Panel {
  constructor(w, h, { px = 420, onTop = true } = {}) {
    this.w = w; this.h = h;
    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.round(w * px); this.canvas.height = Math.round(h * px);
    this.g = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, depthTest: !onTop, depthWrite: false, fog: false });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.material);
    if (onTop) this.mesh.renderOrder = 20;
  }

  draw({ title = '', body = '', footer = '', bg = 'rgba(18,22,30,0.88)', accent = '#ffd27a', align = 'left', titleSize = 0.09, bodySize = 0.062, highlight = false, fit = false } = {}) {
    const g = this.g, W = this.canvas.width, H = this.canvas.height, k = W / this.w;
    g.clearRect(0, 0, W, H);
    roundRect(g, 4, 4, W - 8, H - 8, Math.min(40, H / 4));
    g.fillStyle = bg; g.fill();
    g.lineWidth = highlight ? 10 : 4; g.strokeStyle = highlight ? accent : 'rgba(255,255,255,0.25)'; g.stroke();
    const pad = 0.05 * k;
    let y = pad;
    g.textBaseline = 'top'; g.textAlign = align;
    const x = align === 'center' ? W / 2 : pad;
    if (title) {
      g.font = `700 ${titleSize * k}px ${FONT}`; g.fillStyle = accent;
      if (fit) {   // shrink single-line labels until they fit
        while (titleSize > 0.02 && g.measureText(title).width > W - pad * 2) { titleSize *= 0.92; g.font = `700 ${titleSize * k}px ${FONT}`; }
        y = (H - titleSize * k) / 2;
      }
      for (const line of wrap(g, title, W - pad * 2)) { g.fillText(line, x, y); y += titleSize * k * 1.2; }
      y += 0.015 * k;
    }
    if (body) {
      g.font = `500 ${bodySize * k}px ${FONT}`; g.fillStyle = '#f4f1ea';
      for (const line of wrap(g, body, W - pad * 2)) { g.fillText(line, x, y); y += bodySize * k * 1.32; }
    }
    if (footer) {
      g.font = `600 ${0.045 * k}px ${FONT}`; g.fillStyle = 'rgba(255,255,255,0.65)'; g.textAlign = 'center';
      g.fillText(footer, W / 2, H - pad - 0.045 * k);
    }
    this.texture.needsUpdate = true;
  }

  dispose() { this.texture.dispose(); this.material.dispose(); this.mesh.geometry.dispose(); }
}

function labelSprite(text, { size = 0.22, color = '#ffffff', bg = 'rgba(10,14,20,0.72)' } = {}) {
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const fs = 64;
  g.font = `700 ${fs}px ${FONT}`;
  const w = Math.ceil(g.measureText(text).width) + 60;
  c.width = w; c.height = fs + 40;
  g.font = `700 ${fs}px ${FONT}`;
  roundRect(g, 2, 2, w - 4, c.height - 4, 30); g.fillStyle = bg; g.fill();
  g.fillStyle = color; g.textBaseline = 'middle'; g.textAlign = 'center';
  g.fillText(text, w / 2, c.height / 2 + 3);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
  s.scale.set(size * w / c.height, size, 1);
  return s;
}

const colliderMat = new THREE.MeshBasicMaterial({ visible: false });

/** Glowing ring on the ground: look at it (or click) to move there. */
export function makeMarker(label, onSelect) {
  const g = new THREE.Group();
  const color = new THREE.Color('#5fe0ff');
  const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, fog: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.48, 32), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.34, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, depthWrite: false, fog: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.025;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false, fog: false }));
  beam.position.y = 0.8;
  const tag = labelSprite(label, { size: 0.2 });
  tag.position.y = 1.85;
  const tagW = tag.scale.x, tagH = tag.scale.y;
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 2.2, 8), colliderMat);
  hit.position.y = 1.1;
  g.add(ring, disc, beam, tag, hit);
  g.userData = {
    interactive: true, kind: 'marker', onSelect,
    hover(on) { ringMat.color.set(on ? '#ffd27a' : color); g.scale.setScalar(on ? 1.15 : 1); },
    tick(t, dist) {
      ring.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
      const k = Math.min(4, Math.max(1, dist / 9));
      tag.scale.set(tagW * k, tagH * k, 1);
      tag.position.y = 1.85 + (k - 1) * 0.6;
    },
  };
  return g;
}

function iconTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 20, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,210,122,1)'); grd.addColorStop(0.62, 'rgba(255,190,80,0.95)'); grd.addColorStop(1, 'rgba(255,190,80,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  g.beginPath(); g.arc(64, 64, 34, 0, Math.PI * 2); g.fillStyle = '#1b2230'; g.fill();
  g.fillStyle = '#ffd27a'; g.font = `800 52px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('i', 64, 67);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let _icon;

/** Floating "i" orb that opens an info card. */
export function makeHotspot(title, onSelect) {
  _icon = _icon || iconTexture();
  const g = new THREE.Group();
  const orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: _icon, transparent: true, depthWrite: false, fog: false }));
  orb.scale.setScalar(0.45);
  const tag = labelSprite(title, { size: 0.11, color: '#ffd27a' });
  tag.position.y = -0.42;
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 6), colliderMat);
  g.add(orb, tag, hit);
  const phase = Math.random() * 6;
  const tagW = tag.scale.x, tagH = tag.scale.y;
  let hot = false, baseY = 0;
  g.userData = {
    setBase(y) { baseY = y; },
    interactive: true, kind: 'hotspot', onSelect,
    hover(on) { hot = on; },
    tick(t, dist) {
      const k = Math.min(5, Math.max(1, dist / 7)) * (hot ? 1.25 : 1);
      orb.scale.setScalar(0.45 * k);
      tag.scale.set(tagW * k, tagH * k, 1);
      tag.position.y = -0.36 * k;
      hit.scale.setScalar(k);
      g.position.y = baseY + Math.sin(t * 2 + phase) * 0.05;
    },
  };
  return g;
}

/** A gaze-selectable button panel (used by the VR menu). */
export function makeButton(text, w, h, onSelect) {
  const p = new Panel(w, h, { px: 360 });
  const draw = hl => p.draw({ title: text, align: 'center', fit: true, titleSize: Math.min(0.065, h * 0.42), bg: hl ? 'rgba(60,70,90,0.95)' : 'rgba(18,22,30,0.9)', highlight: hl });
  draw(false);
  p.mesh.userData = { interactive: true, kind: 'button', onSelect, hover: draw };
  return p;
}

/** Centre-of-view reticle with a dwell-progress ring. */
export function makeReticle() {
  const g = new THREE.Group();
  const base = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, depthTest: false, depthWrite: false, fog: false });
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.008, 16), base);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.014, 0.019, 32), base.clone());
  ring.material.opacity = 0.5;
  const progGeo = new THREE.RingGeometry(0.02, 0.03, 48, 1, Math.PI / 2, -Math.PI * 2);
  const prog = new THREE.Mesh(progGeo, new THREE.MeshBasicMaterial({ color: '#ffd27a', depthTest: false, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  g.add(dot, ring, prog);
  g.traverse(o => { o.renderOrder = 100; });
  g.position.z = -1;
  const total = progGeo.index.count;
  g.userData.setProgress = f => { progGeo.setDrawRange(0, Math.floor((total / 6) * f) * 6); };
  g.userData.setActive = on => { ring.scale.setScalar(on ? 1.5 : 1); ring.material.opacity = on ? 0.9 : 0.5; };
  g.userData.setProgress(0);
  return g;
}

/** Black sphere around the camera, faded for smooth teleports. */
export function makeFader() {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0, side: THREE.BackSide, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false }));
  m.renderOrder = 200;
  m.visible = false;
  return m;
}

/** Disc on the floor at the viewer's feet: look down to open the menu. */
export function makeFloorButton(onSelect) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.fillStyle = 'rgba(18,22,30,0.8)'; g.fill();
  g.lineWidth = 8; g.strokeStyle = '#ffd27a'; g.stroke();
  g.fillStyle = '#ffd27a'; g.font = `800 56px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('MENU', 128, 132);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.04;
  m.renderOrder = 15;
  m.userData = { interactive: true, kind: 'button', onSelect, hover(on) { m.scale.setScalar(on ? 1.15 : 1); } };
  return m;
}

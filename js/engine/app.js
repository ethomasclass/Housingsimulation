// The 3D experience: renderer, camera rig, look controls (drag, phone motion,
// Cardboard), gaze selection, teleporting, captions and the VR menu.
import * as THREE from 'three';
import { StereoEffect } from '../vendor/StereoEffect.js';
import { OrientationLook } from './orientation.js';
import { Narrator } from './narrator.js';
import { Timeline } from './timeline.js';
import { Panel, makeMarker, makeHotspot, makeButton, makeReticle, makeFader, makeFloorButton } from './ui3d.js';

const EYE = 1.6;
const DWELL = 1.6;           // seconds of looking needed to select in VR
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _e = new THREE.Euler();

const isMobile = matchMedia('(pointer: coarse)').matches;

export class App {
  constructor(container, ui) {
    this.ui = ui;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    r.setSize(window.innerWidth, window.innerHeight);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.xr.enabled = true;
    container.appendChild(r.domElement);
    this.canvas = r.domElement;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 2000);
    this.camera.position.y = EYE;
    this.rig = new THREE.Group();
    this.rig.add(this.camera);
    this.scene.add(this.rig);

    this.hemi = new THREE.HemisphereLight('#dfe9ff', '#5b5040', 1.6);
    this.sun = new THREE.DirectionalLight('#fff3dc', 2.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.setScalar(isMobile ? 1024 : 2048);
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.hemi, this.sun, this.sun.target);

    this.uiRoot = new THREE.Group();
    this.scene.add(this.uiRoot);
    this.reticle = makeReticle();
    this.reticle.visible = false;
    this.camera.add(this.reticle);
    this.fader = makeFader();
    this.camera.add(this.fader);
    this.floorBtn = makeFloorButton(() => this.toggleMenu());
    this.floorBtn.visible = false;
    this.rig.add(this.floorBtn);

    this.captionPanel = new Panel(1.7, 0.42);
    this.captionPanel.mesh.visible = false;
    this.scene.add(this.captionPanel.mesh);
    this.infoPanel = new Panel(1.45, 1.0);
    this.infoPanel.mesh.visible = false;
    this.infoPanel.mesh.userData = { interactive: true, kind: 'panel', onSelect: () => this.closeInfo(), hover: () => {} };
    this.scene.add(this.infoPanel.mesh);
    this.menu = new THREE.Group();
    this.menu.visible = false;
    this.scene.add(this.menu);
    this.menuButtons = [];

    this.narrator = new Narrator();
    this.orientation = new OrientationLook();
    this.stereo = new StereoEffect(r);
    this.raycaster = new THREE.Raycaster();
    this.raycaster.camera = this.camera;
    this.clock = new THREE.Clock();
    this.time = 0;

    this.mode = 'screen';     // 'screen' | 'stereo' | 'xr'
    this.gyro = false;        // phone "look around" in screen mode
    this.yaw = 0; this.pitch = 0;
    this.captionsOn = true;
    this.caption = '';
    this.capYaw = 0;
    this.hovered = null; this.dwell = 0; this.locked = false; this.gazeClock = 0;
    this.keys = new Set();
    this.fading = null;
    this.house = null;

    this.bindInput();
    window.addEventListener('resize', () => this.resize());
    screen.orientation?.addEventListener?.('change', () => this.resize());
    r.xr.addEventListener('sessionend', () => this.onXREnd());
    r.setAnimationLoop((t, frame) => this.loop(t, frame));
  }

  // ---------------------------------------------------------------- houses
  loadHouse(def) {
    this.unloadHouse();
    const world = def.create();
    this.house = world;
    this.houseDef = def;
    this.scene.add(world.root);
    this.scene.fog = new THREE.Fog(world.fog.color, world.fog.near, world.fog.far);
    const L = world.light;
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemi;
    this.sun.color.set(L.sunColor); this.sun.intensity = L.sun;
    const c = new THREE.Vector3(...(L.center || [0, 0, 0]));
    this.sun.target.position.copy(c);
    this.sun.position.copy(c).add(new THREE.Vector3(...L.sunDir).normalize().multiplyScalar(60));
    const s = this.sun.shadow.camera, size = L.shadowSize || 25;
    s.left = s.bottom = -size; s.right = s.top = size; s.near = 1; s.far = 160; s.updateProjectionMatrix();

    // A viewpoint can have several rings (e.g. at the bottom and top of a ladder).
    this.markers = [];
    for (const v of world.viewpoints) {
      for (const mk of v.markers || [{ pos: v.pos }]) {
        const m = makeMarker(mk.label || v.label, () => this.goTo(v.id));
        m.position.set(...mk.pos);
        m.userData.view = v.id;
        this.uiRoot.add(m);
        this.markers.push(m);
      }
    }
    this.hotspots = world.hotspots.map(h => {
      const s = makeHotspot(h.title, () => this.openInfo(h));
      s.position.set(...h.pos);
      s.userData.setBase(h.pos[1]);
      this.uiRoot.add(s);
      return s;
    });
    this.timeline = new Timeline(this, world.stages, {
      onStage: (i, st) => this.ui.onStage?.(i, st, world.stages.length),
      onFinish: () => this.enterExplore(),
    });
    this.phase = 'build';
    this.updateExploreVisibility();
    this.goTo(world.stages[0].view || world.viewpoints[0].id, { instant: true });
    this.timeline.start();
  }

  unloadHouse() {
    if (!this.house) return;
    this.narrator.stop();
    this.closeInfo(); this.closeMenu();
    this.scene.remove(this.house.root);
    const dispose = o => o.traverse(n => {
      if (n.geometry) n.geometry.dispose();
      if (n.isSprite) n.material.map?.dispose();
    });
    dispose(this.house.root);
    [...this.uiRoot.children].forEach(c => { dispose(c); this.uiRoot.remove(c); });
    this.house = null;
    this.timeline = null;
  }

  viewpoint(id) { return this.house.viewpoints.find(v => v.id === id); }

  goTo(id, { instant = false } = {}) {
    const v = this.viewpoint(id);
    if (!v) return;
    const apply = () => {
      this.currentView = id;
      this.rig.position.set(v.pos[0], v.pos[1] + (this.mode === 'xr' ? this.xrEyeOffset : 0), v.pos[2]);
      this.faceYaw(v.yaw, v.pitch || 0);
      this.closeInfo();
      this.updateExploreVisibility();
      this.ui.onView?.(id);
    };
    if (instant) apply(); else this.fade(apply);
  }

  fade(fn) {
    this.fading = { t: 0, fn, fired: false };
    this.fader.visible = true;
  }

  enterExplore() {
    this.phase = 'explore';
    this.updateExploreVisibility();
    const vr = this.mode !== 'screen';
    this.setCaption(vr ? 'Look at a blue ring to move there. Look at a gold "i" to learn more. Look down for the menu.' : '');
    this.ui.onExplore?.(this.house.viewpoints, this.currentView);
  }

  replay() {
    if (!this.house) return;
    this.closeInfo(); this.closeMenu();
    this.phase = 'build';
    this.updateExploreVisibility();
    this.timeline.start();
    this.ui.onReplay?.();
  }

  skipStage() { if (this.phase === 'build') this.timeline.next(); }
  skipToTour() { if (this.phase === 'build') this.timeline.skipAll(); }
  setPaused(p) { this.timeline?.setPaused(p); }
  get paused() { return !!this.timeline?.paused; }

  updateExploreVisibility() {
    const explore = this.phase === 'explore';
    for (const m of this.markers || []) m.visible = explore && m.userData.view !== this.currentView;
    for (const h of this.hotspots || []) h.visible = explore;
  }

  // ---------------------------------------------------------------- captions & info
  setCaption(text) {
    this.caption = text || '';
    this.ui.setCaption?.(this.captionsOn ? this.caption : '');
    if (this.caption) this.captionPanel.draw({ body: this.caption, bodySize: 0.066, bg: 'rgba(12,15,22,0.82)' });
    this.capYaw = this.cameraYaw();
  }

  setCaptions(on) { this.captionsOn = on; this.setCaption(this.caption); }

  setSound(on) {
    this.narrator.setEnabled(on);
    if (on && this.phase === 'build') this.timeline.repeat();
  }

  openInfo(h) {
    if (this.mode === 'screen') this.ui.showInfo?.(h);
    else {
      this.infoPanel.draw({ title: h.title, body: h.text, footer: 'Look here to close', bodySize: 0.058, titleSize: 0.08 });
      this.placeInFront(this.infoPanel.mesh, 1.7, -0.05);
      this.infoPanel.mesh.visible = true;
    }
    this.infoOpen = true;
    this.narrator.say(h.text, h.audio);
    if (this.phase === 'explore') this.setCaption('');
  }

  closeInfo() {
    if (!this.infoOpen) return;
    this.infoOpen = false;
    this.infoPanel.mesh.visible = false;
    this.ui.hideInfo?.();
    if (this.phase === 'explore') this.narrator.stop();
  }

  placeInFront(obj, dist, dy) {
    this.camera.getWorldPosition(_v);
    const yaw = this.cameraYaw();
    obj.position.set(_v.x - Math.sin(yaw) * dist, _v.y + dy, _v.z - Math.cos(yaw) * dist);
    obj.lookAt(_v.x, _v.y + dy, _v.z);
  }

  // ---------------------------------------------------------------- VR menu
  toggleMenu() { if (this.menu.visible) this.closeMenu(); else this.openMenu(); }

  closeMenu() {
    this.menu.visible = false;
    for (const b of this.menuButtons) { b.dispose(); this.menu.remove(b.mesh); }
    this.menuButtons = [];
  }

  openMenu() {
    this.closeMenu();
    this.closeInfo();
    const items = [];
    if (this.phase === 'build') {
      items.push([this.paused ? 'Resume' : 'Pause', () => this.setPaused(!this.paused)]);
      items.push(['Next step', () => this.skipStage()]);
      items.push(['Skip to the tour', () => this.skipToTour()]);
    } else {
      items.push(['Watch it built again', () => this.replay()]);
      for (const v of this.house.viewpoints) items.push(['Go: ' + v.label, () => this.goTo(v.id)]);
    }
    items.push([this.narrator.enabled ? 'Narration: on' : 'Narration: off', () => { this.setSound(!this.narrator.enabled); this.ui.onSoundChange?.(this.narrator.enabled); }]);
    items.push(['Switch house', () => this.ui.switchHouse?.()]);
    items.push(['Exit VR', () => this.exitVR()]);
    items.push(['Close menu', () => {}]);
    const cols = 2, w = 0.72, h = 0.17, gap = 0.04;
    const rows = Math.ceil(items.length / cols);
    items.forEach(([label, fn], i) => {
      const b = makeButton(label, w, h, () => { this.closeMenu(); fn(); });
      const col = i % cols, row = Math.floor(i / cols);
      b.mesh.position.set((col - 0.5) * (w + gap), ((rows - 1) / 2 - row) * (h + gap), 0);
      this.menu.add(b.mesh);
      this.menuButtons.push(b);
    });
    this.placeInFront(this.menu, 1.9, -0.05);
    this.menu.visible = true;
  }

  // ---------------------------------------------------------------- modes
  get lookSource() {
    if (this.mode === 'xr') return 'xr';
    if (this.mode === 'stereo' || this.gyro) return 'gyro';
    return 'drag';
  }

  cameraYaw() {
    this.camera.getWorldDirection(_v2);
    return Math.atan2(-_v2.x, -_v2.z);
  }

  faceYaw(yaw, pitch = 0) {
    this.pendingFace = { yaw, pitch };
    this.applyFace();
  }

  applyFace() {
    const f = this.pendingFace;
    if (!f) return;
    const src = this.lookSource;
    if (src === 'drag') {
      this.rig.rotation.y = 0;
      this.yaw = f.yaw; this.pitch = f.pitch;
      this.pendingFace = null;
      return;
    }
    if (src === 'gyro' && !this.orientation.hasData) return;
    if (src === 'xr' && !this.xrReady) return;
    if (src === 'gyro') this.orientation.apply(this.camera.quaternion);
    this.rig.updateMatrixWorld(true);
    this.rig.rotation.y += f.yaw - this.cameraYaw();
    this.pendingFace = null;
  }

  setGyro(on) {
    const yaw = this.cameraYaw();
    this.gyro = on;
    if (on) this.orientation.start(); else if (this.mode !== 'stereo') this.orientation.stop();
    this.faceYaw(yaw, 0);
  }

  setVRUI(on) {
    this.reticle.visible = on;
    this.floorBtn.visible = on;
    if (!on) { this.closeMenu(); this.reticle.userData.setProgress(0); }
    this.closeInfo();
    this.setCaption(this.caption);
  }

  /** Split-screen Cardboard view driven by the motion sensors (works on iPhone). */
  enterStereo() {
    const yaw = this.cameraYaw();
    this.mode = 'stereo';
    this.orientation.start();
    this.camera.fov = 80;
    this.resize();
    this.setVRUI(true);
    this.faceYaw(yaw, 0);
    const el = document.documentElement;
    const fs = el.requestFullscreen || el.webkitRequestFullscreen;
    if (fs) Promise.resolve(fs.call(el)).then(() => screen.orientation?.lock?.('landscape')).catch(() => {});
    this.ui.onModeChange?.(this.mode);
  }

  /** Real WebXR session (Android Chrome with a Cardboard viewer). */
  async enterXR(sessionPromise) {
    const session = await (sessionPromise || requestXRSession());
    const floor = !session.enabledFeatures || session.enabledFeatures.includes('local-floor');
    this.renderer.xr.setReferenceSpaceType(floor ? 'local-floor' : 'local');
    this.xrEyeOffset = floor ? 0 : EYE;
    this.xrYaw = this.cameraYaw();
    this.mode = 'xr';
    this.xrReady = false;
    this.xrFrames = 0;
    session.addEventListener('select', () => this.gazeSelectNow());
    await this.renderer.xr.setSession(session);
    this.rig.position.y += this.xrEyeOffset;
    this.setVRUI(true);
    this.faceYaw(this.xrYaw, 0);
    this.ui.onModeChange?.(this.mode);
  }

  onXREnd() {
    if (this.mode !== 'xr') return;
    const yaw = this.cameraYaw();
    this.mode = 'screen';
    this.rig.position.y -= this.xrEyeOffset || 0;
    this.camera.position.set(0, EYE, 0);
    this.setVRUI(false);
    this.resize();
    this.faceYaw(yaw, 0);
    this.ui.onModeChange?.(this.mode);
  }

  exitVR() {
    if (this.mode === 'xr') { this.renderer.xr.getSession()?.end(); return; }
    if (this.mode !== 'stereo') return;
    const yaw = this.cameraYaw();
    this.mode = 'screen';
    if (!this.gyro) this.orientation.stop();
    this.setVRUI(false);
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document).catch?.(() => {});
    this.resize();
    this.faceYaw(yaw, 0);
    this.ui.onModeChange?.(this.mode);
  }

  resize() {
    if (this.mode === 'xr') return;
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    if (this.mode === 'screen') {
      // keep a reasonable side-to-side view on tall phone screens
      const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(35)) * this.camera.aspect);
      const minH = THREE.MathUtils.degToRad(64);
      this.camera.fov = hfov < minH ? Math.min(95, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(minH / 2) / this.camera.aspect))) : 70;
    }
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // ---------------------------------------------------------------- input
  bindInput() {
    const c = this.canvas;
    c.style.touchAction = 'none';
    let drag = null, lastHover = 0;
    c.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() };
      c.setPointerCapture?.(e.pointerId);
    });
    c.addEventListener('pointermove', e => {
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        drag.x = e.clientX; drag.y = e.clientY;
        const k = (e.pointerType === 'touch' ? 0.0065 : 0.0045) * (70 / this.camera.fov);
        if (this.lookSource === 'drag') {
          this.yaw += dx * k;
          this.pitch = THREE.MathUtils.clamp(this.pitch + dy * k, -1.35, 1.35);
        } else if (this.lookSource === 'gyro' && this.mode === 'screen') {
          this.rig.rotation.y += dx * k;
        }
      } else if (e.pointerType === 'mouse' && this.mode === 'screen' && performance.now() - lastHover > 60) {
        lastHover = performance.now();
        this.setHover(this.pickAt(e.clientX, e.clientY));
        c.style.cursor = this.hovered ? 'pointer' : 'grab';
      }
    });
    const end = e => {
      if (!drag) return;
      const moved = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);
      const quick = performance.now() - drag.t < 600;
      drag = null;
      if (moved < 10 && quick && e.type === 'pointerup') {
        if (this.mode === 'stereo') this.gazeSelectNow();
        else if (this.mode === 'screen') {
          const t = this.pickAt(e.clientX, e.clientY);
          if (t) this.select(t);
          else if (this.infoOpen) this.closeInfo();
        }
      }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('pointerleave', () => { if (this.mode === 'screen') this.setHover(null); });
    window.addEventListener('keydown', e => {
      if (e.target.closest?.('input,textarea,select')) return;
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
  }

  interactiveRoots() {
    const list = [...this.uiRoot.children];
    if (this.floorBtn.visible) list.push(this.floorBtn);
    if (this.infoPanel.mesh.visible) list.push(this.infoPanel.mesh);
    if (this.menu.visible) list.push(...this.menu.children);
    return list;
  }

  pick() {
    if (!this.house) return null;
    const hits = this.raycaster.intersectObjects([...this.interactiveRoots(), ...this.house.occluders], true);
    for (const h of hits) {
      let visible = true, interactive = null;
      for (let o = h.object; o; o = o.parent) {
        if (!o.visible) { visible = false; break; }
        if (!interactive && o.userData.interactive) interactive = o;
      }
      if (!visible) continue;
      return interactive;
    }
    return null;
  }

  pickAt(x, y) {
    const ndc = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    this.raycaster.far = 200;
    return this.pick();
  }

  pickCenter() {
    this.camera.getWorldPosition(_v);
    this.camera.getWorldDirection(_v2);
    this.raycaster.set(_v, _v2);
    this.raycaster.far = 200;
    return this.pick();
  }

  setHover(t) {
    if (t === this.hovered) return;
    this.hovered?.userData.hover?.(false);
    t?.userData.hover?.(true);
    this.hovered = t;
    this.dwell = 0;
    this.locked = false;
  }

  select(t) {
    t.userData.onSelect?.();
  }

  gazeSelectNow() {
    const t = this.pickCenter();
    if (t) { this.locked = true; this.select(t); }
  }

  updateGaze(dt) {
    this.gazeClock += dt;
    if (this.gazeClock > 0.06) {
      this.gazeClock = 0;
      this.setHover(this.pickCenter());
    }
    const t = this.hovered;
    if (t && !this.locked && !this.fading) {
      this.dwell += dt;
      if (this.dwell >= DWELL) { this.locked = true; this.select(t); }
    }
    this.reticle.userData.setProgress(t && !this.locked ? Math.min(1, this.dwell / DWELL) : 0);
    this.reticle.userData.setActive(!!t);
  }

  // ---------------------------------------------------------------- loop
  loop() {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.time += dt;
    const src = this.lookSource;

    if (src === 'drag') {
      const turn = (this.keys.has('arrowleft') || this.keys.has('a') ? 1 : 0) - (this.keys.has('arrowright') || this.keys.has('d') ? 1 : 0);
      const tilt = (this.keys.has('arrowup') || this.keys.has('w') ? 1 : 0) - (this.keys.has('arrowdown') || this.keys.has('s') ? 1 : 0);
      this.yaw += turn * dt * 1.4;
      this.pitch = THREE.MathUtils.clamp(this.pitch + tilt * dt * 1.0, -1.35, 1.35);
      this.camera.quaternion.setFromEuler(_e.set(this.pitch, this.yaw, 0, 'YXZ'));
    } else if (src === 'gyro' && this.orientation.hasData) {
      this.orientation.apply(this.camera.quaternion);
    } else if (src === 'xr' && !this.xrReady && ++this.xrFrames > 2) {
      this.xrReady = true;
    }
    if (this.pendingFace) this.applyFace();

    if (this.timeline) this.timeline.update(dt);
    if (this.house?.update) this.house.update(dt, this.time);
    this.camera.getWorldPosition(_v);
    for (const o of this.uiRoot.children) if (o.visible) o.userData.tick?.(this.time, o.position.distanceTo(_v));

    if (this.fading) {
      const f = this.fading;
      f.t += dt;
      if (!f.fired && f.t >= 0.28) { f.fired = true; f.fn(); }
      this.fader.material.opacity = f.t < 0.28 ? f.t / 0.28 : Math.max(0, 1 - (f.t - 0.36) / 0.3);
      if (f.t > 0.7) { this.fading = null; this.fader.visible = false; }
    }

    const vr = this.mode !== 'screen';
    // Caption panel follows the viewer's gaze lazily, below eye level.
    const cap = this.captionPanel.mesh;
    cap.visible = vr && this.captionsOn && !!this.caption && !this.menu.visible && !this.infoPanel.mesh.visible;
    if (cap.visible) {
      const yaw = this.cameraYaw();
      let d = Math.atan2(Math.sin(yaw - this.capYaw), Math.cos(yaw - this.capYaw));
      if (Math.abs(d) > 0.45) this.capYaw += d * Math.min(1, dt * 3);
      this.camera.getWorldPosition(_v);
      cap.position.set(_v.x - Math.sin(this.capYaw) * 2.1, _v.y - 0.62, _v.z - Math.cos(this.capYaw) * 2.1);
      cap.lookAt(_v.x, _v.y - 0.3, _v.z);
    }
    if (vr) this.updateGaze(dt);

    if (this.mode === 'stereo') this.stereo.render(this.scene, this.camera);
    else this.renderer.render(this.scene, this.camera);
  }
}

/** Must be called directly from a tap/click handler. */
export function requestXRSession() {
  return navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] });
}

export function vrSupport() {
  if (!navigator.xr?.isSessionSupported) return Promise.resolve(false);
  return navigator.xr.isSessionSupported('immersive-vr').catch(() => false);
}

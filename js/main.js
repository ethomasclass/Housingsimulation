// Page wiring: home screen, HUD buttons, and starting screen or VR mode.
import { App, vrSupport, requestXRSession } from './engine/app.js';
import { OrientationLook } from './engine/orientation.js';
import gassho from './houses/gassho.js';
import levittown from './houses/levittown.js';

const HOUSES = { gassho, levittown };
const $ = s => document.querySelector(s);
const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

const state = { mode: 'screen', current: null, xr: false };
let app;

// ------------------------------------------------------------------ UI hooks used by the App
let hintTimer;
function hint(text, ms = 5000) {
  const el = $('#hint');
  el.textContent = text;
  el.classList.remove('fade');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => el.classList.add('fade'), ms);
}

const ui = {
  setCaption(text) { $('#caption').textContent = text; },
  onStage(i, stage, total) {
    $('#progress').hidden = false;
    $('#progress-fill').style.width = `${((i + 1) / total) * 100}%`;
    $('#progress-label').textContent = `Step ${i + 1} of ${total} · ${stage.title}`;
    $('#controls-build').hidden = false;
    $('#controls-explore').hidden = true;
    $('#btn-pause').textContent = 'Pause';
  },
  onExplore(viewpoints, current) {
    $('#progress').hidden = true;
    $('#controls-build').hidden = true;
    $('#controls-explore').hidden = false;
    const chips = $('#chips');
    chips.innerHTML = '';
    for (const v of viewpoints) {
      const b = document.createElement('button');
      b.className = 'chip';
      b.textContent = v.label;
      b.dataset.view = v.id;
      b.setAttribute('aria-current', String(v.id === current));
      b.onclick = () => app.goTo(v.id);
      chips.appendChild(b);
    }
    hint(touch ? 'Walk with the joystick · Tap blue rings to jump · Tap gold "i" to learn' : 'Walk with arrows/WASD · Click blue rings to jump · Click gold "i" to learn', 7000);
  },
  onView(id) {
    for (const c of document.querySelectorAll('.chip')) c.setAttribute('aria-current', String(c.dataset.view === id));
  },
  onReplay() { hint('Watching the build again'); },
  showInfo(h) {
    $('#info-title').textContent = h.title;
    $('#info-body').textContent = h.text;
    $('#info').hidden = false;
    $('#hint').classList.add('fade');
  },
  hideInfo() { $('#info').hidden = true; },
  onModeChange(mode) {
    const vr = mode !== 'screen';
    $('#hud').hidden = vr || !state.current;
    $('#vr-exit').hidden = mode !== 'stereo';
    document.body.classList.toggle('stereo', mode === 'stereo');
    $('#rotate').hidden = mode !== 'stereo';
  },
  onSoundChange(on) { $('#btn-sound').setAttribute('aria-pressed', String(on)); $('#opt-sound').checked = on; },
  switchHouse() { load(state.current === 'gassho' ? 'levittown' : 'gassho'); },
};

// ------------------------------------------------------------------ start / stop
function nextFrame() { return new Promise(r => requestAnimationFrame(() => setTimeout(r, 30))); }

async function load(id) {
  const def = HOUSES[id];
  $('#loading').hidden = false;
  await nextFrame();
  try {
    app.loadHouse(def);
  } catch (err) {
    console.error(err);
    showFatal('Sorry, something went wrong building this scene. Try reloading the page.');
    return;
  }
  state.current = id;
  $('#hud-title').textContent = def.title;
  const tag = $('#hud-tag');
  tag.textContent = def.type;
  tag.className = 'tag ' + (id === 'gassho' ? 'tag-folk' : 'tag-pop');
  $('#home').hidden = true;
  $('#hud').hidden = app.mode !== 'screen';
  $('#info').hidden = true;
  $('#loading').hidden = true;
  if (app.mode === 'screen') hint(touch ? 'Joystick to walk · drag to look around' : 'Arrow keys or WASD to walk · drag to look around');
}

/** Everything here runs inside the tap, so iOS/Android allow speech, sensors and VR. */
function beginVR() {
  const simple = $('#opt-simple-vr').checked;
  if (state.xr && !simple) {
    const session = requestXRSession();
    return () => app.enterXR(session).catch(err => {
      console.warn('WebXR failed, using split-screen instead', err);
      return startStereo(OrientationLook.request());
    });
  }
  const perm = OrientationLook.request();
  return () => startStereo(perm);
}

async function startStereo(permission) {
  const ok = await permission;
  if (!ok) {
    alert('Motion sensors are turned off, so VR can\'t follow your head. On iPhone, reload and tap "Allow" when asked about motion. Showing the regular view for now.');
    return;
  }
  app.enterStereo();
}

async function start(id) {
  app.narrator.unlock();
  const enterVR = state.mode === 'vr' ? beginVR() : null;
  await load(id);
  if (enterVR) await enterVR();
}

function goHome() {
  app.exitVR();
  app.unloadHouse();
  state.current = null;
  $('#hud').hidden = true;
  $('#home').hidden = false;
}

function showFatal(msg) {
  const el = $('#fatal');
  el.textContent = msg;
  el.hidden = false;
  $('#loading').hidden = true;
}

// ------------------------------------------------------------------ boot
function boot() {
  try {
    app = new App($("#stage"), ui);
    window.housingApp = app;   // handy for debugging in the console
  } catch (err) {
    console.error(err);
    showFatal('This device or browser could not start 3D graphics (WebGL). Try Chrome, Edge, or Safari, and make sure hardware acceleration is turned on.');
    return;
  }

  vrSupport().then(ok => { state.xr = ok; updateVRNote(); });

  // home screen
  for (const b of document.querySelectorAll('.start')) b.addEventListener('click', () => start(b.dataset.house));
  for (const b of document.querySelectorAll('.segmented button')) {
    b.addEventListener('click', () => {
      state.mode = b.dataset.mode;
      for (const o of document.querySelectorAll('.segmented button')) o.setAttribute('aria-checked', String(o === b));
      updateVRNote();
    });
  }
  $('#opt-sound').addEventListener('change', e => { app.setSound(e.target.checked); $('#btn-sound').setAttribute('aria-pressed', String(e.target.checked)); });
  $('#opt-captions').addEventListener('change', e => { app.setCaptions(e.target.checked); $('#btn-cc').setAttribute('aria-pressed', String(e.target.checked)); });

  // HUD
  $('#btn-home').addEventListener('click', goHome);
  $('#btn-cc').addEventListener('click', () => {
    const on = !app.captionsOn;
    app.setCaptions(on);
    $('#btn-cc').setAttribute('aria-pressed', String(on));
    $('#opt-captions').checked = on;
  });
  $('#btn-sound').addEventListener('click', () => {
    app.narrator.unlock();
    const on = !app.narrator.enabled;
    app.setSound(on);
    ui.onSoundChange(on);
  });
  // Embedded copies (e.g. a sandboxed preview frame) can't use motion sensors or VR.
  const noVR = !!window.HOUSING_NO_VR;
  if (noVR) {
    $('.options .option').hidden = true;
    $('#vr-help').hidden = true;
  }
  if (touch) setupStick();
  if (touch && !noVR) {
    $('#btn-motion').hidden = false;
    $('#btn-vr').hidden = false;
  }
  $('#btn-motion').addEventListener('click', async () => {
    const turnOn = !app.gyro;
    if (turnOn && !(await OrientationLook.request())) { alert('Motion sensors are not available, so drag to look around instead.'); return; }
    app.setGyro(turnOn);
    $('#btn-motion').setAttribute('aria-pressed', String(turnOn));
    hint(turnOn ? 'Move your phone to look around' : 'Drag to look around');
  });
  $('#btn-vr').addEventListener('click', () => {
    app.narrator.unlock();
    const enter = beginVR();
    enter();
  });
  $('#vr-exit').addEventListener('click', () => app.exitVR());
  $('#btn-pause').addEventListener('click', () => {
    app.setPaused(!app.paused);
    $('#btn-pause').textContent = app.paused ? 'Resume' : 'Pause';
  });
  $('#btn-next').addEventListener('click', () => app.skipStage());
  $('#btn-skip').addEventListener('click', () => app.skipToTour());
  $('#btn-replay').addEventListener('click', () => app.replay());
  $('#btn-switch').addEventListener('click', () => ui.switchHouse());
  $('#info-close').addEventListener('click', () => app.closeInfo());

  window.addEventListener('keydown', e => {
    if (!state.current || app.mode !== 'screen') return;
    if (e.key === 'Escape') app.closeInfo();
    if (e.key === ' ' && app.phase === 'build') { e.preventDefault(); $('#btn-pause').click(); }
    if (e.key.toLowerCase() === 'n' && app.phase === 'build') app.skipStage();
  });

  // direct links: index.html#gassho or #levittown
  const fromHash = location.hash.slice(1);
  if (HOUSES[fromHash]) load(fromHash);
}

/** On-screen joystick for walking on touch screens. */
function setupStick() {
  const el = $('#stick'), knob = el.querySelector('.knob');
  el.hidden = false;
  let id = null;
  const move = e => {
    const r = el.getBoundingClientRect(), R = r.width / 2;
    let x = e.clientX - (r.left + R), y = e.clientY - (r.top + R);
    const d = Math.hypot(x, y), max = R - 12;
    if (d > max) { x *= max / d; y *= max / d; }
    knob.style.transform = `translate(${x}px, ${y}px)`;
    app.stick.x = x / max; app.stick.y = y / max;
  };
  const stop = () => {
    id = null;
    el.classList.remove('active');
    knob.style.transform = '';
    app.stick.x = app.stick.y = 0;
  };
  el.addEventListener('pointerdown', e => { id = e.pointerId; el.setPointerCapture(id); el.classList.add('active'); move(e); e.preventDefault(); });
  el.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);
}

function updateVRNote() {
  const note = $('#vr-note');
  const simpleWrap = $('#simple-vr-wrap');
  if (state.mode !== 'vr') { note.hidden = true; simpleWrap.hidden = true; return; }
  note.hidden = false;
  if (!touch) note.textContent = 'Cardboard VR needs a phone. Open this page on a phone, tap Start, then slide the phone into the viewer sideways.';
  else if (state.xr) note.textContent = 'Tap Start, then follow your phone\'s prompts and slide it into the viewer. Look at things for two seconds to select them. Look down at your feet for the menu.';
  else note.textContent = 'Tap Start and allow motion access if asked. Turn the phone sideways and slide it into the viewer. Look at things for two seconds to select them. Look down for the menu.';
  simpleWrap.hidden = !(touch && state.xr);
}

boot();

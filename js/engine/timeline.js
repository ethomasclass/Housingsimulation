// Plays a house's build sequence: one narrated stage at a time, with parts
// dropping, rising or popping into place.
import { Narrator } from './narrator.js';

/** Helper: animate a list of objects one after another. */
export function seq(objects, type, { start = 0, stagger = 0.12, dur = 0.8, ...opts } = {}) {
  return objects.map((obj, i) => ({ obj, type, delay: start + i * stagger, dur, ...opts }));
}

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeOutBack = t => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeInCubic = t => t * t * t;

function remember(obj) {
  if (!obj.userData.final) obj.userData.final = { pos: obj.position.clone(), scale: obj.scale.clone() };
  return obj.userData.final;
}

function applyAnim(a, f) {
  const o = a.obj, fin = remember(o);
  o.position.copy(fin.pos); o.scale.copy(fin.scale);
  switch (a.type) {
    case 'drop': o.position.y += (a.h ?? 5) * (1 - easeOutCubic(f)); break;
    case 'rise': {
      const h = a.h ?? ((o.userData.size?.y ?? 1) + 0.1);
      o.position.y -= h * (1 - easeOutCubic(f)); break;
    }
    case 'pop': o.scale.multiplyScalar(Math.max(0.001, easeOutBack(f))); break;
    case 'grow': o.scale.y = fin.scale.y * Math.max(0.001, easeOutCubic(f)); break;
    case 'slide': {
      const k = 1 - easeOutCubic(f), v = a.from || [0, 0, 0];
      o.position.x += v[0] * k; o.position.y += v[1] * k; o.position.z += v[2] * k; break;
    }
    case 'sink': o.position.y -= (a.h ?? ((o.userData.size?.y ?? 1) + 0.1)) * easeInCubic(f); break;
  }
}

export class Timeline {
  constructor(app, stages, { onStage, onFinish } = {}) {
    this.app = app;
    this.stages = stages;
    this.onStage = onStage;
    this.onFinish = onFinish;
    this.index = -1;
    this.paused = false;
    this.finished = false;
    for (const s of stages) for (const a of s.anims || []) remember(a.obj);
  }

  /** Put every stage back to "not built yet". */
  reset() {
    for (const s of this.stages) for (const o of s.hide || []) o.visible = true;
    for (const s of this.stages) for (const a of s.anims || []) {
      const fin = remember(a.obj);
      a.obj.position.copy(fin.pos); a.obj.scale.copy(fin.scale);
      a.obj.visible = a.type === 'sink';
      a.done = false;
    }
    this.index = -1;
    this.finished = false;
  }

  start() {
    this.reset();
    this.paused = false;
    this.enter(0);
  }

  completeStage(s) {
    for (const o of s.hide || []) o.visible = false;
    for (const a of s.anims || []) {
      applyAnim(a, 1);
      a.obj.visible = a.type !== 'sink';
    }
    s.onComplete?.();
  }

  enter(i) {
    if (i >= this.stages.length) { this.finish(); return; }
    this.index = i;
    const s = this.stages[i];
    this.t = 0;
    this.doneAt = null;
    for (const o of s.hide || []) o.visible = false;
    this.animEnd = Math.max(0, ...(s.anims || []).map(a => a.delay + a.dur)) + 0.6;
    this.textTime = Math.max(s.minTime || 0, Narrator.estimate(s.text));
    if (s.view && s.view !== this.app.currentView) this.app.goTo(s.view, { fromTimeline: true });
    this.app.setCaption(s.text);
    this.narrStart = 0;
    this.app.narrator.say(s.text, s.audio);
    s.onEnter?.();
    this.onStage?.(i, s);
  }

  update(dt) {
    if (this.finished || this.index < 0 || this.paused) return;
    const s = this.stages[this.index];
    this.t += dt;
    for (const a of s.anims || []) {
      const f = (this.t - a.delay) / a.dur;
      if (f < 0) continue;
      if (a.type !== 'sink') a.obj.visible = true;
      if (a.done) continue;
      applyAnim(a, Math.min(1, f));
      if (f >= 1) { a.done = true; if (a.type === 'sink') a.obj.visible = false; }
    }
    s.onUpdate?.(dt, this.t);
    const n = this.app.narrator;
    const since = this.t - this.narrStart;
    let narrDone;
    if (n.enabled) {
      if (n.done && this.doneAt === null) this.doneAt = this.t;
      narrDone = (this.doneAt !== null && this.t - this.doneAt > 0.8) || since > this.textTime * 1.7 + 2;
      if (since < Math.min(this.textTime, 2.5)) narrDone = false;   // speech never reported "started"
    } else {
      narrDone = since >= this.textTime;
    }
    if (this.t >= this.animEnd && narrDone && this.t >= (s.minTime || 0)) this.next();
  }

  next() {
    const s = this.stages[this.index];
    if (s) { for (const a of s.anims || []) a.done = false; this.completeStage(s); }
    this.enter(this.index + 1);
  }

  skipAll() {
    if (this.finished) return;
    for (let i = Math.max(0, this.index); i < this.stages.length; i++) {
      for (const a of this.stages[i].anims || []) a.done = false;
      this.completeStage(this.stages[i]);
    }
    this.finish();
  }

  finish() {
    this.finished = true;
    this.index = this.stages.length;
    this.onFinish?.();
  }

  setPaused(p) {
    if (this.finished) return;
    this.paused = p;
    const s = this.stages[this.index];
    if (p) this.app.narrator.stop();
    else if (s) { this.narrStart = this.t; this.doneAt = null; this.app.narrator.say(s.text, s.audio); }
  }

  /** Replay the narration for the current stage (e.g. after turning sound on). */
  repeat() {
    const s = this.stages[this.index];
    if (!s || this.finished) return;
    this.narrStart = this.t; this.doneAt = null;
    this.app.narrator.say(s.text, s.audio);
  }
}

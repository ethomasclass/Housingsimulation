// Turns phone motion sensors into a camera rotation (for Cardboard on iPhone
// and "look around" mode). Math adapted from three.js DeviceOrientationControls (MIT).
import * as THREE from 'three';

const zee = new THREE.Vector3(0, 0, 1);
const euler = new THREE.Euler();
const q0 = new THREE.Quaternion();
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // camera looks out the back of the device

export class OrientationLook {
  constructor() {
    this.data = null;
    this.active = false;
    this.onEvent = e => { if (e.alpha !== null || e.beta !== null) this.data = e; };
  }

  /** Call directly inside a tap handler: iOS needs permission from a user gesture. */
  static request() {
    if (typeof DeviceOrientationEvent === 'undefined') return Promise.resolve(false);
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      return DeviceOrientationEvent.requestPermission().then(r => r === 'granted').catch(() => false);
    }
    return Promise.resolve(true);
  }

  start() {
    if (this.active) return;
    window.addEventListener('deviceorientation', this.onEvent);
    this.active = true;
  }

  stop() {
    window.removeEventListener('deviceorientation', this.onEvent);
    this.active = false;
    this.data = null;
  }

  get hasData() { return !!this.data; }

  apply(quaternion) {
    const d = this.data;
    const alpha = THREE.MathUtils.degToRad(d.alpha || 0);
    const beta = THREE.MathUtils.degToRad(d.beta || 0);
    const gamma = THREE.MathUtils.degToRad(d.gamma || 0);
    const angle = (screen.orientation && screen.orientation.angle) ?? window.orientation ?? 0;
    const orient = THREE.MathUtils.degToRad(angle);
    euler.set(beta, alpha, -gamma, 'YXZ');
    quaternion.setFromEuler(euler);
    quaternion.multiply(q1);
    quaternion.multiply(q0.setFromAxisAngle(zee, -orient));
  }
}

// FOLK HOUSING: a gassho-zukuri farmhouse in Shirakawa-go, Japan.
// All narration and info text lives in the `text` objects near the bottom,
// so it can be edited without touching the 3D code.
import * as THREE from 'three';
import { Part, mat, tex, rng, sky, ground, mountains, addCedar, addRoundTree, person, bake } from '../engine/kit.js';
import { seq } from '../engine/timeline.js';

const W2 = 5, L2 = 8;                     // half width (x) and half length (z) of the frame
const WALL = 2.8;                         // top of ground-floor walls
const TAN60 = Math.tan(Math.PI / 3);
const RIDGE = WALL + W2 * TAN60;          // where the rafters meet (~11.5 m)
const COT = 1 / TAN60;
const FL = 0.5;                           // raised wooden floor
const F2 = 2.95, F3 = 5.3, F4 = 7.6;      // attic floor levels
const TH_IN = 0.25, TH_T = 0.9;           // thatch offset above rafters, thatch thickness
const OVER_Z = 1.2;                       // thatch overhang past the gables

const yawTo = (from, to) => Math.atan2(-(to[0] - from[0]), -(to[2] - from[2]));

// Thatch surface lines (east side; west is mirrored).
const inX = y => (W2 + TH_IN * 0.866) - (y - (WALL + TH_IN * 0.5)) * COT;
const outX = y => (W2 + (TH_IN + TH_T) * 0.866) - (y - (WALL + (TH_IN + TH_T) * 0.5)) * COT;
const APEX_IN = (WALL + TH_IN * 0.5) + (W2 + TH_IN * 0.866) * TAN60;
const APEX_OUT = (WALL + (TH_IN + TH_T) * 0.5) + (W2 + (TH_IN + TH_T) * 0.866) * TAN60;

export default {
  id: 'gassho',
  type: 'Folk housing',
  title: 'Gassho-zukuri farmhouse',
  place: 'Shirakawa-go, Japan',

  create() {
    const r = rng(7);
    const root = new THREE.Group();
    const house = new THREE.Group();
    root.add(house);

    const M = {
      wood: mat('#ffffff', { map: tex.darkWood(), uv: 1.2 }),
      beam: mat('#6a4c36', { map: tex.darkWood(), uv: 2.5 }),
      log: mat('#6e5641'),
      rope: mat('#b59a63'),
      bamboo: mat('#a99a5e'),
      thatch: mat('#ffffff', { map: tex.thatch(), uv: 2.4 }),
      ridge: mat('#5e5040'),
      stone: mat('#ffffff', { map: tex.stone(), uv: 0.8, flatShading: true }),
      shoji: mat('#ffffff', { map: tex.shoji(), uv: 1.0, emissive: '#4a4536' }),
      gable: mat('#ffffff', { map: tex.oldWood(), uv: 1.6 }),
      board: mat('#ffffff', { map: tex.floorBoards(), uv: 1.6 }),
      slat: mat('#5d4532'),
      tatami: mat('#ffffff', { map: tex.tatami(), uv: 1.8 }),
      earth: mat('#ffffff', { map: tex.earth(), uv: 2 }),
      fusuma: mat('#ffffff', { map: tex.fusuma(), uv: 0.95 }),
      ash: mat('#8c8780'),
      ember: mat('#ff7a2a', { emissive: '#ff4a00' }),
      iron: mat('#2a2826'),
      lacquer: mat('#1c1515'),
      gold: mat('#d2aa4e', { emissive: '#5a3f10' }),
      silk: mat('#ffffff', { map: tex.silkworm(), uv: 0.8 }),
      indigo: mat('#2f3d63'), red: mat('#8a2f2a'),
    };

    // ------------------------------------------------------------ environment
    const env = new THREE.Group();
    root.add(env);
    env.add(sky('#7fa9d6', '#e3ebf0'));
    env.add(ground(mat('#ffffff', { map: tex.autumnGrass() })));

    const villagePos = [[-30, -24], [30, -26], [-38, 18], [6, -46], [-8, 40], [50, -4], [-58, -10], [26, 36], [-46, -46]];
    const HILL = [48, 62], HILL_R = 26, HILL_H = 20;
    const look = [16, 0, 21];
    {
      const p = new Part('paddies');
      const rice = mat('#ffffff', { map: tex.rice(), uv: 4 });
      const stubble = mat('#a08a52');
      const near = (x, z) => {
        if (Math.hypot(x, z) < 16) return true;
        if (villagePos.some(([vx, vz]) => Math.hypot(x - vx, z - vz) < 13)) return true;
        if (Math.hypot(x - HILL[0], z - HILL[1]) < HILL_R + 4) return true;
        if (x < -64) return true;
        // the path from the viewing spot to the door
        const t = THREE.MathUtils.clamp(((x - 6) * 10 + (z - 4) * 17) / (10 * 10 + 17 * 17), 0, 1);
        return Math.hypot(x - (6 + 10 * t), z - (4 + 17 * t)) < 5;
      };
      for (let x = -72; x < 76; x += 9.8) for (let z = -76; z < 80; z += 7.8) {
        const cx = x + 4.5, cz = z + 3.5;
        if (near(cx, cz)) continue;
        p.block(x, 0, z, x + 9, 0.12, z + 7, r() < 0.25 ? stubble : rice);
      }
      env.add(p.build({ center: false, shadows: false }));
    }
    {
      // house yards, path, river
      const p = new Part('yards');
      p.block(-7.5, 0, -10.5, 7.5, 0.03, 10.5, M.earth);
      for (const [x, z] of villagePos) p.block(x - 7, 0, z - 10, x + 7, 0.03, z + 10, M.earth);
      const path = [[6, 4], [16, 21], [22, 30], [HILL[0] - 18, HILL[1] - 14]];
      for (let i = 0; i < path.length - 1; i++) {
        const [ax, az] = path[i], [bx, bz] = path[i + 1];
        const len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bx - ax, bz - az);
        p.box(2.2, 0.04, len + 2, (ax + bx) / 2, 0.02, (az + bz) / 2, M.earth, [0, ang, 0]);
      }
      p.block(-82, -0.2, -500, -66, 0.02, 500, mat('#5d8aa0'));
      p.block(-86, 0, -500, -82, 0.05, 500, mat('#ffffff', { map: tex.gravel(), uv: 3 }));
      p.block(-66, 0, -500, -62, 0.05, 500, mat('#ffffff', { map: tex.gravel(), uv: 3 }));
      env.add(p.build({ center: false, shadows: false }));
    }
    {
      // lookout hill
      const geo = new THREE.CylinderGeometry(4, HILL_R, HILL_H, 12, 3);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y > -HILL_H / 2 + 0.1 && y < HILL_H / 2 - 0.1) { pos.setX(i, pos.getX(i) * (0.9 + r() * 0.2)); pos.setZ(i, pos.getZ(i) * (0.9 + r() * 0.2)); }
      }
      geo.computeVertexNormals();
      const p = new Part('hill');
      p.add(geo, mat('#6f7f45', { flatShading: true }), [HILL[0], HILL_H / 2, HILL[1]]);
      env.add(p.build({ center: false }));
    }
    {
      const p = new Part('trees');
      for (let i = 0; i < 260; i++) {
        const a = r() * Math.PI * 2, d = 85 + r() * 110;
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (x < -60 && x > -90) continue;
        addCedar(p, x, z, 10 + r() * 12, r);
      }
      for (let i = 0; i < 40; i++) addCedar(p, -20 + r() * 40, -18 - r() * 12, 9 + r() * 6, r);
      for (let i = 0; i < 26; i++) {
        const a = Math.atan2(HILL[1], HILL[0]) - 1.5 + r() * 3.0, d = HILL_R * (0.45 + r() * 0.45);   // back side of the hill, out of the view
        const y = HILL_H * (HILL_R - d) / (HILL_R - 4) - 0.8;
        addRoundTree(p, HILL[0] + Math.cos(a) * d, HILL[1] + Math.sin(a) * d, 5 + r() * 3, r, ['#b8642c', '#d0953a', '#8c8f3a', '#a5472b'], y);
      }
      for (const [x, z] of [[11, -6], [-10, 9], [-12, -4], [36, -14], [-24, 30]]) addRoundTree(p, x, z, 6 + r() * 2, r, ['#c46a2c', '#d89a35', '#8a9a3a']);
      env.add(p.build({ center: false, shadows: false }));
    }
    env.add(mountains(r, { colors: ['#3b5a3a', '#4a6a40', '#6b6a3a', '#8a5a2e', '#365238', '#56603a'] }));

    // ------------------------------------------------------------ house parts
    const add = part => { const g = part.build(); house.add(g); return g; };
    const rowsZ = [];
    for (let z = -L2; z <= L2 + 0.01; z += 2) rowsZ.push(z);
    const pillarXs = z => {
      const xs = [-W2, W2];
      if (Math.abs(z) === L2) xs.push(-2.5, 0, 2.5);
      if (z === 0) xs.push(-2, 2);
      return xs;
    };

    // 1. site + foundation stones
    const pad = new Part('pad');
    pad.block(-6.5, 0, -9.5, 6.5, 0.06, 9.5, mat('#7d6a52'));
    house.add(pad.build());
    const stones = rowsZ.map(z => {
      const p = new Part('stones');
      for (const x of pillarXs(z)) p.add(new THREE.IcosahedronGeometry(0.34, 0), M.stone, [x, 0.1, z], [r(), r(), r()], [1, 0.5, 1]);
      return add(p);
    });

    // 2. posts and beams
    const pillars = rowsZ.map(z => {
      const p = new Part('pillars');
      for (const x of pillarXs(z)) p.block(x - 0.12, 0.2, z - 0.12, x + 0.12, WALL - 0.3, z + 0.12, M.wood);
      return add(p);
    });
    const beams = new Part('beams');
    for (const x of [-W2, W2]) {
      beams.block(x - 0.15, WALL - 0.3, -L2 - 0.3, x + 0.15, WALL, L2 + 0.3, M.beam);
      beams.block(x - 0.12, 0.2, -L2, x + 0.12, 0.38, L2, M.beam);
    }
    for (const z of rowsZ) beams.block(-W2, WALL - 0.28, z - 0.13, W2, WALL - 0.02, z + 0.13, M.beam);
    for (const z of [-L2, L2]) beams.block(-W2, 0.2, z - 0.12, W2, 0.38, z + 0.12, M.beam);
    const beamG = add(beams);

    // 3. gassho rafters, tied with rope
    const rafterZ = [];
    for (let i = 0; i <= 10; i++) rafterZ.push(-L2 + i * 1.6);
    const rafters = rafterZ.map(z => {
      const p = new Part('rafter');
      const over = 0.45;
      p.beam([W2, WALL, z], [-over, RIDGE + over * TAN60, z], 0.14, M.log, true, 7);
      p.beam([-W2, WALL, z], [over, RIDGE + over * TAN60, z], 0.14, M.log, true, 7);
      p.add(new THREE.TorusGeometry(0.2, 0.06, 5, 10), M.rope, [0, RIDGE, z]);
      for (const s of [-1, 1]) p.add(new THREE.TorusGeometry(0.2, 0.05, 5, 10), M.rope, [s * (W2 - 0.1), WALL + 0.15, z], [Math.PI / 2, 0, 0]);
      return add(p);
    });
    const ridgePole = new Part('ridgePole');
    ridgePole.beam([0, RIDGE + 0.25, -L2 - 0.6], [0, RIDGE + 0.25, L2 + 0.6], 0.12, M.log, true, 7);
    const ridgePoleG = add(ridgePole);

    // 4. battens, collar beams, attic floors, ladders
    const battens = [-1, 1].map(side => {
      const p = new Part('battens');
      for (let s = 0.6; s < 9.9; s += 0.62) {
        const x = side * (W2 - s * 0.5 + 0.19 * 0.866), y = WALL + s * 0.866 + 0.19 * 0.5;
        p.beam([x, y, -L2 - 0.9], [x, y, L2 + 0.9], 0.045, M.bamboo, true, 5);
      }
      return add(p);
    });
    const collars = new Part('collars');
    for (const z of rafterZ) {
      for (const y of [F3 - 0.15, F4 - 0.15]) {
        const hw = W2 - (y - WALL) * COT;
        collars.block(-hw, y - 0.08, z - 0.08, hw, y + 0.08, z + 0.08, M.beam);
      }
    }
    const collarG = add(collars);
    const grating = (name, y, hw, hole) => {
      const p = new Part(name);
      for (let x = -hw; x < hw - 0.1; x += 0.25) {
        const x0 = x, x1 = x + 0.18;
        const inHole = hole && x1 > hole[0] && x0 < hole[1];
        const spans = inHole ? [[-L2 + 0.1, hole[2]], [hole[3], L2 - 0.1]] : [[-L2 + 0.1, L2 - 0.1]];
        for (const [z0, z1] of spans) p.block(x0, y - 0.06, z0, x1, y, z1, M.slat);
      }
      return add(p);
    };
    const floor2 = grating('floor2', F2, 4.85, [-4.75, -3.85, -1.0, 0.9]);
    const floor3 = grating('floor3', F3, 3.3, [2.05, 2.95, -4.8, -2.3]);
    const floor4 = grating('floor4', F4, 1.95, [-1.65, -0.75, 2.9, 4.9]);
    const ladder = (p, x, y0, z0, y1, z1) => {
      p.beam([x - 0.3, y0, z0], [x - 0.3, y1, z1], 0.06, M.beam);
      p.beam([x + 0.3, y0, z0], [x + 0.3, y1, z1], 0.06, M.beam);
      const n = Math.round((y1 - y0) / 0.3);
      for (let i = 1; i < n; i++) {
        const t = i / n;
        p.box(0.6, 0.05, 0.1, x, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t, M.beam);
      }
    };
    const ladders = new Part('ladders');
    ladder(ladders, -4.3, FL, 0.8, F2, -0.6);
    ladder(ladders, 2.5, F2, -2.0, F3, -4.0);
    ladder(ladders, -1.2, F3, 2.9, F4, 4.5);
    const laddersG = add(ladders);

    // 5. thatch, in bands from the eaves up (the way villagers lay it)
    const cuts = [1.9, 4.4, 6.9, 9.4];
    const bands = [];
    for (let b = 0; b < cuts.length; b++) {
      for (const side of [1, -1]) {
        const p = new Part('thatch');
        const y0 = cuts[b];
        let pts;
        if (b < cuts.length - 1) {
          const y1 = cuts[b + 1];
          pts = [[inX(y0), y0], [outX(y0), y0], [outX(y1), y1], [inX(y1), y1]];
        } else {
          pts = [[inX(y0), y0], [outX(y0), y0], [0, APEX_OUT], [0, APEX_IN]];
        }
        if (side < 0) pts = pts.map(([x, y]) => [-x, y]).reverse();
        p.prism(pts, -L2 - OVER_Z, L2 + OVER_Z, M.thatch);
        bands.push({ g: add(p), side });
      }
    }
    const ridgeCap = new Part('ridgeCap');
    ridgeCap.beam([0, APEX_OUT - 0.25, -L2 - OVER_Z - 0.2], [0, APEX_OUT - 0.25, L2 + OVER_Z + 0.2], 0.5, M.ridge, true, 8);
    for (let z = -L2 - 0.6; z <= L2 + 0.7; z += 1.3) {
      ridgeCap.beam([-0.55, APEX_OUT - 0.5, z], [0.55, APEX_OUT + 0.45, z], 0.06, M.beam);
      ridgeCap.beam([0.55, APEX_OUT - 0.5, z], [-0.55, APEX_OUT + 0.45, z], 0.06, M.beam);
    }
    const ridgeCapG = add(ridgeCap);

    // villagers working together (yui) + bundles of thatch
    const villagers = [];
    const clothes = ['#2e3f66', '#3b4a3a', '#5a3c2c', '#2b2f45', '#6a5a3a'];
    const crew = [
      [7.6, 0, 3], [8.2, 0, -2], [7.4, 0, -6], [-7.8, 0, 4], [-8.4, 0, -3], [3, 0, 11.5], [-2.5, 0, 11.8],
      [outX(4.0) + 0.1, 4.0, -4], [outX(5.5) + 0.1, 5.5, 2], [-(outX(4.6) + 0.1), 4.6, 0], [-(outX(6.4) + 0.1), 6.4, -5], [outX(7.4) + 0.1, 7.4, 6],
    ];
    crew.forEach(([x, y, z], i) => {
      const v = person(r, { shirt: clothes[i % clothes.length], hat: '#c9b07a' });
      v.position.set(x, y, z);
      v.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
      if (i === 5 || i === 6) v.rotation.y = Math.PI;
      house.add(v);
      villagers.push(v);
    });
    const bundles = new Part('bundles');
    for (const [bx, bz] of [[8.5, 6.5], [-8.6, 7.5], [9, -8], [-9, -7.5]]) {
      for (let k = 0; k < 9; k++) {
        bundles.cyl(0.22, 1.6, bx + (k % 3) * 0.45, 0.22 + Math.floor(k / 3) * 0.4, bz, M.bamboo, [Math.PI / 2, 0, 0], 7);
      }
    }
    const bundlesG = add(bundles);
    const roofLadders = new Part('roofLadders');
    for (const [side, z] of [[1, 0.5], [-1, -2]]) {
      roofLadders.beam([side * 7.6, 0, z - 0.3], [side * (outX(7.5) + 0.2), 7.5, z - 0.3], 0.05, M.beam);
      roofLadders.beam([side * 7.6, 0, z + 0.3], [side * (outX(7.5) + 0.2), 7.5, z + 0.3], 0.05, M.beam);
    }
    const roofLaddersG = add(roofLadders);

    // 6. walls, gables and paper windows
    const wallH0 = 0.38, wallH1 = WALL - 0.3, WT = 0.12;
    const walls = {
      east: new Part('wallE').wall('z', -L2, L2, W2, wallH0, wallH1, WT, M.wood,
        [{ from: 3, to: 5, y0: 0, y1: 2.3 }, { from: -6.5, to: -2, y0: 0.9, y1: 2.3 }, { from: 6, to: 7.5, y0: 0.9, y1: 2.2 }]),
      west: new Part('wallW').wall('z', -L2, L2, -W2, wallH0, wallH1, WT, M.wood,
        [{ from: 1.5, to: 5.5, y0: 0.9, y1: 2.3 }, { from: -6, to: -2.5, y0: 0.9, y1: 2.3 }]),
      south: new Part('wallS').wall('x', -W2, W2, L2, wallH0, wallH1, WT, M.wood,
        [{ from: -4, to: -1, y0: 0.9, y1: 2.3 }, { from: 0.8, to: 3.6, y0: 0.9, y1: 2.3 }]),
      north: new Part('wallN').wall('x', -W2, W2, -L2, wallH0, wallH1, WT, M.wood, [{ from: -1, to: 1, y0: 1.2, y1: 2.0 }]),
    };
    // a half-open sliding door in the entrance
    walls.east.block(W2 - 0.03, 0.06, 3.0, W2 + 0.03, 2.3, 4.0, M.gable);
    const shojiLow = new Part('shojiLow');
    shojiLow.block(W2 - 0.03, 0.9, -6.5, W2 + 0.03, 2.3, -2, M.shoji);
    shojiLow.block(W2 - 0.03, 0.9, 6, W2 + 0.03, 2.2, 7.5, M.shoji);
    shojiLow.block(-W2 - 0.03, 0.9, 1.5, -W2 + 0.03, 2.3, 5.5, M.shoji);
    shojiLow.block(-W2 - 0.03, 0.9, -6, -W2 + 0.03, 2.3, -2.5, M.shoji);
    shojiLow.block(-4, 0.9, L2 - 0.03, -1, 2.3, L2 + 0.03, M.shoji);
    shojiLow.block(0.8, 0.9, L2 - 0.03, 3.6, 2.3, L2 + 0.03, M.shoji);
    shojiLow.block(-1, 1.2, -L2 - 0.03, 1, 2.0, -L2 + 0.03, M.shoji);
    const wallGroups = Object.values(walls).map(add);
    const shojiLowG = add(shojiLow);

    const gables = [L2, -L2].map(zf => {
      const p = new Part('gable');
      const hw = W2 + 0.35, top = APEX_IN + 0.05;
      p.prism([[-hw, WALL], [hw, WALL], [0, top]], zf - 0.06, zf + 0.06, M.gable);
      const s = Math.sign(zf), zo = zf + s * 0.09;
      const halfAt = y => (top - y) * COT;
      for (const y of [WALL + 0.1, F3 - 0.15, F4 - 0.15]) p.box(halfAt(y) * 2, 0.22, 0.08, 0, y, zo, M.beam);
      for (const x of [-1.2, 1.2]) p.block(x - 0.08, WALL, zo - 0.04, x + 0.08, top - Math.abs(x) * TAN60 - 0.1, zo + 0.04, M.beam);
      const win = (x0, x1, y0, y1) => p.block(x0, y0, zo - 0.03 + s * 0.04, x1, y1, zo + 0.03 + s * 0.04, M.shoji);
      if (s > 0) {
        win(-3.4, -1.4, 3.3, 4.7); win(-0.9, 0.9, 3.3, 4.7); win(1.4, 3.4, 3.3, 4.7);
        win(-2.4, -1.4, 5.6, 6.9); win(-1.0, 1.0, 5.6, 6.9); win(1.4, 2.4, 5.6, 6.9);
        win(-0.9, 0.9, 7.9, 9.0);
      } else {
        win(-3.0, -1.6, 3.4, 4.6); win(1.6, 3.0, 3.4, 4.6); win(-0.8, 0.8, 5.7, 6.8); win(-0.6, 0.6, 8.0, 8.9);
      }
      return add(p);
    });

    // 7. inside: floors, hearth, rooms
    const floors = new Part('floors');
    floors.block(-W2, 0.3, -1, 2, FL, 3, M.board);
    floors.block(-W2, 0.3, 4, 2, FL, L2, M.board);
    floors.block(-W2, 0.3, 3, -2, FL, 4, M.board);
    floors.block(-1, 0.3, 3, 2, FL, 4, M.board);
    floors.block(-W2, 0.3, -L2, W2, FL + 0.05, -1, M.tatami);
    floors.block(2, 0.0, -1, W2, 0.06, L2, M.earth);
    floors.block(1.9, 0.06, -1, 2.06, FL, L2, M.lacquer);
    const floorsG = add(floors);

    const irori = new Part('irori');
    irori.block(-2, 0.25, 3, -1, 0.38, 4, M.ash);
    for (const [x0, z0, x1, z1] of [[-2.12, 2.88, -0.88, 3.0], [-2.12, 4.0, -0.88, 4.12], [-2.12, 3.0, -2.0, 4.0], [-1.0, 3.0, -0.88, 4.0]]) irori.block(x0, 0.38, z0, x1, FL + 0.04, z1, M.lacquer);
    for (let i = 0; i < 6; i++) irori.box(0.08, 0.05, 0.08, -1.5 + (r() - 0.5) * 0.3, 0.41, 3.5 + (r() - 0.5) * 0.3, M.ember, [0, r() * 3, 0]);
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1;
      irori.beam([-1.5 + Math.cos(a) * 0.08, 0.42, 3.5 + Math.sin(a) * 0.08], [-1.5 + Math.cos(a) * 0.45, 0.4, 3.5 + Math.sin(a) * 0.45], 0.04, M.log, true, 5);
    }
    // smoke rack, hanging pole, fish-shaped hook and iron kettle
    for (let i = 0; i < 9; i++) irori.block(-2.3, 2.2, 2.7 + i * 0.2, -0.7, 2.24, 2.78 + i * 0.2, M.bamboo);
    for (const [x, z] of [[-2.25, 2.75], [-0.75, 2.75], [-2.25, 4.25], [-0.75, 4.25]]) irori.beam([x, 2.24, z], [x, F2 - 0.06, z], 0.015, M.rope, true, 4);
    irori.cyl(0.035, 1.25, -1.5, 1.6, 3.5, M.bamboo, null, 6);
    irori.box(0.5, 0.13, 0.06, -1.5, 1.75, 3.5, M.wood);
    irori.add(new THREE.ConeGeometry(0.08, 0.16, 4), M.wood, [-1.2, 1.75, 3.5], [0, 0, -Math.PI / 2]);
    irori.cyl(0.19, 0.22, -1.5, 0.92, 3.5, M.iron, null, 12, 0.15);
    irori.cyl(0.03, 0.05, -1.5, 1.06, 3.5, M.iron, null, 6);
    irori.add(new THREE.TorusGeometry(0.17, 0.012, 4, 12, Math.PI), M.iron, [-1.5, 1.03, 3.5]);
    for (const [x, z, m] of [[-1.5, 2.45, M.indigo], [-1.5, 4.55, M.red], [-2.55, 3.5, M.indigo], [-0.45, 3.5, M.indigo]]) irori.box(0.55, 0.06, 0.55, x, FL + 0.03, z, m);
    const iroriG = add(irori);

    const rooms = new Part('rooms');
    rooms.wall('x', -W2, W2, -1, FL, 2.35, 0.08, M.fusuma, [{ from: -3.6, to: -1.6, y0: -1, y1: 2.35 }, { from: 0.8, to: 2.8, y0: -1, y1: 2.35 }]);
    rooms.block(-W2, 2.35, -1.06, W2, 2.5, -0.94, M.beam);
    rooms.wall('z', -L2, -1, 0, FL, 2.35, 0.08, M.fusuma, [{ from: -5, to: -3, y0: -1, y1: 2.35 }]);
    rooms.block(-0.06, 2.35, -L2, 0.06, 2.5, -1, M.beam);
    // tansu chest
    rooms.block(-W2 + 0.08, FL, 5.2, -W2 + 0.55, FL + 1.2, 6.6, M.wood);
    for (let i = 0; i < 3; i++) rooms.box(0.04, 0.05, 0.16, -W2 + 0.57, FL + 0.25 + i * 0.38, 5.9, M.iron);
    // doma: tubs, rice-pounding mortar, straw
    rooms.cyl(0.4, 0.7, 4.2, 0.4, 6.8, M.wood, null, 10);
    rooms.cyl(0.32, 0.6, 3.4, 0.35, 7.2, M.wood, null, 10);
    rooms.cyl(0.3, 0.5, 4.3, 0.3, -0.2, M.stone, null, 8, 0.36);
    rooms.cyl(0.25, 1.2, 4.4, 0.3, 1.2, M.bamboo, [0, 0, Math.PI / 2], 7);
    const roomsG = add(rooms);

    const altar = new Part('altar');
    altar.block(-3.2, FL + 0.05, -L2 + 0.1, -1.8, FL + 1.85, -L2 + 0.8, M.lacquer);
    altar.block(-3.0, FL + 0.4, -L2 + 0.8, -2.0, FL + 1.7, -L2 + 0.83, M.gold);
    altar.box(0.55, 1.6, 0.04, -3.42, FL + 0.95, -L2 + 1.02, M.lacquer, [0, 0.9, 0]);
    altar.box(0.55, 1.6, 0.04, -1.58, FL + 0.95, -L2 + 1.02, M.lacquer, [0, -0.9, 0]);
    altar.cyl(0.03, 0.3, -2.75, FL + 0.2, -L2 + 1.05, M.gold, null, 6);
    altar.cyl(0.03, 0.3, -2.25, FL + 0.2, -L2 + 1.05, M.gold, null, 6);
    const altarG = add(altar);

    const silk = new Part('silkworms');
    for (const x of [-2.6, 2.6]) for (const z of [-6, -3.6, 3.6, 6]) {
      for (const [dx, dz] of [[-0.5, -0.9], [0.5, -0.9], [-0.5, 0.9], [0.5, 0.9]]) silk.block(x + dx - 0.03, F2, z + dz - 0.03, x + dx + 0.03, F2 + 1.9, z + dz + 0.03, M.beam);
      for (let k = 0; k < 4; k++) {
        const y = F2 + 0.3 + k * 0.42;
        silk.block(x - 0.5, y, z - 0.9, x + 0.5, y + 0.05, z + 0.9, M.wood);
        silk.block(x - 0.45, y + 0.05, z - 0.85, x + 0.45, y + 0.07, z + 0.85, M.silk);
      }
    }
    for (let i = 0; i < 8; i++) silk.cyl(0.2, 1.4, -1.5 + (i % 4) * 0.42, F3 + 0.2 + Math.floor(i / 4) * 0.38, 5.5, M.bamboo, [Math.PI / 2, 0, 0], 7);
    const silkG = add(silk);

    // irori light and drifting smoke
    const fire = new THREE.PointLight('#ff9a4a', 4, 10, 1.2);
    fire.position.set(-1.5, 0.9, 3.5);
    house.add(fire);
    const attic = new THREE.PointLight('#ffe2b8', 2.2, 12, 1.2);
    attic.position.set(0, 6, 0);
    house.add(attic);
    const smokeTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d'), grd = g.createRadialGradient(32, 32, 2, 32, 32, 32);
      grd.addColorStop(0, 'rgba(220,215,205,0.55)'); grd.addColorStop(1, 'rgba(220,215,205,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();
    const smoke = [];
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0.5 }));
      s.userData.t = i / 12;
      house.add(s);
      smoke.push(s);
    }

    // ------------------------------------------------------------ the village
    const shell = new THREE.Group();
    for (const g of [...bands.map(b => b.g), ridgeCapG, ...wallGroups, shojiLowG, ...gables, ...pillars, beamG]) shell.add(g.clone());
    const shellBaked = bake(shell);
    const village = villagePos.map(([x, z]) => {
      const v = shellBaked.clone();
      v.position.set(x, 0, z);
      v.scale.setScalar(0.78 + r() * 0.22);
      v.rotation.y = r() < 0.5 ? 0 : Math.PI;
      root.add(v);
      return v;
    });

    // ------------------------------------------------------------ text
    const text = {
      welcome: 'Welcome to Shirakawa-go, a farming village high in the mountains of central Japan. Winters here bring two meters of snow or more. Watch how the people of this valley build a house to survive it.',
      stones: 'First, builders set flat stones on the ground. The wooden posts will stand on these stones, which keeps the timber off the damp soil so it does not rot.',
      frame: 'Carpenters raise the posts and beams of the ground floor, using timber cut from the forests around the village.',
      rafters: 'Next come the gassho: giant rafters that lean together like hands pressed together in prayer. That is where the name comes from. The beams are tied with rope and branches instead of nails, so the frame can flex under heavy snow.',
      floors: 'Bamboo poles are tied across the rafters, and slatted floors fill the space inside the roof. These attic floors have a special job, which you will discover later.',
      thatch: 'Now the whole village arrives. Under a tradition called yui, neighbors thatch the roof together, starting at the bottom and working up. In return, this family will help thatch their neighbors\' roofs.',
      walls: 'Wooden walls and paper shoji windows close in the house. The roof is about sixty degrees steep, so heavy snow slides off instead of crushing the house.',
      inside: 'Inside, the family gathers around the irori, a sunken fireplace used for cooking and warmth. Its smoke drifts up through the slatted floors, all the way to the thatch.',
      finale: 'This is folk housing: built by local people, with local materials, in a shape that fits the local environment. From up here, notice that the houses all face the same direction. Take a look around.',
    };

    const stages = [
      { title: 'Welcome', text: text.welcome, view: 'path', minTime: 4 },
      { title: 'Foundation stones', text: text.stones, anims: seq(stones, 'rise', { stagger: 0.2, dur: 0.7, h: 0.5 }) },
      {
        title: 'Posts and beams', text: text.frame,
        anims: [...seq(pillars, 'drop', { stagger: 0.18, dur: 0.7, h: 4 }), { obj: beamG, type: 'drop', delay: 2.0, dur: 0.9, h: 5 }],
      },
      {
        title: 'Gassho rafters', text: text.rafters,
        anims: [...seq(rafters, 'drop', { stagger: 0.28, dur: 0.8, h: 7 }), { obj: ridgePoleG, type: 'drop', delay: 3.4, dur: 0.8, h: 4 }],
      },
      {
        title: 'Attic floors', text: text.floors,
        anims: [
          ...seq(battens, 'drop', { stagger: 0.4, dur: 0.9, h: 3 }),
          { obj: collarG, type: 'drop', delay: 0.9, dur: 0.8, h: 3 },
          ...seq([floor2, floor3, floor4], 'drop', { start: 1.6, stagger: 0.5, dur: 0.8, h: 2.5 }),
          { obj: laddersG, type: 'pop', delay: 3.2, dur: 0.6 },
        ],
      },
      {
        title: 'Thatching with yui', text: text.thatch,
        anims: [
          ...seq(villagers, 'pop', { stagger: 0.12, dur: 0.5 }),
          { obj: bundlesG, type: 'pop', delay: 0.3, dur: 0.6 },
          { obj: roofLaddersG, type: 'pop', delay: 0.8, dur: 0.6 },
          ...bands.map((b, i) => ({ obj: b.g, type: 'slide', delay: 1.6 + i * 0.6, dur: 0.9, from: [b.side * 1.6, 0.9, 0] })),
          { obj: ridgeCapG, type: 'drop', delay: 1.6 + bands.length * 0.6, dur: 0.8, h: 3 },
        ],
      },
      {
        title: 'Walls and windows', text: text.walls, hide: [...villagers, roofLaddersG, bundlesG],
        anims: [
          ...seq(wallGroups, 'pop', { stagger: 0.35, dur: 0.6 }),
          ...seq(gables, 'pop', { start: 1.4, stagger: 0.4, dur: 0.7 }),
          { obj: shojiLowG, type: 'pop', delay: 2.4, dur: 0.6 },
        ],
      },
      {
        title: 'The irori hearth', text: text.inside, view: 'irori',
        anims: seq([floorsG, roomsG, iroriG, altarG, silkG], 'pop', { stagger: 0.45, dur: 0.6 }),
      },
      {
        title: 'The village', text: text.finale, view: 'lookout', minTime: 6,
        anims: seq(village, 'pop', { start: 0.8, stagger: 0.3, dur: 0.7 }),
      },
    ];

    const viewpoints = [
      { id: 'path', label: 'Village path', pos: look, yaw: yawTo(look, [0, 0, 0]), pitch: 0.2,
        markers: [{ pos: look }, { pos: [HILL[0] - 2.5, HILL_H, HILL[1] - 2.5], label: 'Back down to the village' }] },
      { id: 'doorway', label: 'Entrance (doma)', pos: [3.8, 0.06, 4.2], yaw: Math.PI / 2, pitch: 0 },
      { id: 'irori', label: 'Irori hearth', pos: [0.4, FL, 5.6], yaw: yawTo([0.4, 0, 5.6], [-1.5, 0, 3.5]), pitch: -0.2,
        markers: [{ pos: [0.4, FL, 5.6] }, { pos: [-3.3, F2, 1.6], label: 'Back downstairs' }] },
      { id: 'altar', label: 'Tatami room', pos: [-2.5, FL + 0.05, -2.4], yaw: 0, pitch: 0 },
      { id: 'silk', label: 'Silkworm floor', pos: [0, F2, -1.2], yaw: 0.45, pitch: 0.05,
        markers: [{ pos: [-4.3, FL, 1.5], label: 'Climb to the silkworm floor' }, { pos: [0.5, F4, 1.0], label: 'Down to the silkworm floor' }] },
      { id: 'top', label: 'Top floor (roof frame)', pos: [0, F4, -0.8], yaw: 0, pitch: 0.55,
        markers: [{ pos: [2.5, F2, -1.6], label: 'Climb to the top floor' }] },
      { id: 'lookout', label: 'Hilltop lookout', pos: [HILL[0], HILL_H, HILL[1]], yaw: yawTo([HILL[0], 0, HILL[1]], [0, 0, 0]), pitch: -0.22,
        markers: [{ pos: [22, 0, 30], label: 'Walk up to the lookout' }] },
    ];

    const lookDir = new THREE.Vector3(-HILL[0], 0, -HILL[1]).normalize();
    const hotspots = [
      { id: 'roof', title: 'A 60° roof', pos: [7.6, 5.6, 9.8],
        text: 'Shirakawa-go gets some of the heaviest snow in Japan. The steep, thick thatched roof sheds snow and keeps the house warm. This is the environment shaping the house.' },
      { id: 'facing', title: 'Facing the wind', pos: [0, 7.2, 10.8],
        text: 'The gable ends face north and south, along the valley. Wind blows along the valley instead of hitting the broad roof, and the two roof slopes face east and west, so the morning and afternoon sun dry the thatch evenly.' },
      { id: 'yui', title: 'Thatch and yui', pos: [8.8, 2.6, 1.5],
        text: 'The thatch is local grass, about a meter thick. It is replaced every 30 to 40 years. Under yui, up to a hundred or more neighbors help, finishing a roof in a day or two. Folk culture depends on community, not money.' },
      { id: 'rope', title: 'No nails', pos: [0.7, 10.2, -2.4],
        text: 'Look up: the rafters are tied together with straw rope and branches. Without nails, the frame can bend a little under heavy snow and during earthquakes, instead of snapping.' },
      { id: 'irori', title: 'The irori', pos: [-1.5, 1.75, 2.5],
        text: 'The irori is for cooking, heating, and gathering. Its smoke rises through the house and coats the beams and thatch with soot, which helps keep out insects and preserves the roof.' },
      { id: 'silk', title: 'Silkworms', pos: [-2.0, 4.3, -3.6],
        text: 'Families raised silkworms on these attic floors, warmed by the fire below. Silk was the main cash crop. The huge attic shows how the local economy shaped the house.' },
      { id: 'altar', title: 'Family altar', pos: [-2.5, 2.25, -6.6],
        text: 'The best room holds a large Buddhist altar called a butsudan. Most families here follow Jodo Shinshu Buddhism. Religion is part of folk culture, and it shapes the inside of the house too.' },
      { id: 'doma', title: 'The doma', pos: [2.9, 1.9, 2.4],
        text: 'The entrance has a packed-earth floor called the doma. It was a work area for farming chores, like pounding rice and making straw goods, out of the snow.' },
      { id: 'village', title: 'A World Heritage village', pos: [HILL[0] + lookDir.x * 6, HILL_H + 1.4, HILL[1] + lookDir.z * 6],
        text: 'Every house faces the same way because every family adapted to the same environment. In 1995, Shirakawa-go became a UNESCO World Heritage Site. Today more than a million tourists visit each year, and the village works to keep its folk traditions alive.' },
    ];

    let smokeOn = false;
    return {
      root, occluders: [house], stages, viewpoints, hotspots,
      fog: { color: '#d4dfe8', near: 140, far: 750 },
      light: { sky: '#d6e4f5', ground: '#6a5a40', hemi: 1.5, sunColor: '#ffe9c8', sun: 2.6, sunDir: [0.55, 1, 0.5], shadowSize: 22 },
      update(dt) {
        smokeOn = iroriG.visible;
        for (const s of smoke) {
          s.visible = smokeOn;
          if (!smokeOn) continue;
          s.userData.t = (s.userData.t + dt * 0.06) % 1;
          const t = s.userData.t;
          s.position.set(-1.5 + Math.sin(t * 9 + s.id) * 0.6 * t, 1.3 + t * 9, 3.5 + Math.cos(t * 7 + s.id) * 0.8 * t);
          s.scale.setScalar(0.6 + t * 2.4);
          s.material.opacity = 0.4 * Math.sin(Math.PI * t);
        }
      },
    };
  },
};

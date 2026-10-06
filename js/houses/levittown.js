// POPULAR HOUSING: a 1949 Levittown ranch house, Long Island, New York.
// All narration and info text lives in the `text` object and `hotspots` list,
// so it can be edited without touching the 3D code.
import * as THREE from 'three';
import { Part, mat, tex, rng, sky, ground, addRoundTree, person, bake } from '../engine/kit.js';
import { seq } from '../engine/timeline.js';

const X0 = -4.9, X1 = 4.9, ZB = -3.8, ZF = 3.8;   // footprint (front faces +z, toward the street)
const FLR = 0.25;                                  // top of the concrete slab
const WT = 2.7;                                    // top of walls
const PITCH = 35 * Math.PI / 180;
const RIDGE = WT + ZF * Math.tan(PITCH);
const EAVE = 0.45, GOVER = 0.3;
const LOT = 18.3;                                  // 60-foot lots
const STREET = [9.5, 16.5];

const yawTo = (from, to) => Math.atan2(-(to[0] - from[0]), -(to[2] - from[2]));

export default {
  id: 'levittown',
  type: 'Popular housing',
  title: 'Levittown ranch house',
  place: 'Levittown, New York (1949)',

  create() {
    const r = rng(11);
    const root = new THREE.Group();
    const house = new THREE.Group();
    root.add(house);

    const M = {
      siding: mat('#c9d8b8', { map: tex.siding(), uv: 1.0 }),
      trim: mat('#f4f2ea'),
      roof: mat('#ffffff', { map: tex.shingles(), uv: 1.4 }),
      plywood: mat('#ffffff', { map: tex.plywood(), uv: 1.2 }),
      lumber: mat('#ffffff', { map: tex.lumber(), uv: 0.8 }),
      concrete: mat('#ffffff', { map: tex.concrete(), uv: 1.5 }),
      gravel: mat('#ffffff', { map: tex.gravel(), uv: 1.5 }),
      dirt: mat('#ffffff', { map: tex.dirt(), uv: 3 }),
      asphalt: mat('#ffffff', { map: tex.asphalt(), uv: 3 }),
      copper: mat('#c27a45', { emissive: '#3a1a08' }),
      brick: mat('#ffffff', { map: tex.brick(), uv: 0.9 }),
      glass: mat('#a9c8d8', { transparent: true, opacity: 0.32, depthWrite: false }),
      door: mat('#8f3b33'),
      shutter: mat('#2f5a45'),
      plaster: mat('#efe8d8'),
      kitchenWall: mat('#f0e2a8'),
      tile: mat('#ffffff', { map: tex.floorTile(), uv: 1.2 }),
      lino: mat('#ffffff', { map: tex.linoleum(), uv: 1.2 }),
      enamel: mat('#f6f5f0'),
      chrome: mat('#c9ccd0'),
      black: mat('#222222'),
      counter: mat('#d9473f'),
      cabinet: mat('#e9efe4'),
      wood: mat('#7a5232'),
      sofa: mat('#5d7a6e'), chair: mat('#b5683f'), bed: mat('#d9cdb4'), blanket: mat('#6b7fa8'),
      tv: mat('#ffffff', { map: tex.tvScreen(), emissive: '#4a5656' }),
      rug: mat('#ffffff', { map: tex.rug() }),
      curtain: mat('#c9a86a'),
      car: mat('#4f8a8b'), carTop: mat('#ece6d2'), tire: mat('#1d1d1d'),
      truck: mat('#7a2e26'),
      green: mat('#5f8a3c', { flatShading: true }),
    };

    // ------------------------------------------------------------ environment
    const env = new THREE.Group();
    root.add(env);
    env.add(sky('#8db8e6', '#eef3f6'));
    env.add(ground(mat('#ffffff', { map: tex.grass() })));
    {
      const p = new Part('street');
      p.block(-260, 0, STREET[0], 260, 0.04, STREET[1], M.asphalt);
      p.block(-260, 0, STREET[0] - 0.2, 260, 0.14, STREET[0], M.concrete);
      p.block(-260, 0, STREET[1], 260, 0.14, STREET[1] + 0.2, M.concrete);
      for (let x = -255; x < 260; x += 6) p.block(x, 0.04, 12.95, x + 3, 0.05, 13.05, mat('#e8e2c4'));
      // street sign
      p.cyl(0.04, 2.6, -7.5, 1.3, 9.1, mat('#555555'), null, 6);
      p.box(1.1, 0.22, 0.03, -7.5, 2.5, 9.1, mat('#2f6b45'));
      // distant trees and a far row of houses' rooftops for depth
      for (let i = 0; i < 70; i++) {
        const x = -220 + r() * 440, z = (r() < 0.5 ? -60 - r() * 120 : 70 + r() * 120);
        addRoundTree(p, x, z, 6 + r() * 5, r, ['#5f8a3c', '#6f9a45', '#55803a']);
      }
      env.add(p.build({ center: false, shadows: false }));
    }
    {
      // lookout tower (for the bird's-eye view)
      const p = new Part('tower');
      const tx = -29, tz = 30, H = 16, wood = mat('#6d5440');
      for (const [dx, dz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) p.beam([tx + dx * 1.4, 0, tz + dz * 1.4], [tx + dx * 0.8, H, tz + dz * 0.8], 0.12, wood);
      for (let y = 3; y < H; y += 4) {
        const k = 1.4 - (y / H) * 0.6;
        p.block(tx - 2 * k, y - 0.06, tz - 2 * k, tx + 2 * k, y + 0.06, tz - 2 * k + 0.1, wood);
        p.block(tx - 2 * k, y - 0.06, tz + 2 * k - 0.1, tx + 2 * k, y + 0.06, tz + 2 * k, wood);
      }
      p.block(tx - 1.6, H - 0.12, tz - 1.6, tx + 1.6, H, tz + 1.6, wood);
      for (const s of [-1, 1]) {
        p.block(tx - 1.6, H + 0.65, tz + s * 1.55 - 0.04, tx + 1.6, H + 0.72, tz + s * 1.55 + 0.04, wood);
        p.block(tx + s * 1.55 - 0.04, H + 0.65, tz - 1.6, tx + s * 1.55 + 0.04, H + 0.72, tz + 1.6, wood);
      }
      for (const [dx, dz] of [[-1.55, -1.55], [1.55, -1.55], [-1.55, 1.55], [1.55, 1.55]]) p.block(tx + dx - 0.04, H, tz + dz - 0.04, tx + dx + 0.04, H + 0.7, tz + dz + 0.04, wood);
      env.add(p.build({ center: false }));
    }

    const add = part => { const g = part.build(); house.add(g); return g; };

    // ------------------------------------------------------------ 0-1. empty lot, deliveries
    const stakes = new Part('stakes');
    for (const [x, z] of [[X0, ZB], [X1, ZB], [X0, ZF], [X1, ZF]]) stakes.box(0.05, 0.6, 0.05, x, 0.3, z, M.lumber);
    for (const [a, b] of [[[X0, ZB], [X1, ZB]], [[X1, ZB], [X1, ZF]], [[X1, ZF], [X0, ZF]], [[X0, ZF], [X0, ZB]]]) stakes.beam([a[0], 0.45, a[1]], [b[0], 0.45, b[1]], 0.008, mat('#ffffff'));
    const stakesG = add(stakes);
    const dirtPatch = new Part('dirt');
    dirtPatch.block(-9, 0, -15, 9.1, 0.03, STREET[0] - 0.2, M.dirt);
    const dirtG = add(dirtPatch);

    const pile = (p, x, z) => {
      for (let k = 0; k < 4; k++) p.block(x - 1.2, 0.1 + k * 0.22, z - 0.6 + (k % 2) * 0.05, x + 1.2, 0.3 + k * 0.22, z + 0.6, M.lumber);
      p.block(x - 1.25, 0, z - 0.65, x + 1.25, 0.1, z + 0.65, M.wood);
      p.block(x + 1.5, 0, z - 0.5, x + 2.4, 0.5, z + 0.5, M.plywood);
    };
    const myPile = new Part('pile'); pile(myPile, -8.4, 2.5); pile(myPile, -8.4, -1.5);
    const myPileG = add(myPile);
    const otherPiles = [[-LOT, 0], [LOT, 0], [0, 26]].map(([x, z]) => {
      const s = z ? -1 : 1;
      const p = new Part('pile'); pile(p, x - s * 8.4, z + s * 2.5); pile(p, x - s * 8.4, z - s * 1.5);
      const g = p.build(); root.add(g); return g;
    });

    const truck = (() => {
      const p = new Part('truck');
      p.block(-1.1, 0.6, -0.95, 1.1, 1.9, 0.95, M.truck);                 // cab
      p.block(1.1, 0.6, -0.8, 2.4, 1.3, 0.8, M.truck);                    // hood
      p.block(-5.2, 0.8, -1.1, -1.1, 1.0, 1.1, M.wood);                   // flatbed
      p.block(-0.9, 1.3, -0.96, 0.9, 1.8, 0.96, mat('#2a3540'));          // windows
      for (let k = 0; k < 3; k++) p.block(-4.9, 1.0 + k * 0.22, -0.9, -1.4, 1.2 + k * 0.22, 0.9, M.lumber);
      for (const x of [-4, -2.8, 1.6]) for (const z of [-1, 1]) p.cyl(0.42, 0.3, x, 0.42, z, M.tire, [Math.PI / 2, 0, 0], 12);
      const g = p.build({ center: false });
      g.position.set(-70, 0, 11.4);
      g.visible = false;
      root.add(g);
      return g;
    })();

    // workers who appear during construction
    const workers = [[-6, 0, 5], [6.5, 0, -1], [-2, 0, -5.5], [3.2, 0, 5.4]].map(([x, y, z], i) => {
      const w = person(r, { shirt: ['#6b5a3a', '#3e5470', '#7a6b52', '#4c5a3c'][i], pants: '#3a3a42', cap: '#3b3b3b' });
      w.position.set(x, y, z);
      w.rotation.y = yawTo([x, 0, z], [0, 0, 0]);
      house.add(w);
      return w;
    });

    // ------------------------------------------------------------ 2-3. gravel, heating pipes, slab
    const gravel = new Part('gravel');
    gravel.block(X0 - 0.1, 0, ZB - 0.1, X1 + 0.1, 0.08, ZF + 0.1, M.gravel);
    const gravelG = add(gravel);
    const pipes = new Part('pipes');
    {
      const xs = [];
      for (let x = X0 + 0.4; x <= X1 - 0.4; x += 0.55) xs.push(x);
      xs.forEach((x, i) => {
        pipes.beam([x, 0.12, ZB + 0.4], [x, 0.12, ZF - 0.4], 0.025, M.copper, true, 6);
        if (i < xs.length - 1) {
          const z = i % 2 ? ZB + 0.4 : ZF - 0.4;
          pipes.beam([x, 0.12, z], [xs[i + 1], 0.12, z], 0.025, M.copper, true, 6);
        }
      });
      pipes.block(X1 - 0.6, 0.08, ZF - 0.3, X1 - 0.3, 0.6, ZF - 0.05, M.copper);
    }
    const pipesG = add(pipes);
    const slab = new Part('slab');
    slab.block(X0, 0.0, ZB, X1, FLR, ZF, M.concrete);
    const slabG = add(slab);

    // ------------------------------------------------------------ openings (shared by framing, walls, linings)
    const O = {
      front: [{ from: -4.1, to: -2.5, y0: FLR + 1.0, y1: FLR + 2.1 }, { from: -1.0, to: -0.1, y0: FLR, y1: FLR + 2.05 }, { from: 2.4, to: 3.8, y0: FLR + 0.95, y1: FLR + 2.1 }],
      back: [{ from: -3.9, to: -0.7, y0: FLR + 0.5, y1: FLR + 2.15 }, { from: 2.2, to: 3.6, y0: FLR + 0.95, y1: FLR + 2.1 }],
      east: [{ from: 1.4, to: 2.8, y0: FLR + 0.95, y1: FLR + 2.1 }, { from: -2.6, to: -1.2, y0: FLR + 0.95, y1: FLR + 2.1 }],
      west: [{ from: 2.1, to: 3.0, y0: FLR + 1.1, y1: FLR + 2.0 }],
    };

    // ------------------------------------------------------------ 4. wall framing (precut 2x4s)
    const frame = (axis, from, to, fixed, openings) => {
      const p = new Part('frame');
      const t = 0.09, w = 0.045;
      const line = (a, b, ya, yb) => axis === 'x'
        ? p.block(a, ya, fixed - t / 2, b, yb, fixed + t / 2, M.lumber)
        : p.block(fixed - t / 2, ya, a, fixed + t / 2, yb, b, M.lumber);
      line(from, to, FLR, FLR + w);
      line(from, to, WT - w * 2, WT);
      for (let s = from; s <= to + 0.001; s += 0.41) {
        const c = Math.min(s, to - w / 2);
        const o = openings.find(o => c > o.from - 0.02 && c < o.to + 0.02);
        if (o) {
          if (o.y0 > FLR + 0.05) line(c - w / 2, c + w / 2, FLR + w, o.y0);
          line(c - w / 2, c + w / 2, o.y1 + 0.15, WT - w * 2);
        } else line(c - w / 2, c + w / 2, FLR + w, WT - w * 2);
      }
      for (const o of openings) {
        line(o.from - w, o.from, FLR + w, WT - w * 2);
        line(o.to, o.to + w, FLR + w, WT - w * 2);
        line(o.from, o.to, o.y1, o.y1 + 0.15);
        if (o.y0 > FLR + 0.05) line(o.from, o.to, o.y0 - w, o.y0);
      }
      return add(p);
    };
    const split = (list, a, b) => list.filter(o => o.from >= a - 0.01 && o.to <= b + 0.01);
    const frames = [
      frame('x', X0, -1.7, ZF, split(O.front, X0, -1.7)), frame('x', -1.7, 1.7, ZF, split(O.front, -1.7, 1.7)), frame('x', 1.7, X1, ZF, split(O.front, 1.7, X1)),
      frame('z', ZB, ZF, X1, O.east),
      frame('x', 1.7, X1, ZB, split(O.back, 1.7, X1)), frame('x', -0.4, 1.7, ZB, []), frame('x', X0, -0.4, ZB, split(O.back, X0, -0.4)),
      frame('z', ZB, ZF, X0, O.west),
    ];

    // ------------------------------------------------------------ 5. roof framing + sheathing
    const rafters = [];
    for (let x = X0 - GOVER + 0.05, i = 0; x <= X1 + GOVER; x += 0.61, i++) {
      if (i % 3 === 0) rafters.push(new Part('rafters'));
      const p = rafters[rafters.length - 1];
      for (const s of [1, -1]) p.beam([x, WT - EAVE * Math.tan(PITCH), s * (ZF + EAVE)], [x, RIDGE, 0], 0.07, M.lumber);
      p.block(x - 0.03, WT + 0.01, ZB, x + 0.03, WT + 0.09, ZF, M.lumber);   // ceiling joist
    }
    const rafterGs = rafters.map(add);
    const ridgeBoard = new Part('ridgeBoard');
    ridgeBoard.block(X0 - GOVER, RIDGE - 0.1, -0.03, X1 + GOVER, RIDGE + 0.08, 0.03, M.lumber);
    const ridgeG = add(ridgeBoard);
    const slopeLen = (ZF + EAVE) / Math.cos(PITCH);
    const roofSlab = (material, lift, thick) => [1, -1].map(s => {
      const p = new Part('roof');
      const mid = (ZF + EAVE) / 2;
      const y = (WT - EAVE * Math.tan(PITCH) + RIDGE) / 2 + lift * Math.cos(PITCH);
      p.box(X1 - X0 + GOVER * 2, thick, slopeLen + 0.08, 0, y, s * (mid + lift * Math.sin(PITCH)), material, [s * PITCH, 0, 0]);
      return add(p);
    });
    const sheathing = roofSlab(M.plywood, 0.06, 0.03);

    // ------------------------------------------------------------ 6. siding, windows, doors
    const wallPart = (name, axis, from, to, fixed, ops) => new Part(name).wall(axis, from, to, fixed, FLR, WT, 0.1, M.siding, ops);
    const walls = [
      wallPart('wF', 'x', X0, X1, ZF + 0.05, O.front),
      wallPart('wE', 'z', ZB, ZF, X1 + 0.05, O.east),
      wallPart('wB', 'x', X0, X1, ZB - 0.05, O.back),
      wallPart('wW', 'z', ZB, ZF, X0 - 0.05, O.west),
    ];
    // gable triangles
    for (const x of [X0 - 0.05, X1 + 0.05]) {
      const shape = new THREE.Shape([new THREE.Vector2(-ZF - 0.05, WT), new THREE.Vector2(ZF + 0.05, WT), new THREE.Vector2(0, RIDGE + 0.02)]);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
      walls[x < 0 ? 3 : 1].add(geo, M.siding, [x - 0.05, 0, 0], [0, Math.PI / 2, 0]);
    }
    const wallGs = walls.map(add);

    const windows = new Part('windows');
    const trimW = 0.08;
    const winX = (o, z, out) => {      // window/door in a wall along x
      const zo = z + out * 0.06;
      windows.block(o.from - trimW, o.y0 - trimW, zo - 0.03, o.from, o.y1 + trimW, zo + 0.03, M.trim);
      windows.block(o.to, o.y0 - trimW, zo - 0.03, o.to + trimW, o.y1 + trimW, zo + 0.03, M.trim);
      windows.block(o.from - trimW, o.y1, zo - 0.03, o.to + trimW, o.y1 + trimW, zo + 0.03, M.trim);
      if (o.y0 > FLR + 0.05) {
        windows.block(o.from - trimW * 1.5, o.y0 - trimW, zo - 0.05, o.to + trimW * 1.5, o.y0, zo + 0.05, M.trim);
        windows.block(o.from, o.y0, z - 0.01, o.to, o.y1, z + 0.01, M.glass);
        windows.block((o.from + o.to) / 2 - 0.025, o.y0, zo - 0.02, (o.from + o.to) / 2 + 0.025, o.y1, zo + 0.02, M.trim);
      }
    };
    const winZ = (o, x, out) => {
      const xo = x + out * 0.06;
      windows.block(xo - 0.03, o.y0 - trimW, o.from - trimW, xo + 0.03, o.y1 + trimW, o.from, M.trim);
      windows.block(xo - 0.03, o.y0 - trimW, o.to, xo + 0.03, o.y1 + trimW, o.to + trimW, M.trim);
      windows.block(xo - 0.03, o.y1, o.from - trimW, xo + 0.03, o.y1 + trimW, o.to + trimW, M.trim);
      windows.block(xo - 0.05, o.y0 - trimW, o.from - trimW * 1.5, xo + 0.05, o.y0, o.to + trimW * 1.5, M.trim);
      windows.block(x - 0.01, o.y0, o.from, x + 0.01, o.y1, o.to, M.glass);
      windows.block(xo - 0.02, (o.y0 + o.y1) / 2 - 0.025, o.from, xo + 0.02, (o.y0 + o.y1) / 2 + 0.025, o.to, M.trim);
    };
    O.front.forEach(o => winX(o, ZF + 0.05, 1));
    O.back.forEach(o => winX(o, ZB - 0.05, -1));
    O.east.forEach(o => winZ(o, X1 + 0.05, 1));
    O.west.forEach(o => winZ(o, X0 - 0.05, -1));
    // picture window: extra mullions dividing it into a big centre pane
    windows.block(-3.15, FLR + 0.5, ZB - 0.13, -3.1, FLR + 2.15, ZB - 0.07, M.trim);
    windows.block(-1.5, FLR + 0.5, ZB - 0.13, -1.45, FLR + 2.15, ZB - 0.07, M.trim);
    windows.block(-1.0, FLR, ZF + 0.02, -0.1, FLR + 2.05, ZF + 0.07, M.door);        // front door
    windows.box(0.05, 0.05, 0.08, -0.25, FLR + 1.0, ZF + 0.1, M.chrome);
    for (const [a, b] of [[-4.1, -2.5], [2.4, 3.8]]) {                                // shutters
      windows.block(a - 0.5, FLR + 0.95, ZF + 0.1, a - 0.1, FLR + 2.15, ZF + 0.14, M.shutter);
      windows.block(b + 0.1, FLR + 0.95, ZF + 0.1, b + 0.5, FLR + 2.15, ZF + 0.14, M.shutter);
    }
    windows.block(-1.3, 0, ZF + 0.1, 0.2, FLR - 0.02, ZF + 1.1, M.concrete);           // stoop
    windows.block(-1.3, 0, ZF + 1.1, 0.2, 0.12, ZF + 1.5, M.concrete);
    const windowsG = add(windows);

    // ------------------------------------------------------------ 7. shingles, chimney, gutters
    const shingles = roofSlab(M.roof, 0.11, 0.05);
    const chimney = new Part('chimney');
    chimney.block(X0 - 0.75, 0, -2.4, X0 - 0.08, RIDGE + 0.7, -1.4, M.brick);
    chimney.block(X0 - 0.8, RIDGE + 0.6, -2.45, X0 - 0.03, RIDGE + 0.75, -1.35, M.concrete);
    for (const s of [1, -1]) {
      const z = s * (ZF + EAVE + 0.05), y = WT - EAVE * Math.tan(PITCH) - 0.05;
      chimney.block(X0 - GOVER, y - 0.08, z - 0.06, X1 + GOVER, y + 0.04, z + 0.06, M.trim);
    }
    const chimneyG = add(chimney);

    // ------------------------------------------------------------ 8. inside
    const inside = new Part('inside');
    inside.block(X0 + 0.05, FLR, ZB + 0.05, X1 - 0.05, FLR + 0.01, ZF - 0.05, M.tile);
    inside.block(X0 + 0.1, FLR + 0.01, 0.85, -1.25, FLR + 0.015, ZF - 0.1, M.lino);
    inside.block(X0, WT - 0.04, ZB, X1, WT, ZF, mat('#f2ece0', { emissive: '#45403a' }));   // ceiling
    // linings inside the outer walls
    inside.wall('x', X0, X1, ZF - 0.04, FLR, WT - 0.04, 0.02, M.plaster, O.front);
    inside.wall('x', X0, X1, ZB + 0.04, FLR, WT - 0.04, 0.02, M.plaster, O.back);
    inside.wall('z', ZB, ZF, X1 - 0.04, FLR, WT - 0.04, 0.02, M.plaster, O.east);
    inside.wall('z', ZB, 0.8, X0 + 0.04, FLR, WT - 0.04, 0.02, M.plaster, []);
    inside.wall('z', 0.8, ZF, X0 + 0.04, FLR, WT - 0.04, 0.02, M.kitchenWall, O.west);
    inside.wall('x', X0, -1.25, ZF - 0.06, FLR, WT - 0.04, 0.01, M.kitchenWall, O.front.filter(o => o.to < -1.2));
    // interior walls
    const iw = (axis, a, b, f, ops, m = M.plaster) => inside.wall(axis, a, b, f, FLR, WT - 0.04, 0.1, m, ops);
    iw('z', 0.8, ZF, -1.2, [{ from: 1.0, to: 1.9, y0: FLR, y1: FLR + 2.05 }], M.kitchenWall);
    iw('x', X0, -1.2, 0.8, [{ from: -2.8, to: -1.6, y0: FLR, y1: FLR + 2.05 }], M.kitchenWall);
    iw('z', 1.6, ZF, 0.4, [{ from: 1.75, to: 2.5, y0: FLR, y1: FLR + 2.05 }]);
    iw('x', 0.4, 2.0, 1.6, []);
    iw('z', 0.3, ZF, 2.0, [{ from: 0.5, to: 1.3, y0: FLR, y1: FLR + 2.05 }]);
    iw('x', 1.2, X1, 0.3, [{ from: 1.3, to: 2.0, y0: FLR, y1: FLR + 2.05 }]);
    iw('z', ZB, 0.3, 1.2, []);
    const insideG = add(inside);

    const kitchen = new Part('kitchen');
    // cabinets + counter + sink under the front window
    kitchen.block(-4.85, FLR, ZF - 0.62, -2.0, FLR + 0.9, ZF - 0.06, M.cabinet);
    kitchen.block(-4.88, FLR + 0.9, ZF - 0.65, -1.98, FLR + 0.95, ZF - 0.05, M.counter);
    kitchen.block(-3.6, FLR + 0.9, ZF - 0.52, -3.0, FLR + 0.955, ZF - 0.15, M.chrome);
    kitchen.cyl(0.02, 0.25, -3.3, FLR + 1.07, ZF - 0.12, M.chrome, null, 6);
    // Bendix washing machine (front-loading)
    kitchen.block(-1.95, FLR, ZF - 0.68, -1.3, FLR + 0.95, ZF - 0.08, M.enamel);
    kitchen.add(new THREE.TorusGeometry(0.17, 0.03, 6, 16), M.chrome, [-1.625, FLR + 0.5, ZF - 0.69]);
    kitchen.add(new THREE.CircleGeometry(0.15, 16), mat('#7d97a3'), [-1.625, FLR + 0.5, ZF - 0.69], [0, Math.PI, 0]);
    // west wall: refrigerator, stove, cabinets
    kitchen.block(-4.85, FLR, 0.95, -4.2, FLR + 1.6, 1.65, M.enamel);
    kitchen.box(0.6, 0.12, 0.66, -4.53, FLR + 1.63, 1.3, M.enamel);
    kitchen.box(0.04, 0.3, 0.04, -4.17, FLR + 1.15, 1.55, M.chrome);
    kitchen.block(-4.85, FLR, 1.75, -4.2, FLR + 0.92, 2.55, M.enamel);
    kitchen.block(-4.85, FLR + 0.92, 1.75, -4.75, FLR + 1.25, 2.55, M.enamel);
    for (const [dx, dz] of [[-0.18, -0.2], [-0.18, 0.2], [0.12, -0.2], [0.12, 0.2]]) kitchen.cyl(0.09, 0.02, -4.52 + dx, FLR + 0.93, 2.15 + dz, M.black, null, 10);
    kitchen.block(-4.85, FLR, 2.65, -4.25, FLR + 0.9, ZF - 0.62, M.cabinet);
    kitchen.block(-4.88, FLR + 0.9, 2.65, -4.22, FLR + 0.95, ZF - 0.6, M.counter);
    // small table and chairs
    kitchen.block(-3.5, FLR + 0.72, 0.95, -2.7, FLR + 0.76, 1.55, M.counter);
    kitchen.cyl(0.03, 0.72, -3.1, FLR + 0.36, 1.25, M.chrome, null, 6);
    for (const x of [-3.75, -2.45]) { kitchen.block(x - 0.2, FLR + 0.42, 1.05, x + 0.2, FLR + 0.47, 1.45, M.counter); kitchen.block(x - 0.2, FLR, 1.22, x + 0.2, FLR + 0.42, 1.28, M.chrome); }
    const kitchenG = add(kitchen);

    const living = new Part('living');
    // fireplace
    living.block(X0 + 0.05, FLR, -2.75, X0 + 0.4, FLR + 1.45, -1.25, M.brick);
    living.block(X0 + 0.39, FLR + 0.05, -2.3, X0 + 0.42, FLR + 0.75, -1.7, M.black);
    living.block(X0 + 0.05, FLR + 1.45, -2.85, X0 + 0.5, FLR + 1.52, -1.15, M.wood);
    living.block(X0 + 0.05, FLR, -2.95, X0 + 0.8, FLR + 0.06, -1.05, M.brick);
    // built-in television
    living.block(X0 + 0.05, FLR + 0.7, -0.95, X0 + 0.3, FLR + 1.5, -0.05, M.wood);
    living.block(X0 + 0.3, FLR + 0.82, -0.85, X0 + 0.31, FLR + 1.38, -0.15, M.tv);
    // sofa facing the fireplace
    living.block(-0.1, FLR, -3.1, 0.75, FLR + 0.45, -1.0, M.sofa);
    living.block(0.5, FLR + 0.45, -3.1, 0.75, FLR + 0.95, -1.0, M.sofa);
    living.block(-0.1, FLR + 0.45, -3.1, 0.5, FLR + 0.65, -2.9, M.sofa);
    living.block(-0.1, FLR + 0.45, -1.2, 0.5, FLR + 0.65, -1.0, M.sofa);
    // armchair, coffee table, lamp, rug, curtains
    living.block(-3.2, FLR, -0.3, -2.4, FLR + 0.42, 0.45, M.chair);
    living.block(-3.2, FLR + 0.42, 0.25, -2.4, FLR + 0.9, 0.45, M.chair);
    living.block(-1.9, FLR + 0.38, -2.4, -0.9, FLR + 0.43, -1.7, M.wood);
    for (const [x, z] of [[-1.85, -2.35], [-0.95, -2.35], [-1.85, -1.75], [-0.95, -1.75]]) living.block(x - 0.02, FLR, z - 0.02, x + 0.02, FLR + 0.38, z + 0.02, M.wood);
    living.cyl(0.015, 1.4, 0.9, FLR + 0.7, -3.4, M.chrome, null, 6);
    living.cyl(0.12, 0.25, 0.9, FLR + 1.45, -3.4, M.curtain, null, 10, 0.18);
    living.add(new THREE.BoxGeometry(3.0, 0.01, 2.4), M.rug, [-2.0, FLR + 0.016, -1.9]);
    for (const x of [-4.25, -0.35]) living.block(x - 0.18, FLR + 0.3, ZB + 0.06, x + 0.18, WT - 0.15, ZB + 0.12, M.curtain);
    const livingG = add(living);

    const rooms = new Part('bedrooms');
    for (const [x, z] of [[3.4, 2.2], [3.4, -2.0]]) {
      rooms.block(x - 0.5, FLR, z - 1.0, x + 1.4, FLR + 0.5, z + 1.0, M.bed);
      rooms.block(x + 1.3, FLR, z - 1.0, x + 1.45, FLR + 0.95, z + 1.0, M.wood);
      rooms.block(x - 0.5, FLR + 0.5, z - 1.0, x + 1.0, FLR + 0.55, z + 1.0, M.blanket);
    }
    rooms.block(2.2, FLR, -3.7, 3.2, FLR + 1.1, -3.25, M.wood);
    rooms.block(0.5, FLR, 2.9, 1.9, FLR + 0.55, 3.7, M.enamel);                         // bathtub
    rooms.block(0.5, FLR, 1.7, 0.95, FLR + 0.8, 2.1, M.enamel);
    const roomsG = add(rooms);

    const lampA = new THREE.PointLight('#fff1d6', 2.2, 8, 1.2); lampA.position.set(-1.8, 2.1, -1.6);
    const lampB = new THREE.PointLight('#fff1d6', 1.8, 7, 1.2); lampB.position.set(-3.0, 2.1, 2.2);
    house.add(lampA, lampB);

    // ------------------------------------------------------------ 9. yard
    const drive = new Part('drive');
    drive.block(5.4, 0, -3.4, 7.6, 0.06, STREET[0] - 0.2, M.concrete);
    drive.block(-0.85, 0, ZF + 1.5, -0.25, 0.05, STREET[0] - 0.2, M.concrete);
    const driveG = add(drive);
    const carport = new Part('carport');
    for (const z of [-3.3, 0, 3.4]) carport.block(7.62, 0, z - 0.06, 7.74, 2.55, z + 0.06, M.trim);
    carport.block(X1 + 0.1, 2.55, -3.6, 7.9, 2.66, 3.9, M.trim);
    carport.block(X1 + 0.1, 2.66, -3.6, 7.9, 2.7, 3.9, M.roof);
    const carportG = add(carport);
    const plants = new Part('plants');
    for (const x of [-4.2, -3.2, 1.6, 3.0, 4.2]) plants.add(new THREE.IcosahedronGeometry(0.42, 0), M.green, [x, 0.35, ZF + 0.6], [r(), r(), r()]);
    for (const [x, z] of [[-5, 7.2], [2.5, 7.4], [3.5, -8.5]]) {
      plants.cyl(0.05, 2.0, x, 1.0, z, mat('#5b4331'), null, 5);
      plants.add(new THREE.IcosahedronGeometry(0.7, 0), mat('#6f9a45', { flatShading: true }), [x, 2.3, z], [r(), r(), r()]);
    }
    const plantsG = add(plants);
    const car = (() => {
      const p = new Part('car');
      p.block(-0.9, 0.35, -2.4, 0.9, 1.0, 2.4, M.car);
      p.block(-0.8, 1.0, -1.3, 0.8, 1.5, 0.9, M.carTop);
      p.block(-0.82, 1.05, -1.2, 0.82, 1.42, 0.8, mat('#2a3540'));
      p.block(-0.95, 0.5, 2.38, 0.95, 0.62, 2.48, M.chrome);
      p.block(-0.95, 0.5, -2.48, 0.95, 0.62, -2.38, M.chrome);
      for (const x of [-0.85, 0.85]) for (const z of [-1.5, 1.5]) p.cyl(0.36, 0.25, x, 0.36, z, M.tire, [0, 0, Math.PI / 2], 12);
      const g = p.build({ center: false });
      g.position.set(6.5, 0, -0.2);
      house.add(g);
      return g;
    })();

    // ------------------------------------------------------------ the neighbourhood
    const shell = new THREE.Group();
    for (const g of [...wallGs, windowsG, ...shingles, chimneyG, driveG, carportG, plantsG, slabG]) shell.add(g.clone());
    const shellBaked = bake(shell);
    const colors = ['#c9d8b8', '#e8dcc0', '#bcd0d8', '#e6c9b6', '#d8d6cc', '#d6e0c0'];
    const variants = colors.map(c => mat(c, { map: tex.siding(), uv: 1.0 }));
    const spots = [];
    for (let k = 1; k <= 5; k++) { spots.push([k * LOT, 0, 0]); spots.push([-k * LOT, 0, 0]); }
    for (let k = -5; k <= 5; k++) spots.push([k * LOT, 26, Math.PI]);
    spots.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
    const neighbours = spots.map(([x, z, ry], i) => {
      const n = shellBaked.clone();
      n.children.forEach(m => { if (m.material === M.siding) m.material = variants[(i + 1) % variants.length]; });
      n.position.set(x, 0, z);
      n.rotation.y = ry;
      root.add(n);
      return n;
    });

    // ------------------------------------------------------------ text
    const text = {
      welcome: 'Welcome to Levittown, New York, in 1949. Millions of soldiers have come home from World War Two, and they need houses, fast. Watch how this one is built.',
      materials: 'Trucks drop identical bundles of precut lumber and parts at every lot, one about every sixty feet. Every lot on the street gets exactly the same delivery.',
      pipes: 'There is no basement. Instead, a crew spreads gravel and lays copper pipes. Hot water flowing through them will heat the house from the floor up.',
      slab: 'Another crew pours a concrete slab over the pipes. Each crew does just one job, then moves on to the next lot.',
      framing: 'Walls go up fast from precut lumber. Levitt broke building into twenty-seven steps, like a factory assembly line, except the workers move from house to house instead of the product moving.',
      roof: 'Roof framing and boards come next. At its peak, the company finished about thirty houses a day.',
      skin: 'Siding, windows, and doors close in the house. Notice the big picture window. It faces the backyard, not the street.',
      roofing: 'Shingles and a brick chimney finish the outside. Every house uses the same parts, made in the same factories.',
      inside: 'Inside, the house comes complete with a refrigerator, a stove, a washing machine, and even a television built into the wall, all for about eight thousand dollars.',
      yard: 'Finally: a lawn, young fruit trees, a driveway, and a carport. Out here in the suburbs, a car is not a luxury. It is how you get everywhere.',
      finale: 'This is popular housing: mass-produced, standardized, and nearly identical from lot to lot. The same house could be built almost anywhere in America. Take a look around.',
    };

    const stages = [
      { title: 'Welcome', text: text.welcome, view: 'street', minTime: 4, anims: [{ obj: stakesG, type: 'pop', delay: 1, dur: 0.6 }] },
      {
        title: 'Deliveries', text: text.materials,
        onEnter: () => { truck.visible = true; truck.position.x = -70; },
        onUpdate: (dt, t) => { truck.position.x = -70 + t * 14; },
        onComplete: () => { truck.visible = false; },
        anims: [{ obj: myPileG, type: 'drop', delay: 4.6, dur: 0.7, h: 3 }, ...seq(otherPiles, 'drop', { start: 3.2, stagger: 1.2, dur: 0.7, h: 3 })],
      },
      {
        title: 'Heating pipes', text: text.pipes, hide: [stakesG],
        anims: [...seq(workers, 'pop', { stagger: 0.15, dur: 0.5 }), { obj: gravelG, type: 'rise', delay: 0.4, dur: 0.8, h: 0.3 }, { obj: pipesG, type: 'drop', delay: 1.6, dur: 1.0, h: 1.5 }],
      },
      { title: 'Concrete slab', text: text.slab, anims: [{ obj: slabG, type: 'rise', delay: 0.3, dur: 1.6, h: 0.3 }] },
      { title: 'Framing', text: text.framing, hide: [myPileG], anims: seq(frames, 'drop', { stagger: 0.45, dur: 0.6, h: 2.5 }) },
      {
        title: 'Roof framing', text: text.roof,
        anims: [...seq(rafterGs, 'drop', { stagger: 0.25, dur: 0.6, h: 3 }), { obj: ridgeG, type: 'drop', delay: 0.2, dur: 0.6, h: 3 }, ...seq(sheathing, 'slide', { start: 2.4, stagger: 0.5, dur: 0.8, from: [0, 2, 0] })],
      },
      { title: 'Siding and windows', text: text.skin, anims: [...seq(wallGs, 'pop', { stagger: 0.4, dur: 0.6 }), { obj: windowsG, type: 'pop', delay: 1.8, dur: 0.7 }] },
      {
        title: 'Shingles and chimney', text: text.roofing,
        anims: [...seq(shingles, 'slide', { stagger: 0.5, dur: 0.8, from: [0, 2.5, 0] }), { obj: chimneyG, type: 'rise', delay: 1.2, dur: 1.0 }],
      },
      { title: 'Ready to move in', text: text.inside, view: 'living', hide: workers, anims: seq([insideG, livingG, kitchenG, roomsG], 'pop', { stagger: 0.5, dur: 0.6 }) },
      {
        title: 'The yard', text: text.yard, view: 'street',
        anims: [{ obj: dirtG, type: 'sink', delay: 0.4, dur: 1.0, h: 0.2 }, { obj: driveG, type: 'rise', delay: 1.0, dur: 0.8, h: 0.2 }, { obj: carportG, type: 'pop', delay: 1.6, dur: 0.6 }, { obj: plantsG, type: 'pop', delay: 2.2, dur: 0.6 }, { obj: car, type: 'slide', delay: 2.8, dur: 1.6, from: [0, 0, 14] }],
      },
      { title: 'The street', text: text.finale, view: 'tower', minTime: 6, hide: otherPiles, anims: seq(neighbours, 'pop', { start: 0.6, stagger: 0.18, dur: 0.6 }) },
    ];

    const street = [4, 0, 15.2];
    const tower = [-28.2, 16, 29.35];
    const viewpoints = [
      { id: 'street', label: 'Across the street', pos: street, yaw: yawTo(street, [-0.5, 0, 0]), pitch: 0.05,
        markers: [{ pos: street }, { pos: [-29.8, 16, 30.7], label: 'Back down to the street' }] },
      { id: 'kitchen', label: 'Kitchen', pos: [-1.8, FLR, 1.7], yaw: yawTo([-1.8, 0, 1.7], [-4.3, 0, 3.0]), pitch: -0.1 },
      { id: 'living', label: 'Living room', pos: [-0.9, FLR, 0.3], yaw: yawTo([-0.9, 0, 0.3], [-4.9, 0, -1.6]), pitch: -0.05 },
      { id: 'backyard', label: 'Backyard', pos: [-2, 0, -12], yaw: Math.PI, pitch: 0.08 },
      { id: 'tower', label: "Bird's-eye view", pos: tower, yaw: yawTo(tower, [2, 0, 4]), pitch: -0.35,
        markers: [{ pos: [-7, 0, 18.5], label: "Climb the tower: bird's-eye view" }] },
    ];

    const tDir = new THREE.Vector3(2 - tower[0], 0, 4 - tower[2]).normalize();
    const hotspots = [
      { id: 'assembly', title: '27 steps', pos: [-6.6, 3.0, 6.4],
        text: 'Levitt and Sons split building into 27 steps. Specialized crews moved from lot to lot, each doing one job, like an assembly line where the workers move instead of the product. At the peak they finished about 30 houses a day, and more than 17,000 in Levittown, New York.' },
      { id: 'slab', title: 'No basement', pos: [-2.8, 0.9, -2.6],
        text: 'The house sits on a concrete slab instead of a basement. Copper pipes inside the slab carry hot water to heat the floor. Skipping the basement saved time and money on every single house.' },
      { id: 'kitchen', title: 'Kitchen up front', pos: [-3.3, 2.05, 3.0],
        text: 'The kitchen faces the street, so a parent cooking could watch children playing out front. The plan was designed around the 1950s idea of the nuclear family.' },
      { id: 'appliances', title: 'Appliances included', pos: [-4.0, 2.2, 1.3],
        text: 'The refrigerator, stove, and Bendix washing machine came with the house. The 1949 ranch sold for about $7,990. Thanks to the GI Bill, many veterans paid nothing down and about $58 a month.' },
      { id: 'tv', title: 'Built-in TV', pos: [-4.2, 2.1, -0.5],
        text: 'The 1950 model even had a television built into the wall. TV spread the same shows, ads, and trends to millions of homes at once, a big reason popular culture spread so fast.' },
      { id: 'picture', title: 'Picture window', pos: [-2.3, 2.6, -3.2],
        text: 'The big picture window faces the private backyard, not the street. Family life turned inward, toward the backyard, instead of toward the front porch and the neighbors.' },
      { id: 'car', title: 'The carport', pos: [6.5, 3.3, 2.0],
        text: 'Suburbs like Levittown were built around the car. Most residents drove to jobs in the city and drove to shop. Car-dependent suburbs spread out, and that pattern is called urban sprawl.' },
      { id: 'rules', title: 'Rules for every yard', pos: [1.5, 1.9, -9],
        text: 'Levittown had strict rules: no fences, mow the lawn every week, and no laundry hanging outside on weekends. The rules kept every lot looking the same.' },
      { id: 'same', title: 'Same house, every lot', pos: [tower[0] + tDir.x * 5, tower[1] + 1.2, tower[2] + tDir.z * 5],
        text: 'Look down the street: the same house, again and again, with only the paint color changed. Popular housing is standardized and could be built almost anywhere. Its look comes from mass production, not from the local environment or local traditions.' },
      { id: 'covenant', title: 'Who could live here?', pos: [-7.5, 3.0, 8.6],
        text: 'Levittown\'s early leases said homes could not be used or occupied by "any person other than members of the Caucasian race." Levitt kept refusing to sell to Black families even after the Supreme Court ruled in 1948 that courts could not enforce such rules. Discrimination shaped who could move to the suburbs.' },
    ];

    return {
      root, occluders: [house], stages, viewpoints, hotspots,
      fog: { color: '#e4ecf2', near: 120, far: 650 },
      light: { sky: '#e0ecfa', ground: '#6b7a50', hemi: 1.5, sunColor: '#fff4e0', sun: 2.6, sunDir: [-0.45, 1, 0.7], shadowSize: 18 },
    };
  },
};

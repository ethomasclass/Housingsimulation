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
    let towerG;
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
      towerG = p.build({ center: false });
      env.add(towerG);
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

    // ------------------------------------------------------------ floor plan
    // Laid out from the 1949 Levitt ranch sales-brochure plan (32' x 25').
    // PX(v): feet along the 32' side, from the bedroom end (west) to the kitchen end (east).
    // PZ(u): feet across the 25' side, from the rear window wall to the street-side front wall.
    const PX = v => X0 + v * (X1 - X0) / 32;
    const PZ = u => ZB + u * (ZF - ZB) / 25;
    const doorH = FLR + 2.05;

    // ------------------------------------------------------------ openings (shared by framing, walls, linings)
    const O = {
      front: [                                                                     // street side
        { from: PX(7.2), to: PX(11.4), y0: FLR + 0.95, y1: FLR + 2.1 },             // small bedroom
        { from: PX(13.6), to: PX(16.4), y0: FLR + 1.45, y1: FLR + 2.1 },            // bathroom (high)
        { from: PX(21.3), to: PX(27.4), y0: FLR + 1.0, y1: FLR + 2.1 },             // kitchen
        { from: PX(29.0), to: PX(31.4), y0: FLR, y1: doorH },                       // front door, into the kitchen
      ],
      back: [                                                                      // backyard side
        { from: PX(1.2), to: PX(5.6), y0: FLR + 0.95, y1: FLR + 2.1 },              // big bedroom
        { from: PX(12.6), to: PX(15.2), y0: FLR, y1: doorH },                       // back door at the stairs
        { from: PX(16.4), to: PX(31.4), y0: FLR + 0.3, y1: FLR + 2.25 },            // Thermopane window wall
      ],
      east: [],
      west: [
        { from: PZ(1.0), to: PZ(4.8), y0: FLR + 0.95, y1: FLR + 2.1 },              // big bedroom
        { from: PZ(17.4), to: PZ(21.4), y0: FLR + 0.95, y1: FLR + 2.1 },            // small bedroom
      ],
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
      frame('x', X0, -1.2, ZF, split(O.front, X0, -1.2)), frame('x', -1.2, 1.0, ZF, split(O.front, -1.2, 1.0)), frame('x', 1.0, X1, ZF, split(O.front, 1.0, X1)),
      frame('z', ZB, ZF, X1, O.east),
      frame('x', -0.1, X1, ZB, split(O.back, -0.1, X1)), frame('x', -1.6, -0.1, ZB, split(O.back, -1.6, -0.1)), frame('x', X0, -1.6, ZB, split(O.back, X0, -1.6)),
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
    // Thermopane window wall: mullions split it into tall panes
    for (const v of [20.2, 24, 27.7]) windows.block(PX(v) - 0.03, FLR + 0.3, ZB - 0.13, PX(v) + 0.03, FLR + 2.25, ZB - 0.07, M.trim);
    windows.block(PX(29), FLR, ZF + 0.02, PX(31.4), doorH, ZF + 0.07, M.door);       // front door
    windows.box(0.05, 0.05, 0.08, PX(29.4), FLR + 1.0, ZF + 0.1, M.chrome);
    windows.block(PX(12.6), FLR, ZB - 0.07, PX(15.2), doorH, ZB - 0.02, M.door);     // back door
    for (const [a, b] of [[PX(7.2), PX(11.4)], [PX(21.3), PX(27.4)]]) {              // shutters
      windows.block(a - 0.5, FLR + 0.95, ZF + 0.1, a - 0.1, FLR + 2.15, ZF + 0.14, M.shutter);
      windows.block(b + 0.1, FLR + 0.95, ZF + 0.1, b + 0.5, FLR + 2.15, ZF + 0.14, M.shutter);
    }
    windows.block(PX(28.3), 0, ZF + 0.1, X1 + 0.5, FLR - 0.02, ZF + 1.1, M.concrete);   // front stoop
    windows.block(PX(12), 0, ZB - 1.0, PX(16), FLR - 0.02, ZB - 0.1, M.concrete);        // back stoop
    const windowsG = add(windows);

    // ------------------------------------------------------------ 7. shingles, chimney, gutters
    const shingles = roofSlab(M.roof, 0.11, 0.05);
    const chimney = new Part('chimney');
    // the double fireplace sits in the middle of the house, so the chimney rises through the ridge
    chimney.block(PX(24.6), WT, PZ(12.2), PX(27.3), RIDGE + 0.8, PZ(14.7), M.brick);
    chimney.block(PX(24.4), RIDGE + 0.7, PZ(12.0), PX(27.5), RIDGE + 0.85, PZ(14.9), M.concrete);
    for (const s of [1, -1]) {
      const z = s * (ZF + EAVE + 0.05), y = WT - EAVE * Math.tan(PITCH) - 0.05;
      chimney.block(X0 - GOVER, y - 0.08, z - 0.06, X1 + GOVER, y + 0.04, z + 0.06, M.trim);
    }
    const chimneyG = add(chimney);

    // ------------------------------------------------------------ 8. inside
    const inside = new Part('inside');
    const zHall0 = PZ(12), zHall1 = PZ(16.7), xBed = PX(12);      // bedroom wing
    const zBath = PZ(16.9), xBathE = PX(17.9);                     // bathroom
    const xStairE = PX(15.8);                                      // stair enclosure
    const core = { x0: PX(18.2), x1: PX(28.3), z0: PZ(12.2), z1: PZ(14.7), heat: PX(20.2), fire: PX(23.6) };
    inside.block(X0 + 0.05, FLR, ZB + 0.05, X1 - 0.05, FLR + 0.01, ZF - 0.05, M.tile);
    inside.block(xBathE + 0.05, FLR + 0.01, core.z1, X1 - 0.05, FLR + 0.015, ZF - 0.05, M.lino);
    inside.block(X0, WT - 0.04, ZB, X1, WT, ZF, mat('#f2ece0', { emissive: '#45403a' }));   // ceiling
    // linings inside the outer walls
    const lineFront = (a, b, m) => inside.wall('x', a, b, ZF - 0.04, FLR, WT - 0.04, 0.02, m, O.front.filter(o => o.from >= a && o.to <= b));
    lineFront(X0, xBathE, M.plaster); lineFront(xBathE, X1, M.kitchenWall);
    inside.wall('x', X0, X1, ZB + 0.04, FLR, WT - 0.04, 0.02, M.plaster, O.back);
    inside.wall('z', ZB, core.z1, X1 - 0.04, FLR, WT - 0.04, 0.02, M.plaster, O.east);
    inside.wall('z', core.z1, ZF, X1 - 0.04, FLR, WT - 0.04, 0.02, M.kitchenWall, O.east);
    inside.wall('z', ZB, ZF, X0 + 0.04, FLR, WT - 0.04, 0.02, M.plaster, O.west);
    // interior walls
    const iw = (axis, a, b, f, ops, m = M.plaster) => inside.wall(axis, a, b, f, FLR, WT - 0.04, 0.1, m, ops);
    const door = (a, b) => ({ from: a, to: b, y0: FLR, y1: doorH });
    iw('x', X0, xBed, zHall0, [door(PX(8.8), PX(11.2))]);          // big bedroom / hall
    iw('x', X0, xBed, zHall1, [door(PX(8.8), PX(11.2))]);          // small bedroom / hall
    iw('z', ZB, zHall0, xBed, []);                                 // big bedroom / stairs
    iw('z', zHall1, ZF, xBed, []);                                 // small bedroom / bath
    iw('x', xBed, xBathE, zBath, [door(PX(13.4), PX(15.6))]);      // hall / bath
    iw('z', zBath, ZF, xBathE, [], M.kitchenWall);                 // bath / kitchen
    iw('z', ZB + 0.5, PZ(10), xStairE, [{ from: PZ(4.6), to: PZ(6.9), y0: FLR + 0.45, y1: FLR + 1.15 }]);  // stair wall, TV niche
    iw('z', PZ(21.3), ZF, core.x1, []);                            // entry vestibule
    // closets between the bedrooms
    inside.block(X0 + 0.04, FLR, zHall0 + 0.05, PX(8.4), WT - 0.04, zHall1 - 0.05, M.plaster);
    for (const [a, b] of [[zHall0 + 0.12, (zHall0 + zHall1) / 2 - 0.03], [(zHall0 + zHall1) / 2 + 0.03, zHall1 - 0.12]]) inside.block(PX(8.4), FLR + 0.05, a, PX(8.4) + 0.03, doorH, b, M.wood);
    // stair closet
    inside.block(xBed + 0.05, FLR, PZ(10), xStairE + 0.05, WT - 0.04, zHall0 - 0.05, M.plaster);
    inside.block(xStairE + 0.05, FLR + 0.05, PZ(10) + 0.1, xStairE + 0.08, doorH, zHall0 - 0.12, M.wood);
    // stairs up to the unfinished "expansion" attic
    {
      const n = 12, z0 = ZB + 0.5, z1 = PZ(10);
      for (let i = 0; i < n; i++) {
        const za = z0 + (z1 - z0) * (i / n), zb = z0 + (z1 - z0) * ((i + 1) / n);
        inside.block(xBed + 0.06, FLR, za, xStairE - 0.06, FLR + (WT - FLR) * ((i + 1) / n), zb, M.wood);
      }
    }
    // utility core: washer, radiant-heat boiler, double fireplace
    inside.block(core.x0, FLR, core.z0, core.x1, WT - 0.04, core.z0 + 0.06, M.plaster);
    inside.block(core.x0, FLR + 1.15, core.z0, core.heat, WT - 0.04, core.z1, M.cabinet);
    inside.block(core.heat, FLR, core.z0, core.fire, WT - 0.04, core.z1 - 0.04, M.plaster);
    inside.block(core.heat + 0.06, FLR + 0.05, core.z1 - 0.04, core.fire - 0.06, doorH, core.z1, M.wood);
    inside.block(core.fire, FLR, core.z0, core.x1, WT - 0.04, core.z1, M.brick);
    const fx = (core.fire + core.x1) / 2;
    for (const [zFace, s] of [[core.z0, -1], [core.z1, 1]]) {
      inside.block(fx - 0.38, FLR + 0.05, zFace - 0.01, fx + 0.38, FLR + 0.72, zFace + 0.01 * s, M.black);
      inside.block(core.fire - 0.05, FLR + 1.1, zFace, core.x1 + 0.05, FLR + 1.17, zFace + s * 0.16, M.wood);   // mantel
      inside.block(core.fire - 0.1, FLR, zFace, core.x1 + 0.1, FLR + 0.05, zFace + s * 0.45, M.brick);           // hearth
    }
    // movable storage wall between kitchen and living room (swung partly open)
    inside.box(1.05, 1.95, 0.42, core.x1 + 0.6, FLR + 0.98, (core.z0 + core.z1) / 2 - 0.15, M.wood, [0, 0.35, 0]);
    const insideG = add(inside);

    const kitchen = new Part('kitchen');
    const kx = xBathE + 0.04;
    // counter along the bathroom wall, with the sink, stove and refrigerator
    kitchen.block(kx, FLR, PZ(19.4), kx + 0.6, FLR + 0.9, PZ(22.8), M.cabinet);
    kitchen.block(kx, FLR + 0.9, PZ(19.4), kx + 0.63, FLR + 0.95, PZ(22.8), M.counter);
    kitchen.block(kx + 0.1, FLR + 0.9, PZ(20.4), kx + 0.5, FLR + 0.955, PZ(22.0), M.chrome);
    kitchen.cyl(0.02, 0.25, kx + 0.05, FLR + 1.07, PZ(21.2), M.chrome, null, 6);
    kitchen.block(kx, FLR + 1.5, PZ(17.2), kx + 0.35, FLR + 2.25, PZ(22.8), M.cabinet);              // wall cabinets
    kitchen.block(kx, FLR, PZ(17.3), kx + 0.65, FLR + 0.92, PZ(19.3), M.enamel);                      // stove
    kitchen.block(kx, FLR + 0.92, PZ(17.3), kx + 0.1, FLR + 1.25, PZ(19.3), M.enamel);
    for (const [dx, dz] of [[0.2, 0.18], [0.2, -0.18], [0.45, 0.18], [0.45, -0.18]]) kitchen.cyl(0.09, 0.02, kx + dx, FLR + 0.93, PZ(18.3) + dz, M.black, null, 10);
    kitchen.block(kx, FLR, PZ(22.9), kx + 0.68, FLR + 1.6, ZF - 0.08, M.enamel);                       // refrigerator
    kitchen.box(0.68, 0.12, 0.6, kx + 0.34, FLR + 1.63, (PZ(22.9) + ZF - 0.08) / 2, M.enamel);
    kitchen.box(0.04, 0.3, 0.04, kx + 0.71, FLR + 1.15, PZ(23.2), M.chrome);
    // Bendix washing machine in the utility core
    kitchen.block(core.x0 + 0.04, FLR, core.z0 + 0.08, core.heat - 0.04, FLR + 0.9, core.z1, M.enamel);
    kitchen.add(new THREE.TorusGeometry(0.16, 0.03, 6, 16), M.chrome, [(core.x0 + core.heat) / 2, FLR + 0.48, core.z1 + 0.01]);
    kitchen.add(new THREE.CircleGeometry(0.14, 16), mat('#7d97a3'), [(core.x0 + core.heat) / 2, FLR + 0.48, core.z1 + 0.012]);
    // small table and chairs
    kitchen.block(PX(22.5), FLR + 0.72, PZ(16.5), PX(25.5), FLR + 0.76, PZ(19), M.counter);
    kitchen.cyl(0.03, 0.72, PX(24), FLR + 0.36, PZ(17.75), M.chrome, null, 6);
    for (const x of [PX(21.6), PX(26.4)]) { kitchen.block(x - 0.2, FLR + 0.42, PZ(17) , x + 0.2, FLR + 0.47, PZ(18.5), M.counter); kitchen.block(x - 0.2, FLR, PZ(17.7), x + 0.2, FLR + 0.42, PZ(17.8), M.chrome); }
    const kitchenG = add(kitchen);

    const living = new Part('living');
    // built-in television under the stairs (1950 model)
    living.block(xStairE - 0.06, FLR + 0.45, PZ(4.6), xStairE + 0.02, FLR + 1.15, PZ(6.9), M.wood);
    living.block(xStairE + 0.02, FLR + 0.53, PZ(4.8), xStairE + 0.03, FLR + 1.07, PZ(6.7), M.tv);
    // sofa with its back to the window wall, facing the fireplace
    living.block(PX(21), FLR, ZB + 0.35, PX(27.5), FLR + 0.45, ZB + 1.15, M.sofa);
    living.block(PX(21), FLR + 0.45, ZB + 0.35, PX(27.5), FLR + 0.9, ZB + 0.6, M.sofa);
    living.block(PX(21), FLR + 0.45, ZB + 0.35, PX(21) + 0.22, FLR + 0.65, ZB + 1.15, M.sofa);
    living.block(PX(27.5) - 0.22, FLR + 0.45, ZB + 0.35, PX(27.5), FLR + 0.65, ZB + 1.15, M.sofa);
    // armchair facing the TV, coffee table, lamp, rug, curtains
    living.block(PX(18.5), FLR, PZ(5), PX(21), FLR + 0.42, PZ(7.6), M.chair);
    living.block(PX(20.3), FLR + 0.42, PZ(5), PX(21), FLR + 0.9, PZ(7.6), M.chair);
    living.block(PX(22.5), FLR + 0.38, PZ(5.2), PX(26), FLR + 0.43, PZ(7.2), M.wood);
    for (const [x, z] of [[PX(22.7), PZ(5.4)], [PX(25.8), PZ(5.4)], [PX(22.7), PZ(7)], [PX(25.8), PZ(7)]]) living.block(x - 0.02, FLR, z - 0.02, x + 0.02, FLR + 0.38, z + 0.02, M.wood);
    living.cyl(0.015, 1.4, PX(29.5), FLR + 0.7, ZB + 0.45, M.chrome, null, 6);
    living.cyl(0.12, 0.25, PX(29.5), FLR + 1.45, ZB + 0.45, M.curtain, null, 10, 0.18);
    living.add(new THREE.BoxGeometry(2.6, 0.01, 2.0), M.rug, [PX(24.2), FLR + 0.016, PZ(6.2)]);
    for (const x of [PX(16.2), PX(31.5)]) living.block(x - 0.16, FLR + 0.3, ZB + 0.06, x + 0.16, WT - 0.15, ZB + 0.12, M.curtain);
    const livingG = add(living);

    const rooms = new Part('bedrooms');
    // big bedroom (12' x 12'): double bed, dresser
    rooms.block(X0 + 0.06, FLR, PZ(5.2), X0 + 2.0, FLR + 0.5, PZ(10), M.bed);
    rooms.block(X0 + 0.06, FLR, PZ(5.2), X0 + 0.2, FLR + 1.0, PZ(10), M.wood);
    rooms.block(X0 + 0.5, FLR + 0.5, PZ(5.2), X0 + 2.0, FLR + 0.55, PZ(10), M.blanket);
    rooms.block(PX(6.4), FLR, ZB + 0.06, PX(10), FLR + 1.1, ZB + 0.5, M.wood);
    // small bedroom (8' x 12'): single bed
    rooms.block(X0 + 0.06, FLR, PZ(22), X0 + 2.0, FLR + 0.5, ZF - 0.08, M.bed);
    rooms.block(X0 + 0.06, FLR, PZ(22), X0 + 0.2, FLR + 1.0, ZF - 0.08, M.wood);
    rooms.block(X0 + 0.5, FLR + 0.5, PZ(22), X0 + 2.0, FLR + 0.55, ZF - 0.08, mat('#b5654a'));
    // bathroom: tub under the window, toilet and sink on the kitchen wall
    rooms.block(xBed + 0.06, FLR, ZF - 0.75, xBathE - 0.06, FLR + 0.55, ZF - 0.06, M.enamel);
    rooms.block(xBed + 0.2, FLR + 0.3, ZF - 0.62, xBathE - 0.2, FLR + 0.56, ZF - 0.2, mat('#bcd6e0'));
    rooms.block(xBathE - 0.25, FLR, PZ(18.6), xBathE - 0.06, FLR + 0.8, PZ(19.9), M.enamel);
    rooms.block(xBathE - 0.6, FLR, PZ(18.8), xBathE - 0.25, FLR + 0.42, PZ(19.7), M.enamel);
    rooms.block(xBathE - 0.45, FLR + 0.75, PZ(20.6), xBathE - 0.06, FLR + 0.9, PZ(22.2), M.enamel);
    const roomsG = add(rooms);

    const lampA = new THREE.PointLight('#fff1d6', 2.2, 8, 1.2); lampA.position.set(PX(24), 2.1, PZ(6));
    const lampB = new THREE.PointLight('#fff1d6', 1.8, 7, 1.2); lampB.position.set(PX(24), 2.1, PZ(19));
    const lampC = new THREE.PointLight('#fff1d6', 1.2, 7, 1.2); lampC.position.set(PX(6), 2.1, PZ(12));
    house.add(lampA, lampB, lampC);

    // ------------------------------------------------------------ 9. yard
    const drive = new Part('drive');
    drive.block(5.4, 0, -3.4, 7.6, 0.06, STREET[0] - 0.2, M.concrete);
    drive.block(X1 + 0.5, 0, ZF + 0.2, 5.45, 0.05, ZF + 1.0, M.concrete);
    const driveG = add(drive);
    const carport = new Part('carport');
    for (const z of [-3.3, 0, 3.4]) carport.block(7.62, 0, z - 0.06, 7.74, 2.55, z + 0.06, M.trim);
    carport.block(X1 + 0.1, 2.55, -3.6, 7.9, 2.66, 3.9, M.trim);
    carport.block(X1 + 0.1, 2.66, -3.6, 7.9, 2.7, 3.9, M.roof);
    const carportG = add(carport);
    const plants = new Part('plants');
    for (const x of [-4.3, -3.5, -0.4, 1.4, 2.7]) plants.add(new THREE.IcosahedronGeometry(0.42, 0), M.green, [x, 0.35, ZF + 0.6], [r(), r(), r()]);
    for (const [x, z] of [[-5, 7.2], [2.5, 7.4], [-3.6, -9.5]]) {
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
      skin: 'Siding, windows, and doors close in the house. Around back, the living room gets a whole wall of glass. It faces the backyard, not the street.',
      roofing: 'Shingles and a brick chimney finish the outside. Every house uses the same parts, made in the same factories.',
      inside: 'Inside: a kitchen at the front, a living room at the back, two bedrooms, one bathroom, and stairs to an attic you could finish later. It all came with a refrigerator, a stove, and a washing machine, for about eight thousand dollars.',
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
      { id: 'kitchen', label: 'Kitchen', pos: [PX(27.5), FLR, PZ(20)], yaw: yawTo([PX(27.5), 0, PZ(20)], [0.9, 0, 2.9]), pitch: -0.1 },
      { id: 'living', label: 'Living room', pos: [PX(30.5), FLR, PZ(4)], yaw: yawTo([PX(30.5), 0, PZ(4)], [-0.06, 0, -1.2]), pitch: -0.05 },
      { id: 'hall', label: 'Hallway', pos: [PX(14), FLR, PZ(14.4)], yaw: yawTo([PX(14), 0, PZ(14.4)], [-2.4, 0, 0.6]), pitch: 0 },
      { id: 'bedroom', label: 'Bedroom', pos: [PX(9.5), FLR, PZ(3.5)], yaw: yawTo([PX(9.5), 0, PZ(3.5)], [-4.9, 0, -1.6]), pitch: -0.05 },
      { id: 'backyard', label: 'Backyard', pos: [2.2, 0, -11.5], yaw: Math.PI, pitch: 0.08 },
      { id: 'tower', label: "Bird's-eye view", pos: tower, yaw: yawTo(tower, [2, 0, 4]), pitch: -0.35,
        markers: [{ pos: [-7, 0, 18.5], label: "Climb the tower: bird's-eye view" }] },
    ];

    const tDir = new THREE.Vector3(2 - tower[0], 0, 4 - tower[2]).normalize();
    const hotspots = [
      { id: 'assembly', title: '27 steps', pos: [-6.6, 3.0, 6.4],
        text: 'Levitt and Sons split building into 27 steps. Specialized crews moved from lot to lot, each doing one job, like an assembly line where the workers move instead of the product. At the peak they finished about 30 houses a day, and more than 17,000 in Levittown, New York.' },
      { id: 'kitchen', title: 'Kitchen up front', pos: [PX(22.5), 2.2, ZF - 0.35],
        text: 'The front door opens almost straight into the kitchen. Groceries did not have to travel far, and a parent at the counter could watch children playing out front. The plan was built around the 1950s idea of the nuclear family.' },
      { id: 'slab', title: 'No basement', pos: [PX(21), 0.9, PZ(9.6)],
        text: 'The house sits on a concrete slab instead of a basement. Copper pipes inside the slab carry hot water to heat the floor. Skipping the basement saved time and money on every single house.' },
      { id: 'appliances', title: 'Appliances included', pos: [kx + 0.45, 2.4, PZ(18.3)],
        text: 'The refrigerator, stove, and Bendix washing machine came with the house. The 1949 ranch sold for about $7,990. Thanks to the GI Bill, many veterans paid almost nothing down and about $58 a month.' },
      { id: 'core', title: 'Double fireplace', pos: [fx, 2.05, core.z0 - 0.55],
        text: 'One fireplace opens to both the living room and the kitchen. Behind the same brick core sit the washing machine and the boiler that sends hot water through the floor pipes. Grouping the plumbing and heating in one spot made every house faster to build.' },
      { id: 'storage', title: 'Storage wall', pos: [core.x1 + 0.6, 2.4, 0.15],
        text: 'Instead of a fixed wall, a tall cabinet on a pivot divides the kitchen from the living room. Families could swing it to open up the space or close it off.' },
      { id: 'attic', title: 'Room to grow', pos: [PX(14), 2.25, PZ(4.5)],
        text: 'These stairs lead to an unfinished attic. Levitt sold it as room for expansion, so a growing family could add bedrooms later, often doing the work themselves.' },
      { id: 'tv', title: 'Built-in TV', pos: [xStairE + 0.5, 1.7, PZ(5.75)],
        text: 'Starting with the 1950 model, a television was built in under the stairs. TV spread the same shows, ads, and trends to millions of homes at once, a big reason popular culture spread so fast.' },
      { id: 'picture', title: 'Window wall', pos: [PX(18.6), 2.55, ZB + 0.5],
        text: 'The whole back of the living room is a wall of Thermopane glass facing the private backyard, not the street. Family life turned inward, toward the backyard, instead of toward the front porch and the neighbors.' },
      { id: 'car', title: 'The carport', pos: [6.5, 3.3, 2.0],
        text: 'Suburbs like Levittown were built around the car. Most residents drove to jobs in the city and drove to shop. Car-dependent suburbs spread out, and that pattern is called urban sprawl.' },
      { id: 'rules', title: 'Rules for every yard', pos: [-1.8, 1.9, -8.2],
        text: 'Levittown had strict rules: no fences, mow the lawn every week, and no laundry hanging outside on weekends. The rules kept every lot looking the same.' },
      { id: 'same', title: 'Same house, every lot', pos: [tower[0] + tDir.x * 5, tower[1] + 1.2, tower[2] + tDir.z * 5],
        text: 'Look down the street: the same house, again and again, with only the paint color changed. Popular housing is standardized and could be built almost anywhere. Its look comes from mass production, not from the local environment or local traditions.' },
      { id: 'covenant', title: 'Who could live here?', pos: [-7.5, 3.0, 8.6],
        text: 'Levittown\'s early leases said homes could not be used or occupied by "any person other than members of the Caucasian race." Levitt kept refusing to sell to Black families even after the Supreme Court ruled in 1948 that courts could not enforce such rules. Discrimination shaped who could move to the suburbs.' },
    ];

    return {
      root, occluders: [house], colliders: neighbours, ground: [towerG], stages, viewpoints, hotspots,
      fog: { color: '#e4ecf2', near: 120, far: 650 },
      light: { sky: '#e0ecfa', ground: '#6b7a50', hemi: 1.5, sunColor: '#fff4e0', sun: 2.6, sunDir: [-0.45, 1, 0.7], shadowSize: 18 },
    };
  },
};

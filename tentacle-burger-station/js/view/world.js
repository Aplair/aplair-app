/* The station: floors, walls, airlocks, stations, counters, tables, desks, the Wing 2 door with the peeking alien.
   Only simple shapes (boxes, cylinders, spheres) with flat colours. */
(function (TBS) {
  'use strict';

  const B = TBS.B, U = TBS.U;
  const C = () => TBS.CONFIG.COLORS;
  const LEVEL_ACCENT = [0xff7a2a, 0xffc02a, 0x2fe0c8, 0xff5ab4, 0xffffff]; // machine top colour per upgrade level
  const TABLE_TOP = [0xf3f5f8, 0xfff3d6, 0xd8f5ff, 0xffe3f1, 0xfff1a8];     // table top per tables upgrade level
  const TABLE_CLOTH = [0xffffff, 0xff8a8a, 0x6fc3ff, 0xc28aff, 0xffd23a];   // tablecloth per level (none at level 1)
  const FACE_HALL = -Math.PI / 2; // stations are modelled facing +x; this turns them to face the hall (+z) from the back wall
  const COUNTER_TOP = [0xe0a05a, 0xd98a3a, 0x3fbfa8, 0x6a8aff, 0xffd23a];   // counter top per storage level

  class World {
    constructor(view) {
      this.view = view; this.game = view.game; this.cfg = view.game.cfg; this.scene = view.scene;
      this.occluders = [];       // {obj, box: Box3}
      this.w2mats = [];          // materials that are dark until Wing 2 lights up
      this.pop = {};             // objects that appear later
      this.squash = {};          // machine id -> {obj, t}
      this.machineLook = {};     // machine id -> {mats, lamps, level}
      this.airlocks = [];
      this.time = 0;
      this.knockT = 4;
      this.revealDone = false;
      this.build();
    }

    // walls, floors, rails... that never move or change: kept aside and merged per wing into ONE mesh after build()
    addStatic(mesh, wing) { this.statics[wing].push(mesh); return mesh; }
    mergeStatics() {
      for (const wing of [1, 2]) {
        const list = this.statics[wing];
        if (!list.length) continue;
        const mesh = new THREE.Mesh(B.mergeMeshes(list), wing === 2 ? this.w2shared : B.mat.vc);
        for (const m of list) m.geometry.dispose();
        this.scene.add(mesh);
      }
      this.statics = null;
    }

    w2mat() { const m = new THREE.MeshLambertMaterial({ vertexColors: true, color: 0x3a4250 }); this.w2mats.push(m); return m; }

    add(obj, occluder) {
      this.scene.add(obj);
      if (occluder) this.addOccluder(obj);
      return obj;
    }
    addOccluder(obj) { obj.updateMatrixWorld(true); this.occluders.push({ obj: obj, box: new THREE.Box3().setFromObject(obj) }); }

    build() {
      const L = this.cfg.LAYOUT, col = C();
      this.statics = { 1: [], 2: [] };
      this.w2shared = this.w2mat(); // one dark-until-lit material for all merged Wing 2 walls / floor
      this.buildFloor(L.WING1, L.W1, col.floor1a, col.floor1b, 0xd9cdea, 0xcfc1e3, 1);
      this.buildFloor(L.WING2, L.W2, col.floor2a, col.floor2b, 0xcfdcf3, 0xc2d1ec, 2);
      this.buildWalls();
      this.buildPartition();
      this.buildStations();
      this.buildFurniture();
      this.buildStars();
      this.mergeStatics();
      this.applyState(true);
    }

    // kitchen tiles grey-blue, the two rooms warm, the hall (dining) tinted
    buildFloor(W, def, a, b, ca, cb, wing) {
      const parts = [], plane = new THREE.PlaneGeometry(0.96, 0.96), strip = this.cfg.LAYOUT.STRIP, rooms = def.rooms;
      for (let x = W.x0; x < W.x1; x++) for (let z = W.z0; z < W.z1; z++) {
        const odd = (x + z) % 2 === 1, hall = z + 0.5 > strip, room = !hall && x + 0.5 < rooms.kitchen.x0;
        const c = hall ? (odd ? cb : ca) : room ? (odd ? 0xe6d6c4 : 0xeee0cf) : (odd ? b : a);
        parts.push({ g: plane, c: c, p: [x + 0.5, 0.001, z + 0.5], r: [-Math.PI / 2, 0, 0] });
      }
      const w = W.x1 - W.x0, d = W.z1 - W.z0;
      parts.push({ g: B.box(w, 0.4, d), c: 0x8792a6, p: [W.x0 + w / 2, -0.2, W.z0 + d / 2] });
      parts.push({ g: B.box(w + 0.02, 0.08, 0.08), c: 0xf2c230, p: [W.x0 + w / 2, -0.04, W.z1 + 0.02] });
      return this.addStatic(B.mesh(parts, { cast: false, receive: true }), wing);
    }

    // outer hull: tall back + left walls with windows, low rail on the front with one entrance gate per wing,
    // and the LOW inner walls of the back strip (rooms + kitchen) so you can look inside
    buildWalls() {
      const L = this.cfg.LAYOUT, col = C(), H = L.WALL_H, t = 0.3, X1 = L.WING2.x1, mid = L.WING2.x0, D = L.WING1.z1;
      for (const s of [[0, mid, 1], [mid, X1, 2]]) {
        const len = s[1] - s[0], cx = (s[0] + s[1]) / 2, parts = [];
        parts.push({ g: B.box(len, H, t), c: col.wall, p: [cx, H / 2, -t / 2] });
        parts.push({ g: B.box(len, 0.16, t + 0.04), c: col.stripe, p: [cx, 1.05, -t / 2] });
        parts.push({ g: B.box(len, 0.12, t + 0.14), c: 0xc8d0dc, p: [cx, H + 0.06, -t / 2] });
        for (let x = s[0] + 0.9; x < s[1] - 0.6; x += 2.4) {
          parts.push({ g: B.box(1.2, 0.75, 0.04), c: 0x16204a, p: [x + 0.3, 1.8, 0.01] });
          parts.push({ g: B.box(1.32, 0.08, 0.06), c: 0xaab4c4, p: [x + 0.3, 2.2, 0.02] });
          parts.push({ g: B.sph(0.025, 4, 3), c: 0xffffff, p: [x + 0.05, 1.95, 0.04] });
          parts.push({ g: B.sph(0.02, 4, 3), c: 0xfff3b0, p: [x + 0.6, 1.62, 0.04] });
        }
        this.addStatic(B.mesh(parts, { receive: true }), s[2]);
      }
      {
        const parts = [];
        parts.push({ g: B.box(t, H, D), c: col.wall, p: [-t / 2, H / 2, D / 2] });
        parts.push({ g: B.box(t + 0.04, 0.16, D), c: col.stripe, p: [-t / 2, 1.05, D / 2] });
        parts.push({ g: B.box(t + 0.14, 0.12, D), c: 0xc8d0dc, p: [-t / 2, H + 0.06, D / 2] });
        for (let z = 1.2; z < D - 0.6; z += 2.4) {
          parts.push({ g: B.box(0.04, 0.6, 1.2), c: 0x16204a, p: [0.01, 2.0, z] });
          parts.push({ g: B.sph(0.025, 4, 3), c: 0xffffff, p: [0.04, 2.1, z - 0.3] });
        }
        parts.push({ g: B.box(0.5, H + 0.2, 0.5), c: 0xc8d0dc, p: [-0.1, (H + 0.2) / 2, -0.1] });
        this.addStatic(B.mesh(parts, { receive: true }), 1);
      }
      // low inner walls (rooms + kitchen), with a coloured top band per room
      [L.W1, L.W2].forEach((w, i) => {
        const parts = [], h = L.INNER_WALL_H;
        for (const r of w.walls) {
          const lx = r.x1 - r.x0, lz = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
          parts.push({ g: B.box(lx, h, lz), c: 0xeef1f6, p: [cx, h / 2, cz] });
          parts.push({ g: B.box(lx + 0.04, 0.1, lz + 0.04), c: i ? col.blue : col.purple, p: [cx, h + 0.05, cz] });
        }
        // door frames (posts) at every gap of the front wall
        const fz = L.STRIP;
        for (const r of w.walls) if (r.z1 - r.z0 < 0.5) for (const x of [r.x0, r.x1]) parts.push({ g: B.box(0.16, h + 0.35, 0.3), c: 0x9aa3b0, p: [x, (h + 0.35) / 2, fz] });
        this.addStatic(B.mesh(parts, { receive: true }), i + 1);
      });
      // room signs over the doors
      const sign = (x, z, c, w2) => this.addStatic(B.mesh([{ g: B.box(1.1, 0.34, 0.06), c: c, p: [x, L.INNER_WALL_H + 0.55, z] }]), w2 ? 2 : 1);
      for (const [w, w2] of [[L.W1, false], [L.W2, true]]) { sign((w.rooms.hr.x0 + w.rooms.hr.x1) / 2, L.STRIP, col.worker, w2); sign((w.rooms.chef.x0 + w.rooms.chef.x1) / 2, L.STRIP, col.chef, w2); }
      // front rail with an entrance gate per wing (customers come in and leave here)
      {
        const parts = [], z = D + 0.12, rh = L.RAIL_H, gw = 2.4;
        const gaps = [L.W1.gate.x + 0.5, L.W2.gate.x + 0.5];
        let x0 = 0;
        for (const gx of gaps.concat([1e9])) {
          const x1 = Math.min(gx - gw / 2, X1);
          if (x1 > x0) {
            parts.push({ g: B.box(x1 - x0, 0.08, 0.1), c: 0xaab4c4, p: [(x0 + x1) / 2, rh, z] });
            for (let x = x0 + 0.5; x < x1; x += 2) parts.push({ g: B.box(0.1, rh, 0.1), c: 0x8a95a8, p: [x, rh / 2, z] });
          }
          x0 = gx + gw / 2;
        }
        parts.push({ g: B.box(0.1, 0.08, D), c: 0xaab4c4, p: [X1 + 0.12, rh, D / 2] });
        for (let zz = 0.5; zz < D; zz += 2) parts.push({ g: B.box(0.1, rh, 0.1), c: 0x8a95a8, p: [X1 + 0.12, rh / 2, zz] });
        this.addStatic(B.mesh(parts, { cast: false }), 1);
      }
      [L.W1, L.W2].forEach((w, i) => {
        const wing = i + 1, accent = wing === 1 ? col.purple : col.blue, gx = w.gate.x + 0.5, gw = 2.4, z = D + 0.12;
        const frame = [
          { g: B.box(0.25, 2.2, 0.3), c: 0x56607a, p: [gx - gw / 2, 1.1, z] }, { g: B.box(0.25, 2.2, 0.3), c: 0x56607a, p: [gx + gw / 2, 1.1, z] },
          { g: B.box(gw + 0.25, 0.3, 0.3), c: 0x56607a, p: [gx, 2.3, z] }, { g: B.box(gw + 0.27, 0.08, 0.32), c: accent, p: [gx, 2.12, z] }
        ];
        this.addStatic(B.mesh(frame), wing);
        const door = B.mesh([{ g: B.box(gw - 0.1, 0.12, 0.08), c: accent, p: [0, 0, 0] }, { g: B.box(gw - 0.1, 0.05, 0.1), c: 0xffffff, p: [0, -0.1, 0] }], { material: wing === 2 ? this.w2mat() : undefined });
        door.position.set(gx, 1.0, z);
        this.add(door);
        this.airlocks.push({ x: gx, z: D, door: door, open: 0, wing: wing }); // the gate bar lifts when an alien passes
      });
    }

    buildPartition() {
      const L = this.cfg.LAYOUT, col = C(), x = L.DOOR.x, h = L.BARRICADE_H;
      const striped = (z0, z1) => {
        const parts = [];
        let k = 0;
        for (let z = z0; z < z1 - 0.01; z += 0.45, k++) {
          const len = Math.min(0.45, z1 - z);
          parts.push({ g: B.box(0.26, h, len), c: k % 2 ? 0x2a2a2a : 0xf2c230, p: [x, h / 2, z + len / 2] });
        }
        parts.push({ g: B.box(0.32, 0.08, z1 - z0), c: 0x9aa3b0, p: [x, h + 0.04, (z0 + z1) / 2] });
        return parts;
      };
      this.addStatic(B.mesh(striped(0, L.OPENING.z0).concat(striped(L.OPENING.z1, L.WING1.z1)), { receive: true }), 1);
      const a = L.DOOR.z - L.DOOR.w / 2, b = L.DOOR.z + L.DOOR.w / 2;
      this.openPart = this.add(B.mesh(striped(L.OPENING.z0, a - 0.13).concat(striped(b + 0.13, L.OPENING.z1))));
      const frame = [
        { g: B.box(0.4, 2.9, 0.26), c: 0x4d566b, p: [x, 1.45, a] },
        { g: B.box(0.4, 2.9, 0.26), c: 0x4d566b, p: [x, 1.45, b] },
        { g: B.box(0.44, 0.34, b - a + 0.3), c: 0x4d566b, p: [x, 2.95, L.DOOR.z] },
        { g: B.box(0.46, 0.09, b - a + 0.32), c: col.blue, p: [x, 2.76, L.DOOR.z] },
        { g: B.box(0.42, 0.09, 0.28), c: col.blue, p: [x, 0.5, a] }, { g: B.box(0.42, 0.09, 0.28), c: col.blue, p: [x, 0.5, b] }
      ];
      this.doorFrame = this.add(B.mesh(frame, { own: true }), true);
      this.doorPanel = this.add(B.mesh([
        { g: B.box(0.16, 2.55, b - a - 0.08), c: 0x8d98ab, p: [0, 1.3, 0] },
        { g: B.cyl(0.3, 0.3, 0.2, 20), c: 0x0d1418, p: [0, 1.75, 0], r: [0, 0, Math.PI / 2] },
        { g: B.box(0.2, 0.12, b - a - 0.1), c: 0xf2c230, p: [0, 0.35, 0] },
        { g: B.box(0.2, 0.12, b - a - 0.1), c: 0x2a2a2a, p: [0, 0.23, 0] }
      ], { own: true }), true);
      this.doorPanel.position.set(x, 0, L.DOOR.z);
      // the blue alien peeking/knocking from the dark side (silhouette with glowing eyes)
      this.sil = new THREE.Group();
      this.silMat = new THREE.MeshLambertMaterial({ vertexColors: true, color: 0x10141c });
      const body = new THREE.Mesh(TBS.Characters.greenAlienGeometry(), this.silMat);
      body.castShadow = true;
      this.silBody = body;
      this.sil.add(body);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x8cc4ff });
      this.silEyes = new THREE.Mesh(B.merge([{ g: B.sph(0.09, 10, 8), c: 0xffffff, p: [-0.16, 1.55, 0.2] }, { g: B.sph(0.13, 10, 8), c: 0xffffff, p: [0.1, 1.62, 0.18] }, { g: B.sph(0.06, 8, 6), c: 0xffffff, p: [0.02, 1.32, 0.3] }]), eyeMat);
      this.sil.add(this.silEyes);
      this.silArm = new THREE.Mesh(B.merge([{ g: B.cyl(0.05, 0.08, 0.6, 8), c: col.blue, p: [0, -0.3, 0] }, { g: B.sph(0.09, 8, 6), c: col.blue, p: [0, -0.62, 0] }]), this.silMat);
      this.silArm.position.set(-0.28, 1.15, 0.05);
      this.sil.add(this.silArm);
      this.silBase = { x: x + 0.62, z: L.DOOR.z + 0.55 };
      this.sil.position.set(this.silBase.x, 0, this.silBase.z);
      this.sil.rotation.y = -Math.PI / 2 - 0.5;
      this.add(this.sil);
      // abandoned-look props (removed when Wing 2 opens)
      const props = [];
      const crate = (px, pz, s, ry) => { props.push({ g: B.box(s, s, s), c: 0x8a6a45, p: [px, s / 2, pz], r: [0, ry, 0] }); props.push({ g: B.box(s + 0.02, 0.06, s * 0.2), c: 0x5c4630, p: [px, s * 0.55, pz], r: [0, ry, 0] }); };
      const ox = L.WING2.x0; // positions inside the dark Wing 2 hall
      crate(ox + 4.0, 12.5, 0.7, 0.3); crate(ox + 4.05, 12.5, 0.5, 1.0); crate(ox + 19.5, 19.0, 0.8, 0.5); crate(ox + 9.0, 21.0, 0.6, 0.2); crate(ox + 13.0, 15.5, 0.55, 0.8);
      props.push({ g: B.cyl(0.02, 0.02, 1.4, 4), c: 0x222222, p: [ox + 10.5, 1.9, 12.2], r: [0.3, 0, 0.2] });
      this.darkProps = this.add(B.mesh(props, { material: this.w2mat() }));
      this.lamp = new THREE.Mesh(B.sph(0.16, 12, 10), new THREE.MeshBasicMaterial({ color: 0x333a44 }));
      this.lamp.position.set(ox + 10.7, 1.3, 12.6);
      this.add(this.lamp);
    }

    // body against the wall, output tray sticking out toward the camera side (+x); lamps on top show the level
    machineMesh(accent, glow) {
      const col = C();
      const g = new THREE.Group();
      const body = B.mesh([
        { g: B.box(1.25, 1.3, 2.8), c: 0xd7dde6, p: [-0.425, 0.65, 0] },
        { g: B.box(0.06, 0.5, 1.0), c: 0x1b2233, p: [0.21, 0.95, -0.35] },
        { g: B.box(0.05, 0.12, 0.85), c: glow, p: [0.23, 0.82, -0.35] },
        { g: B.box(1.0, 0.08, 1.3), c: 0x9aa3b0, p: [-0.42, 1.34, -0.65] },
        { g: B.cyl(0.13, 0.13, 0.55, 10), c: 0x8a93a3, p: [-0.6, 1.7, 0.85] },
        { g: B.box(0.95, 0.1, 1.35), c: 0xaab3c2, p: [0.62, 0.72, 0.8] },
        { g: B.box(0.95, 0.68, 0.1), c: 0xc4ccd8, p: [0.62, 0.36, 0.17] },
        { g: B.box(0.95, 0.68, 0.1), c: 0xc4ccd8, p: [0.62, 0.36, 1.43] },
        { g: B.box(0.08, 0.2, 1.35), c: 0x8a93a3, p: [1.07, 0.84, 0.8] },
        { g: B.box(0.2, 0.25, 0.25), c: col.money, p: [0.22, 1.12, -1.05] }
      ], { own: true });
      const topMat = new THREE.MeshLambertMaterial({ color: accent });
      const top = new THREE.Mesh(B.box(1.3, 0.18, 2.85), topMat);
      top.position.set(-0.425, 1.35, 0);
      top.castShadow = true;
      const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff3a0 });
      const lamps = [];
      for (let i = 0; i < 5; i++) {
        const l = new THREE.Mesh(B.sph(0.07, 8, 6), lampMat);
        l.position.set(0.15, 1.5, 0.2 + i * 0.25);
        g.add(l); lamps.push(l);
      }
      g.add(body, top);
      return { group: g, topMat: topMat, lamps: lamps, body: body };
    }

    buildStations() {
      const L = this.cfg.LAYOUT, col = C(), W1 = L.W1, W2 = L.W2;
      // Tentacle Pad
      const pad = W1.pad, pcx = (pad.x0 + pad.x1) / 2, pcz = (pad.z0 + pad.z1) / 2;
      this.padMesh = this.add(B.mesh([
        { g: B.box(2.0, 0.55, 2.4), c: 0xc9d1dc, p: [0, 0.275, 0] },
        { g: B.box(2.05, 0.08, 2.45), c: col.purpleDark, p: [0, 0.57, 0] },
        { g: B.cyl(0.62, 0.7, 0.45, 20), c: 0xd36fb3, p: [-0.35, 0.8, 0] },
        { g: B.cyl(0.55, 0.55, 0.05, 20), c: 0x5b1f6e, p: [-0.35, 1.02, 0] },
        { g: B.box(0.7, 0.06, 1.6), c: 0xb7c0cd, p: [0.6, 0.6, 0] }
      ], { own: true, pos: [pcx, 0, pcz] }), false);
      this.padMesh.rotation.y = FACE_HALL; this.addOccluder(this.padMesh);
      this.tentacles = [];
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2, base = new THREE.Group();
        const lx = -0.35 + Math.cos(a) * 0.32, lz = Math.sin(a) * 0.32; // local (built facing +x) -> world (faces the hall, +z)
        base.position.set(pcx - lz, 1.0, pcz + lx);
        const seg1 = B.mesh([{ g: B.cyl(0.07, 0.11, 0.55, 8), c: col.purple, p: [0, 0.27, 0] }, { g: B.sph(0.03, 5, 4), c: 0xf2b6e6, p: [0.08, 0.2, 0] }, { g: B.sph(0.025, 5, 4), c: 0xf2b6e6, p: [0.07, 0.38, 0] }]);
        const tip = new THREE.Group(); tip.position.y = 0.55;
        const seg2 = B.mesh([{ g: B.cyl(0.02, 0.07, 0.5, 8), c: col.purple, p: [0, 0.25, 0] }, { g: B.sph(0.022, 5, 4), c: 0xf2b6e6, p: [0.05, 0.15, 0] }]);
        tip.add(seg2); seg1.add(tip); base.add(seg1);
        this.scene.add(base);
        this.tentacles.push({ base: base, seg1: seg1, tip: tip, ph: i * 1.7 });
      }
      this.pop.src1 = { obj: this.padMesh, extra: this.tentacles.map((t) => t.base), shown: false, track: 'b_src1' };
      const mk = (def, accent, glow, id) => {
        const m = this.machineMesh(accent, glow);
        m.group.position.set((def.x0 + def.x1) / 2, 0, (def.z0 + def.z1) / 2);
        m.group.rotation.y = FACE_HALL; // against the back wall, output toward the hall
        this.add(m.group, true);
        this.squash[id] = { obj: m.group, t: 1 };
        this.machineLook[id] = { m: m, level: -1 };
        return m.group;
      };
      this.m1 = mk(W1.m1, col.chef, 0xff8a3a, 'm1');
      this.pop.m1 = { obj: this.m1, shown: false, track: 'b_m1' };
      this.m2 = mk(W1.m2, col.chef, 0xff8a3a, 'm2');
      this.pop.m2 = { obj: this.m2, shown: false, track: 'machine2' };
      // Blue Goo Tank (Wing 2)
      const goo = W2.goo, gcx = (goo.x0 + goo.x1) / 2, gcz = (goo.z0 + goo.z1) / 2;
      this.gooMesh = B.mesh([
        { g: B.box(2.0, 0.55, 2.4), c: 0xc9d1dc, p: [0, 0.275, 0] },
        { g: B.box(2.05, 0.08, 2.45), c: col.blueDark, p: [0, 0.57, 0] },
        { g: B.cyl(0.62, 0.62, 1.6, 20), c: 0xd6e8f5, p: [-0.35, 1.4, 0] },
        { g: B.cyl(0.66, 0.66, 0.12, 20), c: 0x8a93a3, p: [-0.35, 2.22, 0] },
        { g: B.cyl(0.66, 0.66, 0.12, 20), c: 0x8a93a3, p: [-0.35, 0.62, 0] },
        { g: B.cyl(0.08, 0.08, 0.5, 8), c: 0x8a93a3, p: [0.25, 1.0, 0], r: [0, 0, Math.PI / 2] },
        { g: B.box(0.7, 0.06, 1.6), c: 0xb7c0cd, p: [0.6, 0.6, 0] }
      ], { own: true });
      this.gooMesh.position.set(gcx, 0, gcz);
      this.gooMesh.rotation.y = FACE_HALL;
      this.add(this.gooMesh, true);
      this.gooLiquid = new THREE.Mesh(B.cyl(0.55, 0.55, 1, 18), new THREE.MeshLambertMaterial({ color: col.blue }));
      this.gooLiquid.position.set(gcx, 0.68, gcz - 0.35);
      this.scene.add(this.gooLiquid);
      this.g1 = mk(W2.g1, col.blue, 0x7fc0ff, 'g1');
      this.pop.goo = { obj: this.gooMesh, extra: [this.gooLiquid], shown: false, wing2: true, track: 'b_src2' };
      this.pop.g1 = { obj: this.g1, shown: false, wing2: true, track: 'b_m2' };
      this.g2 = mk(W2.g2, col.blue, 0x7fc0ff, 'g2');
      this.pop.g2 = { obj: this.g2, shown: false, track: 'gmachine2' };
    }

    // a table = legs + stools + top + rim (+ a tablecloth from level 1) merged into ONE mesh = one draw call
    // (weak phones pay per draw call). An upgrade rebuilds that table's mesh in its new colours.
    tableMesh(pos, accent) {
      const grp = new THREE.Group();
      grp.userData.look = { pos: pos, accent: accent, level: -1, mesh: null };
      this.setTableLevel(grp, 0);
      grp.position.set(pos.x, 0, pos.z);
      grp.visible = false;
      return this.add(grp);
    }

    setTableLevel(grp, level) {
      const tl = grp.userData.look, pos = tl.pos, s = pos.s || 2, r = TBS.TABLE_TOP_R[s] || 0.5;
      if (tl.level === level) return;
      tl.level = level;
      const top = TABLE_TOP[Math.min(level, TABLE_TOP.length - 1)], cloth = TABLE_CLOTH[Math.min(level, TABLE_CLOTH.length - 1)];
      const rim = level >= TABLE_TOP.length - 1 ? 0xffd23a : tl.accent;
      const parts = [{ g: B.cyl(0.07, 0.1, 0.72, 10), c: 0x8a93a3, p: [0, 0.36, 0] }, { g: B.cyl(0.3, 0.3, 0.04, 14), c: 0x8a93a3, p: [0, 0.02, 0] }];
      for (const d of TBS.seatLayout(s)) {
        parts.push({ g: B.cyl(0.22, 0.22, 0.08, 14), c: tl.accent, p: [d[0], 0.45, d[1]] }, { g: B.cyl(0.05, 0.05, 0.42, 8), c: 0x8a93a3, p: [d[0], 0.21, d[1]] });
      }
      parts.push({ g: s === 4 ? B.box(r * 2, 0.08, r * 2) : B.cyl(r, r, 0.08, 20), c: top, p: [0, 0.76, 0] });
      parts.push({ g: s === 4 ? B.box(r * 2 + 0.06, 0.04, r * 2 + 0.06) : B.cyl(r + 0.03, r + 0.03, 0.04, 20), c: rim, p: [0, 0.71, 0] });
      if (level >= 1) parts.push({ g: s === 4 ? B.box(r * 2 + 0.14, 0.2, r * 2 + 0.14) : B.cyl(r + 0.08, r + 0.12, 0.2, 20), c: cloth, p: [0, 0.66, 0] });
      const mesh = B.mesh(parts);
      if (tl.mesh) { grp.remove(tl.mesh); tl.mesh.geometry.dispose(); }
      tl.mesh = mesh;
      grp.add(mesh);
    }

    // upgrade looks for one wing: tables (top / tablecloth) and counter (top colour + lamps)
    makeLooks(accent) {
      return {
        top: new THREE.MeshLambertMaterial({ color: 0xf3f5f8 }), rim: new THREE.MeshLambertMaterial({ color: accent }),
        cloth: new THREE.MeshLambertMaterial({ color: 0xffffff }), cloths: [], tableLevel: -1, counterLevel: -1,
        ctrTop: new THREE.MeshLambertMaterial({ color: 0xe0a05a }), lamps: []
      };
    }

    deskMesh(rect, color, icon) { // modelled with its sign board at -x, then turned so the board is against the back wall
      const w = rect.z1 - rect.z0, d = rect.x1 - rect.x0, col = C();
      const parts = [
        { g: B.box(w, 0.9, d), c: color, p: [0, 0.45, 0] },
        { g: B.box(w + 0.08, 0.08, d + 0.08), c: 0xf3f5f8, p: [0, 0.93, 0] },
        { g: B.box(0.08, 1.5, 0.08), c: 0x8a93a3, p: [-w / 2 + 0.15, 1.6, 0] },
        { g: B.box(0.06, 0.6, 0.9), c: 0xf3f5f8, p: [-w / 2 + 0.15, 2.3, 0] }
      ];
      if (icon === 'helmet') { parts.push({ g: B.sph(0.2, 12, 8), c: 0xf2c230, p: [-w / 2 + 0.2, 2.28, 0], s: [0.4, 0.7, 1] }); }
      else { parts.push({ g: B.cyl(0.18, 0.2, 0.18, 12), c: 0xffffff, p: [-w / 2 + 0.2, 2.25, 0], r: [0, 0, Math.PI / 2] }, { g: B.sph(0.22, 12, 8), c: 0xffffff, p: [-w / 2 + 0.24, 2.34, 0], s: [0.5, 0.6, 1] }, { g: B.box(0.03, 0.06, 0.4), c: col.chef, p: [-w / 2 + 0.2, 2.15, 0] }); }
      const m = B.mesh(parts, { own: true });
      m.position.set((rect.x0 + rect.x1) / 2, 0, (rect.z0 + rect.z1) / 2);
      m.rotation.y = FACE_HALL;
      return m;
    }

    buildFurniture() {
      const L = this.cfg.LAYOUT, col = C(), W1 = L.W1, W2 = L.W2;
      this.looks = { p: this.makeLooks(col.purple), g: this.makeLooks(col.blue) };
      const counter = (def, stripe, mat, look) => {
        const r = def.counter, w = r.x1 - r.x0, d = r.z1 - r.z0;
        const m = B.mesh([
          { g: B.box(w, 0.9, d), c: 0xf3f5f8, p: [0, 0.45, 0] },
          { g: B.box(w + 0.04, 0.14, d + 0.04), c: stripe, p: [0, 0.6, 0] }
        ], { material: mat, receive: true });
        const top = new THREE.Mesh(B.box(w + 0.16, 0.1, d + 0.12), look.ctrTop);
        top.position.y = 0.95; top.receiveShadow = true;
        m.add(top); look.ctrTopMesh = top;
        // storage lamps on the counter end: one more lights up per counter upgrade
        for (let i = 0; i < 5; i++) {
          const lamp = new THREE.Mesh(B.sph(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0x3a4250 }));
          if (d >= w) lamp.position.set(0, 1.05, -d / 2 + 0.2 + i * 0.22); // lamps along the long side, at the kitchen end
          else lamp.position.set(-w / 2 + 0.2 + i * 0.22, 1.05, -d / 2 + 0.08);
          m.add(lamp); look.lamps.push(lamp);
        }
        m.position.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2);
        return this.add(m);
      };
      this.pop.ctr1 = { obj: counter(W1, col.purple, undefined, this.looks.p), shown: false, track: 'b_ctr1' };
      this.counter2 = counter(W2, col.blue, this.w2mat(), this.looks.g);
      this.pop.ctr2 = { obj: this.counter2, shown: false, wing2: true, track: 'b_ctr2' };
      this.tables = { p: W1.tables.map((t) => this.tableMesh(t, col.purple)), g: W2.tables.map((t) => this.tableMesh(t, col.blue)) };
      this.pop.hire1 = { obj: this.add(this.deskMesh(W1.hireDesk, col.worker, 'helmet'), true), shown: false, track: 'b_hire1' };
      this.pop.chef1 = { obj: this.add(this.deskMesh(W1.chefDesk, col.chef, 'chef'), true), shown: false, track: 'b_chef1' };
      this.hire2 = this.add(this.deskMesh(W2.hireDesk, col.worker, 'helmet'), true);
      this.pop.hire2 = { obj: this.hire2, shown: false, wing2: true, track: 'b_hire2' };
      this.chef2 = this.add(this.deskMesh(W2.chefDesk, col.chef, 'chef'), true);
      this.pop.chef2 = { obj: this.chef2, shown: false, wing2: true, track: 'b_chef2' };
      this.terminals = [W1.terminal, W2.terminal].map((t, i) => {
        const tx = (t.x0 + t.x1) / 2, tz = (t.z0 + t.z1) / 2;
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x1a2a33 });
        const g = new THREE.Group();
        const body = B.mesh([
          { g: B.box(t.x1 - t.x0, 1.05, t.z1 - t.z0), c: 0x3b4458, p: [0, 0.52, 0] },
          { g: B.box(t.x1 - t.x0 + 0.06, 0.08, t.z1 - t.z0 + 0.06), c: col.terminal, p: [0, 1.06, 0] }
        ], { material: i === 1 ? this.w2mat() : undefined, own: true });
        const screen = new THREE.Mesh(B.box(t.x1 - t.x0 - 0.12, 0.5, 0.06), screenMat);
        screen.position.set(0, 1.35, 0.12); screen.rotation.x = -0.45;
        const bolt = new THREE.Mesh(B.merge([{ g: B.box(0.08, 0.22, 0.02), c: 0xffffff, p: [0.02, 0.06, 0], r: [0, 0, 0.5] }, { g: B.box(0.08, 0.22, 0.02), c: 0xffffff, p: [-0.02, -0.08, 0], r: [0, 0, 0.5] }]), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        bolt.position.set(0, 1.36, 0.17); bolt.rotation.x = -0.45;
        g.add(body, screen, bolt);
        g.position.set(tx, 0, tz);
        this.add(g, true);
        return { group: g, screen: screen, mat: screenMat, bolt: bolt, active: false };
      });
      this.pop.term1 = { obj: this.terminals[0].group, shown: false, track: 'b_term1' };
      this.pop.term2 = { obj: this.terminals[1].group, shown: false, wing2: true, track: 'b_term2' };
      // trash bins: a round green can with an open dark mouth (dirty plates fly in)
      const bin = (b) => {
        const m = B.mesh([
          { g: B.cyl(0.36, 0.3, 0.9, 18), c: col.bin, p: [0, 0.45, 0] },
          { g: B.cyl(0.4, 0.4, 0.08, 18), c: 0x3f8a46, p: [0, 0.92, 0] },
          { g: B.cyl(0.31, 0.31, 0.02, 18), c: 0x1a1f26, p: [0, 0.965, 0] },
          { g: B.cyl(0.365, 0.345, 0.12, 18), c: 0xffffff, p: [0, 0.55, 0] }
        ], { own: true });
        m.position.set((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2);
        return this.add(m, true);
      };
      this.pop.bin1 = { obj: bin(W1.bin), shown: false, track: 'b_bin1' };
      this.pop.bin2 = { obj: bin(W2.bin), shown: false, wing2: true, track: 'b_bin2' };
    }

    buildStars() {
      const n = 500, pos = new Float32Array(n * 3), rng = U.makeRng(7);
      for (let i = 0; i < n; i++) {
        const a = rng() * Math.PI * 2, r = 32 + rng() * 40;
        pos[i * 3] = 17 + Math.cos(a) * r; pos[i * 3 + 1] = -25 + rng() * 30; pos[i * 3 + 2] = 9 + Math.sin(a) * r;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false })));
    }

    applyState(instant) {
      const g = this.game, ch = g.chains;
      // everything is built from zero: each thing is visible only once its floor circle was bought
      for (const k in this.pop) {
        const p = this.pop[k];
        if (!p.track) continue;
        if (g.built(p.track)) { if (!p.shown) this.popIn(k, instant); }
        else { p.obj.visible = false; (p.extra || []).forEach((o) => { o.visible = false; }); }
      }
      ch.p.counter.tables.forEach((t) => { if (!this.tables.p[t.idx].visible) this.popObj(this.tables.p[t.idx], instant); });
      ch.g.counter.tables.forEach((t) => { if (!this.tables.g[t.idx].visible) this.popObj(this.tables.g[t.idx], instant); });
      if (g.wing2Open) { this.setWing2Lit(1); this.finishReveal(); }
      this.terminals[0].active = g.built('b_term1'); this.terminals[1].active = g.built('b_term2');
    }

    finishReveal() {
      this.revealDone = true;
      this.openPart.visible = false; this.doorPanel.visible = false; this.sil.visible = false;
      this.darkProps.visible = false; this.lamp.visible = false; // no abandoned props left in the open wing
    }

    popObj(obj, instant) {
      obj.visible = true;
      if (instant) { obj.scale.set(1, 1, 1); return; }
      this.view.fx.popIn(obj);
      this.view.fx.burst(obj.position.x, 1.0, obj.position.z, 0xffffff, 22);
    }

    popIn(key, instant) {
      const p = this.pop[key];
      p.shown = true;
      this.popObj(p.obj, instant);
      (p.extra || []).forEach((o) => { o.visible = true; });
    }

    setWing2Lit(k) {
      const c = new THREE.Color(0x3a4250).lerp(new THREE.Color(0xffffff), k);
      for (const m of this.w2mats) m.color.copy(c);
    }

    onEvent(e) {
      const d = e.data;
      if (e.type === 'cooked' && this.squash[d.key]) this.squash[d.key].t = 0;
      else if (e.type === 'purchase') {
        for (const k in this.pop) if (this.pop[k].track === d.trackId && !this.pop[k].shown) this.popIn(k, false); // built: it pops in
        if (d.trackId === 'b_term1') this.terminals[0].active = true;
        if (d.trackId === 'b_term2') this.terminals[1].active = true;
        const def = this.game.trackDefs[d.trackId];
        if (def && def.table !== undefined) this.popObj(this.tables[def.wing === 2 ? 'g' : 'p'][def.table], false);
        if (/up$/.test(d.trackId)) { const id = d.trackId.replace('up', ''); const sq = this.squash[id]; if (sq) { this.view.fx.burst(sq.obj.position.x, 1.8, sq.obj.position.z, 0xffd23a, 30); sq.t = 0; } }
      }
    }

    // upgrades show on the machines: top colour, lamps lit, slightly bigger
    updateLooks() {
      const g = this.game;
      for (const cid of ['p', 'g']) {
        const ct = g.chains[cid].counter, lk = this.looks[cid];
        if (cid === 'g') { const vis = g.wing2Open; lk.ctrTopMesh.visible = vis; lk.lamps.forEach((l) => { l.visible = vis; }); } // dark wing: no lit parts
        for (const tb of ct.tables) { // each table: white top -> coloured top; a tablecloth from level 2; gold rim at max
          const grp = this.tables[cid][tb.idx];
          if (grp) this.setTableLevel(grp, tb.level);
        }
        if (ct.level !== lk.counterLevel) { // counter: top colour + one lamp per storage level
          lk.counterLevel = ct.level;
          lk.ctrTop.color.setHex(COUNTER_TOP[Math.min(ct.level, COUNTER_TOP.length - 1)]);
          lk.lamps.forEach((l, i) => l.material.color.setHex(i <= ct.level ? 0x6fff9a : 0x3a4250));
        }
      }
      for (const id in this.machineLook) {
        const ml = this.machineLook[id];
        let m = null;
        for (const cid in g.chains) for (const mc of g.chains[cid].machines) if (mc.id === id) m = mc;
        if (!m || m.level === ml.level) continue;
        ml.level = m.level;
        ml.m.topMat.color.setHex(LEVEL_ACCENT[Math.min(m.level, LEVEL_ACCENT.length - 1)]);
        ml.m.lamps.forEach((l, i) => { l.visible = i <= m.level; });
      }
    }

    update(dt) {
      const g = this.game;
      this.time += dt;
      const t = this.time;
      for (const tn of this.tentacles) {
        tn.seg1.rotation.z = Math.sin(t * 2.1 + tn.ph) * 0.35;
        tn.seg1.rotation.x = Math.cos(t * 1.7 + tn.ph) * 0.3;
        tn.tip.rotation.z = Math.sin(t * 3.0 + tn.ph + 1) * 0.6;
      }
      for (const id in this.squash) {
        const s = this.squash[id];
        if (s.t < 1) {
          s.t = Math.min(1, s.t + dt * 3.5);
          const k = Math.sin(s.t * Math.PI * 2) * (1 - s.t) * 0.12;
          s.obj.scale.set(1 + k * 0.6, 1 - k, 1 + k * 0.6);
        }
      }
      this.updateLooks();
      const gp = g.chains.g.source;
      const lvl = 0.25 + 0.65 * Math.min(1, gp.pile / gp.max());
      this.gooLiquid.scale.y += (lvl * 1.45 - this.gooLiquid.scale.y) * U.smooth(4, dt);
      this.gooLiquid.position.y = 0.68 + this.gooLiquid.scale.y / 2;
      for (const a of this.airlocks) {
        let near = false;
        for (const c of g.customers) if (Math.abs(c.x - a.x) < 1.6 && Math.abs(c.z - a.z) < 1.8) { near = true; break; }
        a.open += ((near ? 1 : 0) - a.open) * U.smooth(8, dt);
        a.door.position.y = 1.0 + a.open * 1.05; // gate bar lifts
      }
      this.terminals.forEach((tm, i) => {
        const active = g.built(i === 0 ? 'b_term1' : 'b_term2');
        const glow = active ? 0.65 + Math.sin(t * 3 + i) * 0.2 : 0;
        tm.mat.color.setHex(active ? 0x2fe0c8 : 0x1a2a33).multiplyScalar(active ? 0.75 + glow * 0.4 : 1);
        tm.bolt.visible = active;
      });
      this.updateWing2(dt, t);
    }

    updateWing2(dt, t) {
      const g = this.game, L = this.cfg.LAYOUT;
      if (g.wing2Open && this.revealDone) return;
      if (g.revealing() || (g.wing2Open && !this.revealDone)) {
        const p = g.wing2Open ? 1 : 1 - g.revealT / this.cfg.REVEAL_SECONDS;
        let lit = U.clamp((p - 0.22) / 0.3, 0, 1);
        if (lit > 0 && lit < 1 && Math.sin(t * 47) > 0.55) lit *= 0.25;
        this.setWing2Lit(lit);
        this.lamp.material.color.setHex(lit > 0.5 ? 0xfff2b0 : 0x333a44);
        this.silMat.color.setHex(0x10141c).lerp(new THREE.Color(0xffffff), U.clamp((p - 0.3) / 0.3, 0, 1));
        const d = U.clamp((p - 0.45) / 0.18, 0, 1);
        this.doorPanel.position.y = d * 2.9;
        this.openPart.position.y = -d * 1.0;
        // abandoned props shrink away as the lights come on
        const gone = U.clamp((p - 0.4) / 0.2, 0, 1);
        this.darkProps.scale.setScalar(Math.max(0.001, 1 - gone)); this.lamp.scale.setScalar(Math.max(0.001, 1 - gone));
        if (d >= 1) { this.doorPanel.visible = false; this.openPart.visible = false; }
        // the new wing opens EMPTY: its tank, machine, counter, desks... pop in later, when you build them
        if (g.wing2Open) { this.setWing2Lit(1); this.finishReveal(); }
        return;
      }
      const peek = Math.max(0, Math.sin(t * 0.9));
      this.sil.position.z = this.silBase.z - peek * 0.35;
      this.sil.position.x = this.silBase.x + Math.sin(t * 1.3) * 0.04;
      this.silBody.scale.y = 1 + Math.sin(t * 3.2) * 0.03;
      this.silEyes.scale.y = (Math.sin(t * 0.7) > 0.97) ? 0.15 : 1;
      this.lamp.material.color.setHex(Math.sin(t * 13) * Math.sin(t * 2.3) > 0.6 ? 0x6a7a9a : 0x2a303a);
      this.knockT -= dt;
      const pl = g.player, near = Math.hypot(pl.x - L.DOOR.x, pl.z - L.DOOR.z) < this.cfg.KNOCK_RANGE;
      if (this.knockAnim > 0) {
        this.knockAnim -= dt;
        const k = Math.sin((0.6 - this.knockAnim) * 22);
        this.silArm.rotation.z = -0.9 + k * 0.4;
        this.doorPanel.position.x = L.DOOR.x + (k > 0.7 ? 0.025 : 0);
      } else { this.silArm.rotation.z = -0.25 + Math.sin(t * 2) * 0.1; this.doorPanel.position.x = L.DOOR.x; }
      if (this.knockT <= 0) {
        const kr = this.cfg.KNOCK_EVERY;
        this.knockT = kr[0] + Math.random() * (kr[1] - kr[0]);
        this.knockAnim = 0.6;
        if (near) TBS.Audio.play('knock');
      }
    }
  }

  TBS.World = World;
})(window.TBS = window.TBS || {});

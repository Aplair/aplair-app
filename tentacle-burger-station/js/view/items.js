/* Every carried / piled / flying item and every money bundle is drawn with one InstancedMesh per item type.
   Carried items stack on a tray held in front (they wobble like jelly; taller stacks lean more). */
(function (TBS) {
  'use strict';

  const B = TBS.B, U = TBS.U;
  const STEP = { tentacle: 0.15, burger: 0.27, goo: 0.25, dish: 0.2, bill: 0.05, bundle: 0.15, plate: 0.07 };
  const NOTE_A = 0x3fae55, NOTE_B = 0x4cc463; // the two side shades of stacked money notes (layer lines)

  function geometries() {
    const cfg = TBS.CONFIG, col = cfg.COLORS;
    return {
      tentacle: B.merge([
        { g: B.cyl(0.05, 0.12, 0.56, 10), c: col.purple, p: [0, 0.08, 0], r: [0, 0, Math.PI / 2] },
        { g: B.sph(0.04, 6, 4), c: 0xf2b6e6, p: [0.12, 0.17, 0.02] }, { g: B.sph(0.035, 6, 4), c: 0xf2b6e6, p: [-0.04, 0.16, 0.03] },
        { g: B.sph(0.028, 6, 4), c: 0xf2b6e6, p: [-0.17, 0.14, 0.02] }
      ]),
      burger: B.merge([
        { g: B.cyl(0.25, 0.23, 0.08, 18), c: col.bun, p: [0, 0.04, 0] },
        { g: B.cyl(0.27, 0.27, 0.08, 18), c: col.purpleDark, p: [0, 0.12, 0] },
        { g: B.cyl(0.02, 0.05, 0.22, 6), c: col.purple, p: [0.27, 0.17, 0], r: [0, 0, -1.1] },
        { g: B.cyl(0.02, 0.05, 0.2, 6), c: col.purple, p: [-0.2, 0.17, 0.18], r: [0.9, 0, 0.8] },
        { g: B.cyl(0.02, 0.05, 0.2, 6), c: col.purple, p: [-0.12, 0.16, -0.24], r: [-1.0, 0, 0.5] },
        { g: B.sph(0.26, 16, 10), c: col.bun, p: [0, 0.16, 0], s: [1, 0.42, 1] },
        { g: B.sph(0.02, 4, 3), c: 0xfff6dc, p: [0.08, 0.27, 0.05] }, { g: B.sph(0.02, 4, 3), c: 0xfff6dc, p: [-0.07, 0.27, -0.06] }
      ]),
      goo: B.merge([
        { g: B.sph(0.17, 14, 10), c: col.blue, p: [0, 0.14, 0], s: [1, 0.85, 1] },
        { g: B.sph(0.06, 8, 6), c: col.blueLight, p: [0.06, 0.24, 0.07] }
      ]),
      dish: B.merge([
        { g: B.cyl(0.26, 0.15, 0.17, 18), c: col.blueDark, p: [0, 0.085, 0] },
        { g: B.cyl(0.235, 0.235, 0.03, 18), c: col.blue, p: [0, 0.16, 0] },
        { g: B.sph(0.07, 8, 6), c: col.blueLight, p: [0.05, 0.19, -0.04] }
      ]),
      bill: B.merge([ // small green bundle (flying into price circles / to the chef)
        { g: B.box(0.4, 0.05, 0.22), c: col.money, p: [0, 0.025, 0] },
        { g: B.box(0.1, 0.055, 0.225), c: col.moneyBand, p: [0, 0.025, 0] }
      ]),
      bundle: B.merge([ // green bundle in money piles
        { g: B.box(0.46, 0.14, 0.26), c: col.money, p: [0, 0.07, 0] },
        { g: B.box(0.12, 0.145, 0.265), c: col.moneyBand, p: [0, 0.07, 0] },
        { g: B.box(0.47, 0.012, 0.27), c: 0x6fe38a, p: [0, 0.141, 0] }
      ]),
      // flat notes for money piles: two side shades (layer lines like a real stack) and a printed top note
      // every hidden note / covered layer of a money pile: one white box scaled and coloured per instance (one draw call)
      block: B.merge([{ g: B.box(1, 0.045, 1), c: 0xffffff, p: [0, 0.0225, 0] }]),
      noteTop: B.merge([
        { g: B.box(0.5, 0.045, 0.28), c: 0x4cc463, p: [0, 0.0225, 0] },
        { g: B.box(0.44, 0.004, 0.22), c: 0x9ff0ae, p: [0, 0.047, 0] },
        { g: B.cyl(0.055, 0.055, 0.006, 12), c: 0x237a37, p: [-0.12, 0.05, 0] },
        { g: B.cyl(0.055, 0.055, 0.006, 12), c: 0x237a37, p: [0.12, 0.05, 0] },
        { g: B.cyl(0.075, 0.075, 0.005, 14), c: 0x6fd884, p: [0, 0.049, 0], s: [1, 1, 0.8] }
      ]),
      plate: B.merge([ // leftovers: a used plate with crumbs (the table needs cleaning)
        { g: B.cyl(0.2, 0.15, 0.04, 16), c: 0xe9edf3, p: [0, 0.02, 0] },
        { g: B.sph(0.05, 6, 4), c: 0x8a5a2e, p: [0.05, 0.05, 0.02], s: [1, 0.5, 1] },
        { g: B.sph(0.035, 6, 4), c: 0x6a2aa8, p: [-0.06, 0.05, -0.03], s: [1, 0.5, 1] },
        { g: B.box(0.18, 0.015, 0.03), c: 0xb7c0cd, p: [0.02, 0.05, -0.08], r: [0, 0.6, 0] }
      ])
    };
  }

  const NO_SHIFT = [0, 0, 0];

  // the owner's tentacle (one per pad level): lying down, long side along x, coloured per corner (no picture)
  function tentacleLooks(cfg) {
    const M = TBS.Models && TBS.Models.tentacleItem, A = cfg.PAD_MODEL;
    if (!M || !A || !A.on) return null;
    const b64 = TBS.Characters.b64;
    return M.levels.map((L) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(b64(L.pos, Float32Array), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(b64(L.nrm, Int8Array), 3, true));
      g.setAttribute('color', new THREE.BufferAttribute(b64(L.col, Uint8Array), 3, true));
      g.setIndex(new THREE.BufferAttribute(b64(L.idx, Uint16Array), 1));
      g.scale(A.itemLength, A.itemLength, A.itemLength);
      g.computeBoundingSphere();
      return g;
    });
  }

  class Items {
    constructor(view) {
      this.view = view; this.game = view.game; this.cfg = view.game.cfg; this.scene = view.scene;
      const geos = TBS.B.withDetail(this.cfg.CROWD_DETAIL, geometries), mat = new THREE.MeshLambertMaterial({ vertexColors: true });
      const caps = { tentacle: 320, burger: 420, goo: 220, dish: 300, bill: 200, bundle: 300, plate: 120, block: 7000, noteTop: 900 }; // notes: 2 tall sales piles + 22 tip piles at their tallest
      this.tentLooks = tentacleLooks(this.cfg);
      if (this.tentLooks) { geos.tentacle.dispose(); geos.tentacle = this.tentLooks[0]; }
      this.tentLook = 0;
      this.meshes = {};
      this.n = {};
      for (const k in geos) {
        // the money block gets its own material: three.js picks 'per-piece colour' mode only when a material is first used
        const m = new THREE.InstancedMesh(geos[k], k === 'block' ? new THREE.MeshLambertMaterial({ vertexColors: true }) : mat, caps[k]);
        m.castShadow = true; m.frustumCulled = false; m.count = 0;
        this.scene.add(m);
        this.meshes[k] = m; this.n[k] = 0;
        if (k === 'block') m.setColorAt(0, new THREE.Color(1, 1, 1)); // makes the per-instance colour buffer
      }
      this.stacks = new Map();
      this.arcFrom = new Map();
      this.flyers = [];
      this.collectAcc = {};          // pile key -> $ collected but not yet shown as a flying layer
      this.inflight = {};
      this.blockColor = new THREE.Color();
      this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(); this.v = new THREE.Vector3(); this.s = new THREE.Vector3();
    }

    // a flat money box: sx x sz in size, coloured (no turn)
    putBlock(x, y, z, sx, sz, color) {
      const mesh = this.meshes.block, i = this.n.block;
      if (i >= mesh.instanceMatrix.count) return;
      const a = mesh.instanceMatrix.array, o = i * 16;
      a[o] = sx; a[o + 1] = 0; a[o + 2] = 0; a[o + 3] = 0; a[o + 4] = 0; a[o + 5] = 1; a[o + 6] = 0; a[o + 7] = 0;
      a[o + 8] = 0; a[o + 9] = 0; a[o + 10] = sz; a[o + 11] = 0; a[o + 12] = x; a[o + 13] = y; a[o + 14] = z; a[o + 15] = 1;
      this.blockColor.setHex(color).toArray(mesh.instanceColor.array, i * 3);
      this.n.block = i + 1;
    }

    put(type, x, y, z, yaw, tx, tz, sc) {
      const mesh = this.meshes[type], i = this.n[type];
      if (i >= mesh.instanceMatrix.count) return;
      const s0 = sc === undefined ? 1 : sc;
      if (!tx && !tz) { // the usual case: only turned around the up axis -> write the matrix directly (much cheaper)
        const a = mesh.instanceMatrix.array, o = i * 16, c = Math.cos(yaw || 0) * s0, sn = Math.sin(yaw || 0) * s0;
        a[o] = c; a[o + 1] = 0; a[o + 2] = -sn; a[o + 3] = 0;
        a[o + 4] = 0; a[o + 5] = s0; a[o + 6] = 0; a[o + 7] = 0;
        a[o + 8] = sn; a[o + 9] = 0; a[o + 10] = c; a[o + 11] = 0;
        a[o + 12] = x; a[o + 13] = y; a[o + 14] = z; a[o + 15] = 1;
        this.n[type] = i + 1;
        return;
      }
      this.e.set(tx || 0, yaw || 0, tz || 0);
      this.q.setFromEuler(this.e);
      this.v.set(x, y, z);
      const s = sc === undefined ? 1 : sc;
      this.s.set(s, s, s);
      this.m.compose(this.v, this.q, this.s);
      mesh.setMatrixAt(i, this.m);
      this.n[type] = i + 1;
    }

    // the tray in front of the chef / a worker
    carrier(key) {
      const g = this.game, cfg = this.cfg;
      let x, z, f, vx, vz, scale, walk, stack;
      let lift = 0;
      if (key === 'player') { const p = g.player; x = p.x; z = p.z; f = p.facing; vx = p.vx; vz = p.vz; scale = 1; walk = p.walkDist; stack = p.stack; if (g.effects.hover > 0) lift = cfg.HOVER_LIFT; }
      else {
        const w = g.workers.find((o) => 'w' + o.id === key);
        if (!w) return null;
        const sp = w.moving ? TBS.Workers.speed(g, w) : 0;
        x = w.x; z = w.z; f = w.facing; vx = Math.sin(f) * sp; vz = Math.cos(f) * sp; scale = 0.92; walk = w.walkDist; stack = w.stack;
      }
      const fw = cfg.TRAY_FORWARD * scale;
      return { x: x + Math.sin(f) * fw, z: z + Math.cos(f) * fw, facing: f, vx: vx, vz: vz, base: cfg.TRAY_HEIGHT * scale + lift, scale: scale * 0.92, walk: walk, stack: stack };
    }

    stackState(key) {
      let s = this.stacks.get(key);
      if (!s) { s = { items: [], ax: 0, az: 0, pvx: 0, pvz: 0 }; this.stacks.set(key, s); }
      return s;
    }

    itemWorldPos(key, id) {
      const s = this.stacks.get(key), c = this.carrier(key);
      if (!s || !c) return null;
      const it = s.items.find((x) => x.id === id);
      if (!it) return null;
      return { x: c.x + it.ox, y: c.base + it.y * c.scale, z: c.z + it.oz, type: it.type };
    }

    machineById(id) {
      const ch = this.game.chains;
      for (const c in ch) for (const m of ch[c].machines) if (m.id === id) return m;
      return null;
    }

    // where food sits on a machine output: tall columns, piece on piece
    // (machines are modelled facing +x and turned to face the hall: local (lx, lz) -> world (-lz, +lx))
    outSlot(m, i) {
      const per = this.cfg.MACHINE_STACK_COLUMN, col = Math.floor(i / per), row = i % per;
      const step = STEP[m.outType], lx = ((col % 2) - 0.5) * 0.36, lz = (Math.floor(col / 2) - 0.5) * 0.4 + 0.2;
      return { x: m.outPileX - lz, y: 0.79 + row * step, z: m.outPileZ + lx };
    }
    // ingredients waiting in a machine: stacked on its roof
    inSlot(m, i) {
      const cx = (m.rect.x0 + m.rect.x1) / 2, cz = (m.rect.z0 + m.rect.z1) / 2;
      const perLayer = 6, layer = Math.floor(i / perLayer), j = i % perLayer;
      const lx = -0.42 + ((j % 2) - 0.5) * 0.42, lz = -0.65 + (Math.floor(j / 2) - 1) * 0.36;
      return { x: cx - lz, y: 1.4 + layer * STEP[m.inType] * 0.8, z: cz + lx };
    }

    // the owner's Tentacle Machine has its tray in front: its pile is shown there (a look only)
    pileShift(src) {
      const A = this.cfg.PAD_MODEL;
      return A && A.on && this.view.world.padModel && src.itemType === 'tentacle' ? A.pile : NO_SHIFT;
    }

    pilePos(key) {
      const g = this.game, ch = g.chains;
      if (key === 'bin:p' || key === 'bin:g') { const b = (key === 'bin:g' ? this.cfg.LAYOUT.W2 : this.cfg.LAYOUT.W1).bin; return { x: (b.x0 + b.x1) / 2, y: 1.05, z: (b.z0 + b.z1) / 2 }; } // into the bin's mouth
      const src = { pad: ch.p.source, goo: ch.g.source }[key];
      if (src) { const o = this.pileShift(src); return { x: src.pileX + o[0], y: (o !== NO_SHIFT ? o[1] + 0.11 : 0.75) + Math.min(src.pile, 12) / 4 * 0.15, z: src.pileZ + o[2] }; }
      const id = key.replace(':in', ''), m = this.machineById(id);
      if (m) {
        if (key.indexOf(':in') > 0) { const p = this.inSlot(m, Math.max(0, Math.min(m.input, 30) - 1)); return { x: p.x, y: p.y + 0.15, z: p.z }; }
        const p = this.outSlot(m, Math.max(0, Math.min(m.output, 15) - 1)); return { x: p.x, y: p.y + 0.3, z: p.z };
      }
      for (const cid in ch) {
        const c = ch[cid].counter;
        if (key === c.id) { const i = Math.min(c.stack, this.cfg.COUNTER_DRAW_MAX - 1); const p = this.counterSlot(c, i); return { x: p.x, y: p.y, z: p.z }; }
        if (key === 'money:' + c.id) return { x: c.money.x, y: this.blockHeight(c.money.amount, false) + 0.1, z: c.money.z };
        if (key.indexOf('tip:' + cid) === 0) {
          const t = c.tables.find((x) => 'tip:' + cid + x.idx === key);
          if (t) return { x: t.tip.x, y: this.blockHeight(t.tip.amount, true) + 0.1, z: t.tip.z };
        }
      }
      return { x: 0, y: 1, z: 0 };
    }

    // food / leftovers on the table in front of a seat
    seatPlate(t, s) { return { x: U.lerp(s.x, t.x, 0.55), z: U.lerp(s.z, t.z, 0.55) }; }

    // food on the counter top, in columns along the counter's long side
    counterSlot(c, i) {
      const r = c.rect, alongZ = (r.z1 - r.z0) > (r.x1 - r.x0);
      const cols = 7, col = i % cols, row = Math.floor(i / cols);
      const step = STEP[this.game.chains[c.chain].product];
      const mid = alongZ ? c.drop.z + 0.4 : (r.x0 + r.x1) / 2, off = (col - 3) * 0.45;
      const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
      return alongZ ? { x: cx, y: 1.0 + row * step, z: U.clamp(mid + off + 1.0, r.z0 + 0.3, r.z1 - 0.3) } : { x: U.clamp(mid + off, r.x0 + 0.3, r.x1 - 0.3), y: 1.0 + row * step, z: cz };
    }

    // money pile = ONE solid block of flat notes (cols x rows per layer, layer on layer, no gaps), $1 = one note
    block(tip) { const c = this.cfg; return tip ? { cols: c.TIP_BLOCK_COLS, rows: c.TIP_BLOCK_ROWS } : { cols: c.MONEY_BLOCK_COLS, rows: c.MONEY_BLOCK_ROWS }; }
    // how many layers a pile shows for an amount (a look only: fast at first, slower later, capped)
    layersFor(amount, tip) {
      const c = this.cfg, L = tip ? c.TIP_PILE_LAYERS : c.MONEY_PILE_LAYERS, full = tip ? c.TIP_PILE_FULL : c.MONEY_PILE_FULL;
      if (amount <= 0) return 0;
      return Math.min(L, L * Math.pow(amount / full, c.PILE_CURVE));
    }
    notesFor(amount, tip) { const b = this.block(tip); return amount > 0 ? Math.max(1, Math.ceil(this.layersFor(amount, tip) * b.cols * b.rows)) : 0; }
    blockHeight(amount, tip) {
      const b = this.block(tip);
      return Math.ceil(this.notesFor(amount, tip) / (b.cols * b.rows)) * this.cfg.NOTE_THICK;
    }
    moneyBlock(x, z, amount, tip) {
      const cfg = this.cfg, b = this.block(tip), cols = b.cols, rows = b.rows, per = cols * rows, th = cfg.NOTE_THICK;
      const n = this.notesFor(amount, tip);
      if (n <= 0) return;
      const layers = Math.ceil(n / per), lastFull = n % per === 0;
      const covered = layers - (lastFull ? 1 : 2); // layers fully hidden under others: one box each
      for (let layer = 0; layer < covered; layer++) this.putBlock(x, layer * th, z, 0.5 * cols, 0.28 * rows, layer % 2 ? NOTE_B : NOTE_A);
      for (let i = Math.max(0, covered) * per; i < n; i++) {
        const layer = Math.floor(i / per), j = i % per, c = j % cols, r = Math.floor(j / cols);
        const top = layer === layers - 1 || (layer === layers - 2 && !lastFull && j >= n % per); // notes you can see from above
        const nx = x + (c - (cols - 1) / 2) * 0.5, nz = z + (r - (rows - 1) / 2) * 0.28;
        if (top) this.put('noteTop', nx, layer * th, nz, 0);
        else this.putBlock(nx, layer * th, nz, 0.5, 0.28, layer % 2 ? NOTE_B : NOTE_A);
      }
    }

    fly(type, from, to, opts) {
      opts = opts || {};
      const f = { type: type, x0: from.x, y0: from.y, z0: from.z, to: to, t: -(opts.delay || 0), dur: opts.dur || 0.3, arc: opts.arc === undefined ? 0.8 : opts.arc, key: opts.key || null, scale: opts.scale || 1, spin: opts.spin || 0, land: opts.land || null, group: opts.group || null };
      if (f.key) this.inflight[f.key] = (this.inflight[f.key] || 0) + 1;
      this.flyers.push(f);
    }

    onEvent(e) {
      const d = e.data, cfg = this.cfg, g = this.game;
      switch (e.type) {
        case 'pickup': {
          let from;
          if (d.who === 'player' || d.key === 'plate') from = { x: d.x, y: 0.85, z: d.z }; // plates come off the table
          else from = this.pilePos(d.key);
          this.arcFrom.set(d.item.id, from);
          break;
        }
        case 'drop': case 'return': {
          const key = d.who === 'worker' ? 'w' + d.w.id : 'player';
          const target = this.pilePos(d.key);
          d.items.forEach((it, i) => {
            const p = this.itemWorldPos(key, it.id) || { x: target.x, y: 1.5, z: target.z };
            this.removeFromStack(key, it.id);
            const dk = d.key;
            this.fly(it.type, p, () => this.pilePos(dk), { delay: i * cfg.DROP_STAGGER, dur: 0.24, arc: 0.7, key: dk, land: i === d.items.length - 1 ? () => TBS.Audio.play('drop') : null });
          });
          break;
        }
        case 'take': {
          const c = d.c, counter = g.chains[c.chain].counter;
          const from = this.counterSlot(counter, Math.min(counter.stack, this.cfg.COUNTER_DRAW_MAX - 1));
          const top = c.chain === 'g' ? 2.0 : 1.3;
          this.fly(g.chains[c.chain].product, from, () => ({ x: c.x, y: top + (c.got - 1) * 0.2, z: c.z }), { dur: 0.22, arc: 0.6, key: 'cust:' + c.id, scale: 0.8 });
          break;
        }
        case 'paid': {
          const c = d.c, key = 'money:' + d.key, n = Math.min(d.n, 4);
          for (let i = 0; i < n; i++) this.fly('bundle', { x: c.x, y: 1.2, z: c.z }, () => this.pilePos(key), { delay: i * 0.05, dur: 0.38, arc: 1.2, key: key, spin: 6 });
          break;
        }
        case 'tip': { // a bundle drops from the leaving alien onto the tip pile next to the table
          const c = d.c, key = 'tip:' + c.chain + d.table.idx;
          this.fly('bundle', { x: c.x, y: 1.2, z: c.z }, () => this.pilePos(key), { dur: 0.4, arc: 1.0, key: key, spin: 6, land: () => TBS.Audio.play('coin', { streak: 2 }) });
          break;
        }
        case 'collectTick': { // whole layers peel off the top of the pile and fly into the chef, one after another
          const b = this.block(d.tip), p = this.game.player;
          // the layers that disappeared from the pile this tick are the ones that fly
          const n = Math.round((this.blockHeight(d.left + d.amount, d.tip) - this.blockHeight(d.left, d.tip)) / cfg.NOTE_THICK);
          const top = this.blockHeight(d.left, d.tip);
          for (let i = 0; i < Math.min(n, 3); i++) {
            this.collectStreak = (this.collectStreak || 0) + 1;
            const streak = this.collectStreak;
            this.fly('noteTop', { x: d.x, y: top + (n - 1 - i) * cfg.NOTE_THICK, z: d.z }, () => ({ x: p.x, y: 1.05, z: p.z }),
              { delay: i * 0.03, dur: cfg.MONEY_FLY_TIME, arc: 0.7, group: b, land: () => TBS.Audio.play('coin', { streak: streak % 15 }) });
          }
          break;
        }
        case 'collect': this.collectAcc[d.key] = 0; this.collectStreak = 0; break;
        case 'payTick': { // bundles drop from the chef into the circle
          const p = this.game.player;
          this.fly('bill', { x: p.x, y: 1.3, z: p.z }, { x: d.x + (Math.random() - 0.5) * 0.5, y: 0.03, z: d.z + (Math.random() - 0.5) * 0.5 }, { dur: 0.3, arc: 0.7, spin: 7 });
          break;
        }
        case 'boost': if (d.type === 'items') {
          const ch = g.chains[g.chainOfWing(d.wing)], key = ch.source.id;
          const t = (d.wing === 2 ? cfg.LAYOUT.W2 : cfg.LAYOUT.W1).terminal.circle;
          for (let i = 0; i < Math.min(12, d.amount); i++) this.fly(ch.ingredient, { x: t.x, y: 1.4, z: t.z }, () => this.pilePos(key), { delay: i * 0.05, dur: 0.5, arc: 2.0 });
        } break;
      }
    }

    removeFromStack(key, id) {
      const s = this.stacks.get(key);
      if (!s) return;
      const i = s.items.findIndex((x) => x.id === id);
      if (i >= 0) s.items.splice(i, 1);
    }

    updateStack(key, dt) {
      const c = this.carrier(key);
      if (!c) { this.stacks.delete(key); return; }
      const s = this.stackState(key), cfg = this.cfg;
      const map = new Map(s.items.map((x) => [x.id, x]));
      const next = [];
      for (const it of c.stack) {
        let v = map.get(it.id);
        if (!v) {
          const from = this.arcFrom.get(it.id);
          this.arcFrom.delete(it.id);
          v = { id: it.id, type: it.type, y: 0, ox: 0, oz: 0, vx: 0, vz: 0, arc: from ? 0 : 1, from: from || null, yaw: (it.id * 2.399) % (Math.PI * 2) * 0.15 - 0.15 };
        }
        next.push(v);
      }
      s.items = next;
      const ax = (c.vx - s.pvx) / Math.max(dt, 1e-3), az = (c.vz - s.pvz) / Math.max(dt, 1e-3);
      s.pvx = c.vx; s.pvz = c.vz;
      s.ax += (ax - s.ax) * U.smooth(10, dt); s.az += (az - s.az) * U.smooth(10, dt);
      let h = 0.02;
      const lean = cfg.STACK_LEAN, maxL = cfg.STACK_LEAN_MAX;
      for (let i = 0; i < s.items.length; i++) {
        const it = s.items[i];
        it.y += (h - it.y) * U.smooth(16, dt);
        const hh = h + 0.2;
        let tx = -s.ax * lean * hh * 0.1, tz = -s.az * lean * hh * 0.1;
        const tl = Math.hypot(tx, tz), lim = maxL * hh * 0.35;
        if (tl > lim) { tx *= lim / tl; tz *= lim / tl; }
        const sway = Math.sin(c.walk * 3.2) * 0.012 * hh;
        tx += Math.cos(c.facing) * sway; tz -= Math.sin(c.facing) * sway;
        const k = cfg.STACK_SPRING / (1 + i * 0.07), d = cfg.STACK_DAMPING;
        it.vx += (-(it.ox - tx) * k - it.vx * d) * dt; it.vz += (-(it.oz - tz) * k - it.vz * d) * dt;
        it.ox += it.vx * dt; it.oz += it.vz * dt;
        if (it.arc < 1) it.arc = Math.min(1, it.arc + dt / cfg.ARC_TIME);
        h += STEP[it.type];
      }
      let prevOx = 0, prevOz = 0;
      for (let i = 0; i < s.items.length; i++) {
        const it = s.items[i];
        let x = c.x + it.ox, y = c.base + it.y * c.scale, z = c.z + it.oz;
        let sc = c.scale;
        if (it.arc < 1 && it.from) {
          const t = it.arc, e = t * t * (3 - 2 * t);
          x = U.lerp(it.from.x, x, e); z = U.lerp(it.from.z, z, e);
          y = U.lerp(it.from.y, y, e) + Math.sin(t * Math.PI) * cfg.ARC_HEIGHT;
          sc *= 0.8 + 0.2 * t;
        } else if (it.from && it.arc >= 1) { it.from = null; it.pop = 1; }
        if (it.pop > 0) { it.pop = Math.max(0, it.pop - dt * 6); sc *= 1 + Math.sin(it.pop * Math.PI) * 0.18; }
        const tiltZ = -(it.ox - prevOx) * 2.2, tiltX = (it.oz - prevOz) * 2.2;
        prevOx = it.ox; prevOz = it.oz;
        this.put(it.type, x, y, z, c.facing + it.yaw, tiltX, tiltZ, sc);
      }
    }

    heap(type, count, x, y, z, perRow, rows, sx, sz, scale, turn) {
      const max = this.cfg.PILE_DRAW_MAX, per = perRow * rows, step = STEP[type] * (scale || 1);
      const n = Math.min(count, max);
      for (let i = 0; i < n; i++) {
        const layer = Math.floor(i / per), j = i % per, r = Math.floor(j / perRow), cc = j % perRow;
        const ox = (cc - (perRow - 1) / 2) * sx + (layer % 2 ? sx * 0.15 : 0);
        const oz = (r - (rows - 1) / 2) * sz;
        this.put(type, x + ox, y + layer * step, z + oz, type === 'tentacle' ? (turn === undefined ? Math.PI / 2 : turn) + ((i * 0.37) % 0.3) - 0.15 : (i * 0.9) % 1.2, 0, 0, scale);
      }
    }


    update(dt) {
      const g = this.game, ch = g.chains, cfg = this.cfg, w = this.view.world;
      for (const k in this.n) this.n[k] = 0;
      if (this.tentLooks) { // every tentacle takes the look of the current pad level
        const l = g.levelOf('pad'), i = l ? Math.min(l.lv, this.tentLooks.length) - 1 : 0;
        if (i !== this.tentLook) { this.tentLook = i; this.meshes.tentacle.geometry = this.tentLooks[i]; }
      }
      this.updateStack('player', dt);
      const alive = new Set(['player']);
      for (const wk of g.workers) { alive.add('w' + wk.id); this.updateStack('w' + wk.id, dt); }
      for (const k of this.stacks.keys()) if (!alive.has(k)) this.stacks.delete(k);
      const inf = (k) => this.inflight[k] || 0;
      for (const id of ['p', 'g']) {
        const c = ch[id];
        if (id === 'g' && !g.wing2Open && !w.pop.goo.shown) continue;
        const s = c.source;
        const o = this.pileShift(s);
        this.heap(s.itemType, Math.max(0, s.pile - inf(s.id)), s.pileX + o[0], o !== NO_SHIFT ? o[1] : 0.64, s.pileZ + o[2], o !== NO_SHIFT ? this.cfg.PAD_MODEL.pileGrid[0] : s.itemType === 'tentacle' ? 4 : 3, o !== NO_SHIFT ? this.cfg.PAD_MODEL.pileGrid[1] : s.itemType === 'tentacle' ? 1 : 2, 0.34, 0.32, undefined, o !== NO_SHIFT ? 0 : undefined); // along the pad's long side (x)
        for (const m of c.machines) {
          if (!m.built || (id === 'g' && !w.pop.g1.shown) || (m.id === 'm2' && !w.pop.m2.shown)) continue;
          const nin = Math.min(Math.max(0, m.input - inf(m.id + ':in')), 36);
          for (let i = 0; i < nin; i++) { const p = this.inSlot(m, i); this.put(m.inType, p.x, p.y, p.z, m.inType === 'tentacle' ? Math.PI / 2 : i, 0, 0, 0.8); }
          const nout = Math.min(Math.max(0, m.output - inf(m.id)), 32);
          for (let i = 0; i < nout; i++) { const p = this.outSlot(m, i); this.put(m.outType, p.x, p.y, p.z, (i * 0.7) % 0.8); }
        }
        const ct = c.counter;
        if (id === 'g' && !g.wing2Open) continue;
        const shown = Math.min(Math.max(0, ct.stack - inf(ct.id)), cfg.COUNTER_DRAW_MAX);
        for (let i = 0; i < shown; i++) { const p = this.counterSlot(ct, i); this.put(c.product, p.x, p.y, p.z, (i * 0.7) % 1.0); }
        if (ct.money.amount > 0) this.moneyBlock(ct.money.x, ct.money.z, ct.money.amount, false);
        // tables: leftovers on dirty seats, tips on the floor
        for (const t of ct.tables) {
          for (const s of t.seats) if (s.dirty) { const p = this.seatPlate(t, s); this.put('plate', p.x, 0.81, p.z, s.face); }
          if (t.tip.amount > 0) this.moneyBlock(t.tip.x, t.tip.z, t.tip.amount, true);
        }
      }
      for (const c of g.customers) {
        const held = c.got - inf('cust:' + c.id);
        if (held <= 0 || c.got <= 0) continue;
        if (c.state === 'eat') { // food on the table in front of him, getting smaller while he eats
          const left = Math.ceil(c.got * Math.max(0, c.eatT) / Math.max(0.01, c.eatTotal)), p = this.seatPlate(c.table, c.seat), type = ch[c.chain].product;
          this.put('plate', p.x, 0.81, p.z, c.seat.face);
          for (let i = 0; i < left; i++) this.put(type, p.x, 0.84 + i * STEP[type] * 0.7, p.z, c.seat.face + i, 0, 0, 0.7);
          continue;
        }
        const top = c.chain === 'g' ? 2.0 : 1.3, type = ch[c.chain].product;
        const hop = c.moving ? Math.abs(Math.sin(c.walkDist * 4.2)) * 0.1 : 0;
        for (let i = 0; i < held; i++) this.put(type, c.x, top + i * STEP[type] * 0.8 + hop, c.z, c.facing, 0, 0, 0.8);
      }
      for (let i = this.flyers.length - 1; i >= 0; i--) {
        const f = this.flyers[i];
        f.t += dt;
        const to = typeof f.to === 'function' ? f.to() : f.to;
        const k = f.t < 0 ? 0 : Math.min(1, f.t / f.dur), e = k * k * (3 - 2 * k);
        const x = U.lerp(f.x0, to.x, e), z = U.lerp(f.z0, to.z, e), y = U.lerp(f.y0, to.y, e) + Math.sin(k * Math.PI) * f.arc;
        if (f.group) { // a whole layer of notes flying together, squeezing together as it reaches the chef
          const gc = f.group.cols, gr = f.group.rows, sq = 1 - 0.75 * e;
          for (let c = 0; c < gc; c++) for (let r = 0; r < gr; r++) this.put(f.type, x + (c - (gc - 1) / 2) * 0.5 * sq, y, z + (r - (gr - 1) / 2) * 0.28 * sq, 0, 0, 0, 1 - 0.35 * e);
        } else if (f.t < 0) { this.put(f.type, f.x0, f.y0, f.z0, 0, 0, 0, f.scale); continue; }
        else this.put(f.type, x, y, z, f.spin * k, 0, f.spin ? Math.sin(k * 6) * 0.4 : 0, f.scale);
        if (f.t < 0) continue;
        if (k >= 1) {
          this.flyers.splice(i, 1);
          if (f.key) this.inflight[f.key] = Math.max(0, (this.inflight[f.key] || 1) - 1);
          if (f.land) f.land();
        }
      }
      for (const k in this.meshes) TBS.B.flushInstances(this.meshes[k], this.n[k]);
      const bc = this.meshes.block.instanceColor;
      if (this.n.block) { bc.updateRange.offset = 0; bc.updateRange.count = this.n.block * 3; bc.needsUpdate = true; }
    }
  }

  TBS.ItemsView = Items;
  TBS.ItemsView.STEP = STEP;
})(window.TBS = window.TBS || {});

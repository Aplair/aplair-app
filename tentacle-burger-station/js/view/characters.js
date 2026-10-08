/* Chef, workers (simple rigs) and alien customers (instanced, one draw call per alien type). */
(function (TBS) {
  'use strict';

  const B = TBS.B, U = TBS.U;
  const Ch = TBS.Characters = {};

  // ---------- alien shapes (also used for the silhouette behind the Wing 2 door) ----------
  Ch.purpleAlienGeometry = function () {
    const P = 0x9b4dde, D = 0x6a2aa8, W = 0xffffff, K = 0x14101c;
    const parts = [
      { g: B.sph(0.5, 18, 14), c: P, p: [0, 0.56, 0], s: [1.1, 0.86, 1.0] },
      { g: B.sph(0.3, 12, 10), c: 0xb57be8, p: [0, 0.5, 0.28], s: [1.2, 0.7, 0.6] },
      { g: B.sph(0.13, 12, 8), c: K, p: [0, 0.42, 0.47], s: [1.4, 0.55, 0.6] },
      { g: B.sph(0.035, 6, 4), c: W, p: [-0.06, 0.45, 0.53] }, { g: B.sph(0.035, 6, 4), c: W, p: [0.06, 0.45, 0.53] }
    ];
    const eyes = [[-0.28, 0.95, 0.18, 0.12], [-0.08, 1.05, 0.25, 0.1], [0.12, 1.02, 0.22, 0.13], [0.3, 0.92, 0.12, 0.09]];
    for (const e of eyes) {
      parts.push({ g: B.cyl(0.035, 0.05, 0.25, 6), c: D, p: [e[0], e[1] - 0.14, e[2] - 0.05] });
      parts.push({ g: B.sph(e[3], 12, 8), c: W, p: [e[0], e[1], e[2]] });
      parts.push({ g: B.sph(e[3] * 0.5, 8, 6), c: K, p: [e[0], e[1], e[2] + e[3] * 0.7] });
    }
    for (let i = 0; i < 4; i++) {
      const a = (i + 0.5) / 4 * Math.PI * 2;
      parts.push({ g: B.cyl(0.06, 0.11, 0.28, 8), c: D, p: [Math.sin(a) * 0.32, 0.12, Math.cos(a) * 0.28] });
    }
    parts.push({ g: B.cyl(0.04, 0.07, 0.4, 6), c: D, p: [-0.55, 0.55, 0.05], r: [0, 0, 1.0] });
    parts.push({ g: B.cyl(0.04, 0.07, 0.4, 6), c: D, p: [0.55, 0.55, 0.05], r: [0, 0, -1.0] });
    return B.merge(parts);
  };

  Ch.greenAlienGeometry = function () {
    const G = 0x3b8cff, D = 0x1f5fbf, L = 0xa9d0ff, W = 0xffffff, K = 0x0c1018; // Wing 2 alien is blue
    return B.merge([
      { g: B.cyl(0.5, 0.55, 0.06, 18), c: L, p: [0, 0.03, 0] },
      { g: B.sph(0.42, 16, 12), c: G, p: [0, 0.48, 0], s: [1.0, 1.1, 0.95] },
      { g: B.cyl(0.17, 0.37, 0.7, 14), c: G, p: [0, 1.0, 0] },
      { g: B.sph(0.24, 14, 10), c: G, p: [0, 1.42, 0.02] },
      { g: B.cyl(0.03, 0.04, 0.28, 6), c: D, p: [0.08, 1.7, 0.05], r: [0.2, 0, -0.2] },
      { g: B.sph(0.15, 12, 10), c: W, p: [0.12, 1.86, 0.1] },
      { g: B.sph(0.075, 8, 6), c: K, p: [0.13, 1.87, 0.22] },
      { g: B.sph(0.08, 10, 8), c: W, p: [-0.12, 1.5, 0.2] },
      { g: B.sph(0.04, 6, 4), c: K, p: [-0.12, 1.5, 0.27] },
      { g: B.sph(0.11, 10, 8), c: 0x2a1a10, p: [0, 1.27, 0.2], s: [1.3, 0.6, 0.6] },
      { g: B.sph(0.045, 6, 5), c: L, p: [0.04, 1.14, 0.25] },
      { g: B.sph(0.035, 6, 5), c: L, p: [0.05, 1.03, 0.25] },
      { g: B.sph(0.03, 6, 5), c: L, p: [-0.05, 1.09, 0.24] },
      { g: B.cyl(0.04, 0.07, 0.62, 6), c: D, p: [-0.38, 0.95, 0.05], r: [0.1, 0, 0.35] },
      { g: B.cyl(0.04, 0.07, 0.62, 6), c: D, p: [0.38, 0.95, 0.05], r: [0.1, 0, -0.35] }
    ]);
  };

  // ---------- chef / worker rig ----------
  function makeRig(suit, hat) {
    const skin = 0xf2c7a0, white = 0xf6f8fb;
    const g = new THREE.Group();
    const bodyParts = [
      { g: B.cyl(0.25, 0.3, 0.58, 14), c: suit, p: [0, 0.82, 0] },
      { g: B.box(0.36, 0.42, 0.06), c: white, p: [0, 0.78, 0.27] },
      { g: B.cyl(0.14, 0.14, 0.42, 10), c: 0x2fa8a0, p: [0, 0.88, -0.3] },
      { g: B.sph(0.24, 16, 12), c: skin, p: [0, 1.3, 0] },
      { g: B.sph(0.035, 6, 4), c: 0x1a1a22, p: [-0.08, 1.33, 0.22] }, { g: B.sph(0.035, 6, 4), c: 0x1a1a22, p: [0.08, 1.33, 0.22] },
      { g: B.sph(0.05, 8, 6), c: 0xe8a07a, p: [0, 1.27, 0.24] }
    ];
    if (hat === 'chef') {
      bodyParts.push({ g: B.cyl(0.19, 0.2, 0.18, 14), c: white, p: [0, 1.52, 0] });
      bodyParts.push({ g: B.sph(0.25, 14, 10), c: white, p: [0, 1.63, 0], s: [1, 0.55, 1] });
      bodyParts.push({ g: B.cyl(0.205, 0.205, 0.05, 14), c: 0xff7a2a, p: [0, 1.46, 0] });
    } else {
      bodyParts.push({ g: B.sph(0.26, 14, 10), c: hat, p: [0, 1.38, -0.02], s: [1, 0.75, 1] });
      bodyParts.push({ g: B.box(0.42, 0.04, 0.2), c: hat, p: [0, 1.35, 0.2] });
    }
    const body = B.mesh(bodyParts);
    g.add(body);
    const limb = (len, r, c) => B.mesh([{ g: B.cyl(r, r * 1.1, len, 8), c: c, p: [0, -len / 2, 0] }, { g: B.sph(r * 1.25, 8, 6), c: c === suit ? skin : 0x2a3142, p: [0, -len, 0.02] }]);
    const legL = limb(0.5, 0.09, 0x3a4255), legR = limb(0.5, 0.09, 0x3a4255);
    legL.position.set(-0.13, 0.53, 0); legR.position.set(0.13, 0.53, 0);
    const armL = limb(0.42, 0.07, suit), armR = limb(0.42, 0.07, suit);
    armL.position.set(-0.3, 1.05, 0); armR.position.set(0.3, 1.05, 0);
    // tray held in front with both hands (items stack on it)
    const cfg = TBS.CONFIG;
    const tray = B.mesh([{ g: B.box(0.62, 0.04, 0.5), c: 0xc9d1dc, p: [0, 0, 0] }, { g: B.box(0.66, 0.06, 0.04), c: 0x8a93a3, p: [0, 0.02, 0.25] }, { g: B.box(0.66, 0.06, 0.04), c: 0x8a93a3, p: [0, 0.02, -0.25] }]);
    tray.position.set(0, cfg.TRAY_HEIGHT - 0.03, cfg.TRAY_FORWARD);
    tray.visible = false;
    g.add(legL, legR, armL, armR, tray);
    return { group: g, body: body, legL: legL, legR: legR, armL: armL, armR: armR, tray: tray, phase: 0, carry: 0 };
  }

  function animateRig(rig, speed, maxSpeed, carrying, dt, walkDist) {
    const k = U.clamp(speed / Math.max(1, maxSpeed), 0, 1);
    const ph = walkDist * 3.2;
    rig.legL.rotation.x = Math.sin(ph) * 0.7 * k;
    rig.legR.rotation.x = -Math.sin(ph) * 0.7 * k;
    rig.body.position.y = Math.abs(Math.sin(ph)) * 0.05 * k;
    rig.carry += ((carrying ? 1 : 0) - rig.carry) * U.smooth(12, dt);
    const fwd = -1.45 * rig.carry; // arms reach forward to hold the tray
    rig.armL.rotation.x = fwd + Math.sin(ph + Math.PI) * 0.6 * k * (1 - rig.carry);
    rig.armR.rotation.x = fwd + Math.sin(ph) * 0.6 * k * (1 - rig.carry);
    rig.armL.rotation.z = 0.25 * rig.carry; rig.armR.rotation.z = -0.25 * rig.carry;
    rig.tray.visible = rig.carry > 0.5;
  }

  class Characters {
    constructor(view) {
      this.view = view; this.game = view.game; this.scene = view.scene;
      const col = TBS.CONFIG.COLORS;
      this.chef = makeRig(col.chef, 'chef');
      this.chef.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      this.scene.add(this.chef.group);
      // space hover board (floor offer): the chef rides it while it lasts
      this.board = B.mesh([{ g: B.cyl(0.5, 0.42, 0.1, 22), c: 0x3b8cff, p: [0, 0, 0] }, { g: B.cyl(0.34, 0.34, 0.04, 22), c: 0x2fe0c8, p: [0, -0.07, 0] }, { g: B.box(0.62, 0.03, 0.16), c: 0xffffff, p: [0, 0.06, 0] }], { own: true });
      this.board.visible = false;
      this.scene.add(this.board);
      this.workers = new Map();
      const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
      this.alien = {
        p: new THREE.InstancedMesh(Ch.purpleAlienGeometry(), mat, 72),
        g: new THREE.InstancedMesh(Ch.greenAlienGeometry(), mat, 72)
      };
      this.foot = new THREE.InstancedMesh(B.merge([{ g: B.sph(0.11, 8, 6), c: 0x6fa8ff, p: [0, 0.05, 0], s: [1, 0.5, 1.5] }]), mat, 72);
      this.cashiers = {}; // counter id -> rig (appears when a cashier is bought)
      for (const k of ['p', 'g']) { this.alien[k].castShadow = true; this.alien[k].count = 0; this.alien[k].frustumCulled = false; this.scene.add(this.alien[k]); }
      this.foot.count = 0; this.foot.frustumCulled = false; this.scene.add(this.foot);
      this.happy = new Map(); // customer id -> jump timer
      this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(); this.v = new THREE.Vector3(); this.s = new THREE.Vector3();
      this.time = 0;
    }

    stackBase(who) { return who === 'chef' ? 1.74 : 1.6; }

    onEvent(e) {
      if (e.type === 'happy') this.happy.set(e.data.c.id, 0);
      else if (e.type === 'customerLeave') this.happy.delete(e.data.c.id);
      else if (e.type === 'workerLeave') { const r = this.workers.get(e.data.w.id); if (r) { this.view.fx.burst(r.group.position.x, 1, r.group.position.z, 0x2fd0b8, 16); this.scene.remove(r.group); this.workers.delete(e.data.w.id); } }
    }

    update(dt) {
      const g = this.game, p = g.player, cfg = g.cfg;
      this.time += dt;
      // chef
      const ch = this.chef;
      const hover = g.effects.hover > 0, lift = hover ? cfg.HOVER_LIFT + Math.sin(this.time * 5) * 0.03 : 0;
      ch.group.position.set(p.x, lift, p.z);
      ch.group.rotation.y = p.facing;
      this.board.visible = hover;
      if (hover) { this.board.position.set(p.x, lift - 0.06, p.z); this.board.rotation.y = p.facing; }
      animateRig(ch, p.speedNow(), p.maxSpeed(g), p.stack.length > 0, dt, p.walkDist);
      // workers
      const seen = new Set();
      for (const w of g.workers) {
        seen.add(w.id);
        let r = this.workers.get(w.id);
        if (!r) {
          r = makeRig(w.temp > 0 ? cfg.COLORS.tempWorker : cfg.COLORS.worker, 0xf2c230);
          r.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
          r.group.scale.setScalar(0.92);
          this.scene.add(r.group);
          this.workers.set(w.id, r);
          this.view.fx.popIn(r.group, 0.92);
        }
        r.group.position.set(w.x, 0, w.z);
        r.group.rotation.y = w.facing;
        const wsp = TBS.Workers.speed(g, w);
        animateRig(r, w.moving ? wsp : 0, wsp, w.stack.length > 0, dt, w.walkDist);
      }
      for (const [id, r] of this.workers) if (!seen.has(id)) { this.scene.remove(r.group); this.workers.delete(id); }
      // bought cashiers: stand in the cashier spot forever, facing the counter, a small bob while selling
      for (const cid in g.chains) {
        const ct = g.chains[cid].counter;
        if (!ct.hasCashier) continue;
        let r = this.cashiers[ct.id];
        if (!r) {
          r = makeRig(cfg.COLORS.cashier, 0xffffff);
          r.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
          r.group.position.set(ct.cashier.x, 0, ct.cashier.z);
          const cx = (ct.rect.x0 + ct.rect.x1) / 2, cz = (ct.rect.z0 + ct.rect.z1) / 2;
          r.group.rotation.y = Math.abs(cx - ct.cashier.x) > Math.abs(cz - ct.cashier.z) ? Math.atan2(cx - ct.cashier.x, 0) : Math.atan2(0, cz - ct.cashier.z); // faces the counter
          this.scene.add(r.group);
          this.view.fx.popIn(r.group, 1);
          this.cashiers[ct.id] = r;
        }
        const front = ct.line[0], selling = front && front.state === 'line' && front.got < front.order && ct.stack > 0;
        r.body.position.y = selling ? Math.abs(Math.sin(this.time * 12)) * 0.04 : 0;
        r.armR.rotation.x = selling ? -1.2 + Math.sin(this.time * 12) * 0.3 : 0;
      }
      // customers
      const cnt = { p: 0, g: 0 };
      let feet = 0;
      const t = this.time;
      for (const c of g.customers) {
        const mesh = this.alien[c.chain];
        if (cnt[c.chain] >= mesh.instanceMatrix.count) continue;
        let y = 0, sy = 1, sxz = 1, tilt = 0;
        const ph = c.id * 1.37;
        if (c.moving) {
          y = Math.abs(Math.sin(c.walkDist * 4.2)) * (c.chain === 'g' ? 0.06 : 0.1);
          sy = 1 + Math.sin(c.walkDist * 8.4) * 0.05; sxz = 1 / Math.sqrt(sy);
          tilt = 0.08;
        } else {
          sy = 1 + Math.sin(t * 3 + ph) * 0.04; sxz = 1 / Math.sqrt(sy);
        }
        if (c.state === 'eat') { y += 0.42; sy *= 0.92 + Math.max(0, Math.sin(t * 7 + ph)) * 0.05; } // sitting, munching
        if (this.happy.has(c.id)) { // happy jump after being served
          const ht = this.happy.get(c.id) + dt;
          this.happy.set(c.id, ht);
          const k = Math.min(1, ht / cfg.HAPPY_TIME);
          y += Math.sin(k * Math.PI) * 0.65;
          sy *= 1 + Math.sin(k * Math.PI * 2) * 0.12;
        }
        this.e.set(tilt, c.facing, 0);
        this.q.setFromEuler(this.e);
        this.v.set(c.x, y, c.z);
        this.s.set(sxz, sy, sxz);
        this.m.compose(this.v, this.q, this.s);
        mesh.setMatrixAt(cnt[c.chain]++, this.m);
        // green aliens tap a foot while waiting (impatient look)
        if (c.chain === 'g' && !c.moving && feet < this.foot.instanceMatrix.count) {
          const tap = Math.max(0, Math.sin(t * 9 + ph)) * 0.12;
          const fx = 0.22, fz = 0.32, cs = Math.cos(c.facing), sn = Math.sin(c.facing);
          this.v.set(c.x + cs * fx + sn * fz, y + tap, c.z - sn * fx + cs * fz);
          this.q.setFromEuler(this.e.set(-tap * 2, c.facing, 0));
          this.m.compose(this.v, this.q, this.s.set(1, 1, 1));
          this.foot.setMatrixAt(feet++, this.m);
        }
      }
      for (const k of ['p', 'g']) { this.alien[k].count = Math.min(cnt[k], this.alien[k].instanceMatrix.count); this.alien[k].instanceMatrix.needsUpdate = true; }
      this.foot.count = feet; this.foot.instanceMatrix.needsUpdate = true;
    }
  }

  TBS.CharactersView = Characters;
})(window.TBS = window.TBS || {});

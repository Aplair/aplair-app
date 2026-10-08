/* Fixed isometric camera (orthographic, 45 deg turn, ~37 deg down) that smoothly follows the chef,
   rises with tall stacks, and takes a short trip to Wing 2 when it wakes up. */
(function (TBS) {
  'use strict';

  const U = TBS.U;

  class CameraRig {
    constructor(view) {
      this.view = view;
      const cfg = view.game.cfg, yaw = cfg.CAM_YAW_DEG * Math.PI / 180, pitch = cfg.CAM_PITCH_DEG * Math.PI / 180;
      this.cam = new THREE.OrthographicCamera(-10, 10, 6, -6, 0.5, 220);
      this.offset = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(70);
      const p = view.game.player;
      this.target = new THREE.Vector3(p.x, 0, p.z);
      this.desired = new THREE.Vector3();
      this.dir = this.offset.clone().negate().normalize();
      this.known = null;   // build circles already seen
      this.tour = null;    // new far circles to show in ONE trip: chef -> circle 1 -> circle 2 ... -> back to the chef
      this.place();
    }

    // a new build circle appeared: queue a quick camera visit
    watchOffers() {
      const g = this.view.game, keys = new Set(g.offers.map((o) => o.trackId + ':' + o.step));
      if (!this.known) { this.known = keys; return; }
      const cfg = g.cfg, v = this.tmpV || (this.tmpV = new THREE.Vector3());
      const fresh = [];
      for (const o of g.offers) {
        const k = o.trackId + ':' + o.step;
        if (this.known.has(k) || g.revealing()) continue;
        // only far circles: one you can already see well on screen (near you) gets no camera trip
        v.set(o.x, 0, o.z).project(this.cam);
        if (Math.abs(v.x) < cfg.CAM_FOCUS_SKIP && Math.abs(v.y) < cfg.CAM_FOCUS_SKIP) continue;
        fresh.push({ x: o.x, z: o.z });
      }
      if (fresh.length) {
        // nearest first, then the next nearest from there (a short path, no going back and forth)
        const pts = [], p = g.player;
        let cx = p.x, cz = p.z;
        while (fresh.length) {
          let bi = 0;
          for (let i = 1; i < fresh.length; i++) if (Math.hypot(fresh[i].x - cx, fresh[i].z - cz) < Math.hypot(fresh[bi].x - cx, fresh[bi].z - cz)) bi = i;
          const q = fresh.splice(bi, 1)[0]; pts.push(q); cx = q.x; cz = q.z;
        }
        if (!this.tour) this.tour = { pts: [], t: 0 };
        this.tour.pts = this.tour.pts.concat(pts).slice(0, 4); // still flying: the new ones join the same trip
      }
      this.known = keys;
    }

    resize(w, h) {
      const cfg = this.view.game.cfg, aspect = w / Math.max(1, h);
      let vh = cfg.CAM_VIEW_HEIGHT, vw = vh * aspect;
      if (vw < cfg.CAM_MIN_VIEW_WIDTH) { vw = cfg.CAM_MIN_VIEW_WIDTH; vh = vw / aspect; }
      this.cam.left = -vw / 2; this.cam.right = vw / 2; this.cam.top = vh / 2; this.cam.bottom = -vh / 2;
      this.cam.updateProjectionMatrix();
    }

    place() {
      this.cam.position.copy(this.target).add(this.offset);
      this.cam.lookAt(this.target);
      this.cam.updateMatrixWorld();
    }

    update(dt) {
      const g = this.view.game, cfg = g.cfg, p = g.player;
      this.watchOffers();
      const lift = Math.min(p.stack.length, 20) * 0.22 * cfg.CAM_STACK_LIFT;
      this.desired.set(p.x + p.vx * cfg.CAM_LOOKAHEAD, lift, p.z + p.vz * cfg.CAM_LOOKAHEAD);
      if (g.revealing()) { // trip to Wing 2 and back
        const k = 1 - g.revealT / cfg.REVEAL_SECONDS;
        const w = k < 0.25 ? k / 0.25 : k < 0.8 ? 1 : 1 - (k - 0.8) / 0.2;
        const e = w * w * (3 - 2 * w);
        const W2 = cfg.LAYOUT.WING2; // look at the middle of Wing 2
        this.desired.x = U.lerp(this.desired.x, (W2.x0 + W2.x1) / 2, e);
        this.desired.z = U.lerp(this.desired.z, (W2.z0 + W2.z1) / 2, e);
        this.desired.y = U.lerp(this.desired.y, 0, e);
        this.target.lerp(this.desired, U.smooth(9, dt));
      } else if (this.tour) { // ONE trip over all new far circles: fly, hold at each, then back to the chef (the game keeps running)
        const tr = this.tour, T = cfg.CAM_FOCUS_TIME, fly = T * 0.28, hold = T * 0.44, n = tr.pts.length;
        tr.t += dt;
        const chef = { x: this.desired.x, z: this.desired.z };
        const stops = [chef].concat(tr.pts, [chef]);
        let t = tr.t, x = chef.x, z = chef.z, done = true;
        for (let i = 0; i < n + 1; i++) {
          if (t < fly) { const k = t / fly, e = k * k * (3 - 2 * k); x = U.lerp(stops[i].x, stops[i + 1].x, e); z = U.lerp(stops[i].z, stops[i + 1].z, e); done = false; break; }
          t -= fly;
          if (i < n) { if (t < hold) { x = stops[i + 1].x; z = stops[i + 1].z; done = false; break; } t -= hold; }
        }
        this.desired.x = x; this.desired.z = z;
        this.target.lerp(this.desired, U.smooth(14, dt));
        if (done) this.tour = null;
      } else this.target.lerp(this.desired, U.smooth(cfg.CAM_FOLLOW, dt));
      this.place();
    }
  }

  TBS.CameraRig = CameraRig;
})(window.TBS = window.TBS || {});

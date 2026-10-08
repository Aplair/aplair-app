/* Juice: steam puffs from machines, confetti bursts on unlocks, elastic pop-in for new things. All instanced. */
(function (TBS) {
  'use strict';

  const B = TBS.B;

  class Fx {
    constructor(view) {
      this.view = view; this.scene = view.scene;
      this.puffMesh = new THREE.InstancedMesh(B.sph(0.16, 10, 8), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }), 80);
      this.puffMesh.count = 0; this.puffMesh.frustumCulled = false;
      this.scene.add(this.puffMesh);
      this.sparkMesh = new THREE.InstancedMesh(B.box(0.1, 0.1, 0.03), new THREE.MeshBasicMaterial({ color: 0xffffff }), 400);
      this.sparkMesh.count = 0; this.sparkMesh.frustumCulled = false;
      this.sparkMesh.setColorAt(0, new THREE.Color(1, 1, 1));
      this.scene.add(this.sparkMesh);
      this.puffs = []; this.sparks = []; this.tweens = [];
      this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(); this.v = new THREE.Vector3(); this.s = new THREE.Vector3(); this.c = new THREE.Color();
      this.palette = [0xff5a7a, 0xffd23a, 0x37b6ff, 0x9b4dde, 0x6ccf3c, 0xff9a2e, 0xffffff];
    }

    steam(x, y, z) {
      for (let i = 0; i < 3; i++) this.puffs.push({ x: x + (Math.random() - 0.5) * 0.15, y: y, z: z + (Math.random() - 0.5) * 0.15, vy: 0.9 + Math.random() * 0.5, t: -i * 0.07, life: 0.8 + Math.random() * 0.3, s: 0.6 + Math.random() * 0.5 });
    }

    burst(x, y, z, color, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 2.5;
        const c = i % 3 === 0 && color !== undefined ? color : this.palette[(Math.random() * this.palette.length) | 0];
        this.sparks.push({ x: x, y: y, z: z, vx: Math.cos(a) * sp, vy: 3 + Math.random() * 3.5, vz: Math.sin(a) * sp, t: 0, life: 0.9 + Math.random() * 0.5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 18, c: c });
      }
    }

    popIn(obj, scale, flat) {
      const s = scale || 1;
      obj.scale.setScalar(0.001);
      this.tweens.push({ obj: obj, t: 0, dur: 0.45, s: s });
    }

    onEvent(e) {
      const d = e.data;
      if (e.type === 'cooked') {
        const g = this.view.game;
        for (const id in g.chains) for (const m of g.chains[id].machines) if (m.id === d.key) this.steam((m.rect.x0 + m.rect.x1) / 2 - 0.6, 2.0, (m.rect.z0 + m.rect.z1) / 2 + 0.85);
      } else if (e.type === 'happy') {
        this.burst(d.c.x, 1.6, d.c.z, d.c.chain === 'g' ? 0x6ccf3c : 0x9b4dde, 6);
      }
    }

    update(dt) {
      // puffs
      let n = 0;
      for (let i = this.puffs.length - 1; i >= 0; i--) {
        const p = this.puffs[i];
        p.t += dt;
        if (p.t >= p.life) { this.puffs.splice(i, 1); continue; }
        if (p.t < 0) continue;
        p.y += p.vy * dt;
        const k = p.t / p.life, sc = p.s * (0.4 + k * 1.2) * (1 - k * k);
        this.m.compose(this.v.set(p.x, p.y, p.z), this.q.identity(), this.s.set(sc, sc, sc));
        if (n < this.puffMesh.instanceMatrix.count) this.puffMesh.setMatrixAt(n++, this.m);
      }
      TBS.B.flushInstances(this.puffMesh, n);
      // sparks
      n = 0;
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const s = this.sparks[i];
        s.t += dt;
        if (s.t >= s.life || s.y < 0.02) { this.sparks.splice(i, 1); continue; }
        s.vy -= 9 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.r += s.vr * dt;
        const sc = 1 - s.t / s.life * 0.6;
        this.e.set(s.r, s.r * 0.7, s.r * 0.3);
        this.m.compose(this.v.set(s.x, s.y, s.z), this.q.setFromEuler(this.e), this.s.set(sc, sc, sc));
        if (n < this.sparkMesh.instanceMatrix.count) { this.sparkMesh.setMatrixAt(n, this.m); this.sparkMesh.setColorAt(n, this.c.setHex(s.c)); n++; }
      }
      TBS.B.flushInstances(this.sparkMesh, n);
      if (n && this.sparkMesh.instanceColor) { const ic = this.sparkMesh.instanceColor; ic.updateRange.offset = 0; ic.updateRange.count = n * 3; ic.needsUpdate = true; }
      // elastic pop-in
      for (let i = this.tweens.length - 1; i >= 0; i--) {
        const tw = this.tweens[i];
        tw.t += dt;
        const k = Math.min(1, tw.t / tw.dur);
        const el = k >= 1 ? 1 : 1 - Math.pow(2, -9 * k) * Math.cos(k * Math.PI * 3.2);
        tw.obj.scale.setScalar(Math.max(0.001, el * tw.s));
        if (k >= 1) { tw.obj.scale.setScalar(tw.s); this.tweens.splice(i, 1); }
      }
    }
  }

  TBS.FxView = Fx;
})(window.TBS = window.TBS || {});

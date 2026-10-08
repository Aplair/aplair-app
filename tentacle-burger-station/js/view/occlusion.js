/* Anything between the camera and the chef (or his stack) becomes see-through, so nothing ever hides the player. */
(function (TBS) {
  'use strict';

  const U = TBS.U;

  class Occlusion {
    constructor(view) {
      this.view = view;
      this.ray = new THREE.Ray();
      this.hit = new THREE.Vector3();
      this.pts = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
      for (const o of view.world.occluders) {
        o.op = 1;
        o.mats = [];
        o.obj.traverse((m) => { if (m.isMesh && m.material && o.mats.indexOf(m.material) < 0) o.mats.push(m.material); });
      }
    }

    update(dt) {
      const g = this.view.game, p = g.player, cfg = g.cfg, dir = this.view.cam.dir;
      const top = 1.85 + Math.min(p.stack.length, 20) * 0.22;
      this.pts[0].set(p.x, 0.4, p.z); this.pts[1].set(p.x, 1.4, p.z); this.pts[2].set(p.x, top, p.z);
      for (const o of this.view.world.occluders) {
        let blocked = false;
        if (o.obj.visible) {
          for (const pt of this.pts) {
            this.ray.origin.copy(pt).addScaledVector(dir, -60);
            this.ray.direction.copy(dir);
            if (this.ray.intersectBox(o.box, this.hit) && this.hit.distanceTo(this.ray.origin) < 59.8) { blocked = true; break; }
          }
        }
        const target = blocked ? cfg.OCCLUDER_FADE : 1;
        if (Math.abs(o.op - target) < 0.005 && (o.op === 1 || o.op === target)) continue;
        o.op += (target - o.op) * U.smooth(10, dt);
        if (Math.abs(o.op - target) < 0.01) o.op = target;
        for (const m of o.mats) {
          m.transparent = o.op < 0.995;
          m.opacity = o.op;
          m.depthWrite = o.op >= 0.995;
        }
      }
    }
  }

  TBS.Occlusion = Occlusion;
})(window.TBS = window.TBS || {});

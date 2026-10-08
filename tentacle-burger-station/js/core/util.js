/* Small math + helper functions shared by the game, the view and the simulation. No DOM, no THREE. */
(function (TBS) {
  'use strict';

  const U = TBS.U = {};

  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
  U.smooth = (rate, dt) => 1 - Math.exp(-rate * dt); // frame-rate independent smoothing factor

  // Seeded random numbers (mulberry32) so the simulation is repeatable.
  U.makeRng = function (seed) {
    let s = (seed >>> 0) || 1;
    const rng = function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    rng.range = (a, b) => a + (b - a) * rng();
    rng.int = (a, b) => a + Math.floor(rng() * (b - a + 1));
    return rng;
  };

  // Round money amounts to friendly numbers ($37 -> $35, $1234 -> $1,250).
  U.niceRound = function (v) {
    if (!(v > 0)) return 0;
    if (v < 20) return Math.max(1, Math.round(v));
    if (v < 100) return Math.round(v / 5) * 5;
    if (v < 1000) return Math.round(v / 10) * 10;
    if (v < 10000) return Math.round(v / 50) * 50;
    return Math.round(v / 100) * 100;
  };

  U.fmtMoney = function (v) {
    const n = Math.floor(Math.max(0, v));
    return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  U.fmtShort = function (v) { // compact for price circles: $950, $1.2K, $15K
    const n = Math.ceil(Math.max(0, v));
    if (n < 1000) return '$' + n;
    if (n < 10000) return '$' + (Math.round(n / 100) / 10).toFixed(1).replace(/\.0$/, '') + 'K';
    if (n < 1000000) return '$' + Math.round(n / 1000) + 'K';
    return '$' + (Math.round(n / 100000) / 10) + 'M';
  };

  U.fmtTime = function (s) {
    s = Math.max(0, Math.ceil(s));
    const m = Math.floor(s / 60), r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  };

  U.angleLerp = function (a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  };

  // Point inside rectangle {x0,x1,z0,z1}?
  U.inRect = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

  // Push a circle (x,z,radius) out of a rectangle. Returns corrected {x,z} or null when not touching.
  U.pushOutOfRect = function (x, z, rad, r) {
    const cx = U.clamp(x, r.x0, r.x1), cz = U.clamp(z, r.z0, r.z1);
    let dx = x - cx, dz = z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= rad * rad) return null;
    if (d2 > 1e-9) {
      const d = Math.sqrt(d2), k = (rad - d) / d;
      return { x: x + dx * k, z: z + dz * k };
    }
    // centre is inside the rectangle: leave through the nearest side
    const left = x - r.x0, right = r.x1 - x, back = z - r.z0, front = r.z1 - z;
    const m = Math.min(left, right, back, front);
    if (m === left) return { x: r.x0 - rad, z: z };
    if (m === right) return { x: r.x1 + rad, z: z };
    if (m === back) return { x: x, z: r.z0 - rad };
    return { x: x, z: r.z1 + rad };
  };
})(window.TBS = window.TBS || {});

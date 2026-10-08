/* Grid path finding (A*) used by workers and by the simulation bot. Rebuilt when obstacles change. */
(function (TBS) {
  'use strict';

  const SQ2 = Math.SQRT2;

  class Nav {
    constructor(x0, z0, x1, z1, cell) {
      this.x0 = x0; this.z0 = z0; this.cell = cell;
      this.w = Math.ceil((x1 - x0) / cell);
      this.h = Math.ceil((z1 - z0) / cell);
      this.blocked = new Uint8Array(this.w * this.h);
      this.g = new Float32Array(this.w * this.h);
      this.from = new Int32Array(this.w * this.h);
      this.stamp = new Uint32Array(this.w * this.h);
      this.closed = new Uint32Array(this.w * this.h);
      this.run = 0;
      this.heap = [];
    }

    rebuild(rects, radius) {
      const b = this.blocked;
      b.fill(0);
      for (let j = 0; j < this.h; j++) {
        const z = this.z0 + (j + 0.5) * this.cell;
        for (let i = 0; i < this.w; i++) {
          const x = this.x0 + (i + 0.5) * this.cell;
          for (let k = 0; k < rects.length; k++) {
            const r = rects[k];
            if (x > r.x0 - radius && x < r.x1 + radius && z > r.z0 - radius && z < r.z1 + radius) { b[j * this.w + i] = 1; break; }
          }
        }
      }
    }

    idx(x, z) {
      const i = Math.floor((x - this.x0) / this.cell), j = Math.floor((z - this.z0) / this.cell);
      if (i < 0 || j < 0 || i >= this.w || j >= this.h) return -1;
      return j * this.w + i;
    }

    free(id) { return id >= 0 && !this.blocked[id]; }

    nearestFree(id) {
      if (this.free(id)) return id;
      if (id < 0) return -1;
      const ci = id % this.w, cj = (id / this.w) | 0;
      for (let r = 1; r < 12; r++) {
        for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
          if (Math.abs(di) !== r && Math.abs(dj) !== r) continue;
          const i = ci + di, j = cj + dj;
          if (i < 0 || j < 0 || i >= this.w || j >= this.h) continue;
          const n = j * this.w + i;
          if (!this.blocked[n]) return n;
        }
      }
      return -1;
    }

    center(id) {
      return { x: this.x0 + ((id % this.w) + 0.5) * this.cell, z: this.z0 + (((id / this.w) | 0) + 0.5) * this.cell };
    }

    // True when the straight line a->b only crosses free cells.
    lineFree(ax, az, bx, bz) {
      const d = Math.hypot(bx - ax, bz - az), steps = Math.max(1, Math.ceil(d / (this.cell * 0.5)));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const id = this.idx(ax + (bx - ax) * t, az + (bz - az) * t);
        if (!this.free(id)) return false;
      }
      return true;
    }

    // Returns a list of points from a to b (excluding a), or [] when unreachable.
    findPath(ax, az, bx, bz) {
      if (this.lineFree(ax, az, bx, bz)) return [{ x: bx, z: bz }];
      const s = this.nearestFree(this.idx(ax, az)), t = this.nearestFree(this.idx(bx, bz));
      if (s < 0 || t < 0) return [];
      const run = ++this.run, w = this.w, g = this.g, from = this.from, stamp = this.stamp, closed = this.closed;
      const tc = this.center(t), heap = this.heap;
      heap.length = 0;
      const hfun = (id) => {
        const dx = Math.abs((id % w) - (t % w)), dz = Math.abs(((id / w) | 0) - ((t / w) | 0));
        return (dx + dz + (SQ2 - 2) * Math.min(dx, dz));
      };
      const push = (id, f) => {
        heap.push([f, id]);
        let i = heap.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heap[p][0] <= heap[i][0]) break;
          const tmp = heap[p]; heap[p] = heap[i]; heap[i] = tmp; i = p;
        }
      };
      const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length > 0) {
          heap[0] = last;
          let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = l + 1;
            let m = i;
            if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
            if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
            if (m === i) break;
            const tmp = heap[m]; heap[m] = heap[i]; heap[i] = tmp; i = m;
          }
        }
        return top;
      };
      stamp[s] = run; g[s] = 0; from[s] = -1;
      push(s, hfun(s));
      let found = false, guard = 0;
      while (heap.length && guard++ < 20000) {
        const cur = pop()[1];
        if (closed[cur] === run) continue;
        closed[cur] = run;
        if (cur === t) { found = true; break; }
        const ci = cur % w, cj = (cur / w) | 0;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          const ni = ci + di, nj = cj + dj;
          if (ni < 0 || nj < 0 || ni >= w || nj >= this.h) continue;
          const n = nj * w + ni;
          if (this.blocked[n] || closed[n] === run) continue;
          if (di && dj && (this.blocked[cj * w + ni] || this.blocked[nj * w + ci])) continue; // no corner cutting
          const ng = g[cur] + (di && dj ? SQ2 : 1);
          if (stamp[n] !== run || ng < g[n]) {
            stamp[n] = run; g[n] = ng; from[n] = cur;
            push(n, ng + hfun(n));
          }
        }
      }
      if (!found) return [];
      const cells = [];
      for (let c = t; c !== -1; c = from[c]) cells.push(c);
      cells.reverse();
      const pts = cells.map((c) => this.center(c));
      pts[pts.length - 1] = { x: bx, z: bz };
      if (!this.free(this.idx(bx, bz))) pts[pts.length - 1] = tc;
      // string pulling: keep only the corners we need
      const out = [];
      let ox = ax, oz = az, i = 0;
      while (i < pts.length) {
        let j = pts.length - 1;
        while (j > i && !this.lineFree(ox, oz, pts[j].x, pts[j].z)) j--;
        out.push(pts[j]);
        ox = pts[j].x; oz = pts[j].z; i = j + 1;
      }
      return out;
    }
  }

  TBS.Nav = Nav;
})(window.TBS = window.TBS || {});

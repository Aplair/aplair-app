/* Helpers to build simple flat-colour shapes (boxes, cylinders, spheres) merged into one mesh = one draw call. */
(function (TBS) {
  'use strict';

  const B = TBS.B = {};
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const col = new THREE.Color();

  B.box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  B.cyl = (rt, rb, h, seg) => new THREE.CylinderGeometry(rt, rb, h, seg || 16);
  B.sph = (r, ws, hs) => new THREE.SphereGeometry(r, ws || 14, hs || 10);

  // part = { g: geometry, c: hex colour, p: [x,y,z], r: [rx,ry,rz], s: [sx,sy,sz] or number }
  B.merge = function (parts) {
    let count = 0;
    const prepared = parts.map((pt) => {
      const g = pt.g.index ? pt.g.toNonIndexed() : pt.g.clone();
      const p = pt.p || [0, 0, 0], r = pt.r || [0, 0, 0];
      const sc = pt.s === undefined ? [1, 1, 1] : (typeof pt.s === 'number' ? [pt.s, pt.s, pt.s] : pt.s);
      e.set(r[0], r[1], r[2]); q.setFromEuler(e); v.set(p[0], p[1], p[2]); s.set(sc[0], sc[1], sc[2]);
      m4.compose(v, q, s);
      g.applyMatrix4(m4);
      count += g.attributes.position.count;
      return { g: g, c: pt.c };
    });
    const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3), clr = new Float32Array(count * 3);
    let o = 0;
    for (const pr of prepared) {
      const pa = pr.g.attributes.position.array, na = pr.g.attributes.normal.array, n = pr.g.attributes.position.count;
      pos.set(pa, o * 3); nor.set(na, o * 3);
      col.setHex(pr.c);
      for (let i = 0; i < n; i++) { clr[(o + i) * 3] = col.r; clr[(o + i) * 3 + 1] = col.g; clr[(o + i) * 3 + 2] = col.b; }
      o += n;
      pr.g.dispose();
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('color', new THREE.BufferAttribute(clr, 3));
    out.computeBoundingSphere(); out.computeBoundingBox();
    return out;
  };

  B.mat = {
    vc: new THREE.MeshLambertMaterial({ vertexColors: true }),
    basic: (c) => new THREE.MeshBasicMaterial({ color: c })
  };

  // own material = can fade (occluder) or be tinted (Wing 2 dark -> lit)
  B.mesh = function (parts, opts) {
    opts = opts || {};
    const mat = opts.material || (opts.own ? new THREE.MeshLambertMaterial({ vertexColors: true }) : B.mat.vc);
    const m = new THREE.Mesh(B.merge(parts), mat);
    m.castShadow = opts.cast !== false;
    m.receiveShadow = !!opts.receive;
    if (opts.pos) m.position.set(opts.pos[0], opts.pos[1], opts.pos[2]);
    return m;
  };

  // a canvas texture with text (used for small signs)
  B.textTexture = function (text, opts) {
    opts = opts || {};
    const c = document.createElement('canvas');
    c.width = opts.w || 256; c.height = opts.h || 128;
    const x = c.getContext('2d');
    x.fillStyle = opts.bg || 'rgba(0,0,0,0)'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = opts.color || '#fff';
    x.font = (opts.weight || '800') + ' ' + (opts.size || 64) + 'px "Segoe UI", Arial, sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, c.width / 2, c.height / 2 + 2);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  };
})(window.TBS = window.TBS || {});

/* Labels in the world ("Lv 2", "MAX", "Boost", alien order bubbles, the door sign, "+$" texts) drawn INSIDE the 3D canvas.
   They used to be page elements on top of the game: weak phones (Adreno 506) lost ~5 ms per frame while walking just
   moving those page layers. Now each label is painted once into one shared picture (an "atlas"), repainted only when
   its text changes, and ALL labels are drawn in one draw call per frame. They keep the look of the old page labels. */
(function (TBS) {
  'use strict';

  const ATLAS = 1024;          // atlas picture size in real pixels
  const FONT = '"Segoe UI", "Trebuchet MS", Roboto, Arial, sans-serif';

  const svgImg = (svg, w, h) => { const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" ')); return im; };
  const ICONS = {
    burger: svgImg('<svg viewBox="0 0 34 26"><path d="M28 13 q5 -3 4 -8" stroke="#9b4dde" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M5 13 q-5 -2 -4 -7" stroke="#9b4dde" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M5 11 Q17 -3 29 11 Z" fill="#e8b064"/><rect x="4" y="12" width="26" height="4.5" rx="2" fill="#6a2aa8"/><rect x="5" y="17.5" width="24" height="5.5" rx="2.6" fill="#e8b064"/></svg>', 34, 26),
    dish: svgImg('<svg viewBox="0 0 34 26"><path d="M4 10 h26 q-2 14 -13 14 q-11 0 -13 -14 z" fill="#1f5fbf"/><ellipse cx="17" cy="10" rx="13" ry="3.6" fill="#3b8cff"/><circle cx="21" cy="8.5" r="2.4" fill="#a9d0ff"/></svg>', 34, 26),
    table: svgImg('<svg viewBox="0 0 34 26"><ellipse cx="17" cy="8" rx="14" ry="4.5" fill="#e0a05a"/><rect x="15" y="9" width="4" height="12" fill="#8a93a3"/><rect x="9" y="20" width="16" height="3" rx="1.5" fill="#8a93a3"/><circle cx="4" cy="17" r="3" fill="#9b4dde"/><circle cx="30" cy="17" r="3" fill="#9b4dde"/></svg>', 34, 26),
    angry: svgImg('<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#ff4d4d" stroke="#fff" stroke-width="2"/><path d="M8 11 l6 3 M24 11 l-6 3" stroke="#3a0a0a" stroke-width="2.6" stroke-linecap="round"/><circle cx="11.5" cy="16" r="2" fill="#3a0a0a"/><circle cx="20.5" cy="16" r="2" fill="#3a0a0a"/><path d="M10 24 q6 -5 12 0" stroke="#3a0a0a" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>', 32, 32)
  };

  // the same sizes as the old page style (--u = clamp(13px, min(2.2vh, 3.6vw), 20px))
  const unit = () => Math.max(13, Math.min(20, Math.min(window.innerHeight * 0.022, window.innerWidth * 0.036)));

  function rrect(c, l, t, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(l + r, t); c.arcTo(l + w, t, l + w, t + h, r); c.arcTo(l + w, t + h, l, t + h, r); c.arcTo(l, t + h, l, t, r); c.arcTo(l, t, l + w, t, r); c.closePath();
  }
  // a box with optional border: background inside, border drawn as a line (works with see-through backgrounds)
  function box(c, l, t, w, h, r, bg, bw, bc) {
    if (bg) { rrect(c, l + bw, t + bw, w - 2 * bw, h - 2 * bw, r - bw); c.fillStyle = bg; c.fill(); }
    if (bw) { rrect(c, l + bw / 2, t + bw / 2, w - bw, h - bw, r - bw / 2); c.lineWidth = bw; c.strokeStyle = bc; c.stroke(); }
  }
  function star(c, x, y, s, color) {
    const p = [50, 0, 61, 35, 98, 35, 68, 57, 79, 91, 50, 70, 21, 91, 32, 57, 2, 35, 39, 35];
    c.beginPath(); for (let i = 0; i < p.length; i += 2) c[i ? 'lineTo' : 'moveTo'](x + p[i] / 100 * s, y + p[i + 1] / 100 * s); c.closePath(); c.fillStyle = color; c.fill();
  }
  function gem(c, x, y, s) {
    const g = c.createLinearGradient(x + s * 0.3, y, x + s * 0.7, y + s); g.addColorStop(0, '#c9f1ff'); g.addColorStop(0.5, '#45b8ff'); g.addColorStop(1, '#1f6fd6');
    const p = [50, 100, 0, 35, 22, 5, 78, 5, 100, 35];
    c.beginPath(); for (let i = 0; i < p.length; i += 2) c[i ? 'lineTo' : 'moveTo'](x + p[i] / 100 * s, y + p[i + 1] / 100 * s); c.closePath(); c.fillStyle = g; c.fill();
  }

  /* Each label kind: measure(u) -> parts and box size; paint(c) draws it with the box's top-left at (0, 0).
     spec = { kind, ... } built by the overlay. */
  const KINDS = {
    lv: { // level of a machine / table: white pill, gold when MAX, star when HOT
      fw: '900', fs: (u) => (u * 0.78), pad: [1, 6], bw: 2, r: 8,
      look(s) { return s.bump ? ['#6fff9a', '#9b4dde', '#1e2340'] : s.hot ? [null, '#c45cff', '#5a2a00'] : s.max ? ['#ffd23a', '#b8860b', '#4a3200'] : ['rgba(255,255,255,0.92)', '#9b4dde', '#1e2340']; },
      icon: (s, u) => s.hot ? u * 0.78 * 0.95 : 0, gap: 2,
      drawIcon(c, s, x, y, sz) { star(c, x, y, sz, '#ffc21a'); },
      bg(c, s, l, t, w, h) { if (!s.hot || s.bump) return false; const g = c.createLinearGradient(0, t, 0, t + h); g.addColorStop(0, '#fff3b0'); g.addColorStop(1, '#ffd23a'); rrect(c, l + 2, t + 2, w - 4, h - 4, 6); c.fillStyle = g; c.fill(); return true; }
    },
    term: { fw: '900', fs: (u) => (u * 0.85), pad: [2, 8], bw: 0, r: 8, look: (s) => s.desk === 'chef' ? ['#ff7a2a', null, '#fff'] : s.desk === 'hire' ? ['#3a7be0', null, '#fff'] : ['#2fe0c8', null, '#0b3a35'] },
    timer: { fw: '800', fs: (u) => (u * 0.75), pad: [1, 7], bw: 0, r: 8, look: () => ['rgba(47,208,184,0.9)', null, '#fff'] },
    door: { fw: '900', fs: (u) => u, pad: [4, 10], bw: 2, r: 10, look: () => ['rgba(10,14,30,0.88)', '#3b8cff', '#a9d0ff'],
      icon: (s, u) => u * 0.8, gap: 6,
      drawIcon(c, s, x, y, sz) { // padlock
        const w = sz, h = sz * 0.875, top = y + sz * 0.42; c.fillStyle = '#a9d0ff'; rrect(c, x, top, w, h, 2); c.fill();
        c.beginPath(); c.lineWidth = sz * 0.15; c.strokeStyle = '#a9d0ff'; c.arc(x + w / 2, top, sz * 0.25, Math.PI, 0); c.stroke();
      } },
    offer: { fw: '900', fs: (u) => (u * 0.9), pad: [1, 9, 1, 5], bw: 2, r: 999, look: () => ['rgba(15,20,52,0.82)', '#2fe0c8', '#fff'],
      icon: (s, u) => u * 0.9 * 1.05, gap: 4, icon2: (s, u) => s.gem ? u * 0.9 * 0.95 : 0,
      drawIcon(c, s, x, y, sz) { c.fillStyle = '#fff'; c.beginPath(); c.arc(x + sz / 2, y + sz / 2, sz / 2, 0, Math.PI * 2); c.fill(); const e = sz / 1.05; c.fillStyle = '#11857a'; c.beginPath(); c.moveTo(x + sz * 0.38, y + sz * 0.27); c.lineTo(x + sz * 0.38 + e * 0.42, y + sz * 0.27 + e * 0.25); c.lineTo(x + sz * 0.38, y + sz * 0.27 + e * 0.5); c.closePath(); c.fill(); },
      drawIcon2(c, s, x, y, sz) { gem(c, x, y, sz); } },
    bubble: { fw: '900', fs: (u) => u, pad: [3, 9, 3, 5], bw: 3, r: 14, look: (s) => ['#fff', s.chain === 'g' ? '#3b8cff' : '#9b4dde', '#222'], bubble: true },
    angry: { angry: true },
    float: { fw: '900', fs: (u, s) => (u * (s.big ? 1.7 : 1.3)), float: true }
  };

  const fontOf = (K, fs) => K.fw + ' ' + fs.toFixed(2) + 'px ' + FONT;

  class LabelLayer {
    constructor(view) {
      this.view = view;
      this.hidden = false;
      this.canvas = document.createElement('canvas'); // scratch: one label is painted here, then copied into the atlas
      this.ctx = this.canvas.getContext('2d');
      this.src = { image: this.canvas };
      const blank = document.createElement('canvas'); blank.width = blank.height = ATLAS;
      this.atlas = new THREE.Texture(blank);
      this.atlas.flipY = false; this.atlas.generateMipmaps = false;
      this.atlas.minFilter = this.atlas.magFilter = THREE.LinearFilter;
      this.atlas.needsUpdate = true;
      this.shelves = []; this.pr = 0;
      this.max = 128;
      const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1);
      g.index = q.index; g.setAttribute('position', q.attributes.position);
      this.rect = new THREE.InstancedBufferAttribute(new Float32Array(this.max * 4), 4).setUsage(THREE.DynamicDrawUsage);
      this.uv = new THREE.InstancedBufferAttribute(new Float32Array(this.max * 4), 4).setUsage(THREE.DynamicDrawUsage);
      this.alpha = new THREE.InstancedBufferAttribute(new Float32Array(this.max), 1).setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('iRect', this.rect); g.setAttribute('iUv', this.uv); g.setAttribute('iAlpha', this.alpha);
      g.instanceCount = 0;
      this.geo = g;
      this.mat = new THREE.ShaderMaterial({
        uniforms: { map: { value: this.atlas }, uView: { value: new THREE.Vector2(1, 1) } },
        vertexShader: [
          'attribute vec4 iRect; attribute vec4 iUv; attribute float iAlpha; uniform vec2 uView; varying vec2 vUv; varying float vA;',
          'void main(){',
          '  vec2 k = vec2(position.x + 0.5, 0.5 - position.y);', // 0..1, y down
          '  vec2 p = iRect.xy + k * iRect.zw;',                   // page pixels
          '  vUv = mix(iUv.xy, iUv.zw, k); vA = iAlpha;',
          '  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);',
          '}'].join('\n'),
        fragmentShader: 'uniform sampler2D map; varying vec2 vUv; varying float vA; void main(){ vec4 c = texture2D(map, vUv); gl_FragColor = vec4(c.rgb, c.a * vA); }',
        transparent: true, depthTest: false, depthWrite: false
      });
      this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false;
      this.scene = new THREE.Scene(); this.scene.add(this.mesh);
      this.cam = new THREE.Camera();
      this.live = new Set();       // labels that own a spot in the atlas
      this.n = 0;
      let loaded = 0; // the icons arrive a moment after start: repaint the labels that use them
      for (const k in ICONS) ICONS[k].onload = () => { if (++loaded === Object.keys(ICONS).length) for (const l of this.live) l.key = null; };
    }

    // ---- painting one label into the scratch canvas ----
    layout(l) {
      const s = l.spec, K = KINDS[s.kind], u = unit(), c = this.ctx;
      if (K.angry) { const sz = u * 1.4; return { bw: sz, bh: sz, m: [2, 2, 2, 2] }; }
      const fs = K.fs(u, s); // the size is computed, never read back from c.font (phones write it differently)
      c.font = fontOf(K, fs);
      const tw = s.text ? c.measureText(s.text).width : 0;
      if (K.float) return { tw: tw, fs: fs, bw: tw, bh: Math.round(fs * 1.25), m: [8, 8, 10, 8] };
      const pad = K.pad.length === 2 ? [K.pad[0], K.pad[1], K.pad[0], K.pad[1]] : K.pad;
      let items = [];
      if (K.bubble) {
        if (s.mad) items.push({ w: u * 1.4, h: u * 1.4, img: ICONS.angry, mr: 2 });
        items.push({ w: u * 1.6, h: u * 1.6 * 26 / 34, img: ICONS[s.icon] });
        items.push({ w: tw, h: fs * 1.2, text: true });
      } else {
        const i1 = K.icon ? K.icon(s, u) : 0, i2 = K.icon2 ? K.icon2(s, u) : 0;
        if (i1) items.push({ w: i1, h: i1, draw: 'drawIcon' });
        if (i2) items.push({ w: i2, h: i2, draw: 'drawIcon2' });
        items.push({ w: tw, h: fs * 1.2, text: true });
      }
      const gap = K.bubble ? 3 : (K.gap || 0);
      let cw = 0, ch = 0;
      items.forEach((it, i) => { cw += it.w + (i ? gap : 0) + (it.mr || 0); ch = Math.max(ch, it.h); });
      const bwid = K.bw || 0;
      return { items: items, gap: gap, pad: pad, fs: fs, bw: Math.ceil(cw + pad[1] + pad[3] + 2 * bwid), bh: Math.round(ch + pad[0] + pad[2] + 2 * bwid), m: K.bubble ? [2, 4, 14, 4] : [2, 2, 2, 2] };
    }

    paint(l, L, S) {
      const s = l.spec, K = KINDS[s.kind], c = this.ctx, m = L.m;
      const W = Math.ceil((L.bw + m[1] + m[3]) * S), H = Math.ceil((L.bh + m[0] + m[2]) * S);
      this.canvas.width = W; this.canvas.height = H; // also clears it
      c.setTransform(S, 0, 0, S, 0, 0); c.translate(m[3], m[0]);
      if (K.angry) { if (ICONS.angry.complete) c.drawImage(ICONS.angry, 0, 0, L.bw, L.bh); return [W, H]; }
      c.font = fontOf(K, L.fs); c.textBaseline = 'middle';
      if (K.float) {
        const main = s.gem ? '#8fdcff' : '#7dff9a', sh = s.gem ? '#134a7a' : '#145a26', y = L.bh / 2;
        c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = 6 * S; c.fillStyle = sh; c.fillText(s.text, 0, y + 2);
        c.shadowColor = 'transparent'; c.shadowBlur = 0; c.fillStyle = main; c.fillText(s.text, 0, y);
        return [W, H];
      }
      const look = K.look(s), bw = K.bw || 0;
      if (K.bubble) { rrect(c, 0, 3, L.bw, L.bh, K.r); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill(); }
      if (!(K.bg && K.bg(c, s, 0, 0, L.bw, L.bh))) box(c, 0, 0, L.bw, L.bh, K.r, look[0], 0, null);
      if (bw) box(c, 0, 0, L.bw, L.bh, K.r, null, bw, look[1]);
      if (K.bubble) { // the little tail under the bubble
        c.save(); c.translate(L.bw / 2, L.bh - bw + 3); c.rotate(Math.PI / 4);
        c.fillStyle = '#fff'; c.fillRect(-6, -6, 12, 12); c.fillStyle = look[1]; c.fillRect(3, -6, 3, 12); c.fillRect(-6, 3, 12, 3);
        c.restore();
      }
      let x = bw + L.pad[3];
      const cy = bw + L.pad[0] + (L.bh - 2 * bw - L.pad[0] - L.pad[2]) / 2;
      for (const it of L.items) {
        if (it.text) { c.fillStyle = look[2]; c.fillText(s.text, x, cy + 0.5); }
        else if (it.img) { if (it.img.complete) c.drawImage(it.img, x, cy - it.h / 2, it.w, it.h); }
        else K[it.draw](c, s, x, cy - it.h / 2, it.w);
        x += it.w + L.gap + (it.mr || 0);
      }
      return [W, H];
    }

    // ---- atlas spots: shelves of rows; a freed spot is reused by a label that fits ----
    alloc(w, h) {
      for (const sh of this.shelves) {
        if (h > sh.h || h < sh.h * 0.6) continue;
        const f = sh.free.findIndex((r) => r.w >= w);
        if (f >= 0) { const r = sh.free.splice(f, 1)[0]; return { x: r.x, y: sh.y, w: r.w, h: sh.h, sh: sh }; }
        if (sh.x + w <= ATLAS) { const r = { x: sh.x, y: sh.y, w: w, h: sh.h, sh: sh }; sh.x += w; return r; }
      }
      const top = this.shelves.length ? this.shelves[this.shelves.length - 1].y + this.shelves[this.shelves.length - 1].h : 0;
      const hh = Math.ceil(h / 8) * 8;
      if (top + hh > ATLAS || w > ATLAS) return null;
      const sh = { y: top, h: hh, x: w, free: [] };
      this.shelves.push(sh);
      return { x: 0, y: top, w: w, h: hh, sh: sh };
    }
    release(l) { if (l.spot) { l.spot.sh.free.push({ x: l.spot.x, w: l.spot.w }); l.spot = null; } this.live.delete(l); }

    // repaint a label when its look changed; returns false when the atlas is full
    ensure(l) {
      const S = this.view.renderer.getPixelRatio(), key = JSON.stringify(l.spec) + '|' + S + '|' + unit();
      if (key === l.key) return true;
      const L = this.layout(l);
      if (!(isFinite(L.bw) && isFinite(L.bh) && L.bw > 0 && L.bh > 0)) return true; // never break the game over one label: skip it
      const wh = this.paint(l, L, S);
      if (!l.spot || l.spot.w < wh[0] || l.spot.h < wh[1]) {
        if (l.spot) this.release(l);
        l.spot = this.alloc(wh[0], wh[1]);
        if (!l.spot) return false;
      }
      this.view.renderer.copyTextureToTexture(new THREE.Vector2(l.spot.x, l.spot.y), this.src, this.atlas);
      this.live.add(l);
      l.key = key; l.L = L; l.pw = wh[0]; l.ph = wh[1]; l.S = S;
      return true;
    }

    // ---- per frame ----
    begin() { this.n = 0; }
    // draw label l with its box centered at page point (x, y)
    add(l, x, y, alpha, scale) {
      if (this.hidden || alpha <= 0.01 || this.n >= this.max) return;
      if (!this.ensure(l)) { this.repack(); if (!this.ensure(l)) return; }
      if (!l.spot || !l.L) return;
      const L = l.L, S = l.S, sc = scale || 1, m = L.m, i = this.n++;
      const w = l.pw / S * sc, h = l.ph / S * sc;
      let left = x - (m[3] + L.bw / 2) * sc, top = y - (m[0] + L.bh / 2) * sc;
      if (sc === 1) { left = Math.round(left * S) / S; top = Math.round(top * S) / S; } // pixel-exact = sharp text
      const r = this.rect.array, u = this.uv.array;
      r[i * 4] = left; r[i * 4 + 1] = top; r[i * 4 + 2] = w; r[i * 4 + 3] = h;
      u[i * 4] = l.spot.x / ATLAS; u[i * 4 + 1] = l.spot.y / ATLAS; u[i * 4 + 2] = (l.spot.x + l.pw) / ATLAS; u[i * 4 + 3] = (l.spot.y + l.ph) / ATLAS;
      this.alpha.array[i] = Math.min(1, alpha);
    }
    // atlas full (only after a long time with many different labels): start it over
    repack() {
      for (const l of this.live) { l.spot = null; l.key = null; }
      this.live.clear(); this.shelves = [];
    }
    render(renderer) {
      const n = this.n;
      this.geo.instanceCount = n;
      if (!n) return;
      for (const a of [this.rect, this.uv]) { a.updateRange.offset = 0; a.updateRange.count = n * 4; a.needsUpdate = true; }
      this.alpha.updateRange.offset = 0; this.alpha.updateRange.count = n; this.alpha.needsUpdate = true;
      this.mat.uniforms.uView.value.set(this.view.width, this.view.height);
      const ac = renderer.autoClear; renderer.autoClear = false;
      renderer.render(this.scene, this.cam);
      renderer.autoClear = ac;
    }
  }

  TBS.LabelLayer = LabelLayer;
})(window.TBS = window.TBS || {});

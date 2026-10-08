/* Floor circles: pickup circles (fill shows the 0.3 s stop), drop zones, return pads, price circles,
   Boost Terminal circles, and the guide arrow + bouncing marker. */
(function (TBS) {
  'use strict';

  const B = TBS.B, U = TBS.U;

  const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  const FRAG = [
    'uniform vec3 uColor; uniform float uFill; uniform float uAlpha; uniform float uTime; uniform float uStyle;',
    'varying vec2 vUv;',
    'void main(){',
    '  vec2 p = vUv * 2.0 - 1.0; float r = length(p); if (r > 1.0) discard;',
    '  float a01 = (atan(p.x, -p.y) + 3.14159265) / 6.2831853;',
    '  float ring = smoothstep(0.78, 0.83, r) * (1.0 - smoothstep(0.95, 1.0, r));',
    '  float inner = 1.0 - smoothstep(0.78, 0.82, r);',
    '  float alpha = 0.0; vec3 col = uColor;',
    '  if (uStyle < 0.5) {',
    '    float fill = step(a01, uFill) * inner;',
    '    alpha = max(ring, max(inner * 0.2, fill * 0.8)); col = mix(uColor, vec3(1.0), ring * 0.3);',
    '  } else if (uStyle < 1.5) {',
    '    float dash = step(0.45, fract(a01 * 14.0 + uTime * 0.2));',
    '    float f = (1.0 - smoothstep(uFill * 0.8 - 0.03, uFill * 0.8, r)) * step(0.001, uFill);',
    '    alpha = max(ring * (0.45 + 0.55 * dash), max(f * 0.55, inner * 0.1));',
    '  } else if (uStyle < 2.5) {',
    '    float chev = step(0.55, fract(a01 * 8.0 - uTime * 0.5)) * smoothstep(0.5, 0.56, r) * (1.0 - smoothstep(0.7, 0.75, r));',
    '    alpha = max(ring * 0.85, max(chev * 0.75, inner * 0.12));',
    '  } else {',
    '    float glow = ring * (0.65 + 0.35 * sin(uTime * 4.0));',
    '    float fill = step(a01, uFill) * inner;',
    '    alpha = max(glow, max(fill * 0.7, inner * 0.2));',
    '  }',
    '  gl_FragColor = vec4(col, alpha * uAlpha);',
    '}'
  ].join('\n');

  // a circle leaves the floor: free its shapes, colours and pictures in the graphics chip too
  // (removing it from the scene alone left them there: ~20 shapes per minute of play piled up)
  function drop(scene, obj) {
    scene.remove(obj);
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => { if (m === B.mat.vc) return; if (m.map) m.map.dispose(); m.dispose(); });
    });
  }

  function circleMesh(r, color, style) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uFill: { value: 0 }, uAlpha: { value: 1 }, uTime: { value: 0 }, uStyle: { value: style } },
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), mat);
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = 1;
    return m;
  }

  // the area around a counter where you put food down and sell: a rounded yellow frame + a fill that lights up green
  function counterArea(ct, reach) {
    const r = ct.rect, w = r.x1 - r.x0 + reach * 2, h = r.z1 - r.z0 + reach * 2;
    const cw = 512, chh = Math.max(64, Math.round(cw * h / w)), cv = document.createElement('canvas');
    cv.width = cw; cv.height = chh;
    const x = cv.getContext('2d'), px = cw / w, lw = 0.09 * px, rad = reach * px;
    x.strokeStyle = '#ffd23a'; x.lineWidth = lw; x.setLineDash([0.32 * px, 0.2 * px]);
    x.beginPath();
    if (x.roundRect) x.roundRect(lw / 2, lw / 2, cw - lw, chh - lw, rad); else x.rect(lw / 2, lw / 2, cw - lw, chh - lw);
    x.stroke();
    const tex = new THREE.CanvasTexture(cv);
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    const fillMat = new THREE.MeshBasicMaterial({ color: 0x3ad16a, transparent: true, opacity: 0, depthWrite: false });
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, h - 0.2), fillMat);
    frame.rotation.x = fill.rotation.x = -Math.PI / 2;
    frame.renderOrder = fill.renderOrder = 1;
    g.add(fill, frame);
    g.position.set((r.x0 + r.x1) / 2, 0.02, (r.z0 + r.z1) / 2);
    g.userData = { fillMat: fillMat, frame: frame };
    return g;
  }

  class Circles {
    constructor(view) {
      this.view = view; this.game = view.game; this.cfg = view.game.cfg; this.scene = view.scene;
      this.zoneMeshes = new Map();   // static zone id -> mesh
      this.priceMeshes = new Map();  // trackId -> {mesh, pop}
      this.retMeshes = new Map();
      this.cleanRings = new Map();   // clean zone id -> ring around a dirty table
      this.time = 0;
      const ys = 0.025;
      // guide arrow (floor) + bouncing marker over the target
      const amat = new THREE.MeshBasicMaterial({ color: 0xffe14a, transparent: true, opacity: 0.95, depthWrite: false });
      this.arrow = new THREE.Mesh(B.merge([{ g: B.box(0.22, 0.02, 0.7), c: 0xffffff, p: [0, 0, -0.1] }, { g: B.cyl(0.32, 0.32, 0.02, 3), c: 0xffffff, p: [0, 0, 0.36], s: [1, 1, 1.25] }]), amat);
      this.arrow.position.y = ys + 0.01; this.arrow.renderOrder = 2; this.arrow.visible = false;
      this.scene.add(this.arrow);
      this.marker = new THREE.Mesh(B.merge([{ g: B.cyl(0.26, 0.0, 0.45, 12), c: 0xffe14a, p: [0, 0, 0] }, { g: B.sph(0.12, 10, 8), c: 0xffffff, p: [0, 0.3, 0] }]), new THREE.MeshBasicMaterial({ vertexColors: true }));
      this.marker.visible = false;
      this.scene.add(this.marker);
      this.targetRing = circleMesh(0.95, 0xffe14a, 0);
      this.targetRing.position.y = ys + 0.005; this.targetRing.visible = false;
      this.scene.add(this.targetRing);
    }

    syncStatic() {
      const g = this.game, col = this.cfg.COLORS, seen = new Set();
      for (const z of g.staticZones) {
        seen.add(z.id);
        if (this.zoneMeshes.has(z.id)) continue;
        let m;
        if (z.type === 'drop' && (z.kind === 'counter' || z.kind === 'machine')) { this.zoneMeshes.set(z.id, null); continue; } // counter: drawn as its area; machine: shares the one pickup circle
        if (z.type === 'cashier') m = counterArea(z.ref, this.cfg.COUNTER_REACH);
        else if (z.type === 'pickup') m = circleMesh(z.r, col.pickup, 1);
        else if (z.type === 'drop') m = circleMesh(z.r, z.kind === 'counter' ? 0xffd23a : z.kind === 'bin' ? col.bin : (z.chain === 'g' ? col.blue : col.purple), 2);
        else if (z.type === 'terminal') m = circleMesh(z.r, z.desk === 'chef' ? col.chef : z.desk === 'hire' ? col.worker : col.terminal, 3);
        else if (z.type === 'return') {
          m = this.returnPad(z);
        }
        if (!m) continue;
        if (z.type !== 'cashier') { m.position.x = z.x; m.position.z = z.z; m.position.y = z.type === 'return' ? 0.012 : 0.02; }
        this.scene.add(m);
        this.zoneMeshes.set(z.id, m);
        if (z.type !== 'return' && z.type !== 'cashier') this.view.fx.popIn(m, 1, true);
      }
      for (const [id, m] of this.zoneMeshes) if (!seen.has(id)) { if (m) drop(this.scene, m); this.zoneMeshes.delete(id); }
    }

    returnPad(z) {
      // small orange pad with a white arrow pointing back to the pile
      const st = z.ref, px = z.kind === 'source' ? st.pileX : st.outPileX, pz = z.kind === 'source' ? st.pileZ : st.outPileZ;
      const ang = Math.atan2(px - z.x, pz - z.z);
      const g = new THREE.Group();
      const disc = new THREE.Mesh(B.cyl(z.r, z.r, 0.03, 20), new THREE.MeshLambertMaterial({ color: 0xff8a3a }));
      disc.position.y = 0.015;
      const ar = new THREE.Mesh(B.merge([
        { g: B.box(0.09, 0.02, 0.26), c: 0xffffff, p: [0, 0, -0.06] },
        { g: B.cyl(0.14, 0.14, 0.02, 3), c: 0xffffff, p: [0, 0, 0.1] }
      ]), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      ar.position.y = 0.04; ar.rotation.y = ang;
      g.add(disc, ar);
      return g;
    }

    buildCircle(o) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const tex = new THREE.CanvasTexture(canvas);
      tex.anisotropy = 4;
      const r = this.cfg.LAYOUT.PRICE_CIRCLE_DRAW_R;
      const geo = new THREE.PlaneGeometry(r * 2, r * 2);
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      mesh.rotation.y = Math.PI / 4; // text reads upright from the camera
      mesh.position.set(o.x, 0.024, o.z);
      mesh.renderOrder = 1;
      this.scene.add(mesh);
      const pm = { mesh: mesh, tex: tex, ctx: ctx, step: o.step, rem: -1, fill: -1, popping: true };
      mesh.scale.set(0.001, 1, 0.001);
      let t = 0;
      const grow = () => { t += 1 / 30; const k = Math.min(1, t / 0.4), el = k >= 1 ? 1 : 1 - Math.pow(2, -9 * k) * Math.cos(k * Math.PI * 3.2); mesh.scale.set(el, 1, el); if (k < 1) setTimeout(grow, 33); else pm.popping = false; };
      grow();
      return pm;
    }

    // the picture of a floor offer, floating over its circle
    offerIcon(type) {
      const parts = {
        magnet: [{ g: B.box(0.62, 0.16, 0.16), c: 0xff3b3b, p: [0, 0.22, 0] }, { g: B.box(0.16, 0.42, 0.16), c: 0xff3b3b, p: [-0.23, 0, 0] }, { g: B.box(0.16, 0.42, 0.16), c: 0xff3b3b, p: [0.23, 0, 0] },
          { g: B.box(0.17, 0.14, 0.17), c: 0xe6e9f0, p: [-0.23, -0.27, 0] }, { g: B.box(0.17, 0.14, 0.17), c: 0xe6e9f0, p: [0.23, -0.27, 0] }],
        hover: [{ g: B.cyl(0.42, 0.42, 0.08, 20), c: 0x3b8cff, p: [0, 0, 0] }, { g: B.cyl(0.3, 0.3, 0.1, 20), c: 0x2fe0c8, p: [0, -0.05, 0] }, { g: B.box(0.5, 0.05, 0.14), c: 0xffffff, p: [0, 0.05, 0] }],
        cash: [{ g: B.box(0.62, 0.36, 0.3), c: 0x2fbf5a, p: [0, 0, 0] }, { g: B.box(0.64, 0.1, 0.32), c: 0xffd23a, p: [0, 0, 0] }, { g: B.box(0.22, 0.06, 0.08), c: 0x1f7a37, p: [0, 0.21, 0] }],
        worker: [{ g: B.sph(0.26, 14, 8), c: 0xf2c230, p: [0, 0.05, 0], s: [1, 0.75, 1] }, { g: B.cyl(0.34, 0.34, 0.05, 16), c: 0xf2c230, p: [0, -0.04, 0] }],
        gem: [{ g: B.cyl(0.32, 0.0, 0.34, 6), c: 0x45b8ff, p: [0, -0.1, 0] }, { g: B.cyl(0.22, 0.32, 0.14, 6), c: 0xa9e6ff, p: [0, 0.14, 0] }]
      };
      const key = TBS.FloorOffers.isGem(type) ? 'gem' : type;
      const m = new THREE.Mesh(B.merge(parts[key]), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x222222 }));
      m.scale.setScalar(this.cfg.OFFER_ICON_SCALE * (type === 'gemsL' ? 1.35 : type === 'gemsM' ? 1.15 : 1));
      return m;
    }

    // the floor offer: a ring that turns and empties as time runs out, with the picture bobbing over it
    updateOffer(dt) {
      const f = this.game.floorOffer;
      if (this.offer && (!f || this.offer.id !== f.id)) { drop(this.scene, this.offer.g); this.offer = null; }
      if (!f) return;
      if (!this.offer) {
        const g = new THREE.Group(), ring = circleMesh(f.r, 0x2fe0c8, 3), icon = this.offerIcon(f.type);
        ring.position.y = 0.026; icon.position.y = 0.9;
        const glow = new THREE.Mesh(B.cyl(f.r * 0.55, f.r * 0.7, 0.02, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }));
        glow.position.y = 0.03;
        g.add(ring, glow, icon);
        g.position.set(f.x, 0, f.z);
        this.scene.add(g);
        this.view.fx.popIn(g, 1);
        this.offer = { id: f.id, g: g, ring: ring, icon: icon };
      }
      const o = this.offer, u = o.ring.material.uniforms, p = this.game.player;
      u.uTime.value = this.time;
      u.uFill.value = U.clamp(f.t / f.life, 0, 1); // time left
      o.ring.rotation.z = -this.time * 1.4;      // the ring keeps turning
      u.uAlpha.value = f.t < 6 ? 0.55 + 0.45 * Math.abs(Math.sin(this.time * 6)) : 1; // blinks in its last seconds
      o.icon.position.y = 0.9 + Math.sin(this.time * 3) * 0.08;
      o.icon.rotation.y = this.time * 1.6;
    }

    onEvent(e) {
      if (e.type === 'clean') this.view.fx.burst(e.data.x, 0.9, e.data.z, 0x9fe8ff, 18);
      if (e.type === 'offerTaken') this.view.fx.burst(e.data.offer.x, 0.8, e.data.offer.z, 0x2fe0c8, 26);
      if (e.type === 'purchase') {
        const pm = this.priceMeshes.get(e.data.trackId);
        if (pm) { drop(this.scene, pm.mesh); pm.tex.dispose(); this.priceMeshes.delete(e.data.trackId); }
        this.view.fx.burst(e.data.x, 0.4, e.data.z, 0xffd23a, 26);
      }
    }

    update(dt) {
      const g = this.game, p = g.player, cfg = this.cfg;
      this.time += dt;
      this.syncStatic();
      // static zone visuals
      for (const z of g.staticZones) {
        const m = this.zoneMeshes.get(z.id);
        if (m && z.type === 'cashier') { // counter area: green while you are in it, pulsing while someone waits and nobody sells
          const ct = z.ref, inside = ct.near(p.x, p.z), wait = TBS.Guide.needsCashier(g, z.chain);
          m.userData.fillMat.opacity = inside ? 0.28 : (wait ? 0.1 + Math.abs(Math.sin(this.time * 4)) * 0.14 : 0);
          m.userData.frame.material.opacity = ct.hasCashier ? 0.35 : 1;
          continue;
        }
        if (!m || !m.material || !m.material.uniforms) continue;
        const u = m.material.uniforms;
        u.uTime.value = this.time;
        if (z.type === 'pickup' || z.type === 'terminal') {
          const need = z.type === 'pickup' ? cfg.PICKUP_DWELL : cfg.TERMINAL_DWELL;
          u.uFill.value = p.dwellId === z.id ? U.clamp(p.dwell / need, 0, 1) : 0;
        }
      }
      // dirty tables: a glowing ring around the table (stand in it 0.3 s to clean)
      const seenT = new Set();
      for (const z of g.zones) {
        if (z.type !== 'clean') continue;
        seenT.add(z.id);
        let m = this.cleanRings.get(z.id);
        if (!m) {
          m = circleMesh(z.r, 0x7fe0ff, 3);
          m.position.set(z.x, 0.022, z.z);
          this.scene.add(m);
          this.cleanRings.set(z.id, m);
          this.view.fx.popIn(m, 1, true);
        }
        m.material.uniforms.uTime.value = this.time;
        m.material.uniforms.uFill.value = p.dwellId === z.id ? U.clamp(p.dwell / Math.max(cfg.CLEAN_DWELL, 0.01), 0, 1) : 0;
      }
      for (const [id, m] of this.cleanRings) if (!seenT.has(id)) { drop(this.scene, m); this.cleanRings.delete(id); }
      // build circles follow the visible offers (price + icon + word painted on the floor)
      const seen = new Set();
      for (const o of g.offers) {
        seen.add(o.trackId);
        let pm = this.priceMeshes.get(o.trackId);
        if (!pm || pm.step !== o.step) {
          if (pm) { drop(this.scene, pm.mesh); pm.tex.dispose(); }
          pm = this.buildCircle(o);
          this.priceMeshes.set(o.trackId, pm);
        }
        const paid = g.paid[o.trackId] || 0, remaining = Math.max(0, Math.ceil(o.price - paid)), fill = Math.round(paid / o.price * 48) / 48;
        if (remaining !== pm.rem || fill !== pm.fill) { pm.rem = remaining; pm.fill = fill; TBS.FloorCircle.draw(pm.ctx, o, remaining, fill); pm.tex.needsUpdate = true; }
        const afford = g.money + paid >= o.price - 0.5;
        const s = afford ? 1 + Math.sin(this.time * 5) * 0.035 : 1;
        if (!pm.popping) pm.mesh.scale.set(s, 1, s);
      }
      for (const [id, pm] of this.priceMeshes) if (!seen.has(id)) { drop(this.scene, pm.mesh); pm.tex.dispose(); this.priceMeshes.delete(id); }
      this.updateOffer(dt);
      // guide arrow
      const t = TBS.Guide.target(g);
      if (t && !g.paused) {
        const dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
        const ang = Math.atan2(dx, dz);
        this.arrow.visible = d > 1.6;
        this.arrow.position.set(p.x + dx / d * 1.15, 0.035, p.z + dz / d * 1.15);
        this.arrow.rotation.y = ang;
        const s = 1 + Math.sin(this.time * 6) * 0.08;
        this.arrow.scale.set(s, 1, s);
        this.marker.visible = true;
        this.marker.position.set(t.x, 1.55 + Math.abs(Math.sin(this.time * 3.2)) * 0.35, t.z);
        this.marker.rotation.y = this.time * 2;
        this.targetRing.visible = true;
        this.targetRing.position.x = t.x; this.targetRing.position.z = t.z;
        const rs = 0.9 + Math.sin(this.time * 4) * 0.08;
        this.targetRing.scale.set(rs, rs, rs);
        this.targetRing.material.uniforms.uAlpha.value = 0.55;
      } else { this.arrow.visible = false; this.marker.visible = false; this.targetRing.visible = false; }
    }
  }

  TBS.CirclesView = Circles;
})(window.TBS = window.TBS || {});

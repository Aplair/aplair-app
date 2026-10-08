/* Speed check for phones. Off unless the address ends with ?perf  (example: index.html?perf).
   Shows frames per second, where each frame's time goes, which graphics chip the browser uses,
   and buttons to switch heavy things off one at a time, to find what makes the game slow. Never changes the game. */
(function (TBS) {
  'use strict';

  if (!/[?&]perf\b/.test(location.search)) return;

  function start() {
    const M = TBS.Main, view = M.view;
    const T = {}, parts = [['game', M.game, 'update'], ['view', M.view, 'update'], ['draw', M.view, 'render'], ['hud', M.hud, 'update']];
    for (const [key, obj, name] of parts) {
      const f = obj[name].bind(obj);
      obj[name] = function () { const t = performance.now(); const r = f.apply(null, arguments); T[key] = (T[key] || 0) + performance.now() - t; return r; };
    }
    let drawOff = false;
    const draw = M.view.render;
    M.view.render = function () { if (!drawOff) draw(); };

    const gl = view.renderer.getContext();
    // how much data is sent to the graphics chip each frame (buffers = moving things, pictures = floor circles / labels)
    const up = { n: 0, kb: 0, tex: 0 };
    const bsd = gl.bufferSubData.bind(gl);
    gl.bufferSubData = function (t, off, data, from, len) { up.n++; if (data && data.byteLength) up.kb += (len ? len * data.BYTES_PER_ELEMENT : data.byteLength) / 1024; return bsd.apply(null, arguments); };
    const bd = gl.bufferData.bind(gl);
    gl.bufferData = function (t, data) { up.n++; if (data && data.byteLength) up.kb += data.byteLength / 1024; return bd.apply(null, arguments); };
    for (const name of ['texImage2D', 'texSubImage2D']) { const f = gl[name].bind(gl); gl[name] = function () { up.tex++; return f.apply(null, arguments); }; }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);

    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:4px;bottom:4px;z-index:99;background:rgba(0,0,0,0.8);color:#fff;font:12px/1.35 monospace;padding:6px 8px;border-radius:6px;max-width:calc(100vw - 8px);pointer-events:auto;';
    const txt = document.createElement('div');
    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;';
    box.appendChild(txt); box.appendChild(btns);
    document.body.appendChild(box);
    for (const ev of ['pointerdown', 'touchstart', 'mousedown']) box.addEventListener(ev, (e) => e.stopPropagation());

    const button = (label, onClick) => {
      const b = document.createElement('button');
      b.style.cssText = 'font:12px monospace;padding:4px 6px;border-radius:4px;border:0;background:#2fe0c8;color:#000;';
      b.textContent = label;
      b.addEventListener('click', (e) => { e.stopPropagation(); onClick(b); });
      btns.appendChild(b);
    };
    const setRatio = (r) => { M.game.cfg.MAX_PIXEL_RATIO = r; view.resize(); };
    button('Draw off', (b) => { drawOff = !drawOff; b.textContent = drawOff ? 'Draw on' : 'Draw off'; });
    button('Sharp 1', () => setRatio(1));
    button('Sharp 0.5', () => setRatio(0.5));
    button(view.renderer.shadowMap.enabled ? 'Shadows off' : 'Shadows on', (b) => {
      const on = !view.renderer.shadowMap.enabled;
      view.renderer.shadowMap.enabled = on; view.sun.castShadow = on;
      view.scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); });
      b.textContent = on ? 'Shadows off' : 'Shadows on';
    });
    const remakeShadows = () => {
      const sh = view.sun.shadow;
      if (sh.map) { sh.map.dispose(); sh.map = null; }
      view.scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); });
    };
    button('Shadow hard', (b) => {
      const hard = view.renderer.shadowMap.type !== THREE.BasicShadowMap;
      view.renderer.shadowMap.type = hard ? THREE.BasicShadowMap : THREE.PCFShadowMap;
      remakeShadows();
      b.textContent = hard ? 'Shadow soft' : 'Shadow hard';
    });
    button('Shadow 512', (b) => {
      const small = view.sun.shadow.mapSize.x > 512;
      const n = small ? 512 : M.game.cfg.SHADOW_MAP_SIZE;
      view.sun.shadow.mapSize.set(n, n);
      remakeShadows();
      b.textContent = small ? 'Shadow ' + M.game.cfg.SHADOW_MAP_SIZE : 'Shadow 512';
    });
    // freeze = shadows stay on screen but are not redrawn each frame: tells if the cost is drawing the shadows or showing them
    button('Shadow freeze', (b) => {
      const sm = view.renderer.shadowMap;
      sm.autoUpdate = !sm.autoUpdate; sm.needsUpdate = true;
      b.textContent = sm.autoUpdate ? 'Shadow freeze' : 'Shadow live';
    });
    // stop sending moved positions to the graphics chip (people and money freeze in place): tells if those uploads are what slows the phone
    let uploadsOff = false;
    const flush = TBS.B.flushInstances;
    TBS.B.flushInstances = function (mesh, n) { if (uploadsOff) { mesh.count = Math.min(n, mesh.userData.perfShown || 0); return; } mesh.userData.perfShown = n; flush(mesh, n); };
    button('Uploads off', (b) => { uploadsOff = !uploadsOff; b.textContent = uploadsOff ? 'Uploads on' : 'Uploads off'; });
    // smooth edges can only change when the game starts: this button restarts the page with them off (or back on)
    const aaOn = gl.getContextAttributes().antialias;
    button(aaOn ? 'Edges off (restart)' : 'Edges on (restart)', () => {
      location.search = location.search.replace(/[?&]n?oaa\b|[?&]aa\b/g, '') + (aaOn ? '&noaa' : '&aa');
    });
    button('HUD off', (b) => {
      const hide = b.textContent === 'HUD off';
      for (const id of ['hud', 'overlay']) document.getElementById(id).style.display = hide ? 'none' : '';
      b.textContent = hide ? 'HUD on' : 'HUD off';
    });

    // AUTO TEST: hides one part at a time for a few seconds and measures the speed, then shows a table.
    // Hiding a part shows how much time the phone spends drawing it.
    const baseRatio = M.game.cfg.MAX_PIXEL_RATIO;
    const hidden = new Set(), ownerOf = (o) => o.userData.perfOwner || (o.userData.perfOwner = owner(o));
    const drawOne = M.view.render;
    M.view.render = function () {
      if (!hidden.size) return drawOne();
      const off = [];
      view.scene.traverse((o) => { if (o.isMesh && o.visible && hidden.has(ownerOf(o))) { o.visible = false; off.push(o); } });
      drawOne();
      for (const o of off) o.visible = true;
    };
    const steps = [
      ['normal', () => {}],
      ['no world', () => hidden.add('world')], ['no floor', () => hidden.add('floor')], ['no aliens', () => hidden.add('aliens')],
      ['no items', () => hidden.add('items')], ['no workers+chef', () => { hidden.add('workers'); hidden.add('chef'); }],
      ['no labels', () => { document.getElementById('overlay').style.display = 'none'; }],
      ['no HUD', () => { document.getElementById('hud').style.display = 'none'; }],
      ['sharp 1.25', () => setRatio(1.25)], ['sharp 1', () => setRatio(1)],
      ['draw off', () => { drawOff = true; }],
      // the same while walking a real trip: from the far corner of Wing 1 to the far corner of Wing 2 (or the end
      // of Wing 1 while Wing 2 is closed), then back. The test steers the chef by itself; each row = one trip.
      ['WALK normal', () => {}, true],
      ['WALK no labels', () => { document.getElementById('overlay').style.display = 'none'; }, true],
      ['WALK no HUD', () => { document.getElementById('hud').style.display = 'none'; }, true],
      ['WALK no world', () => hidden.add('world'), true],
      ['WALK draw off', () => { drawOff = true; }, true]
    ];
    const game = M.game, L = game.cfg.LAYOUT;
    const free = (x, z) => { const nv = game.nav, id = nv.nearestFree(nv.idx(x, z)); return id < 0 ? { x: x, z: z } : nv.center(id); };
    const ends = () => [free(1.5, 1.5), game.wing2Open ? free(L.WING2.x1 - 1.5, L.WING2.z1 - 1.5) : free(L.WING1.x1 - 1.5, L.WING1.z1 - 1.5)];
    let route = null, leg = 0;
    const steer = { x: 0, z: 0, mag: 1, source: 'keyboard' };
    const upd = game.update;
    let goal = null, stuckT = 0, sideT = 0, sideDir = 1, lastX = 0, lastZ = 0;
    game.update = function (dt, inp) {
      if (route && route.length) {
        const p = game.player, t = route[0], dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
        if (d < 0.5) route.shift();
        else {
          // blocked (an alien in the way, a corner): step sideways a moment, then find a new path from here
          if (Math.hypot(p.x - lastX, p.z - lastZ) < 0.5 * dt) stuckT += dt; else stuckT = 0;
          lastX = p.x; lastZ = p.z;
          if (stuckT > 0.6) { stuckT = 0; sideT = 0.5; sideDir = -sideDir; }
          if (sideT > 0) { sideT -= dt; steer.x = -dz / d * sideDir; steer.z = dx / d * sideDir; if (sideT <= 0 && goal) route = game.nav.findPath(p.x, p.z, goal.x, goal.z); }
          else { steer.x = dx / d; steer.z = dz / d; }
          inp = steer;
          game.player.dwell = 0; // never stop long enough on a circle: the test must not buy things or open windows
        }
      }
      return upd.call(this, dt, inp);
    };
    const startTrip = () => { const e = ends(), p = game.player; goal = e[(leg++) % 2 === 0 ? 1 : 0]; route = game.nav.findPath(p.x, p.z, goal.x, goal.z); stuckT = 0; sideT = 0; };
    const walk = (on) => { if (!on) route = null; };
    const reset = () => {
      hidden.clear(); drawOff = false; setRatio(baseRatio); walk(false);
      for (const id of ['hud', 'overlay']) document.getElementById(id).style.display = '';
    };
    const table = document.createElement('div');
    table.style.cssText = 'margin-top:4px;white-space:pre;';
    box.appendChild(table);
    button('AUTO TEST', (b) => {
      if (b.disabled) return;
      b.disabled = true;
      const rows = []; let i = 0; b.atStart = false;
      const next = () => {
        reset();
        if (i >= steps.length) { b.disabled = false; b.textContent = 'AUTO TEST'; table.textContent = 'AUTO TEST (FPS, ms per frame):\n' + rows.join('\n'); return; }
        const [name, apply, walking] = steps[i++];
        if (walking && i > 1 && !steps[i - 2][2] && !b.atStart) { // before the first walk row: go to the Wing 1 corner (not measured)
          i--; b.atStart = true; leg = 1; startTrip(); b.textContent = 'walking to the start...';
          const t0 = performance.now(), wait = () => { if (route && route.length && performance.now() - t0 < 30000) setTimeout(wait, 200); else { route = null; leg = 0; next(); } };
          return wait();
        }
        apply();
        b.textContent = 'testing ' + i + '/' + steps.length + '...';
        const measure = () => {      // standing: 3 s. Walking: until the trip ends (at most 25 s)
          if (walking) startTrip();
          let n = 0; const t0 = performance.now();
          const done = () => walking ? (!route || !route.length || performance.now() - t0 > 25000) : performance.now() - t0 >= 3000;
          const tick = () => {
            if (walking && game.paused) { // a window (level up...) stopped the game: the walk numbers would be wrong
              route = null; reset(); b.disabled = false; b.textContent = 'AUTO TEST';
              table.textContent = 'AUTO TEST (FPS, ms per frame):\n' + rows.join('\n') + '\nWALK stopped: a window opened. Close it, then press AUTO TEST again.';
              return;
            }
            n++; if (!done()) requestAnimationFrame(tick); else { const ms = (performance.now() - t0) / n; route = null; rows.push(name.padEnd(16) + (1000 / ms).toFixed(0).padStart(3) + ' FPS ' + ms.toFixed(0).padStart(3) + ' ms' + (walking ? ' (' + ((performance.now() - t0) / 1000).toFixed(0) + ' s)' : '')); next(); } };
          requestAnimationFrame(tick);
        };
        setTimeout(measure, walking ? 300 : 1000);
      };
      table.textContent = 'do not touch the screen (about 2 minutes, the chef walks on its own at the end)';
      next();
    });

    // which part of the game each draw call comes from (counted while the scene is drawn)
    const calls = {};
    const owner = (o) => {
      let top = o; while (top.parent && top.parent !== view.scene) top = top.parent;
      const ch = view.chars, it = view.items, w = view.world;
      if (Object.values(it.meshes).includes(o)) return 'items';
      if (o === ch.alien.p || o === ch.alien.g || o === ch.foot) return 'aliens';
      for (const k in ch.batches) if (Object.values(ch.batches[k].parts).includes(o)) return 'workers';
      if (top === ch.chef.group || top === ch.board) return 'chef';
      if (o === view.fx.puffMesh || o === view.fx.sparkMesh) return 'fx';
      if (w.tables && (w.tables.p.includes(top) || w.tables.g.includes(top))) return 'tables';
      const gt = o.geometry && o.geometry.type;
      if (gt === 'PlaneGeometry' || gt === 'RingGeometry' || gt === 'CircleGeometry') return 'floor';
      return 'world';
    };
    const tally = function () { if (this.isInstancedMesh && this.count === 0) return; const k = this.userData.perfOwner || (this.userData.perfOwner = owner(this)); calls[k] = (calls[k] || 0) + 1; };
    const hook = () => view.scene.traverse((o) => { if (o.isMesh && o.onBeforeRender !== tally) o.onBeforeRender = tally; });
    hook();
    let frames = 0, last = performance.now(), worst = 0, prev = last;
    const count = (now) => { frames++; worst = Math.max(worst, now - prev); prev = now; requestAnimationFrame(count); };
    requestAnimationFrame(count);
    setInterval(() => {
      const now = performance.now(), secs = (now - last) / 1000, n = Math.max(1, frames);
      const ms = (k) => ((T[k] || 0) / n).toFixed(1);
      const js = ['game', 'view', 'draw', 'hud'].reduce((a, k) => a + (T[k] || 0), 0) / n;
      const info = view.renderer.info.render, c = view.canvas;
      txt.innerHTML =
        'FPS ' + (frames / secs).toFixed(0) + ' | frame ' + (1000 * secs / n).toFixed(0) + 'ms, worst ' + worst.toFixed(0) + 'ms<br>' +
        'code ' + js.toFixed(1) + 'ms = game ' + ms('game') + ' view ' + ms('view') + ' draw ' + ms('draw') + ' hud ' + ms('hud') + '<br>' +
        'calls ' + info.calls + ' tris ' + info.triangles + ' | ' + c.width + 'x' + c.height + ' px (x' + view.renderer.getPixelRatio() + ', screen x' + (window.devicePixelRatio || 1) + ')<br>' +
        'uploads ' + (up.n / n).toFixed(0) + ' (' + (up.kb / n).toFixed(0) + ' KB) pictures ' + (up.tex / n).toFixed(1) + ' per frame<br>' +
        'by part: ' + Object.keys(calls).sort((x, y) => calls[y] - calls[x]).map((k) => k + ' ' + Math.round(calls[k] / n)).join(', ') + '<br>' +
        'GPU: ' + String(gpu).replace(/</g, '&lt;') + ' | smooth edges ' + (gl.getContextAttributes().antialias ? 'ON' : 'OFF');
      for (const k in calls) calls[k] = 0;
      hook();
      for (const k in T) T[k] = 0;
      up.n = 0; up.kb = 0; up.tex = 0;
      frames = 0; worst = 0; last = now;
    }, 1000);
  }

  const wait = setInterval(() => {
    if (TBS.Main && TBS.Main.view && TBS.Main.hud) { clearInterval(wait); start(); }
  }, 200);
})(window.TBS = window.TBS || {});

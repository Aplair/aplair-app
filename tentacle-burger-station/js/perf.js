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
    button('HUD off', (b) => {
      const hide = b.textContent === 'HUD off';
      for (const id of ['hud', 'overlay', 'confetti']) document.getElementById(id).style.display = hide ? 'none' : '';
      b.textContent = hide ? 'HUD on' : 'HUD off';
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
        'GPU: ' + String(gpu).replace(/</g, '&lt;');
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

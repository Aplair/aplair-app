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
    button('Shadows off', (b) => {
      const on = !view.renderer.shadowMap.enabled;
      view.renderer.shadowMap.enabled = on; view.sun.castShadow = on;
      view.scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); });
      b.textContent = on ? 'Shadows off' : 'Shadows on';
    });
    button('HUD off', (b) => {
      const hide = b.textContent === 'HUD off';
      for (const id of ['hud', 'overlay', 'confetti']) document.getElementById(id).style.display = hide ? 'none' : '';
      b.textContent = hide ? 'HUD on' : 'HUD off';
    });

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
        'GPU: ' + String(gpu).replace(/</g, '&lt;');
      for (const k in T) T[k] = 0;
      frames = 0; worst = 0; last = now;
    }, 1000);
  }

  const wait = setInterval(() => {
    if (TBS.Main && TBS.Main.view && TBS.Main.hud) { clearInterval(wait); start(); }
  }, 200);
})(window.TBS = window.TBS || {});

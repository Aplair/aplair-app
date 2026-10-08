/* Controls: WASD / arrow keys (by physical key, so it works with Arabic and AZERTY keyboards),
   and click-drag (mouse) or finger-drag (touch) anywhere = a joystick that appears where you press.
   Also the browser fixes from STUDIO-RULES section 8 (no scroll, no zoom, no right-click menu). */
(function (TBS) {
  'use strict';

  const KEYS = { KeyW: [0, 1], ArrowUp: [0, 1], KeyS: [0, -1], ArrowDown: [0, -1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };

  class Input {
    constructor(canvas, joyEl, knobEl) {
      const cfg = TBS.CONFIG, yaw = cfg.CAM_YAW_DEG * Math.PI / 180;
      this.right = { x: Math.cos(yaw), z: -Math.sin(yaw) };
      this.up = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
      this.canvas = canvas; this.joyEl = joyEl; this.knobEl = knobEl;
      this.keys = new Set();
      this.joy = null;
      this.blocked = false;
      this.usage = { keyboard: 0, mouse: 0, touch: 0 };
      this.onFirstMove = null; this.moved = false;
      this.out = { x: 0, z: 0, mag: 0, source: null };
      this.bind();
    }

    radius() { return Math.max(38, Math.min(70, Math.min(window.innerWidth, window.innerHeight) * 0.09)); }

    bind() {
      window.addEventListener('keydown', (e) => {
        if (KEYS[e.code]) { this.keys.add(e.code); }
        if (e.code === 'Space' || e.key === ' ' || e.code.indexOf('Arrow') === 0) e.preventDefault();
      });
      window.addEventListener('keyup', (e) => { this.keys.delete(e.code); });
      window.addEventListener('blur', () => { this.keys.clear(); this.endJoy(); });
      this.canvas.addEventListener('pointerdown', (e) => {
        if (this.joy || (e.pointerType === 'mouse' && e.button !== 0)) return;
        e.preventDefault();
        this.joy = { id: e.pointerId, type: e.pointerType === 'mouse' ? 'mouse' : 'touch', sx: e.clientX, sy: e.clientY, ox: 0, oy: 0, locked: false };
        try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
        if (TBS.CONFIG.MOUSE_LOCK_DURING_DRAG && e.pointerType === 'mouse' && this.canvas.requestPointerLock) {
          try { const r = this.canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (err) { /* ok */ }
        }
        this.showJoy();
      });
      const move = (e) => {
        if (!this.joy || e.pointerId !== this.joy.id) return;
        if (document.pointerLockElement === this.canvas) { this.joy.ox += e.movementX || 0; this.joy.oy += e.movementY || 0; }
        else { this.joy.ox = e.clientX - this.joy.sx; this.joy.oy = e.clientY - this.joy.sy; }
        const r = this.radius(), l = Math.hypot(this.joy.ox, this.joy.oy);
        if (l > r) { this.joy.ox *= r / l; this.joy.oy *= r / l; }
        this.showJoy();
      };
      window.addEventListener('pointermove', move);
      const up = (e) => { if (this.joy && e.pointerId === this.joy.id) this.endJoy(); };
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      // STUDIO-RULES 8: no page scroll / zoom / selection / right-click menu
      // (except a list that scrolls inside an open panel, e.g. the workers list: wheel and finger drag work there)
      const inList = (e) => !!(e.target && e.target.closest && e.target.closest('.panel'));
      window.addEventListener('wheel', (e) => { if (!inList(e)) e.preventDefault(); }, { passive: false });
      document.addEventListener('contextmenu', (e) => e.preventDefault());
      document.addEventListener('touchmove', (e) => { if (e.cancelable && !inList(e)) e.preventDefault(); }, { passive: false });
      document.addEventListener('gesturestart', (e) => e.preventDefault());
      document.addEventListener('dblclick', (e) => e.preventDefault());
    }

    endJoy() {
      if (!this.joy) return;
      try { this.canvas.releasePointerCapture(this.joy.id); } catch (err) { /* ok */ }
      if (document.pointerLockElement === this.canvas) { try { document.exitPointerLock(); } catch (err) { /* ok */ } }
      this.joy = null;
      this.joyEl.style.display = 'none';
    }

    cancelDrag() { this.endJoy(); } // used when a pause panel opens

    showJoy() {
      const j = this.joy;
      if (!j) return;
      this.joyEl.style.display = 'block';
      const r = this.radius();
      this.joyEl.style.width = this.joyEl.style.height = (r * 2) + 'px';
      this.joyEl.style.transform = 'translate(' + (j.sx - r) + 'px,' + (j.sy - r) + 'px)';
      this.knobEl.style.transform = 'translate(' + j.ox + 'px,' + j.oy + 'px)';
    }

    read(dt) {
      const o = this.out;
      o.x = 0; o.z = 0; o.mag = 0; o.source = null;
      let sx = 0, sy = 0, mag = 0, src = null;
      for (const k of this.keys) { sx += KEYS[k][0]; sy += KEYS[k][1]; }
      if (sx || sy) { const l = Math.hypot(sx, sy); sx /= l; sy /= l; mag = 1; src = 'keyboard'; }
      else if (this.joy) {
        const r = this.radius(), l = Math.hypot(this.joy.ox, this.joy.oy), dead = r * 0.12;
        if (l > dead) { sx = this.joy.ox / l; sy = -this.joy.oy / l; mag = Math.min(1, (l - dead) / (r - dead)); src = this.joy.type; }
      }
      if (this.blocked || !mag) return o;
      o.x = sx * this.right.x + sy * this.up.x;
      o.z = sx * this.right.z + sy * this.up.z;
      const l = Math.hypot(o.x, o.z) || 1;
      o.x /= l; o.z /= l; o.mag = mag; o.source = src;
      this.usage[src] += dt;
      if (!this.moved) { this.moved = true; if (this.onFirstMove) this.onFirstMove(src); }
      return o;
    }
  }

  TBS.Input = Input;
})(window.TBS = window.TBS || {});

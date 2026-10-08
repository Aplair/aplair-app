/* Crisp HTML labels that follow the 3D world: prices on circles, alien order bubbles, "LVL 10" on the door,
   floating "+$" texts. Labels that would cover the chef or his stack fade out. */
(function (TBS) {
  'use strict';

  const U = TBS.U;
  const ICON = {
    burger: '<svg viewBox="0 0 34 26"><path d="M28 13 q5 -3 4 -8" stroke="#9b4dde" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M5 13 q-5 -2 -4 -7" stroke="#9b4dde" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M5 11 Q17 -3 29 11 Z" fill="#e8b064"/><rect x="4" y="12" width="26" height="4.5" rx="2" fill="#6a2aa8"/><rect x="5" y="17.5" width="24" height="5.5" rx="2.6" fill="#e8b064"/></svg>',
    dish: '<svg viewBox="0 0 34 26"><path d="M4 10 h26 q-2 14 -13 14 q-11 0 -13 -14 z" fill="#1f5fbf"/><ellipse cx="17" cy="10" rx="13" ry="3.6" fill="#3b8cff"/><circle cx="21" cy="8.5" r="2.4" fill="#a9d0ff"/></svg>'
  };
  const TABLE = '<svg viewBox="0 0 34 26"><ellipse cx="17" cy="8" rx="14" ry="4.5" fill="#e0a05a"/><rect x="15" y="9" width="4" height="12" fill="#8a93a3"/><rect x="9" y="20" width="16" height="3" rx="1.5" fill="#8a93a3"/><circle cx="4" cy="17" r="3" fill="#9b4dde"/><circle cx="30" cy="17" r="3" fill="#9b4dde"/></svg>';
  const ANGRY ='<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#ff4d4d" stroke="#fff" stroke-width="2"/><path d="M8 11 l6 3 M24 11 l-6 3" stroke="#3a0a0a" stroke-width="2.6" stroke-linecap="round"/><circle cx="11.5" cy="16" r="2" fill="#3a0a0a"/><circle cx="20.5" cy="16" r="2" fill="#3a0a0a"/><path d="M10 24 q6 -5 12 0" stroke="#3a0a0a" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';

  class Overlay {
    constructor(view, root) {
      this.view = view; this.game = view.game; this.root = root;
      // all labels sit in ONE inner sheet. When the camera slides, only this sheet moves (one change per frame);
      // each label keeps its place on the sheet, so the phone does not redo every label every frame while you walk.
      // (the camera never turns or zooms, so a camera move shifts every label by the same amount)
      this.sheet = document.createElement('div');
      this.sheet.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;will-change:transform;';
      root.appendChild(this.sheet);
      this.sx = 0; this.sy = 0; this.sheetTf = '';
      this.els = new Map();
      this.floats = [];
      this.v = new THREE.Vector3();
      this.playerRect = null;
    }

    project(x, y, z) {
      this.v.set(x, y, z).project(this.view.camera);
      return { x: (this.v.x + 1) / 2 * this.view.width, y: (1 - this.v.y) / 2 * this.view.height, on: this.v.z < 1 && this.v.x > -1.2 && this.v.x < 1.2 && this.v.y > -1.2 && this.v.y < 1.2 };
    }

    el(key, cls, html) {
      let e = this.els.get(key);
      if (!e) {
        const d = document.createElement('div');
        d.className = cls;
        if (html !== undefined) d.innerHTML = html;
        this.sheet.appendChild(d);
        e = { d: d, html: html, cls: cls, seen: true, op: -1 };
        this.els.set(key, e);
      }
      e.seen = true;
      return e;
    }

    place(e, p, opacity) {
      const op = p.on ? opacity : 0;
      if (p.on) { // only touch the page when the label really moved (weak phones redo layout for every change)
        const tf = 'translate(' + (p.x - this.sx).toFixed(0) + 'px,' + (p.y - this.sy).toFixed(0) + 'px) translate(-50%,-50%)';
        if (tf !== e.tf) { e.d.style.transform = tf; e.tf = tf; }
      }
      if (Math.abs(op - e.op) > 0.01) {
        e.d.style.opacity = op.toFixed(2);
        const vis = op > 0.01; // hidden labels stop costing the phone a layer
        if (vis !== e.vis) { e.d.style.visibility = vis ? '' : 'hidden'; e.vis = vis; }
        e.op = op;
      }
    }

    setHtml(e, html) { if (e.html !== html) { e.d.innerHTML = html; e.html = html; } }

    overPlayer(p, w, h) {
      const r = this.playerRect;
      if (!r) return false;
      return p.x + w / 2 > r.x0 && p.x - w / 2 < r.x1 && p.y + h / 2 > r.y0 && p.y - h / 2 < r.y1;
    }

    floatText(text, x, y, z, cls) {
      const d = document.createElement('div');
      d.className = 'float ' + (cls || '');
      d.textContent = text;
      this.sheet.appendChild(d);
      this.floats.push({ d: d, x: x, y: y, z: z, t: 0 });
      if (this.floats.length > 24) { const f = this.floats.shift(); f.d.remove(); }
    }

    onEvent(e) {
      const d = e.data, g = this.game;
      if (e.type === 'purchase' && d.kind === 'upgrade') { const l = g.levelOf(d.trackId); if (l) this.floatText(l.lv >= l.max ? 'MAX!' : 'Lv ' + l.lv + '!', d.x, 1.6, d.z, 'money big'); }
      else if (e.type === 'gems') this.floatText('+' + d.amount + ' gem' + (d.amount > 1 ? 's' : ''), g.player.x, 3.1, g.player.z, 'gemtxt big');
      else if (e.type === 'collect') this.floatText('+' + U.fmtMoney(d.amount), g.player.x, 2.4, g.player.z, 'money');
      else if (e.type === 'money' && (d.why === 'levelup' || d.why === 'claim' || d.why === 'claimAd')) this.floatText('+' + U.fmtMoney(d.amount), g.player.x, 2.8, g.player.z, 'money big');
      else if (e.type === 'hotUpgrade') { const def = g.trackDefs[d.trackId]; if (def) this.floatText('SUPER!', g.player.x, 3.0, g.player.z, 'gemtxt big'); }
      else if (e.type === 'offerTaken') {
        const f = d.offer, t = f.type === 'magnet' ? 'MAGNET!' : f.type === 'hover' ? 'HOVER BOARD!' : f.type === 'worker' ? 'HELPER!' : f.type === 'cash' ? '+' + U.fmtMoney(f.amount) : '';
        if (t) this.floatText(t, g.player.x, 2.8, g.player.z, 'money big');
      }
      else if (e.type === 'boost') {
        const t = d.type === 'speed' ? 'x2 SPEED!' : d.type === 'items' ? '+' + d.amount + '!' : d.type === 'worker' ? 'HELPER!' : '+' + U.fmtMoney(d.amount);
        this.floatText(t, g.player.x, 2.8, g.player.z, 'money big');
      }
    }

    update(dt) {
      const g = this.game, pl = g.player, cfg = g.cfg;
      for (const e of this.els.values()) e.seen = false;
      // where the world origin is on screen = how far the sheet slides
      const o = this.project(0, 0, 0);
      this.sx = Math.round(o.x); this.sy = Math.round(o.y);
      const stf = 'translate(' + this.sx + 'px,' + this.sy + 'px)';
      if (stf !== this.sheetTf) { this.sheet.style.transform = stf; this.sheetTf = stf; }
      // where the chef + stack are on screen
      const feet = this.project(pl.x, 0, pl.z), top = this.project(pl.x, 1.9 + pl.stack.length * 0.22, pl.z);
      const half = Math.abs(this.project(pl.x + 0.5, 0, pl.z).x - feet.x) + 6;
      this.playerRect = { x0: feet.x - half, x1: feet.x + half, y0: Math.min(top.y, feet.y) - 8, y1: feet.y + 8 };
      // order bubbles (+ angry face when waiting too long)
      for (const c of g.customers) {
        const left = c.order - c.got;
        if (c.gaveUp) {
          const e = this.el('cust:' + c.id, 'angry', ANGRY);
          const p = this.project(c.x, c.chain === 'g' ? 2.45 : 1.75, c.z);
          this.place(e, p, 1);
          continue;
        }
        if (c.goal === 'exit') continue;
        if (c.line >= cfg.BUBBLE_SPOTS && !c.angry) continue; // far back in a long line: no bubble
        if (left <= 0 && !(c.waitSeat && c.state === 'line')) continue;
        const type = g.chains[c.chain].product;
        const e = this.el('cust:' + c.id, 'bubble ' + (c.chain === 'g' ? 'g' : 'p'));
        if (left <= 0 || c.waitTable) this.setHtml(e, '<span class="ico">' + TABLE + '</span><span class="n">?</span>'); // waits for a clean seat / for the first table of a new wing
        else this.setHtml(e, (c.angry ? '<span class="mad">' + ANGRY + '</span>' : '') + '<span class="ico">' + ICON[type] + '</span><span class="n">' + left + '</span>');
        const top = (c.chain === 'g' ? 2.45 : 1.75) + (c.line > 0 && c.line % 2 ? 0.35 : 0); // every other alien in line: bubble a bit higher
        const p = this.project(c.x, top, c.z);
        this.place(e, p, this.overPlayer(p, 60, 34) ? 0.2 : 1);
      }
      // the locked door: how much of Wing 1 is built
      if (!g.wing2Open && !g.revealing()) {
        const L = cfg.LAYOUT, e = this.el('door', 'doorlabel');
        this.setHtml(e, '<span class="lock"></span>Build Wing 1: ' + Math.min(g.wing1Built(), cfg.WING2_GATE) + '/' + cfg.WING2_GATE);
        const p = this.project(L.DOOR.x, L.DOOR_LABEL_Y, L.DOOR.z);
        this.place(e, p, this.overPlayer(p, 160, 34) ? 0.3 : 1);
      }
      // one-word labels over the Boost Terminals and desks (shown once their circle exists)
      const has = (id) => g.staticZones.some((z) => z.id === id), W1 = cfg.LAYOUT.W1, W2 = cfg.LAYOUT.W2;
      [['term:1', W1.terminal, 'Boost', 2.05], ['term:2', W2.terminal, 'Boost', 2.05], ['desk:chef', W1.chefDesk, 'Chef', 1.9], ['desk:hire1', W1.hireDesk, 'Hire', 1.9], ['desk:hire2', W2.hireDesk, 'Hire', 1.9], ['desk:chef2', W2.chefDesk, 'Chef', 1.9]].forEach((d) => {
        if (!has(d[0])) return;
        const t = d[1], e = this.el('lbl:' + d[0], 'tlabel ' + d[0].replace(/[:\d]/g, ''), d[2]);
        const p = this.project((t.x0 + t.x1) / 2, d[3], (t.z0 + t.z1) / 2);
        this.place(e, p, this.overPlayer(p, 60, 24) ? 0.25 : 0.95);
      });
      // level of every machine / tank / table ("Lv 2", the last one "MAX"); pops when it goes up
      const lv = (key, trackId, x, y, z) => {
        const l = g.levelOf(trackId);
        if (!l) return;
        const max = l.lv >= l.max, txt = (l.hot ? '<span class="star"></span>' : '') + (max ? 'MAX' : 'Lv ' + l.lv); // HOT upgrades: a star + gold
        const e = this.el('lv:' + key, 'lvlabel');
        if (e.html !== txt) { const up = e.html !== undefined; this.setHtml(e, txt); e.d.classList.toggle('max', max); e.d.classList.toggle('hot', !!l.hot); if (up) { e.d.classList.remove('bump'); void e.d.offsetWidth; e.d.classList.add('bump'); } }
        const p = this.project(x, y, z);
        this.place(e, p, this.overPlayer(p, 50, 22) ? 0.25 : 0.95);
      };
      for (const cid in g.chains) {
        const ch = g.chains[cid];
        if (!ch.active) continue;
        const s = ch.source;
        if (s.built) lv(s.id, s.id, s.pileX, 1.75, s.pileZ - 0.6);
        for (const m of ch.machines) if (m.built) lv(m.id, m.id + 'up', (m.rect.x0 + m.rect.x1) / 2, 2.55, (m.rect.z0 + m.rect.z1) / 2);
        for (const tb of ch.counter.tables) lv('t' + cid + tb.idx, 'tu' + ch.wing + '_' + tb.idx, tb.x, 1.45, tb.z);
      }
      // the floor offer: what you get, under its circle (with the little "watch" sign)
      const fo = g.floorOffer;
      if (fo) {
        const amt = fo.type === 'cash' ? '+' + U.fmtMoney(fo.amount) : TBS.FloorOffers.isGem(fo.type) ? '<span class="gem"></span>+' + fo.amount : fo.type === 'worker' ? Math.round(fo.amount / 60) + ' min' : fo.amount + ' s';
        const e = this.el('offer:' + fo.id, 'offerlabel');
        this.setHtml(e, '<span class="o-play"></span>' + amt);
        const p = this.project(fo.x, 0, fo.z + fo.r + 0.15);
        this.place(e, p, this.overPlayer(p, 70, 24) ? 0.3 : 1);
      }
      // temporary worker timers
      for (const w of g.workers) {
        if (!(w.temp > 0)) continue;
        const e = this.el('tw' + w.id, 'twlabel');
        this.setHtml(e, U.fmtTime(w.temp));
        const p = this.project(w.x, 2.2 + w.stack.length * 0.2, w.z);
        this.place(e, p, 0.9);
      }
      for (const [k, e] of this.els) if (!e.seen) { e.d.remove(); this.els.delete(k); }
      // floating texts
      for (let i = this.floats.length - 1; i >= 0; i--) {
        const f = this.floats[i];
        f.t += dt;
        const k = f.t / 1.3;
        if (k >= 1) { f.d.remove(); this.floats.splice(i, 1); continue; }
        const p = this.project(f.x, f.y + k * 1.2, f.z);
        f.d.style.transform = 'translate(' + (p.x - this.sx).toFixed(1) + 'px,' + (p.y - this.sy).toFixed(1) + 'px) translate(-50%,-50%) scale(' + (k < 0.15 ? 0.6 + k / 0.15 * 0.4 : 1).toFixed(2) + ')';
        f.d.style.opacity = (k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3).toFixed(2);
      }
    }
  }

  TBS.OverlayView = Overlay;
})(window.TBS = window.TBS || {});

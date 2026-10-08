/* Labels that follow the 3D world: prices on circles, alien order bubbles, "LVL 10" on the door,
   floating "+$" texts. Labels that would cover the chef or his stack fade out.
   They are drawn inside the 3D canvas by TBS.LabelLayer (labels.js), not as page elements: on weak phones
   moving page elements over the game every frame cost ~5 ms per frame while walking. */
(function (TBS) {
  'use strict';

  const U = TBS.U;

  class Overlay {
    constructor(view, root) {
      this.view = view; this.game = view.game; this.root = root;
      this.labels = new TBS.LabelLayer(view);
      this.els = new Map();
      this.floats = [];
      this.v = new THREE.Vector3();
      this.playerRect = null;
      this.time = 0;
    }

    project(x, y, z) {
      this.v.set(x, y, z).project(this.view.camera);
      return { x: (this.v.x + 1) / 2 * this.view.width, y: (1 - this.v.y) / 2 * this.view.height, on: this.v.z < 1 && this.v.x > -1.2 && this.v.x < 1.2 && this.v.y > -1.2 && this.v.y < 1.2 };
    }

    // one label per key; spec = what it shows (kind, text, colours...). It is repainted only when the spec changes.
    el(key, spec) {
      let e = this.els.get(key);
      if (!e) { e = { spec: spec, seen: true, a: 0, x: 0, y: 0, bump: 0 }; this.els.set(key, e); }
      e.seen = true;
      return e;
    }

    setSpec(e, spec) { e.spec = spec; }

    place(e, p, opacity) {
      e.a = p.on ? opacity : 0;
      if (p.on) { e.x = p.x; e.y = p.y; }
    }

    overPlayer(p, w, h) {
      const r = this.playerRect;
      if (!r) return false;
      return p.x + w / 2 > r.x0 && p.x - w / 2 < r.x1 && p.y + h / 2 > r.y0 && p.y - h / 2 < r.y1;
    }

    floatText(text, x, y, z, cls) {
      cls = cls || '';
      this.floats.push({ spec: { kind: 'float', text: text, big: cls.indexOf('big') >= 0, gem: cls.indexOf('gemtxt') >= 0 }, x: x, y: y, z: z, t: 0 });
      if (this.floats.length > 24) this.labels.release(this.floats.shift());
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
      // where the chef + stack are on screen
      const feet = this.project(pl.x, 0, pl.z), top = this.project(pl.x, 1.9 + pl.stack.length * 0.22, pl.z);
      const half = Math.abs(this.project(pl.x + 0.5, 0, pl.z).x - feet.x) + 6;
      this.playerRect = { x0: feet.x - half, x1: feet.x + half, y0: Math.min(top.y, feet.y) - 8, y1: feet.y + 8 };
      // order bubbles (+ angry face when waiting too long)
      for (const c of g.customers) {
        const left = c.order - c.got;
        if (c.gaveUp) {
          const e = this.el('cust:' + c.id, { kind: 'angry' });
          const p = this.project(c.x, c.chain === 'g' ? 2.45 : 1.75, c.z);
          this.place(e, p, 1);
          continue;
        }
        if (c.goal === 'exit') continue;
        if (c.line >= cfg.BUBBLE_SPOTS && !c.angry) continue; // far back in a long line: no bubble
        if (left <= 0 && !(c.waitSeat && c.state === 'line')) continue;
        const type = g.chains[c.chain].product;
        const chain = c.chain === 'g' ? 'g' : 'p', e = this.el('cust:' + c.id, null);
        if (left <= 0 || c.waitTable) this.setSpec(e, { kind: 'bubble', chain: chain, icon: 'table', text: '?' }); // waits for a clean seat / for the first table of a new wing
        else this.setSpec(e, { kind: 'bubble', chain: chain, mad: !!c.angry, icon: type, text: String(left) });
        const top = (c.chain === 'g' ? 2.45 : 1.75) + (c.line > 0 && c.line % 2 ? 0.35 : 0); // every other alien in line: bubble a bit higher
        const p = this.project(c.x, top, c.z);
        this.place(e, p, this.overPlayer(p, 60, 34) ? 0.2 : 1);
      }
      // the locked door: how much of Wing 1 is built
      if (!g.wing2Open && !g.revealing()) {
        const L = cfg.LAYOUT, e = this.el('door', null);
        this.setSpec(e, { kind: 'door', text: 'Build Wing 1: ' + Math.min(g.wing1Built(), cfg.WING2_GATE) + '/' + cfg.WING2_GATE });
        const p = this.project(L.DOOR.x, L.DOOR_LABEL_Y, L.DOOR.z);
        this.place(e, p, this.overPlayer(p, 160, 34) ? 0.3 : 1);
      }
      // one-word labels over the Boost Terminals and desks (shown once their circle exists)
      const has = (id) => g.staticZones.some((z) => z.id === id), W1 = cfg.LAYOUT.W1, W2 = cfg.LAYOUT.W2;
      [['term:1', W1.terminal, 'Boost', 2.05], ['term:2', W2.terminal, 'Boost', 2.05], ['desk:chef', W1.chefDesk, 'Chef', 1.9], ['desk:hire1', W1.hireDesk, 'Hire', 1.9], ['desk:hire2', W2.hireDesk, 'Hire', 1.9], ['desk:chef2', W2.chefDesk, 'Chef', 1.9]].forEach((d) => {
        if (!has(d[0])) return;
        const t = d[1], e = this.el('lbl:' + d[0], { kind: 'term', desk: d[0].indexOf('chef') >= 0 ? 'chef' : d[0].indexOf('hire') >= 0 ? 'hire' : '', text: d[2] });
        const p = this.project((t.x0 + t.x1) / 2, d[3], (t.z0 + t.z1) / 2);
        this.place(e, p, this.overPlayer(p, 60, 24) ? 0.25 : 0.95);
      });
      // level of every machine / tank / table ("Lv 2", the last one "MAX"); pops when it goes up
      const lv = (key, trackId, x, y, z) => {
        const l = g.levelOf(trackId);
        if (!l) return;
        const max = l.lv >= l.max, txt = max ? 'MAX' : 'Lv ' + l.lv; // HOT upgrades: a star + gold
        const e = this.el('lv:' + key, null), was = e.spec;
        if (!was || was.text !== txt || was.hot !== !!l.hot) { e.spec = { kind: 'lv', text: txt, max: max, hot: !!l.hot }; if (was) e.bump = 0.7; } // pops when it goes up
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
        const amt = fo.type === 'cash' ? '+' + U.fmtMoney(fo.amount) : TBS.FloorOffers.isGem(fo.type) ? '+' + fo.amount : fo.type === 'worker' ? Math.round(fo.amount / 60) + ' min' : fo.amount + ' s';
        const e = this.el('offer:' + fo.id, null);
        this.setSpec(e, { kind: 'offer', gem: TBS.FloorOffers.isGem(fo.type), text: amt });
        const p = this.project(fo.x, 0, fo.z + fo.r + 0.15);
        this.place(e, p, this.overPlayer(p, 70, 24) ? 0.3 : 1);
      }
      // temporary worker timers
      for (const w of g.workers) {
        if (!(w.temp > 0)) continue;
        const e = this.el('tw' + w.id, null);
        this.setSpec(e, { kind: 'timer', text: U.fmtTime(w.temp) });
        const p = this.project(w.x, 2.2 + w.stack.length * 0.2, w.z);
        this.place(e, p, 0.9);
      }
      for (const [k, e] of this.els) if (!e.seen) { this.labels.release(e); this.els.delete(k); }
      // draw: every label in order of creation (newer on top), then the floating texts
      this.time += dt;
      const lab = this.labels;
      lab.begin();
      for (const e of this.els.values()) {
        if (!e.spec) continue;
        let x = e.x, sc = 1;
        if (e.spec.kind === 'angry' || e.spec.mad) { const T = e.spec.mad ? 0.4 : 0.3, k = (this.time % T) / T; x += 1.5 - 1.5 * Math.cos(k * Math.PI * 2); } // shake
        if (e.bump > 0) { // "Lv up" pop: grows to 1.7x and back in 0.7 s, green for a moment
          e.bump = Math.max(0, e.bump - dt);
          const t = 1 - e.bump / 0.7, out = (q) => 1 - (1 - q) * (1 - q);
          sc = t < 0.3 ? 1 + 0.7 * out(t / 0.3) : 1.7 - 0.7 * out((t - 0.3) / 0.7);
          const green = t > 0.1 && t < 0.5;
          if (!!e.spec.bump !== green) e.spec = Object.assign({}, e.spec, { bump: green });
        }
        lab.add(e, x, e.y, e.a, sc);
      }
      for (let i = this.floats.length - 1; i >= 0; i--) {
        const f = this.floats[i];
        f.t += dt;
        const k = f.t / 1.3;
        if (k >= 1) { lab.release(f); this.floats.splice(i, 1); continue; }
        const p = this.project(f.x, f.y + k * 1.2, f.z);
        if (p.on) lab.add(f, p.x, p.y, k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3, k < 0.15 ? 0.6 + k / 0.15 * 0.4 : 1);
      }
    }
  }

  TBS.OverlayView = Overlay;
})(window.TBS = window.TBS || {});

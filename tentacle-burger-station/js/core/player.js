/* The chef: movement, bumping, and the station rules.
   PICKUP RULE: picking up from a source / machine output only happens inside its circle while moving slower than
   30% of max speed for 0.3 s; then one item every 0.08 s. Walking through at normal speed picks up nothing.
   Drops into machines / counters are instant. Return pads are instant. Price circles use the same stop rule. */
(function (TBS) {
  'use strict';

  const U = TBS.U;

  TBS.Player = class Player {
    constructor(x, z) {
      this.x = x; this.z = z; this.vx = 0; this.vz = 0; this.facing = Math.PI * 0.75;
      this.stack = [];                 // {id, type}, bottom -> top
      this.dwellId = null; this.dwell = 0; this.pickAcc = 0; this.streak = 0;
      this.latched = null;             // circle that already opened its panel, or '*' right after a purchase (waits until you walk / step off)
      this.payTickT = 0;
      this.moved = false; this.walkDist = 0;
    }

    maxSpeed(game) {
      const cfg = game.cfg, lv = Math.min(game.chef.speed || 0, cfg.CHEF_SPEED.length - 1);
      // Boost speed and the hover board (floor offer) don't add up: the bigger one counts
      const mult = Math.max(game.boosts.speed > 0 ? cfg.BOOST_SPEED_MULT : 1, game.effects.hover > 0 ? cfg.HOVER_SPEED_MULT : 1);
      return cfg.CHEF_SPEED[lv] * mult;
    }
    capacity(game) { const c = game.cfg.CHEF_CARRY; return c[Math.min(game.chef.carry || 0, c.length - 1)]; }
    speedNow() { return Math.hypot(this.vx, this.vz); }
    count(type) { let n = 0; for (const it of this.stack) if (it.type === type) n++; return n; }

    removeType(type, max) { // removes up to max items of a type, top first; returns removed items
      const out = [];
      for (let i = this.stack.length - 1; i >= 0 && out.length < max; i--) {
        if (this.stack[i].type === type) out.push(this.stack.splice(i, 1)[0]);
      }
      return out;
    }

    update(game, dt, input) {
      const cfg = game.cfg, max = this.maxSpeed(game);
      let ix = 0, iz = 0, mag = 0;
      if (input && !game.inputBlocked()) { ix = input.x || 0; iz = input.z || 0; mag = U.clamp(input.mag || 0, 0, 1); }
      const k = U.smooth(cfg.PLAYER_ACCEL, dt);
      this.vx += (ix * mag * max - this.vx) * k;
      this.vz += (iz * mag * max - this.vz) * k;
      if (Math.abs(this.vx) < 1e-3 && mag === 0) this.vx = 0;
      if (Math.abs(this.vz) < 1e-3 && mag === 0) this.vz = 0;
      const ox = this.x, oz = this.z;
      this.x += this.vx * dt; this.z += this.vz * dt;
      this.collide(game);
      const moved = Math.hypot(this.x - ox, this.z - oz);
      this.walkDist += moved;
      if (mag > 0.05 && moved > 0) this.moved = true;
      const sp = this.speedNow();
      if (sp > 0.3) this.facing = U.angleLerp(this.facing, Math.atan2(this.vx, this.vz), U.smooth(cfg.PLAYER_TURN_RATE, dt));
      this.zones(game, dt, sp / max);
    }

    collide(game) {
      const r = game.cfg.PLAYER_RADIUS, rects = game.obstacles;
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < rects.length; i++) {
          const p = U.pushOutOfRect(this.x, this.z, r, rects[i]);
          if (p) {
            const nx = p.x - this.x, nz = p.z - this.z, nl = Math.hypot(nx, nz);
            this.x = p.x; this.z = p.z;
            if (nl > 1e-6) { // cancel velocity into the wall so we slide along it
              const ux = nx / nl, uz = nz / nl, vn = this.vx * ux + this.vz * uz;
              if (vn < 0) { this.vx -= vn * ux; this.vz -= vn * uz; }
            }
          }
        }
      }
    }

    zones(game, dt, ratio) {
      const cfg = game.cfg, slow = ratio < cfg.PICKUP_SLOW_RATIO;
      let dwellZone = null, bestD = 1e9;
      let onLatched = false;
      for (const zn of game.zones) {
        const d = Math.hypot(this.x - zn.x, this.z - zn.z);
        if (d > zn.r || zn.type === 'cashier' || (zn.type === 'drop' && zn.kind === 'counter')) continue; // counters: whole area around them, below
        if (zn.id === this.latched || (this.latched === '*' && (zn.type === 'price' || zn.type === 'terminal'))) onLatched = true;
        if (zn.type === 'drop') this.dropInto(game, zn);
        else if (zn.type === 'return') this.returnTo(game, zn);
        else if (zn.type === 'clean' && (!dwellZone || dwellZone.type !== 'clean')) { bestD = d; dwellZone = zn; } // a dirty table wins over a price circle
        else if (d < bestD && !(dwellZone && dwellZone.type === 'clean')) { bestD = d; dwellZone = zn; }
      }
      // LATCH: a circle that just opened a panel, or was just bought (the next step appears on the same spot),
      // waits until you step off it OR walk a bit, and stop on it again. Nothing opens or charges by itself.
      // food goes on a counter from anywhere around it (and selling works there too, see Counter.staffed)
      for (const id in game.chains) {
        const ch = game.chains[id];
        if (ch.active && ch.counter.near(this.x, this.z)) this.dropInto(game, { kind: 'counter', ref: ch.counter });
      }
      if (this.latched && (!onLatched || !slow)) this.latched = null;
      // money piles fly to you
      for (const id in game.chains) {
        const ch = game.chains[id];
        if (!ch.active) continue;
        const m = ch.counter.money, R = game.effects.magnet > 0 ? cfg.MAGNET_RADIUS : cfg.MONEY_COLLECT_RADIUS; // magnet offer: from far away
        if (m.amount > 0 && Math.hypot(this.x - m.x, this.z - m.z) <= R) game.drainPile(m, 'money:' + ch.counter.id, dt, false);
        else if (m.drainRate) game.endDrain(m, 'money:' + ch.counter.id, false);
        for (const t of ch.counter.tables) {
          const key = 'tip:' + id + t.idx;
          if (t.tip.amount > 0 && Math.hypot(this.x - t.tip.x, this.z - t.tip.z) <= R) game.drainPile(t.tip, key, dt, true);
          else if (t.tip.drainRate) game.endDrain(t.tip, key, true);
        }
      }
      // dwell zones (pickup / price / terminal)
      const id = dwellZone ? dwellZone.id : null;
      if (id !== this.dwellId) { this.dwellId = id; this.dwell = 0; this.pickAcc = 0; this.streak = 0; }
      if (!dwellZone) return;
      if (!slow) { this.dwell = 0; this.pickAcc = 0; return; }
      if (this.latched === dwellZone.id || (this.latched === '*' && (dwellZone.type === 'price' || dwellZone.type === 'terminal'))) { this.dwell = 0; return; } // already opened / just bought: the ring stays empty
      this.dwell += dt;
      const need = dwellZone.type === 'clean' ? cfg.CLEAN_DWELL : dwellZone.type === 'pickup' ? cfg.PICKUP_DWELL : dwellZone.type === 'price' ? cfg.PRICE_DWELL : cfg.TERMINAL_DWELL;
      if (this.dwell < need) return;
      if (dwellZone.type === 'pickup') this.pickFrom(game, dwellZone, dt);
      else if (dwellZone.type === 'clean') this.cleanAt(game, dwellZone);
      else if (dwellZone.type === 'price') this.payInto(game, dwellZone, dt);
      else if (dwellZone.type === 'offer' && this.latched !== dwellZone.id) { // floor offer: paused panel "gems / watch ad / close"
        this.latched = dwellZone.id;
        this.vx = 0; this.vz = 0;
        game.emit('offerOpen', {});
      }
      else if (dwellZone.type === 'terminal' && this.latched !== dwellZone.id) {
        this.latched = dwellZone.id;
        this.vx = 0; this.vz = 0;
        game.emit('terminalOpen', { wing: dwellZone.wing, desk: dwellZone.desk || 'boost' });
      }
    }

    // dirty plates go on the tray; food and trash never share the tray
    cleanAt(game, zn) {
      const room = this.capacity(game) - this.stack.length;
      if (this.stack.length > this.count('plate')) { game.trayHint('food'); return; }
      if (room <= 0) { game.trayHint('full'); return; }
      game.cleanTable(zn.table, zn.chain, 'player', this, room);
    }

    pickFrom(game, zn, dt) {
      const cap = this.capacity(game);
      if (this.count('plate') > 0) { game.trayHint('trash'); return; } // throw the trash away first
      this.pickAcc -= dt;
      while (this.pickAcc <= 0) {
        if (this.stack.length >= cap) { this.pickAcc = 0; return; }
        const st = zn.ref;
        let item = null, fx, fz;
        if (zn.kind === 'source') {
          if (st.pile <= 0) { this.pickAcc = 0; return; }
          st.pile--; item = { id: game.nextId++, type: st.itemType }; fx = st.pileX; fz = st.pileZ;
        } else {
          if (st.output <= 0) { this.pickAcc = 0; return; }
          st.output--; item = { id: game.nextId++, type: st.outType }; fx = st.outPileX; fz = st.outPileZ;
        }
        this.stack.push(item);
        this.streak++;
        game.emit('pickup', { who: 'player', item: item, key: zn.key, x: fx, z: fz, streak: this.streak });
        this.pickAcc += game.cfg.PICKUP_INTERVAL;
      }
    }

    dropInto(game, zn) {
      if (zn.kind === 'machine') {
        const m = zn.ref, n = Math.min(m.room(), this.count(m.inType));
        if (n <= 0) return;
        const items = this.removeType(m.inType, n);
        m.input += items.length;
        game.emit('drop', { who: 'player', items: items, key: m.id + ':in', kind: 'machine', m: m });
      } else if (zn.kind === 'bin') {
        const n = this.count('plate');
        if (n <= 0) return;
        const items = this.removeType('plate', n);
        game.emit('drop', { who: 'player', items: items, key: zn.key, kind: 'bin', chain: zn.chain });
      } else {
        const c = zn.ref, type = game.chains[c.chain].product, n = Math.min(this.count(type), c.room());
        if (n <= 0) return;
        const items = this.removeType(type, n);
        c.stack += items.length;
        game.emit('drop', { who: 'player', items: items, key: c.id, kind: 'counter', counter: c });
      }
    }

    returnTo(game, zn) {
      const n = this.count(zn.itemType);
      if (!n) return;
      const items = this.removeType(zn.itemType, n);
      if (zn.kind === 'source') zn.ref.pile += items.length; else zn.ref.output += items.length;
      game.emit('return', { items: items, key: zn.key });
    }

    payInto(game, zn, dt) {
      const o = game.offers.find((x) => x.trackId === zn.trackId);
      if (!o) return;
      const paid = game.paid[o.trackId] || 0, remaining = o.price - paid;
      if (remaining <= 1e-6) { game.purchase(o.trackId); return; }
      if (game.money <= 0) return;
      const rate = Math.max(o.price / game.cfg.PRICE_FILL_TIME, game.cfg.PRICE_MIN_RATE);
      const pay = Math.min(rate * dt, game.money, remaining);
      game.money -= pay;
      game.paid[o.trackId] = paid + pay;
      this.payTickT -= dt;
      if (this.payTickT <= 0) {
        this.payTickT = 0.075;
        game.emit('payTick', { trackId: o.trackId, x: zn.x, z: zn.z, fill: (paid + pay) / o.price });
      }
      if (paid + pay >= o.price - 1e-6) game.purchase(o.trackId);
    }
  };
})(window.TBS = window.TBS || {});

/* Stations: ingredient sources (Tentacle Pad, Blue Goo Tank), machines, counters with their money piles. */
(function (TBS) {
  'use strict';

  class Source {
    constructor(id, chain, itemType, def, intervals, piles) {
      this.id = id; this.chain = chain; this.itemType = itemType;
      this.rect = { x0: def.x0, x1: def.x1, z0: def.z0, z1: def.z1 };
      this.pileX = def.pileX; this.pileZ = def.pileZ;
      this.circle = def.circle; this.ret = def.ret; this.workerSpot = def.worker;
      this.intervals = intervals; this.piles = piles;
      this.level = 0; this.pile = 0; this.timer = 0; this.active = true;
      this.built = false; // every wing starts empty: built with its own floor circle
      this.hot = 0; this.hotK = { speed: 0, pile: 0 }; // HOT upgrades picked (gems / ad) and what each one adds (set by the game)
    }
    interval() { return this.intervals[Math.min(this.level, this.intervals.length - 1)] / (1 + this.hotK.speed * this.hot); }
    max() { return this.piles[Math.min(this.level, this.piles.length - 1)] + this.hotK.pile * this.hot; }
    rate() { return this.built ? 1 / this.interval() : 0; }
    update(dt, game) {
      if (!this.active || !this.built) return;
      if (this.pile >= this.max()) { this.timer = 0; return; }
      this.timer += dt;
      const iv = this.interval();
      while (this.timer >= iv && this.pile < this.max()) {
        this.timer -= iv;
        this.pile++;
        game.emit('produced', { key: this.id });
      }
    }
  }

  // A machine turns one ingredient into one food, by itself. Its level sets speed and how much it holds.
  class Machine {
    constructor(id, chain, inType, outType, def, cfg) {
      this.id = id; this.chain = chain; this.inType = inType; this.outType = outType;
      this.rect = { x0: def.x0, x1: def.x1, z0: def.z0, z1: def.z1 };
      this.inZone = def.inZone; this.out = def.out; this.ret = def.ret; this.workerSpot = def.worker;
      this.outPileX = def.outPileX; this.outPileZ = def.outPileZ;
      this.unlockPos = def.unlock || null;
      this.levels = cfg.MACHINE_LEVELS;
      this.level = 0; this.input = 0; this.output = 0; this.timer = 0; this.built = true;
      this.hot = 0; this.hotK = cfg.PREMIUM.machine; // HOT upgrades picked (gems / ad): faster + holds more
    }
    spec() { return this.levels[Math.min(this.level, this.levels.length - 1)]; }
    cookTime() { return this.spec().cook / (1 + this.hotK.speed * this.hot); }
    get inputMax() { return this.spec().input + this.hotK.hold * this.hot; }
    get outputMax() { return this.spec().output + this.hotK.hold * this.hot; }
    rate() { return this.built ? 1 / this.cookTime() : 0; }
    room() { return this.inputMax - this.input; }
    update(dt, game) {
      if (!this.built) return;
      if (this.input <= 0) { this.timer = 0; return; }
      if (this.output >= this.outputMax) { this.timer = Math.min(this.timer, this.cookTime()); return; }
      this.timer += dt;
      const ct = this.cookTime();
      while (this.timer >= ct && this.input > 0 && this.output < this.outputMax) {
        this.timer -= ct;
        this.input--;
        this.output++;
        game.emit('cooked', { key: this.id });
      }
    }
  }

  // Seat spots around a table, by number of seats (dx, dz, facing toward the table).
  function seatLayout(s) {
    if (s === 1) return [[0.72, 0]];
    if (s === 2) return [[-0.75, 0], [0.75, 0]];
    if (s === 4) return [[-0.82, 0], [0.82, 0], [0, -0.82], [0, 0.82]];
    const out = [];
    for (let i = 0; i < s; i++) { const a = Math.PI + i / s * Math.PI * 2; out.push([Math.sin(a) * 1.02, Math.cos(a) * 1.02]); }
    return out;
  }
  const TOP_R = { 1: 0.4, 2: 0.45, 4: 0.55, 5: 0.68 };

  class Counter {
    constructor(id, chain, wing, def, cfg) {
      const L = cfg.LAYOUT;
      this.id = id; this.chain = chain; this.wing = wing;
      this.rect = { x0: def.counter.x0, x1: def.counter.x1, z0: def.counter.z0, z1: def.counter.z1 };
      this.drop = def.counterDrop;
      this.cashier = def.cashier;
      this.money = { x: def.money.x, z: def.money.z, amount: 0, bills: 0 };
      this.gate = def.gate;   // front entrance: aliens come in and go out here
      // single-file line: one straight line from the service spot (at the counter) back toward the gate
      const sp = L.LINE_SPACING, maxSpots = cfg.QUEUE_MAX, sv = def.service;
      this.lineSpots = [];
      for (let i = 0; i < maxSpots; i++) this.lineSpots.push({ x: sv.x - sv.tx * sp * i, z: sv.z - sv.tz * sp * i, face: Math.atan2(sv.tx, sv.tz) }); // all face the counter
      this.line = new Array(maxSpots).fill(null);
      this.tables = [];      // see addTable
      this.stack = 0;        // food waiting on the counter
      this.level = 0;        // counter upgrade level (food storage)
      this.hasCashier = false; // bought cashier stands in the cashier spot forever
      this.built = false;      // the counter itself is built with a floor circle (every wing starts empty)
      this.active = true;
      this.cfg = cfg;
    }
    lineCap() { const c = this.cfg; return Math.min(this.line.length, c.QUEUE_MAX, c.QUEUE_BASE + Math.floor(c.QUEUE_PER_TABLE * this.tables.length)); }
    max() { const s = this.cfg.COUNTER_STORAGE; return s[Math.min(this.level, s.length - 1)] + this.cfg.PREMIUM.counter.store * (this.hot || 0); } // + HOT upgrades
    room() { return Math.max(0, this.max() - this.stack); }
    // anywhere around the counter (either side) counts: put food on it / sell from there
    near(x, z) {
      if (!this.built) return false;
      const r = this.rect, dx = Math.max(r.x0 - x, 0, x - r.x1), dz = Math.max(r.z0 - z, 0, z - r.z1);
      return Math.hypot(dx, dz) <= this.cfg.COUNTER_REACH;
    }
    // selling happens only while someone is at the counter: the chef, a bought cashier, or a worker on cashier duty
    staffed(game) {
      if (this.hasCashier) return true;
      const p = game.player;
      if (this.near(p.x, p.z)) return true;
      return game.workers.some((w) => w.chain === this.chain && w.selling);
    }
    tableSpec(tb) { // each table has its own level (+ its HOT upgrades: bigger tip, faster eating)
      const t = this.cfg.TABLE_LEVELS, base = t[Math.min((tb && tb.level) || 0, t.length - 1)], hot = (tb && tb.hot) || 0;
      if (!hot) return base;
      const k = this.cfg.PREMIUM.table;
      return { tip: base.tip + k.tip * hot, eat: Math.max(1.5, base.eat - k.eat * hot) };
    }
    avgEat() { if (!this.tables.length) return this.tableSpec().eat; let s = 0; for (const tb of this.tables) s += this.tableSpec(tb).eat; return s / this.tables.length; }
    addTable(pos, idx) { // idx = which table spot of the wing layout
      const s = pos.s || 2, r = TOP_R[s] || 0.5, d = r + 0.85;
      this.tables.push({
        idx: idx, x: pos.x, z: pos.z, s: s, r: r, level: 0, hot: 0, // level = this table's own upgrades, hot = how many were HOT
        seats: seatLayout(s).map((o) => ({ x: pos.x + o[0], z: pos.z + o[1], face: Math.atan2(-o[0], -o[1]), user: null, dirty: false })),
        tip: { x: pos.x - d * 0.75, z: pos.z + d * 0.75, amount: 0, bills: 0 },   // tips wait on the floor next to the table
        cleanR: r + this.cfg.CLEAN_RING,                                         // stand inside this ring to clean
        work: { x: pos.x + d * 0.62, z: pos.z + d * 0.62 }                        // where a worker stands to clean (well inside the ring)
      });
    }
    dirtyTables() { return this.tables.filter((t) => t.seats.some((s) => s.dirty)); }
    freeSeat() { // a free, clean seat (prefers the table with the most free clean seats)
      let best = null, bestN = -1;
      for (const t of this.tables) {
        let n = 0, first = null;
        for (const s of t.seats) if (!s.user && !s.dirty) { n++; if (!first) first = s; }
        if (first && n > bestN) { best = { table: t, seat: first }; bestN = n; }
      }
      return best;
    }
    // new wing with no table yet: aliens wait, nobody buys (no take-away there)
    needsTables() { return this.tables.length === 0 && this.cfg.TABLES_FIRST_WINGS.indexOf(this.wing) >= 0; }
    seatCount() { let n = 0; for (const t of this.tables) n += t.seats.length; return n; }
  }

  TBS.Source = Source;
  TBS.Machine = Machine;
  TBS.Counter = Counter;
  TBS.seatLayout = seatLayout;
  TBS.TABLE_TOP_R = TOP_R;
})(window.TBS = window.TBS || {});

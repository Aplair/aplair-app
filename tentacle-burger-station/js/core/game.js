/* The whole game state and rules (no graphics). The view, the HUD, the ads code and the pacing bot all read it.
   update(dt, input) advances the world; events are collected in game.events for the view / sounds / test log. */
(function (TBS) {
  'use strict';

  const U = TBS.U, Eco = TBS.Economy;

  class Game {
    constructor(cfg, opts) {
      opts = opts || {};
      this.cfg = cfg;
      this.rng = U.makeRng(opts.seed || ((Date.now() ^ 0x5bd1e995) >>> 0));
      this.nowMs = opts.nowMs || (() => Date.now());
      this.trackDefs = Eco.buildTracks(cfg);
      this.totalSteps = Eco.totalSteps(this.trackDefs);
      this.events = [];
      this.nextId = 1;
      this.time = 0;            // game seconds (stops while paused)
      this.playTime = 0;        // seconds of play saved across sessions (used for the 5-minute rule)
      this.money = cfg.START_MONEY;
      this.gems = cfg.GEM_START;  // rare: levels, a finished wing, very rarely a tip
      this.xp = 0; this.level = 1;
      this.tracks = {}; for (const id in this.trackDefs) this.tracks[id] = 0;
      this.paid = {};
      this.chef = { speed: 0, carry: 0, profit: 0 }; // Chef Desk levels (0..10)
      this.guide = { step: 0, done: false, flags: {} };
      this.g2 = { active: false, step: 0, done: false, flags: {} };
      this.wing2Open = false; this.wing2Pending = false; this.revealT = 0; this.wing2OpenTime = 0;
      this.boosts = { speed: 0 };
      this.incomeEma = 0;
      this.stats = { sold: 0, soldP: 0, soldG: 0, purchases: 0, earned: 0, served: 0, left: 0 };
      this.batch = [];
      this.adCd = { levelup: 0, speed: 0, items: 0, worker: 0, cash: 0, upgrade: 0, workerUp: 0 };
      this.pendingLevel = null;
      this.hot = {};            // trackId -> how many of its steps were taken as the HOT version (gems / ad)
      this.priceLock = {};      // trackId -> { step, price }: an upgrade's price, fixed when its circle appeared
      this.pendingChoice = null;// just paid an upgrade: { trackId, step } until the "normal or HOT" panel is answered
      this.effects = { magnet: 0, hover: 0 }; // floor-offer effects: seconds left
      this.floorOffer = null;   // the offer on the floor right now (see offers.js)
      this.offerT = cfg.OFFER_FIRST_DELAY; this.offerSeq = 0; this.lastOfferType = null;
      this.sessions = 1; this.created = this.nowMs(); this.isNewSave = true;
      this.paused = false; this.blockInput = false;
      this.customers = []; this.workers = [];
      this.offers = []; this.offerSig = ''; this.offersDirty = true;
      this.obstacles = []; this.zones = []; this.staticZones = [];

      const L = cfg.LAYOUT;
      this.player = new TBS.Player(L.PLAYER_START.x, L.PLAYER_START.z);
      const m1 = new TBS.Machine('m1', 'p', 'tentacle', 'burger', L.W1.m1, cfg);
      const m2 = new TBS.Machine('m2', 'p', 'tentacle', 'burger', L.W1.m2, cfg);
      const g1 = new TBS.Machine('g1', 'g', 'goo', 'dish', L.W2.g1, cfg);
      const g2 = new TBS.Machine('g2', 'g', 'goo', 'dish', L.W2.g2, cfg);
      m1.built = m2.built = g1.built = g2.built = false; // every wing starts empty
      this.chains = {
        p: { id: 'p', wing: 1, ingredient: 'tentacle', product: 'burger', active: true, spawnT: 2.5,
             source: new TBS.Source('pad', 'p', 'tentacle', L.W1.pad, cfg.PAD_INTERVALS, cfg.PAD_PILE_MAX),
             machines: [m1, m2], counter: new TBS.Counter('c1', 'p', 1, L.W1, cfg) },
        g: { id: 'g', wing: 2, ingredient: 'goo', product: 'dish', active: false, spawnT: 3,
             source: new TBS.Source('goo', 'g', 'goo', L.W2.goo, cfg.GOO_INTERVALS, cfg.GOO_PILE_MAX),
             machines: [g1, g2], counter: new TBS.Counter('c2', 'g', 2, L.W2, cfg) }
      };
      for (const id in this.chains) this.chains[id].source.hotK = cfg.PREMIUM.source;
      this.nav = new TBS.Nav(-1, -2, L.WING2.x1 + 1, L.WING1.z1 + 1.5, 0.5); // covers both wings

      if (opts.save) this.load(opts.save);
      else this.newGame();
      this.rebuildWorld();
      this.refreshOffers();
    }

    // ---------- setup ----------
    newGame() {
      // the wing starts EMPTY: the guide has you build the pad, the machine, the counter, a table... (see applyPurchase)
    }
    built(id) { return (this.tracks[id] || 0) >= 1; }

    rebuildWorld() {
      const L = this.cfg.LAYOUT, ch = this.chains, rects = [];
      const X1 = L.WING2.x1, Z1 = L.WING1.z1;
      rects.push({ x0: -1, x1: 0, z0: -1, z1: Z1 + 1 }, { x0: -1, x1: X1 + 1, z0: -1, z1: 0 });
      rects.push({ x0: -1, x1: X1 + 1, z0: Z1, z1: Z1 + 1 }, { x0: X1, x1: X1 + 1, z0: -1, z1: Z1 + 1 });
      for (const w of [L.W1, L.W2]) for (const r of w.walls) rects.push(r); // low inner walls of the rooms + kitchen
      const px0 = L.DOOR.x - 0.15, px1 = L.DOOR.x + 0.15;
      if (!this.wing2Open) rects.push({ x0: px0, x1: px1, z0: 0, z1: L.WING1.z1 });
      else {
        rects.push({ x0: px0, x1: px1, z0: 0, z1: L.OPENING.z0 }, { x0: px0, x1: px1, z0: L.OPENING.z1, z1: L.WING1.z1 });
        const a = L.DOOR.z - L.DOOR.w / 2, b = L.DOOR.z + L.DOOR.w / 2;
        rects.push({ x0: px0 - 0.05, x1: px1 + 0.05, z0: a - 0.13, z1: a + 0.12 }, { x0: px0 - 0.05, x1: px1 + 0.05, z0: b - 0.12, z1: b + 0.13 });
      }
      for (const id in ch) {
        const c = ch[id];
        if (c.counter.built) rects.push(c.counter.rect);
        if (c.source.built) rects.push(c.source.rect);
        for (const m of c.machines) if (m.built) rects.push(m.rect);
        for (const t of c.counter.tables) rects.push({ x0: t.x - t.r, x1: t.x + t.r, z0: t.z - t.r, z1: t.z + t.r });
      }
      // desks, terminals and bins exist only once built
      for (const w of [1, 2]) {
        const W = w === 2 ? L.W2 : L.W1;
        if (this.built('b_hire' + w)) rects.push(W.hireDesk);
        if (this.built('b_chef' + w)) rects.push(W.chefDesk);
        if (this.built('b_term' + w)) rects.push(W.terminal);
        if (this.built('b_bin' + w)) rects.push(W.bin);
      }
      this.obstacles = rects;
      this.nav.rebuild(rects, this.cfg.PLAYER_RADIUS + 0.05);
      this.navDirty = (this.navDirty || 0) + 1;

      const z = [];
      for (const id in ch) {
        const c = ch[id];
        if (!c.active) continue;
        const s = c.source;
        if (s.built) {
          z.push({ id: 'pick:' + s.id, type: 'pickup', kind: 'source', x: s.circle.x, z: s.circle.z, r: s.circle.r, ref: s, key: s.id, chain: id });
          z.push({ id: 'ret:' + s.id, type: 'return', kind: 'source', x: s.ret.x, z: s.ret.z, r: s.ret.r, ref: s, key: s.id, itemType: s.itemType, chain: id });
        }
        for (const m of c.machines) {
          if (!m.built) continue;
          z.push({ id: 'pick:' + m.id, type: 'pickup', kind: 'machine', x: m.out.x, z: m.out.z, r: m.out.r, ref: m, key: m.id, chain: id });
          z.push({ id: 'drop:' + m.id, type: 'drop', kind: 'machine', x: m.inZone.x, z: m.inZone.z, r: m.inZone.r, ref: m, key: m.id + ':in', chain: id });
          z.push({ id: 'ret:' + m.id, type: 'return', kind: 'machine', x: m.ret.x, z: m.ret.z, r: m.ret.r, ref: m, key: m.id, itemType: m.outType, chain: id });
        }
        const d = c.counter.drop, cs = c.counter.cashier;
        if (c.counter.built) {
          z.push({ id: 'drop:' + c.counter.id, type: 'drop', kind: 'counter', x: d.x, z: d.z, r: d.r, ref: c.counter, key: c.counter.id, chain: id });
          z.push({ id: 'cashier:' + c.counter.id, type: 'cashier', x: cs.x, z: cs.z, r: cs.r, ref: c.counter, chain: id });
        }
        const bd = (c.counter.wing === 2 ? L.W2 : L.W1).bin.drop;
        if (this.built('b_bin' + c.wing)) z.push({ id: 'bin:' + id, type: 'drop', kind: 'bin', x: bd.x, z: bd.z, r: bd.r, key: 'bin:' + id, chain: id });
      }
      // stand-on circles that open a paused panel: Boost Terminals, Chef Desks, Hire Desks (once built)
      const desk = (id, d, wing, c) => z.push({ id: id, type: 'terminal', desk: d, wing: wing, x: c.x, z: c.z, r: c.r });
      if (this.built('b_term1')) desk('term:1', 'boost', 1, L.W1.terminal.circle);
      if (this.built('b_chef1')) desk('desk:chef', 'chef', 1, L.W1.chefDesk.circle);
      if (this.built('b_hire1')) desk('desk:hire1', 'hire', 1, L.W1.hireDesk.circle);
      if (this.wing2Open) {
        if (this.built('b_term2')) desk('term:2', 'boost', 2, L.W2.terminal.circle);
        if (this.built('b_hire2')) desk('desk:hire2', 'hire', 2, L.W2.hireDesk.circle);
        if (this.built('b_chef2')) desk('desk:chef2', 'chef', 2, L.W2.chefDesk.circle);
      }
      this.staticZones = z;
      this.rebuildZones();
    }

    rebuildZones() {
      const r = this.cfg.LAYOUT.PRICE_CIRCLE_R, clean = [];
      for (const id in this.chains) {
        const ch = this.chains[id];
        if (!ch.active) continue;
        for (const t of ch.counter.dirtyTables()) clean.push({ id: 'clean:' + id + t.idx, type: 'clean', table: t, chain: id, x: t.x, z: t.z, r: t.cleanR });
      }
      this.cleanZonesDirty = false;
      const fo = this.floorOffer, offer = fo ? [{ id: 'offer:' + fo.id, type: 'offer', x: fo.x, z: fo.z, r: fo.r }] : [];
      this.zones = this.staticZones.concat(this.offers.map((o) => ({ id: 'price:' + o.trackId, type: 'price', trackId: o.trackId, x: o.x, z: o.z, r: r })), clean, offer);
    }

    // a table gets its leftovers removed (by the chef or a worker): each dirty seat = one dirty plate onto the carrier's tray
    // (at most `room` plates; seats that don't fit stay dirty). The plates must then go into the trash bin.
    cleanTable(t, chainId, who, carrier, room) {
      let n = 0;
      for (const s of t.seats) {
        if (!s.dirty || n >= room) continue;
        s.dirty = false; n++;
        const item = { id: this.nextId++, type: 'plate' };
        carrier.stack.push(item);
        this.emit('pickup', { who: who, w: who === 'worker' ? carrier : undefined, item: item, key: 'plate', x: s.x + (t.x - s.x) * 0.55, z: s.z + (t.z - s.z) * 0.55, streak: n });
      }
      if (n) this.emit('clean', { table: t, chain: chainId, who: who, x: t.x, z: t.z, n: n });
      return n;
    }

    // a short hint when the tray blocks an action (food + trash never share the tray)
    trayHint(why) {
      if (this.time - (this.trayHintT || -99) < this.cfg.TRAY_HINT_GAP) return;
      this.trayHintT = this.time;
      this.emit('trayHint', { why: why });
    }


    refreshOffers() {
      this.offersDirty = false;
      this.offers = Eco.visibleOffers(this);
      const sig = this.offers.map((o) => o.trackId + o.step).join('|');
      if (sig !== this.offerSig) { this.offerSig = sig; this.rebuildZones(); this.emit('offersChanged', {}); }
      else this.rebuildZones();
    }

    // ---------- main loop ----------
    update(dt, input) {
      if (this.paused) return;
      const cfg = this.cfg;
      this.time += dt;
      if (this.revealT > 0) { this.revealT -= dt; if (this.revealT <= 0) this.finishWing2(); }
      if (this.boosts.speed > 0) this.boosts.speed = Math.max(0, this.boosts.speed - dt);
      for (const k in this.effects) if (this.effects[k] > 0) this.effects[k] = Math.max(0, this.effects[k] - dt);
      TBS.FloorOffers.update(this, dt);
      // the new wing's "quiet start" clock runs only once it can sell (counter + a table): building it up takes a while
      if (this.wing2Open && this.chains.g.counter.built && this.chains.g.counter.tables.length) this.wing2OpenTime += dt;
      this.incomeEma *= Math.exp(-dt / cfg.INCOME_AVERAGE_SECONDS);
      this.player.update(this, dt, input);
      for (const id in this.chains) {
        const c = this.chains[id];
        if (!c.active) continue;
        c.source.update(dt, this);
        for (const m of c.machines) m.update(dt, this);
      }
      TBS.Customers.update(this, dt);
      TBS.Workers.update(this, dt);
      TBS.Guide.update(this);
      if (this.offersDirty) this.refreshOffers();
      else if (this.cleanZonesDirty) this.rebuildZones();
    }

    tickPlayTime(dt) { this.playTime += dt; }
    inputBlocked() { return this.blockInput || this.revealT > 0; }
    revealing() { return this.revealT > 0; }

    emit(type, data) {
      if (type === 'dirty' || type === 'clean') this.cleanZonesDirty = true;
      TBS.Guide.onEvent(this, type, data);
      this.events.push({ type: type, data: data });
      if (this.events.length > 4000) this.events.splice(0, 2000); // nobody listening (safety)
    }
    drainEvents() { const e = this.events; this.events = []; return e; }

    // ---------- economy ----------
    profitMult() { const p = this.cfg.CHEF_PROFIT; return p[Math.min(this.chef.profit, p.length - 1)]; }
    priceOf(chainId) { return (chainId === 'p' ? this.cfg.BURGER_PRICE : this.cfg.DISH_PRICE) * this.profitMult(); }

    chainCapacity(chainId) {
      const c = this.chains[chainId];
      if (!c.active) return 0;
      let m = 0;
      for (const mc of c.machines) m += mc.rate();
      return Math.min(c.source.rate(), m);
    }

    income() {
      let floor = 0;
      for (const id in this.chains) floor += this.chainCapacity(id) * this.priceOf(id);
      return Math.max(this.incomeEma, floor * this.cfg.INCOME_FLOOR_FACTOR);
    }

    onSale(chainId, n, amount) {
      this.stats.sold += n;
      if (chainId === 'p') this.stats.soldP += n; else this.stats.soldG += n;
      this.stats.earned += amount;
      this.incomeEma += amount / this.cfg.INCOME_AVERAGE_SECONDS;
      this.addXp(this.cfg.XP_PER_SALE); // every alien served is a bit of level progress (levels never stop)
    }

    addMoney(amount, why) { this.money += amount; this.emit('money', { amount: amount, why: why }); }

    // Standing at a money pile (sales or tips): it flies to you layer by layer from the top, not all at once.
    // The whole pile takes about COLLECT_TIME seconds. 'collectTick' feeds the flying layers, 'collect' = done.
    drainPile(pile, key, dt, tip) {
      if (pile.amount <= 0) return;
      const cfg = this.cfg;
      if (!pile.drainRate) {
        pile.drainRate = tip ? Math.max(cfg.TIP_COLLECT_MIN_RATE, pile.amount / cfg.TIP_COLLECT_TIME) : Math.max(cfg.COLLECT_MIN_RATE, pile.amount / cfg.COLLECT_TIME);
        pile.drained = 0; pile.acc = 0;
      }
      // a new tip landing while you collect: speed up so the bigger pile still empties in time (never "stuck")
      else if (tip) pile.drainRate = Math.max(pile.drainRate, pile.amount / cfg.TIP_COLLECT_TIME);
      pile.acc += pile.drainRate * dt;
      const take = Math.min(pile.amount, Math.floor(pile.acc));
      if (take <= 0) return;
      pile.acc -= take; pile.amount -= take; pile.drained += take;
      this.money += take;
      this.emit('collectTick', { key: key, x: pile.x, z: pile.z, amount: take, left: pile.amount, tip: !!tip });
      if (pile.amount <= 0) { pile.amount = 0; pile.bills = 0; this.endDrain(pile, key, tip); }
    }
    endDrain(pile, key, tip) {
      if (pile.drained > 0) this.emit('collect', { amount: pile.drained, key: key, x: pile.x, z: pile.z, tip: !!tip });
      pile.drainRate = 0; pile.drained = 0; pile.acc = 0;
    }

    purchase(trackId) {
      const o = Eco.nextStep(this, trackId);
      if (!o) return;
      delete this.paid[trackId];
      this.tracks[trackId]++;
      this.player.latched = '*'; // the next circle on this spot (next upgrade step) waits until you walk and stop again
      this.applyPurchase(trackId, o.step);
      this.stats.purchases++;
      delete this.priceLock[trackId];
      this.emit('purchase', { trackId: trackId, step: o.step, price: o.price, x: o.x, z: o.z, label: o.label, kind: o.kind, chain: o.chain });
      this.offersDirty = true;
      this.addXp(this.cfg.XP_PER_BUILD); // station builds / upgrades are level progress (and every alien served)
      // an upgrade: the paused panel lets you keep it or take the stronger HOT version (gems / ad)
      if (o.kind === 'upgrade') { this.pendingChoice = { trackId: trackId, step: o.step }; this.emit('upgradeChoice', { trackId: trackId, step: o.step }); }
      this.checkWingGate();
    }

    // ---------- "normal or HOT" upgrade panel ----------
    keepNormal() { this.pendingChoice = null; }
    // how = 'gems' (pays the gems) or 'ad' (after a finished rewarded ad)
    chooseHot(how) {
      const pc = this.pendingChoice;
      if (!pc) return false;
      const gems = Eco.hotGems(this.cfg, pc.step);
      if (how === 'gems') { if (this.gems < gems) return false; this.gems -= gems; }
      else this.startAdCooldown('upgrade');
      this.pendingChoice = null;
      this.hot[pc.trackId] = (this.hot[pc.trackId] || 0) + 1;
      this.applyHot(pc.trackId);
      this.emit('hotUpgrade', { trackId: pc.trackId, how: how, gems: how === 'gems' ? gems : 0 });
      this.addXp(this.cfg.PREMIUM_XP);
      return true;
    }
    // put the HOT bonus of a track on its station (also used after loading a save)
    applyHot(id) {
      const def = this.trackDefs[id], n = this.hot[id] || 0, p = this.chains.p, g = this.chains.g;
      if (!def) return;
      if (def.tableUp !== undefined) { const tb = (def.wing === 2 ? g : p).counter.tables.find((x) => x.idx === def.tableUp); if (tb) tb.hot = n; return; }
      const map = { m1up: p.machines[0], m2up: p.machines[1], g1up: g.machines[0], g2up: g.machines[1], pad: p.source, goo: g.source, c1up: p.counter, c2up: g.counter };
      if (map[id]) map[id].hot = n;
    }

    applyPurchase(id, step) {
      const cfg = this.cfg, L = cfg.LAYOUT, p = this.chains.p, g = this.chains.g, t = this.tracks;
      const def = this.trackDefs[id];
      if (def.table !== undefined) {
        (def.wing === 2 ? g : p).counter.addTable(def.pos, def.table);
        this.rebuildWorld();
        return;
      }
      if (def.build) { this.applyBuild(id, true); this.rebuildWorld(); return; } // the basics of an empty wing
      if (def.tableUp !== undefined) { // one table's own upgrade
        const tb = (def.wing === 2 ? g : p).counter.tables.find((x) => x.idx === def.tableUp);
        if (tb) tb.level = t[id];
        return;
      }
      switch (id) {
        case 'machine2': p.machines[1].built = true; this.rebuildWorld(); break;
        case 'gmachine2': g.machines[1].built = true; this.rebuildWorld(); break;
        case 'm1up': p.machines[0].level = t.m1up; break;
        case 'm2up': p.machines[1].level = t.m2up; break;
        case 'pad': p.source.level = t.pad; break;
        case 'goo': g.source.level = t.goo; break;
        case 'g1up': g.machines[0].level = t.g1up; break;
        case 'g2up': g.machines[1].level = t.g2up; break;
        case 'cash1': p.counter.hasCashier = true; break;
        case 'cash2': g.counter.hasCashier = true; break;
        case 'c1up': p.counter.level = t.c1up; break;
        case 'c2up': g.counter.level = t.c2up; break;
        default: break;
      }
    }

    // a basic thing of a wing is built (fresh = just bought now, not loaded from a save: then it starts with a few items / aliens)
    applyBuild(id, fresh) {
      const cfg = this.cfg, m = /^b_([a-z]+)(\d)$/.exec(id);
      if (!m) return;
      const ch = this.chains[this.chainOfWing(Number(m[2]))];
      if (m[1] === 'src') { ch.source.built = true; if (fresh) ch.source.pile = ch.id === 'g' ? cfg.START_GOO_PILE : cfg.START_PAD_PILE; }
      else if (m[1] === 'm') { ch.machines[0].built = true; if (fresh && ch.id === 'p') ch.machines[0].output = cfg.START_MACHINE_OUTPUT; }
      else if (m[1] === 'ctr') {
        ch.counter.built = true;
        if (fresh) { // the first aliens walk in
          const n = ch.id === 'g' ? cfg.START_GREEN_CUSTOMERS : cfg.START_CUSTOMERS;
          for (let i = 0; i < n; i++) TBS.Customers.spawn(this, ch.id, { atSpot: true, order: i === 0 ? 2 : undefined });
        }
      }
    }

    addGems(n, why) { this.gems += n; this.emit('gems', { amount: n, why: why }); }

    // level of a thing for the labels over machines / tanks / tables: { lv, max, hot } (hot = HOT upgrades taken: gold label)
    levelOf(trackId) { const tr = this.trackDefs[trackId]; return tr ? { lv: (this.tracks[trackId] || 0) + 1, max: tr.steps.length + 1, hot: this.hot[trackId] || 0 } : null; }

    // ---------- Wing 2 gate: all Wing 1 tables + both machines ----------
    wing1Built() { return this.chains.p.counter.tables.length + this.chains.p.machines.filter((m) => m.built).length; }
    checkWingGate() {
      if (this.wing2Open || this.wing2Pending || this.revealT > 0 || this.wing1Built() < this.cfg.WING2_GATE) return;
      this.wing2Pending = true;
      this.emit('wing2Ready', { auto: this.isEarlyPhase() });
    }

    // ---------- Chef Desk (gems) + Hire Desks (hiring = money, worker upgrades = gems); no level progress ----------
    chefPrice(kind) { const l = this.cfg.CHEF_PRICES[kind]; return this.chef[kind] < l.length ? l[this.chef[kind]] : null; }
    buyChef(kind) {
      const price = this.chefPrice(kind);
      if (price === null || this.gems < price) return false;
      this.gems -= price;
      this.chef[kind]++;
      this.emit('deskBuy', { desk: 'chef', kind: kind, level: this.chef[kind], price: price });
      return true;
    }
    hirePrice(wing) {
      const list = this.cfg.HIRE_PRICES[wing], n = TBS.Workers.hired(this, this.chainOfWing(wing)).length;
      return n < Math.min(list.length, this.cfg.WORKERS_PER_WING) ? list[n] : null;
    }
    hire(wing) {
      const price = this.hirePrice(wing);
      if (price === null || this.money < price) return false;
      this.money -= price;
      const w = TBS.Workers.add(this, this.chainOfWing(wing), 0);
      this.emit('deskBuy', { desk: 'hire', kind: 'hire', wing: wing, w: w, price: price });
      return true;
    }
    // kind 'speed' -> worker.sp, kind 'cap' -> worker.cap
    workerUpPrice(w, kind) { const l = this.cfg.WORKER_UP_PRICES[kind], f = kind === 'speed' ? 'sp' : 'cap'; return w[f] < l.length ? l[w[f]] : null; }
    upgradeWorker(w, kind) {
      const price = this.workerUpPrice(w, kind), f = kind === 'speed' ? 'sp' : 'cap';
      if (price === null || this.gems < price) return false;
      this.gems -= price;
      w[f]++;
      this.emit('deskBuy', { desk: 'hire', kind: kind, w: w, level: w[f], price: price });
      return true;
    }
    // ONE button per worker: each press upgrades the skill whose turn it is (speed, capacity, speed, ...), so both grow together
    workerNext(w) {
      const s = this.workerUpPrice(w, 'speed') !== null, c = this.workerUpPrice(w, 'cap') !== null;
      if (s && c) return w.sp <= w.cap ? 'speed' : 'cap';
      return s ? 'speed' : c ? 'cap' : null;
    }
    workerNextPrice(w) { const k = this.workerNext(w); return k ? this.workerUpPrice(w, k) : null; }
    upgradeWorkerNext(w) { const k = this.workerNext(w); return k ? this.upgradeWorker(w, k) : false; }
    upgradeWorkerNextByAd(w) { const k = this.workerNext(w); return k ? this.upgradeWorkerByAd(w, k) : false; }
    // the same upgrade after a finished rewarded ad (one timer for all worker upgrades: WORKER_AD_COOLDOWN)
    upgradeWorkerByAd(w, kind) {
      const f = kind === 'speed' ? 'sp' : 'cap';
      if (this.workerUpPrice(w, kind) === null) return false;
      this.startAdCooldown('workerUp');
      w[f]++;
      this.emit('deskBuy', { desk: 'hire', kind: kind, w: w, level: w[f], price: 0, ad: true });
      return true;
    }

    // ---------- levels ----------
    xpForLevel(l) { return Eco.xpForLevel(this.cfg, l); }

    addXp(n) {
      this.xp += n;
      while (this.xp >= this.xpForLevel(this.level + 1)) { this.level++; this.onLevelUp(); }
    }

    levelReward() { return U.niceRound(this.income() * this.cfg.LEVELUP_CLAIM_INCOME_SECONDS); }

    onLevelUp() {
      const reward = this.levelReward(), auto = this.isEarlyPhase();
      // given together with the money: right away (early phase) or on "Claim"; every 5th level brings a few more
      const gems = this.cfg.GEM_PER_LEVEL + (this.level % 5 === 0 ? this.cfg.GEM_EVERY_5_LEVELS : 0);
      if (auto) { this.addMoney(reward, 'levelup'); this.addGems(gems, 'levelup'); }
      else if (this.pendingLevel) { this.pendingLevel.level = this.level; this.pendingLevel.reward += reward; this.pendingLevel.gems += gems; }
      else this.pendingLevel = { level: this.level, reward: reward, gems: gems };
      this.emit('levelup', { level: this.level, auto: auto, reward: reward, gems: gems });
    }

    claimLevel(mult) {
      if (!this.pendingLevel) return 0;
      const amount = Math.round(this.pendingLevel.reward * (mult || 1)), gems = (this.pendingLevel.gems || 0) * (mult || 1);
      this.pendingLevel = null;
      this.addMoney(amount, mult > 1 ? 'claimAd' : 'claim');
      if (gems > 0) this.addGems(gems, 'levelup'); // the gems of the level (the ad "Claim x3" triples them too)
      return amount;
    }

    // ---------- rules for panels and ads (STUDIO-RULES section 10) ----------
    isEarlyPhase() { return !this.guide.done || this.playTime < this.cfg.EARLY_PHASE_SECONDS; }
    earlyLeft() { return this.guide.done ? Math.max(0, this.cfg.EARLY_PHASE_SECONDS - this.playTime) : Infinity; }
    midgameAllowed() { return !this.isEarlyPhase() && this.level >= this.cfg.MIDGAME_MIN_LEVEL; }
    // the first-5-minutes wait is only for the ads in EARLY_AD_KINDS; Boost ads are ready from the first use
    earlyBlocks(kind) { return this.cfg.EARLY_AD_KINDS.indexOf(kind) >= 0 && this.isEarlyPhase(); }
    adReady(kind) { return !this.earlyBlocks(kind) && this.nowMs() >= (this.adCd[kind] || 0); }
    adWait(kind) { return Math.max(this.cfg.EARLY_AD_KINDS.indexOf(kind) >= 0 ? this.earlyLeft() : 0, ((this.adCd[kind] || 0) - this.nowMs()) / 1000, 0); }
    // Boost Terminal ads and worker-upgrade ads wait 3 minutes; the HOT upgrade ad and the level-up "Claim x3" ad have their own (0 = no limit)
    startAdCooldown(kind) {
      const c = this.cfg, s = kind === 'upgrade' ? c.UPGRADE_AD_COOLDOWN : kind === 'levelup' ? c.LEVELUP_AD_COOLDOWN : kind === 'workerUp' ? c.WORKER_AD_COOLDOWN : c.AD_COOLDOWN_SECONDS;
      this.adCd[kind] = this.nowMs() + s * 1000;
    }

    // ---------- boosts (Boost Terminal) ----------
    chainOfWing(wing) { return wing === 2 ? 'g' : 'p'; }
    boostPrice(type) { return this.cfg.BOOST_GEMS[type]; } // in GEMS (every boost: gems or an ad, never money)
    boostItems(wing) { const c = this.cfg; return Math.max(c.BOOST_ITEMS_MIN, Math.round(this.chainCapacity(this.chainOfWing(wing)) * c.BOOST_ITEMS_CAPACITY_SECONDS)); }
    cashReward() { return U.niceRound(this.income() * this.cfg.REWARD_CASH_INCOME_SECONDS); }
    boostActive(type, wing) {
      if (type === 'speed') return this.boosts.speed > 0;
      if (type === 'worker') { const ch = this.chainOfWing(wing); return this.workers.some((w) => w.temp > 0 && w.chain === ch); }
      return false;
    }
    grantBoost(type, wing) {
      const cfg = this.cfg, ch = this.chains[this.chainOfWing(wing)];
      let amount = 0;
      if (type === 'speed') { this.boosts.speed = cfg.BOOST_SPEED_SECONDS; amount = cfg.BOOST_SPEED_SECONDS; }
      else if (type === 'items') { amount = this.boostItems(wing); ch.source.pile += amount; }
      else if (type === 'worker') {
        const t = (wing === 2 ? cfg.LAYOUT.W2 : cfg.LAYOUT.W1).terminal.circle;
        TBS.Workers.add(this, ch.id, cfg.BOOST_WORKER_SECONDS, t.x, t.z);
        amount = cfg.BOOST_WORKER_SECONDS;
      } else if (type === 'cash') { amount = this.cashReward(); this.money += amount; }
      this.emit('boost', { type: type, wing: wing, amount: amount });
      return amount;
    }
    buyBoost(type, wing) { // gems (or an ad), never money
      const price = this.boostPrice(type);
      if (this.gems < price || this.boostActive(type, wing)) return false;
      this.gems -= price;
      this.grantBoost(type, wing);
      return true;
    }

    // ---------- Wing 2 ----------
    openWing2() {
      if (this.wing2Open || this.revealT > 0) return;
      this.wing2Pending = false;
      this.revealT = this.cfg.REVEAL_SECONDS;
      this.emit('revealStart', {});
    }

    finishWing2() {
      const cfg = this.cfg, L = cfg.LAYOUT, g = this.chains.g;
      this.revealT = 0;
      this.wing2Open = true;
      g.active = true;
      this.rebuildWorld(); // the new wing is EMPTY: tank, machine, counter... are built with floor circles (aliens come with the counter)
      this.g2.active = true;
      this.gems += cfg.GEM_WING_COMPLETE; // a wing complete: a handful of rare gems
      this.emit('gems', { amount: cfg.GEM_WING_COMPLETE, why: 'wing' });
      this.offersDirty = true;            // the new wing gets its own 2 circles (tables first); Wing 1 keeps its own
      this.emit('wing2Open', {});
    }

    completionPercent() {
      let n = 0, total = this.totalSteps;
      for (const id in this.tracks) n += this.tracks[id];
      for (const k in this.chef) { n += this.chef[k]; total += this.cfg.CHEF_PRICES[k].length; }
      return Math.round(100 * n / total);
    }

    // ---------- save / load ----------
    serialize() {
      const ch = this.chains, p = this.player;
      return {
        v: this.cfg.SAVE_VERSION, money: this.money, gems: this.gems, xp: this.xp, level: this.level,
        tracks: Object.assign({}, this.tracks), paid: Object.assign({}, this.paid),
        chef: Object.assign({}, this.chef),
        workers: this.workers.filter((w) => !(w.temp > 0)).map((w) => [w.chain, w.sp, w.cap]),
        guide: { step: this.guide.step, done: this.guide.done, flags: Object.assign({}, this.guide.flags) },
        g2: { active: this.g2.active, step: this.g2.step, done: this.g2.done, flags: Object.assign({}, this.g2.flags) },
        wing2Open: this.wing2Open, wing2Pending: this.wing2Pending || this.revealT > 0, wing2OpenTime: Math.round(this.wing2OpenTime),
        piles: { pad: ch.p.source.pile, goo: ch.g.source.pile },
        machines: { m1: [ch.p.machines[0].input, ch.p.machines[0].output], m2: [ch.p.machines[1].input, ch.p.machines[1].output], g1: [ch.g.machines[0].input, ch.g.machines[0].output], g2: [ch.g.machines[1].input, ch.g.machines[1].output] },
        counters: { c1: [ch.p.counter.stack, ch.p.counter.money.amount, ch.p.counter.money.bills], c2: [ch.g.counter.stack, ch.g.counter.money.amount, ch.g.counter.money.bills] },
        // tables: [layout spot, dirty seats bitmask, tip $, tip bundles]
        tables: { p: ch.p.counter.tables.map((t) => [t.idx, t.seats.reduce((m, s, i) => m | (s.dirty ? 1 << i : 0), 0), t.tip.amount, t.tip.bills]),
                  g: ch.g.counter.tables.map((t) => [t.idx, t.seats.reduce((m, s, i) => m | (s.dirty ? 1 << i : 0), 0), t.tip.amount, t.tip.bills]) },
        carried: p.stack.map((i) => i.type), player: [Math.round(p.x * 100) / 100, Math.round(p.z * 100) / 100],
        boosts: { speed: this.boosts.speed },
        temps: this.workers.filter((w) => w.temp > 0).map((w) => [w.chain, Math.round(w.temp)]),
        adCd: Object.assign({}, this.adCd), stats: Object.assign({}, this.stats),
        playTime: Math.round(this.playTime), sessions: this.sessions, created: this.created,
        incomeEma: this.incomeEma, pendingReward: this.pendingLevel ? this.pendingLevel.reward : 0, pendingGems: this.pendingLevel ? this.pendingLevel.gems : 0,
        batch: this.batch.map((b) => [b.id, b.step]),
        hot: Object.assign({}, this.hot), priceLock: Object.assign({}, this.priceLock),
        effects: { magnet: Math.round(this.effects.magnet), hover: Math.round(this.effects.hover) }
      };
    }

    load(d) {
      const cfg = this.cfg, L = cfg.LAYOUT, ch = this.chains, num = (v, def) => (typeof v === 'number' && isFinite(v) ? v : def);
      this.isNewSave = false;
      this.money = num(d.money, 0) + num(d.pendingReward, 0);
      this.gems = Math.max(0, num(d.gems, cfg.GEM_START)) + Math.max(0, num(d.pendingGems, 0)); // an unclaimed level panel is given on load
      this.xp = num(d.xp, 0); this.level = Math.max(1, num(d.level, 1));
      for (const id in this.tracks) this.tracks[id] = Math.max(0, Math.min(num(d.tracks && d.tracks[id], 0), this.trackDefs[id].steps.length));
      this.paid = {}; if (d.paid) for (const id in d.paid) if (this.tracks[id] !== undefined) this.paid[id] = num(d.paid[id], 0);
      if (d.chef) for (const k in this.chef) this.chef[k] = Math.max(0, Math.min(num(d.chef[k], 0), cfg.CHEF_PRICES[k].length));
      if (d.guide) { this.guide.step = Math.min(num(d.guide.step, 0), TBS.Guide.STEPS.length); this.guide.done = !!d.guide.done; this.guide.flags = d.guide.flags || {}; }
      if (d.g2) { this.g2.active = !!d.g2.active; this.g2.step = num(d.g2.step, 0); this.g2.done = !!d.g2.done; this.g2.flags = d.g2.flags || {}; }
      this.wing2Open = !!d.wing2Open; this.wing2Pending = !!d.wing2Pending && !this.wing2Open;
      this.wing2OpenTime = this.wing2Open ? num(d.wing2OpenTime, 9999) : 0;
      ch.g.active = this.wing2Open;
      // rebuild bought things
      for (const id in this.trackDefs) {
        const def = this.trackDefs[id];
        if (def.table !== undefined && this.tracks[id] >= 1) (def.wing === 2 ? ch.g : ch.p).counter.addTable(def.pos, def.table);
      }
      for (const id in this.trackDefs) if (this.trackDefs[id].build && this.tracks[id] >= 1) this.applyBuild(id, false);
      ch.p.machines[1].built = this.tracks.machine2 >= 1; ch.g.machines[1].built = this.tracks.gmachine2 >= 1;
      ch.p.machines[0].level = this.tracks.m1up; ch.p.machines[1].level = this.tracks.m2up;
      ch.p.source.level = this.tracks.pad; ch.g.source.level = this.tracks.goo;
      ch.g.machines[0].level = this.tracks.g1up; ch.g.machines[1].level = this.tracks.g2up;
      ch.p.counter.hasCashier = this.tracks.cash1 >= 1; ch.g.counter.hasCashier = this.tracks.cash2 >= 1;
      ch.p.counter.level = this.tracks.c1up; ch.g.counter.level = this.tracks.c2up;
      for (const id in this.trackDefs) { // each table's own upgrade level
        const def = this.trackDefs[id];
        if (def.tableUp === undefined) continue;
        const tb = (def.wing === 2 ? ch.g : ch.p).counter.tables.find((x) => x.idx === def.tableUp);
        if (tb) tb.level = this.tracks[id];
      }
      // HOT upgrades (never more than the steps bought) + the fixed prices of the circles on the floor
      if (d.hot) for (const id in d.hot) if (this.tracks[id] !== undefined) { this.hot[id] = Math.max(0, Math.min(num(d.hot[id], 0), this.tracks[id])); this.applyHot(id); }
      if (d.priceLock) for (const id in d.priceLock) {
        const l = d.priceLock[id];
        if (this.tracks[id] !== undefined && l && num(l.step, -1) === this.tracks[id] && num(l.price, 0) > 0) this.priceLock[id] = { step: l.step, price: l.price };
      }
      if (d.effects) for (const k in this.effects) this.effects[k] = Math.max(0, num(d.effects[k], 0));
      if (d.tables) for (const id of ['p', 'g']) if (Array.isArray(d.tables[id])) for (const a of d.tables[id]) {
        const t = Array.isArray(a) && ch[id].counter.tables.find((x) => x.idx === a[0]);
        if (!t) continue;
        t.seats.forEach((s, i) => { s.dirty = !!(num(a[1], 0) & (1 << i)); });
        t.tip.amount = Math.max(0, num(a[2], 0)); t.tip.bills = Math.max(0, num(a[3], 0));
      }
      if (Array.isArray(d.batch)) this.batch = d.batch.filter((b) => Array.isArray(b) && this.tracks[b[0]] !== undefined).map((b) => ({ id: b[0], step: num(b[1], 0) }));
      if (d.piles) { ch.p.source.pile = num(d.piles.pad, 0); ch.g.source.pile = num(d.piles.goo, 0); }
      const mset = (m, a) => { if (a) { m.input = Math.min(num(a[0], 0), m.inputMax); m.output = num(a[1], 0); } };
      if (d.machines) { mset(ch.p.machines[0], d.machines.m1); mset(ch.p.machines[1], d.machines.m2); mset(ch.g.machines[0], d.machines.g1); mset(ch.g.machines[1], d.machines.g2); }
      const cset = (c, a) => { if (a) { c.stack = Math.min(num(a[0], 0), c.max()); c.money.amount = num(a[1], 0); c.money.bills = num(a[2], 0); } };
      if (d.counters) { cset(ch.p.counter, d.counters.c1); cset(ch.g.counter, d.counters.c2); }
      const cap = this.player.capacity(this);
      if (Array.isArray(d.carried)) for (const t of d.carried.slice(0, cap)) if (['tentacle', 'burger', 'goo', 'dish', 'plate'].indexOf(t) >= 0) this.player.stack.push({ id: this.nextId++, type: t });
      if (Array.isArray(d.player)) { this.player.x = num(d.player[0], this.player.x); this.player.z = num(d.player[1], this.player.z); }
      if (!this.wing2Open && this.player.x > L.DOOR.x - 0.5) { this.player.x = L.PLAYER_START.x; this.player.z = L.PLAYER_START.z; }
      if (d.boosts) this.boosts.speed = num(d.boosts.speed, 0);
      if (d.adCd) for (const k in this.adCd) this.adCd[k] = num(d.adCd[k], 0);
      if (d.stats) for (const k in this.stats) this.stats[k] = num(d.stats[k], 0);
      this.playTime = num(d.playTime, 0); this.sessions = num(d.sessions, 0) + 1; this.created = num(d.created, this.created);
      this.incomeEma = num(d.incomeEma, 0);
      // workers come back at their sources
      const lvMax = cfg.WORKER_UP_PRICES.speed.length, capMax = cfg.WORKER_UP_PRICES.cap.length, per = { p: 0, g: 0 };
      if (Array.isArray(d.workers)) for (const a of d.workers) {
        if (!Array.isArray(a)) continue;
        const c = a[0] === 'g' ? 'g' : 'p';
        if (per[c] >= cfg.WORKERS_PER_WING || (c === 'g' && !this.wing2Open)) continue;
        per[c]++;
        const s = ch[c].source.workerSpot, w = TBS.Workers.add(this, c, 0, s.x, s.z);
        w.sp = Math.max(0, Math.min(num(a[1], 0), lvMax)); w.cap = Math.max(0, Math.min(num(a[2], 0), capMax));
      }
      if (Array.isArray(d.temps)) for (const t of d.temps) { const c = t[0] === 'g' ? 'g' : 'p'; if (c === 'g' && !this.wing2Open) continue; const s = ch[c].source.workerSpot; TBS.Workers.add(this, c, Math.max(1, num(t[1], 1)), s.x, s.z); }
      // a few customers already waiting so the station is alive
      for (const id in ch) if (ch[id].active && ch[id].counter.built) for (let i = 0; i < 3; i++) TBS.Customers.spawn(this, id, { atSpot: true });
      if (this.wing2Pending) this.emit('wing2Ready', { auto: true, resumed: true });
    }
  }

  TBS.Game = Game;
})(window.TBS = window.TBS || {});

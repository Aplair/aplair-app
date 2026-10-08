/* Pacing bot: plays the REAL game code (js/core) like a player, so the pacing table measures the actual game.
   "normal" = a new player (small pauses, not perfect paths); "fast" = an efficient player. */
(function (TBS) {
  'use strict';

  // learnPickups: first pickups cost extra seconds (a new player walks through the circle once before stopping)
  // distract: chance after each action to look around for a moment
  // deskRatio: walks to a desk when its cheapest upgrade costs less than this x the cheapest floor circle left
  const PROFILES = {
    normal: { name: 'normal player', speed: 0.8, pause: [0.5, 1.2], startDelay: 5, newStepDelay: 1.8, panelTime: 2.0, learnPickups: 2, learnTime: 2.5, distract: [0.12, 1.5, 3.0], takeAds: false, deskRatio: 0.6, gemReserve: 6 },
    fast:   { name: 'fast player',   speed: 1.0, pause: [0.05, 0.15], startDelay: 1.0, newStepDelay: 0.2, panelTime: 0.8, learnPickups: 0, learnTime: 0, distract: [0, 0, 0], takeAds: false, deskRatio: 0.6, gemReserve: 6 },
    ads:    { name: 'normal + takes every ad', speed: 0.8, pause: [0.5, 1.2], startDelay: 5, newStepDelay: 1.8, panelTime: 2.0, learnPickups: 2, learnTime: 2.5, distract: [0.12, 1.5, 3.0], takeAds: true, adTime: 20, deskRatio: 0.6, gemReserve: 6 }
  };

  class Bot {
    constructor(game, profile) {
      this.g = game; this.p = profile;
      this.task = null; this.path = null; this.wait = profile.startDelay;
      this.stuckT = 0; this.lastDist = 1e9; this.taskT = 0;
      this.lastGuideStep = -1;
      this.rng = TBS.U.makeRng(4242);
    }

    // input for this frame: {x, z, mag} in world space
    step(dt) {
      const g = this.g;
      if (g.inputBlocked()) { this.task = null; return { x: 0, z: 0, mag: 0 }; }
      const gs = g.guide.done ? 100 + g.g2.step : g.guide.step;
      if (gs !== this.lastGuideStep) { if (this.lastGuideStep >= 0) this.wait = Math.max(this.wait, this.p.newStepDelay); this.lastGuideStep = gs; this.task = null; }
      if (this.wait > 0) { this.wait -= dt; return { x: 0, z: 0, mag: 0 }; }
      if (this.task && this.done(this.task, dt)) {
        const extra = this.task.extraWait || 0;
        this.task = null;
        this.wait = this.rng.range(this.p.pause[0], this.p.pause[1]) + extra;
        if (this.rng() < this.p.distract[0]) this.wait += this.rng.range(this.p.distract[1], this.p.distract[2]);
        return { x: 0, z: 0, mag: 0 };
      }
      if (!this.task) {
        this.task = this.decide(); this.path = null; this.stuckT = 0; this.taskT = 0; this.lastDist = 1e9;
        if (this.task && this.task.kind === 'pickup' && (this.learned || 0) < this.p.learnPickups) { this.learned = (this.learned || 0) + 1; this.wait = this.p.learnTime; }
      }
      if (!this.task) return { x: 0, z: 0, mag: 0 };
      this.taskT += dt;
      return this.move(dt);
    }

    move(dt) {
      const g = this.g, pl = g.player, t = this.task;
      const d = Math.hypot(t.x - pl.x, t.z - pl.z);
      const arrive = t.kind === 'pickup' || t.kind === 'price' || t.kind === 'desk' || t.kind === 'cashier' || t.kind === 'clean' || t.kind === 'offer' ? 0.12 : 0.25;
      if (d < arrive) {
        this.stuckT = 0;
        if ((t.kind === 'price' || t.kind === 'desk') && pl.latched === '*') return { x: 1, z: 0, mag: this.p.speed }; // just bought here: a step, then stop again
        return { x: 0, z: 0, mag: 0 };
      }
      if (!this.path || !this.path.length) {
        this.path = g.nav.findPath(pl.x, pl.z, t.x, t.z);
        const lp = this.path[this.path.length - 1]; // the grid may stop short of a spot close to furniture: walk the last bit straight
        if (!lp || Math.hypot(lp.x - t.x, lp.z - t.z) > 0.05) this.path.push({ x: t.x, z: t.z });
      }
      let pt = this.path[0];
      while (this.path.length > 1 && Math.hypot(pt.x - pl.x, pt.z - pl.z) < 0.3) { this.path.shift(); pt = this.path[0]; }
      const dx = pt.x - pl.x, dz = pt.z - pl.z, l = Math.hypot(dx, dz) || 1;
      // slow down near the final target so we stop inside circles like a person would
      const mag = this.path.length === 1 && d < 0.7 ? Math.max(0.25, d / 0.7) * this.p.speed : this.p.speed;
      if (d < this.lastDist - 0.02) { this.lastDist = d; this.stuckT = 0; } else this.stuckT += dt;
      if (this.stuckT > 2.5) { this.path = null; this.stuckT = 0; this.lastDist = 1e9; }
      if (this.taskT > 25) { this.task = null; }
      return { x: dx / l, z: dz / l, mag: mag };
    }

    done(t, dt) {
      const g = this.g, pl = g.player;
      const at = Math.hypot(t.x - pl.x, t.z - pl.z) < 0.35;
      switch (t.kind) {
        case 'pickup': {
          if (!at) return false;
          const st = t.ref, left = t.isSource ? st.pile : st.output;
          if (pl.stack.length >= pl.capacity(g)) return true;
          if (left <= 0) { t.emptyT = (t.emptyT || 0) + dt; return t.emptyT > 0.5; }
          return false;
        }
        case 'drop': return at || !pl.count(t.type);
        case 'money': return t.ref.amount <= 0 || this.taskT > 8; // stand there while the pile flies to you
        case 'price': {
          return (g.tracks[t.trackId] || 0) > t.step || (at && g.money <= 0.01) || !g.offers.find((o) => o.trackId === t.trackId);
        }
        case 'go': return at;
        case 'offer': { // a floor offer: stop on it, the panel opens -> take it with an ad (its time is added outside the game)
          const f = g.floorOffer;
          if (!f || f.id !== t.id) return true;
          if (!at || pl.latched !== 'offer:' + f.id) return false;
          if (TBS.FloorOffers.take(g, 'ad')) { this.pausedAdTime = (this.pausedAdTime || 0) + this.p.adTime; this.offersTaken = (this.offersTaken || 0) + 1; }
          t.extraWait = this.p.panelTime;
          return true;
        }
        case 'cashier': return !TBS.Guide.needsCashier(g, t.chain) || this.taskT > 12; // sell until the front alien has his food
        case 'clean': return !t.table.seats.some((s) => s.dirty) || this.taskT > 10 || pl.stack.length >= pl.capacity(g) || pl.stack.length > pl.count('plate');
        case 'desk': {
          if (!at || pl.latched !== t.zoneId) return false; // the panel opens after the 0.3 s stop
          // in the panel: buy what we came for (guide) or up to 2 good-value upgrades
          if (t.buy === 'carry') g.buyChef('carry');
          else if (t.buy === 'hire') g.hire(t.wing);
          else for (let i = 0; i < 2; i++) { const o = this.deskOptions(t.desk, t.wing)[0]; if (!o) break; o.act(); }
          t.extraWait = this.p.panelTime;
          return true;
        }
      }
      return true;
    }

    // what can be bought at a desk, cheapest first
    deskOptions(desk, wing) {
      const g = this.g, out = [];
      if (desk === 'chef') for (const k of ['carry', 'speed', 'profit']) out.push({ price: g.chefPrice(k), gems: true, act: () => g.buyChef(k) });
      else {
        out.push({ price: g.hirePrice(wing), act: () => g.hire(wing) });
        for (const w of TBS.Workers.hired(g, g.chainOfWing(wing))) for (const k of ['speed', 'cap']) {
          // gems if we have them; the ads profile also takes the "Watch ad" (3-minute timer) when short of gems
          const pr = g.workerUpPrice(w, k);
          if (pr !== null && g.gems < pr && this.p.takeAds && g.adReady('workerUp')) out.push({ price: 0, ad: true, act: () => { if (g.upgradeWorkerByAd(w, k)) this.pausedAdTime = (this.pausedAdTime || 0) + this.p.adTime; } });
          else out.push({ price: pr, gems: true, act: () => g.upgradeWorker(w, k) });
        }
      }
      return out.filter((o) => o.ad || (o.price !== null && o.price !== undefined && this.deskWorth(o.price, o.gems))).sort((a, b) => (a.gems || a.ad ? 0 : a.price) - (b.gems || b.ad ? 0 : b.price));
    }

    dist(p) { return Math.hypot(p.x - this.g.player.x, p.z - this.g.player.z); }
    // how badly a wing needs the chef: the longest wait in its line, minus a little for walking there
    urgency(id) {
      const c = this.g.chains[id].counter;
      let w = 0;
      for (const cu of c.line) if (cu && cu.got === 0) w = Math.max(w, cu.lineWait);
      return w - this.dist(c.drop) * 0.6;
    }

    cheapestFloor() { let c = Infinity; for (const o of this.g.offers) c = Math.min(c, o.price - o.paid); return c; }
    // desk upgrades (chef / workers) cost gems: worth it whenever we have the gems; hiring costs money
    deskWorth(price, gems) { return gems ? this.g.gems >= price : this.g.money >= price && price <= this.cheapestFloor() * this.p.deskRatio; }
    // the "normal or HOT" panel after paying an upgrade: HOT with an ad (ads profile), or with gems when we have plenty
    pickHot(gemsNeeded) {
      const g = this.g;
      if (this.p.takeAds && g.adReady('upgrade')) return 'ad';
      if (g.gems >= gemsNeeded + this.p.gemReserve) return 'gems';
      return null;
    }

    deskTask() {
      const g = this.g, L = g.cfg.LAYOUT, desks = [];
      for (const z of g.zones) if (z.type === 'terminal' && z.desk !== 'boost') desks.push(z);
      let best = null;
      for (const z of desks) {
        // a wing without any worker: hiring the first one is always worth it
        if (z.desk === 'hire' && TBS.Workers.hired(g, g.chainOfWing(z.wing)).length === 0) {
          const hp = g.hirePrice(z.wing);
          if (hp !== null && g.money >= hp) return { kind: 'desk', x: z.x, z: z.z, zoneId: z.id, desk: z.desk, wing: z.wing, buy: 'hire' };
        }
        const o = this.deskOptions(z.desk, z.wing)[0];
        const pr = o ? (o.gems || o.ad ? 0 : o.price) : 0;
        if (o && (!best || pr < best.price)) best = { price: pr, z: z };
      }
      if (!best) return null;
      return { kind: 'desk', x: best.z.x, z: best.z.z, zoneId: best.z.id, desk: best.z.desk, wing: best.z.wing };
    }

    zoneTask(z, kind) {
      if (kind === 'pickup') return { kind: 'pickup', x: z.x, z: z.z, ref: z.ref, isSource: z.kind === 'source' };
      return { kind: kind, x: z.x, z: z.z };
    }

    findZone(x, z, type) { return this.g.zones.find((zn) => zn.type === type && Math.abs(zn.x - x) < 0.01 && Math.abs(zn.z - z) < 0.01); }

    taskFromTarget(t) {
      const g = this.g;
      if (t.kind === 'pickup') { const zn = this.findZone(t.x, t.z, 'pickup'); if (zn) return this.zoneTask(zn, 'pickup'); }
      if (t.kind === 'drop') { const zn = this.findZone(t.x, t.z, 'drop'); return { kind: 'drop', x: t.x, z: t.z, type: zn ? (zn.kind === 'machine' ? zn.ref.inType : zn.kind === 'bin' ? 'plate' : g.chains[zn.chain].product) : 'none' }; }
      if (t.kind === 'money') { for (const id in g.chains) { const m = g.chains[id].counter.money; if (Math.abs(m.x - t.x) < 0.01) return { kind: 'money', x: m.x, z: m.z, ref: m }; } }
      if (t.kind === 'price') { const o = g.offers.find((x) => Math.abs(x.x - t.x) < 0.01 && Math.abs(x.z - t.z) < 0.01); if (o) return { kind: 'price', x: o.x, z: o.z, trackId: o.trackId, step: o.step }; }
      if (t.kind === 'cashier') return { kind: 'cashier', x: t.x, z: t.z, chain: t.chain };
      if (t.kind === 'clean') return { kind: 'clean', x: t.x, z: t.z, table: t.table, chain: t.chain };
      if (t.kind === 'desk') return { kind: 'desk', x: t.x, z: t.z, zoneId: t.desk === 'chef' ? 'desk:chef' : 'desk:hire' + t.wing, desk: t.desk, wing: t.wing, buy: t.buy };
      return { kind: 'go', x: t.x, z: t.z };
    }

    decide() {
      const g = this.g;
      if (!g.guide.done || (g.g2.active && !g.g2.done)) {
        // mini-guide in Wing 2: a player still buys what he can afford, but follows the arrow first
        const t = TBS.Guide.target(g);
        if (t) return this.taskFromTarget(t);
      }
      return this.decideFree();
    }

    decideFree() {
      const g = this.g, pl = g.player, cap = pl.capacity(g);
      // 0) a wing without any worker: hire one first
      for (const z of g.zones) {
        if (z.type !== 'terminal' || z.desk !== 'hire' || TBS.Workers.hired(g, g.chainOfWing(z.wing)).length) continue;
        const hp = g.hirePrice(z.wing);
        if (hp !== null && g.money >= hp) return { kind: 'desk', x: z.x, z: z.z, zoneId: z.id, desk: 'hire', wing: z.wing, buy: 'hire' };
      }
      // 0b) a floor offer close by (ads profile: it walks over and watches the ad)
      const fo = g.floorOffer;
      if (fo && this.p.takeAds && this.dist(fo) < 7 && fo.t > 4) return { kind: 'offer', x: fo.x, z: fo.z, id: fo.id };
      // 1) buy something we can afford (players like "more food" upgrades a bit more than the others)
      const afford = g.offers.filter((o) => g.money >= o.price - o.paid - 0.01);
      if (afford.length) {
        const wsum = afford.reduce((s, o) => s + (o.cat === 'prod' ? 2 : 1), 0);
        let r = this.rng() * wsum, pick = afford[0];
        for (const o of afford) { r -= o.cat === 'prod' ? 2 : 1; if (r <= 0) { pick = o; break; } }
        return { kind: 'price', x: pick.x, z: pick.z, trackId: pick.trackId, step: pick.step };
      }
      // 1b) a cheap desk upgrade while saving for the next circle
      const dt = this.deskTask();
      if (dt) return dt;
      const chains = Object.keys(g.chains).filter((id) => g.chains[id].active);
      // 2) deliver what we carry (dirty plates first: nothing else can be picked up while they are on the tray)
      if (pl.count('plate') > 0) {
        let best = null;
        for (const z of g.zones) if (z.type === 'drop' && z.kind === 'bin' && (!best || this.dist(z) < this.dist(best))) best = z;
        if (best) return { kind: 'drop', x: best.x, z: best.z, type: 'plate' };
      }
      for (const id of chains) { const c = g.chains[id]; if (pl.count(c.product) > 0 && c.counter.room() > 0) return { kind: 'drop', x: c.counter.drop.x, z: c.counter.drop.z, type: c.product }; }
      // food that can't go anywhere (its counter is full) while the tray is full or tables wait to be cleaned:
      // put it back on its machine through the return pad, like a player would
      for (const id of chains) {
        const c = g.chains[id];
        if (pl.count(c.product) === 0 || c.counter.room() > 0) continue;
        if (pl.stack.length < cap && !c.counter.dirtyTables().length) continue;
        const rz = g.zones.find((z) => z.type === 'return' && z.kind === 'machine' && z.chain === id);
        if (rz) return { kind: 'drop', x: rz.x, z: rz.z, type: c.product };
      }
      for (const id of chains) {
        const c = g.chains[id];
        if (pl.count(c.ingredient) > 0) {
          let m = null;
          for (const mc of c.machines) if (mc.built && mc.room() > 0 && (!m || mc.room() > m.room())) m = mc;
          if (m) return { kind: 'drop', x: m.inZone.x, z: m.inZone.z, type: c.ingredient };
        }
      }
      // 2a) money lying around that pays for the next circle: go get it
      {
        let cheap = 1e9, mp = null;
        for (const o of g.offers) cheap = Math.min(cheap, o.price - o.paid);
        for (const id of chains) {
          const c = g.chains[id].counter;
          if (c.money.amount > 0 && (!mp || c.money.amount > mp.amount)) mp = c.money;
          for (const t of c.tables) if (t.tip.amount > 0 && (!mp || t.tip.amount > mp.amount)) mp = t.tip;
        }
        if (mp && g.money < cheap && mp.amount + g.money >= cheap) return { kind: 'money', x: mp.x, z: mp.z, ref: mp };
      }
      // 2b) nobody sells: stand in the cashier spot (nearest wing first)
      const sell = chains.filter((id) => TBS.Guide.needsCashier(g, id)).sort((a, b) => this.urgency(b) - this.urgency(a));
      if (sell.length) { const cs = g.chains[sell[0]].counter.cashier; return { kind: 'cashier', x: cs.x, z: cs.z, chain: sell[0] }; }
      // 2c) a line is waiting at an empty counter: bring the food that is ready (nearest wing first)
      //     (nothing cooked yet: start by grabbing ingredients for its machines)
      const starving = chains.filter((id) => { const c = g.chains[id]; return TBS.Customers.waiting(c.counter) > 0 && c.counter.stack === 0; })
        .sort((a, b) => this.urgency(b) - this.urgency(a));
      for (const id of starving) {
        if (pl.stack.length >= cap) break;
        const c = g.chains[id];
        let out = null;
        for (const mc of c.machines) if (mc.built && mc.output > 0 && (!out || mc.output > out.output)) out = mc;
        if (out) return { kind: 'pickup', x: out.out.x, z: out.out.z, ref: out, isSource: false };
        const cooking = c.machines.some((m) => m.built && m.input >= 2), room = c.machines.some((m) => m.built && m.room() >= 2);
        const fed = g.workers.some((w) => w.chain === id && w.job && w.job.type === 'feed');
        if (!cooking && !fed && room && c.source.pile >= 2) return { kind: 'pickup', x: c.source.circle.x, z: c.source.circle.z, ref: c.source, isSource: true };
      }
      // 2d) dirty tables (when no worker is around, or they pile up more than the workers can handle)
      for (const id of chains) {
        const c = g.chains[id].counter, dirty = c.dirtyTables(), workers = g.workers.filter((w) => w.chain === id).length;
        if (dirty.length && pl.stack.length === 0 && (workers === 0 || dirty.length >= 3 + workers * 2)) {
          dirty.sort((a, b) => this.dist(a.work) - this.dist(b.work));
          return { kind: 'clean', x: dirty[0].work.x, z: dirty[0].work.z, table: dirty[0], chain: id };
        }
      }
      // 3) money worth collecting (sales pile or tips)
      let cheapest = 1e9;
      for (const o of g.offers) cheapest = Math.min(cheapest, o.price - o.paid);
      let mp = null;
      for (const id of chains) {
        const c = g.chains[id].counter;
        if (c.money.amount > 0 && (!mp || c.money.amount > mp.amount)) mp = c.money;
        for (const t of c.tables) if (t.tip.amount > 0 && (!mp || t.tip.amount > mp.amount)) mp = t.tip;
      }
      if (mp && (mp.amount + g.money >= cheapest || mp.amount >= Math.max(15, cheapest * 0.3))) return { kind: 'money', x: mp.x, z: mp.z, ref: mp };
      // 4) choose the chain that needs us most
      const order = chains.slice().sort((a, b) => (this.urgency(b) + this.need(b)) - (this.urgency(a) + this.need(a)));
      for (const id of order) {
        const c = g.chains[id];
        let out = null;
        for (const mc of c.machines) if (mc.built && mc.output > 0 && (!out || mc.output > out.output)) out = mc;
        const room = cap - pl.stack.length;
        if (out && out.output >= Math.min(room, 3)) return { kind: 'pickup', x: out.out.x, z: out.out.z, ref: out, isSource: false };
        const workers = g.workers.filter((w) => w.chain === id).length;
        let mroom = 0, mrate = 0;
        for (const mc of c.machines) if (mc.built) { mroom += mc.room(); mrate += mc.rate(); }
        const feedNeeded = workers === 0 || (mroom > 6 && c.source.pile >= 4);
        if (feedNeeded && c.source.pile >= 2 && mroom >= 2) return { kind: 'pickup', x: c.source.circle.x, z: c.source.circle.z, ref: c.source, isSource: true };
        if (out) return { kind: 'pickup', x: out.out.x, z: out.out.z, ref: out, isSource: false };
      }
      if (mp) return { kind: 'money', x: mp.x, z: mp.z, ref: mp };
      // nothing urgent: wait at the busiest machine output
      const c = g.chains[order[0]];
      const m = c.machines.find((mc) => mc.built);
      return { kind: 'pickup', x: m.out.x, z: m.out.z, ref: m, isSource: false };
    }

    need(id) {
      const c = this.g.chains[id];
      let out = 0;
      for (const m of c.machines) if (m.built) out += m.output;
      return TBS.Customers.waiting(c.counter) * 2 - c.counter.stack + out * 0.5 + (this.g.workers.some((w) => w.chain === id) ? 0 : 2);
    }
  }

  // ---------- pacing runner (used by sim/pacing.js in node and sim/pacing.html in a browser) ----------
  function runPacing(cfg, profileName, minutes, dt) {
    const prof = PROFILES[profileName];
    let wall = 1700000000000;
    const game = new TBS.Game(cfg, { seed: 12345, nowMs: () => wall });
    const bot = new Bot(game, prof);
    const res = { profile: prof.name, levels: {}, purchases: [], guideEnd: null, guideLevel: null, wing2: null, firstGreen: null, queue: [], earlyBanners: 0, panels: 0, ads: 0, incomeAtBuy: [], hot: 0, offers: 0, gemsIn: 0, gemsOut: 0 };
    let lastGems = game.gems;
    let t = 0;
    const end = minutes * 60;
    let sampleT = 0, qp = { n: 0, full: 0 }, qg = { n: 0, full: 0 }, minuteIdx = 0;
    const record = (evs) => {
      for (const e of evs) {
        if (e.type === 'levelup') { res.levels[e.data.level] = t; if (e.data.auto) res.earlyBanners++; }
        else if (e.type === 'purchase') {
          res.purchases.push({ t: t, track: e.data.trackId, step: e.data.step + 1, price: e.data.price });
          let next = 1e9; for (const o of TBS.Economy.visibleOffers(game)) next = Math.min(next, o.price - o.paid);
          if (next < 1e9) res.incomeAtBuy.push(next / Math.max(0.01, game.income()));
        }
        else if (e.type === 'deskBuy') {
          const d = e.data, name = d.desk === 'chef' ? 'chef-' + d.kind + d.level : d.kind === 'hire' ? 'hire' + d.wing : 'worker-' + d.kind + d.level;
          res.purchases.push({ t: t, track: name, step: '', price: d.price, desk: true });
        }
        else if (e.type === 'guideDone') { res.guideEnd = t; res.guideLevel = game.level; }
        else if (e.type === 'wing2Ready') { res.wing2Ready = t; res.wing2Level = game.level; }
        else if (e.type === 'wing2Open') res.wing2 = t;
        else if (e.type === 'drop' && e.data.who === 'player' && e.data.kind === 'counter' && e.data.counter.chain === 'g' && res.firstGreen === null) res.firstGreen = t - (res.wing2 || t);
      }
    };
    while (t < end) {
      const input = bot.step(dt);
      game.update(dt, input);
      game.tickPlayTime(dt);
      t += dt; wall += dt * 1000;
      record(game.drainEvents());
      if (game.gems !== lastGems) { if (game.gems > lastGems) res.gemsIn += game.gems - lastGems; else res.gemsOut += lastGems - game.gems; lastGems = game.gems; }
      if (bot.pausedAdTime) { // an ad (offer / worker upgrade): the game is paused while it plays
        const extra = bot.pausedAdTime; bot.pausedAdTime = 0; res.ads++;
        t += extra; wall += extra * 1000; game.tickPlayTime(extra);
      }
      if (game.pendingChoice) { // just paid an upgrade: "normal or HOT" panel (a moment to read; an ad adds its time)
        const how = bot.pickHot(TBS.Economy.hotGems(game.cfg, game.pendingChoice.step));
        let extra = prof.panelTime;
        if (how) { game.chooseHot(how); res.hot++; if (how === 'ad') { extra += prof.adTime; res.ads++; } } else game.keepNormal();
        t += extra; wall += extra * 1000; game.tickPlayTime(extra);
        record(game.drainEvents());
      }
      if (game.pendingLevel) { // paused level-up panel: a person needs a moment to press a button
        res.panels++;
        let extra = prof.panelTime, mult = 1;
        if (prof.takeAds && game.adReady('levelup')) { mult = game.cfg.LEVELUP_AD_MULTIPLIER; game.startAdCooldown('levelup'); extra += prof.adTime; res.ads++; }
        game.claimLevel(mult);
        t += extra; wall += extra * 1000; game.tickPlayTime(extra);
        record(game.drainEvents());
      }
      if (game.wing2Pending && !game.revealing()) { // the "new wing" panel: a moment to read and press the button
        const extra = res.wing2Ready === t ? prof.panelTime : 0;
        t += extra; wall += extra * 1000; game.tickPlayTime(extra);
        game.openWing2();
        record(game.drainEvents());
      }
      sampleT += dt;
      if (sampleT >= 1) {
        sampleT -= 1;
        for (const [id, acc] of [['p', qp], ['g', qg]]) {
          const ch = game.chains[id];
          if (!ch.active) continue;
          acc.n++;
          if (TBS.Customers.waiting(ch.counter) >= Math.min(game.cfg.QUEUE_BASE, ch.counter.lineCap())) acc.full++; // the line at the counter is full
        }
      }
      if (t >= (minuteIdx + 1) * 60) {
        res.queue.push({ minute: minuteIdx + 1, p: qp.n ? Math.round(100 * qp.full / qp.n) : null, g: qg.n ? Math.round(100 * qg.full / qg.n) : null, level: game.level, money: Math.round(game.money), income: Math.round(game.income() * 60), gems: game.gems, buys: res.purchases.length });
        qp = { n: 0, full: 0 }; qg = { n: 0, full: 0 }; minuteIdx++;
      }
    }
    res.finalLevel = game.level; res.offers = bot.offersTaken || 0; res.chef = Object.assign({}, game.chef);
    res.left_upgrades = Object.keys(game.trackDefs).reduce((n, id) => n + game.trackDefs[id].steps.length - game.tracks[id], 0);
    res.served = game.stats.served; res.left = game.stats.left; res.soldP = game.stats.soldP; res.soldG = game.stats.soldG;
    res.workerIdle = game.workers.map((w) => ({ chain: w.chain, idle: Math.round(w.idleT), busy: Math.round(w.busyT) }));
    return res;
  }

  function fmt(s) { if (s === null || s === undefined) return '-'; return TBS.U.fmtTime(s); }

  function report(cfg, minutes, dt) {
    const runs = ['normal', 'fast', 'ads'].map((p) => runPacing(cfg, p, minutes, dt));
    const lines = [];
    lines.push('PACING SIMULATION  (' + minutes + ' minutes per bot, real game code, game time step ' + (1 / dt).toFixed(0) + ' per second)');
    lines.push('');
    lines.push('Level reached at minute:second');
    lines.push('Level | ' + runs.map((r) => r.profile.padEnd(26)).join(' | '));
    for (let l = 2; l <= 99; l++) if (runs.some((r) => r.levels[l] !== undefined)) lines.push(String(l).padStart(5) + ' | ' + runs.map((r) => fmt(r.levels[l]).padEnd(26)).join(' | '));
    lines.push('');
    for (const r of runs) {
      const gaps = [];
      const first10 = r.purchases.filter((p) => p.t <= 600);
      for (let i = 1; i < first10.length; i++) gaps.push(first10[i].t - first10[i - 1].t);
      gaps.sort((a, b) => a - b);
      const avg = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
      const ratio = r.incomeAtBuy.length ? r.incomeAtBuy.reduce((a, b) => a + b, 0) / r.incomeAtBuy.length : 0;
      lines.push('[' + r.profile + ']');
      lines.push('  guide ends: ' + fmt(r.guideEnd) + ' at level ' + r.guideLevel + '   |   Wing 2 opens: ' + fmt(r.wing2) + (r.wing2Level ? ' at level ' + r.wing2Level : '') + '   |   first blue dish delivered ' + (r.firstGreen === null ? '-' : Math.round(r.firstGreen) + ' s') + ' after opening');
      lines.push('  purchases in first 10 min: ' + first10.length + ' (desk ' + first10.filter((p) => p.desk).length + ')   gap between purchases: avg ' + Math.round(avg) + ' s, median ' + Math.round(gaps[gaps.length >> 1] || 0) + ' s, longest ' + Math.round(gaps[gaps.length - 1] || 0) + ' s');
      lines.push('  next circle costs on average ' + (ratio / 60).toFixed(2) + ' minutes of income at the moment of each purchase');
      lines.push('  level-ups without pause (first 5 min): ' + r.earlyBanners + '   paused level-up panels: ' + r.panels + (r.ads ? '   Claim x3 ads watched: ' + r.ads : ''));
      lines.push('  aliens served: ' + r.served + '   aliens who gave up and left: ' + r.left + ' (' + (r.served + r.left ? Math.round(100 * r.left / (r.served + r.left)) : 0) + '%)   food sold purple / blue: ' + r.soldP + ' / ' + r.soldG);
      lines.push('  line full % per minute (purple / blue): ' + r.queue.map((q) => q.minute + ':' + q.p + (q.g !== null ? '/' + q.g : '')).join('  '));
      lines.push('  income per minute at each minute: ' + r.queue.map((q) => q.minute + ':$' + q.income).join('  '));
      lines.push('  level / gems / money / things bought, every 5 minutes: ' + r.queue.filter((q) => q.minute % 5 === 0).map((q) => q.minute + 'm: L' + q.level + ' ' + q.gems + 'g $' + q.money + ' #' + q.buys).join('  |  '));
      lines.push('  gems earned ' + r.gemsIn + ', spent ' + r.gemsOut + '   HOT upgrades ' + r.hot + '   offers taken ' + r.offers + '   chef speed/carry/profit ' + r.chef.speed + '/' + r.chef.carry + '/' + r.chef.profit + '   floor steps still to buy ' + r.left_upgrades + '   final level ' + r.finalLevel);
      lines.push('  workers busy/idle seconds: ' + r.workerIdle.map((w) => w.chain + ' ' + w.busy + '/' + w.idle).join(', '));
      lines.push('  buy log: ' + r.purchases.map((p) => fmt(p.t) + ' ' + p.track + p.step + ' $' + p.price).join(', '));
      lines.push('');
    }
    return { text: lines.join('\n'), runs: runs };
  }

  TBS.Bot = Bot;
  TBS.Pacing = { PROFILES: PROFILES, run: runPacing, report: report };
})(window.TBS = window.TBS || {});

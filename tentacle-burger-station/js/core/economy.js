/* Floor build circles (STATION things only: tables, machines, cashiers, machine / pad / tank / counter / table upgrades), level progress,
   and which build circles are on the floor. After the guide only BUILD_CIRCLES_AT_ONCE circles show; the next ones
   appear when all of them are bought. Chef Desk and Hire Desk upgrades live in game.js (no level progress). */
(function (TBS) {
  'use strict';

  const Eco = TBS.Economy = {};

  // icon = what the floor circle draws: table, machine, tank, up (upgrade arrow)
  // the upgrade circle of a table sits right next to it, on its RIGHT on screen (+x, a bit back), just outside its cleaning ring:
  // front-right is where you stand to clean, front-left is the tip pile, and straight behind it the table would hide it
  // If that spot touches something (a neighbour table, its tip / cleaning spot, a wall, the aliens' line, another circle),
  // the circle walks around the table to the nearest free spot (same distance first, then a bit farther).
  Eco.tableFoot = (cfg, s) => ({ 1: 0.72, 2: 0.75, 4: 0.82, 5: 1.02 }[s] || 0.8) + cfg.STOOL_REACH; // seat ring + stool = how far a table reaches
  Eco.tableSpots = function (pos) { // tip pile + cleaning spot of a table (same numbers as Counter.addTable)
    const r = (TBS.TABLE_TOP_R && TBS.TABLE_TOP_R[pos.s]) || 0.5, d = r + 0.85;
    return [{ x: pos.x - d * 0.75, z: pos.z + d * 0.75 }, { x: pos.x + d * 0.62, z: pos.z + d * 0.62 }];
  };
  // how much a table hides a floor circle from the camera (> 0 = hidden): the camera looks from +x+z, so a circle
  // "behind" a table (smaller x+z) and close to it sideways is covered by the table and its "Lv" label
  Eco.hiddenBy = function (cfg, c, t, R) {
    const p = cfg.CAM_PITCH_DEG * Math.PI / 180, sx = (q) => (q.x - q.z) / Math.SQRT2, sy = (q) => (q.x + q.z) / Math.SQRT2 * Math.sin(p);
    const side = (Eco.tableFoot(cfg, t.s) * 0.8 + R * 0.6) - Math.abs(sx(c) - sx(t));
    const behind = sy(t) - sy(c), reach = cfg.TABLE_HIDE_H * Math.cos(p) + R * Math.sin(p);
    return behind > 0 && behind < reach ? side : -1;
  };
  Eco.tableUpPos = function (cfg, pos, W, fixed) {
    const r = (TBS.TABLE_TOP_R && TBS.TABLE_TOP_R[pos.s]) || 0.5, k = (r + cfg.CLEAN_RING + 0.55) / Math.SQRT2;
    const pref = { x: k * 1.2, z: -k * 0.8 }, dist0 = Math.hypot(pref.x, pref.z), a0 = Math.atan2(pref.z, pref.x);
    if (!W) return { x: pos.x + pref.x, z: pos.z + pref.z };
    const R = cfg.LAYOUT.PRICE_CIRCLE_R, gap = cfg.CIRCLE_GAP, ST = cfg.LAYOUT.STRIP, D = cfg.LAYOUT.DEPTH;
    const clearOf = (x, z) => {
      let worst = 1e9;
      const room = (v) => { worst = Math.min(worst, v); };
      // inside the hall, away from the walls, and not in the empty strip by the Wing 2 door
      room(x - (W.x0 + 0.5 + R)); room(W.x0 + cfg.LAYOUT.HALL_W - 0.5 - R - x); room(z - (ST + 0.4 + R)); room(D - 0.4 - R - z);
      // not on the aliens' line (straight from the counter to the gate)
      if (z > ST) room(Math.abs(x - W.service.x) - (cfg.LINE_HALF_W + R));
      for (const t of W.tables) {
        room(-Eco.hiddenBy(cfg, { x: x, z: z }, t, R)); // not hidden behind a table on screen
        if (t === pos) { for (const s of Eco.tableSpots(t)) room(Math.hypot(x - s.x, z - s.z) - (R + 0.45)); continue; }
        room(Math.hypot(x - t.x, z - t.z) - (Eco.tableFoot(cfg, t.s) + R + gap));
        for (const s of Eco.tableSpots(t)) room(Math.hypot(x - s.x, z - s.z) - (R + 0.45));
      }
      for (const c of fixed) room(Math.hypot(x - c.x, z - c.z) - (R + (c.r || R) + gap));
      return worst;
    };
    let best = null, bestV = -1e9;
    for (const dk of [0, 0.35, 0.7]) {
      for (let i = 0; i < 24; i++) { // same side first, then turning both ways
        const a = a0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 12), dd = dist0 + dk;
        const x = pos.x + Math.cos(a) * dd, z = pos.z + Math.sin(a) * dd, v = clearOf(x, z);
        if (v >= 0) return { x: x, z: z };
        if (v > bestV) { bestV = v; best = { x: x, z: z }; }
      }
    }
    return best; // nothing fully free: the least crowded spot
  };

  Eco.buildTracks = function (cfg) {
    const P = cfg.TRACK_PRICES, L = cfg.LAYOUT, W1 = L.W1, W2 = L.W2, NEED = cfg.WING2_TABLES_NEEDED;
    const steps = (prices) => prices.map((p) => ({ price: p }));
    // upgrades: every step costs money (its list price is the lowest it can be; see Eco.priceOf); a "HOT" version comes after paying
    const upSteps = (prices, levels) => { const out = []; for (let i = 0; i < levels; i++) out.push({ price: prices[Math.min(i, prices.length - 1)] }); return out; };
    const out = {};
    // building the basics: every wing starts EMPTY (pad / tank, machine 1, counter, bin, Chef Desk, Hire Desk, Boost Terminal)
    const BP = cfg.BUILD_PRICES;
    [[1, W1, 'p', 'Pad', 'm1'], [2, W2, 'g', 'Tank', 'g1']].forEach(([wing, W, ch, srcName, m1]) => {
      const i = wing - 1, req = wing === 2 ? (g) => g.wing2Open : null, src = W[wing === 2 ? 'goo' : 'pad'];
      const ctrPos = { x: (W.counter.x0 + W.counter.x1) / 2, z: W.cashier.z };
      const mk = (id, label, icon, pos, price, needs) => { out[id] = { label: label, icon: icon, kind: 'unlock', build: true, wing: wing, chain: ch, pos: pos, steps: [{ price: price }], requires: (g) => (!req || req(g)) && (!needs || g.tracks[needs] >= 1) }; };
      mk('b_src' + wing, srcName, 'tank', src.circle, BP.src[i]);
      mk('b_m' + wing, 'Machine', 'machine', W[m1].unlock, BP.mach[i], 'b_src' + wing);
      mk('b_ctr' + wing, 'Counter', 'counter', ctrPos, BP.ctr[i], 'b_m' + wing);
      mk('b_bin' + wing, 'Trash bin', 'bin', W.bin.drop, BP.bin[i], 'b_ctr' + wing);
      mk('b_chef' + wing, 'Chef desk', 'chef', W.chefDesk.circle, BP.chef[i], 'b_ctr' + wing);
      mk('b_hire' + wing, 'Hire desk', 'worker', W.hireDesk.circle, BP.hire[i], 'b_ctr' + wing);
      mk('b_term' + wing, 'Boost', 'speed', W.terminal.circle, BP.term[i], 'b_ctr' + wing);
    });
    // every table is its own circle, so two tables can be on the floor at the same time; and every table has its OWN upgrades
    const tableLv = cfg.TABLE_LEVELS.length - 1;
    // circles that already have a fixed spot in the hall (a table upgrade circle must keep clear of them)
    const fixedOf = (W) => {
      const f = Object.keys(W.circles).map((k) => W.circles[k]);
      f.push(W.terminal.circle, W.bin.drop, { x: W.money.x, z: W.money.z, r: 0.9 });
      return f;
    };
    const fixed1 = fixedOf(W1), fixed2 = fixedOf(W2);
    const upPos = (W, fixed, i) => { const p = Eco.tableUpPos(cfg, W.tables[i], W, fixed); fixed.push(p); return p; };
    P.tables.forEach((p, i) => {
      out['t1_' + i] = { label: 'Table', icon: 'table', kind: 'unlock', wing: 1, chain: 'p', table: i, pos: W1.tables[i], steps: [{ price: p }], requires: (g) => g.tracks.b_ctr1 >= 1 };
      out['tu1_' + i] = { label: 'Table', icon: 'up', kind: 'upgrade', wing: 1, chain: 'p', tableUp: i, pos: upPos(W1, fixed1, i), steps: upSteps(P.tableUp1, tableLv), requires: (g) => g.tracks['t1_' + i] >= 1 };
    });
    P.tables2.forEach((p, i) => {
      out['t2_' + i] = { label: 'Table', icon: 'table', kind: 'unlock', wing: 2, chain: 'g', table: i, pos: W2.tables[i], steps: [{ price: p }], requires: (g) => g.wing2Open && g.tracks.b_ctr2 >= 1 };
      out['tu2_' + i] = { label: 'Table', icon: 'up', kind: 'upgrade', wing: 2, chain: 'g', tableUp: i, pos: upPos(W2, fixed2, i), steps: upSteps(P.tableUp2, tableLv), requires: (g) => g.wing2Open && g.tracks['t2_' + i] >= 1 };
    });
    Object.assign(out, {
      machine2:  { label: 'Machine', icon: 'machine', kind: 'unlock',  wing: 1, chain: 'p', pos: W1.m2.unlock, steps: steps(P.machine2), requires: (g) => g.tracks.b_m1 >= 1 },
      m1up:      { label: 'Machine', icon: 'up',      kind: 'upgrade', wing: 1, chain: 'p', pos: W1.circles.m1up, steps: upSteps(P.m1up, P.m1up.length), requires: (g) => g.tracks.b_m1 >= 1 },
      m2up:      { label: 'Machine', icon: 'up',      kind: 'upgrade', wing: 1, chain: 'p', pos: W1.circles.m2up, steps: upSteps(P.m2up, P.m2up.length), requires: (g) => g.tracks.machine2 >= 1 },
      pad:       { label: 'Faster',  icon: 'tank',    kind: 'upgrade', wing: 1, chain: 'p', pos: W1.circles.pad, steps: upSteps(P.pad, P.pad.length), requires: (g) => g.tracks.b_src1 >= 1 },
      goo:       { label: 'Faster',  icon: 'tank',    kind: 'upgrade', wing: 2, chain: 'g', pos: W2.circles.goo, steps: upSteps(P.goo, P.goo.length), requires: (g) => g.wing2Open && g.tracks.b_src2 >= 1 },
      gmachine2: { label: 'Machine', icon: 'machine', kind: 'unlock',  wing: 2, chain: 'g', pos: W2.g2.unlock, steps: steps(P.gmachine2), requires: (g) => g.wing2Open && g.tracks.b_m2 >= 1 },
      g1up:      { label: 'Machine', icon: 'up',      kind: 'upgrade', wing: 2, chain: 'g', pos: W2.circles.g1up, steps: upSteps(P.g1up, P.g1up.length), requires: (g) => g.wing2Open && g.tracks.b_m2 >= 1 },
      g2up:      { label: 'Machine', icon: 'up',      kind: 'upgrade', wing: 2, chain: 'g', pos: W2.circles.g2up, steps: upSteps(P.g2up, P.g2up.length), requires: (g) => g.tracks.gmachine2 >= 1 },
      cash1:     { label: 'Cashier', icon: 'cashier', kind: 'unlock',  wing: 1, chain: 'p', pos: W1.circles.cash, steps: steps(P.cash1), requires: (g) => g.tracks.b_ctr1 >= 1 },
      c1up:      { label: 'Storage', icon: 'counter', kind: 'upgrade', wing: 1, chain: 'p', pos: W1.circles.cup, steps: upSteps(P.c1up, P.c1up.length), requires: (g) => g.tracks.b_ctr1 >= 1 },
      cash2:     { label: 'Cashier', icon: 'cashier', kind: 'unlock',  wing: 2, chain: 'g', pos: W2.circles.cash, steps: steps(P.cash2), requires: (g) => g.wing2Open && g.tracks.b_ctr2 >= 1 },
      c2up:      { label: 'Storage', icon: 'counter', kind: 'upgrade', wing: 2, chain: 'g', pos: W2.circles.cup, steps: upSteps(P.c2up, P.c2up.length), requires: (g) => g.wing2Open && g.tracks.b_ctr2 >= 1 }
    });
    // Wing 2: machine / tank / counter steps wait for enough tables (production never runs far ahead of seats)
    for (const id in NEED) if (out[id]) out[id].steps.forEach((st, i) => { const n = NEED[id][Math.min(i, NEED[id].length - 1)]; st.tables = n; st.requires = (g) => g.chains.g.counter.tables.length >= n; });
    return out;
  };

  Eco.totalSteps = function (tracks) {
    let n = 0;
    for (const id in tracks) n += tracks[id].steps.length;
    return n;
  };

  // Total level progress needed to reach a level.
  Eco.xpForLevel = function (cfg, level) {
    const t = cfg.LEVEL_XP;
    if (level < t.length) return t[level];
    let last = t[t.length - 1], step = t[t.length - 1] - t[t.length - 2];
    for (let l = t.length; l <= level; l++) { step *= cfg.LEVEL_XP_GROWTH; last += step; }
    return Math.round(last);
  };

  // Money price of a step. Builds: the list price. Upgrades: about UPGRADE_INCOME_SECONDS of your current income
  // (+UPGRADE_STEP_EXTRA per later step), never below the list price - so the richer you are, the more an upgrade costs.
  // The price is FIXED the moment the circle appears on the floor (Eco.lockPrice), so it never runs away while you save up.
  Eco.priceOf = function (game, id, n) {
    const tr = game.trackDefs[id], st = tr.steps[n], lock = game.priceLock && game.priceLock[id];
    if (lock && lock.step === n) return lock.price;
    if (tr.kind !== 'upgrade') return st.price;
    const cfg = game.cfg, byIncome = game.income() * cfg.UPGRADE_INCOME_SECONDS * (1 + cfg.UPGRADE_STEP_EXTRA * n);
    return Math.max(st.price, TBS.U.niceRound(byIncome));
  };
  Eco.lockPrice = function (game, id) {
    const n = game.tracks[id] || 0, lock = game.priceLock[id];
    if (game.trackDefs[id].kind !== 'upgrade' || (lock && lock.step === n)) return;
    game.priceLock[id] = { step: n, price: Eco.priceOf(game, id, n) };
  };
  // gems for the "HOT" version of an upgrade step (the price goes up with the step)
  Eco.hotGems = function (cfg, step) { const g = cfg.GEM_UPGRADE_PRICES; return g[Math.min(step, g.length - 1)]; };

  // Next buyable step of a track, or null.
  Eco.nextStep = function (game, id) {
    const tr = game.trackDefs[id], n = game.tracks[id] || 0;
    if (!tr || n >= tr.steps.length) return null;
    if (tr.requires && !tr.requires(game)) return null;
    const st = tr.steps[n];
    if (st.requires && !st.requires(game)) return null;
    const pos = st.pos || tr.pos;
    return { trackId: id, step: n, price: Eco.priceOf(game, id, n), gems: 0, paid: game.paid[id] || 0, x: pos.x, z: pos.z, label: tr.label, icon: tr.icon, kind: tr.kind, wing: tr.wing, chain: st.chain || tr.chain || null, toLevel: n + 2, maxLevel: tr.steps.length + 1 }; // upgrades: Lv 1 -> Lv toLevel
  };

  // What the two cards of the "pick your upgrade" panel say (normal step vs HOT), as short lines.
  Eco.cards = function (game, id, step) {
    const cfg = game.cfg, tr = game.trackDefs[id], PR = cfg.PREMIUM, pct = (a, b) => Math.round((a / b - 1) * 100);
    const ch = game.chains[tr.chain];
    let normal = [], hot = [];
    if (tr.tableUp !== undefined) {
      const T = cfg.TABLE_LEVELS, a = T[Math.min(step, T.length - 1)], b = T[Math.min(step + 1, T.length - 1)];
      const tip = Math.round((b.tip - a.tip) * 100), eat = (a.eat - b.eat);
      normal = ['Tips +' + tip + '%', 'Eat ' + eat.toFixed(1) + ' s faster'];
      hot = ['Tips +' + (tip + Math.round(PR.table.tip * 100)) + '%', 'Eat ' + (eat + PR.table.eat).toFixed(1) + ' s faster'];
    } else if (/^(m|g)[12]up$/.test(id)) {
      const M = cfg.MACHINE_LEVELS, a = M[Math.min(step, M.length - 1)], b = M[Math.min(step + 1, M.length - 1)];
      const sp = pct(a.cook, b.cook), hold = b.output - a.output;
      normal = ['Speed +' + sp + '%', 'Holds +' + hold];
      hot = ['Speed +' + pct(a.cook, b.cook / (1 + PR.machine.speed)) + '%', 'Holds +' + (hold + PR.machine.hold)];
    } else if (id === 'pad' || id === 'goo') {
      const I = ch.source.intervals, Pl = ch.source.piles, a = Math.min(step, I.length - 1), b = Math.min(step + 1, I.length - 1);
      normal = ['Speed +' + pct(I[a], I[b]) + '%', 'Holds +' + (Pl[b] - Pl[a])];
      hot = ['Speed +' + pct(I[a], I[b] / (1 + PR.source.speed)) + '%', 'Holds +' + (Pl[b] - Pl[a] + PR.source.pile)];
    } else {
      const S = cfg.COUNTER_STORAGE, d = S[Math.min(step + 1, S.length - 1)] - S[Math.min(step, S.length - 1)];
      normal = ['Holds +' + d + ' food']; hot = ['Holds +' + (d + PR.counter.store) + ' food'];
    }
    return { normal: normal, hot: hot, gems: Eco.hotGems(cfg, step), xp: cfg.XP_PER_BUILD, hotXp: cfg.XP_PER_BUILD + cfg.PREMIUM_XP };
  };

  // EACH WING keeps its own batch of circles. A batch stays until its circles are bought, then the wing gets its next cheapest ones.
  Eco.updateBatch = function (game) {
    const cfg = game.cfg, per = cfg.BUILD_CIRCLES_AT_ONCE;
    let batch = (game.batch || []).filter((b) => (game.tracks[b.id] || 0) <= b.step && Eco.nextStep(game, b.id));
    for (const wing of game.wing2Open ? [1, 2] : [1]) {
      const mine = batch.filter((b) => game.trackDefs[b.id].wing === wing);
      if (mine.length) continue; // circles still waiting
      batch = batch.filter((b) => game.trackDefs[b.id].wing !== wing);
      const all = [];
      for (const id in game.trackDefs) {
        if (game.trackDefs[id].wing !== wing) continue;
        const o = Eco.nextStep(game, id);
        if (o) all.push(o);
      }
      let pick = all;
      // an empty wing: first its tank / pad, machine and counter (one after another), then tables
      const core = all.filter((o) => /^b_(src|m|ctr)\d$/.test(o.trackId));
      if (core.length) pick = core;
      else if (wing === 2 && game.chains.g.counter.tables.length < cfg.WING2_TABLES_FIRST) pick = all.filter((o) => game.trackDefs[o.trackId].table !== undefined || o.trackId === 'b_bin2' || o.trackId === 'b_hire2'); // tables (+ the bin to clean them, the desk to hire a helper)
      const tablesPhase = wing === 2 && !core.length && game.chains.g.counter.tables.length < cfg.WING2_TABLES_FIRST;
      // a table first, and the bin right next to it (tables can't be cleaned without it); then tables + the hire desk
      const isT = (o) => (game.trackDefs[o.trackId].table !== undefined ? 0 : o.trackId === 'b_bin2' ? 0.5 : 1);
      // cheapest first (in the new wing's tables phase: a table always comes first, the bin / hire desk only next to it)
      const money = pick.slice().sort((a, b) => (tablesPhase ? isT(a) - isT(b) : 0) || (a.price - a.paid) - (b.price - b.paid));
      const chosen = [];
      if (tablesPhase && !game.built('b_bin2')) { // the new wing: one table + the bin to clean it, side by side
        const t = money.find((o) => isT(o) === 0), b = money.find((o) => o.trackId === 'b_bin2');
        for (const o of [t, b]) if (o) chosen.push(o);
      } else for (const o of money) { if (chosen.length >= per) break; chosen.push(o); }
      for (const o of chosen) Eco.lockPrice(game, o.trackId); // its price is fixed now (it is on the floor)
      batch = batch.concat(chosen.map((o) => ({ id: o.trackId, step: o.step })));
    }
    game.batch = batch;
  };

  // Which build circles are on the floor right now.
  Eco.visibleOffers = function (game) {
    const guideId = TBS.Guide.purchaseTrack(game);
    if (!game.guide.done) {
      if (!guideId) return [];
      const o = Eco.nextStep(game, guideId);
      return o ? [o] : [];
    }
    Eco.updateBatch(game);
    const out = [];
    for (const b of game.batch) {
      Eco.lockPrice(game, b.id); // (circles from a loaded save get their price fixed here)
      const o = Eco.nextStep(game, b.id);
      if (o && o.step === b.step) out.push(o);
    }
    return out;
  };
})(window.TBS = window.TBS || {});

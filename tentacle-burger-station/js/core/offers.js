/* Floor offers: one at a time, a picture on the floor near the chef (magnet, hover board, cash case, helper, gems).
   It stays OFFER_LIFE seconds (its ring empties). Walking onto it opens a paused panel: gems / "Watch ad" / Close
   (gem offers: ad only). The next one comes OFFER_GAP s after the last one ended, or OFFER_GAP_AFTER_AD s after an ad.
   Offers start only after the guide. (STUDIO-RULES section 10, owner decision Oct 7, 2026.) */
(function (TBS) {
  'use strict';

  const O = TBS.FloorOffers = {};
  O.isGem = (type) => type.indexOf('gems') === 0;

  O.update = function (game, dt) {
    if (!game.guide.done || game.revealing()) return;
    const f = game.floorOffer, cfg = game.cfg;
    if (f) {
      f.t -= dt;
      if (f.t <= 0) { // gone: the next one in a minute
        game.floorOffer = null;
        game.offerT = cfg.OFFER_GAP;
        game.emit('offerGone', { id: f.id });
        game.rebuildZones();
      }
      return;
    }
    game.offerT -= dt;
    if (game.offerT <= 0) O.spawn(game);
  };

  // which offer comes next (never the same one twice in a row)
  O.pickType = function (game) {
    const W = game.cfg.OFFER_WEIGHTS;
    let total = 0;
    for (const k in W) if (k !== game.lastOfferType) total += W[k];
    let r = game.rng() * total;
    for (const k in W) { if (k === game.lastOfferType) continue; r -= W[k]; if (r <= 0) return k; }
    return 'magnet';
  };

  O.amount = function (game, type) {
    const cfg = game.cfg;
    if (type === 'cash') return TBS.U.niceRound(game.income() * cfg.OFFER_CASH_INCOME_SECONDS);
    if (O.isGem(type)) return cfg.OFFER_GEM_AMOUNTS[type];
    if (type === 'magnet') return cfg.MAGNET_SECONDS;
    if (type === 'hover') return cfg.HOVER_SECONDS;
    return cfg.OFFER_WORKER_SECONDS;
  };
  O.price = (game, type) => (O.isGem(type) ? null : game.cfg.OFFER_GEMS[type]); // gem offers: ad only

  // a free spot near the chef: inside his wing's hall, not on a table / tip / circle / wall / the aliens' line
  O.place = function (game) {
    const cfg = game.cfg, L = cfg.LAYOUT, p = game.player, R = cfg.OFFER_R, E = TBS.Economy;
    const W = p.x >= L.W2.x0 && game.wing2Open ? L.W2 : L.W1;
    const tables = [].concat(game.chains.p.counter.tables, game.chains.g.counter.tables);
    const rectDist = (x, z, r) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1));
    const free = (x, z) => {
      if (x < W.x0 + 0.6 + R || x > W.x0 + L.HALL_W - 0.6 - R || z < L.STRIP + 0.5 + R || z > L.DEPTH - 0.5 - R) return false;
      if (Math.abs(x - W.service.x) < cfg.OFFER_LINE_GAP + R) return false; // the aliens in line would hide it
      for (const r of game.obstacles) if (rectDist(x, z, r) < R + 0.25) return false;
      for (const zn of game.zones) if (zn.type !== 'clean' && Math.hypot(x - zn.x, z - zn.z) < R + zn.r + 0.2) return false;
      for (const t of tables) {
        if (Math.hypot(x - t.x, z - t.z) < E.tableFoot(cfg, t.s) + R + 0.1) return false;
        if (E.hiddenBy(cfg, { x: x, z: z }, t, R) > 0) return false; // a table would hide it from the camera
        if (Math.hypot(x - t.tip.x, z - t.tip.z) < R + 0.5 || Math.hypot(x - t.work.x, z - t.work.z) < R + 0.4) return false;
      }
      for (const m of [game.chains.p.counter.money, game.chains.g.counter.money]) if (Math.hypot(x - m.x, z - m.z) < R + 1.0) return false;
      return true;
    };
    const near = cfg.OFFER_NEAR, spots = [];
    for (let d = near[0]; d <= near[1] + 1e-6; d += 0.5) {
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2, x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
        if (free(x, z)) spots.push({ x: x, z: z });
      }
    }
    if (!spots.length) return null;
    return spots[Math.floor(game.rng() * spots.length)];
  };

  O.spawn = function (game) {
    const pos = O.place(game);
    if (!pos) { game.offerT = 2; return null; } // no room right now: try again in a moment
    const cfg = game.cfg, type = O.pickType(game);
    game.lastOfferType = type;
    const L = cfg.LAYOUT, wing = pos.x >= L.W2.x0 ? 2 : 1;
    game.floorOffer = { id: ++game.offerSeq, type: type, amount: O.amount(game, type), x: pos.x, z: pos.z, r: cfg.OFFER_R, t: cfg.OFFER_LIFE, life: cfg.OFFER_LIFE, wing: wing };
    game.emit('offerNew', { offer: game.floorOffer });
    game.rebuildZones();
    return game.floorOffer;
  };

  // take the offer: how = 'gems' (pays its gem price) or 'ad' (after a finished rewarded ad)
  O.take = function (game, how) {
    const f = game.floorOffer, cfg = game.cfg;
    if (!f) return false;
    if (how === 'gems') {
      const pr = O.price(game, f.type);
      if (pr === null || game.gems < pr) return false;
      game.gems -= pr;
    }
    O.grant(game, f);
    game.floorOffer = null;
    game.offerT = how === 'ad' ? cfg.OFFER_GAP_AFTER_AD : cfg.OFFER_GAP;
    game.emit('offerTaken', { offer: f, how: how });
    game.rebuildZones();
    return true;
  };

  O.grant = function (game, f) {
    const cfg = game.cfg;
    if (f.type === 'magnet') game.effects.magnet = f.amount;
    else if (f.type === 'hover') game.effects.hover = f.amount;
    else if (f.type === 'cash') game.addMoney(f.amount, 'offer');
    else if (O.isGem(f.type)) game.addGems(f.amount, 'offer');
    else if (f.type === 'worker') TBS.Workers.add(game, game.chainOfWing(f.wing), f.amount, f.x, f.z);
  };
})(window.TBS = window.TBS || {});

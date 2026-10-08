/* Guided start: one target at a time, shown by a floor arrow. No text. Every wing starts EMPTY, so you build it up:
   Wing 1: build pad -> take tentacles -> build machine -> fill it -> take burgers -> build counter -> put burgers on it
           -> build Table 1 -> sell -> money -> build bin -> clean the table -> trash -> build Chef Desk -> Capacity
           -> build Hire Desk -> hire.
   Wing 2 (when it opens): build tank -> take goo -> build machine -> fill it -> take dishes -> build counter -> put dishes on it. */
(function (TBS) {
  'use strict';

  const G = TBS.Guide = {};
  G.STEPS = ['bPad', 'pad', 'bMachine', 'input', 'output', 'bCounter', 'counter', 'table1', 'cashier', 'money', 'bBin', 'clean1', 'trash1', 'bChef', 'carry1', 'bHire', 'hire1'];
  G.G2_STEPS = ['gbSrc', 'goo', 'gbMachine', 'ginput', 'goutput', 'gbCounter', 'gcounter'];
  const BUY = { bPad: 'b_src1', bMachine: 'b_m1', bCounter: 'b_ctr1', table1: 't1_0', bBin: 'b_bin1', bChef: 'b_chef1', bHire: 'b_hire1' };
  const BUY2 = { gbSrc: 'b_src2', gbMachine: 'b_m2', gbCounter: 'b_ctr2' };

  G.purchaseTrack = function (game) {
    if (game.guide.done) return null;
    return BUY[G.STEPS[game.guide.step]] || null;
  };

  G.onEvent = function (game, type, d) {
    const f = game.guide.flags, g2 = game.g2.flags;
    if (type === 'drop' && d.who === 'player') {
      if (d.kind === 'bin') f.trashed = true;
      else if (d.kind === 'machine') { if (d.m.chain === 'p') f.dropMachine = true; else g2.dropMachine = true; }
      else if (d.counter.chain === 'p') f.dropCounter = true; else g2.dropCounter = true;
    } else if (type === 'collect' || type === 'collectTick') f.collected = true;
    else if (type === 'take' && d.c.chain === 'p' && !game.chains.p.counter.hasCashier) f.sold = true;
    else if (type === 'clean' && d.who === 'player') f.cleaned = true;
    else if (type === 'terminalOpen' && d.desk === 'chef') f.chefOpened = true; // opening the Chef Desk is enough, buying is optional
  };

  function inCircle(p, c) { return Math.hypot(p.x - c.x, p.z - c.z) <= c.r; }

  function pickedDone(game, type, circle, pileLeft) {
    const p = game.player;
    return p.count(type) > 0 && (!inCircle(p, circle) || p.stack.length >= p.capacity(game) || pileLeft <= 0);
  }

  G.update = function (game) {
    const gd = game.guide, f = gd.flags, ch = game.chains.p;
    while (!gd.done) {
      const s = G.STEPS[gd.step];
      let ok = false;
      if (BUY[s] && s !== 'table1') ok = game.built(BUY[s]);
      else if (s === 'pad') ok = pickedDone(game, 'tentacle', ch.source.circle, ch.source.pile) || f.dropMachine;
      else if (s === 'input') ok = f.dropMachine;
      else if (s === 'output') {
        const m = ch.machines[0];
        ok = pickedDone(game, 'burger', m.out, m.output) || f.dropCounter;
      } else if (s === 'counter') ok = f.dropCounter;
      else if (s === 'cashier') ok = f.sold;
      else if (s === 'clean1') ok = f.cleaned;
      else if (s === 'trash1') ok = f.trashed || (f.cleaned && game.player.count('plate') === 0);
      else if (s === 'money') { ok = f.collected; if (!ok && f.dropCounter && game.money >= 1 && ch.counter.money.amount <= 0 && game.stats.sold > 0) ok = true; }
      else if (s === 'table1') ok = game.chains.p.counter.tables.length >= 1;
      else if (s === 'carry1') ok = f.chefOpened || game.chef.carry >= 1;
      else if (s === 'hire1') ok = TBS.Workers.hired(game, 'p').length >= 1;
      if (!ok) break;
      gd.step++;
      if (gd.step >= G.STEPS.length) { gd.done = true; game.emit('guideDone', {}); }
      else game.emit('guideStep', { step: gd.step, name: G.STEPS[gd.step] });
      game.rebuildWorld(); // desk / Boost Terminal circles appear as the guide reaches them
      game.offersDirty = true;
    }
    const g2 = game.g2;
    if (g2.active && !g2.done) {
      const f2 = g2.flags, gc = game.chains.g;
      while (!g2.done) {
        const s = G.G2_STEPS[g2.step];
        let ok = false;
        if (BUY2[s]) ok = game.built(BUY2[s]);
        else if (s === 'goo') ok = pickedDone(game, 'goo', gc.source.circle, gc.source.pile) || f2.dropMachine;
        else if (s === 'ginput') ok = f2.dropMachine;
        else if (s === 'goutput') { const m = gc.machines[0]; ok = pickedDone(game, 'dish', m.out, m.output) || f2.dropCounter; }
        else if (s === 'gcounter') ok = f2.dropCounter;
        if (!ok) break;
        g2.step++;
        if (g2.step >= G.G2_STEPS.length) { g2.done = true; game.emit('g2Done', {}); }
        else game.emit('g2Step', { step: g2.step, name: G.G2_STEPS[g2.step] });
      }
    }
  };

  // someone at the front of the line wants food that is on the counter, and nobody is selling
  G.needsCashier = function (game, chainId) {
    const c = game.chains[chainId].counter, front = c.line[0];
    return !c.hasCashier && !c.needsTables() && c.stack > 0 && !!front && front.state === 'line' && front.got < front.order;
  };

  // Next useful place in the production loop (used while the player is short of money).
  G.loopTarget = function (game, chainId) {
    const p = game.player, ch = game.chains[chainId], c = ch.counter;
    if (p.count('plate') > 0) { // plates: to this wing's bin, or the other wing's if this one has none yet
      const L = game.cfg.LAYOUT, w = game.built('b_bin' + c.wing) ? c.wing : (c.wing === 2 ? 1 : 2);
      if (game.built('b_bin' + w)) { const b = (w === 2 ? L.W2 : L.W1).bin.drop; return { x: b.x, z: b.z, kind: 'drop' }; }
    }
    if (p.count(ch.product) > 0 && c.room() > 0) return { x: c.drop.x, z: c.drop.z, kind: 'drop' };
    if (p.count(ch.ingredient) > 0) {
      let best = null;
      for (const m of ch.machines) if (m.built && m.room() > 0 && (!best || m.room() > best.room())) best = m;
      if (best) return { x: best.inZone.x, z: best.inZone.z, kind: 'drop' };
    }
    if (G.needsCashier(game, chainId)) return { x: c.cashier.x, z: c.cashier.z, kind: 'cashier', chain: chainId };
    const dirty = c.dirtyTables()[0];
    if (dirty && p.stack.length === 0 && game.built('b_bin' + ch.wing)) return { x: dirty.work.x, z: dirty.work.z, kind: 'clean', table: dirty, chain: chainId }; // (plates need a bin)
    if (c.money.amount > 0) return { x: c.money.x, z: c.money.z, kind: 'money' };
    let out = null;
    for (const m of ch.machines) if (m.built && m.output > 0 && (!out || m.output > out.output)) out = m;
    if (out) return { x: out.out.x, z: out.out.z, kind: 'pickup' };
    return ch.source.built ? { x: ch.source.circle.x, z: ch.source.circle.z, kind: 'pickup' } : null; // nothing built yet
  };

  // Where the floor arrow points right now (or null).
  G.target = function (game) {
    const p = game.player, L = game.cfg.LAYOUT;
    if (!game.guide.done) {
      const s = G.STEPS[game.guide.step], ch = game.chains.p, m = ch.machines[0];
      if (s === 'pad') return { x: ch.source.circle.x, z: ch.source.circle.z, kind: 'pickup' };
      if (s === 'input') return p.count('tentacle') > 0 ? { x: m.inZone.x, z: m.inZone.z, kind: 'drop' } : { x: ch.source.circle.x, z: ch.source.circle.z, kind: 'pickup' };
      if (s === 'output') return { x: m.out.x, z: m.out.z, kind: 'pickup' };
      if (s === 'counter') return p.count('burger') > 0 ? { x: ch.counter.drop.x, z: ch.counter.drop.z, kind: 'drop' } : G.loopTarget(game, 'p');
      if (s === 'cashier') return ch.counter.stack > 0 ? { x: ch.counter.cashier.x, z: ch.counter.cashier.z, kind: 'cashier', chain: 'p' } : G.loopTarget(game, 'p');
      if (s === 'money') return { x: ch.counter.money.x, z: ch.counter.money.z, kind: 'money' };
      if (s === 'clean1') return G.loopTarget(game, 'p'); // cashier until someone eats, then the dirty table
      if (s === 'trash1') return G.loopTarget(game, 'p'); // plates on the tray -> the trash bin
      if (s === 'carry1') {
        const c = L.W1.chefDesk.circle;
        return { x: c.x, z: c.z, kind: 'desk', desk: 'chef', wing: 1, buy: 'carry' }; // just open it (no need to buy)
      }
      if (s === 'hire1') {
        const c = L.W1.hireDesk.circle;
        return game.money >= game.hirePrice(1) ? { x: c.x, z: c.z, kind: 'desk', desk: 'hire', wing: 1, buy: 'hire' } : G.loopTarget(game, 'p');
      }
      const id = BUY[s], o = game.offers.find((x) => x.trackId === id);
      if (o && game.money + (game.paid[id] || 0) >= o.price - 0.5) return { x: o.x, z: o.z, kind: 'price' };
      return G.loopTarget(game, 'p');
    }
    if (game.g2.active && !game.g2.done && !game.revealing()) {
      const s = G.G2_STEPS[game.g2.step], ch = game.chains.g, m = ch.machines[0];
      if (p.count('plate') > 0) return G.loopTarget(game, 'g'); // trash on the tray: the nearest (Wing 2) bin first
      // tray full of Wing 1 things: first put them where they belong, then come back
      if (p.stack.length >= p.capacity(game) && p.count('goo') + p.count('dish') === 0) return G.loopTarget(game, 'p');
      if (BUY2[s]) { // build the next basic thing of the empty wing (short of money: earn it in Wing 1)
        const o = game.offers.find((x) => x.trackId === BUY2[s]);
        if (o && game.money + (game.paid[o.trackId] || 0) >= o.price - 0.5) return { x: o.x, z: o.z, kind: 'price' };
        return G.loopTarget(game, 'p');
      }
      if (s === 'goo') return { x: ch.source.circle.x, z: ch.source.circle.z, kind: 'pickup' };
      if (s === 'ginput') return p.count('goo') > 0 ? { x: m.inZone.x, z: m.inZone.z, kind: 'drop' } : { x: ch.source.circle.x, z: ch.source.circle.z, kind: 'pickup' };
      if (s === 'goutput') return { x: m.out.x, z: m.out.z, kind: 'pickup' };
      if (s === 'gcounter') {
        if (p.count('dish') > 0) return { x: ch.counter.drop.x, z: ch.counter.drop.z, kind: 'drop' };
        if (G.needsCashier(game, 'g')) return { x: ch.counter.cashier.x, z: ch.counter.cashier.z, kind: 'cashier', chain: 'g' };
        return { x: m.out.x, z: m.out.z, kind: 'pickup' };
      }
    }
    // new wing without any table: the aliens wait -> the arrow shows the cheapest table circle there
    if (game.wing2Open && !game.revealing() && game.chains.g.counter.built && game.chains.g.counter.needsTables()) {
      let best = null;
      for (const o of game.offers) if (o.wing === 2 && game.trackDefs[o.trackId].table !== undefined && (!best || o.price - o.paid < best.price - best.paid)) best = o;
      if (best) return { x: best.x, z: best.z, kind: 'price' };
    }
    return null;
  };
})(window.TBS = window.TBS || {});

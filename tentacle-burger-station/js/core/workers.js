/* Workers do all 3 jobs of their wing: carry ingredients to the machines, carry food to the counter, clean tables
   (and carry the dirty plates to the trash bin).
   Priority: a machine is starving > the counter is (almost) empty > a dirty table > more ingredients > more food.
   Never idle while work exists, never two workers on the same job, never touch money, never pick a wrong item.
   A worker only takes a new job with empty hands. */
(function (TBS) {
  'use strict';

  class Worker {
    constructor(id, chain, x, z, temp) {
      this.id = id; this.chain = chain; this.x = x; this.z = z; this.facing = 0;
      this.temp = temp || 0;          // seconds left for a temporary worker (0 = permanent)
      this.sp = 0; this.cap = 0;      // this worker's own Speed / Capacity level (Hire Desk)
      this.stack = [];                // {id, type}
      this.job = null;                // { id, type: 'feed' | 'serve' | 'clean', m, table }
      this.phase = null; this.path = null; this.target = null;
      this.acc = 0; this.moving = false; this.walkDist = 0; this.idleT = 0; this.busyT = 0;
    }
  }

  const W = TBS.Workers = {};

  const lv = (list, i) => list[Math.max(0, Math.min(i || 0, list.length - 1))];
  W.speed = (game, w) => lv(game.cfg.WORKER_SPEED_LEVELS, w.sp);
  W.cap = (game, w) => lv(game.cfg.WORKER_CAP_LEVELS, w.cap);
  W.hired = (game, chain) => game.workers.filter((w) => w.chain === chain && !(w.temp > 0));
  W.STARVING = 3;     // a machine with fewer ingredients than this is "starving"
  W.COUNTER_LOW = 2;  // a counter with less food than this is "empty"

  W.add = function (game, chain, temp, x, z) {
    const sp = (chain === 'g' ? game.cfg.LAYOUT.W2 : game.cfg.LAYOUT.W1).hireDesk.circle;
    const w = new Worker(game.nextId++, chain, x !== undefined ? x : sp.x, z !== undefined ? z : sp.z, temp);
    if (temp > 0) { // a temporary helper is as good as your best worker in that wing
      for (const o of W.hired(game, chain)) { w.sp = Math.max(w.sp, o.sp); w.cap = Math.max(w.cap, o.cap); }
    }
    game.workers.push(w);
    game.emit('workerSpawn', { w: w });
    return w;
  };

  // every job of a chain right now, best first (tier 1 = most urgent)
  W.jobs = function (game, chainId) {
    const ch = game.chains[chainId], src = ch.source, counter = ch.counter, out = [];
    let food = 0;
    for (const m of ch.machines) if (m.built) food += m.output;
    for (const m of ch.machines) if (m.built && src.pile > 0 && m.room() > 0) out.push({ id: 'feed:' + m.id, type: 'feed', m: m, tier: m.input < W.STARVING ? 1 : 4 });
    if (food > 0 && counter.built && counter.room() > 0) out.push({ id: 'serve:' + counter.id, type: 'serve', tier: counter.stack < W.COUNTER_LOW ? 2 : 5 });
    // dirty tables are the MOST urgent job when no clean seat is free and an alien waits to sit (otherwise the whole line stops)
    const blocked = W.seatsBlocked(game, chainId);
    if (W.needSeller(game, chainId) && !blocked) out.push({ id: 'sell:' + counter.id, type: 'sell', tier: 1 }); // nobody sells: a worker stands at the counter
    // cleaning needs a bin for the dirty plates
    if (game.built('b_bin' + ch.wing)) for (const t of counter.dirtyTables()) out.push({ id: 'clean:' + chainId + t.idx, type: 'clean', table: t, tier: blocked ? 0 : 3 });
    out.sort((a, b) => a.tier - b.tier);
    return out;
  };

  // an alien waits at the counter, there is food on it (or coming), and nobody sells (no cashier bought, chef not there)
  W.needSeller = function (game, chainId) {
    const c = game.chains[chainId].counter, p = game.player, front = c.line[0];
    if (c.hasCashier || c.needsTables() || c.near(p.x, p.z) || !front || front.state !== 'line' || front.got >= front.order) return false;
    return c.stack > 0;
  };

  // aliens can't sit: there are tables, a dirty one, no free clean seat, and someone holds food waiting for a seat
  W.seatsBlocked = function (game, chainId) {
    const c = game.chains[chainId].counter;
    if (!c.tables.length || !c.dirtyTables().length || c.freeSeat()) return false;
    return game.customers.some((cu) => cu.chain === chainId && cu.waitSeat);
  };

  // ingredients this worker should take: only what the machines still have room for (others' loads counted)
  function feedRoom(game, w) {
    let room = 0;
    for (const m of game.chains[w.chain].machines) if (m.built) room += m.room();
    for (const o of game.workers) if (o !== w && o.chain === w.chain && o.job && o.job.type === 'feed') room -= o.stack.length;
    return Math.max(0, room);
  }

  // best job nobody else is doing (nearest one inside the best tier)
  W.pickJob = function (game, w) {
    const taken = new Set();
    for (const o of game.workers) if (o !== w && o.job && o.chain === w.chain) taken.add(o.job.id);
    let best = null, bestD = 1e9;
    for (const j of W.jobs(game, w.chain)) {
      if (taken.has(j.id)) continue;
      if (best && j.tier > best.tier) break;
      if (j.type === 'feed' && feedRoom(game, w) <= 0) continue; // the machines are already being filled by others
      const p = j.type === 'feed' ? game.chains[w.chain].source.workerSpot : j.type === 'serve' ? W.bestOutput(game, w.chain).out : j.type === 'sell' ? game.chains[w.chain].counter.cashier : j.table.work;
      const d = Math.hypot(p.x - w.x, p.z - w.z);
      if (!best || d < bestD) { best = j; bestD = d; }
    }
    return best;
  };

  W.bestOutput = function (game, chainId) {
    let best = null;
    for (const m of game.chains[chainId].machines) if (m.built && (!best || m.output > best.output)) best = m;
    return best;
  };

  function goTo(game, w, spot) {
    w.path = game.nav.findPath(w.x, w.z, spot.x, spot.z);
    if (!w.path.length) w.path = [{ x: spot.x, z: spot.z }];
  }

  function follow(w, speed, dt) {
    let budget = speed * dt;
    w.moving = false;
    while (budget > 0 && w.path && w.path.length) {
      const p = w.path[0], dx = p.x - w.x, dz = p.z - w.z, d = Math.hypot(dx, dz);
      if (d < 1e-4) { w.path.shift(); continue; }
      const step = Math.min(d, budget);
      w.x += dx / d * step; w.z += dz / d * step;
      w.facing = Math.atan2(dx, dz);
      w.walkDist += step; budget -= step; w.moving = true;
      if (step >= d - 1e-6) w.path.shift();
    }
    return !w.path || w.path.length === 0;
  }

  function bestMachine(game, w) { // machine with the most room for ingredients
    let best = null;
    for (const m of game.chains[w.chain].machines) if (m.built && (!best || m.room() > best.room())) best = m;
    return best;
  }

  function start(game, w, job) {
    w.job = job; w.path = null; w.acc = 0;
    if (job.type === 'feed') { w.phase = 'toSource'; w.target = job.m; }
    else if (job.type === 'serve') { w.phase = 'toOutput'; w.target = W.bestOutput(game, w.chain); }
    else if (job.type === 'sell') { w.phase = 'toCashier'; w.target = null; }
    else { w.phase = 'toTable'; w.target = job.table; }
  }

  function finish(w) { w.job = null; w.phase = null; w.path = null; w.target = null; w.selling = false; w.acc = 0; w.waitT = 0; }

  // one step of the current job; returns false while waiting with nothing to do
  function work(game, w, dt, speed, cap) {
    const cfg = game.cfg, ch = game.chains[w.chain], src = ch.source, counter = ch.counter;
    switch (w.phase) {
      case 'toSource':
        if (!w.path) goTo(game, w, src.workerSpot);
        if (follow(w, speed, dt)) { w.phase = 'pick'; w.path = null; w.acc = 0; }
        return true;
      case 'pick': {
        w.moving = false;
        const want = Math.min(cap, feedRoom(game, w));
        if (want <= 0 && !w.stack.length) { finish(w); return true; }
        if (w.stack.length >= want) { w.phase = 'toMachine'; return true; }
        if (src.pile > 0) {
          w.acc -= dt;
          while (w.acc <= 0 && src.pile > 0 && w.stack.length < want) {
            src.pile--;
            const item = { id: game.nextId++, type: src.itemType };
            w.stack.push(item);
            game.emit('pickup', { who: 'worker', w: w, item: item, key: src.id });
            w.acc += cfg.WORKER_PICK_INTERVAL;
          }
          if (w.stack.length >= want) w.phase = 'toMachine';
          return true;
        }
        if (w.stack.length > 0) { w.phase = 'toMachine'; return true; } // deliver what we have instead of waiting
        finish(w); return true;                                          // pile empty: pick another job
      }
      case 'toMachine':
        if (!w.target || w.target.room() <= 0) { const m = bestMachine(game, w); if (m && m !== w.target) { w.target = m; w.path = null; } }
        if (!w.path) goTo(game, w, w.target.workerSpot);
        if (follow(w, speed, dt)) { w.phase = 'drop'; w.path = null; w.acc = 0; }
        return true;
      case 'drop': {
        w.moving = false;
        const m = w.target;
        if (!w.stack.length) { finish(w); return true; }
        if (m.room() > 0) {
          w.acc -= dt;
          const dropped = [];
          while (w.acc <= 0 && m.room() > 0 && w.stack.length) {
            dropped.push(w.stack.pop());
            m.input++;
            w.acc += cfg.WORKER_DROP_INTERVAL;
          }
          if (dropped.length) game.emit('drop', { who: 'worker', w: w, items: dropped, key: m.id + ':in', kind: 'machine', m: m });
          if (!w.stack.length) finish(w);
          return true;
        }
        const other = bestMachine(game, w);
        if (other && other !== m && other.room() > 0) { w.target = other; w.phase = 'toMachine'; w.path = null; return true; }
        // machines full: wait a moment; if they stay full, put the rest back on the pile and go do something useful
        w.waitT = (w.waitT || 0) + dt;
        if (w.waitT > cfg.WORKER_FULL_WAIT) { w.waitT = 0; w.phase = 'toSourceBack'; w.path = null; }
        return false;
      }
      case 'toSourceBack':
        if (!w.path) goTo(game, w, src.workerSpot);
        if (follow(w, speed, dt)) {
          const items = w.stack.splice(0, w.stack.length);
          src.pile += items.length;
          if (items.length) game.emit('drop', { who: 'worker', w: w, items: items, key: src.id, kind: 'source' });
          finish(w);
        }
        return true;
      case 'toCashier':
        if (!W.needSeller(game, w.chain) || W.seatsBlocked(game, w.chain)) { finish(w); return true; }
        if (!w.path) goTo(game, w, counter.cashier);
        if (follow(w, speed, dt)) { w.phase = 'selling'; w.path = null; w.acc = 0; }
        return true;
      case 'selling': { // stands at the counter and sells while aliens wait and there is food
        w.moving = false;
        w.selling = true;
        w.facing = Math.atan2(counter.lineSpots[0].x - w.x, counter.lineSpots[0].z - w.z);
        // keep selling only while the first alien still needs food (not when he has it and waits for a seat),
        // and leave at once when tables must be cleaned so aliens can sit
        if (W.needSeller(game, w.chain) && !W.seatsBlocked(game, w.chain)) { w.acc = 0; return true; }
        if (W.seatsBlocked(game, w.chain)) { finish(w); return true; }
        w.acc += dt;
        if (w.acc > cfg.WORKER_SELL_LINGER) finish(w); // nothing to sell for a moment: go help elsewhere
        return true;
      }
      case 'toOutput':
        if (!w.path) goTo(game, w, w.target.out);
        if (follow(w, speed, dt)) { w.phase = 'pickOut'; w.path = null; w.acc = 0; }
        return true;
      case 'pickOut': {
        w.moving = false;
        const m = w.target, want = Math.min(cap, counter.room());
        if (w.stack.length >= want && w.stack.length > 0) { w.phase = 'toCounter'; return true; }
        if (m.output > 0) {
          w.acc -= dt;
          while (w.acc <= 0 && m.output > 0 && w.stack.length < want) {
            m.output--;
            const item = { id: game.nextId++, type: m.outType };
            w.stack.push(item);
            game.emit('pickup', { who: 'worker', w: w, item: item, key: m.id });
            w.acc += cfg.WORKER_PICK_INTERVAL;
          }
          return true;
        }
        if (w.stack.length > 0) { w.phase = 'toCounter'; return true; }
        const other = W.bestOutput(game, w.chain);
        if (other && other.output > 0) { w.target = other; w.phase = 'toOutput'; w.path = null; return true; }
        finish(w); return true;
      }
      case 'toCounter':
        if (!w.path) goTo(game, w, counter.drop);
        if (follow(w, speed, dt)) { w.phase = 'dropCounter'; w.path = null; w.acc = 0; }
        return true;
      case 'dropCounter': {
        w.moving = false;
        if (!w.stack.length) { finish(w); return true; }
        if (counter.room() > 0) {
          w.acc -= dt;
          const dropped = [];
          while (w.acc <= 0 && counter.room() > 0 && w.stack.length) {
            dropped.push(w.stack.pop());
            counter.stack++;
            w.acc += cfg.WORKER_DROP_INTERVAL;
          }
          if (dropped.length) game.emit('drop', { who: 'worker', w: w, items: dropped, key: counter.id, kind: 'counter', counter: counter });
          if (!w.stack.length) finish(w);
          return true;
        }
        // counter full: wait a moment; if it stays full, put the food back on its machine and go do something useful
        // (e.g. clean tables - otherwise aliens can't sit, nobody buys, and the counter never empties)
        w.acc = 0;
        w.waitT = (w.waitT || 0) + dt;
        if (w.waitT > cfg.WORKER_FULL_WAIT) { w.waitT = 0; w.phase = 'toOutputBack'; w.path = null; }
        return false;
      }
      case 'toOutputBack': {
        const m = w.target && w.target.out ? w.target : W.bestOutput(game, w.chain) || game.chains[w.chain].machines.find((x) => x.built);
        if (!w.path) goTo(game, w, m.out);
        if (follow(w, speed, dt)) {
          const items = w.stack.splice(0, w.stack.length);
          m.output += items.length;
          if (items.length) game.emit('drop', { who: 'worker', w: w, items: items, key: m.id, kind: 'machineOut' });
          finish(w);
        }
        return true;
      }
      case 'toTable':
        if (!w.target.seats.some((s) => s.dirty)) { finish(w); return true; } // someone else cleaned it
        if (!w.path) goTo(game, w, w.target.work);
        if (follow(w, speed, dt)) { w.phase = 'cleaning'; w.path = null; w.acc = cfg.WORKER_CLEAN_TIME; }
        return true;
      case 'cleaning':
        w.moving = false;
        if (!w.target.seats.some((s) => s.dirty)) { finish(w); return true; }
        w.facing = Math.atan2(w.target.x - w.x, w.target.z - w.z);
        w.acc -= dt;
        if (w.acc <= 0) { // all plates of the table onto the tray, then to the trash bin
          game.cleanTable(w.target, w.chain, 'worker', w, 99);
          if (w.stack.length) { w.phase = 'toBin'; w.path = null; } else finish(w);
        }
        return true;
      case 'toBin': {
        const b = (counter.wing === 2 ? cfg.LAYOUT.W2 : cfg.LAYOUT.W1).bin.drop;
        if (!w.path) goTo(game, w, b);
        if (follow(w, speed, dt)) {
          const items = w.stack.splice(0, w.stack.length);
          if (items.length) game.emit('drop', { who: 'worker', w: w, items: items, key: 'bin:' + w.chain, kind: 'bin', chain: w.chain });
          finish(w);
        }
        return true;
      }
    }
    return false;
  }

  W.update = function (game, dt) {
    for (let i = game.workers.length - 1; i >= 0; i--) {
      const w = game.workers[i], ch = game.chains[w.chain];
      if (!ch.active) continue;
      const speed = W.speed(game, w), cap = W.cap(game, w);
      if (w.temp > 0) {
        w.temp -= dt;
        if (w.temp <= 0) { // temporary worker done: carried items go back where they came from, poof
          if (w.stack.length) {
            const t = w.stack[0].type;
            if (t === ch.source.itemType) ch.source.pile += w.stack.length; else if (t !== 'plate') ch.counter.stack += w.stack.length; // plates just vanish
            w.stack.length = 0;
          }
          game.workers.splice(i, 1);
          game.emit('workerLeave', { w: w });
          continue;
        }
      }
      if (!w.job) {
        const j = W.pickJob(game, w);
        if (j) start(game, w, j);
      }
      let busy = false;
      if (w.job) {
        busy = work(game, w, dt, speed, cap);
        if (!w.job) { const j = W.pickJob(game, w); if (j) start(game, w, j); } // straight on to the next job
      } else w.moving = false;
      if (busy) w.busyT += dt; else w.idleT += dt;
    }
  };

  W.Worker = Worker;
})(window.TBS = window.TBS || {});

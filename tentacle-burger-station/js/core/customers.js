/* Alien customers: arrive at the rate the station can almost (not quite) serve, wait in ONE single-file line,
   take their food at the counter (only while someone stands in the cashier spot), pay, then walk to a free CLEAN
   seat, eat, and leave leftovers + a tip. Without any table in the wing they take the food away.
   Waiting too long without food makes them angry and, later, they leave. Leaving never costs the player anything. */
(function (TBS) {
  'use strict';

  class Customer {
    constructor(id, chain, x, z, order, speed) {
      this.id = id; this.chain = chain;
      this.x = x; this.z = z; this.facing = 0;
      this.order = order; this.got = 0;
      this.speed = speed;
      this.state = 'walk'; this.goal = null;
      this.path = []; this.line = -1;
      this.t = 0; this.happyT = 0; this.moving = false; this.walkDist = 0;
      this.assignedAt = 0; this.waitT = 0; this.lineWait = 0; this.angry = false; this.gaveUp = false;
      this.seat = null; this.table = null; this.eatT = 0; this.eatTotal = 0; this.bill = 0; this.waitSeat = false;
    }
  }

  const C = TBS.Customers = {};

  C.queueMax = (game, counter) => counter.lineCap();
  function lineCount(counter) { let n = 0; for (let i = 0; i < counter.line.length; i++) if (counter.line[i]) n++; return n; }
  C.hasRoom = (counter) => lineCount(counter) < counter.lineCap();
  C.waiting = (counter) => lineCount(counter);

  function sendToLine(game, c, counter, i) {
    c.line = i; counter.line[i] = c;
    const s = counter.lineSpots[i];
    const gt = counter.gate;
    if (c.z > gt.zIn) c.path = [{ x: gt.x, z: gt.zIn - 0.3 }, { x: s.x, z: s.z }]; // still outside: come in through the gate
    else c.path = [{ x: s.x, z: s.z }];
    c.state = 'walk'; c.goal = 'line';
  }

  function sendToExit(game, c, counter) {
    const gt = counter.gate, out = gt.x + 1.0; // leaving aliens use the right half of the gate
    if (c.seat) { // from a table: find a way around the tables back to the gate
      const p = game.nav.findPath(c.x, c.z, out, gt.zIn - 0.4);
      c.path = p.concat([{ x: out, z: gt.zOut }]);
    } else { // from the line: step aside, then straight out next to the line
      c.path = [{ x: out, z: c.z }, { x: out, z: gt.zIn - 0.4 }, { x: out, z: gt.zOut }];
    }
    c.state = 'walk'; c.goal = 'exit';
  }

  function sendToSeat(game, c, found) {
    c.table = found.table; c.seat = found.seat; found.seat.user = c;
    const p = game.nav.findPath(c.x, c.z, found.seat.x, found.seat.z);
    const last = p[p.length - 1];
    if (!last || Math.hypot(last.x - found.seat.x, last.z - found.seat.z) > 0.01) p.push({ x: found.seat.x, z: found.seat.z });
    c.path = p; c.state = 'walk'; c.goal = 'seat';
  }

  function newOrder(game) { return game.rng.int(game.cfg.ORDER_MIN, game.cfg.ORDER_MAX); }

  C.spawn = function (game, chainId, opts) {
    const ch = game.chains[chainId], counter = ch.counter, cfg = game.cfg;
    if (!C.hasRoom(counter)) return null;
    opts = opts || {};
    const speed = chainId === 'g' ? cfg.GREEN_CUSTOMER_SPEED : cfg.CUSTOMER_SPEED;
    const x = opts.x !== undefined ? opts.x : counter.gate.x, z = opts.z !== undefined ? opts.z : counter.gate.zOut;
    const c = new Customer(game.nextId++, chainId, x, z, opts.order || newOrder(game), speed);
    c.assignedAt = game.time;
    game.customers.push(c);
    const k = lineCount(counter);
    if (opts.atSpot) {
      c.line = k; counter.line[k] = c;
      const s = counter.lineSpots[k];
      c.x = s.x; c.z = s.z; c.state = 'line'; c.path = []; c.facing = s.face;
    } else if (opts.path) {
      c.line = k; counter.line[k] = c;
      const s = counter.lineSpots[k];
      c.path = opts.path.concat([{ x: s.x, z: s.z }]);
      c.state = 'walk'; c.goal = 'line';
    } else sendToLine(game, c, counter, k);
    game.emit('customerSpawn', { c: c });
    return c;
  };

  // someone left place i: everybody behind steps forward
  function closeGap(game, counter, i) {
    counter.line[i] = null;
    for (let j = i + 1; j < counter.line.length; j++) {
      const c = counter.line[j];
      if (c) { counter.line[j] = null; sendToLine(game, c, counter, j - 1); }
    }
  }

  function walk(c, dt) {
    let budget = c.speed * dt;
    c.moving = false;
    while (budget > 0 && c.path.length) {
      const p = c.path[0], dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz);
      if (d < 1e-4) { c.path.shift(); continue; }
      const step = Math.min(d, budget);
      c.x += dx / d * step; c.z += dz / d * step;
      c.facing = Math.atan2(dx, dz);
      c.walkDist += step; budget -= step; c.moving = true;
      if (step >= d - 1e-6) c.path.shift();
    }
    return c.path.length === 0;
  }

  // how many aliens per second this chain can take: food made, and (with tables) free seats
  C.arrivalRate = function (game, id) {
    const cfg = game.cfg, ch = game.chains[id], avg = (cfg.ORDER_MIN + cfg.ORDER_MAX) / 2;
    let rate = cfg.DEMAND_FACTOR * game.chainCapacity(id) / avg;
    const seats = ch.counter.seatCount();
    if (seats > 0) rate = Math.min(rate, cfg.SEAT_DEMAND_FACTOR * seats / (ch.counter.avgEat() + cfg.SEAT_TURNOVER_EXTRA));
    if (id === 'g') { // the new wing starts quiet and fills up
      const k = cfg.WING2_RAMP_START + (1 - cfg.WING2_RAMP_START) * Math.min(1, game.wing2OpenTime / cfg.WING2_RAMP_SECONDS);
      rate *= k;
    }
    return rate;
  };

  function pay(game, c, counter) {
    const amount = Math.round(c.order * game.priceOf(c.chain));
    c.bill = amount;
    counter.money.amount += amount;
    counter.money.bills += c.order;
    game.stats.served++;
    game.emit('paid', { c: c, amount: amount, n: c.order, key: counter.id });
    game.onSale(c.chain, c.order, amount);
  }

  C.update = function (game, dt) {
    const cfg = game.cfg;
    // arrivals
    for (const id in game.chains) {
      const ch = game.chains[id];
      if (!ch.active || !ch.counter.built) continue; // no counter yet: nobody comes
      const counter = ch.counter;
      let rate = C.arrivalRate(game, id);
      // always a busy line: below CROWD_FILL of its places, aliens come quickly (even when you serve fast)
      const crowd = lineCount(counter) < counter.lineCap() * cfg.CROWD_FILL && !(id === 'g' && game.wing2OpenTime < cfg.WING2_RAMP_SECONDS); // (the new wing: only after its quiet start)
      if (crowd) {
        rate = Math.max(rate, 1 / cfg.CROWD_SPAWN_GAP);
        if (ch.spawnT < 100) ch.spawnT = Math.min(ch.spawnT, cfg.CROWD_SPAWN_GAP); // (a huge spawnT = arrivals switched off, used by the self-tests)
      }
      ch.spawnT -= dt;
      if (ch.spawnT <= 0) {
        if (C.hasRoom(counter) && rate > 0) {
          C.spawn(game, id);
          ch.spawnT += (1 / rate) * game.rng.range(1 - cfg.SPAWN_JITTER, 1 + cfg.SPAWN_JITTER);
          if (ch.spawnT < 0) ch.spawnT = 0;
        } else ch.spawnT = 0;
      }
    }
    // behaviour
    for (let i = game.customers.length - 1; i >= 0; i--) {
      const c = game.customers[i], ch = game.chains[c.chain], counter = ch.counter;
      c.waitT += dt;
      if (c.state === 'walk') {
        if (walk(c, dt)) {
          if (c.goal === 'line') { c.state = 'line'; c.facing = counter.lineSpots[c.line].face; }
          else if (c.goal === 'seat') {
            c.state = 'eat'; c.facing = c.seat.face;
            c.eatTotal = counter.tableSpec(c.table).eat; c.eatT = c.eatTotal;
            game.emit('sit', { c: c });
          }
          else if (c.goal === 'exit') { game.customers.splice(i, 1); game.emit('customerLeave', { c: c }); continue; }
        }
      } else c.moving = false;

      // patience: only while waiting in line without food
      if (c.line >= 0 && c.line < cfg.PATIENCE_SPOTS && c.got === 0 && (c.state === 'line' || c.goal === 'line') && (game.guide.done || cfg.PATIENCE_DURING_GUIDE) && !counter.needsTables()) {
        c.lineWait += dt;
        if (!c.angry && c.lineWait >= cfg.ANGRY_AFTER) { c.angry = true; game.emit('angry', { c: c }); }
        if (c.lineWait >= cfg.ANGRY_AFTER + cfg.LEAVE_AFTER) {
          const at = c.line;
          c.gaveUp = true; c.angry = true; c.line = -1;
          closeGap(game, counter, at);
          game.stats.left++;
          game.emit('gaveUp', { c: c });
          sendToExit(game, c, counter);
          continue;
        }
      }

      if (c.state === 'line' && c.line === 0) {
        // takes food one after another, but only while someone stands in the cashier spot
        c.waitTable = counter.needsTables(); // new wing, no table yet: he waits and buys nothing
        if (!c.waitTable && counter.stack > 0 && c.got < c.order && counter.staffed(game)) {
          c.t -= dt;
          while (c.t <= 0 && counter.stack > 0 && c.got < c.order) {
            counter.stack--; c.got++; c.angry = false;
            game.emit('take', { c: c, key: counter.id });
            c.t += cfg.SERVE_INTERVAL;
          }
        } else c.t = 0;
        if (c.got >= c.order) {
          if (!counter.tables.length) { c.state = 'happy'; c.happyT = cfg.HAPPY_TIME; game.emit('happy', { c: c }); } // take-away
          else {
            const found = counter.freeSeat();
            if (found) {
              c.waitSeat = false;
              pay(game, c, counter);
              game.emit('happy', { c: c, seat: true });
              closeGap(game, counter, 0);
              c.line = -1;
              sendToSeat(game, c, found);
            } else c.waitSeat = true; // holds the food and waits for a clean seat; the line doesn't move
          }
        }
      } else if (c.state === 'happy') {
        c.happyT -= dt;
        if (c.happyT <= 0) {
          pay(game, c, counter);
          closeGap(game, counter, 0);
          c.line = -1;
          sendToExit(game, c, counter);
        }
      } else if (c.state === 'eat') {
        c.eatT -= dt;
        if (c.eatT <= 0) {
          const t = c.table, seat = c.seat;
          seat.user = null; seat.dirty = true;
          const tip = Math.max(1, Math.round(c.bill * counter.tableSpec(t).tip));
          t.tip.amount += tip; t.tip.bills += 1;          game.emit('tip', { c: c, amount: tip, table: t, key: counter.id });
          game.emit('dirty', { table: t, chain: c.chain });
          sendToExit(game, c, counter);
          c.got = 0;
        }
      }
    }
  };

  C.Customer = Customer;
})(window.TBS = window.TBS || {});

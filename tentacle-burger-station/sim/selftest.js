/* Rule checks for the real game code (node). Prints PASS/FAIL per rule. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

globalThis.window = globalThis;
const root = path.join(__dirname, '..');
const files = ['js/config.js', 'js/core/util.js', 'js/core/nav.js', 'js/core/economy.js', 'js/core/stations.js',
  'js/core/customers.js', 'js/core/workers.js', 'js/core/player.js', 'js/core/guide.js', 'js/core/offers.js', 'js/core/game.js', 'sim/bot.js', 'js/cg.js', 'js/save.js'];
for (const f of files) if (fs.existsSync(path.join(root, f))) vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });

const TBS = window.TBS, CFG = TBS.CONFIG;
let fails = 0, passes = 0;
function check(name, ok, info) {
  if (ok) { passes++; console.log('PASS  ' + name + (info ? '  (' + info + ')' : '')); }
  else { fails++; console.log('FAIL  ' + name + (info ? '  (' + info + ')' : '')); }
}
// Every wing now starts EMPTY. Most checks below are about the running station, so newGame() builds Wing 1's
// basics for free (like the old start); newGame({ empty: true }) gives the real empty start.
const BASICS1 = ['b_src1', 'b_m1', 'b_ctr1', 'b_bin1', 'b_chef1', 'b_hire1', 'b_term1'];
const BASICS2 = ['b_src2', 'b_m2', 'b_ctr2', 'b_bin2', 'b_chef2', 'b_hire2', 'b_term2'];
function buildFree(g, ids) { for (const id of ids) { g.tracks[id] = 1; g.applyBuild(id, true); } g.rebuildWorld(); g.offersDirty = true; }
function newGame(opts) {
  const g = new TBS.Game(CFG, Object.assign({ seed: 777 }, opts || {}));
  if (!(opts && (opts.empty || opts.save))) buildFree(g, BASICS1);
  return g;
}
const NONE = { x: 0, z: 0, mag: 0 };

// 1) walking through a pickup circle at full speed picks up nothing
(function () {
  const g = newGame(), p = g.player, pad = g.chains.p.source;
  p.x = pad.circle.x; p.z = 6.2; p.vx = 0; p.vz = 0;
  const before = pad.pile;
  for (let i = 0; i < 90; i++) g.update(1 / 60, { x: 0, z: 1, mag: 1 });
  check('full-speed walk through the pad circle picks up nothing', p.stack.length === 0 && pad.pile >= before, 'carried ' + p.stack.length + ', walked to z=' + p.z.toFixed(1));
})();

// 2) stopping 0.3 s picks up, then one every 0.08 s
(function () {
  const g = newGame(), p = g.player, pad = g.chains.p.source;
  p.x = pad.circle.x; p.z = pad.circle.z; p.vx = 0; p.vz = 0;
  let t = 0;
  while (t < 0.28) { g.update(1 / 120, NONE); t += 1 / 120; }
  const early = p.stack.length;
  while (t < 0.32) { g.update(1 / 120, NONE); t += 1 / 120; }
  const first = p.stack.length;
  while (t < 0.32 + 0.08 * 4 + 0.01) { g.update(1 / 120, NONE); t += 1 / 120; }
  check('stop 0.3 s -> pickup starts, then 1 per 0.08 s', early === 0 && first === 1 && p.stack.length === 5, 'at 0.28s:' + early + ' at 0.32s:' + first + ' at 0.65s:' + p.stack.length);
})();

// 3) return pad returns only that station's items
(function () {
  const g = newGame(), p = g.player, pad = g.chains.p.source;
  p.stack = [{ id: 1, type: 'tentacle' }, { id: 2, type: 'burger' }, { id: 3, type: 'tentacle' }];
  const before = pad.pile;
  p.x = pad.ret.x; p.z = pad.ret.z; p.vx = 4; p.vz = 0; // even while moving
  g.update(1 / 60, { x: 1, z: 0, mag: 1 });
  check('return pad returns all tentacles instantly, keeps the burger', pad.pile === before + 2 && p.stack.length === 1 && p.stack[0].type === 'burger');
})();

// 4) drops are instant
(function () {
  const g = newGame(), p = g.player, m = g.chains.p.machines[0];
  p.stack = [1, 2, 3, 4, 5].map((i) => ({ id: i, type: 'tentacle' }));
  p.x = m.inZone.x; p.z = m.inZone.z; p.vx = 5; p.vz = 0;
  g.update(1 / 60, { x: 1, z: 0, mag: 1 });
  check('passing the machine drop zone drops all tentacles at once', m.input === 5 && p.stack.length === 0);
})();

// 5) early-phase level-ups never pause and give the reward automatically
(function () {
  const g = newGame();
  const m0 = g.money;
  g.addXp(g.xpForLevel(2) - g.xp);
  const ev = g.drainEvents().find((e) => e.type === 'levelup');
  check('level-up during the guide: no panel, reward given automatically', ev && ev.data.auto && !g.pendingLevel && g.money > m0, 'reward $' + (g.money - m0));
  g.guide.done = true; g.playTime = CFG.EARLY_PHASE_SECONDS - 1;
  check('still early before 5 min of play', g.isEarlyPhase() && !g.midgameAllowed() && !g.adReady('levelup'));
  check('Boost ads do not wait for the first 5 minutes (ready on first use)', ['speed', 'items', 'worker', 'cash'].every((k) => g.adReady(k) && g.adWait(k) === 0));
  g.playTime = CFG.EARLY_PHASE_SECONDS + 1;
  const m1 = g.money;
  g.addXp(g.xpForLevel(g.level + 1) - g.xp);
  const ev2 = g.drainEvents().find((e) => e.type === 'levelup');
  check('after guide + 5 min: level-up opens a paused panel (reward waits for Claim)', ev2 && !ev2.data.auto && g.pendingLevel && g.money === m1);
  const gemsBefore = g.gems;
  const got = g.claimLevel(3);
  check('Claim x3 gives three times the reward', got === ev2.data.reward * 3 && !g.pendingLevel);
  check('level panel gems arrive on Claim (not before), x3 with the ad', g.gems === gemsBefore + CFG.GEM_PER_LEVEL * 3, 'gems ' + gemsBefore + ' -> ' + g.gems);
})();

// 6) ad cooldowns and midgame gating
(function () {
  let wall = 1e12;
  const g = newGame({ nowMs: () => wall });
  g.guide.done = true; g.playTime = 400; g.level = 2;
  check('no midgame below level 3', !g.midgameAllowed());
  g.level = 3;
  check('midgame allowed from level 3 after the first 5 minutes', g.midgameAllowed());
  check('ad option ready', g.adReady('speed'));
  g.startAdCooldown('speed');
  wall += 179 * 1000;
  check('ad option waits 3 minutes', !g.adReady('speed') && g.adWait('speed') > 0 && g.adReady('items'));
  wall += 2000;
  check('ad option ready again after 3 minutes', g.adReady('speed'));
  g.startAdCooldown('levelup');
  check('level-up "Claim x3" ad has no 3-minute wait (only the Boost ads do)', g.adReady('levelup'), 'ready right after use: ' + g.adReady('levelup'));
})();

// 7) demand = 1.3 x capacity
(function () {
  const keepCrowd = CFG.CROWD_FILL; CFG.CROWD_FILL = 0; // the base demand alone (the "always a crowd" rule is tested in 7k)
  const g = newGame();
  g.player.x = 8; g.player.z = 16;
  const cap = g.chainCapacity('p'), dur = 1200;
  let spawned = 0;
  for (let t = 0; t < dur; t += 0.05) {
    const before = g.customers.length;
    g.update(0.05, NONE);
    spawned += Math.max(0, g.customers.length - before);
    // keep room: send everyone home instantly
    const c = g.chains.p.counter;
    c.line.fill(null); g.customers.length = 0;
  }
  const expected = CFG.DEMAND_FACTOR * cap / ((CFG.ORDER_MIN + CFG.ORDER_MAX) / 2) * dur;
  check('customers arrive at ' + CFG.DEMAND_FACTOR + 'x what the machines can make', Math.abs(spawned - expected) / expected < 0.08, spawned + ' arrived, expected ~' + Math.round(expected));
  CFG.CROWD_FILL = keepCrowd;
})();

// 7b) one single-file line: spots evenly spaced, never on top of each other
(function () {
  const g = newGame(), c = g.chains.p.counter, s = c.lineSpots;
  let ok = s.length >= c.lineCap(), minGap = 99, maxGap = 0;
  for (let i = 1; i < s.length; i++) {
    const d = Math.hypot(s[i].x - s[i - 1].x, s[i].z - s[i - 1].z);
    minGap = Math.min(minGap, d); maxGap = Math.max(maxGap, d);
  }
  ok = ok && minGap > CFG.LAYOUT.LINE_SPACING * 0.7 && maxGap < CFG.LAYOUT.LINE_SPACING * 1.3;
  check('single-file line: every place is one step behind the one before', ok, s.length + ' places, gaps ' + minGap.toFixed(2) + '-' + maxGap.toFixed(2));
})();

// 7c) an alien with no food gets angry after ANGRY_AFTER, leaves LEAVE_AFTER later, and leaving costs nothing
(function () {
  const g = newGame(); g.guide.done = true; g.purchase('t1_0'); // (with a table: without one aliens just wait calmly)
  const counter = g.chains.p.counter;
  counter.stack = 0; g.chains.p.active = false; // nobody new, no food
  g.customers.length = 0; counter.line.fill(null);
  const c = TBS.Customers.spawn(g, 'p', { atSpot: true });
  const m0 = g.money;
  let angryAt = -1, leftAt = -1, t = 0;
  while (t < CFG.ANGRY_AFTER + CFG.LEAVE_AFTER + 2) {
    g.update(0.05, NONE); t += 0.05;
    if (angryAt < 0 && c.angry) angryAt = t;
    if (leftAt < 0 && c.gaveUp) leftAt = t;
  }
  check('angry after ~' + CFG.ANGRY_AFTER + ' s, leaves ~' + CFG.LEAVE_AFTER + ' s later, costs nothing',
    Math.abs(angryAt - CFG.ANGRY_AFTER) < 0.2 && Math.abs(leftAt - CFG.ANGRY_AFTER - CFG.LEAVE_AFTER) < 0.2 && g.money === m0 && g.stats.left === 1,
    'angry at ' + angryAt.toFixed(1) + ' s, left at ' + leftAt.toFixed(1) + ' s');
})();

// 7d) machines hold 20 inputs; after the guide only 2 build circles at once
(function () {
  const g = newGame(), m = g.chains.p.machines[0];
  check('machine input holds ' + CFG.MACHINE_LEVELS[0].input, m.inputMax === 20, 'input max ' + m.inputMax);
  g.guide.done = true; g.money = 0; g.rebuildWorld(); g.refreshOffers();
  const ids = g.offers.map((o) => o.trackId);
  check('after the guide: exactly ' + CFG.BUILD_CIRCLES_AT_ONCE + ' build circles', g.offers.length === CFG.BUILD_CIRCLES_AT_ONCE, ids.join(', '));
})();

// 7e) desks: chef + worker upgrades cost gems, hiring costs money; no level progress; 10 levels then MAX; max 5 workers per wing
(function () {
  const g = newGame(); g.money = 1e6; g.gems = 1e6;
  const xp0 = g.xp, cap0 = g.player.capacity(g);
  let n = 0; while (g.buyChef('carry')) n++;
  for (const k of ['speed', 'profit']) while (g.buyChef(k)) n++;
  check('Chef Desk: 10 levels each then MAX, no level progress', g.chef.carry === 10 && g.chef.speed === 10 && g.chef.profit === 10 && g.chefPrice('carry') === null && g.xp === xp0 && g.player.capacity(g) > cap0, n + ' buys, carry ' + cap0 + ' -> ' + g.player.capacity(g) + ', xp ' + g.xp);
  let h = 0; while (g.hire(1)) h++;
  const ws = TBS.Workers.hired(g, 'p');
  g.upgradeWorker(ws[0], 'speed'); g.upgradeWorker(ws[0], 'speed'); g.upgradeWorker(ws[1], 'cap');
  check('Hire Desk: max ' + CFG.WORKERS_PER_WING + ' per wing, each worker has his own speed / capacity', h === CFG.WORKERS_PER_WING && ws[0].sp === 2 && ws[0].cap === 0 && ws[1].cap === 1 && ws[2].sp === 0 && g.xp === xp0 && TBS.Workers.speed(g, ws[0]) > TBS.Workers.speed(g, ws[2]), h + ' hired');
})();

// 7f) level progress only from station builds; Wing 2 opens at 12/12 (10 tables + 2 machines)
(function () {
  const g = newGame(); g.guide.done = true; g.playTime = 999;
  g.onSale('p', 10, 50);
  const xpSale = g.xp;
  g.purchase('t1_0');
  check('every alien served gives a bit of level progress, a station build gives more', Math.abs(xpSale - CFG.XP_PER_SALE) < 1e-9 && Math.abs(g.xp - CFG.XP_PER_SALE - CFG.XP_PER_BUILD) < 1e-9, 'after sale ' + xpSale + ', after build ' + g.xp);
  for (let i = 1; i < 10; i++) g.purchase('t1_' + i);
  const before = g.drainEvents().some((e) => e.type === 'wing2Ready');
  check('11/12 built: Wing 2 still closed', !before && !g.wing2Pending && g.wing1Built() === 11, 'built ' + g.wing1Built() + '/12');
  g.purchase('machine2');
  const ready = g.drainEvents().some((e) => e.type === 'wing2Ready');
  check('12/12 built: Wing 2 opens', ready && g.wing2Pending && g.wing1Built() === 12);
})();

// 7g) selling only while someone stands in the cashier spot
(function () {
  const g = newGame(), ct = g.chains.p.counter, p = g.player;
  g.purchase('t1_0'); // aliens only buy when there is a table
  g.chains.p.active = true; g.customers.length = 0; ct.line.fill(null); ct.stack = 6;
  g.chains.p.spawnT = 999;
  TBS.Customers.spawn(g, 'p', { atSpot: true, order: 2 });
  p.x = 3; p.z = 14;
  for (let i = 0; i < 60; i++) g.update(1 / 60, NONE);
  const away = ct.stack;
  p.x = ct.cashier.x; p.z = ct.cashier.z;
  for (let i = 0; i < 60; i++) g.update(1 / 60, NONE);
  const there = ct.stack;
  check('no cashier: nothing sells while nobody stands in the cashier spot; sells when you stand there', away === 6 && there === 4, 'counter ' + away + ' -> ' + there);
  const g2 = newGame(), c2 = g2.chains.p.counter;
  g2.purchase('t1_0');
  g2.customers.length = 0; c2.line.fill(null); c2.stack = 6; g2.chains.p.spawnT = 999; c2.hasCashier = true;
  TBS.Customers.spawn(g2, 'p', { atSpot: true, order: 3 });
  g2.player.x = 3; g2.player.z = 14;
  for (let i = 0; i < 60; i++) g2.update(1 / 60, NONE);
  check('a bought cashier sells by himself', c2.stack === 3, 'counter 6 -> ' + c2.stack);
})();

// 7h) dine-in: food -> free clean seat -> eat -> leftovers + tip; no clean seat -> waits holding food, line doesn't move
(function () {
  const g = newGame(), ch = g.chains.p, ct = ch.counter;
  g.customers.length = 0; ct.line.fill(null); ch.spawnT = 999; ct.hasCashier = true;
  g.purchase('t1_2');                       // one table with one seat
  ct.stack = 10;
  const a = TBS.Customers.spawn(g, 'p', { atSpot: true, order: 1 });
  const b = TBS.Customers.spawn(g, 'p', { atSpot: true, order: 1 });
  g.player.x = 3; g.player.z = 14;
  let t = 0, ateAt = -1;
  while (t < 20 && ateAt < 0) { g.update(0.05, NONE); t += 0.05; if (ct.tables[0].seats[0].dirty) ateAt = t; }
  const tip = ct.tables[0].tip.amount;
  const bWaits = b.line === 0 && b.got === 1 && b.waitSeat;
  check('alien eats at a clean seat, leaves leftovers and a tip on the floor', ateAt > 0 && tip > 0 && a.goal === 'exit', 'dirty after ' + ateAt.toFixed(1) + ' s, tip $' + tip);
  check('no clean seat: the next alien holds his food and waits; the line does not move', bWaits, 'b line ' + b.line + ', got ' + b.got + ', waiting ' + b.waitSeat);
  // the chef cleans: 0.3 s stop inside the ring around the table
  const tb = ct.tables[0];
  g.player.x = tb.work.x; g.player.z = tb.work.z; g.player.vx = g.player.vz = 0;
  for (let i = 0; i < 6; i++) g.update(1 / 60, NONE);
  check('the chef cleans a table the moment he stops in its ring (within 0.1 s)', !tb.seats[0].dirty, 'after 0.1 s: dirty=' + tb.seats[0].dirty);
  for (let i = 0; i < 6; i++) g.update(1 / 60, NONE);
  // trash: the dirty plate is now on the tray; no food can be picked up until it is in the bin
  const pl = g.player, plates = pl.count('plate'), src = ch.source;
  src.pile = 8; pl.x = src.circle.x; pl.z = src.circle.z;
  for (let i = 0; i < 40; i++) g.update(1 / 60, NONE);
  const blocked = pl.count('tentacle') === 0;
  const bin = g.cfg.LAYOUT.W1.bin.drop; pl.x = bin.x; pl.z = bin.z; g.update(1 / 60, NONE);
  check('cleaning puts the dirty plate on the tray; food pickup waits until it is thrown in the bin', plates === 1 && blocked && pl.count('plate') === 0, 'plates ' + plates + ', tentacles while holding trash ' + (blocked ? 0 : '>0') + ', plates after bin ' + pl.count('plate'));
  tb.seats[0].dirty = true; g.rebuildZones();
  pl.stack.push({ id: 9999, type: 'burger' }); pl.x = tb.work.x; pl.z = tb.work.z;
  for (let i = 0; i < 40; i++) g.update(1 / 60, NONE);
  check('food on the tray: the chef cannot clean (food and trash never share the tray)', tb.seats[0].dirty && pl.count('plate') === 0, 'dirty=' + tb.seats[0].dirty);
  pl.stack.length = 0;
  g.player.x = tb.tip.x; g.player.z = tb.tip.z;
  tb.tip.amount = 60;
  const m0 = g.money; g.update(1 / 60, NONE);
  const first = g.money - m0;
  for (let i = 0; i < 120; i++) g.update(1 / 60, NONE);
  check('standing at a $60 tip pile: it flies to you bit by bit, then all of it', first > 0 && first < 60 && g.money === m0 + 60 && tb.tip.amount === 0, 'first frame +$' + first + ', after 2 s +$' + (g.money - m0) + ' (earned tip $' + tip + ')');
})();

// 7i) workers: starving machine > empty counter > dirty table; counter storage limits drops
(function () {
  const g = newGame(), ch = g.chains.p, ct = ch.counter, m1 = ch.machines[0];
  g.customers.length = 0; ct.line.fill(null); ch.spawnT = 999;
  g.purchase('t1_0'); ct.tables[0].seats[0].dirty = true; g.rebuildZones();
  ch.source.pile = 10; m1.input = 0; m1.output = 5; ct.stack = 0;
  g.money = 1e5; g.hire(1);
  const ws = TBS.Workers.hired(g, 'p');
  g.update(1 / 60, NONE);
  const first = ws[0].job && ws[0].job.type;
  g.hire(1); g.update(1 / 60, NONE);
  const second = TBS.Workers.hired(g, 'p')[1].job;
  g.hire(1); g.update(1 / 60, NONE);
  const third = TBS.Workers.hired(g, 'p')[2].job;
  const jobs = [first, second && second.type, third && third.type];
  check('workers take jobs by priority: starving machine, then empty counter, then dirty table (one worker per job)', jobs.join(',') === 'feed,serve,clean', jobs.join(', '));
  { // the cleaning worker carries the plate to the bin before taking another job
    const w = TBS.Workers.hired(g, 'p')[2];
    let held = 0, binned = false;
    for (let i = 0; i < 60 * 30 && !binned; i++) {
      g.update(1 / 60, NONE);
      held = Math.max(held, w.stack.filter((it) => it.type === 'plate').length);
      for (const e of g.drainEvents()) if (e.type === 'drop' && e.data.kind === 'bin' && e.data.w === w) binned = true;
    }
    check('a worker cleans, carries the dirty plate and throws it in the bin', held === 1 && binned && !ct.tables[0].seats[0].dirty, 'held ' + held + ', binned ' + binned);
  }
  const g2 = newGame(), c2 = g2.chains.p.counter, p = g2.player;
  g2.customers.length = 0; c2.line.fill(null); g2.chains.p.spawnT = 999; // nobody buys during this check
  p.stack = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, type: 'burger' }));
  c2.stack = c2.max() - 3;
  p.x = c2.drop.x; p.z = c2.drop.z; g2.update(1 / 60, NONE);
  check('counter holds only ' + c2.max() + ' (the rest stays on your tray)', c2.stack === c2.max() && p.stack.length === 17, 'counter ' + c2.stack + ', tray ' + p.stack.length);
})();

// 7k) owner revision: crowd, counter area, workers sell / never stuck, terminal glitch, gems, per-table upgrades, per-wing circles
const evs = (g, type) => g.drainEvents().filter((e) => e.type === type);
(function () { // always a crowd: even when served instantly, the line stays >= 75% full
  const g = newGame(); g.guide.done = true;
  const ct = g.chains.p.counter, cap = ct.lineCap();
  let low = 0, n = 0, k = 0;
  for (let t = 0; t < 120; t += 0.05) {
    g.update(0.05, NONE);
    const front = ct.line[0];
    if (front && front.state === 'line' && ++k % 5 === 0) { front.got = front.order; } // serve someone every 0.25 s (a very fast player)
    ct.stack = 0;
    if (t > 30) { n++; if (TBS.Customers.waiting(ct) < Math.floor(cap * CFG.CROWD_FILL) - 1) low++; }
  }
  check('always a crowd: the line stays at least ' + Math.round(CFG.CROWD_FILL * 100) + '% full even when you serve fast', low / n < 0.05, Math.round(100 * low / n) + '% of the time below');
})();
(function () { // counter: put food on it and sell from anywhere around it
  const g = newGame(), ct = g.chains.p.counter, p = g.player;
  g.purchase('t1_0');
  g.customers.length = 0; ct.line.fill(null); g.chains.p.spawnT = 999; ct.stack = 0;
  p.stack = [{ id: 901, type: 'burger' }, { id: 902, type: 'burger' }];
  p.x = ct.rect.x1 + 0.9; p.z = ct.rect.z0 - 0.6; // kitchen side, right end, nowhere near the old circles
  g.update(1 / 60, NONE);
  const dropped = ct.stack === 2 && p.stack.length === 0;
  TBS.Customers.spawn(g, 'p', { atSpot: true, order: 1 });
  for (let i = 0; i < 30; i++) g.update(1 / 60, NONE);
  check('food goes on the counter and sells from anywhere around it (not only on the circles)', dropped && ct.stack === 1, 'dropped ' + dropped + ', counter ' + ct.stack);
})();
(function () { // workers sell when nobody is at the counter; a worker never stands at a full machine forever
  const g = newGame(), ch = g.chains.p, ct = ch.counter;
  g.purchase('t1_0');
  g.customers.length = 0; ct.line.fill(null); ch.spawnT = 999; ct.stack = 6;
  g.money = 1e5; g.hire(1);
  const w = TBS.Workers.hired(g, 'p')[0];
  TBS.Customers.spawn(g, 'p', { atSpot: true, order: 3 });
  g.player.x = 3; g.player.z = 16;
  let sold = 0;
  for (let i = 0; i < 60 * 20 && !sold; i++) { g.update(1 / 60, NONE); if (ct.stack < 6) sold = 1; }
  check('a worker goes to the counter and sells when you are not there', sold && (w.selling || ct.stack < 6), 'counter 6 -> ' + ct.stack + ', worker job ' + (w.job && w.job.type));
  const g2 = newGame(), c2 = g2.chains.p, m = c2.machines[0];
  g2.customers.length = 0; c2.counter.line.fill(null); c2.spawnT = 999;
  g2.money = 1e5; g2.hire(1);
  const w2 = TBS.Workers.hired(g2, 'p')[0];
  m.input = m.inputMax; m.output = m.outputMax; // input full and output full: it stops cooking
  w2.stack = [{ id: 951, type: 'tentacle' }, { id: 952, type: 'tentacle' }];
  w2.job = { id: 'feed:m1', type: 'feed', m: m }; w2.phase = 'toMachine'; w2.target = m;
  let back = false;
  for (let i = 0; i < 60 * 20 && !back; i++) { g2.update(1 / 60, NONE); if (!w2.stack.length) back = true; }
  check('a worker at a full machine puts the ingredients back and goes to other work (never stuck)', back, 'still holding ' + w2.stack.length);
})();
(function () { // Boost / Chef / Hire circles: walking a bit and stopping again reopens (no idle spinning ring)
  const g = newGame(); g.guide.done = true; g.rebuildWorld();
  const c = CFG.LAYOUT.W1.terminal.circle, p = g.player;
  p.x = c.x; p.z = c.z;
  for (let i = 0; i < 30; i++) g.update(1 / 60, NONE);
  const first = evs(g, 'terminalOpen').length;
  // panel closed with the player still on the circle; he takes a few steps inside it and stops again
  for (let i = 0; i < 20; i++) g.update(1 / 60, { x: 1, z: 0, mag: 1 });
  p.x = c.x; p.z = c.z;
  for (let i = 0; i < 40; i++) g.update(1 / 60, NONE);
  const again = evs(g, 'terminalOpen').length;
  check('Boost / Chef / Hire circle opens again after walking a bit and stopping (no stuck ring)', first === 1 && again === 1, 'first ' + first + ', again ' + again);
})();
(function () { // gems from levels; every upgrade step costs MONEY; after paying: keep it, or HOT for gems / an ad
  const E = TBS.Economy, g = newGame(); g.guide.done = true; g.playTime = 999;
  const g0 = g.gems;
  g.addXp(g.xpForLevel(5) - g.xp); // levels 2..5 (level 5 brings the extra gems)
  g.claimLevel(1); // level gems come with "Claim"
  const afterLv = g.gems, want = g0 + 4 * CFG.GEM_PER_LEVEL + CFG.GEM_EVERY_5_LEVELS;
  check('gems: ' + CFG.GEM_START + ' at start, +' + CFG.GEM_PER_LEVEL + ' per level, +' + CFG.GEM_EVERY_5_LEVELS + ' more on every 5th level', g0 === CFG.GEM_START && afterLv === want, 'start ' + g0 + ', after levels 2-5: ' + afterLv + ' (want ' + want + ')');
  // every step of every upgrade costs money, never less than its list price
  const ups = Object.keys(g.trackDefs).filter((id) => g.trackDefs[id].kind === 'upgrade');
  const gemSteps = ups.filter((id) => g.trackDefs[id].steps.some((s) => s.gems));
  check('every machine / tank / counter / table upgrade step costs money (no gem circles on the floor)', gemSteps.length === 0 && ups.length > 20, ups.length + ' upgrades, gem steps: ' + gemSteps.length);
  // price follows income, and stays fixed once the circle is on the floor
  const low = E.priceOf(g, 'm1up', 0);
  g.incomeEma = 50; // $50 a second
  const rich = E.priceOf(g, 'm1up', 0);
  E.lockPrice(g, 'm1up');
  g.incomeEma = 500;
  const locked = E.priceOf(g, 'm1up', 0);
  check('an upgrade costs about ' + CFG.UPGRADE_INCOME_SECONDS + ' s of income (never below its list price), fixed once its circle appears',
    low >= CFG.TRACK_PRICES.m1up[0] && rich === TBS.U.niceRound(50 * CFG.UPGRADE_INCOME_SECONDS) && locked === rich, 'list ' + low + ', rich ' + rich + ', after income x10 still ' + locked);
  // pay -> the choice panel; keep the normal one
  g.money = 1e6; g.drainEvents();
  g.purchase('m1up');
  const asked = !!g.pendingChoice && g.drainEvents().some((e) => e.type === 'upgradeChoice');
  g.keepNormal();
  const m = g.chains.p.machines[0], cookNormal = m.cookTime();
  // next step: HOT with gems
  g.gems = 10; g.purchase('m1up');
  const price1 = E.hotGems(CFG, 1), okGems = g.chooseHot('gems');
  const cookHot = m.cookTime(), base = CFG.MACHINE_LEVELS[2].cook;
  // next step: HOT with an ad (no gems needed, no timer after it)
  g.gems = 0; g.purchase('m1up');
  const okAd = g.chooseHot('ad'), adAgain = g.adReady('upgrade');
  // without gems the gem button does nothing
  g.purchase('m1up'); const noGems = g.chooseHot('gems'); g.keepNormal();
  check('after paying an upgrade: a panel asks "normal or HOT"; HOT costs ' + CFG.GEM_UPGRADE_PRICES.join('/') + ' gems or one ad (no timer), and really is stronger',
    asked && okGems && g.hot.m1up === 2 && okAd && adAgain && !noGems && Math.abs(cookHot - base / (1 + CFG.PREMIUM.machine.speed)) < 1e-9 && cookNormal > cookHot,
    'asked ' + asked + ', gems ' + okGems + ' (' + price1 + '), ad ' + okAd + ', HOT picks ' + g.hot.m1up + ', cook ' + cookNormal.toFixed(2) + ' s -> HOT ' + cookHot.toFixed(2) + ' s');
  const lv = g.levelOf('m1up');
  check('a thing with a HOT upgrade gets a gold label with a star; the last level shows MAX', lv.hot === 2 && lv.lv === lv.max, 'Lv ' + lv.lv + '/' + lv.max + ', hot ' + lv.hot);
  // HOT table: bigger tip, eats faster; HOT pad: faster
  g.purchase('t1_0'); g.purchase('tu1_0'); g.chooseHot('ad');
  const tb = g.chains.p.counter.tables[0], sp = g.chains.p.counter.tableSpec(tb), T1 = CFG.TABLE_LEVELS[1];
  check('a HOT table upgrade: more tip and faster eating than the normal one', sp.tip > T1.tip && sp.eat < T1.eat, 'tip ' + sp.tip + ' vs ' + T1.tip + ', eat ' + sp.eat + ' vs ' + T1.eat);
  // save -> load keeps the HOT upgrades
  const back = new TBS.Game(CFG, { seed: 1, save: JSON.parse(JSON.stringify(g.serialize())) });
  check('HOT upgrades survive save -> load', back.hot.m1up === 2 && Math.abs(back.chains.p.machines[0].cookTime() - m.cookTime()) < 1e-9 && back.chains.p.counter.tables[0].hot === 1, 'm1up hot ' + back.hot.m1up + ', table hot ' + back.chains.p.counter.tables[0].hot);
  // chef: gems only; workers: gems or an ad with a 3-minute timer
  const c0 = g.gems = 20; g.money = 1e6; g.buyChef('speed');
  check('Chef skills cost gems only (Profit the most expensive)', g.gems === c0 - CFG.CHEF_PRICES.speed[0] && g.money === 1e6 && CFG.CHEF_PRICES.profit.every((p, i) => p > CFG.CHEF_PRICES.speed[i]), 'gems ' + c0 + ' -> ' + g.gems);
  g.hire(1); const w = TBS.Workers.hired(g, 'p')[0];
  const a1 = g.upgradeWorkerByAd(w, 'speed'), ready = g.adReady('workerUp'), wait = g.adWait('workerUp');
  // one button per worker: speed and capacity in turns, up to MAX
  g.hire(1); const w2 = TBS.Workers.hired(g, 'p')[1], order = [];
  g.gems = 999;
  while (g.workerNext(w2)) { order.push(g.workerNext(w2)); g.upgradeWorkerNext(w2); }
  const turns = order.slice(0, 4).join(',');
  check('worker card: one button upgrades speed, capacity, speed, capacity... until both are MAX', turns === 'speed,cap,speed,cap' && w2.sp === CFG.WORKER_UP_PRICES.speed.length && w2.cap === CFG.WORKER_UP_PRICES.cap.length && g.workerNextPrice(w2) === null,
    'first presses: ' + turns + ' | speed Lv ' + w2.sp + ', capacity Lv ' + w2.cap);
  check('a worker upgrade can be taken with an ad, then that ad waits ' + CFG.WORKER_AD_COOLDOWN + ' s', a1 && w.sp === 1 && !ready && Math.abs(wait - CFG.WORKER_AD_COOLDOWN) < 1, 'speed Lv ' + w.sp + ', ad ready again in ' + Math.round(wait) + ' s');
})();
(function () { // every table upgrades on its own, with its own circle next to it
  const g = newGame(); g.guide.done = true;
  g.purchase('t1_0'); g.purchase('t1_1');
  const ts = g.chains.p.counter.tables;
  const o = TBS.Economy.nextStep(g, 'tu1_0'), tb = ts.find((t) => t.idx === 0);
  g.purchase('tu1_0');
  const other = ts.find((t) => t.idx === 1);
  const d = Math.hypot(o.x - tb.x, o.z - tb.z);
  check('each table upgrades on its own (its circle is right next to it); the others stay', tb.level === 1 && other.level === 0 && d < 3 && !g.trackDefs.tup1, 'table 1 Lv ' + (tb.level + 1) + ', table 2 Lv ' + (other.level + 1) + ', circle ' + d.toFixed(1) + ' from the table');
})();
(function () { // each wing has its own 2 circles; the new wing starts with tables; its machines wait for tables
  const g = newGame(); g.guide.done = true; g.money = 0;
  for (let i = 0; i < 10; i++) g.purchase('t1_' + i);
  g.purchase('machine2');
  g.openWing2(); for (let i = 0; i < 60 * 5; i++) g.update(1 / 60, NONE);
  g.refreshOffers();
  const first = g.offers.filter((o) => o.wing === 2).map((o) => o.trackId);
  const empty = !g.chains.g.source.built && !g.chains.g.machines[0].built && !g.chains.g.counter.built;
  for (const id of ['b_src2', 'b_m2', 'b_ctr2']) g.purchase(id);
  g.refreshOffers();
  const w1 = g.offers.filter((o) => o.wing === 1), w2 = g.offers.filter((o) => o.wing === 2);
  // after the basics: a table first; the 2nd circle may be the bin (to clean tables) or the hire desk; never a machine upgrade
  const tablesFirst = w2.length > 0 && g.trackDefs[w2[0].trackId].table !== undefined && w2.every((o) => g.trackDefs[o.trackId].table !== undefined || o.trackId === 'b_bin2' || o.trackId === 'b_hire2');
  check('Wing 2 opens EMPTY: first circle = its tank; after tank + machine + counter a table first (+ bin / hire desk), no upgrades; Wing 1 keeps its own circles',
    empty && first.join(',') === 'b_src2' && w1.length >= 1 && w1.length <= CFG.BUILD_CIRCLES_AT_ONCE && w2.length >= 1 && w2.length <= CFG.BUILD_CIRCLES_AT_ONCE && tablesFirst,
    'empty ' + empty + ', first: ' + first.join(',') + ' | then wing 1: ' + w1.map((o) => o.trackId).join(',') + ' | wing 2: ' + w2.map((o) => o.trackId).join(','));
  const before = !!TBS.Economy.nextStep(g, 'g1up');
  for (let i = 0; i < CFG.WING2_TABLES_NEEDED.g1up[0]; i++) g.purchase('t2_' + i);
  const after = !!TBS.Economy.nextStep(g, 'g1up');
  check('Wing 2 machine upgrade waits until the wing has ' + CFG.WING2_TABLES_NEEDED.g1up[0] + ' tables', !before && after, 'before ' + before + ', after ' + after);
  check('a finished wing gives ' + CFG.GEM_WING_COMPLETE + ' gems', g.gems >= CFG.GEM_START + CFG.GEM_WING_COMPLETE, 'gems ' + g.gems);
})();
(function () { // after buying a step by standing on its circle, the NEXT step on the same spot never opens / charges by itself
  const ids = ['tu1_0', 'm1up', 'pad', 'c1up'];
  const bad = [];
  for (const id of ids) {
    const g = newGame(); g.guide.done = true; g.playTime = 999;
    g.customers.length = 0; g.chains.p.counter.line.fill(null); g.chains.p.spawnT = 999;
    g.purchase('t1_0'); g.gems = 50; g.money = 50000;
    g.batch = [{ id: id, step: 0 }]; g.refreshOffers();
    const o = g.offers.find((x) => x.trackId === id), p = g.player;
    p.x = o.x; p.z = o.z; p.vx = p.vz = 0; p.latched = null;
    g.drainEvents();
    let bought = false;
    for (let i = 0; i < 60 * 3 && !bought; i++) { g.update(1 / 60, NONE); if ((g.tracks[id] || 0) >= 1) bought = true; }
    g.keepNormal();
    g.batch = [{ id: id, step: 1 }]; g.refreshOffers(); // the next level appears on the same spot
    const moneyBefore = g.money;
    g.drainEvents(); // (the purchase we just made)
    for (let i = 0; i < 60 * 3; i++) g.update(1 / 60, NONE); // keep standing still on the same spot
    const opened = g.drainEvents().filter((e) => e.type === 'purchase').length, paidStill = moneyBefore - g.money;
    // now a small step and stop again: the next step is paid
    for (let i = 0; i < 8; i++) g.update(1 / 60, { x: 1, z: 0, mag: 1 });
    p.x = o.x; p.z = o.z;
    for (let i = 0; i < 60 * 3; i++) g.update(1 / 60, NONE);
    const later = g.drainEvents().filter((e) => e.type === 'purchase').length;
    if (!bought || opened !== 0 || paidStill > 0.01 || later !== 1) bad.push(id + '(bought ' + bought + ', bought again by itself ' + opened + ', paid while standing ' + Math.round(paidStill) + ', after a step ' + later + ')');
  }
  check('after an upgrade, the next level on the same spot waits until you step and stop again (tables, machines, pad, storage)', bad.length === 0, bad.length ? bad.join('; ') : ids.join(', ') + ' all ok');
})();
(function () { // a worker holding food at a FULL counter puts it back on the machine and cleans (no deadlock)
  const g = newGame(), ch = g.chains.p, ct = ch.counter;
  g.guide.done = true; g.customers.length = 0; ct.line.fill(null); ch.spawnT = 999;
  g.purchase('t1_0');
  ct.stack = ct.max(); ct.tables[0].seats.forEach((s) => { s.dirty = true; }); g.rebuildZones();
  g.money = 1e5; g.hire(1);
  const w = TBS.Workers.hired(g, 'p')[0], m = ch.machines[0];
  for (let i = 0; i < 4; i++) w.stack.push({ id: g.nextId++, type: 'burger' });
  w.job = { id: 'serve:c1', type: 'serve' }; w.phase = 'toCounter'; w.target = m; w.path = null;
  const out0 = m.output;
  g.player.x = 3; g.player.z = 20;
  let cleaned = false;
  for (let i = 0; i < 60 * 25 && !cleaned; i++) { g.update(1 / 60, NONE); if (!ct.tables[0].seats.some((s) => s.dirty)) cleaned = true; }
  check('a worker stuck with food at a full counter puts it back on the machine and goes to clean the tables', cleaned && m.output >= out0 + 4, 'cleaned ' + cleaned + ', machine output ' + out0 + ' -> ' + m.output);
})();
(function () { // a selling worker leaves the counter to clean when aliens can't sit (all seats dirty, someone waits with food)
  const g = newGame(), ch = g.chains.p, ct = ch.counter;
  g.guide.done = true; g.customers.length = 0; ct.line.fill(null); ch.spawnT = 999;
  g.purchase('t1_0');
  ct.tables[0].seats.forEach((s) => { s.dirty = true; }); g.rebuildZones();
  ct.stack = 8; g.money = 1e5; g.hire(1);
  const w = TBS.Workers.hired(g, 'p')[0];
  const a = TBS.Customers.spawn(g, 'p', { atSpot: true, order: 1 });
  TBS.Customers.spawn(g, 'p', { atSpot: true, order: 2 });
  g.player.x = 3; g.player.z = 20;
  let cleaned = false, sat = false;
  for (let i = 0; i < 60 * 30 && !(cleaned && sat); i++) {
    g.update(1 / 60, NONE);
    if (!ct.tables[0].seats.some((s) => s.dirty)) cleaned = true;
    if (a.state === 'eat' || a.goal === 'seat') sat = true;
  }
  check('a worker stops selling and cleans when every seat is dirty and an alien waits to sit', cleaned && sat, 'cleaned ' + cleaned + ', alien sat ' + sat + ', worker job ' + (w.job && w.job.type));
})();
(function () { // no more gems in tips; Boost speed x1.5; Boost cash can be bought with gems
  const g = newGame(); g.guide.done = true;
  g.purchase('t1_0'); const ct = g.chains.p.counter, tb = ct.tables[0];
  const gems0 = g.gems;
  for (let i = 0; i < 400; i++) { // 400 aliens finish eating
    const c = TBS.Customers.spawn(g, 'p', { atSpot: true, order: 1 });
    g.customers.length = 0; ct.line.fill(null);
    if (!c) continue;
    c.state = 'eat'; c.table = tb; c.seat = tb.seats[0]; c.bill = 6; c.eatT = 0; g.customers.push(c);
    g.update(1 / 60, NONE); tb.seats.forEach((s) => { s.dirty = false; s.user = null; });
  }
  tb.tip.amount = 0;
  check('aliens never leave gems with the tip anymore', g.gems === gems0 && tb.tip.gems === undefined, 'gems ' + gems0 + ' -> ' + g.gems);
  const p = g.player, base = p.maxSpeed(g); g.boosts.speed = 10;
  check('Boost speed is x' + CFG.BOOST_SPEED_MULT, Math.abs(p.maxSpeed(g) / base - 1.5) < 1e-9, (p.maxSpeed(g) / base).toFixed(2) + 'x');
  g.gems = 0; g.money = 1e6; g.boosts.speed = 0; const m0 = g.money;
  const no = ['speed', 'items', 'worker', 'cash'].filter((t) => g.buyBoost(t, 1)); // lots of money, no gems: nothing
  g.gems = 20; const before = g.gems, yes = ['speed', 'items', 'worker', 'cash'].filter((t) => g.buyBoost(t, 1));
  const spent = before - g.gems, need = CFG.BOOST_GEMS.speed + CFG.BOOST_GEMS.items + CFG.BOOST_GEMS.worker + CFG.BOOST_GEMS.cash;
  check('every Boost (speed, items, helper, cash) costs gems (or an ad), never money', no.length === 0 && yes.length === 4 && spent === need && g.money >= m0, 'with money only: ' + no.length + ' bought; with gems: ' + yes.join(',') + ' for ' + spent + ' gems');
})();
(function () { // new wing: no table yet -> aliens wait, buy nothing, never get angry; first table -> they buy and sit
  const g = newGame(); g.guide.done = true; g.playTime = 999; g.money = 0;
  for (let i = 0; i < 10; i++) g.purchase('t1_' + i);
  g.purchase('machine2'); g.openWing2();
  for (let i = 0; i < 60 * 5; i++) g.update(1 / 60, NONE);
  buildFree(g, BASICS2); // the blue tank, machine and counter (the aliens walk in with the counter)
  const ch = g.chains.g, ct = ch.counter;
  ct.stack = 10;
  g.player.x = ct.cashier.x; g.player.z = ct.cashier.z; // standing right at the blue counter
  g.drainEvents();
  let leftG = 0;
  for (let i = 0; i < 60 * 70; i++) { // 70 s: longer than angry + leave time
    g.update(1 / 60, NONE);
    for (const e of g.drainEvents()) if (e.type === 'gaveUp' && e.data.c.chain === 'g') leftG++;
  }
  const waited = ct.stack === 10 && leftG === 0 && !!ct.line[0] && !!ct.line[0].waitTable;
  g.purchase('t2_0');
  for (let i = 0; i < 60 * 5; i++) g.update(1 / 60, NONE);
  check('new wing with no table: aliens wait (buy nothing, no take-away, nobody leaves); after the first table they buy', waited && ct.stack < 10, 'waited ' + waited + ' (counter stayed ' + 10 + ', blue aliens left ' + leftG + '), after the table counter -> ' + ct.stack);
})();
(function () { // Wing 1 too: no table -> nobody buys; the first table -> they buy
  const g = newGame(); g.guide.done = true; const ct = g.chains.p.counter;
  ct.stack = 10; g.player.x = ct.cashier.x; g.player.z = ct.cashier.z;
  for (let i = 0; i < 60 * 10; i++) g.update(1 / 60, NONE);
  const before = ct.stack;
  g.purchase('t1_0');
  for (let i = 0; i < 60 * 5; i++) g.update(1 / 60, NONE);
  check('Wing 1 also needs a table: no table = nobody buys (no take-away); the first table -> they buy', before === 10 && ct.stack < 10, 'without a table counter stays ' + before + ', with a table -> ' + ct.stack);
})();
(function () { // the game starts EMPTY: nothing built, nobody there, just enough money to build the basics + a table
  const g = new TBS.Game(CFG, { seed: 5 }); // real start
  const ch = g.chains.p, zones = g.zones.filter((z) => z.type !== 'price').map((z) => z.id); // (the first build circle is the only circle)
  const nothing = !ch.source.built && !ch.machines.some((m) => m.built) && !ch.counter.built && g.customers.length === 0 && zones.length === 0;
  const P = CFG.BUILD_PRICES, need = P.src[0] + P.mach[0] + P.ctr[0] + CFG.TRACK_PRICES.tables[0];
  g.refreshOffers();
  const firstCircle = g.offers.map((o) => o.trackId).join(',');
  check('the game starts with an EMPTY wing (no pad, machine, counter, desks, aliens); start money $' + CFG.START_MONEY + ' builds pad + machine + counter + table',
    nothing && g.money >= need && firstCircle === 'b_src1', 'nothing built ' + nothing + ', first circle ' + firstCircle + ', needs $' + need);
  // the guide builds everything in order
  const order = [];
  for (let k = 0; k < 20 && !g.guide.done; k++) {
    const id = TBS.Guide.purchaseTrack(g);
    if (!id) break;
    order.push(id); g.money += 1000; g.purchase(id); g.update(1 / 60, NONE);
    // finish the non-building steps by hand (pick up, fill, sell...)
    const f = g.guide.flags; f.dropMachine = f.dropCounter = f.sold = f.collected = f.cleaned = f.trashed = true;
    g.player.stack = [{ id: 9000 + k, type: 'tentacle' }, { id: 9100 + k, type: 'burger' }];
    g.chef.carry = Math.max(g.chef.carry, 1); if (!TBS.Workers.hired(g, 'p').length && g.built('b_hire1')) g.hire(1);
    g.update(1 / 60, NONE); g.player.stack = [];
  }
  check('the guide has you build: pad, machine, counter, table, bin, Chef desk, Hire desk (in this order)', order.join(',') === 'b_src1,b_m1,b_ctr1,t1_0,b_bin1,b_chef1,b_hire1', order.join(' > '));
})();
(function () { // ONE circle per machine: the same circle takes your ingredients and gives you its food
  const g = newGame(), m = g.chains.p.machines[0], p = g.player;
  g.customers.length = 0; g.chains.p.counter.line.fill(null); g.chains.p.spawnT = 999;
  const same = ['m1', 'm2'].every((k) => { const d = CFG.LAYOUT.W1[k]; return d.inZone.x === d.out.x && d.inZone.z === d.out.z; }) &&
               ['g1', 'g2'].every((k) => { const d = CFG.LAYOUT.W2[k]; return d.inZone.x === d.out.x && d.inZone.z === d.out.z; });
  m.input = 0; m.output = 4;
  p.stack = [{ id: 971, type: 'tentacle' }, { id: 972, type: 'tentacle' }, { id: 973, type: 'tentacle' }];
  p.x = m.out.x; p.z = m.out.z; p.vx = p.vz = 0;
  for (let i = 0; i < 60; i++) g.update(1 / 60, NONE);
  check('one circle per machine (all 4): it takes your tentacles AND gives you burgers', same && m.input >= 2 && p.count('tentacle') === 0 && p.count('burger') >= 3, 'same spot ' + same + ', machine input ' + m.input + ', tray burgers ' + p.count('burger'));
})();
(function () { // machine / tank upgrade circles sit right in front of their machine
  const L = CFG.LAYOUT.W1, far = [['m1up', L.m1], ['m2up', L.m2], ['pad', L.pad]].map(([k, m]) => {
    const c = L.circles[k], cx = (m.x0 + m.x1) / 2;
    return Math.abs(c.x - cx) < 0.01 && c.z - m.z1 < 3 ? null : k;
  }).filter(Boolean);
  check('machine / tank upgrade circles are right in front of their machine', far.length === 0, far.length ? 'far: ' + far.join(',') : 'all within 3 units, centred');
})();

// 8) workers never idle while there is work; save roundtrip; frame-rate independence
function runBot(dt, minutes, inspect) {
  let wall = 1700000000000;
  const g = newGame({ seed: 99, nowMs: () => wall });
  const bot = new TBS.Bot(g, TBS.Pacing.PROFILES.fast);
  const lv = {};
  let bad = 0, idleChecks = 0;
  for (let t = 0; t < minutes * 60; t += dt) {
    g.update(dt, bot.step(dt)); g.tickPlayTime(dt); wall += dt * 1000;
    for (const e of g.drainEvents()) {
      if (e.type === 'levelup') lv[e.data.level] = t;
      if (e.type === 'wing2Ready') g.openWing2();
    }
    if (g.pendingLevel) { g.claimLevel(1); if (g.wing2Pending) g.openWing2(); }
    if (inspect) {
      const jobs = new Set();
      for (const w of g.workers) {
        if (!w.job && TBS.Workers.pickJob(g, w)) bad++;                 // idle while a job is free
        if (w.job) { if (jobs.has(w.job.id)) bad++; jobs.add(w.job.id); } // two workers on the same job
        const types = new Set(w.stack.map((it) => it.type));
        if (types.size > 1) bad++;                                       // mixed items
        idleChecks++;
      }
    }
  }
  return { g: g, lv: lv, bad: bad, idleChecks: idleChecks };
}
(function () {
  const r = runBot(1 / 60, 9, true);
  check('workers: never idle while a job is free, never two on one job, never mixed items (every frame, 9 min)', r.bad === 0 && r.g.workers.length > 0, r.idleChecks + ' worker-frames checked, ' + r.bad + ' bad, ' + r.g.workers.length + ' workers');
  const s1 = r.g.serialize();
  const g2 = new TBS.Game(CFG, { seed: 1, save: JSON.parse(JSON.stringify(s1)) });
  const s2 = g2.serialize();
  const keys = ['money', 'gems', 'xp', 'level', 'tracks', 'paid', 'chef', 'workers', 'guide', 'g2', 'wing2Open', 'piles', 'machines', 'counters', 'carried', 'adCd', 'playTime'];
  const diff = keys.filter((k) => JSON.stringify(s1[k]) !== JSON.stringify(s2[k]));
  check('save -> load restores everything', diff.length === 0 && g2.workers.length === r.g.workers.length, diff.length ? 'different: ' + diff.join(',') : 'level ' + s2.level + ', ' + g2.workers.length + ' workers, wing2 ' + s2.wing2Open);
  // guide: opening the Chef Desk and leaving without buying moves the guide on
  const gc = newGame(), ci = TBS.Guide.STEPS.indexOf('carry1');
  gc.guide.step = ci;
  TBS.Guide.update(gc);
  const stuck = gc.guide.step === ci;
  gc.emit('terminalOpen', { wing: 1, desk: 'chef' });
  TBS.Guide.update(gc);
  check('guide: opening the Chef Desk is enough (no forced upgrade)', stuck && gc.guide.step > ci && gc.chef.carry === 0, 'step ' + TBS.Guide.STEPS[gc.guide.step] + ', carry ' + gc.chef.carry);
  // tips: a big tip pile is collected completely just by walking past it (no stop needed)
  const gt = newGame(); gt.money += 500; gt.purchase('t1_0'); gt.chains.p.spawnT = 1e9;
  const tt = gt.chains.p.counter.tables[0], tp = gt.player;
  tt.tip.amount = 300; tt.tip.bills = 5;
  tp.x = tt.tip.x - 4; tp.z = tt.tip.z; tp.vx = 6; tp.vz = 0;
  for (let i = 0; i < 120; i++) gt.update(1 / 60, { x: 1, z: 0, mag: 1 });
  check('a big tip pile is collected by just walking past it', tt.tip.amount === 0, '$' + tt.tip.amount + ' left');
  // the real save file path (what a page refresh uses): write, then read back
  TBS.Save.save(r.g);
  const back = TBS.Save.load();
  check('page refresh keeps the save (Save.save -> Save.load)', !!back && back.money === s1.money && back.level === s1.level, back ? 'level ' + back.level + ', $' + Math.round(back.money) : 'save was thrown away on load');
  const a = runBot(1 / 60, 7, false).lv, b = runBot(1 / 144, 7, false).lv;
  const LV = [3, 5, 6], cmp = LV.map((l) => (a[l] && b[l] ? Math.abs(a[l] - b[l]) / a[l] : 1));
  check('same game speed at 60 Hz and 144 Hz', cmp.every((x) => x < 0.06), 'level ' + LV.join('/') + ' at 60Hz ' + LV.map((l) => Math.round(a[l])).join('/') + 's vs 144Hz ' + LV.map((l) => Math.round(b[l])).join('/') + 's');
})();

// 8b) floor-circle layout (both wings, everything built): no upgrade circle on a table, a tip pile, a cleaning spot,
//     a wall / machine / counter, the aliens' line, or another circle
(function () {
  const g = newGame(), L = CFG.LAYOUT, R = L.PRICE_CIRCLE_R, E = TBS.Economy, bad = [];
  g.wing2Open = true; buildFree(g, BASICS2);
  for (const id in g.trackDefs) if (g.trackDefs[id].table !== undefined) g.tracks[id] = 1;
  buildFree(g, ['machine2', 'gmachine2'].filter((id) => g.trackDefs[id]));
  const rects = g.obstacles.slice();
  const tables = [];
  for (const W of [L.W1, L.W2]) for (let i = 0; i < W.tables.length; i++) if (g.trackDefs[(W === L.W1 ? 't1_' : 't2_') + i]) tables.push(W.tables[i]);
  const statics = g.staticZones.filter((z) => z.type !== 'return' && z.type !== 'cashier' && !(z.type === 'drop' && z.kind === 'counter'));
  const rectDist = (x, z, r) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1));
  const ups = Object.keys(g.trackDefs).filter((id) => g.trackDefs[id].kind === 'upgrade');
  for (const id of ups) {
    const p = g.trackDefs[id].pos, W = p.x >= L.W2.x0 ? L.W2 : L.W1;
    for (const t of tables) {
      if (Math.hypot(p.x - t.x, p.z - t.z) < E.tableFoot(CFG, t.s) + R - 0.05) bad.push(id + ' on a table');
      for (const s of E.tableSpots(t)) if (Math.hypot(p.x - s.x, p.z - s.z) < R + 0.3) bad.push(id + ' on a tip / cleaning spot');
      if (E.hiddenBy(CFG, p, t, R) > 0.05) bad.push(id + ' hidden behind a table on screen');
    }
    for (const r of rects) if (rectDist(p.x, p.z, r) < R * 0.6) { bad.push(id + ' on a wall / machine / counter'); break; }
    if (p.z > L.STRIP && Math.abs(p.x - W.service.x) < CFG.LINE_HALF_W + R - 0.05) bad.push(id + ' on the aliens line');
    if (p.x > W.x0 + L.HALL_W && p.z > L.STRIP) bad.push(id + ' in the empty strip by the door');
    for (const z of statics) if (Math.hypot(p.x - z.x, p.z - z.z) < R + z.r - 0.05) bad.push(id + ' touches ' + z.id);
    for (const id2 of ups) {
      if (id2 <= id) continue;
      const q = g.trackDefs[id2].pos;
      if (Math.hypot(p.x - q.x, p.z - q.z) < 2 * R) bad.push(id + ' touches ' + id2);
    }
  }
  check('floor circles: no upgrade circle on a table, tip, cleaning spot, wall, the line or another circle (' + ups.length + ' circles, both wings)', bad.length === 0, bad.length ? bad.slice(0, 8).join('; ') + (bad.length > 8 ? ' ... +' + (bad.length - 8) : '') : 'all clear');
})();

// 9) rewarded-ad paths (STUDIO-RULES 3.3) through the real wrapper with a fake SDK
if (TBS.CG && TBS.CG.selfTest) {
  TBS.CG.selfTest(check).then(() => finish());
} else finish();

function finish() {
  console.log('\n' + passes + ' passed, ' + fails + ' failed');
  process.exitCode = fails ? 1 : 0;
}

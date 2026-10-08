/*
  Tentacle Burger Station - ALL tunable numbers live here.
  Every line has a short comment. Change a number, save, double-click index.html again.
  Numbers are starting guesses; the pacing simulation (sim/pacing.html) checks them.
*/
(function (TBS) {
  'use strict';

  // ---------- one wing = the same plan, shifted right by OX (see LAYOUT below) ----------
  // Back strip (z 0..8, behind low walls): HR room | Chef room | kitchen. Machines stand on the back wall facing the hall.
  // The counter is the middle part of the kitchen's front wall; the cashier stands inside the kitchen.
  // Hall (z 8..24): the line comes straight in from the front gate up to the counter; tables on both sides.
  const STRIP = 8, DEPTH = 24, WIDTH = 27; // WIDTH 27: x 24..27 is an empty strip (no tables) so the Wing 2 door never hides a circle
  function sourceAt(cx) { // ingredient source (pad / goo tank) against the back wall, facing the hall (+z)
    return { x0: cx - 1.2, x1: cx + 1.2, z0: 0, z1: 2.0, pileX: cx, pileZ: 1.45, circle: { x: cx, z: 3.1, r: 0.8 }, ret: { x: cx - 1.75, z: 1.9, r: 0.38 }, worker: { x: cx - 0.9, z: 2.75 } };
  }
  function machineAt(cx) { // machine against the back wall, facing the hall (+z)
    // ONE circle per machine: walking in drops your ingredients into it, stopping there picks up its food
    return { x0: cx - 1.4, x1: cx + 1.4, z0: 0, z1: 2.1, inZone: { x: cx, z: 3.05, r: 0.85 }, out: { x: cx, z: 3.05, r: 0.85 }, outPileX: cx - 0.8, outPileZ: 1.67, ret: { x: cx - 1.95, z: 1.9, r: 0.38 }, worker: { x: cx + 1.35, z: 2.75 }, unlock: { x: cx, z: 3.2 } };
  }
  function wing(OX, src, m1, m2) {
    const X = (x) => OX + x, T = (x, z, s) => ({ x: X(x), z: z, s: s });
    const w = {
      x0: OX, x1: OX + WIDTH,
      gate: { x: X(15.5), zIn: DEPTH - 0.6, zOut: DEPTH + 2.2 },     // front entrance gate (in lane at x, out lane at x + 1)
      counter: { x0: X(13.8), x1: X(17.2), z0: STRIP - 0.4, z1: STRIP + 0.4 }, // counter = middle of the kitchen front wall
      counterDrop: { x: X(13.4), z: 6.9, r: 0.65 },                  // put food on the counter here (inside the kitchen)
      cashier: { x: X(15.5), z: 6.9, r: 0.55 },                      // cashier spot, inside the kitchen, facing the line
      service: { x: X(15.5), z: STRIP + 1.2, tx: 0, tz: -1 },       // first alien of the line, facing the counter (-z)
      money: { x: X(18.6), z: STRIP + 1.4 },                         // sales money pile: out in the hall, right of the line next to the counter (nothing hides it)
      rooms: { hr: { x0: X(0), x1: X(3.5) }, chef: { x0: X(3.5), x1: X(7) }, kitchen: { x0: X(7), x1: X(WIDTH) } },
      // low inner walls (x0,x1,z0,z1); gaps = doors: HR door, Chef door, two kitchen doors; the counter fills its own gap
      walls: [
        { x0: X(3.4), x1: X(3.6), z0: 0, z1: STRIP }, { x0: X(6.9), x1: X(7.1), z0: 0, z1: STRIP },
        { x0: X(0), x1: X(1.0), z0: STRIP - 0.1, z1: STRIP + 0.1 }, { x0: X(2.5), x1: X(4.5), z0: STRIP - 0.1, z1: STRIP + 0.1 },
        { x0: X(6.0), x1: X(8.4), z0: STRIP - 0.1, z1: STRIP + 0.1 }, { x0: X(10.2), x1: X(13.8), z0: STRIP - 0.1, z1: STRIP + 0.1 },
        { x0: X(17.2), x1: X(20.6), z0: STRIP - 0.1, z1: STRIP + 0.1 }, { x0: X(22.2), x1: X(WIDTH), z0: STRIP - 0.1, z1: STRIP + 0.1 } // 2nd kitchen door (20.6..22.2) right next to the money pile
      ],
      hireDesk: { x0: X(0.4), x1: X(3.1), z0: 0.2, z1: 1.4, circle: { x: X(1.75), z: 3.0, r: 0.7 } },  // in the HR room
      chefDesk: { x0: X(3.9), x1: X(6.6), z0: 0.2, z1: 1.4, circle: { x: X(5.25), z: 3.0, r: 0.7 } }, // in the Chef room
      terminal: { x0: X(7.0), x1: X(7.8), z0: STRIP + 0.15, z1: STRIP + 0.75, circle: { x: X(7.5), z: STRIP + 1.8, r: 0.7 } }, // Boost Terminal (hall, against the wall left of the kitchen door)
      // trash bin (hall, right of the kitchen door, near the tables and the line): walk over its circle to throw dirty plates away
      bin: { x0: X(10.55), x1: X(11.45), z0: STRIP + 0.15, z1: STRIP + 0.95, drop: { x: X(11.0), z: STRIP + 2.0, r: 0.6 } },
      circles: {}
    };
    w[src] = sourceAt(X(9.3)); w[m1] = machineAt(X(13.0)); w[m2] = machineAt(X(16.8));  // a 3rd machine fits later at x 20.6
    // upgrade circles right in front of the thing they upgrade (just clear of its pickup / drop circles)
    w.circles[src] = { x: X(9.3), z: 4.7 };     // source upgrade
    w.circles[m1 + 'up'] = { x: X(13.0), z: 4.75 }; // machine 1 upgrade
    w.circles[m2 + 'up'] = { x: X(16.8), z: 4.75 }; // machine 2 upgrade
    w.circles.cash = { x: X(11.2), z: 5.8 };    // buy a cashier (z 5.8: far enough from the kitchen wall that the wall never hides it)
    w.circles.cup = { x: X(19.6), z: 5.8 };     // counter storage upgrade (same reason)
    // tables in the order they unlock (s = seats): left of the line (wide part) and right of it
    w.tables = [T(11.0, 12.0, 2), T(20.8, 12.0, 2), T(7.0, 12.0, 1), T(11.0, 16.0, 2), T(20.8, 16.0, 1),
      T(7.0, 16.0, 4), T(3.0, 12.0, 4), T(3.0, 16.0, 4), T(11.0, 20.2, 5), T(5.0, 20.2, 5), T(20.8, 20.2, 4), T(8.0, 20.4, 1)];
    return w;
  }
  const W1 = wing(0, 'pad', 'm1', 'm2'), W2 = wing(WIDTH, 'goo', 'g1', 'g2');
  W1.tables = W1.tables.slice(0, 10); // Wing 1: 10 tables, Wing 2: 12

  TBS.CONFIG = {
    // ================= DEV (owner only) =================
    DEV_TOOLS: true,                 // !!! SET TO false BEFORE UPLOADING TO CRAZYGAMES !!! (dev keys + test log)
    MOUSE_LOCK_DURING_DRAG: false,   // true = hide and lock the mouse while dragging (decide before upload)

    // ================= PLAYER =================
    PLAYER_RADIUS: 0.35,             // body size used for bumping into things (units)
    PLAYER_ACCEL: 14,                // how fast the player reaches full speed / stops (bigger = snappier)
    PLAYER_TURN_RATE: 14,            // how fast the chef turns to face where he walks

    // ================= CHEF DESK (Wing 1) - your own upgrades, 10 levels each, then MAX =================
    // (desk upgrades give NO level progress)
    CHEF_SPEED:  [5.5, 5.75, 6.0, 6.25, 6.5, 6.75, 7.0, 7.25, 7.5, 7.75, 8.0],   // walking speed at level 0..10 (bigger station: a bit faster)
    CHEF_CARRY:  [5, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26],                   // items on the tray at level 0..10
    CHEF_PROFIT: [1, 1.1, 1.2, 1.3, 1.45, 1.6, 1.75, 1.9, 2.1, 2.3, 2.5],     // money per sale x this, level 0..10
    CHEF_PRICES: {                   // GEMS (rare): price of level 1..10
      speed:  [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
      carry:  [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],  // "Capacity" (level 1 is in the guide)
      profit: [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]  // the most expensive skill (owner's choice)
    },

    // ================= PICKUP / DROP / PAY RULES =================
    PICKUP_SLOW_RATIO: 0.3,          // must be slower than 30% of max speed inside a pickup circle...
    PICKUP_DWELL: 0.3,               // ...for this many seconds before picking starts (walking through picks nothing)
    PICKUP_INTERVAL: 0.08,           // then one item every 0.08 s while you stay
    PRICE_DWELL: 0.3,                // same stop rule before a price circle starts taking money
    PRICE_FILL_TIME: 1.1,            // seconds to fill a price circle when you have all the money
    PRICE_MIN_RATE: 30,              // price circles take at least this many $ per second
    TERMINAL_DWELL: 0.3,             // stop this long on a Boost Terminal / desk circle to open it
    MONEY_COLLECT_RADIUS: 1.5,       // walk this close to a money pile and it flies to you

    // ================= STATIONS (Wing 1, purple) =================
    PAD_INTERVALS: [1.5, 1.1, 0.8, 0.6],   // Tentacle Pad: seconds per tentacle, per pad upgrade level
    PAD_PILE_MAX: [12, 16, 20, 24],        // Tentacle Pad: max pile, per pad upgrade level
    MACHINE_LEVELS: [                      // every machine: speed + how much it holds, per machine upgrade level
      { cook: 2.0, input: 20, output: 16 },  // level 1 (start)
      { cook: 1.7, input: 24, output: 20 },  // level 2
      { cook: 1.45, input: 28, output: 24 }, // level 3
      { cook: 1.25, input: 32, output: 28 }, // level 4
      { cook: 1.1, input: 36, output: 32 }   // level 5 (max)
    ],
    BURGER_PRICE: 6,                       // $ per purple burger (x Chef Desk profit)

    // ================= STATIONS (Wing 2, blue) =================
    GOO_INTERVALS: [1.5, 1.1, 0.8, 0.6],   // Blue Goo Tank: seconds per goo blob, per upgrade level
    GOO_PILE_MAX: [12, 16, 20, 24],        // Blue Goo Tank: max pile, per upgrade level
    DISH_PRICE: 10,                        // $ per blue dish (x Chef Desk profit)

    // ================= START STATE (first play) =================
    // Every wing starts EMPTY: you build the pad / tank, the machine, the counter, the bin, the desks and the Boost Terminal yourself.
    START_PAD_PILE: 8,               // tentacles on the pad the moment you build it
    START_MACHINE_OUTPUT: 5,         // burgers on Machine 1 the moment you build it (no waiting in the first loop)
    START_CUSTOMERS: 3,              // purple aliens that walk in when you build the counter
    START_GREEN_CUSTOMERS: 2,        // blue aliens that walk in when you build the blue counter
    START_GOO_PILE: 6,               // goo in the tank the moment you build it
    START_MONEY: 60,                 // money at the very start = pad + machine + counter + first table (you can't sell before a table)

    // ================= CUSTOMERS / DEMAND =================
    DEMAND_FACTOR: 1.2,              // customers want 1.2x what your station can serve (always "can't keep up")
    ORDER_MIN: 1,                    // smallest order (items)
    ORDER_MAX: 3,                    // biggest order (items)
    QUEUE_BASE: 12,                  // places in the single-file line from the door to the cashier (long from the start)
    QUEUE_PER_TABLE: 0.4,            // extra places in the line per table bought...
    QUEUE_MAX: 16,                   // ...but never more than this (16 = the whole way from the back-wall door to the cashier)
    CROWD_FILL: 0.75,                // the line is kept at least 75% full: below that, aliens come quickly...
    CROWD_SPAWN_GAP: 1.1,            // ...one every 1.1 s (so there is always a crowd, even when you serve fast)
    BUBBLE_SPOTS: 4,                 // order bubbles only over the first 4 aliens in line (and angry ones), so a long line stays clean
    PATIENCE_SPOTS: 6,               // only aliens in the first 6 places (near the counter) lose patience; the long line behind just waits
    CUSTOMER_SPEED: 2.4,             // purple alien walking speed
    GREEN_CUSTOMER_SPEED: 2.9,       // blue alien walking speed (impatient)
    SERVE_INTERVAL: 0.12,            // seconds per item an alien takes from the counter
    HAPPY_TIME: 0.45,                // happy jump length before paying and leaving
    SPAWN_JITTER: 0.35,              // randomness of arrival times (0 = perfectly regular)
    ANGRY_AFTER: 25,                 // seconds waiting in line before an angry face appears
    LEAVE_AFTER: 20,                 // ...and seconds after that before the alien gives up and leaves (costs you nothing)
    PATIENCE_DURING_GUIDE: false,    // false = nobody gets angry while the guide is still teaching the player

    // ================= TABLES (dine-in) =================
    // Aliens take food at the counter, walk to a free CLEAN seat, eat, leave leftovers + a tip next to the table.
    // Before a wing has any table, aliens take their food away.
    TABLE_LEVELS: [                  // per table upgrade level of a wing (bigger tip, slightly faster eating)
      { tip: 0.3, eat: 6.0 },        // level 1: tip = 30% of the bill, eats for 6 s
      { tip: 0.45, eat: 5.6 },       // level 2
      { tip: 0.6, eat: 5.2 },        // level 3
      { tip: 0.8, eat: 4.8 },        // level 4
      { tip: 1.0, eat: 4.4 }         // level 5 (max)
    ],
    STOOL_REACH: 0.3,                // a stool sticks out this far past its seat spot (how far a table reaches, for placing circles)
    CIRCLE_GAP: 0.15,                // smallest free space between a floor circle and a table / another circle
    TABLE_HIDE_H: 2.3,              // a table + its "Lv" label cover this much height on screen: no circle right behind a table
    LINE_HALF_W: 0.6,               // half the width of the aliens' line (no circle is placed on it)
    CLEAN_RING: 0.95,               // stand this far around a dirty table (plus the table size) to clean it
    CLEAN_DWELL: 0.03,               // ...the plates come the moment you stop there (was a 0.3 s stop)
    WORKER_CLEAN_TIME: 0.6,          // seconds a worker needs to clean a table
    COUNTER_REACH: 1.3,              // stand within this distance of the counter (any side) to put food on it and to sell
    TRAY_HINT_GAP: 3,                // seconds between "put the food down / throw the trash first" hints
    TABLES_FIRST_WINGS: [1, 2],      // aliens never take food away: with no table yet they just wait (buy a table first)
    SEAT_DEMAND_FACTOR: 1.05,        // with tables, aliens also never come faster than the free seats allow, x this
    WING2_RAMP_START: 0.6,           // when Wing 2 opens, blue aliens come at 60% of the normal rate...
    WING2_RAMP_SECONDS: 60,          // ...growing to 100% over this many seconds; the "always a crowded line" rule starts after it too
    SEAT_TURNOVER_EXTRA: 5,          // seconds a seat is busy beside eating (walking there, waiting to be cleaned)

    // ================= COUNTER + CASHIER =================
    COUNTER_STORAGE: [12, 18, 26, 36, 48], // food the counter holds, per counter upgrade level
    // Selling happens ONLY while someone stands in the cashier spot (you, or a cashier you bought)

    // ================= WORKERS (Hire Desk, one per wing) =================
    WORKERS_PER_WING: 5,                   // most workers you can hire in one wing
    HIRE_PRICES: { 1: [90, 350, 800, 1500, 2500], 2: [200, 450, 900, 1600, 2600] }, // price of worker 1..5 in Wing 1 / Wing 2 (worker 1 of Wing 1 is in the guide)
    WORKER_SPEED_LEVELS: [3.5, 3.8, 4.1, 4.4, 4.7, 5.0, 5.3, 5.6, 5.9, 6.2, 6.5], // one worker's walking speed at level 0..10
    WORKER_CAP_LEVELS: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14],                     // items one worker carries at level 0..10
    WORKER_UP_PRICES: {                    // GEMS (rare): each worker has his OWN upgrades (desk upgrades give no level progress)
      speed: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],   // gems for speed level 1..10
      cap:   [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]    // gems for capacity level 1..10
    },
    WORKER_AD_COOLDOWN: 180,               // "Watch ad" for a worker upgrade: once every 3 minutes (one timer for all worker upgrades)
    WORKER_PICK_INTERVAL: 0.12,            // seconds per item a worker picks up
    WORKER_DROP_INTERVAL: 0.06,            // seconds per item a worker puts into a machine
    WORKER_FULL_WAIT: 1.5,                 // a worker waits this long at a full machine, then puts the rest back on the pile and does other work
    WORKER_SELL_LINGER: 1.2,               // a worker selling at the counter leaves after this long with nothing to sell

    // ================= PRICES (each list = the steps of one upgrade, in order) =================
    // Floor build circles = STATION things only (they are the only source of level progress)
    // building the basics of each wing (Wing 1 / Wing 2): everything starts empty
    BUILD_PRICES: {
      src:  [10, 60],    // Tentacle Pad / Blue Goo Tank
      mach: [20, 90],    // Machine 1 of the wing
      ctr:  [15, 60],    // the counter (where food goes and aliens buy)
      bin:  [10, 60],    // trash bin
      chef: [20, 80],    // Chef Desk
      hire: [25, 100],   // Hire Desk
      term: [40, 120]    // Boost Terminal
    },
    TRACK_PRICES: {
      tables:   [15, 20, 28, 36, 48, 60, 72, 88, 104, 120],  // Wing 1 tables 1..10 (each its own circle); table 1 is in the guide (cheaper: you also build the basics now)
      machine2: [80],                     // build Burger Machine 2
      m1up:     [130, 350, 800, 1800],    // Burger Machine 1 upgrades (levels 2..5)
      m2up:     [180, 450, 1000, 2200],   // Burger Machine 2 upgrades (levels 2..5)
      pad:      [100, 300, 700],          // Tentacle Pad faster + bigger pile
      goo:      [250, 600, 1300],         // Blue Goo Tank faster + bigger pile (Wing 2)
      gmachine2: [300],                   // build Blue Machine 2 (Wing 2)
      g1up:     [300, 700, 1500, 3200],   // Blue Machine 1 upgrades (Wing 2)
      g2up:     [400, 900, 1900, 4000],   // Blue Machine 2 upgrades (Wing 2)
      cash1:    [90],                     // cashier for the purple counter (stands there forever; cheap so it comes before Wing 2)
      c1up:     [60, 150, 350, 800],      // purple counter: more food storage
      tableUp1: [70, 160, 320, 600],      // EACH Wing 1 table: its upgrades (levels 2..5)
      cash2:    [120],                    // cashier for the blue counter
      c2up:     [150, 350, 800, 1600],    // blue counter: more food storage
      tableUp2: [200, 420, 800, 1400],    // EACH Wing 2 table: its upgrades (levels 2..5)
      tables2:  [100, 130, 170, 210, 250, 290, 340, 390, 450, 520, 600, 680] // Wing 2 tables 1..12 (the first ones cheaper: the new wing is built from zero)
    },

    // ================= LEVELS =================
    XP_PER_BUILD: 1,                 // level progress for each station build / upgrade on a floor circle
    XP_PER_SALE: 0.1,                // ...and for every alien you serve (so levels never stop, even when everything is built)
    LEVEL_XP: [0, 0, 1, 2, 4, 6, 8, 10, 13, 16, 19, 22, 26, 30, 34, 39, 44], // total progress needed for level N (index = level)
    LEVEL_XP_GROWTH: 1.06,           // after the table ends, each level needs 1.06x more than the previous step
    WING2_GATE: 12,                  // Wing 2 opens when all Wing 1 tables (10) and both machines (2) are built
    REVEAL_SECONDS: 3.4,             // length of the "Wing 2 wakes up" moment (camera trip, lights on)

    // ================= BUILD CIRCLES ON THE FLOOR =================
    BUILD_CIRCLES_AT_ONCE: 2,        // after the guide: EACH WING shows at most this many circles; when its money circles are bought, the next ones appear
    WING2_TABLES_FIRST: 2,           // in the new wing: first the tank, the machine and the counter, then only tables until it has this many
    WING2_TABLES_NEEDED: {           // Wing 2: a machine / tank / counter upgrade step only shows when the wing has this many tables
      gmachine2: [4],                //   (so production never runs far ahead of seats)
      goo:       [3, 6, 9],
      g1up:      [3, 5, 7, 9],
      g2up:      [6, 8, 10, 12],
      c2up:      [2, 5, 8, 11],
      cash2:     [1]
    },

    // ================= GEMS (rare) =================
    // Every machine / tank / counter / table upgrade costs MONEY. After paying, a paused panel offers the stronger "HOT" version
    // for gems or one rewarded ad. Chef skills: gems only. Worker upgrades: gems or an ad (3-minute timer).
    GEM_START: 2,                    // gems at the very start (the guide's first Capacity upgrade costs 1)
    GEM_PER_LEVEL: 1,                // gems for every new level...
    GEM_EVERY_5_LEVELS: 3,           // ...and this many extra on every 5th level (5, 10, 15...)
    GEM_WING_COMPLETE: 5,            // gems when a wing is complete and the next one opens
    GEM_UPGRADE_PRICES: [1, 2, 3, 4],// gems for the "HOT" version of upgrade step 1, 2, 3, 4 (or "Watch ad" instead)
    UPGRADE_AD_COOLDOWN: 0,          // seconds between "HOT" upgrade ads (0 = no limit, owner's choice)

    // ================= UPGRADE PRICES (money) =================
    UPGRADE_INCOME_SECONDS: 120,     // an upgrade costs about this many seconds of your current income (never less than its list price);
    UPGRADE_STEP_EXTRA: 0.15,        // ...each later step of the same thing +15% more (the price is fixed the moment its circle appears)

    // ================= "HOT" UPGRADE (gems or ad, picked after paying) =================
    PREMIUM: {                       // extra on top of the normal step, for each HOT pick
      machine: { speed: 0.2, hold: 6 },   // cooks 20% faster and holds 6 more (in and out)
      source:  { speed: 0.25, pile: 4 },  // makes items 25% faster and holds 4 more
      counter: { store: 8 },              // holds 8 more food
      table:   { tip: 0.25, eat: 0.6 }    // +25% of the bill as tip, and aliens eat 0.6 s faster
    },
    PREMIUM_XP: 1,                   // a HOT pick gives this much extra level progress (normal step = 1, HOT = 2)

    // ================= FLOOR OFFERS (walk onto one: paused panel "gems / Watch ad / Close") =================
    OFFER_LIFE: 30,                  // an offer stays on the floor this many seconds (its ring empties as it goes)
    OFFER_GAP: 60,                   // the next offer comes this long after the last one ended (taken with gems, closed or gone)...
    OFFER_GAP_AFTER_AD: 180,         // ...or this long after you watched an ad for one
    OFFER_FIRST_DELAY: 20,           // the first offer after the guide ends (and after loading a save)
    OFFER_NEAR: [2.5, 5.0],          // it appears this far from the chef (min..max units), in a free spot
    OFFER_R: 0.75,                   // size of the offer circle (where you stand)
    OFFER_ICON_SCALE: 1.6,           // (look) size of the picture floating over an offer
    OFFER_LINE_GAP: 1.5,            // keep this far from the middle of the aliens' line (they would hide it)
    OFFER_WEIGHTS: { magnet: 25, hover: 20, cash: 20, worker: 15, gemsS: 15, gemsM: 4, gemsL: 1 }, // how often each one appears (bigger = more often)
    OFFER_GEMS: { magnet: 2, hover: 2, cash: 2, worker: 3 }, // gem price (gem offers are ad only)
    OFFER_GEM_AMOUNTS: { gemsS: 5, gemsM: 10, gemsL: 25 },   // gems you get from the gem offers
    MAGNET_SECONDS: 60,              // magnet: money piles fly to you from far away for this long...
    MAGNET_RADIUS: 6,                // ...from this far (normally MONEY_COLLECT_RADIUS)
    HOVER_SECONDS: 45,               // space hover board: you ride it this long...
    HOVER_SPEED_MULT: 1.7,           // ...and walk this much faster (does not add up with the Boost speed: the bigger one counts)
    HOVER_LIFT: 0.22,                // (look) the chef rides this high on the board
    OFFER_CASH_INCOME_SECONDS: 120,  // cash case = this many seconds of current income
    OFFER_WORKER_SECONDS: 300,       // extra helper: 5 minutes

    // ================= LEVEL-UP REWARD + ADS (STUDIO-RULES section 10) =================
    EARLY_PHASE_SECONDS: 300,        // first 5 min of play: no pause panels, no midgame ads, and no ads of EARLY_AD_KINDS
    EARLY_AD_KINDS: ['levelup'],     // ads that wait for the first 5 min (only the level-up panel); upgrade + Boost ads are ready from the first use
    MIDGAME_MIN_LEVEL: 3,            // midgame ads only from this level up (requested on "Claim")
    LEVELUP_CLAIM_INCOME_SECONDS: 20,// level-up reward = 20 s of current income (x3 with an ad = 60 s)
    LEVELUP_AD_MULTIPLIER: 3,        // "Watch ad: Claim x3"
    AD_COOLDOWN_SECONDS: 180,        // Boost Terminal ad options: each one once per 3 minutes
    LEVELUP_AD_COOLDOWN: 0,          // "Watch ad: Claim x3" on the level-up panel: seconds between uses (0 = every level-up, owner's choice)
    REWARD_CASH_INCOME_SECONDS: 90,  // Boost Terminal cash reward = 90 s of current income (ad only)
    BOOST_SPEED_MULT: 1.5,           // x1.5 move speed boost
    BOOST_GEMS: { speed: 3, items: 1, worker: 2, cash: 1 }, // every Boost Terminal boost costs these gems (or watch an ad); never money
    BOOST_SPEED_SECONDS: 60,         // ...for 60 s
    BOOST_ITEMS_MIN: 20,             // "+20 source items" boost (never less than 20)
    BOOST_ITEMS_CAPACITY_SECONDS: 40,// grows with your station: = 40 s of that wing's production when bigger than 20
    BOOST_WORKER_SECONDS: 120,       // temporary worker lasts 2 minutes
    INCOME_AVERAGE_SECONDS: 60,      // "current income" = average earnings over about the last minute
    INCOME_FLOOR_FACTOR: 0.4,        // ...but never below 40% of what your machines could earn
    AD_SAFETY_TIMEOUT: 15,           // if an ad never starts within 15 s, give up (no reward, game continues)
    SDK_INIT_TIMEOUT: 8,             // seconds to wait for the CrazyGames SDK on the website before playing without it
    SDK_INIT_TIMEOUT_FILE: 1,        // ...when opened by double-click (file://) the SDK never starts, so wait only 1 s

    // ================= SAVE / TEST LOG =================
    AUTOSAVE_SECONDS: 10,            // save every 10 s (and after purchases and level-ups)
    SAVE_KEY: 'tbs_save_v6',         // storage key for progress (v4 = new station plan; old saves start fresh)
    HUD_TOP_GAP: 8,                  // px: smallest space between money/gems, the level bar and the sound button (else the level bar gets its own row)
    SAVE_VERSION: 4,                 // format number written in the save...
    SAVE_MIN_VERSION: 3,             // ...loading accepts this one up to SAVE_VERSION (v3 saves only lack the new fields)
    TESTLOG_KEY: 'tbs_testlog_v1',   // storage key for the 5-player test log (separate from progress)
    TESTLOG_MAX: 10,                 // sessions kept in the test log

    // ================= CAMERA / GRAPHICS =================
    CAM_YAW_DEG: 45,                 // camera turned 45 degrees (isometric look)
    CAM_PITCH_DEG: 37,               // camera looks down 37 degrees
    CAM_VIEW_HEIGHT: 12.5,           // how many world units fit top-to-bottom on screen (bigger = zoomed out)
    CAM_MIN_VIEW_WIDTH: 15,          // on narrow screens zoom out so at least this much fits side-to-side
    CAM_FOLLOW: 6,                   // how quickly the camera follows the chef
    CAM_FOCUS_TIME: 1.5,             // a new far circle appears: the camera flies to it, holds, and flies back in this many seconds
                                     // (2 new circles at once = ONE trip: chef -> circle 1 -> circle 2 -> chef)
    CAM_FOCUS_SKIP: 0.75,            // ...but only when it is far: a circle already inside the middle 75% of the screen gets no trip
    CAM_LOOKAHEAD: 0.3,              // camera looks a little ahead of where you walk
    CAM_STACK_LIFT: 0.25,            // camera rises with tall stacks so they stay on screen
    MAX_PIXEL_RATIO: 1.5,            // render sharpness cap (lower = faster on weak laptops)
    ANTIALIAS: false,                // smooth edges. Off everywhere (owner: no visible difference). Adreno 506 late game: 26 -> 33 FPS. 'auto' = off on phones only, true = on
    SHADOWS: false,                  // real-time shadows. Off: on weak phones (Adreno 506) showing them halved the speed (9 -> 20 FPS late game). Owner OK with no shadows
    SHADOW_MAP_SIZE: 1024,           // shadow detail
    // owner's pictures for the Tentacle Pad (js/models/pad-art.js) instead of the built shapes. looks = which picture
    // (1..5) each pad level shows (Lv1, Lv2, Lv3, MAX). width = picture width in floor units; anchor = the point of the
    // picture (0..1, from the left / from the top) that stands on the pad's centre; pile = where the tentacle pile is
    // shown, moved from the pad's pile spot by [x, height, z] so it lies on the picture's tray (a look only).
    PAD_ART: { on: true, looks: [1, 2, 3, 5], width: 3.6, anchor: [0.51, 0.6], pile: [0, 0.12, 0.8], pileGrid: [2, 2] }, // pileGrid: pile columns (x) x rows (z) on the tray
    ALIEN_MODELS: true,              // use the AI-made 3D alien models from js/models (false = the old built-in shapes)
    CROWD_DETAIL: 0.55,              // smoothness of round shapes on aliens, food and money (1 = full). Lower = far fewer triangles for phones
    OCCLUDER_FADE: 0.28,             // see-through amount for things in front of the chef (0 = invisible)
    // ================= FEEL (juice) =================
    ARC_TIME: 0.22,                  // seconds an item flies onto the tray
    ARC_HEIGHT: 0.9,                 // how high it arcs
    DROP_STAGGER: 0.035,             // seconds between items flying into a machine / counter
    STACK_SPRING: 55,                // tray stack wobble stiffness
    STACK_DAMPING: 8,                // tray stack wobble calming
    STACK_LEAN: 0.055,               // how much the stack leans when you speed up / turn
    STACK_LEAN_MAX: 0.5,             // max lean (radians-ish)
    TRAY_FORWARD: 0.48,              // tray is held this far in front of the body
    TRAY_HEIGHT: 1.0,                // tray height for the chef (workers a bit lower)
    MONEY_FLY_TIME: 0.35,            // seconds bills fly to you
    MONEY_BLOCK_COLS: 3,             // a sales money pile is ONE solid block: notes side by side...
    MONEY_BLOCK_ROWS: 4,             // ...3 x 4 notes per layer, layer on layer, no gaps
    TIP_BLOCK_COLS: 2,               // tip piles next to tables are smaller blocks (2 x 3) so tables stay clear
    TIP_BLOCK_ROWS: 3,
    NOTE_THICK: 0.045,               // thickness of one note (smaller = more layers for the same height)
    // pile HEIGHT is only a look (the money is the same): it shoots up with the first dollars, then grows slower
    // layers = MAX_LAYERS * (amount / FULL) ^ CURVE   (CURVE 0.5: $6 already ~7 layers, $150 = half height)
    MONEY_PILE_LAYERS: 75,           // tallest sales pile, in layers (75 x 0.045 = 3.4 high, well above the chef)
    MONEY_PILE_FULL: 600,            // $ in the sales pile at which it is that tall
    TIP_PILE_LAYERS: 26,             // tallest tip pile next to a table (26 layers = 1.2 high)
    TIP_PILE_FULL: 60,               // $ in a tip pile at which it is that tall
    PILE_CURVE: 0.5,                 // 1 = straight line, smaller = faster at the start
    COLLECT_TIME: 1.2,               // standing at a pile, the whole pile flies to you in about this many seconds...
    COLLECT_MIN_RATE: 120,           // ...but never slower than this many $ per second (layer by layer from the top)
    TIP_COLLECT_TIME: 0.35,          // tip piles next to tables are faster: the whole pile in about this many seconds (even walking past)...
    TIP_COLLECT_MIN_RATE: 300,       // ...and never slower than this many $ per second
    PILE_DRAW_MAX: 40,               // most items drawn in one pile (more are counted but not drawn)
    MACHINE_STACK_COLUMN: 8,         // food pieces per column on a machine output
    COUNTER_DRAW_MAX: 48,            // most items drawn on a counter

    // ================= SOUND =================
    MASTER_VOLUME: 0.5,              // overall volume (0..1)
    PITCH_RANDOM: 0.05,              // random pitch change per sound (+-5%) so sounds never repeat exactly
    KNOCK_RANGE: 8,                  // the alien behind the Wing 2 door knocks only when you are this close
    KNOCK_EVERY: [6, 10],            // seconds between knocks (random in range)

    // ================= COLORS =================
    COLORS: {
      purple: 0x9b4dde,              // Wing 1 alien + food color
      purpleDark: 0x6a2aa8,          // darker purple
      blue: 0x3b8cff,                // Wing 2 alien + food color
      blueDark: 0x1f5fbf,            // darker blue
      blueLight: 0xa9d0ff,           // light blue (drool, highlights)
      money: 0x3fbf5a,               // money bundles (green)
      moneyBand: 0x237a37,           // money bundle band
      bun: 0xe8b064,                 // burger bun
      floor1a: 0xc9d3e0,             // Wing 1 floor tile A
      floor1b: 0xbcc7d6,             // Wing 1 floor tile B
      floor2a: 0xc8d6ec,             // Wing 2 floor tile A (lit)
      floor2b: 0xb9c9e3,             // Wing 2 floor tile B (lit)
      wall: 0xe9edf3,                // hull walls
      stripe: 0x4a7bd1,              // wall stripes
      space: 0x0b1030,               // outer space background
      buildCircle: '#ffd23a',        // the one colour of every build/upgrade circle (ring + fill)
      terminal: 0x2fe0c8,            // Boost Terminal
      bin: 0x5fd068,                 // trash bin + its drop circle
      pickup: 0xff4f7b,              // "take from here" circles (pad / tank / machine outputs): coral pink, shows on the white floor (orange = return pads)
      chef: 0xff7a2a,                // chef suit
      worker: 0x3a7be0,              // worker suit
      cashier: 0x2fbf7a,             // cashier suit
      tempWorker: 0x2fd0b8           // temporary worker suit
    },

    // ================= LAYOUT (world units; camera looks from +x,+z, so small x/z = back of the screen) =================
    LAYOUT: {
      WING1: { x0: 0, x1: WIDTH, z0: 0, z1: DEPTH },          // Wing 1 floor rectangle
      WING2: { x0: WIDTH, x1: 2 * WIDTH, z0: 0, z1: DEPTH },  // Wing 2 floor rectangle (same plan)
      STRIP: STRIP,                                 // depth of the back strip (rooms + kitchen) behind the low inner walls
      DEPTH: DEPTH,                                 // front edge of the hall (z)
      HALL_W: 24,                                   // usable hall width of a wing (x 24..27 stays empty by the Wing 2 door)
      WALL_H: 2.6,                                  // outer hull wall height
      INNER_WALL_H: 1.1,                            // inner walls are low so you can see into the kitchen and rooms
      BARRICADE_H: 0.9,                             // low barricade between the wings
      RAIL_H: 0.35,                                 // low rail on the front edge
      DOOR: { x: WIDTH, z: 15.2, w: 2.4 },          // door between the wing halls (center z, width)
      OPENING: { z0: 13.6, z1: 16.8 },              // part of the barricade that opens with Wing 2
      DOOR_LABEL_Y: 1.5,                            // height of the "Build Wing 1: x/12" label: on the door's face, not above it (above it hid table 2's circle)
      LINE_SPACING: 0.9,                            // gap between aliens in the single-file line
      PLAYER_START: { x: 15.5, z: 5.0 },            // where the chef starts (in the kitchen)
      W1: W1,                                       // Wing 1 (purple): see wing() at the top of this file
      W2: W2,                                       // Wing 2 (blue): the same plan, shifted right
      TABLE_RADIUS: 0.5,              // table top size (blocks the chef)
      PRICE_CIRCLE_R: 0.78,           // where you must stand to pay a build circle
      PRICE_CIRCLE_DRAW_R: 1.0,       // how big the build circle LOOKS on the floor (bigger = easier to read the price)
      PRICE_TEXT_STRETCH: 1.35        // price drawn taller so it still reads after the camera tilt squashes it
    }
  };
})(window.TBS = window.TBS || {});

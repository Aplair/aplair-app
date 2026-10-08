# Tentacle Burger Station — HANDOFF (done / next)

The owner's revision list (A–N) is being done in 4 parts. After each part: selftest, this file, double-click check.

## PART 1 — DONE (A, D, E, F, G, L, M, N)
- **A Floor circles**: after the guide, only 2 build circles at once (`BUILD_CIRCLES_AT_ONCE`); the next 2 appear when both are bought.
  - One style: dark disc with a yellow ring, an icon, the price and one word, all drawn ON the floor (`js/view/floorcircle.js`). No floating labels.
  - The price counts down, bills drop in, and the circle fills. The 0.3 s stop rule is kept.
  - The circle looks bigger than the pay area (`PRICE_CIRCLE_DRAW_R`), and the text is stretched against the camera tilt (`PRICE_TEXT_STRETCH`).
- **D Money**: every money pile (sales + tips) is ONE solid block of flat notes, sales piles 3×4 per layer, tip piles 2×3, $1 = 1 note (`MONEY_PER_NOTE`, `MONEY_BLOCK_*`, `TIP_BLOCK_*`, `NOTE_THICK`, `MONEY_NOTE_MAX` 600 = 50 layers, `TIP_NOTE_MAX`). Collecting copies the owner's reference video: standing at a pile, whole layers peel off the top and fly into the chef one after another (`Game.drainPile`, `COLLECT_TIME` 1.2 s, `COLLECT_MIN_RATE`); events `collectTick` (each bit) and `collect` (done). Owner asked for this look after seeing another game. Wing 1's sales pile is on the kitchen side, near the machines.
- **E Machines**: input holds 20 at level 1, up to 36 (`MACHINE_LEVELS`). Inputs are stacked on the machine roof; output is stacked tall. The floor upgrade circles are m1up / m2up / g1up.
- **F Tray**: the player and workers carry a tray in front with both arms forward. The wobble is kept.
- **G Queue**:
  - One single-file line.
  - Angry face after 25 s (`ANGRY_AFTER`). The alien leaves 20 s later (`LEAVE_AFTER`), for free.
  - No anger while the guide is running (`PATIENCE_DURING_GUIDE`).
  - The sim reports the leave %.
- **L UI**:
  - Short labels on narrow screens ("Buy $45" / "▶ Ad"), with Buy and Ad buttons the same size.
  - The HUD level bar gets its own row on narrow screens.
  - Checked at 360×640 and 800×450. 1280×720 and 1920×1080 were checked earlier and are re-checked in Part 4.
- **M**: Wing 2's alien, food, floor and door silhouette are BLUE.
- **N**: the lamp, crates and other "abandoned" props disappear when Wing 2 opens.
- Checks:
  - `node sim/selftest.js`: 32/32 pass (new tests: single-file line, anger/leave timing, machine input 20, 2 circles).
  - Headless Chrome opens `index.html` by file:// with no errors.

**Pacing after Part 1 (normal bot)**:
- Guide ends at 1:29 (L4). L10 at 6:03.
- **16% of aliens leave** (target under 10%; this is tuned in Part 4).

## PART 2 — DONE (B, H)
- **B Desks** (stand 0.3 s on the desk circle → paused panel, money only, no ads, no level progress):
  - Chef Desk (Wing 1): Move speed / Carry / Profit, 10 levels each, then MAX (`CHEF_*`). Profit multiplies every sale; it replaces the old price circles.
  - Hire Desk in each wing (Wing 2's appears with the wing): up to 5 workers (`WORKERS_PER_WING`, `HIRE_PRICES`). Each worker has his own Speed and Carry, 10 levels each (`WORKER_*_LEVELS`, `WORKER_UP_PRICES`).
  - The guide now teaches: Table 1 → Chef Desk (Carry) → Hire Desk.
  - Removed floor tracks: carry, speed, hire, workers, price1, price2.
- **H Levels and wing gate**:
  - Level progress comes only from station builds/upgrades: 1 per build (`XP_PER_BUILD`, `LEVEL_XP`). Selling gives none.
  - Every table is its own floor circle, so 2 tables can show at once (otherwise each table was paired with an expensive upgrade and Wing 2 never opened).
  - Wing 2 opens at 12/12 (10 tables + 2 machines, `WING2_GATE`). The door shows "Build Wing 1: x/12".
  - Opening panel: "Wing 1 complete! NEW WING OPEN!" → (midgame request) → reveal. If the last build also levels up, the level panel carries the wing line instead.
  - Wing 2 got its 2nd machine (+ upgrades) and 12 tables.
- Dev key **Shift+W** = build all of Wing 1 for free (opens Wing 2).
- Save key bumped to `tbs_save_v3` (old saves start fresh).
- Checks:
  - selftest 37/37 (new: desks give no level progress, max 5 workers with their own upgrades, 11/12 vs 12/12 gate, sales give no progress).
  - Headless Chrome file:// opens the game and `sim/pacing.html` with no errors.
  - Browser check: Chef panel, Hire panel at 360×640 (scrolls with 5 workers), level+wing panel, wing-only panel, midgame, reveal.

**Pacing after Part 2 (normal / fast)**:
- Wing 2 opens at **8:36 at level 8** / 8:02 at L8.
- Guide ends at 1:52 (L2).
- Leave % is 17–19% (Part 4 must get it under 10%).
- After Wing 2 the bot buys few Wing 2 things in 15 min (prices to tune in Part 4).

## PART 3 — DONE (I, C, J, K)
- **I Tables (dine-in)**:
  - The alien takes food at the counter, pays (money goes to the counter pile), walks to a free CLEAN seat (nav path), eats (`TABLE_LEVELS[].eat`, 6 s at level 1), then leaves a used plate (that seat is dirty) and a tip bundle on the floor next to the table (`tip` = share of the bill).
  - Tips stack until the chef walks to them (workers never take money).
  - No clean seat: the front alien holds his food and waits; a "table ?" bubble shows; the line doesn't move.
  - Before a wing has its first table, aliens take the food away (otherwise nothing could sell at the start / when Wing 2 opens).
  - Cleaning: a glowing ring around a dirty table (`CLEAN_RING`). The chef stops 0.3 s in it, or a worker cleans it (`WORKER_CLEAN_TIME`).
  - Seat types 1/2/4/5. Tables upgrade circle per wing (`tup1`/`tup2`): bigger tips + faster eating.
  - Demand = min(food the machines make, free seats) (`SEAT_DEMAND_FACTOR`, `SEAT_TURNOVER_EXTRA`). Line capped at 12 (`QUEUE_MAX`).
- **C Workers**: 3 jobs per wing with priority (starving machine > counter almost empty > dirty table > more ingredients > more food). One worker per job, a new job only with empty hands, never money, never mixed items. Straight on to the next job in the same frame.
- **J Counter / cashier**:
  - Selling only while someone stands in the green cashier spot (`Counter.staffed`).
  - Cashier floor circle per counter (`cash1`/`cash2`): a green-suit cashier stands there forever.
  - Counter storage upgrade (`c1up`/`c2up`, `COUNTER_STORAGE`); extra food stays on the tray.
- **K Looks**:
  - Machines: top colour + lamps.
  - Tables: top colour + a tablecloth from level 2, gold rim at max.
  - Counters: top colour + one lit lamp per storage level.
- **Guide** now: pad → machine → burgers → counter → **stand at the cashier spot** → money → Table 1 → **clean it** → Chef Desk (carry) → Hire Desk.
- New sounds: clean (sparkle) and sell (register blip).
- Checks:
  - selftest **45/45** (new: cashier-only selling, bought cashier, dine-in + tip, waiting for a seat, chef cleaning after 0.3 s, tip pickup, worker priority, counter storage, per-frame worker check).
  - Headless file:// OK.
  - Browser: dine-in, rings, tips, cloths, cashier, gold counter, Wing 2 opens.
- Bot fixes in sim: walk the last bit straight into cleaning spots; desk/cashier/clean/tip tasks.

**Pacing after Part 3 (normal / fast)**:
- Wing 2 opens at **13:59 L10** / 10:18 L9 → too slow; Part 4 must bring it to 8–10.
- Leave % is 5% / 8% ✓.
- **The bot barely serves Wing 2** (fast: 7 blue dishes in 5 min) → Part 4 must fix the bot (Wing 2 cashier duty, buy Wing 2 cashier / hire) and the Wing 2 prices.

## PART 4 — DONE (re-tune, checklist, message)
- **Game fixes found by the sim**:
  - The nav grid only covered x ≤ 29 (Wing 2 goes to 34), so paths to far Wing 2 tables failed → now covers both wings.
  - The Wing 2 mini-guide pointed at the goo tank while your tray was full of burgers → it now points to where those go first.
- **Tuning**:
  - Burger $6, dish $10. Machine starts with 5 burgers.
  - First tables seat 2 (seat order 2,2,1,2,1,4,4,4,5,5).
  - Cheaper Wing 1 tables and all Wing 2 prices. Wing 2 cashier $120.
  - Demand 1.2x, seats 1.05x, seat turnover 5 s.
  - Wing 2 starts at 35% of the aliens and grows to 100% over 150 s (`WING2_RAMP_*`).
  - Tip piles are low (`TIP_COLUMN_HEIGHT`).
- **Bot (sim only)**:
  - Picks up money when it pays for the next circle.
  - Serves the wing with the longest wait, and rescues an empty counter (starting from ingredients if nothing is cooked).
  - Hires the first worker of a new wing right away.
- **Final pacing (normal / fast / normal + ads)**:
  - Wing 2 opens at **8:43 L9** / 7:04 L9 / 8:55 L9.
  - Leave %: **5%** / 5% / 6%.
  - Guide ends at 2:10 (L2) / 1:11.
  - A purchase about every 20 s.
- **Checks**:
  - selftest 45/45.
  - Headless file:// OK for both `index.html` and `sim/pacing.html`.
  - No cut text at 360×640, 800×450, 1280×720 and 1920×1080. Ad button the same size as Claim.
  - About 2 ms per frame at 1920×1080 with 22 tables, tip piles, 10 workers and 19 aliens (164 draw calls) on this PC.
- `اقرأني.txt` updated.

## After Part 4 — owner requests
- **Long straight line**: counters lie ACROSS the end of the line at the FRONT of each wing (W1 x 6.4–9.8, z 15.6–16.4; W2 +16).
  - The cashier spot is behind the counter (z 17.2), facing the line; the drop zone is at the counter's kitchen end; the money pile is at the kitchen side.
  - The front alien faces the counter (`service.tx/tz`).
  - The line runs straight from the back-wall door (z≈1) to the cashier (z 15): up to 16 aliens (`QUEUE_BASE` 12, `QUEUE_PER_TABLE` 0.4, `QUEUE_MAX` 16).
  - Only the first 6 places lose patience (`PATIENCE_SPOTS`), so a long line doesn't empty itself.
  - Order bubbles only over the first 4 (`BUBBLE_SPOTS`) and angry aliens.
  - Re-placed around it:
    - Tables moved right of the line.
    - Boost Terminals moved to the back of the kitchen.
    - Cashier and counter-upgrade circles moved, and the money pile now sits next to the cashier.
  - Pacing: Wing 2 opens at 8:46 L9; leave % is 2–5%.
- **Money look**: see D above (3×4 blocks, layer-by-layer collect).

## Station re-plan (owner chose "option A")
- Each wing is 24 × 24, built from one template: `wing()` at the top of `config.js` (Wing 2 = the same template shifted +24).
- **Back strip (z 0–8)**, behind LOW inner walls (`INNER_WALL_H`) with doors and room signs:
  - HR room (x 0–3.5): Hire Desk.
  - Chef room (3.5–7): Chef Desk; Wing 2 has one too, sharing the same chef levels.
  - Kitchen (7–24): source + 2 machines on the back wall, facing the hall (meshes turned by `FACE_HALL`). A 3rd machine slot is left free at x 20.6.
- **Counter** = middle of the kitchen front wall. The cashier spot, drop zone and money pile are inside the kitchen.
- **Hall (z 8–24)**:
  - The line runs straight from the front gate (`gate`, a lifting bar in the front rail) to the counter: 16 places.
  - Tables on both sides; the Boost Terminal stands by the kitchen wall.
  - The hall can later grow forward (z > 24) without touching the kitchen.
- Wings connect through a door at x 24, z 15.2.
- When Wing 2 opens, the floor-circle batch is reset, so the cheap Wing 2 cashier shows up at once.
- Tuning: chef speed +0.5, Wing 1 tables −15%, purple cashier $90, Wing 2 ramp 25% → 100% over 240 s.
- Pacing: normal player Wing 2 at 9:15 L9, leave 9%; fast 6:41, 4%.
- `SAVE_KEY` is now v4.
- Money pile is OUT in the hall, right of the line next to the counter (x+18.6, z 9.4); owner's choice, so nothing hides it.
  - A 2nd kitchen door (x+20.6..22.2) sits right next to it.
  - The Boost Terminal is left of the counter, by the first kitchen door.
  - Pacing: Wing 2 at 8:53 L9; leave 4%.

## Open questions for the owner
- Take-away before a wing's first table (my interpretation).
- Cleaning ring around the table instead of a separate circle.
- The Wing 2 crowd ramp-up.
- The line is capped at 12.
- A purchase every ~20 s may feel too frequent.
- Levels are slow after Wing 2.

## Notes for whoever continues
- To test in the preview pane, drive frames with `TBS.Main.tick(dt)`, because requestAnimationFrame does not fire there.
- `DEV_TOOLS` must be set to `false` before upload.

### Owner request: circle hidden behind the Wing 2 door
- Problem: table 2's circle (x 20.8, z 12) sat exactly behind the door top on screen.
- Tried making occluders fade in front of build circles: owner rejected it (circle looked drawn on top of the door). Reverted.
- Final fix (owner's idea): WIDTH 24 -> 27. x 24..27 of each wing is an EMPTY strip: never put tables there. Door is now at x 27, Wing 2 is x 27..54.
- Door label sits on the door face (LAYOUT.DOOR_LABEL_Y 1.5).
- Selftest 45/45. Pacing: normal Wing 2 8:53 L9 leave 4%, fast 7:02 1%, ads 8:40 2%.


### Owner request: trash after cleaning
- Cleaning a table puts one dirty 'plate' item per dirty seat on the tray (player: up to free tray room; worker: all of the table). They must be thrown in the wing's trash bin (LAYOUT.Wx.bin, drop circle at x+12.8, z 9.75, next to the Boost Terminal).
- Food and trash never share the tray: no cleaning with food on the tray, no food/ingredient pickup with plates on it (toast hint, TRAY_HINT_GAP 3 s).
- Workers: clean -> 'toBin' phase -> drop -> next job. Temp worker leaving: plates vanish.
- Guide: new step 'trash1' after 'clean1' (arrow to the bin). loopTarget sends plates to the bin first.
- Bot throws plates first. Selftest 48/48 (3 new). Pacing: normal Wing 2 9:13 L9 leave 7%, fast 7:18 5%, ads 8:57 3%. Headless file:// OK.

### Fix: Boost panel overflow
- Problem: .btn has white-space: nowrap and the .row grid used 1fr columns (min = text width), so at ~800 px wide the 'Watch ad: ...' labels were cut and the panel scrolled sideways.
- Fix (css/style.css only): row columns minmax(0,1fr), row buttons may wrap (white-space normal) and stretch to equal height; .panel.term max-width = min(96vw, --u * 54) so labels fit on one line on wide screens.
- Checked at 360x640, 800x875, 1280x720, 1920x1080: no sideways scroll, no cut labels; Chef panel unaffected. No gameplay change.

### Owner request: money piles rise fast and tall
- Pile height is only a look now: layers = MAX * (amount/FULL)^PILE_CURVE (0.5). Sales pile: 75 layers at $600 (3.4 high); tips: 26 layers at $60. $6 sale = 8 layers (was 1).
- Removed MONEY_PER_NOTE / MONEY_NOTE_MAX / TIP_NOTE_MAX. collectTick flies the layers that disappeared. Note caps noteA/noteB 3000. Selftest 48/48, file:// OK.

### Owner request: hidden kitchen circles + Boost/bin swap
- cash and cup circles moved from z 6.9 to z 5.8 (the 1.1 kitchen wall hid anything on the ground at z > ~7 from this camera).
- Boost Terminal moved to the hall wall LEFT of the kitchen door: rect x+7.0..7.8, circle (x+7.5, z 9.8) (0.2 clear of table 3's clean ring).
- Trash bin moved to the old Boost spot: rect x+10.55..11.45, drop circle (x+11.0, z 10.0).
- Selftest 48/48. Pacing: normal Wing 2 8:33 L9 leave 8%, fast 7:42 2%, ads 9:55 2%.

### Fix: level-up panel button text spilling over the play icon
- .p-btns .btn now wraps (white-space normal), keeps its min-width and equal flex size. Checked 360x640, 800x875, 1280x720, 1920x1080: nothing cut, both buttons same size.

### Owner revision (14 changes, 2026-10-07)
1. Machine/tank upgrade circles moved right in front of their machine (z 4.5 / pad 4.7).
2. Pickup circles: COLORS.pickup coral pink (white was invisible on the white floor).
3. Camera: a new build circle appears -> camera flies there, holds, flies back (CAM_FOCUS_TIME 1.5). camera.js watchOffers().
4. Always a crowd: line kept >= CROWD_FILL 75% (spawn every CROWD_SPAWN_GAP 1.1 s); off during the first quarter of the Wing 2 ramp. spawnT > 100 = arrivals off (tests).
5. Workers: new 'sell' job (W.needSeller: alien waiting, food on counter, no cashier, chef not near) -> worker stands at the cashier spot, Counter.staffed counts w.selling. Feed picks only feedRoom(); at a full machine waits WORKER_FULL_WAIT then 'toSourceBack'.
6. Counter area: Counter.near() (COUNTER_REACH 1.3, any side) for dropping food and selling; drawn as a dashed yellow frame (circles.js counterArea), green while you are in it.
7. Wing 2: first circles are tables until WING2_TABLES_FIRST (2) tables.
8. Wing 2 machine/tank/counter steps need tables: WING2_TABLES_NEEDED (step.requires).
9. Batches PER WING (2 each); a batch refills when its money circles are bought (gem circles never block; max 1 gem circle per wing batch, shown only if gems or the upgrade ad is ready).
10. Level labels (Lv N / MAX) over machines, tanks, tables (overlay .lvlabel, bump on change) + floating "Lv N!" on upgrade. Floor circles say "Machine Lv 3" / "MAX".
11. Per-table upgrades: tracks tu1_i / tu2_i (circle at Eco.tableUpPos: right of the table), table.level, per-table materials in world.js. tup1/tup2 removed.
12. Gems: GEM_START 2, +GEM_PER_LEVEL, +GEM_WING_COMPLETE 5, GEM_TIP_CHANCE 1% (tip.gems, diamond over the pile). Upgrade step 2+ = GEM_UPGRADE_PRICES [1,2,3,4] or one rewarded ad (adCd.upgrade, 3 min): standing on a gem circle opens a paused panel (ads.openUpgrade / hud.showUpgrade). Chef + worker upgrades cost gems (CHEF_PRICES / WORKER_UP_PRICES are gem lists now). HUD gem pill. SAVE_KEY tbs_save_v5.
13. "Carry" -> "Capacity" (chef desk, worker rows).
14. Terminal glitch: latch now clears when you walk (not only when you leave the circle); latched ring stays empty; a refused open un-latches.
- Bug found by the bot: table upgrade circle sat on the cleaning spot -> moved; dirty table now wins over a price circle.
- Selftest 61/61 (13 new). Pacing: normal Wing 2 9:48 L12 leave 7%; fast 6:12 6%; ads 9:44 7%; line ~100% full. file:// OK.

### Owner fixes (3)
- Next upgrade step opened its panel by itself right after paying the previous step (same spot): Game.purchase sets player.latched = '*' -> every price/terminal circle under the chef waits until he walks (not slow) or steps off. Test covers tu1_0, m1up, pad, c1up (fails without the fix).
- Worker kept selling while the front alien held food waiting for a seat and all seats were dirty: W.seatsBlocked() -> cleaning becomes tier 0, no sell job, a selling worker leaves; selling only while needSeller (front still needs food).
- ONE circle per machine: inZone = out = (cx, 3.05, r 0.85); the machine drop zone is not drawn. Machine upgrade circles z 4.75.
- Selftest 64/64. Pacing: normal Wing 2 8:55 L13 leave 8%, fast 6:55 3%, ads 9:16 4%. file:// OK.

### Owner request: no limit on the upgrade ad
- UPGRADE_AD_COOLDOWN 0 (Game.startAdCooldown uses it for 'upgrade'). Still no ads in the guide / first 5 min (EARLY_PHASE). Boost + level-up ads keep their 3-min cooldown (STUDIO-RULES 10). Selftest 65/65, pacing unchanged.

### Owner request: no limit on the level-up Claim x3 ad
- LEVELUP_AD_COOLDOWN 0: the 'Watch ad: Claim x3' button shows on every level-up panel (still none in the guide / first 5 min). Only the Boost Terminal ads keep AD_COOLDOWN_SECONDS 180. Selftest 66/66. Pacing: ads player watches 7 Claim x3 ads, Wing 2 9:07, leave 9%.

### Owner requests (5)
- Gems in tips removed (GEM_TIP_CHANCE, tip.gems, gem diamond overlay all gone). Gems now: start, level-ups, wing complete.
- Camera trip only for far circles: skipped when the circle projects inside CAM_FOCUS_SKIP (75%) of the screen.
- Cleaning: CLEAN_DWELL 0.03 (plates come the moment you stop; was 0.3 s).
- Boost speed x1.5 (BOOST_SPEED_MULT); panel text follows config.
- Boost cash: buy with BOOST_CASH_GEMS (1) gem or watch an ad (Game.buyBoost('cash')).
- Selftest 69/69.
- Camera: new far circles that appear together = ONE trip (camera.tour: chef -> nearest circle -> next -> chef; holds at each). Checked in the browser: between the two circles the camera never comes back to the chef.

### Owner request: new wing needs tables before selling
- TABLES_FIRST_WINGS [2]: Counter.needsTables() -> aliens wait in line, take nothing (no take-away), no patience loss, front shows a table '?' bubble; needsCashier / needSeller false; guide arrow points to the cheapest Wing 2 table after the mini-guide. Wing 1 still allows take-away before its first table (guide).
- Selftest 70/70. Pacing: normal Wing 2 8:47 leave 2%, fast 6:16 2%, ads 9:14 7%.

### Owner request: every wing starts EMPTY + tables needed in Wing 1 too + gems on the level panel
- New build tracks per wing (economy.js, def.build): b_src{1,2} (pad/tank), b_m{1,2} (machine 1), b_ctr{1,2} (counter), b_bin, b_chef, b_hire, b_term. Prices BUILD_PRICES. Game.applyBuild(id, fresh) sets source/machine/counter .built; fresh build = START_PAD_PILE / START_MACHINE_OUTPUT / START_GOO_PILE and the first aliens (START_CUSTOMERS / START_GREEN_CUSTOMERS) walk in with the counter. Nothing works (zones, obstacles, arrivals, worker jobs, labels) until built. START_MONEY 60 = pad 10 + machine 20 + counter 15 + table 15.
- View: every pop has .track; visible only once built, pops in on purchase. Wing 2 reveal no longer pops its machines.
- Guide Wing 1: bPad, pad, bMachine, input, output, bCounter, counter, table1, cashier, money, bBin, clean1, trash1, bChef, carry1, bHire, hire1. Wing 2 mini-guide: gbSrc, goo, gbMachine, ginput, goutput, gbCounter, gcounter.
- Wing 2 circles: core (tank -> machine -> counter) first, then one table + the bin, then tables + hire desk, until WING2_TABLES_FIRST tables. Wing 2 quiet-start clock (wing2OpenTime) runs only once it can sell (counter + table); crowd rule only after the full ramp.
- TABLES_FIRST_WINGS [1, 2]: no take-away anywhere.
- Level panel / early banner show '+$X  (gem)+N' (pendingLevel.gems).
- Price tweaks: Wing 1 tables cheaper [15..120], Wing 2 tables [100..680].
- Dev Shift+W builds all of Wing 1 (basics too). SAVE_KEY tbs_save_v6.
- Selftest 73/73 (newGame() builds Wing 1 basics for the old checks; new checks for the empty start, guide build order, Wing 1 table rule, Wing 2 empty order). Pacing 15 min: normal Wing 2 9:11 L13 leave 9%; fast 6:45 6%; ads player 9:59, leave 18% (20 min: normal 6%, fast 4%, ads 14%: the ads bot walks to every upgrade ad). file:// OK.

### Owner request: every Boost costs gems
- BOOST_GEMS { speed 1, items 1, worker 2, cash 1 } (or watch an ad); boostPrice() returns gems; BOOST_BUY_SECONDS / BOOST_BUY_MIN / BOOST_CASH_GEMS removed. Note: STUDIO-RULES 10 still says boosts can be bought with money: owner's choice now is gems. Selftest 73/73.
- Boost speed now costs 3 gems (BOOST_GEMS.speed).
- Save fix: Save.load only accepted v1 while saves were written as v3, so every refresh started fresh. Now both use CONFIG.SAVE_VERSION; selftest checks Save.save -> Save.load.
- Guide: the Chef Desk step (carry1) ends when the desk panel is opened; buying is optional.
- HUD: level bar moves to its own row whenever it would touch money/gems/sound (hud.fitTop, class .hud-narrow, HUD_TOP_GAP), instead of a fixed 640px breakpoint.
- Boost ads no longer wait for the first 5 minutes (only EARLY_AD_KINDS = levelup, upgrade do). The 3-min cooldown starts only after an ad is watched.
- Upgrade ad also has no first-5-minutes wait now (EARLY_AD_KINDS = levelup only). Only the Boost ads have a timer (3 min after watching).
- Level gems are now given on Claim (with the money), not at the level-up moment behind the panel; early-phase level-ups still give them right away. Unclaimed panel gems are saved (pendingGems). Claim x3 multiplies money only.
- Claim x3 (ad) now triples the level gems too; the ad button shows them (hud.adClaimText).
- Wing 2 quiet start shortened (owner choice): WING2_RAMP_START 0.25 -> 0.6, WING2_RAMP_SECONDS 240 -> 60 (crowd rule starts after 60 s). Pacing 20 min leave %: normal 6 -> 13, fast 4 -> 2, ads 14 -> 17.
- Tips collect faster: TIP_COLLECT_TIME 0.35 s / TIP_COLLECT_MIN_RATE 300 (sales pile unchanged). Big tip piles from upgraded tables used to need 1.2 s, so walking past left part of the pile (looked stuck). Rate also rises if a tip lands mid-collect.
- Table upgrade circles: Eco.tableUpPos now searches around the table for a free spot (not on a neighbour table / tip / cleaning spot / wall / line / other circle, and not hidden behind a table + its Lv label on screen: Eco.hiddenBy, TABLE_HIDE_H). New selftest 'floor circles' checks all 30 upgrade circles in both wings (fails on the old placement at tu2_11).

## Economy rework (Oct 7, 2026, owner-approved plan)
- Levels never stop: XP_PER_SALE per alien served + builds; LEVEL_XP_GROWTH 1.06; GEM_EVERY_5_LEVELS bonus.
- Every upgrade step (machines, pad/tank, counter storage, tables) costs MONEY: Eco.priceOf = max(list price, income x UPGRADE_INCOME_SECONDS x (1 + UPGRADE_STEP_EXTRA x step)); locked when the circle appears (game.priceLock, saved). No gem circles on the floor anymore.
- After paying an upgrade: game.pendingChoice -> ads.openChoice -> hud.showChoice (two cards). keepNormal() / chooseHot('gems'|'ad'). HOT = cfg.PREMIUM bonuses on the station (.hot on Machine/Source/Counter/table), +PREMIUM_XP, gold label with a star (levelOf().hot). HOT ad has no timer (owner).
- Worker upgrades: gems or ad (adCd.workerUp, WORKER_AD_COOLDOWN 180). Chef: gems only, Profit most expensive.
- Floor offers: js/core/offers.js (TBS.FloorOffers). One at a time near the chef in a free spot (not on tables/tips/circles/walls/line, not hidden behind a table). OFFER_LIFE 30 s, next after OFFER_GAP 60 s or OFFER_GAP_AFTER_AD 180 s. Panel hud.showOffer (gems / Free / Close). Effects: magnet (MAGNET_RADIUS), hover board (HOVER_SPEED_MULT, chef rides a board), cash, helper 5 min, gems 5/10/25 (ad only). Starts after the guide.
- Worker deadlock fix: a worker holding food at a full counter returns it to the machine after WORKER_FULL_WAIT (phase toOutputBack); bot uses the return pad.
- Saves: SAVE_VERSION 4, loader accepts 3..4.
- STUDIO-RULES section 10 updated (floor offers, HOT upgrade panel, worker ad timer).
- Pacing 60 min: normal L37, fast L38, ads L33; leave 1-2%; ~85-95 floor steps still left after 1 h.
- Hire Desk redesigned: one card per worker (Speed / Capacity pip bars) with ONE upgrade button that takes speed and capacity in turns (game.workerNext / upgradeWorkerNext / upgradeWorkerNextByAd), gems or FREE (ad, shared 3-min timer). Hire card at the bottom. hud.renderWorkers + .wcard CSS.
- Panel lists scroll again: input.js no longer blocks wheel / touchmove inside .panel (page itself still never scrolls); .panel touch-action pan-y. Guide sending the chef to Wing 1 money while short of money for a Wing 2 build is intended (owner confirmed).

## Phone speed (Oct 8, 2026)
- Owner phone: Adreno 506 (weak GPU). index.html?perf shows FPS, time per part, triangles, GPU name and switches (js/perf.js; off without ?perf).
- Phone results: game code is light; the cost is drawing. Late game had ~176k triangles (aliens 2188 / 1560 each, burger 536) and the shadow pass draws them all again. Shadows off alone: 18 FPS late game. Shadow type / map size changed little.
- Fix 1: CROWD_DETAIL 0.55 builds aliens, food and money with fewer round-shape segments (B.withDetail in builders.js). Purple alien 2188 -> 876, blue 1560 -> 654, burger 536 -> 274. Looks the same at game zoom (checked side by side).
- Next if still slow: cheaper shadows (fake floor shadows), then view.update time (8-11 ms on the phone).
- Phone after fix 1: late game 176k -> 113k triangles; shadows on 9 FPS (draw 78 ms), shadows off 20 FPS (draw 28 ms, view 10 ms). Shadows are about half the frame.
- Fix 2: money piles draw each fully covered layer as ONE box (slabA/B, tslabA/B) instead of 12 or 6 notes; only the visible top notes stay separate. Bot late game (L19): 2267 note instances -> ~340, 80k -> 58k triangles; looks the same. Workers and cashiers also use CROWD_DETAIL (chef stays full detail).
- perf.js: "Shadow freeze" stops redrawing the shadow map (shadows stay visible) to split shadow cost into drawing vs showing.
- Phone after fix 2: 76k triangles. Shadow freeze = same 9 FPS as live, so the cost is SHOWING shadows (per-pixel), not drawing the shadow map. Shadows off: 20 FPS.
- Fix 3: SHADOWS false (owner: fine to remove shadows). Next suspect at 20 FPS: draw calls / CPU on the phone (draw ~27 ms for ~126 calls) or transparent floor circles; test Sharp 0.5 late game to tell GPU fill from CPU.
- Phone without shadows: Sharp 0.5 gave the same FPS (22 vs 21), so it is NOT pixel work. Cost grows with draw calls (~0.2 ms each on Adreno 506 + Chrome).
- Fix 4: workers and cashiers are drawn in batches (RigBatch in characters.js): one draw call per body part per look instead of 6 per person. Rigs are kept outside the scene only for their pose; View.update calls chars.syncRigs() after fx (pop-in scale). Chef stays a normal rig.

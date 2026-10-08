/* Node runner for the pacing simulation. The owner can instead double-click sim/pacing.html. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

globalThis.window = globalThis;
const root = path.join(__dirname, '..');
const files = ['js/config.js', 'js/core/util.js', 'js/core/nav.js', 'js/core/economy.js', 'js/core/stations.js',
  'js/core/customers.js', 'js/core/workers.js', 'js/core/player.js', 'js/core/guide.js', 'js/core/offers.js', 'js/core/game.js', 'sim/bot.js'];
for (const f of files) vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });

const minutes = Number(process.argv[2]) || 15;
const out = window.TBS.Pacing.report(window.TBS.CONFIG, minutes, 1 / 30);
console.log(out.text);

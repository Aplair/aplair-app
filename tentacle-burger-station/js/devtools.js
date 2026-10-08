/* DEV TOOLS (only when CONFIG.DEV_TOOLS = true; turn it off before upload).
   Shift+M +$1000 | Shift+L +1 level | Shift+W build all of Wing 1 (opens Wing 2) | Shift+T speed x5 | Shift+R reset (asks first) | Shift+D test log.
   Session test log for the 5-player test: stored apart from the save, kept when progress is reset. */
(function (TBS) {
  'use strict';

  const U = TBS.U;

  class Dev {
    constructor(game, hud, input, ads) {
      this.game = game; this.hud = hud; this.input = input; this.ads = ads;
      this.speed = 1;
      this.t = 0; this.saveT = 0;
      this.startLog();
      window.addEventListener('keydown', (e) => this.key(e));
      window.addEventListener('pagehide', () => this.finishLog());
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.finishLog(); });
    }

    key(e) {
      if (!e.shiftKey || e.repeat) return;
      const g = this.game;
      const busy = this.hud.panel && this.hud.panel.kind !== 'dev';
      switch (e.code) {
        case 'KeyM': g.addMoney(1000, 'dev'); this.used(); break;
        case 'KeyL': if (!busy) { g.addXp(Math.max(1, g.xpForLevel(g.level + 1) - g.xp)); this.used(); } break;
        case 'KeyW': // build all of Wing 1 for free (basics, every table, Machine 2) -> Wing 2 opens
          if (!busy && !g.wing2Open) {
            const ids = ['b_src1', 'b_m1', 'b_ctr1', 'b_bin1', 'b_chef1', 'b_hire1', 'b_term1'].concat(Object.keys(g.trackDefs).filter((id) => /^t1_|^machine2$/.test(id)));
            for (const id of ids) if (!g.tracks[id]) g.purchase(id);
            if (!g.guide.done) { g.guide.done = true; g.emit('guideDone', {}); g.rebuildWorld(); }
            this.used();
          }
          break;
        case 'KeyT': this.speed = this.speed === 1 ? 5 : 1; this.hud.setDev(this.speed > 1 ? 'x5 SPEED' : ''); this.used(); break;
        case 'KeyR': if (!this.hud.panel) this.confirmReset(); break;
        case 'KeyD': if (this.hud.panel && this.hud.panel.kind === 'dev') this.closeDev(); else if (!this.hud.panel) this.showLog(); break;
        default: return;
      }
      e.preventDefault();
    }

    used() { this.log.dev = true; }

    confirmReset() {
      this.ads.pause();
      const p = this.hud.openPanel('dev confirm', '<div class="p-title">Reset all progress?</div><div class="p-sub">Money, levels, upgrades and workers go back to the start. The test log is kept.</div><div class="p-btns"><button class="btn" data-a="yes">Yes, reset</button><button class="btn" data-a="no">Cancel</button></div>');
      p.kind = 'dev';
      this.hud.bindBtn(p.el.querySelector('[data-a="yes"]'), () => {
        this.finishLog();
        TBS.Main && TBS.Main.stopSaving();
        TBS.Save.clear();
        location.reload();
      });
      this.hud.bindBtn(p.el.querySelector('[data-a="no"]'), () => this.closeDev());
    }

    closeDev() { this.hud.closePanel(); this.ads.resume(); }

    // ---------- session test log ----------
    readLog() {
      try { const a = JSON.parse(TBS.CG.storage.getItem(TBS.CONFIG.TESTLOG_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
    }

    startLog() {
      const g = this.game, list = this.readLog();
      const prev = list.length ? list[list.length - 1].n || list.length : 0;
      this.log = {
        n: prev + 1, started: new Date().toISOString().slice(0, 16).replace('T', ' '),
        newSave: g.isNewSave, startLevel: g.level, firstMove: null, firstPickup: null, firstSale: null, firstBuy: null,
        levels: {}, play: 0, maxLevel: g.level, wing2: g.wing2Open ? 0 : null, green: null, last: 'opened the game', dev: false, input: { keyboard: 0, mouse: 0, touch: 0 }
      };
      this.list = list.concat([this.log]).slice(-TBS.CONFIG.TESTLOG_MAX);
      this.writeLog();
      this.input.onFirstMove = () => { if (this.log.firstMove === null) this.log.firstMove = Math.round(this.t); };
    }

    writeLog() {
      this.log.input = { keyboard: Math.round(this.input.usage.keyboard), mouse: Math.round(this.input.usage.mouse), touch: Math.round(this.input.usage.touch) };
      this.log.play = Math.round(this.t);
      try { TBS.CG.storage.setItem(TBS.CONFIG.TESTLOG_KEY, JSON.stringify(this.list)); } catch (e) { /* ignore */ }
    }

    finishLog() { if (this.log) this.writeLog(); }

    onEvent(e) {
      const L = this.log, d = e.data, s = Math.round(this.t);
      switch (e.type) {
        case 'pickup': if (d.who === 'player') { if (L.firstPickup === null) L.firstPickup = s; L.last = 'picked up ' + d.item.type + 's'; } break;
        case 'drop': if (d.who === 'player') {
          L.last = d.kind === 'counter' ? 'put food on the counter' : d.kind === 'bin' ? 'threw trash in the bin' : 'filled a machine';
          if (d.kind === 'counter' && d.counter.chain === 'g' && L.green === null && L.wing2 !== null) L.green = s - L.wing2;
        } break;
        case 'return': L.last = 'used a return pad'; break;
        case 'paid': if (L.firstSale === null) L.firstSale = s; break;
        case 'collect': L.last = 'collected money'; break;
        case 'purchase': if (L.firstBuy === null) L.firstBuy = s; L.last = 'bought ' + d.label + (d.kind === 'upgrade' ? ' ' + (d.step + 1) : ''); this.writeLog(); break;
        case 'levelup': L.levels[d.level] = s; L.maxLevel = Math.max(L.maxLevel, d.level); L.last = 'reached level ' + d.level; this.writeLog(); break;
        case 'wing2Open': L.wing2 = s; L.last = 'Wing 2 opened'; this.writeLog(); break;
        case 'terminalOpen': L.last = d.desk === 'chef' ? 'opened the Chef Desk' : d.desk === 'hire' ? 'opened a Hire Desk' : 'opened a Boost Terminal'; break;
        case 'deskBuy': L.last = d.desk === 'chef' ? 'chef desk: ' + d.kind + ' ' + d.level : d.kind === 'hire' ? 'hired a worker' : 'worker upgrade: ' + d.kind; this.writeLog(); break;
        case 'boost': L.last = 'got a boost (' + d.type + ')'; break;
        case 'money': if (d.why === 'claim' || d.why === 'claimAd') L.last = d.why === 'claimAd' ? 'claimed x3 with an ad' : 'claimed a level reward'; break;
      }
    }

    update(dt) {
      this.t += dt;
      this.saveT += dt;
      if (this.saveT >= 5) { this.saveT = 0; this.writeLog(); }
    }

    showLog() {
      this.writeLog();
      this.ads.pause();
      const f = (v) => (v === null || v === undefined ? '-' : U.fmtTime(v));
      const rows = this.list.slice().reverse().map((r) => {
        const lv = Object.keys(r.levels || {}).map((k) => 'L' + k + ' ' + f(r.levels[k])).join(', ');
        const tot = (r.input.keyboard + r.input.mouse + r.input.touch) || 1;
        const inp = ['keyboard', 'mouse', 'touch'].filter((k) => r.input[k] > 0).map((k) => k + ' ' + Math.round(100 * r.input[k] / tot) + '%').join(', ') || '-';
        return '<tr' + (r === this.log ? ' class="now"' : '') + '><td>' + r.n + (r === this.log ? ' (now)' : '') + '</td><td>' + r.started + '</td><td>' + (r.newSave ? 'new' : 'continued (L' + r.startLevel + ')') + '</td><td>' + f(r.firstMove) + '</td><td>' + f(r.firstPickup) + '</td><td>' + f(r.firstSale) + '</td><td>' + f(r.firstBuy) +
          '</td><td class="lv">' + (lv || '-') + '</td><td>' + f(r.play) + '</td><td>' + r.maxLevel + '</td><td>' + (r.wing2 === null ? 'no' : 'yes, ' + f(r.wing2)) + '</td><td>' + (r.green === null ? '-' : r.green + ' s') + '</td><td>' + inp + '</td><td>' + r.last + '</td><td>' + (r.dev ? 'YES' : '') + '</td></tr>';
      }).join('');
      const p = this.hud.openPanel('dev log', '<div class="p-title">Test log (last ' + TBS.CONFIG.TESTLOG_MAX + ' sessions)</div><div class="log-wrap"><table><tr><th>#</th><th>started</th><th>save</th><th>1st move</th><th>1st pickup</th><th>1st sale</th><th>1st buy</th><th>level-ups (time)</th><th>play time</th><th>max level</th><th>Wing 2 reached</th><th>1st blue dish after Wing 2 opened</th><th>controls used</th><th>last thing done</th><th>dev keys used</th></tr>' + rows + '</table></div><div class="p-btns one"><button class="btn" data-a="close">Close</button></div>');
      p.kind = 'dev';
      this.hud.bindBtn(p.el.querySelector('[data-a="close"]'), () => this.closeDev());
    }

    error(err) {
      let b = document.getElementById('dev-error');
      if (!b) { b = document.createElement('div'); b.id = 'dev-error'; document.body.appendChild(b); }
      b.textContent = 'ERROR: ' + (err && err.message ? err.message : String(err));
      b.style.display = 'block';
    }
  }

  TBS.Dev = Dev;
})(window.TBS = window.TBS || {});

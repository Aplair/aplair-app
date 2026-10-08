/* HUD (money, level + XP bar, sound button), pause panels (level-up, Boost Terminal), banners, toasts, confetti. */
(function (TBS) {
  'use strict';

  const U = TBS.U;
  const $ = (id) => document.getElementById(id);
  const VIDEO = '<svg class="vid" viewBox="0 0 20 16" aria-hidden="true"><rect x="1" y="1" width="18" height="14" rx="3.5" fill="currentColor" opacity="0.25"/><path d="M8 4.5 L14 8 L8 11.5 Z" fill="currentColor"/></svg>';
  const SPK_ON = '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  const SPK_OFF = '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

  const narrow = () => window.innerWidth < 640; // phone upright: short button labels

  class Confetti {
    constructor(canvas) { this.c = canvas; this.x = canvas.getContext('2d'); this.p = []; this.on = false; }
    burst(n) {
      const w = this.c.width = window.innerWidth, h = this.c.height = window.innerHeight;
      const cols = ['#ff5a7a', '#ffd23a', '#37b6ff', '#9b4dde', '#ff9a2e', '#ffffff', '#2fe0c8'];
      for (let i = 0; i < n; i++) this.p.push({ x: w / 2 + (Math.random() - 0.5) * w * 0.5, y: h * 0.32, vx: (Math.random() - 0.5) * 700, vy: -Math.random() * 650 - 150, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14, s: 6 + Math.random() * 7, c: cols[i % cols.length], t: 0 });
      this.on = true;
    }
    update(dt) {
      if (!this.on) return;
      const x = this.x, h = this.c.height;
      x.clearRect(0, 0, this.c.width, h);
      for (let i = this.p.length - 1; i >= 0; i--) {
        const p = this.p[i];
        p.t += dt; p.vy += 900 * dt; p.vx *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        if (p.y > h + 20 || p.t > 3) { this.p.splice(i, 1); continue; }
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore();
      }
      if (!this.p.length) { this.on = false; x.clearRect(0, 0, this.c.width, h); }
    }
  }

  class Hud {
    constructor(game) {
      this.game = game;
      this.el = { money: $('money'), gems: $('gems'), gemBox: $('gem-box'), boosts: $('boosts'), level: $('level-num'), xp: $('xp-fill'), sound: $('sound-btn'), toast: $('toast'), banner: $('banner'), hint: $('hint'), dev: $('dev-badge'), layer: $('panel-layer'), blocker: $('blocker') };
      this.moneyShown = game.money;
      this.levelShown = game.level;
      this.el.level.textContent = game.level;
      this.panel = null;
      this.toastT = 0; this.bannerT = 0;
      this.confetti = new Confetti($('confetti'));
      this.busyBtn = null;
      this.onSound = null;
      this.el.sound.addEventListener('click', (e) => { e.stopPropagation(); if (this.onSound) this.onSound(); });
      this.el.sound.addEventListener('pointerdown', (e) => e.stopPropagation());
      this.lastBoostHtml = '';
      this.xpAnim = null;
    }

    setSound(muted, forced) { this.el.sound.innerHTML = muted ? SPK_OFF : SPK_ON; this.el.sound.classList.toggle('off', muted); this.el.sound.classList.toggle('forced', !!forced); }
    hideHint() { this.el.hint.classList.add('gone'); }
    // money + gems and the level bar must never cover each other: if the centred level bar would touch them
    // (or the sound button), it moves to its own row under them. Checked when the screen size or the number lengths change.
    fitTop() {
      const hud = $('hud'), gap = this.game.cfg.HUD_TOP_GAP;
      hud.classList.remove('hud-narrow');
      const res = this.el.money.closest('.res-row').getBoundingClientRect();
      const lv = $('level-box').getBoundingClientRect(), snd = this.el.sound.getBoundingClientRect();
      hud.classList.toggle('hud-narrow', lv.left < res.right + gap || lv.right > snd.left - gap);
    }
    setDev(text) { this.el.dev.textContent = text || ''; this.el.dev.style.display = text ? 'block' : 'none'; }

    toast(text, ms) { this.el.toast.textContent = text; this.el.toast.classList.add('show'); this.toastT = (ms || 2000) / 1000; }

    banner(title, sub, big) {
      const b = this.el.banner;
      b.innerHTML = '<div class="b-title">' + title + '</div>' + (sub ? '<div class="b-sub">' + sub + '</div>' : '');
      b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
      b.classList.toggle('big', !!big);
      this.bannerT = 2.0;
    }

    celebrate() { this.confetti.burst(90); }

    setBlocker(on) { this.el.blocker.classList.toggle('show', !!on); }

    // ---------- pause panels ----------
    openPanel(cls, html) {
      this.closePanel();
      const layer = this.el.layer;
      layer.innerHTML = '<div class="panel ' + cls + '">' + html + '</div>';
      layer.classList.add('show');
      this.panel = { el: layer.firstChild, cls: cls, openedAt: performance.now() };
      return this.panel;
    }

    closePanel() {
      this.el.layer.classList.remove('show');
      this.el.layer.innerHTML = '';
      this.panel = null;
      this.busyBtn = null;
    }

    // Clicks only count if the press started after the panel opened (a drag that ends on a button is ignored).
    bindBtn(btn, fn) {
      if (!btn) return;
      btn.addEventListener('pointerdown', (e) => { btn._down = performance.now(); e.stopPropagation(); });
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.disabled || !this.panel) return;
        if (e.detail > 0 && !(btn._down >= this.panel.openedAt)) return;
        TBS.Audio.play('click');
        fn(btn);
      });
    }

    setBusy(btn) {
      this.busyBtn = btn || null;
      if (btn) { btn.classList.add('busy'); btn.disabled = true; }
    }

    showLevelPanel(o) {
      const html = '<div class="p-title">Level ' + o.level + '!</div>' +
        (o.wing ? '<div class="p-wing">NEW WING OPEN!</div>' : '') +
        '<div class="p-sub">Reward</div><div class="p-reward">' + this.rewardHtml(o) + '</div>' +
        '<div class="p-btns"><button class="btn" data-a="claim">Claim</button>' +
        (o.showAd ? '<button class="btn" data-a="ad">' + VIDEO + '<span>' + this.adClaimText(o) + '</span></button>' : '') + '</div>' +
        '<div class="p-note"></div>';
      const p = this.openPanel('level' + (o.wing ? ' wing' : ''), html);
      p.kind = 'level';
      const claim = p.el.querySelector('[data-a="claim"]'), ad = p.el.querySelector('[data-a="ad"]');
      this.bindBtn(claim, () => o.onClaim());
      this.bindBtn(ad, (b) => o.onAd(b));
      p.claim = claim; p.ad = ad;
      if (ad && TBS.CG.adblock) { ad.disabled = true; p.el.querySelector('.p-note').textContent = 'Turn off your ad blocker to get this reward'; }
      this.celebrate();
      return p;
    }

    updateLevelPanel(o) {
      const p = this.panel;
      if (!p || p.kind !== 'level') return;
      p.el.querySelector('.p-title').textContent = 'Level ' + o.level + '!';
      p.el.querySelector('.p-reward').innerHTML = this.rewardHtml(o);
      if (p.ad && !p.ad.classList.contains('busy')) p.ad.querySelector('span').innerHTML = this.adClaimText(o);
    }

    // "+$110   +1 (gem)": the money reward and the gems that came with the level(s)
    rewardHtml(o) { return '+' + U.fmtMoney(o.reward) + (o.gems ? ' <span class="p-gems"><span class="gem"></span>+' + o.gems + '</span>' : ''); }

    adClaimText(o) {
      const gem = o.gems ? ' <span class="gem"></span>+' + o.gems * o.mult : ''; // the ad multiplies the gems too
      return (narrow() ? 'Ad: &times;' + o.mult : 'Watch ad: Claim &times;' + o.mult) + ' (+' + U.fmtMoney(o.reward * o.mult) + gem + ')';
    }

    showTerminal(o) {
      const g = this.game, rows = ['speed', 'items', 'worker', 'cash'];
      let html = '<div class="p-title">Boost</div><div class="rows">';
      for (const r of rows) {
        html += '<div class="row" data-r="' + r + '"><div class="r-name"><span class="r-ico ' + r + '"></span><span class="r-txt"></span></div>' +
          '<button class="btn" data-a="buy"></button>' + // cash: bought with gems
          '<button class="btn" data-a="ad"></button></div>';
      }
      html += '</div><div class="p-note"></div><div class="p-btns one"><button class="btn" data-a="close">Close</button></div>';
      const p = this.openPanel('term', html);
      p.kind = 'term'; p.wing = o.wing; p.rows = {};
      for (const r of rows) {
        const row = p.el.querySelector('[data-r="' + r + '"]');
        const buy = row.querySelector('[data-a="buy"]'), ad = row.querySelector('[data-a="ad"]');
        p.rows[r] = { txt: row.querySelector('.r-txt'), buy: buy, ad: ad };
        this.bindBtn(buy, () => o.onBuy(r));
        this.bindBtn(ad, (b) => o.onAd(r, b));
      }
      this.bindBtn(p.el.querySelector('[data-a="close"]'), () => o.onClose());
      if (TBS.CG.adblock) p.el.querySelector('.p-note').textContent = 'Turn off your ad blocker to get this reward';
      this.updateTerminal();
      return p;
    }

    updateTerminal() {
      const p = this.panel, g = this.game;
      if (!p || p.kind !== 'term') return;
      const w = p.wing, item = w === 2 ? ' goo' : ' tentacles';
      for (const r in p.rows) {
        const row = p.rows[r], active = g.boostActive(r, w);
        let name, reward;
        if (r === 'speed') { const m = 'x' + g.cfg.BOOST_SPEED_MULT, s = g.cfg.BOOST_SPEED_SECONDS + ' s'; name = m + ' speed &middot; ' + s; reward = m + ' speed ' + s; }
        else if (r === 'items') { const n = g.boostItems(w); name = '+' + n + item; reward = '+' + n + item; }
        else if (r === 'worker') { name = 'Helper &middot; 2 min'; reward = 'Helper 2 min'; }
        else { const c = g.cashReward(); name = '+' + U.fmtMoney(c) + ' cash'; reward = '+' + U.fmtMoney(c); }
        if (row.txt.innerHTML !== name) row.txt.innerHTML = name;
        let left = 0;
        if (r === 'speed') left = g.boosts.speed;
        if (r === 'worker') for (const wk of g.workers) if (wk.temp > 0 && wk.chain === g.chainOfWing(w)) left = Math.max(left, wk.temp);
        if (row.buy) { // every boost costs rare gems (or an ad)
          const gp = g.boostPrice(r), html = active ? 'Active ' + U.fmtTime(left) : '<span class="gem"></span>' + gp;
          if (row.buy._html !== html) { row.buy.innerHTML = html; row.buy._html = html; }
          row.buy.disabled = active || g.gems < gp;
        }
        if (row.ad && row.ad !== this.busyBtn) {
          let html, dis = false;
          const adTxt = narrow() ? 'Ad' : 'Watch ad: ' + reward;
          if (TBS.CG.adblock) { html = VIDEO + '<span>' + adTxt + '</span>'; dis = true; }
          else if (active) { html = VIDEO + '<span>Active ' + U.fmtTime(left) + '</span>'; dis = true; }
          else if (!g.adReady(r)) { html = VIDEO + '<span>' + U.fmtTime(g.adWait(r)) + '</span>'; dis = true; }
          else html = VIDEO + '<span>' + adTxt + '</span>';
          if (row.ad._html !== html) { row.ad.innerHTML = html; row.ad._html = html; }
          row.ad.disabled = dis;
          row.ad.classList.remove('busy');
        }
      }
    }

    // ---------- Chef Desk / Hire Desk (money only, paused) ----------
    showDesk(o) {
      const title = o.desk === 'chef' ? 'Chef' : 'Workers';
      const p = this.openPanel('desk', '<div class="p-title">' + title + '</div><div class="rows"></div><div class="p-note"></div><div class="p-btns one"><button class="btn" data-a="close">Close</button></div>');
      p.kind = 'desk'; p.desk = o.desk; p.wing = o.wing; p.onBuy = o.onBuy; p.onAd = o.onAd;
      this.bindBtn(p.el.querySelector('[data-a="close"]'), () => o.onClose());
      this.renderDesk();
      return p;
    }

    renderDesk() {
      const p = this.panel, g = this.game, cfg = g.cfg;
      if (!p || p.kind !== 'desk') return;
      const rowsEl = p.el.querySelector('.rows'), items = [];
      const lvTxt = (l, max) => (l >= max ? 'MAX' : 'Lv ' + l + '/' + max);
      const buyTxt = (price) => (price === null ? 'MAX' : 'Buy ' + U.fmtMoney(price));
      const gemTxt = (price) => (price === null ? 'MAX' : '<span class="gem"></span>' + price); // chef + worker upgrades cost gems
      if (p.desk === 'chef') {
        const info = {
          speed: ['Move speed', 'speed', (l) => 'speed x' + (cfg.CHEF_SPEED[l] / cfg.CHEF_SPEED[0]).toFixed(2)],
          carry: ['Capacity', 'carry', (l) => 'holds ' + cfg.CHEF_CARRY[l]],
          profit: ['Profit', 'profit', (l) => 'money x' + cfg.CHEF_PROFIT[l]]
        };
        for (const k of ['speed', 'carry', 'profit']) {
          const l = g.chef[k], max = cfg.CHEF_PRICES[k].length, price = g.chefPrice(k);
          items.push({ ico: info[k][1], name: info[k][0], lv: lvTxt(l, max) + ' &middot; ' + info[k][2](l), btns: [{ txt: gemTxt(price), dis: price === null || g.gems < price, act: k }] });
        }
      } else { this.renderWorkers(p, rowsEl); return; }
      let html = '';
      items.forEach((it, i) => {
        html += '<div class="row' + (it.btns.length === 1 ? ' one' : '') + '"><div class="r-name"><span class="r-ico ' + it.ico + '"></span><span class="r-txt">' + it.name + '<span class="r-lv">' + it.lv + '</span></span></div>';
        it.btns.forEach((bt, j) => { html += '<button class="btn' + (bt.html ? ' two' : '') + '" data-i="' + i + '_' + j + '">' + (bt.html || bt.txt || '') + '</button>'; });
        html += '</div>';
      });
      const keep = rowsEl.scrollTop; // (re-render after a buy keeps the list where it was)
      rowsEl.innerHTML = html;
      rowsEl.scrollTop = keep;
      p.adBtns = [];
      items.forEach((it, i) => it.btns.forEach((bt, j) => {
        const el = rowsEl.querySelector('[data-i="' + i + '_' + j + '"]');
        if (bt.ad) { el._max = bt.max; p.adBtns.push(el); this.bindBtn(el, (b) => p.onAd(bt.act, b)); return; }
        el.disabled = bt.dis;
        this.bindBtn(el, () => { p.onBuy(bt.act); this.renderDesk(); });
      }));
      this.updateDesk();
    }

    // Hire Desk: one small card per worker (skill bars + ONE upgrade button that takes speed / capacity in turns,
    // paid with gems or "FREE" with an ad), then the "hire" card
    renderWorkers(p, rowsEl) {
      const g = this.game, cfg = g.cfg, hired = TBS.Workers.hired(g, g.chainOfWing(p.wing));
      const maxS = cfg.WORKER_UP_PRICES.speed.length, maxC = cfg.WORKER_UP_PRICES.cap.length;
      const pips = (n, max) => { let h = ''; for (let i = 0; i < max; i++) h += '<i' + (i < n ? ' class="on"' : '') + '></i>'; return '<span class="pips">' + h + '</span>'; };
      let html = '';
      hired.forEach((w, i) => {
        const pr = g.workerNextPrice(w), lv = w.sp + w.cap, max = pr === null;
        html += '<div class="wcard"><div class="w-ava"><span class="r-ico worker"></span><span class="w-lv">' + (max ? 'MAX' : 'Lv ' + lv) + '</span></div>' +
          '<div class="w-mid"><div class="w-name">Worker ' + (i + 1) + '</div>' +
          '<div class="w-sk"><span>Speed</span>' + pips(w.sp, maxS) + '</div>' +
          '<div class="w-sk"><span>Capacity</span>' + pips(w.cap, maxC) + '</div></div>' +
          '<div class="w-btns">' + (max ? '<button class="btn" disabled>MAX</button>' :
            '<button class="btn" data-w="' + i + '" data-a="gems"><span class="gem"></span>' + pr + '</button><button class="btn" data-w="' + i + '" data-a="ad"></button>') + '</div></div>';
      });
      const hp = g.hirePrice(p.wing);
      html += '<div class="wcard hire"><div class="w-ava"><span class="r-ico worker"></span></div><div class="w-mid"><div class="w-name">Hire worker</div><div class="w-sub">' + hired.length + '/' + cfg.WORKERS_PER_WING + ' in this wing</div></div>' +
        '<div class="w-btns"><button class="btn" data-a="hire">' + (hp === null ? 'MAX' : 'Buy ' + U.fmtMoney(hp)) + '</button></div></div>';
      const keep = rowsEl.scrollTop;
      rowsEl.innerHTML = html;
      rowsEl.scrollTop = keep;
      p.adBtns = [];
      rowsEl.querySelectorAll('[data-a="gems"]').forEach((el) => {
        const w = hired[+el.dataset.w];
        el.disabled = g.gems < g.workerNextPrice(w);
        this.bindBtn(el, () => { p.onBuy({ w: w, next: true }); this.renderDesk(); });
      });
      rowsEl.querySelectorAll('[data-a="ad"]').forEach((el) => {
        const w = hired[+el.dataset.w];
        p.adBtns.push(el);
        this.bindBtn(el, (b) => p.onAd({ w: w, next: true }, b));
      });
      const hb = rowsEl.querySelector('[data-a="hire"]');
      hb.disabled = hp === null || g.money < hp;
      this.bindBtn(hb, () => { p.onBuy('hire'); this.renderDesk(); });
      this.updateDesk();
    }

    // worker "FREE" (ad) buttons: ready, or the time left on the shared 3-minute timer
    updateDesk() {
      const p = this.panel, g = this.game;
      if (!p || p.kind !== 'desk' || !p.adBtns) return;
      for (const el of p.adBtns) {
        if (el === this.busyBtn) continue;
        let html, dis = false;
        if (el._max) { html = 'MAX'; dis = true; }
        else if (TBS.CG.adblock) { html = VIDEO + '<span>Ad</span>'; dis = true; }
        else if (!g.adReady('workerUp')) { html = VIDEO + '<span>' + U.fmtTime(g.adWait('workerUp')) + '</span>'; dis = true; }
        else html = VIDEO + '<span>Free</span>';
        if (el._html !== html) { el.innerHTML = html; el._html = html; }
        el.disabled = dis;
        el.classList.remove('busy');
      }
      const n = p.el.querySelector('.p-note'), note = p.adBtns.length && TBS.CG.adblock ? 'Turn off your ad blocker to get this reward' : '';
      if (n && n.textContent !== note) n.textContent = note;
    }

    // ---------- just paid an upgrade (paused): two cards side by side, the paid one or the stronger HOT one ----------
    showChoice(o) {
      const c = o.cards, lines = (a) => a.map((t) => '<div class="c-line">' + t + '</div>').join('');
      const star = (n) => '<div class="c-xp"><span class="star"></span>+' + n + '</div>';
      const html = '<div class="p-title">' + o.name + '</div>' +
        '<div class="p-sub">Lv ' + (o.toLevel - 1) + ' &rarr; ' + (o.toLevel >= o.maxLevel ? 'MAX' : 'Lv ' + o.toLevel) + '</div>' +
        '<div class="cards">' +
          '<div class="card"><div class="c-head">Upgrade</div>' + lines(c.normal) + star(c.xp) +
            '<div class="c-btns"><button class="btn" data-a="normal">Select</button></div></div>' +
          '<div class="card hot"><div class="c-ribbon">HOT</div><div class="c-head">Super upgrade</div>' + lines(c.hot) + star(c.hotXp) +
            '<div class="c-btns"><button class="btn" data-a="gems"><span class="gem"></span>' + c.gems + '</button><button class="btn" data-a="ad"></button></div></div>' +
        '</div><div class="p-note"></div>';
      const p = this.openPanel('choice', html);
      p.kind = 'choice'; p.o = o;
      p.normal = p.el.querySelector('[data-a="normal"]'); p.gemsBtn = p.el.querySelector('[data-a="gems"]'); p.ad = p.el.querySelector('[data-a="ad"]');
      this.bindBtn(p.normal, () => o.onNormal());
      this.bindBtn(p.gemsBtn, () => o.onGems());
      this.bindBtn(p.ad, (b) => o.onAd(b));
      this.updateChoice();
      return p;
    }

    updateChoice() {
      const p = this.panel, g = this.game;
      if (!p || p.kind !== 'choice') return;
      p.gemsBtn.disabled = g.gems < p.o.cards.gems;
      if (p.ad !== this.busyBtn) { // the HOT ad has no timer (owner's choice)
        const html = VIDEO + '<span>Free</span>', dis = !!TBS.CG.adblock;
        if (p.ad._html !== html) { p.ad.innerHTML = html; p.ad._html = html; }
        p.ad.disabled = dis;
        p.ad.classList.remove('busy');
      }
      const note = TBS.CG.adblock ? 'Turn off your ad blocker to get this reward' : '';
      const n = p.el.querySelector('.p-note');
      if (n.textContent !== note) n.textContent = note;
    }

    // ---------- floor offer (paused): picture + reward, then gems / "Watch ad" / Close (all the same size) ----------
    offerInfo(f) {
      const cfg = this.game.cfg;
      if (f.type === 'magnet') return { title: 'Money magnet', txt: 'Money flies to you from far away', amt: f.amount + ' s' };
      if (f.type === 'hover') return { title: 'Space hover board', txt: 'Ride it and move x' + cfg.HOVER_SPEED_MULT + ' faster', amt: f.amount + ' s' };
      if (f.type === 'cash') return { title: 'Cash case', txt: 'Money right now', amt: '+' + U.fmtMoney(f.amount) };
      if (f.type === 'worker') return { title: 'Extra helper', txt: 'A helper works with you', amt: Math.round(f.amount / 60) + ' min' };
      return { title: f.type === 'gemsL' ? 'Gem treasure!' : f.type === 'gemsM' ? 'Gem pack' : 'A few gems', txt: 'Rare gems', amt: '+' + f.amount, gem: true };
    }

    showOffer(o) {
      const f = o.offer, info = this.offerInfo(f);
      const html = '<div class="p-title">' + info.title + '</div>' +
        '<div class="o-pic"><span class="o-ico ' + f.type + '"></span></div>' +
        '<div class="p-reward">' + (info.gem ? '<span class="p-gems"><span class="gem"></span>' + info.amt + '</span>' : info.amt) + '</div>' +
        '<div class="p-sub">' + info.txt + '</div>' +
        '<div class="p-btns">' + (o.price !== null ? '<button class="btn" data-a="gems"><span class="gem"></span>' + o.price + '</button>' : '') +
          '<button class="btn" data-a="ad"></button><button class="btn" data-a="close">Close</button></div><div class="p-note"></div>';
      const p = this.openPanel('offer', html);
      p.kind = 'offer'; p.o = o;
      p.gemsBtn = p.el.querySelector('[data-a="gems"]'); p.ad = p.el.querySelector('[data-a="ad"]');
      this.bindBtn(p.gemsBtn, () => o.onGems());
      this.bindBtn(p.ad, (b) => o.onAd(b));
      this.bindBtn(p.el.querySelector('[data-a="close"]'), () => o.onClose());
      this.updateOffer();
      return p;
    }

    updateOffer() {
      const p = this.panel, g = this.game;
      if (!p || p.kind !== 'offer') return;
      if (p.gemsBtn) p.gemsBtn.disabled = g.gems < p.o.price;
      if (p.ad !== this.busyBtn) {
        const html = VIDEO + '<span>Free</span>';
        if (p.ad._html !== html) { p.ad.innerHTML = html; p.ad._html = html; }
        p.ad.disabled = !!TBS.CG.adblock;
        p.ad.classList.remove('busy');
      }
      const note = TBS.CG.adblock ? 'Turn off your ad blocker to get this reward' : '';
      const n = p.el.querySelector('.p-note');
      if (n.textContent !== note) n.textContent = note;
    }

    // ---------- Wing 1 complete -> new wing ----------
    showWingPanel(o) {
      const p = this.openPanel('level wing', '<div class="p-title">Wing 1 complete!</div><div class="p-wing">NEW WING OPEN!</div>' +
        '<div class="p-btns one"><button class="btn" data-a="open">Let\'s go!</button></div>');
      p.kind = 'wing';
      const b = p.el.querySelector('[data-a="open"]');
      this.bindBtn(b, () => o.onOpen());
      p.claim = b;
      this.celebrate();
      return p;
    }

    // ---------- every frame ----------
    update(dt) {
      const g = this.game;
      // money counts up quickly
      if (Math.abs(g.money - this.moneyShown) < 1) this.moneyShown = g.money;
      else this.moneyShown += (g.money - this.moneyShown) * U.smooth(10, dt);
      const mtxt = U.fmtMoney(this.moneyShown);
      if (this.el.money.textContent !== mtxt) this.el.money.textContent = mtxt;
      const gtxt = String(g.gems);
      if (this.el.gems.textContent !== gtxt) {
        if (this.el.gems.textContent !== '' && Number(gtxt) > Number(this.el.gems.textContent)) { this.el.gemBox.classList.remove('pulse'); void this.el.gemBox.offsetWidth; this.el.gemBox.classList.add('pulse'); }
        this.el.gems.textContent = gtxt;
      }
      const topKey = mtxt.length + '/' + gtxt.length + '/' + window.innerWidth + 'x' + window.innerHeight;
      if (topKey !== this.topKey) { this.topKey = topKey; this.fitTop(); }
      // level + XP bar
      const lo = g.xpForLevel(g.level), hi = g.xpForLevel(g.level + 1);
      const frac = U.clamp((g.xp - lo) / Math.max(1, hi - lo), 0, 1);
      if (g.level !== this.levelShown) {
        this.levelShown = g.level;
        this.el.level.textContent = g.level;
        this.el.level.parentNode.classList.remove('pulse'); void this.el.level.offsetWidth; this.el.level.parentNode.classList.add('pulse');
        this.el.xp.style.width = '100%';
        this.xpAnim = 0.35;
      } else if (this.xpAnim > 0) { this.xpAnim -= dt; if (this.xpAnim <= 0) { this.el.xp.style.transition = 'none'; this.el.xp.style.width = '0%'; void this.el.xp.offsetWidth; this.el.xp.style.transition = ''; } }
      else this.el.xp.style.width = (frac * 100).toFixed(1) + '%';
      // active boosts
      let bh = '';
      if (g.boosts.speed > 0) bh += '<span class="chip speed">' + U.fmtTime(g.boosts.speed) + '</span>';
      let tw = 0;
      for (const w of g.workers) if (w.temp > 0) tw = Math.max(tw, w.temp);
      if (tw > 0) bh += '<span class="chip worker">' + U.fmtTime(tw) + '</span>';
      if (g.effects.magnet > 0) bh += '<span class="chip magnet">' + U.fmtTime(g.effects.magnet) + '</span>';
      if (g.effects.hover > 0) bh += '<span class="chip hover">' + U.fmtTime(g.effects.hover) + '</span>';
      if (bh !== this.lastBoostHtml) { this.el.boosts.innerHTML = bh; this.lastBoostHtml = bh; }
      if (this.toastT > 0) { this.toastT -= dt; if (this.toastT <= 0) this.el.toast.classList.remove('show'); }
      if (this.bannerT > 0) { this.bannerT -= dt; if (this.bannerT <= 0) this.el.banner.classList.remove('show'); }
      this.updateTerminal();
      this.updateChoice();
      this.updateOffer();
      this.updateDesk();
      this.confetti.update(dt);
    }
  }

  TBS.Hud = Hud;
})(window.TBS = window.TBS || {});

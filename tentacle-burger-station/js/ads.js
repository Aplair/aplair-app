/* Pause panels + ads (STUDIO-RULES section 10 for this game):
   - first 5 min / guide: level-ups don't pause; banner + reward automatically
   - later: paused level-up panel "Claim" / "Watch ad: Claim x3" (ad option once per 3 min);
     plain "Claim" = a player-pressed break -> midgame ad request (level >= 3); closing the new-wing panel too
   - Boost Terminal: pauses; each boost bought with money or with an ad (3-minute cooldown per ad option) */
(function (TBS) {
  'use strict';

  const U = TBS.U, CG = TBS.CG;
  const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  class Ads {
    constructor(game, hud, input, view, saveFn) {
      this.game = game; this.hud = hud; this.input = input; this.view = view; this.saveFn = saveFn;
      this.wantPanel = false; this.wing2T = 0; this.busy = false; this.wantChoice = false;
      const cfg = game.cfg;
      // adStarted -> pause + mute. Ad over -> unmute; if no panel is open and no ad flow is running
      // (e.g. an ad that started late, after our 15 s safety timeout), the game resumes by itself.
      const adStart = () => { this.game.paused = true; TBS.Audio.setMute('ad', true); CG.gameplayStop(); };
      const adEnd = () => { TBS.Audio.setMute('ad', false); if (!this.hud.panel && !this.busy) this.resume(); };
      this.rewardHooks = {
        onBlock: () => { this.input.blocked = true; },
        onStart: adStart,
        onEnd: adEnd,
        onUnblock: () => { this.input.blocked = false; }
      };
      this.midHooks = {
        onBlock: () => { this.input.blocked = true; this.hud.setBlocker(true); },
        onStart: adStart,
        onEnd: adEnd,
        onUnblock: () => { this.input.blocked = false; this.hud.setBlocker(false); }
      };
      window.addEventListener('keydown', (e) => {
        const p = this.hud.panel;
        if (!p || this.busy) return;
        if ((p.kind === 'level' || p.kind === 'wing') && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') && !e.repeat) { e.preventDefault(); if (p.claim && !p.claim.disabled) p.claim.click(); }
        else if ((p.kind === 'term' || p.kind === 'desk' || p.kind === 'offer') && MOVE_KEYS.indexOf(e.code) >= 0 && !e.repeat && !this.hud.busyBtn) this.closeTerminal();
        else if (p.kind === 'choice' && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') && !e.repeat && !this.hud.busyBtn) { e.preventDefault(); if (p.normal) p.normal.click(); }
      });
      this.mult = cfg.LEVELUP_AD_MULTIPLIER;
    }

    onEvent(e) {
      const g = this.game, d = e.data;
      if (e.type === 'levelup') {
        TBS.Audio.play('levelUp');
        CG.setContext({ level: d.level });
        if (d.auto) { this.hud.banner('Level ' + d.level + '!', this.hud.rewardHtml({ reward: d.reward, gems: d.gems }), true); this.hud.celebrate(); }
        else this.wantPanel = true;
      } else if (e.type === 'wing2Ready') { if (d.auto) this.wing2T = d.resumed ? 0.5 : 1.8; else this.wantWing = true; }
      else if (e.type === 'terminalOpen') {
        if (this.hud.panel || this.busy) { g.player.latched = null; g.player.dwell = 0; return; } // could not open now: try again, never stay stuck
        if (d.desk === 'chef' || d.desk === 'hire') this.openDesk(d.desk, d.wing); else this.openTerminal(d.wing);
      }
      else if (e.type === 'upgradeChoice') this.wantChoice = true;
      else if (e.type === 'offerOpen') {
        if (this.hud.panel || this.busy || !g.floorOffer) { g.player.latched = null; g.player.dwell = 0; return; }
        this.openOffer();
      }
      else if (e.type === 'revealStart') { TBS.Audio.play('reveal'); CG.happytime(); this.hud.banner('NEW WING!', '', true); }
    }

    update(dt) {
      const g = this.game;
      if (this.wantPanel && !this.busy) {
        if (this.hud.panel && this.hud.panel.kind === 'level' && g.pendingLevel) { this.hud.updateLevelPanel({ level: g.pendingLevel.level, reward: g.pendingLevel.reward, gems: g.pendingLevel.gems, mult: this.mult }); this.wantPanel = false; }
        else if (!this.hud.panel && g.pendingLevel) { this.wantPanel = false; this.openLevelPanel(); }
        else if (!g.pendingLevel) this.wantPanel = false;
      }
      // just paid an upgrade: "normal or HOT" panel (as soon as nothing else is open)
      if (this.wantChoice && !this.busy) {
        if (!g.pendingChoice) this.wantChoice = false;
        else if (!this.hud.panel) { this.wantChoice = false; this.openChoice(); }
      }
      if (this.wing2T > 0) { this.wing2T -= dt; if (this.wing2T <= 0) g.openWing2(); }
      // Wing 1 complete: a level-up panel (if any) comes first and carries the "new wing" line itself
      if (this.wantWing) {
        if (!g.wing2Pending || g.wing2Open || g.revealing()) this.wantWing = false;
        else if (!this.hud.panel && !this.busy && !g.pendingLevel && !this.wantPanel) { this.wantWing = false; this.openWingPanel(); }
      }
    }

    // ---------- new wing panel (closing it = a natural break -> midgame request) ----------
    openWingPanel() {
      this.pause();
      TBS.Audio.play('levelUp');
      this.hud.showWingPanel({
        onOpen: () => {
          if (this.busy) return;
          this.hud.closePanel();
          this.afterBreak(true);
          this.saveFn();
        }
      });
    }

    // ---------- Chef Desk / Hire Desks (paused, money only, no ads) ----------
    openDesk(desk, wing) {
      if (this.hud.panel || this.busy) return;
      TBS.Audio.play('click');
      this.pause();
      const g = this.game;
      this.hud.showDesk({
        desk: desk, wing: wing,
        onBuy: (act) => {
          let ok;
          if (desk === 'chef') ok = g.buyChef(act);
          else if (act === 'hire') ok = g.hire(wing);
          else ok = act.next ? g.upgradeWorkerNext(act.w) : g.upgradeWorker(act.w, act.kind); // (one button: speed / capacity in turns)
          if (ok) { TBS.Audio.play(act === 'hire' ? 'hire' : 'unlock'); this.saveFn(); }
        },
        onAd: (act, btn) => { // worker upgrade with one rewarded ad (3-minute timer)
          if (this.busy || CG.adBusy) return;
          this.busy = true;
          this.hud.setBusy(btn);
          CG.showRewarded(this.rewardHooks).then((res) => {
            this.busy = false;
            if (res.rewarded) {
              this.hud.busyBtn = null;
              if (act.next ? g.upgradeWorkerNextByAd(act.w) : g.upgradeWorkerByAd(act.w, act.kind)) { TBS.Audio.play('unlock'); this.saveFn(); }
              this.hud.renderDesk();
            } else this.adFailed(res, btn);
          });
        },
        onClose: () => this.closeTerminal()
      });
    }

    pause() { this.game.paused = true; CG.gameplayStop(); this.input.cancelDrag(); }
    resume() { this.game.paused = false; CG.gameplayStart(); }

    // ---------- level-up panel ----------
    openLevelPanel() {
      const g = this.game, pl = g.pendingLevel;
      this.pause();
      this.hud.showLevelPanel({
        level: pl.level, reward: pl.reward, gems: pl.gems, mult: this.mult,
        showAd: g.adReady('levelup'),
        wing: g.wing2Pending && !g.wing2Open,
        onClaim: () => this.claim(),
        onAd: (btn) => this.claimAd(btn)
      });
    }

    claim() {
      if (this.busy) return;
      this.game.claimLevel(1);
      TBS.Audio.play('reward');
      this.hud.closePanel();
      this.afterBreak(true);
      this.saveFn();
    }

    claimAd(btn) {
      if (this.busy || CG.adBusy) return;
      const g = this.game;
      this.busy = true;
      this.hud.setBusy(btn);
      CG.showRewarded(this.rewardHooks).then((res) => {
        this.busy = false;
        if (res.rewarded) {
          g.startAdCooldown('levelup');
          g.claimLevel(this.mult);
          TBS.Audio.play('reward');
          this.hud.closePanel();
          this.afterBreak(false); // one ad per break: no midgame after a rewarded ad
          this.saveFn();
        } else this.adFailed(res, btn);
      });
    }

    afterBreak(midgameOk) {
      const g = this.game, openWing = g.wing2Pending && !g.wing2Open;
      const done = () => { this.resume(); if (openWing) g.openWing2(); };
      if (midgameOk && g.midgameAllowed() && CG.available) {
        this.busy = true;
        CG.requestMidgame(this.midHooks).then(() => { this.busy = false; done(); });
      } else done();
    }

    adFailed(res, btn) {
      if (!btn) return;
      btn.classList.remove('busy');
      this.hud.busyBtn = null;
      if (res.reason === 'busy') { btn.disabled = false; return; }
      if (res.reason === 'adblock') {
        btn.disabled = true;
        const note = this.hud.panel && this.hud.panel.el.querySelector('.p-note');
        if (note) note.textContent = 'Turn off your ad blocker to get this reward';
        return;
      }
      btn.disabled = false;
      this.hud.toast('No ad available right now. Try again later.', 2000);
    }

    // ---------- Boost Terminal ----------
    openTerminal(wing) {
      if (this.hud.panel || this.busy) return;
      TBS.Audio.play('click');
      this.pause();
      this.hud.showTerminal({
        wing: wing,
        onBuy: (type) => {
          if (this.game.buyBoost(type, wing)) { TBS.Audio.play('reward'); this.saveFn(); }
        },
        onAd: (type, btn) => {
          if (this.busy || CG.adBusy) return;
          this.busy = true;
          this.hud.setBusy(btn);
          CG.showRewarded(this.rewardHooks).then((res) => {
            this.busy = false;
            if (res.rewarded) {
              this.game.startAdCooldown(type);
              this.game.grantBoost(type, wing);
              TBS.Audio.play('reward');
              this.hud.busyBtn = null;
              this.saveFn();
            } else this.adFailed(res, btn);
          });
        },
        onClose: () => this.closeTerminal()
      });
    }

    // ---------- just paid an upgrade (paused): keep it, or take the HOT version for gems / one rewarded ad ----------
    openChoice() {
      const g = this.game, pc = g.pendingChoice;
      if (!pc) return;
      this.pause();
      const tr = g.trackDefs[pc.trackId], c = TBS.Economy.cards(g, pc.trackId, pc.step);
      const done = (hot) => { TBS.Audio.play(hot ? 'reward' : 'unlock'); this.hud.closePanel(); this.resume(); this.saveFn(); };
      this.hud.showChoice({
        name: tr.label, toLevel: pc.step + 2, maxLevel: tr.steps.length + 1, cards: c,
        onNormal: () => { if (this.busy) return; g.keepNormal(); done(false); },
        onGems: () => { if (!this.busy && g.chooseHot('gems')) done(true); },
        onAd: (btn) => {
          if (this.busy || CG.adBusy) return;
          this.busy = true;
          this.hud.setBusy(btn);
          CG.showRewarded(this.rewardHooks).then((res) => {
            this.busy = false;
            if (res.rewarded) { this.hud.busyBtn = null; g.chooseHot('ad'); done(true); }
            else this.adFailed(res, btn);
          });
        }
      });
    }

    // ---------- floor offer (paused): gems / one rewarded ad / close ----------
    openOffer() {
      const g = this.game, f = g.floorOffer;
      if (!f) return;
      TBS.Audio.play('click');
      this.pause();
      const done = () => { TBS.Audio.play('reward'); this.hud.closePanel(); this.resume(); this.saveFn(); };
      this.hud.showOffer({
        offer: f, price: TBS.FloorOffers.price(g, f.type),
        onGems: () => { if (!this.busy && TBS.FloorOffers.take(g, 'gems')) done(); },
        onAd: (btn) => {
          if (this.busy || CG.adBusy) return;
          this.busy = true;
          this.hud.setBusy(btn);
          CG.showRewarded(this.rewardHooks).then((res) => {
            this.busy = false;
            if (res.rewarded) { this.hud.busyBtn = null; TBS.FloorOffers.take(g, 'ad'); done(); }
            else this.adFailed(res, btn);
          });
        },
        onClose: () => this.closeTerminal()
      });
    }

    closeTerminal() {
      if (this.busy) return;
      this.hud.closePanel();
      this.resume();
    }
  }

  TBS.Ads = Ads;
})(window.TBS = window.TBS || {});

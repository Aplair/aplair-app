/* The ONLY file that talks to the CrazyGames SDK (STUDIO-RULES section 1).
   The game never depends on the SDK: on file:// (double-click), offline, blocked script or "disabled"
   environment, every method below becomes a safe fallback and the game plays normally.
   Rewarded ads follow STUDIO-RULES 3.3 exactly; midgame ads follow section 4. */
(function (TBS) {
  'use strict';

  const CG = TBS.CG = {
    available: false,        // SDK initialised AND environment is "local" or "crazygames"
    environment: 'none',
    adblock: false,          // set once at startup (and if an ad says "adblock")
    sdkMuted: false,         // CrazyGames "muteAudio" setting (overrides the in-game sound toggle)
    adBusy: false,           // one ad request at a time
    adsOffThisSession: false,// we saw "adsDisabledBasicLaunch"
    inGameplay: false,
    sdk: null,
    lastPct: -1
  };
  const muteCbs = [];
  const mem = new Map();
  const cfg = () => TBS.CONFIG;

  function safe(fn, arg) { try { if (fn) fn(arg); } catch (e) { if (window.console) console.warn('[cg] hook error', e); } }
  function withTimeout(p, ms) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout')), ms);
      Promise.resolve(p).then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
    });
  }
  function call(fn) {
    if (!CG.available) return;
    try { const r = fn(CG.sdk); if (r && typeof r.catch === 'function') r.catch(() => {}); } catch (e) { /* never break the game */ }
  }

  // ---------- startup ----------
  CG.init = async function () {
    try {
      const sdk = window.CrazyGames && window.CrazyGames.SDK;
      if (!sdk || typeof sdk.init !== 'function') return false;
      const wait = location.protocol === 'file:' ? cfg().SDK_INIT_TIMEOUT_FILE : cfg().SDK_INIT_TIMEOUT;
      await withTimeout(sdk.init(), wait * 1000);
      CG.environment = String(sdk.environment || 'none');
      CG.available = CG.environment === 'local' || CG.environment === 'crazygames';
      if (!CG.available) return false;
      CG.sdk = sdk;
      try { CG.sdkMuted = !!(sdk.game.settings && sdk.game.settings.muteAudio); } catch (e) { CG.sdkMuted = false; }
      try {
        sdk.game.addSettingsChangeListener((s) => {
          CG.sdkMuted = !!(s && s.muteAudio);
          muteCbs.forEach((cb) => safe(cb, CG.sdkMuted));
        });
      } catch (e) { /* ignore */ }
      try { CG.adblock = !!(await withTimeout(sdk.ad.hasAdblock(), 3000)); } catch (e) { CG.adblock = false; }
      return true;
    } catch (e) {
      CG.available = false;
      return false;
    }
  };

  CG.onMuteChange = (cb) => { muteCbs.push(cb); };

  // ---------- game module ----------
  CG.loadingStart = () => call((s) => s.game.loadingStart());
  CG.loadingStop = () => call((s) => s.game.loadingStop());
  CG.gameplayStart = function () { if (CG.inGameplay) return; CG.inGameplay = true; call((s) => s.game.gameplayStart()); };
  CG.gameplayStop = function () { if (!CG.inGameplay) return; CG.inGameplay = false; call((s) => s.game.gameplayStop()); };
  CG.happytime = () => call((s) => s.game.happytime());
  CG.reportProgress = function (pct) {
    pct = Math.max(0, Math.min(100, Math.round(pct)));
    if (pct <= CG.lastPct) return;
    CG.lastPct = pct;
    call((s) => s.game.reportGameCompletedPercentage(pct));
  };
  CG.setContext = (obj) => call((s) => s.game.setGameContext(obj));
  CG.clearContext = () => call((s) => s.game.clearGameContext());

  // ---------- progress save (Data module when available, else localStorage; never both) ----------
  CG.storage = {
    getItem(k) {
      if (CG.available) { try { const v = CG.sdk.data.getItem(k); return v === undefined ? null : v; } catch (e) { return mem.has(k) ? mem.get(k) : null; } }
      try { return window.localStorage.getItem(k); } catch (e) { return mem.has(k) ? mem.get(k) : null; }
    },
    setItem(k, v) {
      mem.set(k, v);
      if (CG.available) { try { CG.sdk.data.setItem(k, v); } catch (e) { /* kept in memory for this session */ } return; }
      try { window.localStorage.setItem(k, v); } catch (e) { /* kept in memory */ }
    },
    removeItem(k) {
      mem.delete(k);
      if (CG.available) { try { CG.sdk.data.removeItem(k); } catch (e) { /* ignore */ } return; }
      try { window.localStorage.removeItem(k); } catch (e) { /* ignore */ }
    }
  };

  // ---------- rewarded ads (STUDIO-RULES 3.3) ----------
  // hooks: onBlock (block input + loading state), onStart (pause + mute), onEnd (unmute + resume), onUnblock.
  // Resolves {rewarded, reason}. The caller gives the reward ONLY when rewarded is true.
  CG.showRewarded = function (hooks) {
    hooks = hooks || {};
    return new Promise((resolve) => {
      if (CG.adBusy) { resolve({ rewarded: false, reason: 'busy' }); return; }
      if (!CG.available) { resolve({ rewarded: true, reason: 'unavailable' }); return; } // like Basic Launch: reward without an ad
      if (CG.adblock) { resolve({ rewarded: false, reason: 'adblock' }); return; }
      CG.adBusy = true;
      let started = false, settled = false, late = false;
      safe(hooks.onBlock);
      const finish = (rewarded, reason) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (started) safe(hooks.onEnd);
        safe(hooks.onUnblock);
        CG.adBusy = false;
        resolve({ rewarded: rewarded, reason: reason });
      };
      const timer = setTimeout(() => { if (!started) finish(false, 'timeout'); }, cfg().AD_SAFETY_TIMEOUT * 1000);
      const endLate = () => { if (late) { late = false; safe(hooks.onEnd); } };
      const cb = {
        adStarted: () => {
          if (settled) { if (!late) { late = true; safe(hooks.onStart); } return; } // late start: pause+mute, never a 2nd reward
          started = true;
          clearTimeout(timer);
          safe(hooks.onStart);
        },
        adFinished: () => { if (settled) { endLate(); return; } finish(true, 'finished'); },
        adError: (err) => {
          if (settled) { endLate(); return; }
          const code = err && err.code ? String(err.code) : 'other';
          if (code === 'adsDisabledBasicLaunch') { CG.adsOffThisSession = true; finish(true, 'basicLaunch'); }
          else if (code === 'adblock') { CG.adblock = true; finish(false, 'adblock'); }
          else finish(false, code);
        }
      };
      try { CG.sdk.ad.requestAd('rewarded', cb); } catch (e) { finish(false, 'other'); }
    });
  };

  // ---------- midgame ads (STUDIO-RULES section 4) ----------
  // Only at player-pressed breaks. Any refusal: the game simply continues, no message.
  CG.requestMidgame = function (hooks) {
    hooks = hooks || {};
    return new Promise((resolve) => {
      if (!CG.available || CG.adBusy) { resolve('skipped'); return; }
      CG.adBusy = true;
      let started = false, settled = false, late = false;
      safe(hooks.onBlock);
      const finish = (r) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (started) safe(hooks.onEnd);
        safe(hooks.onUnblock);
        CG.adBusy = false;
        resolve(r);
      };
      const timer = setTimeout(() => { if (!started) finish('timeout'); }, cfg().AD_SAFETY_TIMEOUT * 1000);
      const endLate = () => { if (late) { late = false; safe(hooks.onEnd); } };
      try {
        CG.sdk.ad.requestAd('midgame', {
          adStarted: () => { if (settled) { if (!late) { late = true; safe(hooks.onStart); } return; } started = true; clearTimeout(timer); safe(hooks.onStart); },
          adFinished: () => { if (settled) { endLate(); return; } finish('finished'); },
          adError: (e) => { if (settled) { endLate(); return; } if (e && e.code === 'adsDisabledBasicLaunch') CG.adsOffThisSession = true; finish('error'); }
        });
      } catch (e) { finish('error'); }
    });
  };

  // ---------- DEV ONLY: fake SDK to test every ad path by double-click (index.html?fakeAd=unfilled etc.) ----------
  CG.installFake = function (mode) {
    const later = (ms, fn) => setTimeout(fn, ms);
    const store = {
      getItem: (k) => { try { return window.localStorage.getItem('fake_' + k); } catch (e) { return null; } },
      setItem: (k, v) => { try { window.localStorage.setItem('fake_' + k, v); } catch (e) { /* */ } },
      removeItem: (k) => { try { window.localStorage.removeItem('fake_' + k); } catch (e) { /* */ } }
    };
    const log = (m) => { if (window.console) console.log('[fake SDK] ' + m); };
    const play = (type, cb) => {
      log('requestAd ' + type + ' -> ' + mode);
      if (mode === 'timeout') return;
      if (mode === 'late') { later(16000, () => cb.adStarted && cb.adStarted()); later(18000, () => cb.adFinished && cb.adFinished()); return; }
      if (mode === 'finish' || mode === 'muted' || (type === 'midgame' && mode === 'adblockDetected')) {
        later(400, () => { cb.adStarted && cb.adStarted(); later(1600, () => cb.adFinished && cb.adFinished()); });
        return;
      }
      const code = mode === 'adblockDetected' ? 'adblock' : mode;
      later(400, () => cb.adError && cb.adError({ code: code, message: 'fake ' + code }));
    };
    window.CrazyGames = {
      SDK: {
        environment: 'local',
        init: () => Promise.resolve(),
        ad: { requestAd: play, hasAdblock: () => Promise.resolve(mode === 'adblockDetected') },
        game: {
          settings: { muteAudio: mode === 'muted', disableChat: false },
          addSettingsChangeListener: () => {}, removeSettingsChangeListener: () => {},
          gameplayStart: () => log('gameplayStart'), gameplayStop: () => log('gameplayStop'),
          loadingStart: () => log('loadingStart'), loadingStop: () => log('loadingStop'),
          happytime: () => log('happytime'), reportGameCompletedPercentage: (p) => log('completed ' + p + '%'),
          setGameContext: (c) => log('context ' + JSON.stringify(c)), clearGameContext: () => log('context cleared')
        },
        data: store
      }
    };
  };

  // ---------- self test (sim/selftest.js runs this in node) ----------
  CG.selfTest = async function (check) {
    const saved = { available: CG.available, sdk: CG.sdk, adblock: CG.adblock, timeout: cfg().AD_SAFETY_TIMEOUT };
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const fakeSdk = (behave) => ({ ad: { requestAd: (type, cb) => behave(cb) } });
    async function run(name, behave, expectReward, opts) {
      opts = opts || {};
      CG.available = opts.unavailable ? false : true; CG.adblock = !!opts.adblock; CG.sdk = fakeSdk(behave);
      const log = [];
      const hooks = { onBlock: () => log.push('block'), onStart: () => log.push('pause+mute'), onEnd: () => log.push('unmute+resume'), onUnblock: () => log.push('unblock') };
      let rewards = 0;
      const res = await CG.showRewarded(hooks);
      if (res.rewarded) rewards++;
      if (opts.after) await wait(opts.after);
      const blockedOk = opts.unavailable || opts.adblock ? log.length === 0 : log[0] === 'block' && log.indexOf('unblock') > 0;
      const muteOk = log.filter((x) => x === 'pause+mute').length === log.filter((x) => x === 'unmute+resume').length;
      check('rewarded ad: ' + name, rewards === (expectReward ? 1 : 0) && blockedOk && muteOk && !CG.adBusy, 'reason=' + res.reason + ' hooks=' + log.join('>'));
    }
    const after = (ms, f) => setTimeout(f, ms);
    await run('finished -> reward', (cb) => after(5, () => { cb.adStarted(); after(5, () => cb.adFinished()); }), true);
    await run('adsDisabledBasicLaunch -> reward (Basic Launch)', (cb) => after(5, () => cb.adError({ code: 'adsDisabledBasicLaunch' })), true);
    await run('adblock -> no reward', (cb) => after(5, () => cb.adError({ code: 'adblock' })), false);
    CG.adblock = false;
    await run('unfilled -> no reward', (cb) => after(5, () => cb.adError({ code: 'unfilled' })), false);
    await run('adCooldown -> no reward', (cb) => after(5, () => cb.adError({ code: 'adCooldown' })), false);
    await run('other -> no reward', (cb) => after(5, () => cb.adError({ code: 'other' })), false);
    await run('SDK not available -> reward without an ad', () => {}, true, { unavailable: true });
    await run('ad blocker detected at startup -> no request, no reward', () => {}, false, { adblock: true });
    cfg().AD_SAFETY_TIMEOUT = 0.05;
    await run('no answer in time -> unblock, no reward', () => {}, false);
    await run('late adStarted after timeout -> pause until it ends, no 2nd reward', (cb) => after(80, () => { cb.adStarted(); after(10, () => cb.adFinished()); }), false, { after: 150 });
    cfg().AD_SAFETY_TIMEOUT = saved.timeout;
    // midgame: errors simply continue
    CG.available = true; CG.sdk = fakeSdk((cb) => after(5, () => cb.adError({ code: 'adCooldown' })));
    const r1 = await CG.requestMidgame({});
    CG.sdk = fakeSdk((cb) => after(5, () => { cb.adStarted(); after(5, () => cb.adFinished()); }));
    const log = [];
    const r2 = await CG.requestMidgame({ onStart: () => log.push('s'), onEnd: () => log.push('e') });
    check('midgame ad: refusal continues silently, finished ad pauses and resumes', r1 === 'error' && r2 === 'finished' && log.join('') === 'se' && !CG.adBusy);
    CG.available = saved.available; CG.sdk = saved.sdk; CG.adblock = saved.adblock;
  };
})(window.TBS = window.TBS || {});

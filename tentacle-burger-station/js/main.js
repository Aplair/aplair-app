/* Boot: loading screen -> CrazyGames SDK (or none) -> load save -> build the station -> play. Then the main loop. */
(function (TBS) {
  'use strict';

  const CG = TBS.CG, $ = (id) => document.getElementById(id);
  const Main = TBS.Main = { saving: true };
  Main.stopSaving = () => { Main.saving = false; };

  function setLoad(k) { const f = $('load-fill'); if (f) f.style.width = Math.round(k * 100) + '%'; }

  async function boot() {
    const cfg = TBS.CONFIG;
    setLoad(0.15);
    if (cfg.DEV_TOOLS) { // test every ad answer by double-click: index.html?fakeAd=unfilled (dev only)
      const m = /[?&]fakeAd=([A-Za-z]+)/.exec(location.search);
      if (m) CG.installFake(m[1]);
    }
    await CG.init();
    setLoad(0.45);
    CG.loadingStart();

    const game = new TBS.Game(cfg, { save: TBS.Save.load() });
    const canvas = $('game');
    const view = new TBS.View(game, canvas, $('overlay'));
    setLoad(0.8);
    const hud = new TBS.Hud(game);
    const input = new TBS.Input(canvas, $('joy'), $('joy-knob'));
    const save = () => { if (Main.saving) TBS.Save.save(game); };
    const ads = new TBS.Ads(game, hud, input, view, save);
    const dev = cfg.DEV_TOOLS ? new TBS.Dev(game, hud, input, ads) : null;
    Main.game = game; Main.view = view; Main.hud = hud; Main.ads = ads; Main.dev = dev;

    // sound: in-game button + CrazyGames muteAudio (which always wins)
    const prefs = TBS.Save.loadPrefs();
    TBS.Audio.setMute('toggle', !!prefs.soundOff);
    TBS.Audio.setMute('sdk', CG.sdkMuted);
    const showSound = () => hud.setSound(TBS.Audio.toggleMuted() || CG.sdkMuted, CG.sdkMuted);
    hud.onSound = () => { const off = !TBS.Audio.toggleMuted(); TBS.Audio.setMute('toggle', off); TBS.Save.savePrefs({ soundOff: off }); TBS.Audio.unlock(); showSound(); };
    CG.onMuteChange((m) => { TBS.Audio.setMute('sdk', m); showSound(); });
    showSound();
    if (game.player.moved || !game.isNewSave) hud.hideHint();
    const prevFirst = input.onFirstMove;
    input.onFirstMove = (src) => { hud.hideHint(); if (prevFirst) prevFirst(src); };

    // pause + mute when the tab is hidden
    let last = performance.now();
    document.addEventListener('visibilitychange', () => {
      TBS.Audio.setMute('hidden', document.hidden);
      if (document.hidden) save(); else last = performance.now();
    });
    window.addEventListener('pagehide', save);
    window.addEventListener('resize', () => view.resize());

    setLoad(1);
    const ld = $('loading');
    ld.classList.add('done');
    setTimeout(() => { ld.style.display = 'none'; }, 450);
    CG.loadingStop();
    CG.gameplayStart();
    CG.setContext({ level: game.level });
    CG.reportProgress(game.completionPercent());

    let autosave = 0, saveSoon = false;
    function handle(e) {
      const d = e.data, p = game.player;
      view.onEvent(e);
      ads.onEvent(e);
      if (dev) dev.onEvent(e);
      switch (e.type) {
        case 'pickup': if (d.who === 'player') TBS.Audio.play('pop', { streak: d.streak }); break;
        case 'cooked': {
          const m = [].concat(game.chains.p.machines, game.chains.g.machines).find((x) => x.id === d.key);
          const dist = m ? Math.hypot(p.x - m.out.x, p.z - m.out.z) : 99;
          TBS.Audio.play('cook', { vol: Math.max(0, 1 - dist / 11) });
          break;
        }
        case 'happy': if (Math.hypot(p.x - d.c.x, p.z - d.c.z) < 13) TBS.Audio.play(d.c.chain === 'g' ? 'happyG' : 'happyP'); break;
        case 'payTick': TBS.Audio.play('tick', { fill: d.fill }); break;
        case 'clean': if (Math.hypot(p.x - d.x, p.z - d.z) < 9) TBS.Audio.play('clean'); break;
        case 'take': if (Math.hypot(p.x - d.c.x, p.z - d.c.z) < 9) TBS.Audio.play('sell'); break;
        case 'trayHint': hud.toast(d.why === 'trash' ? 'Throw the trash in the bin first' : d.why === 'food' ? 'Put the food down first' : 'Your tray is full', 1600); break;
        case 'purchase':
          TBS.Audio.play('unlock');
          CG.reportProgress(game.completionPercent());
          saveSoon = true;
          break;
        case 'deskBuy': CG.reportProgress(game.completionPercent()); saveSoon = true; break;
        case 'boost': saveSoon = true; break;
        case 'levelup': case 'wing2Open': saveSoon = true; break;
      }
    }

    function frame(now) {
      requestAnimationFrame(frame);
      let dt = (now - last) / 1000;
      last = now;
      if (document.hidden) return;
      if (!(dt > 0)) dt = 0;
      tick(Math.min(dt, 0.1));
    }

    // one frame of the game (also used by the automatic test scripts)
    function tick(dt) {
      try {
        const speed = dev ? dev.speed : 1;
        const steps = Math.max(1, Math.ceil(dt / 0.05)), h = dt / steps;
        const inp = input.read(dt);
        if (!game.paused) for (let s = 0; s < steps * speed; s++) game.update(h, inp);
        game.tickPlayTime(dt * speed);
        const evs = game.drainEvents();
        for (let i = 0; i < evs.length; i++) handle(evs[i]);
        ads.update(dt);
        hud.update(dt);
        view.update(game.paused ? 0 : dt * Math.min(speed, 2));
        view.render();
        if (dev) dev.update(dt);
        autosave += dt;
        if (saveSoon || autosave >= cfg.AUTOSAVE_SECONDS) { autosave = 0; saveSoon = false; save(); }
      } catch (err) {
        if (window.console) console.error(err);
        if (dev) dev.error(err);
      }
    }
    Main.tick = tick;
    requestAnimationFrame(frame);
  }

  window.addEventListener('error', (e) => { if (TBS.CONFIG.DEV_TOOLS && TBS.Main.dev) TBS.Main.dev.error(e.error || e.message); });
  boot().catch((err) => {
    if (window.console) console.error(err);
    const ld = document.getElementById('loading');
    if (ld) ld.querySelector('.title').textContent = 'Something went wrong: ' + (err && err.message);
  });
})(window.TBS = window.TBS || {});

/* All sounds are made in code (WebAudio), no sound files. Soft, short, slightly different every time.
   Mute reasons: the sound button, CrazyGames "muteAudio" (wins over the button), ads, hidden tab. */
(function (TBS) {
  'use strict';

  const A = TBS.Audio = {};
  let ctx = null, master = null, noise = null;
  const reasons = { toggle: false, sdk: false, ad: false, hidden: false };
  const last = {};

  function cfg() { return TBS.CONFIG; }
  function muted() { return reasons.toggle || reasons.sdk || reasons.ad || reasons.hidden; }

  A.unlock = function () {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
        master = ctx.createGain();
        master.gain.value = muted() ? 0 : cfg().MASTER_VOLUME;
        master.connect(comp); comp.connect(ctx.destination);
        noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.6), ctx.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') ctx.resume();
    } catch (e) { /* no sound is fine */ }
  };

  function apply() {
    if (!master) return;
    const v = muted() ? 0 : cfg().MASTER_VOLUME;
    try { master.gain.setTargetAtTime(v, ctx.currentTime, 0.03); } catch (e) { master.gain.value = v; }
  }
  A.setMute = function (reason, on) { reasons[reason] = !!on; apply(); };
  A.isMuted = muted;
  A.muteReasons = () => Object.assign({}, reasons);
  A.toggleMuted = () => reasons.toggle;

  function ready() { return ctx && master && ctx.state === 'running' && !muted(); }
  function rnd() { const p = cfg().PITCH_RANDOM; return 1 + (Math.random() * 2 - 1) * p; }

  function tone(f0, f1, dur, type, vol, delay) {
    const t = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }

  function hiss(dur, type, f0, f1, vol, delay) {
    const t = ctx.currentTime + (delay || 0);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise;
    f.type = type; f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + dur + 0.03);
  }

  function limit(name, ms) {
    const now = performance.now();
    if (last[name] && now - last[name] < ms) return false;
    last[name] = now;
    return true;
  }

  const SOUNDS = {
    pop(o) { // item hops onto the stack; pitch rises on a streak
      const s = Math.min(o.streak || 0, 18), f = 520 * (1 + s * 0.035) * rnd();
      tone(f, f * 1.5, 0.09, 'sine', 0.2);
      tone(f * 2, f * 2.4, 0.05, 'triangle', 0.04);
    },
    drop() { if (!limit('drop', 70)) return; const f = 230 * rnd(); tone(f, f * 0.65, 0.11, 'triangle', 0.22); hiss(0.06, 'lowpass', 700, 300, 0.05); },
    cook(o) { if (!limit('cook', 160)) return; const v = o.vol === undefined ? 1 : o.vol; if (v <= 0.02) return; const f = 300 * rnd(); tone(f, f * 2, 0.09, 'sine', 0.11 * v); hiss(0.2, 'highpass', 2500, 4000, 0.025 * v, 0.03); },
    coin(o) { if (!limit('coin', 38)) return; const s = Math.min(o.streak || 0, 14), f = 1500 * (1 + s * 0.03) * rnd(); tone(f, f, 0.07, 'sine', 0.08); tone(f * 1.5, f * 1.5, 0.09, 'sine', 0.05, 0.02); },
    tick(o) { if (!limit('tick', 60)) return; const f = 380 + (o.fill || 0) * 820; tone(f, f * 1.05, 0.045, 'triangle', 0.08); },
    unlock() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, f, 0.2, 'triangle', 0.13, i * 0.07));
      hiss(0.35, 'highpass', 4000, 6000, 0.025, 0.2);
    },
    happyP() { if (!limit('happy', 90)) return; const f = 200 * rnd(); tone(f, f * 1.7, 0.18, 'sine', 0.12); tone(f * 1.7, f * 1.2, 0.1, 'sine', 0.05, 0.12); },
    happyG() { if (!limit('happy', 90)) return; const f = 520 * rnd(); tone(f, f * 1.7, 0.14, 'sine', 0.09); tone(f * 1.9, f * 2.2, 0.08, 'triangle', 0.03, 0.1); },
    levelUp() {
      const n = [[523.25, 0], [659.25, 0.1], [783.99, 0.2], [1046.5, 0.32], [783.99, 0.5], [1046.5, 0.6]];
      n.forEach((x) => { tone(x[0], x[0], 0.28, 'triangle', 0.13, x[1]); tone(x[0] * 2, x[0] * 2, 0.18, 'sine', 0.03, x[1]); });
      hiss(0.5, 'highpass', 3500, 6000, 0.02, 0.55);
    },
    knock() { tone(115, 80, 0.09, 'sine', 0.2); hiss(0.07, 'lowpass', 500, 200, 0.07); tone(115, 80, 0.09, 'sine', 0.2, 0.16); hiss(0.07, 'lowpass', 500, 200, 0.07, 0.16); },
    click() { if (!limit('click', 40)) return; tone(900 * rnd(), 700, 0.04, 'triangle', 0.08); },
    reward() { [659.25, 783.99, 987.77, 1318.5, 1567.98].forEach((f, i) => tone(f, f, 0.16, 'sine', 0.1, i * 0.055)); },
    reveal() { hiss(1.3, 'bandpass', 300, 3000, 0.08); [392, 523.25, 659.25, 783.99].forEach((f) => tone(f, f, 0.9, 'triangle', 0.06, 1.0)); },
    hire() { tone(440 * rnd(), 660, 0.12, 'triangle', 0.1); tone(660, 880, 0.12, 'triangle', 0.08, 0.1); },
    clean() { if (!limit('clean', 120)) return; hiss(0.18, 'highpass', 3000, 7000, 0.06); const f = 1200 * rnd(); tone(f, f * 1.6, 0.12, 'sine', 0.06, 0.05); tone(f * 1.6, f * 2, 0.1, 'sine', 0.04, 0.12); },
    sell() { if (!limit('sell', 70)) return; const f = 880 * rnd(); tone(f, f, 0.05, 'square', 0.035); tone(f * 1.25, f * 1.25, 0.07, 'triangle', 0.06, 0.05); }
  };

  A.play = function (name, opts) {
    if (!ready()) return;
    const fn = SOUNDS[name];
    if (!fn) return;
    try { fn(opts || {}); } catch (e) { /* ignore */ }
  };

  // iOS needs resume() inside a user gesture (CrazyGames technical requirements)
  ['touchend', 'click', 'keydown', 'pointerdown'].forEach((ev) => document.addEventListener(ev, A.unlock, { passive: true }));
})(window.TBS = window.TBS || {});

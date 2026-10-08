/* Progress save through the SDK wrapper (CrazyGames Data module when available, else localStorage). */
(function (TBS) {
  'use strict';

  const S = TBS.Save = {};
  const key = () => TBS.CONFIG.SAVE_KEY;

  S.load = function () {
    try {
      const raw = TBS.CG.storage.getItem(key());
      if (!raw) return null;
      const d = JSON.parse(raw);
      return d && typeof d === 'object' && d.v >= TBS.CONFIG.SAVE_MIN_VERSION && d.v <= TBS.CONFIG.SAVE_VERSION ? d : null;
    } catch (e) { return null; }
  };

  S.save = function (game) {
    try { TBS.CG.storage.setItem(key(), JSON.stringify(game.serialize())); return true; } catch (e) { return false; }
  };

  S.clear = function () { try { TBS.CG.storage.removeItem(key()); } catch (e) { /* ignore */ } };

  S.loadPrefs = function () {
    try { return JSON.parse(TBS.CG.storage.getItem('tbs_prefs') || '{}') || {}; } catch (e) { return {}; }
  };
  S.savePrefs = function (p) { try { TBS.CG.storage.setItem('tbs_prefs', JSON.stringify(p)); } catch (e) { /* ignore */ } };
})(window.TBS = window.TBS || {});

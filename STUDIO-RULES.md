# Studio Rules — fixed rules for EVERY game in this folder

These are the studio's own decisions. They apply to every game.

**These rules apply from the very first day a game is built — including the first prototype — in every stage.** The SDK wrapper, ads system, save and all other sections here are built in from the start so the game is built right once. If an older prompt, the production pipeline, or any other file says "no SDK / no ads / no save in this stage", these rules win for those items. The pipeline still decides everything else (content, art, features).
They sit on top of the official CrazyGames documentation in `CrazyGames-Docs-Reference.md` (Part B). If a rule here ever seems to break an official rule there, **stop and tell the owner** instead of choosing yourself.

The owner is not a programmer. He tests by double-clicking `index.html`. Explain everything to him in simple Egyptian Arabic, no terminal commands.

---

## 1. One SDK wrapper — the game must never depend on the SDK to run

- Load the SDK v3 script in `index.html` `<head>` before the game code: `<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>`. Never use the old v2 SDK.
- ALL SDK calls go through one small module (e.g. `cg.js`). Nothing else in the game touches `window.CrazyGames` directly.
- At startup (during the loading screen) the wrapper: checks `window.CrazyGames` exists → `await window.CrazyGames.SDK.init()` inside try/catch → reads `SDK.environment`.
- The SDK is "available" only if init succeeded AND the environment is `local` or `crazygames`. In any other case (file:// double-click, offline, script blocked, `disabled` environment) every wrapper method becomes a safe fallback and the game runs normally.
- Every wrapper method catches its own errors. An SDK problem must never freeze, crash or block the game.

## 2. Launch phases (how the code behaves in each)

| | Basic Launch (trial, 7–21 days) | Full Launch |
|---|---|---|
| Ads | Disabled by CrazyGames (`adsDisabledBasicLaunch`) | Enabled |
| Our code | Same code in both phases | Same code |

The game does not need to know which phase it is in ahead of time. The ad error codes tell it (see section 3). **No code change is needed when moving to Full Launch** for ads.

## 3. Rewarded ads — the studio system (use exactly this in every game)

### 3.1 One function
All rewarded ads go through one wrapper function, e.g. `cg.showRewarded(rewardFn)`. Every reward button in the game calls it. Nothing else requests rewarded ads.

### 3.2 Ad-blocker check at startup
- If the SDK is available, call `await SDK.ad.hasAdblock()` once at startup (try/catch; on error treat as "no adblock").
- If an ad blocker is detected: every reward button is shown **disabled** (greyed out, NOT clickable) with a small line of text under or on it: **"Turn off your ad blocker to get this reward"**.
- Never use a popup for this. Never leave the button clickable without effect.
- The rest of the game stays fully playable. Ad-block users are never punished in any other way.

### 3.3 What happens when a reward button is clicked
1. Ignore extra clicks while a request is in progress (one request at a time).
2. Block game input and show a small "loading" state on the button until `adStarted` or `adError` arrives. Do NOT mute yet.
3. Call `SDK.ad.requestAd("rewarded", { adStarted, adFinished, adError })`.
4. **`adStarted`** → pause the game, mute all game audio.
5. **`adFinished`** → unmute, resume, **give the reward**, and show clear feedback that the reward was received (short animation / "+50 coins").
6. **`adError(error)`** → unmute and resume if needed, then decide by `error.code`:

| `error.code` | Give reward? | What the player sees |
|---|---|---|
| `adsDisabledBasicLaunch` | **YES** (Basic Launch policy) | Same as a finished ad: reward + reward feedback |
| `adblock` | NO | Button switches to the disabled ad-blocker state from 3.2 |
| `unfilled`, `adCooldown`, `other`, or anything else | NO | Short non-blocking message (~2 seconds, not a popup): **"No ad available right now. Try again later."** Game continues normally. |

7. **SDK not available** (file:// double-click, offline, script failed, `disabled` environment): treat it exactly like `adsDisabledBasicLaunch` → give the reward. This lets the owner test reward buttons by double-click.
8. **Safety timeout (studio choice):** if neither `adStarted` nor `adError` arrives within 15 seconds, unblock the game and treat it as `unfilled` (message, no reward). If `adStarted` arrives late anyway, still pause+mute until `adFinished`/`adError`, but never give a second reward for the same click.
9. A reward is given **at most once per click**. Keep a flag per request.

Why: the official rule is "on `adError`, do NOT reward the player" and "when there is no ad available encourage the players to try again later". The only exception we make is `adsDisabledBasicLaunch`, because during Basic Launch ads can never play, and the official Basic Launch rule is "there should not be rewarded ad buttons without effect". In Full Launch that error never happens, so the game automatically follows the official rule.

### 3.4 Limits — identical in every phase (also when the reward is free in Basic Launch)
- "Watch to continue / revive": **at most once per session**, never offered every time the player dies. Show a 5-second countdown on the offer. After reviving, give 2–3 seconds of invincibility (blinking).
- Never offer a midgame ad AND a "watch to keep playing" at the same break. Between two levels it is either a midgame ad + restart, or a rewarded "keep playing" — not both.
- Rewards that give currency: daily cap (default 5 per day, stored in the save data). Optional diminishing rewards (e.g. 100 → 50 → 25).
- When a reward is not available (cap reached, already used this session): show a timer on the button or hide it.
- Every rewarded reward must also be obtainable another way (e.g. buy it with coins earned by playing).
- No level may require a rewarded ad to be completed.
- Never chain ads: one ad = one reward.

### 3.5 Reward button design
- Video icon on the button, and the exact reward written: e.g. "▶ Watch ad: +50 coins". Never just "Watch ad".
- Always in the same place on a given screen; easy to reach; not promoted aggressively.
- Never on an active gameplay screen (e.g. not during a race or while the player is moving). Only on breaks: game over, level end, shop, menus.
- If there is a "No thanks / Continue" option, it has the same size, font and color as the ad button, is visible immediately, and is never delayed or hidden.
- Button sizes are never used to push players toward the ad.

## 4. Midgame (between-levels) ads — same code in every phase
- Request a midgame ad only at natural breaks: level complete, game over, round end. Request it when the player presses "Next level" on the summary screen, after they had a moment to see their result.
- Never on navigation buttons (main menu, settings, shop).
- Do not request any midgame ad in the first 3–5 minutes of a player's first session or before level 3 (whichever is later).
- Do not build our own cooldown; the SDK limits it to one every 3 minutes and ignores early requests.
- Block input from request until `adStarted`/`adError`; mute+pause on `adStarted` only; unmute+resume on `adFinished` or `adError`. On any error the game simply continues, no message.
- Games without levels (e.g. clickers): request at a natural pause and show a 3-second "Ad starting in 3…" warning first.

## 5. Banners
Not used unless a prompt says so. If ever used, follow the Banners pages in the reference file exactly.

## 6. Progress save
- Use the SDK Data module (`SDK.data`, same API as localStorage) when the SDK is available. When it is not (file://), fall back to `window.localStorage` through the same wrapper.
- Never use both while the SDK is available. Always read existing data before writing. Keep data far below 1 MB.
- Remind the owner (in your final message) that at submission he must choose the Data Module "Progress Save" option.

## 7. Other SDK calls (through the wrapper)
- `gameplayStart()` the moment the player can actually play (first call measures load size/time); `gameplayStop()` on every break (menu, level end, pause); `gameplayStart()` again on resume / revive / next level. Not on tab focus loss.
- `loadingStart()` / `loadingStop()` around the loading screen.
- `muteAudio` setting: read at start + `addSettingsChangeListener`; it overrides the in-game sound toggle.
- `reportGameCompletedPercentage(0–100)` as the player progresses; `setGameContext({ level })` at level start, `clearGameContext()` when leaving.
- `happytime()` only for rare big moments (new high score, boss beaten), not every level.

## 8. Browser, mobile and layout (every game)
- `body { user-select: none; -webkit-user-select: none; }` to stop zoom/selection on double-tap or long-press.
- Prevent page scroll from mouse wheel, arrow keys and Space (use `" "` / `event.code === "Space"`), and disable the right-click menu.
- Pause + mute when the tab is hidden, resume when visible.
- iOS audio: resume the AudioContext inside a `touchend`/`click` handler.
- Important UI inside `env(safe-area-inset-*)` padding; gameplay stays fullscreen.
- No custom fullscreen button. Never use `Escape` or `Ctrl/Cmd+W` for gameplay.
- Readable at every size from 800×450 to 1920×1080 at devicePixelRatio 1. Landscape on desktop.
- Same game speed at 60 / 144 / 165 Hz (use delta time).
- Mouse, keyboard and touch all work. Mouse lock only for games where the mouse moves the character, and only after a click.
- Relative file paths only. Total size target under 20 MB. English text everywhere.
- No sitelock. No external links, no other logins, no external ads, no personal data collection.

## 9. Self-test before saying "done" (add to every task's checklist)
- Double-click `index.html` → game loads and plays fully; every reward button gives its reward (SDK unavailable path).
- No reward button is ever clickable without doing something.
- Each `adError` code path from the table in 3.3 is handled (simulate them in code if needed) and none freezes the game.
- Revive offered at most once per session; never a midgame ad + "keep playing" at the same break.
- Sound is muted only after `adStarted` and always comes back.

---

## 10. Game-specific exceptions (decided by the owner)

These override the matching rules above **only for the named game**. All other rules still apply. Official CrazyGames rules in `CrazyGames-Docs-Reference.md` still win over everything here.

### Tentacle Burger Station (decided Oct 6, 2026 — revised the same day to follow the official rule "the request button should not appear on an active gameplay screen")
The game has no levels-with-breaks: the player walks around the station non-stop. So rewarded ads appear ONLY on screens where gameplay is paused:

- **Level-up panel** (pauses the game): "Level N! Reward: +$X" with two buttons of the same size/font/color: "Claim" and "▶ Watch ad: Claim ×3". The ad option is shown at most once every 3 minutes (otherwise only "Claim"); it never appears during the guided start or the first 3–5 minutes.
- **Boost Terminal** (a fixed, always-visible spot in each wing, like the hire desk): standing on it pauses the game and opens a panel. Each boost can be bought with normal money OR with "▶ Watch ad". Each ad option has its own 3-minute cooldown with a visible countdown. Closing the panel resumes the game.
  - Boosts: x2 move speed 60 s, instant +20 source items, temporary worker 2 min, cash = 90 s of current income (ad only; cash is earned by normal play anyway).
- **Floor offers (owner decision, Oct 7, 2026 — the same pattern is live in approved CrazyGames games such as "My Arcade Center" and "Outlets Rush"):** one offer at a time appears on the floor near the chef as a picture (magnet, hover vehicle, cash case, helper, gems) with its amount and a spinning ring that shows it disappears after 30 s. It is not an ad button: walking onto it pauses the game and opens a panel with "gems" / "▶ Free" / "Close", all the same size/font/color. The next offer comes 1 minute after the last one ended, or 3 minutes after the player watched an ad for one. Gem offers are ad-only (plus "Close"). Offers start only after the guided start.
- **Upgrades (owner decision, Oct 7, 2026):** every machine / tank / counter / table upgrade costs money (price grows with income). After paying, a paused panel shows two cards: the paid upgrade ("Select") or a stronger "HOT" version for gems or "▶ Free" (no cooldown on this ad, owner's choice). Closing = the paid upgrade.
- **Worker upgrades:** gems, or "▶ Watch ad" with a 3-minute cooldown. **Chef Desk skills:** gems only, no ad.
- **No** reward button on the HUD during play.
- **Replaces 3.4 "daily cap of 5":** no daily total cap; the 3-minute cooldowns above are the limit. Ad rewards scale with current income (never fixed small amounts).
- **Midgame ads:** requested when the player presses "Claim" on a level-up panel (level ≥3, never in the first 3–5 minutes) and when closing the "new wing opened" panel. These are player-pressed breaks, so no "Ad starting in 3…" countdown is used. The SDK ignores early requests silently.
- **Unchanged:** every rewarded reward is also obtainable with normal money; no item that stops working until an ad is watched; Basic Launch / no SDK → reward given without an ad (3.3).

# Game Development — rules for Claude Code

This folder is a small browser-game studio. Games are plain HTML + JavaScript (no Unity), published on CrazyGames. The owner is not a programmer: he tests games by double-clicking `index.html` and judges the fun, the look and the videos.

## Read these BEFORE writing any code (every session)
1. `CrazyGames-Docs-Reference.md` (this folder) — read it **fully**. It is the official CrazyGames documentation copied word-for-word, plus project notes in Part A. Follow it exactly. If anything you know about CrazyGames or its SDK differs from this file, **this file wins**. If the live website differs from this file, stop and tell the owner.
2. `STUDIO-RULES.md` (this folder) — the studio's fixed rules for every game (SDK wrapper, rewarded-ad system, midgame ads, save, browser fixes, self-test). Apply them in every game without being asked.
3. `خط إنتاج الألعاب من الفكرة للإطلاق.md` (this folder) — the production pipeline. Find which stage the current game is in and do only what that stage allows. Never skip a stage gate. **Exception:** the CrazyGames SDK wrapper, the full ads system and progress save from `STUDIO-RULES.md` are built in from the very first prototype, in every stage, even if a stage says otherwise.
4. The current game's own files (its folder, and its idea/stage file such as `أفكار اللعبة 1 - المرحلة 1.md`).

Do NOT use these as sources for CrazyGames rules: `دليل قبول الألعاب على CrazyGames.md` (an Arabic summary written for the owner) and `CrazyGames_Docs_FULL.md` (unknown origin). Use only `CrazyGames-Docs-Reference.md`.

## Always
- Every game must open and be fully playable by double-clicking `index.html`, with no commands, no server and no installs — even if the CrazyGames SDK fails to load (see Part A, note 1).
- Relative file paths only. Works on Chrome and Edge, mouse + keyboard + touch.
- When fixing something: one change at a time. Before the change, state the problem and which number or behaviour should improve.
- Before saying you are done, check your work against the checklist in the prompt and against the relevant rules in `CrazyGames-Docs-Reference.md`.
- When you finish, explain to the owner in simple Egyptian Arabic, with as few English terms as possible and no terminal commands: what you did, what you are not sure about, and exactly how to test it.

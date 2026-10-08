# CrazyGames Docs — Full Reference for Claude Code

Captured: 2026-10-05 from https://docs.crazygames.com (every page listed in the site's sitemap was checked).
The project owner is not a programmer. **Read Part A fully, then read every page in Group 1 of Part B before writing any code.** Then read `STUDIO-RULES.md`. Read Group 2 before placing any ad. Group 3 only if the game uses that feature.

## How this file was built (why you can trust Part B)
- **Part A** (this section) = project notes from the planning assistant. NOT official text.
- **Part B** = the official pages, copied word-for-word. For pages that show the same code for several engines (HTML5 / Unity / Godot / ...), only the **HTML5** code tab was kept, because our games are plain HTML + JavaScript. Pages whose tabs are not engine tabs keep all tabs, marked `[TAB: name]`. Images are marked `[IMAGE: alt path]` (they are illustrations; no rules are written inside them). Links are kept as `text (url)`; relative urls are relative to https://docs.crazygames.com.
- Each page block shows the SHA-256 of its text. Every one was compared against the live page text and matched exactly.
- If Part A and Part B disagree, **Part B wins**. If the live website differs from Part B, the **live website wins** — stop and tell the owner.

## Pages from the sitemap that are NOT in Part B, and why
- Unity-only pages (custom build, optimization tips, optimizer package, common issues, addressables guide), Unity user-linking, Unity PlayerPrefs wrapper, GameMaker example: other engines.
- `/sdk/html5-v2/*` and `/other/game-challenge/` (which uses v2): old SDK v2, deprecated. **Always use SDK v3.**
- `/sdk/leaderboards-mvp/`: old draft, replaced by the Leaderboards pages included in Group 3.
- `/partials/*`: text fragments that are already included inside the full pages.
- `/resources/` and `/resources/html5-resources/`: navigation index pages only.
- Game covers, Payouts, Partners, External resources: not code (covers/videos are made by the owner; covered in the owner's Arabic guide).

## Studio decisions
All studio decisions (SDK wrapper, rewarded-ad system, midgame ads, save, browser fixes, self-test) are in **`STUDIO-RULES.md`** in this folder. Read it right after this file. They are not repeated here, so there is only one source.

Two facts about Part B pages to remember while reading them:
- The "Common fixes" snippet lists `["ArrowUp", "ArrowDown", ""]` while its comment says "spacebar"; the Space key is `" "`. Its `application.publishEvent(...)` call is PlayCanvas-only. Do not paste that snippet as-is (see STUDIO-RULES section 8).
- On `file://` (double-click) the SDK environment is `disabled` and every SDK call throws (SDK Introduction page). Hence the wrapper in STUDIO-RULES section 1.

---

# Part B — Official documentation (verbatim)

## Contents of Part B

**Group 1 — MUST READ before building (requirements, SDK, HTML5 fixes, launch)**
- Introduction — https://docs.crazygames.com/
- Introduction — https://docs.crazygames.com/requirements/intro/
- Technical requirements — https://docs.crazygames.com/requirements/technical/
- Gameplay requirements — https://docs.crazygames.com/requirements/gameplay/
- Advertisement requirements — https://docs.crazygames.com/requirements/ads/
- Account integration requirements — https://docs.crazygames.com/requirements/account-integration/
- Quality guidelines — https://docs.crazygames.com/requirements/quality/
- Introduction — https://docs.crazygames.com/sdk/intro/
- Video ads — https://docs.crazygames.com/sdk/video-ads/
- Banners — https://docs.crazygames.com/sdk/banners/
- Game — https://docs.crazygames.com/sdk/game/
- User — https://docs.crazygames.com/sdk/user/
- Data — https://docs.crazygames.com/sdk/data/
- Automatic progress save — https://docs.crazygames.com/other/aps/
- Common fixes — https://docs.crazygames.com/resources/html5/common-fixes/
- Sitelock — https://docs.crazygames.com/resources/html5/sitelock/
- CrazyGames App — https://docs.crazygames.com/resources/crazygames-app/
- Mouse Control tips — https://docs.crazygames.com/resources/mouse-control/
- Getting to the First Frame: Making Web Games Load Fast and Feel Great — https://docs.crazygames.com/resources/getting-to-the-first-frame/
- CrazyGames Basic Launch: The Metrics That Matter — https://docs.crazygames.com/resources/basic-launch-metrics/
- Frequently Asked Questions — https://docs.crazygames.com/faq/

**Group 2 — Ad placement guides (read before placing any ad)**
- CrazyGames Monetization: The Guide to Maximizing Ad Revenue — https://docs.crazygames.com/resources/ad-monetization-guide/
- Mastering Rewarded Ads: A Deep Dive — https://docs.crazygames.com/resources/rewarded-ads-deep-dive/
- Optimizing Midgame Ads: Pacing and Placement — https://docs.crazygames.com/resources/midgame-ads-pacing/
- Banner Ad Best Practices: A Practical Developer Guide — https://docs.crazygames.com/resources/banner-ads-best-practices/
- Ad Tips For Hypercasual & IO Games — https://docs.crazygames.com/resources/monetizing-hypercasual-io/
- Ad Tips For Midcore, RPG & Idle Games — https://docs.crazygames.com/resources/monetizing-midcore-idle/
- Ad Tips For Puzzle Games — https://docs.crazygames.com/resources/monetizing-puzzle/
- Ad Tips For Action Games — https://docs.crazygames.com/resources/monetizing-action/
- Ad Tips For Clicker & Incremental Games — https://docs.crazygames.com/resources/monetizing-clicker/
- Ad Tips For Word Games — https://docs.crazygames.com/resources/monetizing-word/
- Ad Tips For Driving Games — https://docs.crazygames.com/resources/monetizing-driving/

**Group 3 — Features not used in our first games (reference only)**
- Multiplayer requirements — https://docs.crazygames.com/requirements/multiplayer/
- In-game purchases — https://docs.crazygames.com/sdk/in-game-purchases/
- Store — https://docs.crazygames.com/sdk/store/
- Leaderboards — https://docs.crazygames.com/sdk/leaderboards/
- Leaderboards SDK — https://docs.crazygames.com/sdk/leaderboards-client/
- Leaderboards API — https://docs.crazygames.com/sdk/leaderboard-api/
- User account linking — https://docs.crazygames.com/sdk/user-linking/user-linking-html5-v3/


# Group 1 — MUST READ before building (requirements, SDK, HTML5 fixes, launch)


=================== BEGIN PAGE: https://docs.crazygames.com/ ===================
SHA-256: 1e3a682c73201efc8870d30e5fce37e5314b54569703472eb14e8ee590bcac78

# Introduction

Welcome to the documentation page for publishing a web game on CrazyGames. This page covers our game requirements and SDK documentation, while introducing you various resources and guidance to launch successful web-games. By publishing your game on CrazyGames, you can expect these benefits:

🎮 Your games available on desktop and mobile devices
👥 Reach millions of gamers, many of them registered
🤑 Earn revenue with ads (and in-game purchases for selected games only)
💾 Save game progress in the cloud easily
🎯 Engage gamers with in-game friend invites
📈 Get statistics and feedback for your games
🤝 Join an ever-growing community of passionate developers

## Launching on CrazyGames

All game submissions are carefully reviewed by our QA team according to our technical and quality requirements. Please take the time to read our requirements section (/requirements/intro) to ensure your game submission is accepted.

Games follow a two-stage launch process: Basic Launch and Full Launch. The goal of this process is to shorten the initial launch timeline and evaluate real-world performance before proceeding to a global release. You can learn more about how we select games for launch on our FAQ page (/faq/#how-do-you-decide-which-games-to-launch). For tips about launching your game in Basic Launch, see the Basic Launch Guide (/resources/basic-launch-metrics/).

The phases are described below:

| Basic Launch Basic Implementation (/requirements/intro)	| Full Launch Full Implementation (/requirements/intro) |
| - Test your game on our platform with a limited audience for a temporary period of 7 to 21 days.- Requires Basic Implementation; no CrazyGames-specific integration and only Basic QA review.- Monetization (video ads, banners, in-game purchases) is disabled.- Proceed to Full Launch if metrics are good.	| - Your game is selected for global release.- Requires Full Implementation of CrazyGames requirements, including a Full QA review.- Monetization is enabled and you start receiving revenue share.- During integration, the Basic version remains available to its initial limited audience. |

Check our requirements section (/requirements/intro) for detailed requirements for each phase. Our QA tool will guide you through the submission and review process step by step.

Progression to the Full Launch stage is based on key engagement metrics - average playtime, conversion to gameplay, and retention. These metrics will be benchmarked against other games on the platform. During the Basic Launch stage, you'll have the opportunity to monitor performance and gather user feedback.

The Basic Launch period ends once your game has been live for at least 7 days and has reached at least 500 plays. Both thresholds must be met, so a game that reaches 500 plays sooner still runs for the full 7 days. If your game hasn't reached 500 plays by then, the period ends automatically after 21 days. At the end of the period, you’ll be notified about the next steps:

- If all metrics meet or exceed benchmarks, you are invited to update your game. After implementing Full Implementation requirements, you can then submit the new version for Full Launch.
- If some metrics meet benchmarks, you may be invited to improve your game and request another Basic Launch period.
- If most metrics fall below benchmarks, your game unfortunately can’t proceed to Full Launch. If you wish to submit it again, you need to submit as a new game including significant improvements.

In some cases, such as multiplayer titles that require a larger audience or games already published elsewhere and specifically invited by our team, you may bypass the Basic Launch and proceed directly to the Full Launch.

## SDK

Our SDK bridges the gap between your web game and CrazyGames. Furthermore:

- It is easy to integrate, with simple one-time integration
- You can earn revenue through user-friendly ads
- Your game integrates perfectly with our platform
- The documentation is simple to follow

To start using the SDK pick the one corresponding to the technology you are using. If your technology isn't explicitly listed, you can usually manage at least basic integration through the HTML5 version. Most game engines that support WebGL also have a way of interacting with JavaScript when running in browser.

Make sure to check about our requirements (/requirements/intro) before you start integrating the SDK.

You can integrate our SDK with any common game development framework. We currently have games (https://www.crazygames.com) live developed with Unity, Defold, Godot, Phaser, PlayCanvas, Construct, Pixi.js, BabylonJS, and many other frameworks.

| (/sdk/intro/#html5)	| (/sdk/intro/#unity)	| (/sdk/intro/#gamemaker)	| (/sdk/intro/#construct)	| (/sdk/intro/#godot) |
| HTML5 (/sdk/intro/#html5)	| Unity (/sdk/intro/#unity)	| GameMaker (/sdk/intro/#gamemaker)	| Construct3 (/sdk/intro/#construct)	| Godot (/sdk/intro/#godot) |
| (/sdk/intro/#cocos)	| (https://wiki.gdevelop.io/gdevelop5/extensions/crazy-games-ad-api/details/)	| (https://defold.com/extension-crazygames/)	| (https://wonderlandengine.com/tutorials/upsdk-crazygames/)	|	| |
| Cocos (/sdk/intro/#cocos)	| GDevelop ↗ (https://wiki.gdevelop.io/gdevelop5/extensions/crazy-games-ad-api/details/)	| Defold ↗ (https://defold.com/extension-crazygames/)	| Wonderland ↗ (https://wonderlandengine.com/tutorials/upsdk-crazygames/)	|	| |
## Testing your game

To preview your game on CrazyGames before submitting, you can use our Preview tool (https://developer.crazygames.com/) to test how your game will look on CrazyGames. You can easily reach it via Submit a game and test different versions before actually submitting.

## Partners

The Partners (/resources/partners/) page gives an overview of our beloved partners.

| (/resources/partners#photon-backend)	| (/resources/partners#xsolla-payments)	| (/resources/partners#bytebrew-analytics)	| (/resources/partners#lasso-moderation) |
| Photon Backend (/resources/partners#photon-backend)	| Xsolla Payments (/resources/partners#xsolla-payments)	| ByteBrew Analytics (/resources/partners#bytebrew-analytics)	| Lasso Moderation (/resources/partners#lasso-moderation) |
## Others

In our Resources section, you can find more information about various topics like mouse lock and download size optimizations.

Lastly we offer an extensive FAQ (/faq) for various questions and to reach out.

=================== END PAGE: https://docs.crazygames.com/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/requirements/intro/ ===================
SHA-256: 5e4fb7cf3a91cfb6c9e46e0a8c4c5d5dc6a20802cd918bc37b20f224f279ad80

# Introduction
## Requirements

To be published on CrazyGames, your game must meet our requirements. We designed these standards to ensure all games on our platform are fun, unique, visually appealing, and properly integrated.

Our launch process consists of 2 steps. Read more about the principles on the introduction page (/).

- A game in Basic Launch allows you to go live without needing to customize your game for CrazyGames. The CrazyGames SDK is optional and monetization is not available. Review the Basic Launch Guide (/resources/basic-launch-metrics/) to understand how progression is evaluated.
- Once your game has been selected for Full Launch, you are required to comply to all integration requirements listed below, including the CrazyGames SDK.

The table below provides a summary of the key requirements. Each category has a dedicated page with detailed descriptions:

| Category	| Basic Implementation Basic Implementation (/requirements/intro)	| Full Implementation* Full Implementation (/requirements/intro) |
| Technical (/requirements/technical)	| - Initial download size ≤ 50MB- Total file size ≤ 250MB (50MB without SDK)- File count ≤ 1500	| - SDK & GameplayStart event |
| Gameplay (/requirements/gameplay)	| - Basic visual QA checks- Adhere to PEGI12	| - Full visual QA check- Land directly in gameplay |
| Advertisement (/requirements/ads)	| - CrazyGames monetization is disabled- No external ads	| - Ads through SDK, following our guidelines- Works with AdBlock |
| Account integration (/requirements/account-integration) Only when applicable	| - No external login options	| - Progress is linked to CrazyGames Account- Use CrazyGames username & avatar- Automatic login for CrazyGames users |
| Multiplayer (/requirements/multiplayer) Only when applicable	| Full implementation features might increase engagement and are optional in basic launch	| - User room info- Invite link (if applicable)- Instant multiplayer flow- Keep rooms across rounds- DisableChat preference |
| In-game Purchases (/sdk/in-game-purchases) Invite Only	| Not available	| - Use CrazyGames Xsolla account and `userId` |

* A full implementation should implement the basic implementation requirements as well.

Our HTML5 and Unity SDKs support all the scenarios. Other SDKs might miss certain functionalities.

As part of the submission process, you will also need to provide qualitative metadata (game description and controls) and Game covers (/requirements/game-covers) (images and videos).

## Guidelines & resources

Additionally we offer some Quality Guidelines (/requirements/quality) to optimize your game for success on the CrazyGames platform. These are optional but based on our insights in our audience and web gaming. Guidelines are marked with Guideline throughout the documentation.

Lastly have a look at the Resources provided on this site for additional tips to publish a succesful web game.

## Monetization

The primary monetization mechanism we offer is through advertisement revenue share. Only ads served through our SDK are allowed, refer to our Advertisement requirements (/requirements/ads).

Selected games are eligible for In-game Purchases (/resources/partners#xsolla-payments). A Full Implementation (/requirements/intro) is required, using Xsolla as payments provider. Contact our team (/faq/#contact) if you want to apply for this.

## Insights & Analytics

Once your game has been published, you'll be able to monitor key game metrics on your Developer Dashboard (https://developer.crazygames.com/). These are some of the metrics we provide by default:

- Players
- Average playtime
- Gameplay conversion
- Retention
- Revenue

To further optimize your game and access advanced analytics — including level progression, drop-off points, and user journey tracking — we recommend utilizing ByteBrew (/resources/partners#bytebrew-analytics). This powerful, free analytics tool is simple to integrate, enabling you to enhance player engagement and boost the visibility of your game on the Crazy Games Portal.

Warning

In case your game collects additional personal data beyond the events in our SDK, the game should add a Terms & Conditions and/or Privacy Policy notice to new players. Check the User Consent (/requirements/technical/#user-consent) section for details.

## Technical support for SDK integration

Once your games reach 50k plays (combined), we can offer you technical support with SDK integration. This threshold allows us to give each developer individual feedback on ad placements and integration.

## Quality Assurance Tool

On our Developer Portal (https://developer.crazygames.com/) you'll be able to preview your game. It allows you to:

- Run your game as it would on CrazyGames
- Check if your game meets our requirements
- Test all the SDK features that you implemented and get feedback about it

=================== END PAGE: https://docs.crazygames.com/requirements/intro/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/requirements/technical/ ===================
SHA-256: e8cab5823f4d7763e69841addceefc3988b01d59459a44e7cb63da7f1234d0d3

# Technical requirements

You must follow these technical requirements to get your game published on CrazyGames. We selected these to ensure a fluid user experience when using the platform based on our experience with succesful web games.

## File Size & Count Limits

A key factor of a web game's success is the time it takes for a user to start playing. This is why we enforce strict file size limits.

- Basic Implementation (/requirements/intro) A maximum total file size of 250MB is allowed. There's a file count limit on 1500 files as high file counts will make loading slower.
- Basic Implementation (/requirements/intro) The game must have an initial download size ≤ 50MB. In order to be eligible for the mobile homepage, the initial download size needs to be ≤ 20MB.
- When the SDK is integrated (optional for basic implementation, mandatory for full implementation), the initial download size is measured between the start of loading and the occurence of the first `Gameplay start` event triggered through the `Game module` (/sdk/game#gameplay-startstop). This event should be triggered when the user enters in a playable state, so excludes menus and additional loading steps.
- In case the SDK is not integrated, total file size is used and thus should be ≤ 50MB (20MB to be eligible for the mobile home page).
- For externally hosted/loaded files our QA team will evaluate based on the time it takes to reach gameplay (≤ 20 seconds).
- Use only relative paths when referring to other files in the game bundle. Never use absolute paths, as they will fail to load (see here (https://www.w3schools.com/html/html_filepaths.asp) for additional information).

Refer to our Resources section and specifically to our Unity custom build (/resources/unity-custom-build) feature for optimization guidelines.

## Device & browser compatibility

Basic Implementation (/requirements/intro)

- We expect games to work on Chrome and Edge. Games that don't work well on Safari will be disabled on that browser.
- A significant segment of the CrazyGames audience uses Chromebook. Games will be disabled on Chromium OS if they do not work smoothly on a 4GB RAM device.
- Game supports mouse, keyboard, and touch if mobile is supported.
- Game should be playable in landscape mode on desktop. We allow vertical/portrait games to be published, especially if they are mobile friendly, either with displaying black bars or background images around on the sides.
- CrazyGames has advanced device detection capabilities to distinguish desktop/mobile/tablet, OS browser and application type. We strongly recommend to rely on our system info (/sdk/user/#system-info) to implement a device-specific experience.
### Mobile game requirements
- In order to be eligible for the mobile homepage, the initial download size can not exceed 20MB.
- You can configure supported orientation in your submission. The website will make sure your game can be played only in those orientations, by asking the users to rotate their devices. Thus, you don't need to implement any orientation lock logic.
-

When playing on some devices like tablets for example, double tapping, or pressing and holding can show the magnification tool, or it can select the entire game and show a contextual menu. To prevent frustration, this CSS should be added to the `body` of your game:

```
-webkit-user-select: none;
-moz-user-select: none;
-ms-user-select: none;
user-select: none;
```

-

Unity games will be disabled on iOS by default due to frequent crashes (caused by memory shortage). Once your game reaches sufficient plays our team will evaluate the game on iOS and consider enabling it.

- Mobile games should work well inside the CrazyGames App, where games open in fullscreen and can be affected by device safe areas. See the Safe are padding page (/resources/crazygames-app/#safe-area-padding) for more details and examples.
- We manage Unity graphics quality (Device Pixel Ratio) to ensure good game performance for users:
- For iOS devices and low memory Android devices, we choose DPR value of 1 because these devices crash with higher natively supported DPR
- For other devices the native DPR supported by the device is used (`window.devicePixelRatio`)
- We can overwrite this configuration manually if we think an exception is needed
#### Resuming audio after iOS interrupts it
##### Problem

Android keeps the AudioContext (https://developer.mozilla.org/en-US/docs/Web/API/AudioContext) in a running (https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state#running) state when a user moves to a different app (while still silencing the audio).

On iOS, the AudioContext enters an interrupted (https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state#interrupted) state when the app is backgrounded or interrupted by system events like phone calls. iOS therefore requires a proactive approach to restore sound once the user returns.

Some game engines / audio libraries handle this automatically for the developer like Unity. We did notice issues in games using Howler (https://howlerjs.com/) and PlayCanvas (https://playcanvas.com/).

##### Solution

The context often transitions to suspended (https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state#suspended) when the app is foregrounded. To revive the audio, developers must call the resume() (https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume) method within a valid user-initiated gesture, such as a touchend or click event. Simply listening for a visibility change is insufficient, as WebKit restricts audio playback until a direct interaction occurs.

```
document.addEventListener("touchend", () => {
    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
    }
});
```

The AudioContext is created by the developer’s game (or library). For example when using Howler (https://howlerjs.com/) it will be at Howler.ctx, in PlayCanvas (https://playcanvas.com/) it’s at pc.app.soundManager.context.

## SDK Integration

The CrazyGames SDK

For the best user experience and to be able to tap into all value of the CrazyGames platform, integrating the SDK is important. Refer to the appropriate game engine in the side menu.

### Basic SDK Integration

Basic Implementation (/requirements/intro)

If you decide to integrate the SDK for a Basic Launch, we require the following:

- A `Gameplay start` event is triggered from the `Game` module when the player reaches game state. This is used to measure initial download size.
- Take into account that Ads are not allowed in Basic Launch, and will be disabled even if you would integrate them.
### Full SDK Integration

Full Implementation (/requirements/intro)

A full integration of the SDK, involves the basic integration requirements and these additional ones:

- `Gameplay start/stop` events: allow us to measure and report on gameplay experience
- (if applicable) `Data` module for saving user game progression - see Progress Save (/requirements/account-integration#progress-save)
- (if applicable) `User` module for account integration and using username/avatar - see Account Integration (/requirements/account-integration#use-crazygames-profile)
- (optional) `Load start/stop` events: allow us to measure and report on in-game loading times and fail rates
## Sitelock & Whitelisting

Basic Implementation (/requirements/intro)

To avoid that your game files are stolen, you might implement a sitelock in your game. Read more about in the SDK docs of your game engine. If you implement a sitelock, you need to take into account that CrazyGames operates on multiple `crazygames.com` origins. If applicable, make sure to whitelist each of our domains to allow all our users to play. Our iOS and Android apps have their own origins, which need to be whitelisted as well.

Read more on our page about Sitelock (/resources/html5/sitelock/) and the origins of our apps (/resources/html5/sitelock/#sitelock-in-the-crazygames-app).

## User Consent

In case your game collects additional personal data beyond the events in our SDK, the game should add a Terms & Conditions and/or Privacy Policy notice to new players.

- We recommend to make this a simple notice rather than a pop-up blocking the user.
- Bloxd.io (https://www.crazygames.com/game/bloxdhop-io) shows a good example of in-game privacy policy
- Racing Limits (https://www.crazygames.com/game/racing-limits) opens the privacy policy in a new tab

=================== END PAGE: https://docs.crazygames.com/requirements/technical/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/requirements/gameplay/ ===================
SHA-256: 00c0c39867c0b49d9ff828f811d83aa7fc91b7a51eaa597be348966bf2f009fb

# Gameplay requirements

This page outlines the requirements that submitted games must meet to ensure a high-quality game experience. While we are not looking for the "perfect" game, our goal is to help players discover your well-crafted game without encountering inappropriate or subpar content. Only games that prioritize quality and gameplay will be allowed on the platform. Developers who repeatedly submit non-compliant games may face restrictions on future submissions.

Our quality guidelines are inspired by the Facebook games (https://www.facebook.com/fbgaminghome/developers/instant-games/best-practices-game-submissions).

## Basic Gameplay Requirements

Basic Implementation (/requirements/intro)

Our team performs several visual and functional checks on each submitted game. Ensure your game meets the following criteria:

- Readable Content: Text and images must be legible on devices with a `devicePixelRatio:1`, on responsive iframe sizes (16x9 ratio) and mobile screens (if applicable). These are the most important iframe sizes for our audience:
- `907 x 510 px` (desktop - non-fullscreen)
- `1216 x 684 px` (desktop - non-fullscreen)
- `1077 x 606 px` (desktop - non-fullscreen)
- `821 x 462 px` (desktop - non-fullscreen)
- `1366 x 768 px` (desktop - fullscreen)
- `1920 x 1080 px` (desktop - fullscreen)
- `1536 x 864 px` (desktop - fullscreen)
- `1280 x 720 px` (desktop - fullscreen)
- `800 x 450 px` (mobile)
- `1080 x 607 px` (tablet)
- Consistent Physics: The game's physics must perform consistently across different monitor refresh rates (e.g. 144 Hz, 165 Hz)
- Language Support:
- The game must have English localization
- If translations are included, they should be accurate and of high quality. The game should use the user's language based on `locale` info provided through the system info method (/sdk/user/#system-info) in our SDK, and if not available/set fallback to English.
- Intuitive controls: The game should have intuitive controls on different types of devices. Have a look at the section about restricted keys (/requirements/quality#restricted-keys)
- Smooth Performance: The game must load quickly and play seamlessly without errors or crashes
- Originality: Game names, assets, and overall content should exhibit originality
- Fullscreen Functionality: Fullscreen mode is automatically provided by CrazyGames. Custom in-game fullscreen buttons are prohibited, as they can interfere with other features (e.g. monetization).
- No Cross-Promotion: The game should not include cross-promotions for external or internal games/platforms.
- Exception: Privacy Policy and Terms and Conditions if applicable. Check requirements intro (/requirements/intro/#privacy-consent) for details.
- Following exceptions are allowed as long as these are not a main CTA on the menu :
- Community links (discord, dev website, ...) are allowed on the game menu only as long they don’t lead directly to a playable web version
- Game Store (Epic, Steam, ...) links to the game on desktop games only on main menu or at the end of a demo game
- Backlinks to CG home or category page are accepted but not promoted
- Links to other game(s) in the same series of games (e.g. Horror Tale 1, 2, 3, …)
- App Store links are never allowed in-game, and should use the configurable game metadata fields in our Developer Portal
- Suited for minors: CrazyGames is a website for an audience aged 13 or more. Your game must be PEGI 12 (https://pegi.info/what-do-the-labels-mean) compliant.
- We host a standalone website dedicated for kids games (https://kids.crazygames.com), yet note that monetization is disabled on that domain.
## Full Gameplay Requirements

Full Implementation (/requirements/intro)

These additional requirements are mandatory for full implementations:

- Games should land new users in gameplay immediately.
- If this is not feasible given the game specifics, a maximum of 1 click is allowed.
## Additional Quality Guidelines

Guideline

Have a look at our Quality Guidelines (/requirements/quality) for more suggestions and best practices on how to publish a succesful game, covering onboarding and other principles. These are not mandatory but strongly recommended.

=================== END PAGE: https://docs.crazygames.com/requirements/gameplay/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/requirements/ads/ ===================
SHA-256: 6800250242cb7fdcab7ac59bd77a40f08fbc2d4d21336545a9b430a07b04f4c4

# Advertisement requirements

Full Implementation (/requirements/intro)

Warning

- If your game is currently in the Basic Launch (/#launching-on-crazygames) phase:
- Advertisements will be disabled; no revenue will be shared.
- If you did integrate the Ads SDK, our team will check to make sure the game runs smoothly while ads are disabled. The game will be rejected if it does not. For example: Game doesn't freeze between levels. There should not be rewarded ad buttons without effect.
- Only Ads requested through the CrazyGames SDK are allowed.

These types of advertisements are available through the CrazyGames SDK:

- Video ads
- Midgame ads: between levels or stages
- Rewarded ads: when giving a reward (CrazyGames provides fallback banners)
- In-game banners

In-game ads and purchases should provide a meaningful and rich experience for the player and should not appear before the user has experienced a reasonable amount of gameplay. Most importantly, in-game ads should not:

- Interrupt gameplay
- Trigger deceptively
- Chain multiple ads
## Video ads

[IMAGE: Video ../../img/requirements/ads/video.png]

- Video ads can not interrupt gameplay and shouldn't come as a surprise: Advertisements should not be shown while a user is playing. We do not allow disruptive ads since they will scare users away. Instead, show them at a logical point for the user. Examples are during a level transition, a map change when the player died etc. Do not show a midgame ad on a navigational button (e.g. when clicking the main menu icon or opening the settings or opening the shop).
- Your game should be paused during a video ad: Ensure that a user cannot progress the game while requesting or showing an ad. Disable buttons, or show a spinner that blocks interaction. An ad request is not instantaneous: several auctions are held and take some time to return with a reply. Block the UI until either an `adFinished` or `adError` event occurs.
- Handle unfilled ad calls correctly: Sometimes, the request for a midgame ad will be unfilled (either because of timing restrictions, adblock, or low demand). In this case you receive an `adError` event. You should handle this case correctly and ensure that the game continues.
- Your game should be muted during a video ad: Video advertisements have audio. Ensure that your in-game sound and the advertisement audio are not playing together. You should mute your audio whenever an advertisement starts playing, and unmute it when the ad has finished. Only mute the audio when the ad actually starts playing, and not when you request an ad. It is possible no advertisement is available, and muting and unmuting your music without a visual change is not user-friendly.
- Request midgame ads at opportune moments without worrying about frequency or minimum intervals:
- We take care automatically of how often a midgame ad is shown, taking into account the start of the game, the midroll frequency (max 1 every 3 minutes) and interplay with rewarded ads
- If the next midgame ad request is too early, it just gets ignored by the SDK and there is no impact for the user. This means that you can request a midgame ad at any opportune moment in the game without worrying about when the last midgame was shown
### Rewarded ads

Rewarded ads should be special opportunities that a user looks forward to, and not an expectation whenever the user plays your game. Poorly designed levels that can only be completed by a rewarded ad are not acceptable. Instead, occasionally give the user the option to watch a rewarded ad that gives them a cool bonus, or a funny cosmetic change.

We have strict requirements to include rewarded advertisements. Before you start implementing please make sure you read them carefully:

Placement and frequency

- Do not offer a rewarded ad too often. Inform the user of this with a timer or hide the ad request button.
- Do not chain multiple ads, i.e. watch more than one rewarded ad to receive a single reward.
- Do not promote the rewarded ads too aggressively. If the game rewarded ads are well-implemented users will want to use them, there is no need to remind them too often.
- The request button should not appear on an active gameplay screen. For example, in a racing game, the request button can't appear during the race.

Reward UI

- The button to request a rewarded ad should be easily accessible in a consistent location.
- The button to request a rewarded ad can not be misleading in any way. Specifically, the continue without watching a rewarded ad should be the same size, font, color, etc.
- It needs to be clear immediately that the reward is optional. Hiding or delaying the skip or close button on the offer is not allowed.
- It needs to be clear for players that they will have to watch an advertisement in exchange for the reward. This can be done by displaying a video icon for example.
- Provide an alternative to watching an ad. For example, a user can also buy the reward with coins that he can receive during the game.

Rewarded ads callbacks

- When the ad has finished (`adFinished`), make it clear that the player is rewarded. You can display an animation or a notification.
- When our rewarded ad returns with an `adError` callback, do NOT reward the player.
- We aim for a high ad fill rate, and provide alternative incentives if no ads are available.
- See below for more info about Ad Blockers.

Rewarded ad examples:

[TAB: In-game store ads]

In-game store ads are a great way to monetize players who are in a "purchase" mindset. You can award monetary value or items they otherwise have to buy.

[TAB: End-of-game multiplier]

After completing a level or mission, players are often rewarded. Why not use that as an opportunity to engage players by doubling their reward with a video ad?

[TAB: Out of lives ads]

Out-of-lives rewarded video ad placement offers a high temptation factor and limited alternative routes for players to take, and therefore can create a high emotional attachment. It is not allowed to offer an Out-of-lives rewarded video each time the users lose a life.

- Don’t offer out-of-live ads each time a user dies. The rewarded ad should be a special opportunity that a user looks forward to.
- Don’t offer a rewarded ad too often. Inform the user of this with a timer on the ad request button.
- When there is no ad available encourage the players to try again later.
- Provide an alternative to watching an ad. For example, a user can also buy the reward with coins that he can receive during the game.
- It's not allowed to combine a midgame ad between levels with a rewarded to keep playing the current level. So between 2 levels, you can have either a midgame ad and restart, or a 'watch rewarded to keep playing', but not both.
- It needs to be clear immediately that the reward is optional. Hiding or delaying the skip or close button on the offer is not allowed.
## In-game banner ads

[IMAGE: Banner ../../img/requirements/ads/banner.png]

- In-game banners are only allowed on useful screens with content that are open for at least 5 seconds on average.
- Make sure that in-game banners do not block any game UI on all game sizes (including on mobile).
- Do not show in-game banners during game-play.
- In-game banners must be clearly distinguishable from game content.
- A maximum of 2 in-game banners may be displayed on the same screen/view, provided that the overall user experience remains clear, non-intrusive, and user-friendly.
- In-game banners can have a performance impact and may negatively affect the user experience, which can reduce the overall quality and usability of the game.
## Adblockers

Full Implementation (/requirements/intro)

We strive to limit the use of adblockers on the CrazyGames platform, by disabling certain functionalities and blocking rewarded ads when an adblocker is detected. However since this detection won't ever be 100% correct, we want to ensure that even users where we detect an AdBlocker can play the game according to these rules:

- Players with AdBlocker should be able to play the game normally: It is never allowed to block players with AdBlockers from playing, or penalize players with certain disadvantages
- You can block certain features or special functionalities in the game; make sure to show a notice on such functions that they are blocked because of the AdBlocker usage
- Do not use popups as they might interfere with fullscreen behaviour and with CrazyGames adblock notices
- Do not keep the rewarded ads clickable but without effect

=================== END PAGE: https://docs.crazygames.com/requirements/ads/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/requirements/account-integration/ ===================
SHA-256: d0f22f07e1b8c6493c2934e4673bbfa2f4e20fec641490c24f9f9222ba169d70

# Account integration requirements

The CrazyGames account system

The CrazyGames account system is a powerful tool that allows our users to save progress, play on multiple devices, customize their username and avatar and play with their friends. The most succesful games on our site integrate seamlessly with our account system.

Over 35 million players have a CrazyGames account, many of them playing actively every week.

We want to ensure this experience for our users:

- No standalone in-game username or avatar is needed
- No additional login flows in-game are needed
- Guests can also play the games
## Integration scenarios

We understand these requirements can have a substantial impact on your game. However it's not necessary to do customization before releasing your initial game version which we describe below. We distinguish these 4 scenarios:

[TAB: Games without accounts]

Basic Implementation (/requirements/intro)

If your game doesn’t have the notion of users, you are not expected to integrate with our user module.

You can however use the Data module (/sdk/data) in our SDK to save user progress, or alternatively rely on our APS system (/other/aps).

[TAB: Use CrazyGames profile]

Full Implementation (/requirements/intro)

Improve the gamer's experience by showing their username and profile picture in your game.

- You can retrieve the user object from the User (/sdk/user) module to obtain user profile info
- In case the result is `null` the user is not logged in on CrazyGames and you should continue as guest.
- You can use the Data module in our SDK to save user progress, or alternatively rely on our APS system (/other/aps).

[TAB: In-game account (basic)]

Basic Implementation (/requirements/intro)

To publish a game that saves user profile info or progress on your own back-end without customization/integration, you should:

- Allow both guests and registered CrazyGames users to play your game as guests by default
- Disable any external login options (e.g. Facebook, Google, email)

Naturally, we will require you to integrate fully according to Full Implementation (/requirements/intro) when the game has proven to be succesful.

You can consider using the Data module in our SDK to save user progress, or alternatively rely on our APS system (/other/aps).

[TAB: In-game account (full)]

Full Implementation (/requirements/intro)

This scenario is meant for games that have in-game accounts with a custom back-end. We want to ensure a smooth login experience for CrazyGames users, meaning:

- New logged in CrazyGames users are automatically registered & logged in within your game.
- Returning logged in CrazyGames users are automatically logged in within your game.
- CrazyGames guests can play your game as guests.
- Logging out in the game and allowing login with external login options (e.g. Facebook, Google, email) is not allowed.
- If you want to offer importing existing accounts or exporting CrazyGames account, you are responsible for transferring progress correctly.

The section on In-game account integration below specifies the logic to implement in your game.

## Progress save

Full Implementation (/requirements/intro)

Saving game progress

Players care A LOT about their progress in games, and expect their progress to synchronize across their devices. CrazyGames offers a number of methods to save progress in the cloud. Unless progress is not applicable for your game, we require you to implement one of these methods.

- Preferably you use the CrazyGames Data module (/sdk/data) which saves the user's progress on their CrazyGames account.
- Progress for guest users is automatically saved locally
- When a guest logs in the progress is synced to their cloud (as long as no cloud progress was present).
- If your game has their own back-end to save data, you can use the User module (/sdk/user) to link back-end data to the user's CrazyGames account.
- Take into account the flows described above in In-game account integration to handle specific scenarios like guests logging in.
- Make sure to consider that the same user might log in on multiple devices, and multiple accounts can share a single device.
- Alternatively you can use our Automatic Progress Save (/other/aps) system, which automatically syncs local progress to the cloud. This is not allowed for games with in-game purchases as it relies on local data.
## In-game account integration

Full Implementation (/requirements/intro)

This section explains how to integrate CrazyGames accounts with your in-game account system according to our requirements.

### Preparation

Your CrazyGames game version will need to allow using CrazyGames `userId` as identifiers within the game. This is a unique string tied to the CrazyGames account that can be accessed through the User module (/sdk/user) in our SDK.

### Logic to implement at game launch

Start by retrieving the current user by calling `getUserToken()` (/sdk/user/#get-user-token) to get a JWT Token and verifying the token on your server. This will get you the player's `userId`.

Request the current user account every time the game starts, making sure to cover cases where different users share the same device or users change profile information (avatar/username/...).

#### Option 1: User is not logged in (`userNotAuthenticated` error)

You should always allow the user to start playing as Guest, as main scenario.

Creating in-game accounts for CrazyGames guests

We recommend NOT to create an in-game account in this scenario. If you do, you should be able to link it to a CrazyGames account when the guest logs in. Avoid relying solely on local data to identify Guests across sessions as multiple users might share the same device.

It is allowed to show a Login with CrazyGames button but not as a main CTA.

Don't trigger the Auth prompt (/sdk/user/#auth-prompt) automatically as this might confuse the user

#### Option 2: User is logged in on CrazyGames (`userId` is returned)

Check if the CrazyGames `userId` account already exists in your back-end.

- Case: CrazyGames account (`userId`) is already known in your back-end:
- Users can update their CrazyGames username & avatar, so if you store this info on your back-end make sure to update it by calling an endpoint on your server with the actual username and profile picture.
- Fetch the data for this user from your back-end, and start playing!
- Case: The CrazyGames account (`userId`) is not yet known to your game:
- Automatically create a game account using the player's CrazyGames account. Make sure to make the link based on the `userId` unique field, as other fields like `username` might change.
- (optional) If feasible and desired, you can save any local progress the user made as guest to the new account. Alternatively this user will have fresh data in your back-end.
### Logic to implement during the game
#### Players changing CrazyGames accounts while playing
- Guest users logging into their CrazyGames account while playing should be detected using an Auth Listener (/sdk/user/#auth-listener), in this case we will expect you to follow the "User is logged in on CrazyGames" flow above and if necessary refresh the game. This only applies to users playing as guest in the game.
- When a user logs out during gameplay, the entire web page is refreshed, so there is nothing else to do in this case. The game flow will start from the beginning.
#### Login Button

You can show a login button to guests:

- Do not make this the main CTA blocking the user
- A good placement is in the top right corner
- If you do this, the button should trigger the Auth prompt (/sdk/user/#auth-prompt) method in our SDK.
- Don't allow Guests to use different login methods than 'Login with CrazyGames'
#### Logout & account linking
- Logging out in the game and allowing login with external login options (e.g. Facebook, Google, email) is not allowed.
- If you want to offer importing existing in-game accounts or exporting CrazyGames account, you are responsible for transferring/migrating progress correctly.
- Our SDK contains an optional Account link prompt (/sdk/user/#account-link-prompt) function
- This is strongly recommended if you create in-game accounts for CrazyGames guests
- If your game has In-Game Purchases, this is recommended if you create in-game accounts for CrazyGames guests

=================== END PAGE: https://docs.crazygames.com/requirements/account-integration/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/requirements/quality/ ===================
SHA-256: fa4e662ad05529a088e27c2222489906b20193a9e31715f1010430bfcedadb92

# Quality guidelines

Guideline

This page describes a number of guidelines to publish a succesful game on the CrazyGames platform. The guidelines should be used alongside our mandatory requirements (/requirements/intro).

Whether a game is "good" or "bad" can often be subjective, but there are best practices learned from our experiences with successful games. The following list is non-exhaustive.

## Onboarding

For a game to be successful it is crucial that users get to gameplay quickly, understand what the game is about and how to control it. A good onboarding is paramount to make this possible:

- Provide a simple onboarding phase where new users land directly.
- Implement the onboarding in gameplay.
- Focus on the core functionality so users can start playing, avoid explaining every single feature.
- Make the onboarding phase skippable.
- Prioritize visuals and limit the use of text for onboarding.
- Show the user how to control the game with a keyboard overlay or mouse gestures. See Restricted Keys for more info.
- Make sure the UI is clear.
- Buttons are clearly labeled to indicate how to proceed.
- Buttons are not sized to encourage ads or other behaviors.
- Buttons do not have delays to confuse users or encourage other behaviors.
## General principles

Once a user is onboarded into the game, here are some general principles for web games:

- There are clear goals that the player can reach.
- The game is easy to learn.
- The game is easy to understand — the language is correct and clear, well translated, or the game makes good use of universal graphics prompts.
- The controls are consistent and intuitive throughout the game.
## What makes your game a fun experience?

Attributes of a web game that adheres to best practices:

- The game responds quickly to the player's actions.
- The challenge, strategy, and game story are balanced and well-paced.
- The display layout is comfortable and intuitive.
- The audio is comfortable and appropriate for the game.
- The game interface is designed for the user's device (desktop and optionally mobile).
- Various player segments can enjoy the game.
- The game story or scenarios are interesting where applicable.
- There are no overly repetitive or "boring" tasks in the game.
- The game processes information quickly to give players a feeling of smooth flow and continuity.
- Solo play and playing with friends:
- Playing alone is as prominent as playing with friends if both are offered.
- If playing alone is not available, the game clearly explains that.
## Is your game unique?

Attributes of a web game that adheres to best practices:

- It should be easy to improve or modify the game to add new content like new levels, art, story elements, etc.
- Major features such as the game's genre should not change after submission.
- The game should be frequently maintained and updated.
- The game is not easily confused with another that features a similar name or iconography.
- The game does not use a common identifier unless the game developer owns the respective IP.
- E.g. the name “Super Chess” is unique and clear, while simply “Chess” is not.
- The name “Scrabble” is clear and unique, but can only be used by the IP holder.
## Is your game aesthetically pleasing?

Attributes of a web game that adheres to best practices:

- Graphics should be of high quality.
- High resolution — quality games are visually pleasing.
- Quality games have consistent resolution throughout the game.
- Quality games are free of graphical defects like compression artifacts.
- Audio should be of high quality
- Audio levels are consistent.
- Sounds aren't too loud or quiet
- Any music in the game complements the visual experience

In addition to having no technical graphical issues, the game is internally consistent, coherent, and has attractive visuals. The games aesthetic style should remain consistent and not switch between looks i.e. moving from realistic to cartoony, or high resolution to low resolution.

The game is clear about what it is. It isn't misleading and is clear about what genre and type of game it is overall. The name and imagery presented on CrazyGames should reflect accurately the type of game the player will experience. The game only changes its name and associated imagery where totally necessary, such as when a significant update or visual overhaul of the game takes place.

## Restricted Keys
- It's important that the game controls are intuitive and easy to learn.
- Preferably make your key bindings adapt to the user's keyboard layout, rather than requiring the user to change their own bindings.
- Note that in some countries, like France, the standard keyboard has `AZERTY` layout, and the typical `WASD` keys for movement are `ZQSD` on that layout.
- Avoid common keys that have other behaviour on web:
- `Escape` closes fullscreen
- `Ctrl / Cmd + W` closes the tab; you can disable this when the user is in fullscreen

=================== END PAGE: https://docs.crazygames.com/requirements/quality/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/sdk/intro/ ===================
SHA-256: 88f8b7e6fbe690cdf1b9100575271c78e4f3ef2e7bac00e247a8f4adda2f1ebe

# Introduction

When integrating the CrazyGames SDK, make sure to follow our requirements (/requirements/intro). They will help you use the SDK in the best way possible and guide you in terms of technical, gameplay, ads and account integration requirements.

Our HTML5, Unity, and Godot SDKs support all the scenarios. Other SDKs miss certain functionalities for which you can usually manage at least basic integration through the HTML5 version. Most game engines that support WebGL also have a way of interacting with JavaScript when running in browser.

The SDK has the following modules:

| `ad` (../video-ads/)	| display video ads & detect adblockers	| 🟩 Fully supported |
| `banner` (../banners/)	| display banners	| 🟩 Fully supported |
| `game` (../game/)	| various game events and integration	| 🟩 Fully supported |
| `user` (../user/)	| interact with logged in user	| 🟩 Fully supported |
| `data` (../data/)	| store user data that persists across devices	| 🟩 Fully supported |
| In-game Purchases (../in-game-purchases/)	| handle in-game purchases (not a separate module)	| 🟩 Fully supported |

## Getting started

This section explains how to get the CrazyGames SDK up and running in your engine.

You can install the SDK by including the following script in the head of your game's `index.html`:

```
<!-- Load the SDK before your game code -->
<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>
```

Manual initialization

The v3 SDK requires initialization before being used. This can be done by calling the init method:

```
await window.CrazyGames.SDK.init();
```

It is important to `await` for the initialization since it happens asynchronously, and the SDK is unusable until initialized. We recommend that you do this before the game starts, for example on the loading screen.

Promises

The SDK relies on promises and doesn't accept a `callback` parameter. If you don't have the possibility to use `await`, you can call the async methods with `.then(...).catch(...)`, like in the example below:

```
// await example
try {
    const user = await window.CrazyGames.SDK.user.getUser();
    console.log(user);
} catch (e) {
    console.log("Get user error: ", e);
}

// .then .catch example
window.CrazyGames.SDK.user
    .getUser()
    .then((user) => console.log(user))
    .catch((e) => console.log("Get user error: ", e));
```

The HTML5 SDK docs will contain only examples using `await`.

## Important information

Don't miss this section with important information regarding your engine

Major changes when migrating from v2 to v3

You can find the docs for the old HTML5 v2 SDK here (/sdk/html5-v2/intro).

- The SDK requires to be manually initialized now
- Some async get methods are now simple variables:
- `window.CrazyGames.SDK.environment`
- `window.CrazyGames.SDK.user.isUserAccountAvailable`
- `window.CrazyGames.SDK.user.systemInfo`
- Methods to report loading changed from `sdkGameLoadingStart()` and `sdkGameLoadingStop()` to `loadingStart()` and `loadingStop()`
-

The v2 SDK was throwing inconsistent errors (strings or objects). The v3 SDK has now the following error format:

```
// there is always a "code" and a "message" containing more information
{code: 'userAlreadySignedIn', message: 'The user is already signed in'}
```

## Development & Testing

During the development, you will be running your game on different domains/environments:

- `localhost` - our SDKs work fine on localhost domains, where they display demo ads/banners and try to simulate other behaviour.
- `editors` - this applies to Unity, Construct, Cocos, etc. In editors our SDKs will also display demo ads/banners and try to simulate other behaviour.
- `Preview tool` - our QA environment (on `crazygames.com/preview`) offers the most realistic version of CrazyGames.com. After you've finished integrating the SDK, create a new game on Developer Portal (https://developer.crazygames.com/), upload your files, and you will be able to preview your game. Obtaining a working Xsolla token is possible only here.
- The `localhost` and `127.0.0.1` domains are considered `local` environments. Advertisements are not available. Instead, an overlay text will be displayed. For other events such as happy time, gameplay start, etc. the console output can be consulted. If you are using a different domain/ip for local development, you can always enforce the `local` environment by appending the `?useLocalSdk=true` query parameter to the URL in your browser.
- On `CrazyGames` domains the SDK has the `crazygames` environment, where it functions properly.
- On any other domains (including your domain on which you may host your game) the SDK has the `disabled` environment. All the calls to the SDK methods will throw an error. To prevent this, we recommend checking on which environment the SDK is running and avoiding making use of it outside `local` or `crazygames` environments.

The environment can be retrieved like this:

```
window.CrazyGames.SDK.environment;
```

=================== END PAGE: https://docs.crazygames.com/sdk/intro/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/sdk/video-ads/ ===================
SHA-256: c3c85421f4b67d038da83a3969fae8e9b8178b780d6286afc072761dedd991d4

# Video ads

The `ad` module contains functionality for displaying video ads and for detecting adblockers.

Requirements for Advertisements

Please be sure to read our advertisement requirements (/requirements/ads), since your game will be rejected without any feedback if it doesn't follow them.

## Getting started

After reading our SDK Introduction (../intro/) page for your engine, access the `ad` module like this:

```
window.CrazyGames.SDK.ad;
```

## Video ads

We support two different types of video ads: `midgame` and `rewarded`. Read more on our advertisement requirements (/requirements/ads).

- Midgame advertisements can happen when a user died, a level has been completed, etc.
- Rewarded advertisements can be requested by the user in exchange for a reward (An additional life, a retry when the user died, a bonus starting item, extra starting health, etc.).

To request a video ad:

```
const callbacks = {
  adFinished: () => console.log("End midgame ad"),
  adError: (error) => console.log("Error midgame ad", error),
  adStarted: () => console.log("Start midgame ad"),
};
window.CrazyGames.SDK.ad.requestAd("midgame", callbacks);
// or
window.CrazyGames.SDK.ad.requestAd("rewarded", callbacks);
```

Warning

Make sure to mute the audio and pause the game when the ad starts (`adStarted` callback), and to unmute the audio and continue the game when the ad finishes/fails to load (`adError` and `adFinished` callbacks)

## Callbacks

The `adError` callback is also triggered if the ad is not filled or if something else goes wrong. Your game should be able to handle this. CrazyGames provides fallback banners and house-ads to limit unfilled ads.

The returned `errorData` object will look like this:

```
{
    "code": "unfilled",
    "message": "No ad available"
}
```

Possible error codes:

- `adsDisabledBasicLaunch` - during Basic Launch ads are disabled
- `unfilled` - no ad available
- `adblock` - an adblocker prevents showing ads
- `adCooldown` - the ad was requested too soon, the usual midgame ad request interval is 3 minutes, taking rewarded and preroll ads into consideration.
- `other`
## Adblock detection

Info

We require games to function even when the user has an adblock. The detection is not foolproof, and it would be very frustrating for a user not running any adblock to get a non-functional game. You can block extra content, such as custom skins, or some levels, to motivate the user to turn off their adblock. Also, keep in mind that turning off the adblock usually requires a page refresh. Make sure that the progress is saved, or the user may just decide to stop playing your game.

You can use the code below to detect if the user has an adblocker.

```
const result = await window.CrazyGames.SDK.ad.hasAdblock();
console.log("Adblock usage fetched", result);
```

=================== END PAGE: https://docs.crazygames.com/sdk/video-ads/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/sdk/banners/ ===================
SHA-256: 6cb3fc1731270aef95cb16fe30d9e961369a13c3ab528dbea8521758ce3c1137

# Banners

The `banner` module contains functionality for displaying banners within your game.

Requirements for Advertisements

Please be sure to read our advertisement requirements (/requirements/ads), since your game will be rejected without any feedback if it doesn't follow them.

## Getting started

After reading our SDK Introduction (../intro/) page for your engine, access the `banner` module like this:

```
window.CrazyGames.SDK.banner
```

## Request static banner

This paragraph explains how to request static banners. There are 5 banner sizes available:

- Leaderboard (728x90)
- Medium (300x250)
- Mobile (320x50)
- Main (468x60)
- Large Mobile (320x100)

To begin, you need to have an HTML container of the banner size present on the screen:

```
<div id="banner-container" style="width: 300px; height: 250px"></div>
```

And fill that using javascript:

```
try {
  // await is not mandatory when requesting banners,
  // but it will allow you to catch errors
  await window.CrazyGames.SDK.banner.requestBanner({
    id: "banner-container",
    width: 300,
    height: 250,
  });
} catch (e) {
  console.log("Banner request error", e);
}
```

## Request responsive banner

The responsive banners feature will request ads that fit into your container, without the need to specify or select a size beforehand. The resulting banners will have one of the following sizes:

- 970x90
- 320x50
- 160x600
- 336x280
- 728x90
- 300x600
- 468x60
- 970x250
- 300x250
- 250x250
- 120x600

Only banners that fit into your container will be displayed, if your container cannot fit any of these sizes no ad will be rendered. The rendered banner is automatically vertically and horizontally centered into your container.

Set your container size to a non-null value:

```
<div id="responsive-banner-container" style="width: 500px; height: 500px"></div>
```

Request the responsive banner:

```
try {
  // await is not mandatory when requesting banners, but it will allow you to catch errors
  await window.CrazyGames.SDK.banner.requestResponsiveBanner("responsive-banner-container");
} catch (e) {
  console.log("Error on request responsive banner", e);
}
```

## Errors

Requesting a banner can also throw an error, for example:

```
{
    "code": "bannerCooldown",
    "message": "A banner has already been requested for container banner-container-crazygames-inner less than 30 seconds ago, please wait.",
    "containerId": "banner-container-crazygames-inner"
}
```

Possible error codes:

- `bannersDisabledBasicLaunch` - during Basic Launch banners are disabled
- `unfilled` - no banner available
- `missingId` - the banner id wasn't provided
- `notVisible` - the banner container is not fully visible on page, please ensure it doesn't go out of the page and it is not hidden
- `noAvailableSizes` - the requested responsive banner size doesn't fit any of our available sizes
- `notCreated` - the banner container is not present on the page
- `videoAdPlaying` - banners cannot be rendered/refreshed while a video ad is playing
- `invalidSize` - banner size is not valid, please use only the available sizes
- `bannerCooldown` - banners cannot be refreshed too quickly, please allow for some time, normally 30 seconds, before refreshing the same container banner
- `maxRefreshReached` - you reached the banner refresh limit per gaming session
- `bannersDisabledMobileApp` - banners cannot be rendered when your game is embedded in the mobile app
- `other`
## Refreshing & clearing banners

To refresh the banners, simply call the `requestBanner` or `requestResponsiveBanner` methods again with the same container id.

The banners have the following limitations:

- There is a minimum delay of 30 seconds between banner refreshes. If you call the request banner methods more often, you will receive the following error: `A banner has already been requested for container banner-container less than 30 seconds ago, please wait.`
- During a gaming session the banners can be refreshed up to 120 times (this applies to each banner size separately).

Clearing the banners

The SDK provides 2 methods for clearing the banners:

```
window.CrazyGames.SDK.banner.clearBanner("banner-container");
// or
window.CrazyGames.SDK.banner.clearAllBanners();
```

We recommend that you clear the banners after hiding them. Otherwise, when you request new banners again, the old banners may still appear for a fraction of a second, which negatively impacts the user experience.

## Limitations

Banners won't display if they do not follow any of these rules:

- The same banner can be re-displayed only 30 seconds after the last display.
- The banner has to be fully inside the game window.

=================== END PAGE: https://docs.crazygames.com/sdk/banners/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/sdk/game/ ===================
SHA-256: 8543a478e392586417b492a7caa8f9736b504ec996d446099a79c7c9fed8bea3

# Game

The `game` module contains various functionality related to the game. After reading our SDK Introduction (../intro/) page for your engine, access the `game` module like this:

```
window.CrazyGames.SDK.game;
```

## Game Settings

The game module contains a `settings` object, that can be accessed like this:

A Full Implementation (/requirements/intro) requires `muteAudio` support for HTML5, Unity, Cocos, and Construct games.

```
window.CrazyGames.SDK.game.settings;
```

The settings object contains:

- `disableChat` - if `true`, the game should disable chat (if applicable). Read more about chat on multiplayer requirements (/requirements/multiplayer) page. Locally you can use `?disableChat=true` to force this to true.
- `muteAudio` - please disable the game audio if this is true. Locally you can use `?muteAudio=true` to force this to true. This setting should take priority over your in-game audio settings. So, for example, if you also offer an "Audio On/Off" toggle in game, be sure this doesn't enable the audio back if it is disabled in the SDK settings.

You can also register a listener which will be called each time the game settings change:

```
function listener(newSettings){
    console.log("Settings updated", newSettings);
}

// to add a listener
window.CrazyGames.SDK.game.addSettingsChangeListener(listener);

// to remove a listener
window.CrazyGames.SDK.game.removeSettingsChangeListener(listener);
```

## Gameplay start/stop

We provide functions that enable us to track when and how users are playing your games. These can be used to ensure our site does not perform resource intensive actions while a user is playing.

The `gameplay start` function has to be called whenever the player starts playing or resumes playing after a break (game start, resume, revive, enter next level, ...). The first event is used to determine your game's initial loading size.

The `gameplay stop` function has to be called on every game break (entering a menu, ending level, pausing the game, ...) don't forget to call `gameplay start` when the gameplay resumes. Don't call this event when the user switches focus or leaves the game area (we handle this on our side).

You can call the methods like this:

```
window.CrazyGames.SDK.game.gameplayStart();
window.CrazyGames.SDK.game.gameplayStop();
```

## Game loading start/stop

We provide functions that enable us to track when and how long the loading of your game takes.

The `loading start` function has to be called whenever you start loading your game.

The `loading stop` function has to be called when the loading is complete and eventually the gameplay starts.

```
window.CrazyGames.SDK.game.loadingStart();
window.CrazyGames.SDK.game.loadingStop();
```

## Happy time

The `happytime()` method can be called on various player achievements (beating a boss, reaching a highscore, etc.). It makes the website celebrate (for example by launching some confetti). There is no need to call this when a level is completed, or an item is obtained.

Info

Use this feature sparingly, the celebration should remain a special moment.

```
window.CrazyGames.SDK.game.happytime();
```

## Game completion percentage

The `reportGameCompletedPercentage` method is used to notify CrazyGames that a player has completed your game or reached a progression milestone.

Initially, this event will be used to improve the post-completion experience for players. For example, CrazyGames may use it to offer players the option to restart the game after reaching the end or notify players who had previously completed the game that the game had an update.

The method accepts a progression value between 0 and 100. While reporting only 100 is enough, we encourage developers to provide intermediate progression updates whenever possible to better understand how players progress through games; this may unlock additional platform features in the future. An example is indicating intermediate progress to players on the platform, so they can strive to reach 100% or awarding badges when they complete a game.

If your game has clear progression (e.g. levels, chapters, missions), report the player's progress as they advance. If your game does not have meaningful intermediate milestones, you can simply report 100 when the player completes the game.

For endless, sandbox, or highly replayable games, developers may define their own interpretation of what constitutes 100% completion, as long as it is applied consistently. For example, an endless game could consider reaching a specific milestone, score, or objective as completion.

Progression should generally move forward over time, and 100% should only be reported when the player reaches a meaningful completion point in the game.

If you update your game with new content (e.g. additional levels or chapters), report the correct percentage on game start to reflect the player's progress relative to the new content. For example, a player who previously reached 100% may now be at a lower percentage, so call `reportGameCompletedPercentage` with the updated value when the game loads.

```
window.CrazyGames.SDK.game.reportGameCompletedPercentage(50); // player completed 50% of the game
```

## Game context

Users can send feedback related to your game, which is sent to you via an email, and can be also viewed on our Developer Portal (https://developer.crazygames.com/).

To make this feedback more actionable, you can use the `setGameContext` method to attach relevant in-game data. For example, you might include the user's current level, equipped weapon, gold amount, or active skins.

Providing this context makes it significantly easier to understand and reproduce issues. For instance, if a user reports being stuck but doesn't specify where, the attached data can immediately reveal the exact level and game state.

```
// this can be called at the start of the level
window.CrazyGames.SDK.game.setGameContext({
    "level": 12
});

// don't forget to clear the context when not relevant anymore, for example if the user exists the level
window.CrazyGames.SDK.game.clearGameContext();
```

## Multiplayer features

This section describes the game specific SDK functionality supporting our Multiplayer Requirements (/requirements/multiplayer). Refer to that page for additional context on mandatory/optional requirements.

Demo game

We also created a demo game (https://www.crazygames.com/game/unity-multiplayer-demo) that showcases various multiplayer features from our SDK. You can download the source code from here (https://sdk.crazygames.com/MultiplayerDemoGame.zip).

### Instant multiplayer

The game module contains the `isInstantMultiplayer` flag that indicates if you should direct the user into multiplayer mode, in a joinable location directly.

```
// this field was previously called isInstantJoin which is now deprecated,
// please use isInstantMultiplayer
window.CrazyGames.SDK.game.isInstantMultiplayer;
```

### Room data

We define the `room` as a unique location where the user is playing or waiting in your game. Having room information available on platform level allows us to improve the user experience through showing an invite button, platform notifications, status visualization, joining friends, listing other CrazyGames users in your room to make friends connections, and more. The room doesn't have to exist on the server, you could also consider a room a special case when some players are connected to each other directly, via WebRTC for example.

The `room` contains the following data:

- `roomId` - unique identifier for this room. If your game supports multiple regions, please ensure the roomId you report is unique across the regions, for example by joining the actual room id with the region id.
- `isJoinable` - allows the current player to invite other players or be joined by other players
- `inviteParams` - these will be passed to other players who accept an invitation, or join this player. Read more about the `inviteParams` in the room join listener section.

```
// the player joins a room
window.CrazyGames.SDK.game.updateRoom({ roomId: "123eu" });

// the room is now open, the current player can invite other players or be joined by other players
// the inviteParams are just an example, you may have other parameters required to join a specific room
window.CrazyGames.SDK.game.updateRoom({ isJoinable: true, inviteParams: { roomName: "123", region: "eu" }});

// the room is full and no more players can join
window.CrazyGames.SDK.game.updateRoom({ isJoinable: false});

// the player left the room
window.CrazyGames.SDK.game.leftRoom();

// you can always mix more parameters, for example if the player joins a room and the room is already joinable
window.CrazyGames.SDK.game.updateRoom({ roomId: "123eu", isJoinable: true, inviteParams: { roomName: "123", region: "eu" }});
```

### Room join listener

When the user tries to join their friends via an invite notification, invite link or friends drawer, there are 2 possible scenarios:

- The user is already in game. In this case the room join listener will be triggered.
- The user is redirected to the game page, and the game has to load. Use the `inviteParams` in this case.

```
// don't forget to check window.CrazyGames.SDK.game.inviteParams on game start
// if it is not null, your game was already started from an invite link, and you should send the player to the correct room

function listener(inviteParams){
    // send the user to the multiplayer room
}

// to add a listener
window.CrazyGames.SDK.game.addJoinRoomListener(listener);

// to remove a listener
window.CrazyGames.SDK.game.removeJoinRoomListener(listener);
```

### Invite link

This feature lets you share the CrazyGames version of your game to the players and invite them to join a multiplayer game. You can call `inviteLink` with a map of parameters that correspond to your game or game room. If your game only accepts players from the same region, you can add `region` as a parameter to the link. That way you can easily handle the scenario when users attempt to join from a different region.

```
const link = window.CrazyGames.SDK.game.inviteLink({
    roomName: 12345,
    param2: "value",
    param3: "value",
});
console.log("Invite link", link);
```

The invite link parameters can be retrieved with the help of the `getInviteParam` method, for example:

```
// returns either a string or null if the parameter is missing
window.CrazyGames.SDK.game.getInviteParam("roomName");
```

You can also access all invite parameters like this:

```
window.CrazyGames.SDK.game.inviteParams
```

inviteParams is `null` if the game wasn't started from an invite link.

### Invite button

Deprecated

This feature is replaced by the Room Data functionality and will be deprecated.

This feature indicates that the user is in a multiplayer room and can be joined.

```
const link = window.CrazyGames.SDK.game.showInviteButton({
    roomName: 12345,
    param2: "value",
    param3: "value",
});
// the returned link looks the same as the link
// returned by the inviteLink method
console.log("Invite button link", link);
```

Make sure to hide the invite button when the user can't be joined anymore (e.g. the room is full, the game has started or the lobby was canceled).

```
window.CrazyGames.SDK.game.hideInviteButton();
```

=================== END PAGE: https://docs.crazygames.com/sdk/game/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/sdk/user/ ===================
SHA-256: ca8ceba799149c4afe4e4e95621eba161caaa3b60523e4ede138c4bef8771474

# User

The user module provides various account functionality that you can use to authenticate a user in your game. This means that the CrazyGames players who are logged in on the platform will be able to play games that require a user account without having to register in the game. They will also be logged in automatically in the game on other devices where they use the same CrazyGames account.

The account integration (/requirements/account-integration) page already familiarized you with the possible user integration scenarios. For the scenarios where authentication is available, please consult the appropriate link below.

## Getting started

After reading our SDK Introduction (../intro/) page for your engine, the `user` module can be accessed like this:

```
window.CrazyGames.SDK.user;
```

## Check availability

Basic Implementation (/requirements/intro) Full Implementation (/requirements/intro)

The user account functionality is not available on other domains that embed your CrazyGames game. Before using any user account features, you should always ensure that the user account system is available.

```
const available = window.CrazyGames.SDK.user.isUserAccountAvailable;
console.log("User account system available", available);
```

## Get current user

Basic Implementation (/requirements/intro) Full Implementation (/requirements/intro)

You can retrieve the user currently logged in CrazyGames with the following method:

```
const user = await window.CrazyGames.SDK.user.getUser();
console.log("Get user result", user);
```

If the user is not logged in CrazyGames, the returned user will be `null`

User ID

The user ID `__dangerousUserId` should not be used for authentication. Anyone can easily inject malicious code in the browser, including user IDs, and gain access to other user accounts. For authentication, please use the user token.

The returned user object will look like this:

```
{
    "__dangerousUserId": "GAR5irLOPebfbol3QXww2WL1Ja61",
    "username": "SingingCheese.TLNU", // 6-20 chars (alfanumeric, period, underscores)
    "profilePictureUrl": "https://images.crazygames.com/userportal/avatars/4.png"
}
```

CrazyGames usernames are 6-20 characters and can contain letters, numbers, period and underscore.

## System info

Basic Implementation (/requirements/intro) Full Implementation (/requirements/intro)

System info can be retrieved like this:

```
const systemInfo = window.CrazyGames.SDK.user.systemInfo;
```

The response will look like this:

```
{
    "countryCode": "US",
    "locale": "en-US",
    "device": {
        // possible values: "desktop", "tablet", "mobile"
        "type": "desktop"
    },
    "os": {
        //Format cfr. [ua-parser-js](https://github.com/faisalman/ua-parser-js){target=\_blank}
        "name": "Windows",
        "version": "10"
    },
    "browser": {
        //Format cfr. [ua-parser-js](https://github.com/faisalman/ua-parser-js){target=\_blank}
        "name": "Chrome",
        "version": "107.0.0.0"
    },
    "applicationType": "web" // possible values: "google_play_store", "apple_store", "pwa", "web"
}
```

Warning

If you want to automatically set the language of the game based on user location, please use the locale field for this.

## Get friends

Basic Implementation (/requirements/intro) Full Implementation (/requirements/intro)

You can retrieve current user's friends like this:

```
try {
    const friendsPage = await window.CrazyGames.SDK.user.listFriends({page: 1, size: 10}); // page starts at 1, max size is 50
    console.log("List friends result", friendsPage);
} catch (e) {
    console.log("Error:", e);
}
```

The response will look like this:

```
{
    "friends": [
        {
            "id": "Uvqz2K6p7qOG9BMW0gW3Lso6lC02",
            "username": "SunMedusa.cWV0",
            "profilePictureUrl": "https://images.crazygames.com/userportal/avatars/16.png",
        }
    ],
    "page": 1,
    "size": 10,
    "hasMore": false,
    "total": 1
}
```

The following error codes can be returned:

- `userNotAuthenticated` - the user is not logged in CrazyGames
- `rateLimited` - method calls are limited every 250ms
- `requestInProgress` - only one active call is allowed
- `unexpectedError`
## Get user token

Basic Implementation (/requirements/intro) Full Implementation (/requirements/intro)

The user token contains the `userId` of the player that is currently logged in CrazyGames, as well as other useful information (`username`, `profilePictureUrl`, etc). You should send it to your server when required, and verify/decode it there to extract the `userId`. This is useful for linking the user accounts for example, where you can have a column "crazyGamesId" in your user table that will be populated with the user id from the token.

You can retrieve the user token with the following method:

```
try {
    const token = await window.CrazyGames.SDK.user.getUserToken();
    console.log("Get token result", token);
} catch (e) {
    console.log("Error:", e);
}
```

The token has a lifetime of 1 hour. The method will handle the token refresh. We recommend that you don't store the token, and always call this method when the token is required.

The following error codes can be returned:

- `userNotAuthenticated` - the user is not logged in CrazyGames
- `unexpectedError`

The returned token can be decoded for testing purposes on jwt.io (https://jwt.io).

The token payload will contain the following data:

```
{
    "userId": "UOuZBKgjwpY9k4TSBB2NPugbsHD3",
    "gameId": "20267",
    "username": "RustyCake.ZU9H", // 6-20 chars (alfanumeric, period, underscores)
    "profilePictureUrl": "https://images.crazygames.com/userportal/avatars/16.png",
    "iat": 1670328680,
    "exp": 1670332280
}
```

Do not decrypt tokens on the client

Make sure not to decrypt the user token on client-side as this is insecure. The typical info you need on the front-end (username, avatar) can easily be obtained by using the `getUser` method.

When you need to authenticate the requests with your server, you should send the token together with the requests.

The token can be verified with the public key hosted at this URL (https://sdk.crazygames.com/publicKey.json). We recommend that you fetch the key every time you verify the token, since it may change. Alternatively, you can implement a caching mechanism, and re-fetch it when the token fails to decode due to a possible key change.

Below is a TypeScript example that will help you decode and verify the token:

```
import * as jwt from "jsonwebtoken";
import axios from "axios";

export interface CrazyTokenPayload {
    userId: string;
    gameId: string;
    username: string; // 6-20 chars (alfanumeric, period, underscores)
    profilePictureUrl: string;
}

export const DecodeCGToken = async (
    token: string,
): Promise<CrazyTokenPayload> => {
    let key = "";

    try {
        const resp = await axios.get(
            "https://sdk.crazygames.com/publicKey.json",
        );
        key = resp.data["publicKey"];
    } catch (e) {
        console.error("Failed to fetch CrazyGames public key", e);
    }

    if (!key) {
        throw new Error("Key is empty when decoding CrazyGames token");
    }

    const payload = jwt.verify(token, key, { algorithms: ["RS256"] });
    return payload as CrazyTokenPayload;
};
```

## Auth prompt

Basic Implementation (/requirements/intro) Full Implementation (/requirements/intro)

By calling this method, the log in or register popup will be displayed on CrazyGames. The user can log in their existing account, or create a new account. The method returns the user object.

```
try {
    const user = await window.CrazyGames.SDK.user.showAuthPrompt();
    console.log("Auth prompt result", user);
} catch (e) {
    console.log("Error:", e);
}
```

The following errors can be returned:

- `showAuthPromptInProgress` - an auth prompt is already opened on the website
- `userAlreadySignedIn` - the user is already logged in
- `userCancelled` - the user closed the auth prompt without logging in or registering
## Auth listener

Guideline

You can register user auth listeners that are triggered when the player logs in CrazyGames. A log out doesn't trigger the auth listeners, since the entire page is refreshed when the player logs out.

```
const listener = (user) => console.log("User changed", user);

// to add a listener
window.CrazyGames.SDK.user.addAuthListener(listener);

// to remove a listener
window.CrazyGames.SDK.user.removeAuthListener(listener);
```

After detecting a login using the Auth Listener, if you use the CrazyGames account as an identifier you should fetch the user's progress from your back-end.

If you rely on the data module (/sdk/data) or automatic progress save (/other/aps/), our system automatically reloads the game in case of a login.

## Account link prompt

Guideline

If you'd like to support advanced account use cases, you'll need to handle account linking between the CrazyGames account and the other providers. Check User linking (../user-linking) page to find out more about user account linking.

For requesting the user's permission to link their CrazyGames account to the in-game account, please use the provided account link modal and avoid implementing it yourself. This provides the players with a standard modal.

[IMAGE: Account link modal /img/html5/link-account-modal.png]

You can display the modal by calling the following method:

```
try {
    const response = await window.CrazyGames.SDK.user.showAccountLinkPrompt();
    console.log("Link account response", response);
} catch (e) {
    console.log("Error:", e);
}
```

The response object will be either `{ "response": "yes" }` or `{ "response": "no" }`

The following error codes can be returned:

- `showAccountLinkPromptInProgress` - the link account modal is already displayed
- `userNotAuthenticated` - the user is not logged in CrazyGames
## Local Testing

Basic Implementation (/requirements/intro) Full Implementation (/requirements/intro)

When the SDK is in the `local` environment (on `127.0.0.1` or `localhost`) it will return some hardcoded default values for the method calls in the user module.

You can customize the returned local values by appending these query parameters:

- `?user_account_available=false` will change the response from the `isUserAccountAvailable` property to `false` (it returns `true` by default).
- `?show_auth_prompt_response=` will change the response from the `showAuthPrompt` method. It accepts the following values: `user1`, `user2`, `user_cancelled`
- `?link_account_response=` will change the response from the `showAccountLinkPrompt` method. It accepts the following values: `yes`, `no`, `logged_out`
- `?user_response=` will change the response from the `getUser` method. It accepts the following values: `user1`, `user2`, `logged_out`
- `?token_response=` will change the response from the `getUserToken` method. It accepts the following values: `user1`, `user2`, `expired_token` (to return an expired token), `logged_out`

By default, `getUser` returns `user1`, `getUserToken` returns token for `user1`, `showAccountLinkPrompt` returns `yes`, `showAuthPrompt` returns `user1`, and `isUserAccountAvailable` returns `true`.

=================== END PAGE: https://docs.crazygames.com/sdk/user/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/sdk/data/ ===================
SHA-256: f8cda99ab2946b041bf858442aaef93e69c9a3d41bac1da2930ceb7c309c5cd0

# Data

The data module allows to save and retrieve user data for logged in CrazyGames users. The data will also be synced on all the devices where the user plays the game.

If the user is not logged in, the data module will store the game data in LocalStorage. If the user logs in later, the LocalStorage game data will be synced and backed up on the user's account.

Warning

If you intend to use the data module, don't forget to select the appropriate Progress Save toggle in the submission flow. The data module will be disabled otherwise.

You need to fully rely on the Data Module save (for both guest and logged-in users on CrazyGames) and avoid relying on local saves to ensure the Data Module save works correctly.

## Using the data module

After reading our SDK Introduction (../intro/) page for your engine, follow these steps in order to use the `data` module.

Initialization

Before using any methods from the data module, please be sure the SDK is initialized.

```
await window.CrazyGames.SDK.init();
```

We recommend that you do this during the loading screen of your game since the SDK preloads all the game data when it is initialized. This may take some time, depending on how much user data is stored.

Usage

The data module has the same API as the localStorage (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage):

```
clear(): void;
getItem(key: string): string | null;
removeItem(key: string): void;
setItem(key: string, value: string): void;
```

You can call methods from the data module like this:

```
window.CrazyGames.SDK.data.setItem("gold", 100);
```

Avoid losing user progress

In general, it's a good practice to always retrieve your data before setting data to ensure that the player's previous progress isn't lost.

## Errors

The data module can throw errors, for example:

```
{
    "code": "dataLimitExcedeed",
    "message": "Game data when converted to a JSON string cannot exceed 1048576 bytes. Data was not saved"
}
```

Possible error codes:

- `dataLimitExcedeed` - you can store maximum 1MB of user data
- `dataModuleDisabled` - please be sure you selected the "Yes, using the Data Module from the CrazyGames SDK" option when submitting your game
- `other`
## Guest user behaviour

For guest users, the data module stores the game data in `localStorage`. When a guest user signs in, you don't need to do anything. Our SDK will automatically load the account game data if there is any, or if this user hasn't played your game before, the SDK will transfer the guest data to the user account.

When the user signs out, the SDK will revert back to using the guest game data.

## Data saving limits

The SDK debounces data saving with 1 second, meaning that multiple calls to the methods will be saved after 1 second. There may be exceptions in various cases, when data saving may be debounced with more time, up to 30 seconds.

There is a 1MB data limit. If you are approaching it, you will see warnings in the browser console. The data won't be backed up anymore if it exceeds 1MB.

## Help with the data module

If you're unsure on how to use the data module to save & load progress data, refer to the localStorage API (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) which works identically to the Data module.

## Integrating data module into already published games

Since the `data` module offers the same API as `window.localStorage`, it is quite easy to integrate it into your already published games. To avoid players losing their data, you should copy all the existing `localStorage` keys into the `data` module if the user played your game before.

=================== END PAGE: https://docs.crazygames.com/sdk/data/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/other/aps/ ===================
SHA-256: a0e3ea14bb0661214b33ce0d06c4fac7f0865d317d6cb6ab2e9770ed68fffd1e

# Automatic progress save

The automatic progress save system (APS) is responsible for saving user data, and then syncing it across all the devices where the user is authenticated. For example, a player can start playing your game on the mobile phone, and then continue playing it on the PC (as long as the player is using the same CrazyGames account on both devices).

The APS system can backup data from the local storage (used mostly by HTML5 games), or from IndexedDB (Unity games).

Data Module from SDK

Automatically saving local progress carries certain risks. It is not allowed for games with in-game purchases. Please refer to Account integration (/requirements/account-integration#progress-save) page for better methods to save progress.

## Local storage

Most of the HTML5 games save game data in `window.localStorage`. The APS system automatically backs up and restores the `localStorage` on the devices where the user plays. As a developer, there is no implementation required from your side.

## IndexedDB

Most Unity games will store user data in `PlayerPrefs`. On the Web, Unity games save the `PlayerPrefs` in IndexedDB, which is a database provided by the browser. If you save game data in `PlayerPrefs`, there is nothing that you should do, it will be synced automatically.

=================== END PAGE: https://docs.crazygames.com/other/aps/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/html5/common-fixes/ ===================
SHA-256: 4bbe3b7ae4a1b0b07d32c90de074a99308b2adc60ab5b9f21e19da781f974e64

# Common fixes

The snippet below addresses common UX issues caused by default browser behavior:

- Unwanted page scroll
- Unwanted key events
- Visibility changes on Samsung App
- Context menu appearing outside the Unity canvas

```
// Disable unwanted page scroll.
window.addEventListener("wheel", (event) => event.preventDefault(), {
    passive: false,
});

// Disable unwanted key events and spacebar scrolling.
window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", ""].includes(event.key)) {
        event.preventDefault();
    }
});

// Fix visibility change handling on webview (reported on Samsung App).
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState) {
        if (document.visibilityState === "hidden") {
            application.publishEvent("OnWebDocumentPause", "True");
        } else if (document.visibilityState === "visible") {
            application.publishEvent("OnWebDocumentPause", "False");
        }
    }
});

// Disable context menu after right click outside the canvas.
document.addEventListener("contextmenu", (event) => event.preventDefault());
```

=================== END PAGE: https://docs.crazygames.com/resources/html5/common-fixes/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/html5/sitelock/ ===================
SHA-256: 7fc48743e8323b6c76c38c7b96f88c3246c94da29940e5e6274eef4c9dc81926

# Sitelock

Sitelock helps prevent your HTML5 game from being copied and hosted on unauthorized websites.

## Protecting HTML5 games

To prevent your game from being stolen by other websites, check whether the game is running on a `crazygames.com` domain. This is an example domain that should support loading the game: `https://cubes-2048-io.game-files.crazygames.com/cubes-2048-io/13/index.html`

Your can use this function to ensure your game runs on valid CrazyGames domains.

```
function isCrazyGames() {
    const hostname = window.location.hostname;
    return hostname === "crazygames.com" || hostname.endsWith(".crazygames.com");
}
```

If this check fails, you can show a message such as "Available only on CrazyGames" or render a blank screen.

To improve sitelock robustness, you can obfuscate relevant parts of your game code with a tool like obfuscator.io (https://obfuscator.io/).

## Protecting iframe games

To prevent iframe embedding, configure the CSP header: `Content-Security-Policy: frame-ancestors [...]`

If you submit your game as an iframe game, keep in mind that your game is embedded from more than one CrazyGames origin. You must whitelist all supported CrazyGames domains:

```
// General
*.crazygames.com

// video ads run on
games.crazygames.com

// our iOS and Android apps, mind the scheme on iOS
https://app.crazygames.com
capacitor://app.crazygames.com

//deprecated domains (no longer need whitelisting)
www.crazygames.com
de.crazygames.com
it.crazygames.com
vn.crazygames.com
gr.crazygames.com
ar.crazygames.com
th.crazygames.com

www.crazygames.fr
www.crazygames.co.id
www.crazygames.cz
www.crazygames.dk
www.crazygames.hu
www.crazygames.nl
www.crazygames.no
www.crazygames.pl
www.crazygames.com.br
www.crazygames.ro
www.crazygames.fi
www.crazygames.se
www.crazygames.ru
www.crazygames.com.ua
www.crazygames.at
www.crazygames.jp
www.crazygames.pt
www.crazygames.vn
www.crazygames.com.vn
www.crazygames.co.kr

www.1001juegos.com
tr.crazygames.com
```

## Sitelock in the CrazyGames App

Players also play your game in our iOS and Android apps. Both are native WebViews that run the CrazyGames portal from a local copy of the site, so the page embedding your game is not `www.crazygames.com` there:

| App	| Origin of the page embedding your game |
| iOS	| `capacitor://app.crazygames.com` |
| Android	| `https://app.crazygames.com` |

iOS reserves the `https` scheme for the network and does not let a WebView serve local content over it, which is why the origin of our iOS app uses the `capacitor` scheme.

A bare host in `frame-ancestors` means `https` only

Entries such as `*.crazygames.com` inherit the scheme of the document that served the policy, so in a policy delivered over `https` they allow `https` ancestors only. The host of our iOS app matches, its scheme does not, and WebKit refuses to render your game. Players see a white screen: no JavaScript error is thrown, the block is only reported as a CSP violation in the console.

This policy works on the web and in the Android app, but shows a white screen in the iOS app:

```
Content-Security-Policy: frame-ancestors 'self' *.crazygames.com;
```

Listing the app origins explicitly fixes it:

```
Content-Security-Policy: frame-ancestors 'self' *.crazygames.com https://app.crazygames.com capacitor://app.crazygames.com;
```

Two more things to keep in mind:

- `frame-ancestors` is checked against every ancestor of your game, not only its direct parent. In the apps, your game is embedded by our game frame on `games.crazygames.com`, which is itself embedded by the app, so both origins have to be allowed.
- The `isCrazyGames` check above keeps working in the apps, but if your sitelock checks the embedder (`document.referrer`, `location.ancestorOrigins`) instead of its own location, apply the same rule there: compare the host and don't require the `https` scheme.

=================== END PAGE: https://docs.crazygames.com/resources/html5/sitelock/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/crazygames-app/ ===================
SHA-256: 8b39f53b0999d5ba566a853fa9179f81df537606b98e45d684cbc24a42887ca2

# CrazyGames App

Besides the website (https://www.crazygames.com/), we are also available as a mobile app on the App Store (https://apps.apple.com/us/app/crazygames-play-1500-games/id1636658567) and on Google Play (https://play.google.com/store/apps/details?id=com.crazygames.crazygamesapp), giving players another way to discover and play web games on mobile devices.

Most mobile web behavior is the same inside the CrazyGames App. Authentication, SDK calls, game progress, ads, and platform behavior should work as they do on the mobile website.

However, some app-specific differences are important to consider when developing or updating your game. This page explains how to detect that your game is running inside the app, how to handle in-game purchases, and how to prepare your UI for fullscreen mobile devices.

## Detecting the app

Use the SDK's System info (/sdk/user/#system-info) field `applicationType` to detect where the game is running.

```
const systemInfo = window.CrazyGames.SDK.user.systemInfo;
const isCrazyGamesApp = ["google_play_store", "apple_store"].includes(systemInfo.applicationType);
```

The app values are:

- `google_play_store`: the game is running inside the Android app.
- `apple_store`: the game is running inside the iOS app.
## In-app purchases

In-app purchases through Xsolla are currently not available inside the CrazyGames App. If your game uses Xsolla or another external payment flow, disable it when `applicationType` is `google_play_store` or `apple_store`.

Warning

Do not show purchase buttons or payment flows that cannot be completed inside the CrazyGames App. If your game supports purchases on the web version, hide or disable those UI elements when the game is opened in the app so players are not sent into an unsupported flow.

## Safe area padding

Games open in fullscreen mode inside the CrazyGames App. The app also supports a true fullscreen immersive mode where the game can render edge to edge on the device.

On some devices, rounded corners, notches, and dynamic islands can overlap or cut off UI placed too close to the screen edges. This is especially visible for buttons, menus, health bars, currencies, and other important HUD elements.

[IMAGE: Safe area padding example /img/app/safe-area.png]

If your mobile build already supports safe area padding, enable the same behavior when the game is running inside the CrazyGames App. If not, add padding for important UI when `applicationType` is `google_play_store` or `apple_store`.

For HTML5 games, prefer the CSS safe area environment variables where possible:

```
.game-ui {
    padding-top: env(safe-area-inset-top, 0px);
    padding-right: env(safe-area-inset-right, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    padding-left: env(safe-area-inset-left, 0px);
}
```

These values can be combined with your own minimum UI padding to keep important UI away from device edges.

Tip

Keep gameplay fullscreen, but move important UI into the safe area. This preserves the immersive app experience while preventing controls and information from being hidden by device edges.

## Sitelock and CSP

The page embedding your game in the app is `capacitor://app.crazygames.com` on iOS and `https://app.crazygames.com` on Android, not `www.crazygames.com`. If your game is sitelocked with a `Content-Security-Policy: frame-ancestors` header, these origins have to be listed explicitly. Entries without a scheme only allow ancestors served over `https`, so on iOS the game is blocked and players see a white screen.

See Sitelock in the CrazyGames App (/resources/html5/sitelock/#sitelock-in-the-crazygames-app) for the full explanation and an example header.

=================== END PAGE: https://docs.crazygames.com/resources/crazygames-app/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/mouse-control/ ===================
SHA-256: 5b095cdaff527b984478e04b41d4f5efedb831e3d2c4e7c859d3b873ea2f97aa

# Mouse Control tips

On desktop, a significant part of our users plays outside fullscreen mode. Your game should avoid users accidentally leaving the game by clicking outside of the game frame. Examples below explain how this can be done.

We recognize 3 different game types:

- First-person games:
- Lock the mouse in the center of the screen during gameplay
- Implement a keyboard shortcut to unlock the mouse (e.g. Escape, Tab)
- Examples: Bloxd.io (https://www.crazygames.com/game/bloxdhop-io)
- Top-view games in which the character moves based on mouse gestures (Agar.io (https://www.crazygames.com/game/agario), GunMaster.io (https://www.crazygames.com/game/gunmaster-io), Stickman King (https://www.crazygames.com/game/stickman-king), …). In these games, we require your game to:
- Lock the mouse & confine it to the game area
- Show a custom pointer or use an alternative method to display the mouse position (‘joystick’)
- Implement a keyboard shortcut to unlock the mouse (e.g. Escape, Tab)
- If any UI buttons are shown during gameplay, they should either be clickable or a keyboard shortcut should be indicated
- If you require additional functionalities, such as drag-and-drop they need to be managed from the game
- Optionally, the game could also add WASD/Arrow keys
- Examples: Little Big Fighters (https://www.crazygames.com/game/little-big-fighters), GunMaster.io (https://www.crazygames.com/game/gunmaster-io)
- Other games, where most actions are taken with mouse clicks on the UI (clickers, bubble shooter, …)
- In these games with limited mouse movement, we do not require mouse confinement.
## HTML5 resources

For HTML5 games, please refer to the Pointer Lock API (https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API).

## Unity examples

Here is a code example that uses `customMouse` as a variable that contains a custom mouse image confined to the game area.

Warning

The fake cursor won’t click on the Unity UI buttons, you will need to implement additional logic for that. Refer to the requirements above.

```
public Image customMouse;
public RectTransform canvas;
public float cursorSpeed = 20f; // adjust parameter according to your game
private bool isLocked = false;

void Start()
{
   isLocked = true;
   customMouse.enabled = false; //hide custom mouse
   Cursor.lockState = CursorLockMode.Locked; //Hide hardware cursor
}

void Update()
{
   float mouseX = Input.GetAxis("Mouse X") * cursorSpeed; //reads movement along X
   float mouseY = Input.GetAxis("Mouse Y") * cursorSpeed; //reads movement along Y

   // tracks the current position of the custom cursor.
   Vector2 currentPosition = customMouse.rectTransform.localPosition;

   // moves the custom cursor based on mouse input.
   currentPosition.x += mouseX;
   currentPosition.y += mouseY;

   // ensures the cursor stays within the canvas boundaries
   currentPosition.x = Mathf.Clamp(currentPosition.x, canvas.rect.min.x, canvas.rect.max.x);
   currentPosition.y = Mathf.Clamp(currentPosition.y, canvas.rect.min.y, canvas.rect.max.y);

   customMouse.rectTransform.localPosition = currentPosition;

   if (Input.anyKeyDown) {
      Cursor.lockState = CursorLockMode.Locked;
      if (isLocked)
      {
         customMouse.enabled = true;
         isLocked = false;
      }
   }

   if (Application.isFocused == false)
   {
      Cursor.lockState = CursorLockMode.None;
      if (!isLocked)
      {
         customMouse.enabled = false;
         isLocked = true;
      }
    }
}
```

=================== END PAGE: https://docs.crazygames.com/resources/mouse-control/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/getting-to-the-first-frame/ ===================
SHA-256: e67bd449ab82d0470850965da6f8f9173c90b98c9e27948af96674479722eb1d

# Getting to the First Frame: Making Web Games Load Fast and Feel Great

If you've spent any time making games for the web, you know the challenge: getting players into your game as quickly as possible, and making it feel snappy once they are there.

At CrazyGames, we have over 50 million monthly players, so every delay matters. A few extra seconds of load time can mean the difference between a new fan and someone who bounces before the fun even begins.

This guide is all about the journey to the first frame: what happens under the hood before the first pixel appears, and what developers can do (in Unity, Godot, or anywhere else) to make it fast.

## Why loading times matter

Loading is the first impression your game makes, and it's where most players drop off if it's not handled well.

According to user interface research:

- <100 ms: Perceived as instant. No feedback needed.
- 1 second: Feels fine, does not break flow.
- 10 seconds: Attention starts to wander. You must show feedback or preload activities.

Google page speed metrics also show that bounce probability rises quickly as load time increases.

The goal is not necessarily to load instantly. For most games, that is unrealistic. The goal is to make loading feel instant by providing immediate feedback.

## What's actually happening when your game loads

Before the first frame appears, the browser still needs to:

- Download game files (WASM, JS, textures, audio, models).
- Initialize the engine (memory setup, shader compile, core systems).
- Process assets (decompress, parse, upload to GPU).
- Run your startup code (for example, Unity `Awake()`/`Start()` or Godot `_init()`/`_ready()`).

Only after all of this does rendering begin.

### CrazyGames Load Size

On CrazyGames, we track first-load time and size up to the moment your game calls the SDK `gameplayStart` (/sdk/game/#gameplay-startstop) method. This should represent the first moment of real gameplay, not only a loading screen.

A practical setup is:

- Load tutorial-critical assets first.
- Start gameplay as soon as the tutorial can be played.
- Continue loading main-game content while the player is in the tutorial.
- If content is still loading after the tutorial, show a loading screen before entering the full game.
## Win #1: Reduce initial download size

The biggest win is to shrink, split, or defer what players download first.

Both Unity and Godot support loading heavy content later, once players are already interacting with the game.

[TAB: Unity]

By default, Unity includes everything in the initial build, even content players might not see for a long time.

`Addressables` let you split content into groups, load it asynchronously, and optionally host it externally.

Get started:

- Install `Addressables` via Package Manager.
- Mark assets or folders as Addressable in the Inspector.
- Assign assets to groups.
- Build groups: Addressables -> Build -> New Build -> Default Build Script.
- Load assets asynchronously:

```
var handle = Addressables.LoadAssetAsync("IntroScene");
```

Release the handle when done:

```
Addressables.Release(handle);
```

[TAB: Godot]

In Godot, you can export sections of content as `.pck` files, host them externally, download them at runtime, and mount them.

```
var http_request = HTTPRequest.new()
add_child(http_request)
http_request.connect("request_completed", self, "_on_pck_downloaded")
http_request.request("https://mygame.com/level_2.pck")
```

Write the response to disk, then mount it:

```
ProjectSettings.load_resource_pack("user://level_2.pck")
```

Load interactively to avoid frame stalls:

```
var loader = ResourceLoader.load_interactive("res://levels/level_2/main_scene.tscn")
```

```
if loader:
    var err = loader.poll()
    if err == ERR_FILE_EOF:
        get_tree().change_scene_to(loader.get_resource())
    elif err == OK:
        $UI/ProgressBar.value = float(loader.get_stage()) / loader.get_stage_count()
```

## Win #2: Optimize build size

Smaller builds load faster and reach gameplay sooner.

[TAB: Unity]

- Use Brotli compression.
- Use efficient texture compression (for example ASTC).
- Use Vorbis audio and force mono where possible.
- Compress models and disable `Read/Write Enabled` where possible.
- Check splash/logo export settings.
- Use Build Report and Project Auditor.
- Consider the CrazyGames SDK optimizer package.

See also: Optimization tips (/resources/optimization-tips/), Optimizer package (/resources/optimizer-package/).

[TAB: Godot]

- Compress exported `.wasm`, `.js`, and `.pck` files with Brotli.
- Serve `.br` files with `Content-Encoding: br`.
- Keep PCK external when appropriate.
- Use suitable texture compression for your targets (for example S3TC or ETC2).
- Disable debug symbols for release builds.
- Use Project -> Tools -> Optimize Resources.
## Win #3: Shorten engine initialization

Even after download completes, players can still see a blank screen during engine boot and startup logic.

[TAB: Unity]

- Use aggressive code stripping and test carefully.
- Use stripping tools and profile startup scripts.
- Keep `Awake()` and `Start()` light.
- Move heavy startup work to coroutines or async tasks.
- Avoid overusing `Resources.Load()`.

[TAB: Godot]

- Use a custom export template for web builds.
- Disable unneeded modules/features.
- Keep `_init()` and `_ready()` lightweight.
- Defer heavy logic via `call_deferred()`.
- Keep logging low in release web builds.
## Runtime performance

After startup, maintain smooth frame pacing and responsiveness.

Common bottlenecks:

- CPU-heavy JS/WASM logic
- Overdraw from transparency
- Heavy physics
- Runtime allocations and garbage collection
- Audio latency

[TAB: Unity]

- Use IL2CPP for WebGL.
- Minimize per-frame allocations.
- Profile in both Editor and browser.
- Test on lower-end devices.

[TAB: Godot]

- Reduce physics FPS when appropriate.
- Tune vsync settings for responsiveness.
- Profile with Monitors and frame-time tools.
- Keep memory usage stable for browser reliability.
## The future: WebGPU and beyond

The web platform is improving quickly. As WebGPU adoption grows, graphics performance and shader compilation times continue to improve.

That means less time spent working around platform limits, and more time building games that are high-fidelity, responsive, and fast to start in a browser tab.

=================== END PAGE: https://docs.crazygames.com/resources/getting-to-the-first-frame/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/basic-launch-metrics/ ===================
SHA-256: 08c0c8d5ef16be549e1830649a23687eb139ce2e733669098bcd2b82cace36d6

# CrazyGames Basic Launch: The Metrics That Matter

Welcome to the Basic Launch program. This is your first step toward launching a hit game on CrazyGames.

This guide explains the Key Performance Indicators (KPIs) we use to measure player engagement during a test period that lasts between 7 and 21 days. Our goal is simple: use this data to give your game the best possible chance of success.

Let's get you launched.

## The process and your dashboard
- Duration: Basic Launch ends once your game has been live for at least 7 days and has reached at least 500 plays. Both thresholds need to be met. If your game hasn't reached 500 plays, the period ends automatically after 21 days.
- Live data: You can track your game's performance on your developer dashboard (https://developer.crazygames.com/), which updates daily. Day 1 Retention naturally takes an extra day to appear.
- Updates: You can update your game at any time. Updates are automatically approved, and their impact appears in your data with the daily dashboard refresh.
- Zero setup: KPI tracking is automatic. No SDK is needed for Basic Launch, so you can focus on your game. If you choose to integrate the SDK during Basic Launch, ads remain disabled.
- The outcome: Games with strong KPIs can move on to Full Launch, where you'll integrate our SDK (/sdk/intro/) for monetization.
## 1. Average play time

What it is: The average time a player spends in your game in a single session.

Why it matters: Longer sessions mean players are hooked on your core loop.

What success looks like: Successful titles often see 10+ minutes of average play time.

### How to improve it
- Build a rewarding loop: Make the core actions feel fun and satisfying.
- Set clear goals: Ensure players always know what to do next.
- Pace your content: Introduce new mechanics gradually to keep things interesting.
- Nail the difficulty: Create a curve that's challenging but fair.
## 2. Day 1 retention

What it is: The percentage of players who come back the day after their first session.

Why it matters: Retention proves your game is memorable and gives players a reason to return.

What success looks like: Strong games often achieve 10-15% Day 1 Retention.

### How to improve it
- Add meaningful progression: Give players a reason to grow (levels, unlocks, and upgrades).
- Create daily hooks: Use simple login bonuses or daily quests.
- Save player progress: Lost progress means lost players.
- Polish everything: Bugs and rough edges are major reasons players don't return.
## 3. Conversion

What it is: The percentage of players who play for at least one minute after starting the game.

Why it matters: Low conversion means users leave your game before actually achieving a meaningful play. This can be linked to slow load times or to confusing game onboarding.

What success looks like: Top-performing titles typically convert 80%+ of players, load in under 10 seconds, and have a build size below 20 MB.

### How to improve it
- Keep your build small: Aim for less than 20 MB.
- Load content dynamically: Get the first level running first, then load the rest in the background. If you're using Unity, we've got a guide to Addressables (/resources/unity-addressables-guide/).
- Get to gameplay fast: Cut long intros so players can play within seconds. Use this guide (/resources/getting-to-the-first-frame/) for practical loading optimizations.
## Key takeaways

Think of these KPIs as a compass, not a final grade. They help point your game in the right direction.

The stronger your numbers during Basic Launch, the more momentum you'll have heading toward a full and successful release on CrazyGames. We're here to help you win.

=================== END PAGE: https://docs.crazygames.com/resources/basic-launch-metrics/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/faq/ ===================
SHA-256: d2e2f2e8c38b5a61c78785b68676011421d99d04b49ac8d554adc439ce99ee98

# Frequently Asked Questions

Looking for answers? You'll find everything you need here, whether you're exploring web games or getting ready to publish on CrazyGames.

We've split this FAQ into two parts to make things easier to navigate:

- Publishing on CrazyGames focuses on getting your game live, from submission to launch and beyond
- Web Game 101 gives you a high-level overview of the space, from how these games reach players to how developers generate revenue

Browse each section based on what you're looking for, or jump straight to a specific question.

## Part 1: Getting your game live on CrazyGames

Got questions about getting your game live on CrazyGames? Start with our Launching on CrazyGames (/) guide — it covers the full process from submission to Full Launch. This section handles the most common questions, with links to the full details where you need them.

1. Getting Started
#### What game engines and technology does CrazyGames support?

We support a wide range of engines, including Unity, Godot, Phaser, Construct, Pixi.js, BabylonJS, PlayCanvas, and GameMaker.

Your game doesn't need to be mobile-first, but it should work well across devices where possible. See our full list of game engines we support here (/resources/partners/).

#### Does CrazyGames have an SDK?

Yes, we provide you with an SDK for in-game advertisements, profile info, saving progress and much more. Check out the SDK pages for details (/sdk/intro/).

#### Do I need the CrazyGames SDK?

It depends on where you are in the launch process.

Basic Launch: The SDK is optional. You can go live without it, and monetization isn't available at this stage.

Full Launch: The SDK is required. It unlocks monetization and key platform features, and for most developers it's a one-time setup that adds:

- Ads and monetization
- Analytics
- Cloud saves
- Social features (e.g. multiplayer invites)

It's designed to be straightforward to integrate, with clear documentation and adapters for major engines. See the full integration requirements (/).

#### Can I publish my game if it's already live elsewhere or has been published before?

Yes. You can publish on CrazyGames even if your game is already live or has been previously published on mobile, Steam, or other platforms, as long as you hold the distribution rights.

Many developers use a multi-platform strategy to diversify revenue and reach new audiences. CrazyGames works as a complementary channel, not a conflicting one.

#### Do I still own my game?

Yes, 100%. You retain full ownership. (See our Terms & Conditions (https://files.crazygames.com/documents/developer_terms_20250818.pdf).)

#### Can I test my game before publishing?

Yes, we provide a preview environment via our Developer Portal (https://developer.crazygames.com/) to test how your game will look on CrazyGames. You can easily reach it via Submit a game and test different versions before actually submitting. Once your game passes the initial QA check, the game moves into Basic Launch. This is a soft launch where we test how your game performs with real players before giving it a wider rollout.

Learn more about Basic Launch and Full Launch here (/).

#### Do you accept submissions from all countries?

We welcome submissions from developers all around the world, there are no location restrictions. What matters most to us is the quality of your game, not where you're based.

#### How do you decide which games to launch on CrazyGames?

We welcome a wide variety of games on our platform. Our goal is to offer something for every player, and a place where every developer can find their audience. However, submissions must meet the standards our players expect when they play a game on CrazyGames. Our curation and launch process includes the following steps — for more details, check Launching on CrazyGames (/resources/basic-launch-metrics/).

Learn more about launching on CrazyGames. (/)

#### Can players access my game across different devices?

Yes. CrazyGames is a cross-platform platform, meaning players can enjoy your game on both desktop and mobile devices. Many games are played seamlessly in the browser, and with our mobile app, players can easily return to their favourite games on the go.

For developers, this means you can reach a broader audience. We recommend optimising your game for both desktop and mobile to make the most of that reach and deliver the best player experience.

2. Submitting & Publishing Your Game

To submit your game, you'll need:

- Your game build for the web
- SDK integration
- Game metadata (description, instructions, thumbnails)
- Design and video for the game cover and game trailer
#### Step A: Initial Quality Assurance (QA) check

Every game goes through an initial review by our QA team. We spend time playing each submission to check that it works smoothly, meets our quality standards, and is fun to play.

Sometimes, a game might not make it through this stage. This can happen for a few reasons, including (but not limited to):

- Bugs or broken mechanics
- Missing English-language support
- Unoriginal content (e.g. clones or asset flips)
- Inappropriate themes or content
- Not meeting our Developer Requirements, Terms & Conditions (https://files.crazygames.com/documents/developer_terms_20250818.pdf), or ethical standards
- Does not adhere to PEGI-12 guidelines
- Content is targeted for kids

Upon review, we of course make sure that we share constructive feedback to help you reach the needed standards. Check our Requirements (/requirements/intro) page for all details.

#### Step B: Basic Launch

Once your game passes the initial QA check, it moves into Basic Launch. This is a soft launch where we test how your game performs with real players before giving it a wider rollout.

At this stage, your game only needs to meet our Basic Requirements. It will be shown to a small segment of players, helping us understand how it performs in a live environment. Even if it doesn't meet all performance thresholds yet, you'll still get useful insights and engagement data to build on.

Why we do this

- Keep the initial QA process fast and efficient for you
- Gather real player data (retention, playtime, CTR, conversion to gameplay)
- Understand player behaviour at scale and spot issues early

Read more about our launch process on the Launching on CrazyGames (/resources/basic-launch-metrics/) guide.

#### Step C: Full Launch

Games that perform well during Basic Launch and are updated to meet our Full Requirements are reviewed once more by our QA team before moving to full launch.

From there, your game is ready to reach millions of players around the world — a big milestone and an exciting next step.

Check our Requirements (/requirements/intro) page for full details.

More FAQs about submitting your game to CrazyGames

#### How long does it take for an update to go live?

It's quick — updates are usually processed within the same working day. Once live, changes will be visible to players after the cache refreshes.

Game and art updates for games in Basic Launch go live instantly. Updates that violate the Terms and Conditions will result in the games being terminated immediately.

#### Why are ads disabled during Basic Launch?

During Basic Launch, ads are temporarily disabled for a few key reasons:

- To create the best possible player experience and reduce friction during early testing
- To ensure engagement metrics aren't influenced by ad interruptions
- To focus on understanding true player interest and retention

Once your game shows strong performance and passes Basic Launch, it becomes eligible for Full Launch. At that point, ads are enabled and your game can start benefiting from broader promotional exposure.

#### Will you iframe my game if it's hosted by another game portal?

We do not iframe games from competing browser game portals. We only iframe games hosted on independent domains, not from other browser game portals.

#### Will you iframe my game if it's hosted on my own domain?

Yes, we'll consider it a regular submission, but we strongly recommend hosting the game on CrazyGames so you can take full advantage of our optimizations. Keep in mind that games hosted on external domains (or submitted game files of such games) only generate revenue if our SDK is correctly integrated.

#### What are the required dimensions for my game?

Read about this on the gameplay requirements (/requirements/gameplay/) page.

#### Does CrazyGames support portrait and landscape games?

Yes, we support both portrait (vertical) and landscape (horizontal) games. Portrait games are welcome, especially if they're designed with mobile in mind. To ensure they also work well on desktop, you can display them with side padding (such as black bars or background images).

You're responsible for how your game is presented across different screen sizes, and there are several ways to set the right aspect ratio to make this work smoothly.

For full details, check our Requirements (/requirements/gameplay/) page.

#### Can I implement a chat function in my game?

Yes, however, make sure to monitor the chat and implement a profanity filter. Our SDK also offers a preference setting to disable chat. More technical info on the multiplayer requirements (/requirements/multiplayer/) page.

#### Do I need to add a CrazyGames logo to my game?

You don't need to, but it's much appreciated. However, we're currently updating our brand and logo, we'll share a new assets page link by September.

#### How do I know if my game has been accepted or not?

We'll let you know via email.

#### Can I submit a rejected game again?

Yes, you're welcome to resubmit your game. Before doing so, please make sure you've made meaningful improvements and that the game meets our requirements. We're always happy to take another look once those updates are in place.

3. Managing your Game Post-launch
#### Can I see the traffic my game is receiving?

Yes. You can track your game's performance through the dashboard (https://developer.crazygames.com/games) in your Developer Portal, where you'll find detailed stats and insights.

#### Do I receive player feedback?

Yes. When players leave a negative rating, they're prompted to share why. You can view all feedback in the Developer Portal, where you can also manage your email notification settings to avoid inbox overload.

#### Can I update my game? How?

Yes, you can update your game at any time through your developer account. Simply upload the updated files and submit them for approval.

#### How is the ranking of games calculated?

We use a range of game selection algorithms across the platform to surface the most relevant and engaging games for each user. Selection is based on factors like device, country, and operating system, with some placements also personalised based on a player's previous activity.

We also aim to maintain a fair and dynamic ecosystem. For example, new games may receive an initial boost to help them reach an audience.

Ultimately, rankings are driven by player engagement metrics such as play count, average playtime, retention, conversion, and player feedback.

4. Earn Money with Your Game
#### Will my game appear on the homepage of CrazyGames?

The new games carousel is on the homepage and it gets the game in front of millions of gamers every day. From there, visibility depends on ongoing performance, including metrics like playtime, retention, and conversion.

#### Will I earn money by publishing my game?

Yes, once your game meets our requirements, you can start earning through our monetization system.

To be eligible, your game needs to:

- Not include branding from another game portal
- Integrate the CrazyGames SDK
- Not contain external advertisements
- Be original and clearly distinguishable from existing games

For full details, see our Terms & Conditions (https://files.crazygames.com/documents/developer_terms_20250818.pdf).

#### Can I choose any ad provider for my game?

We handle monetization through the CrazyGames SDK, which is designed to make ad integration simple and effective.

This allows us to optimise performance and revenue across the platform, while giving you a seamless setup. The SDK is available for all major game engines and frameworks including Unity WebGL, HTML, and JavaScript games. See the full list here (/resources/partners/).

#### My game is published on Steam, Google Play Store, Apple App Store or Facebook, is it still eligible for revenue share?

Yes. Publishing your game on other platforms doesn't affect your eligibility for revenue share on CrazyGames. You can find more details in our Terms & Conditions (https://files.crazygames.com/documents/developer_terms_20250818.pdf).

#### How much will I earn?

Earnings vary depending on how your game performs. Key factors include player engagement, retention, and overall popularity, as well as advertiser demand.

The better your game performs with players, the more it can earn. For more details, see our Terms & Conditions (https://files.crazygames.com/documents/developer_terms_20250818.pdf).

#### How will I be paid?

Payments are made monthly once your balance reaches the €100 minimum threshold. If you don't reach this amount in a given month, your earnings roll over to the next.

We support payouts via wire transfer or PayPal. For more information, see our Terms & Conditions (https://files.crazygames.com/documents/developer_terms_20250818.pdf).

5. Technical Questions
#### Does CrazyGames provide a CDN?

All the game files you upload on Developer Portal are hosted by us, and they are distributed via a CDN. This means that they are cached around the world and load fast for the players. You don't need to worry about the caching, and don't need to implement a cache invalidation mechanism, as this is handled by us.

#### Can I use StreamingAssets/Addressables with Unity?

Yes and we recommend it as it decreases the initial download size! Check our optimization tips (/resources/optimization-tips/#addressables) about this topic. When uploading your Unity game that uses StreamingAssets/Addressables you don't need to do anything special: Just drag the Build and StreamingAssets folder in the upload area on our developer portal.

#### What browsers should be supported?

Your game should run well at least in Chrome and Edge. We also recommend you to ensure your game runs smoothly in other popular browsers, like Safari or Firefox.

#### My game works in the browser but shows a white screen in the CrazyGames iOS app

If your game is an iframe game that is sitelocked with a `Content-Security-Policy: frame-ancestors` header, its bare host entries (like `*.crazygames.com`) only allow ancestors served over `https`. Our iOS app is a native WebView whose origin is `capacitor://app.crazygames.com`, so the host matches but the scheme doesn't and the game is blocked without a JavaScript error.

Adding the origins of our apps to your policy solves it, read all about it in Sitelock in the CrazyGames App (/resources/html5/sitelock/#sitelock-in-the-crazygames-app).

#### Do you provide a server for multiplayer games?

No, we only host the game files. For multiplayer servers, you'll need your own solution, for example, Photon (/resources/partners/#photon-backend).

## Part 2: Web Games 101

New to web games or just looking to learn more? You're in the right place.

We've pulled together answers to some of the most common questions from developers on CrazyGames and beyond. Curious about monetization, audiences, or how web games perform? Dive into sections 1–5.

1. Monetization & Revenue
#### Can you earn significant revenue as a developer on CrazyGames?

Yes. CrazyGames reaches over 50 million monthly players, with a particularly strong audience in the United States and other Tier 1 markets. Developers monetize through advertising revenue share and optional in-game purchases. Because games are instantly playable without installation, strong titles can scale quickly if they demonstrate good retention, session length, and player engagement. Many developers publish on CrazyGames without paying for user acquisition, which significantly improves profit margins compared to mobile-first launches.

#### How much does user acquisition (UA) cost for web games?

User acquisition costs for web games are typically lower than mobile. On CrazyGames, developers launch directly to over 50 million monthly active users with zero user acquisition costs.

There is no need to pay for installs or compete in crowded app store auctions. Your game is exposed to a large, established audience from day one, reducing risk and significantly improving profit margins compared to mobile-first launches.

#### Is user acquisition more expensive for web games or mobile apps?

In many cases, user acquisition for mobile apps is more expensive due to app store competition and install friction. Web games benefit from instant play and lower barriers to entry, which can reduce acquisition costs.

#### Do web platforms and CrazyGames support in-game purchases (IAP)?

Yes. Modern web platforms, including CrazyGames, support in-game purchases (IAP) alongside advertising monetization.

On CrazyGames, developers can integrate optional purchases that enhance progression, unlock content, or provide cosmetic upgrades. These purchases are designed to work smoothly within the browser environment and must follow platform guidelines to ensure a safe and transparent user experience.

Web-based IAP differs slightly from mobile app store payments, as it does not rely on Apple App Store or Google Play billing systems. Instead, it is implemented directly through web-compatible payment solutions and the CrazyGames SDK. This allows developers to monetize engaged players beyond ads while maintaining instant, frictionless access.

When combined with player-friendly ad placements, in-game purchases can meaningfully increase revenue per user, particularly for games with strong retention and progression systems.

#### Is web gaming profitable for developers?

Yes, web gaming can be highly profitable for developers, especially on large platforms like CrazyGames, which reaches over 50 million monthly players with a strong concentration in Tier 1 markets such as the United States.

Compared to mobile, web games eliminate install friction and often reduce or completely remove the need for paid user acquisition. On CrazyGames, developers launch directly into an existing audience, which can significantly improve margins. On mobile, high UA costs and platform fees can make scaling expensive and risky.

Compared to Steam or PC platforms, web games benefit from instant accessibility. Players can start playing within seconds, without downloads, updates, or hardware requirements. This lowers the barrier to entry and enables faster validation, quicker iteration, and broader reach across devices.

When a web game demonstrates strong retention, session length, and engagement, it can scale quickly through organic discovery, making browser distribution a viable and sustainable revenue channel.

2. Audience & Platform Reach
#### What are the largest and most popular web gaming platforms?

CrazyGames serves over 50 million monthly players globally, with a strong concentration in the US, UK, and other English-speaking markets. The audience spans Gen Z through older demographics, making CrazyGames the largest web gaming platform with a broad, general audience rather than one focused primarily on children.

Players engage across a wide range of genres from competitive .io and action games popular with younger audiences to puzzle, simulation, and strategy titles that resonate strongly with older players. This cross-generational appeal allows developers to reach a more balanced and commercially diverse player base on a single platform.

#### Who is the audience on CrazyGames?

CrazyGames serves over 50 million monthly players globally, with a strong concentration in the US, UK, and other English-speaking markets. The audience spans Gen Z to older demographics. Genre preference varies by age — for example, teenagers often prefer competitive .io games, while older players gravitate toward puzzle games.

#### What sets CrazyGames apart from other web gaming platforms?

CrazyGames stands out for its scale, audience quality, and developer-first approach. The platform reaches over 50 million monthly active players, with a strong concentration in Tier 1 markets such as the United States, the United Kingdom, and Australia. Unlike platforms that primarily cater to children, CrazyGames serves a broad, cross-generational audience across multiple genres.

Games launch instantly with zero install friction and gain exposure to a large built-in audience without zero user acquisition. In addition, CrazyGames combines monetization tools, analytics, cloud saves, multiplayer features, and practical developer support in a single platform.

This combination of massive organic reach, high-value traffic, instant play, and hands-on support makes CrazyGames one of the leading platforms for serious web game developers.

#### Is it worth publishing my game on CrazyGames?

Publishing on CrazyGames gives developers instant access to millions of players with zero marketing costs. Instead of competing for installs in crowded app stores, your game launches directly into a built-in global audience. Combined with monetization tools, analytics, and developer support, this makes the platform attractive for teams that want fast validation and scalable reach.

3. Market & Industry Trends
#### How is the HTML5 (web gaming) market trending?

The HTML5 and web gaming market is seeing strong momentum. Advances in HTML5, WebGL, and WebGPU have significantly improved browser performance and visual fidelity, enabling more complex, content-rich games to run smoothly on the web. As cross-device play becomes standard and players increasingly value instant access without downloads, web gaming is now viewed as a serious and sustainable distribution channel.

As one of the largest web gaming platforms in the western market, CrazyGames is well positioned within this growth. With over 50 million monthly players and strong visibility in Tier 1 countries, it has become a leading destination for high-quality HTML5 games and a key platform for developers looking to tap into the expanding web gaming audience.

#### What are the advantages of building a web game instead of a mobile app?

Web games eliminate app store friction, allow instant updates, require no downloads, and can be shared via a simple link. Developers can iterate faster, test quickly, and reach players across desktop and mobile browsers. This flexibility makes the web an efficient channel for experimentation and growth.

4. Building and Publishing a Web Game
#### Where should I publish my HTML5 game?

The right publishing platform depends on your goals, but scale and audience quality matter. CrazyGames reaches over 50 million monthly active players, with its largest audiences in Tier 1 markets such as the United States, the United Kingdom, and Australia. The platform serves a broad global audience across multiple age demographics, and players engage with a wide variety of genres, from .io and action games to puzzles, simulations, strategy, casual titles and much more. CrazyGames has something for everyone.

Rather than requiring developers to generate their own traffic, CrazyGames brings a large, established, and diverse player base directly to your game. Compared to self-hosting, where you must build an audience yourself, or mobile app stores, where paid user acquisition is often necessary, publishing on CrazyGames allows developers to launch into an existing, high-value audience from day one. This enables fast validation, real engagement data, and monetization without heavy upfront marketing investment.

#### What services and benefits do developers get when publishing on CrazyGames?

Publishing on CrazyGames gives you access to:

- A built-in audience of 50M+ monthly players
- Integrated monetization (ads and optional IAP)
- Analytics to track performance and engagement
- Developer support and QA feedback
- Platform features like cloud saves and multiplayer tools

For selected games, we also help scale beyond the web. Read on for more information.

Developers who publish on CrazyGames gain immediate access to a built-in audience of over 50 million monthly active players, with a strong concentration in Tier 1 markets such as the United States, the United Kingdom, and Australia. This allows games to launch with instant exposure and zero user acquisition costs.

The platform provides integrated monetization through player-friendly ads and optional in-game purchases, along with a revenue share model and reliable payment infrastructure. Developers also get access to analytics dashboards with insights into plays, revenue, engagement, and geographic performance, enabling data-driven iteration.

In addition, CrazyGames offers developer support, QA feedback, soft-launch opportunities, and tools such as cloud saves, multiplayer invite links, and performance optimization features through the SDK. For selected titles, the publishing team can help scale successful games across additional platforms, including mobile stores.

Together, this combination of distribution, monetization, analytics, and hands-on support helps developers turn a browser game into a profitable business.

#### Can hobby developers submit games to CrazyGames?

Yes. CrazyGames works with a wide range of developers, from solo creators and hobbyists to indie teams and established studios. Team size is not the deciding factor. Quality, performance, and player experience are what matter most.

For hobby developers and solo creators in particular, web platforms are especially attractive. Publishing a browser game is significantly more accessible than launching on traditional app stores. On CrazyGames, you can upload your HTML5 build, integrate the SDK, and reach over 50 million monthly active players without spending anything on user acquisition.

This low barrier to entry makes the web, and CrazyGames specifically, a popular platform for developers who want to test ideas, build an audience, and turn passion projects into real revenue without needing a marketing budget or a large team.

#### Do I need to learn to code to make web games?

If you want to build high-quality, fully customized games, learning to code will make things much easier and give you far more control. Many popular web games on CrazyGames are built using frameworks and engines like Unity or Phaser, which rely on programming skills.

That said, coding isn't the only path. There are no-code and low-code tools like Construct and GDevelop that let you create games using visual interfaces and logic systems instead of traditional programming.

AI is also changing the landscape. Today, you can use AI tools to:

- Generate code snippets or even entire game mechanics
- Create art, sound effects, and music
- Prototype ideas quickly without deep technical knowledge
- Get real-time help debugging or improving your game

In practice, many developers now combine these approaches, using AI to speed things up, no-code tools to prototype, and coding to refine and scale their games.

#### Can I publish my game on CrazyGames if it's already live on other platforms?

Yes. You can publish your game on CrazyGames even if it is already live on other platforms, including mobile app stores or PC storefronts, as long as you hold the necessary distribution rights.

Many developers use a multi-platform strategy, releasing on the web alongside mobile or Steam to diversify revenue and reach different audiences. Publishing on CrazyGames allows you to tap into over 50 million monthly players without requiring additional user acquisition, making it a complementary channel rather than a conflicting one.

#### How do I publish a game on CrazyGames?

To publish a game on CrazyGames, developers submit their HTML5 build through the developer portal (https://developer.crazygames.com/), integrate the CrazyGames SDK, and provide required metadata such as descriptions, thumbnails, and instructions. The team reviews submissions to ensure quality, technical performance, and compliance before approval.

#### How easy is it to integrate the CrazyGames SDK, and is full integration required?

The CrazyGames SDK is designed to be simple to integrate, with clear documentation and adapters available for major HTML5 engines such as Unity and Godot. For most developers, integration is a one-time implementation that unlocks core platform features including advertising, analytics, cloud saves, and social tools like multiplayer invite links.

Basic integration is straightforward and can typically be completed quickly, especially when using a supported engine. The SDK also includes performance-focused features such as WebGL optimizations to help reduce build size and improve load times.

Core SDK integration is required to access monetization and key platform functionality. Games that fully integrate the SDK benefit from better analytics visibility, smoother ad implementation, and stronger alignment with platform features, which can positively impact performance and discoverability.

## Contact

Need help, have a question, or want to suggest a feature? Our Developer Support team is here for you (https://developer.crazygames.com/support).

Before reaching out about a technical issue, please:

- Check your browser console for any errors
- If the issue occurs in preview, include a link to your preview environment in your message

This helps us get to the root of the issue faster and support you more effectively.

=================== END PAGE: https://docs.crazygames.com/faq/ ===================


# Group 2 — Ad placement guides (read before placing any ad)


=================== BEGIN PAGE: https://docs.crazygames.com/resources/ad-monetization-guide/ ===================
SHA-256: 954b7f8bdc23710f3da42bf12725acadc9af205c5d8f47cef8b9278aa9fb4a37

# CrazyGames Monetization: The Guide to Maximizing Ad Revenue

Advertisement requirements

Check our Advertisement requirements (/requirements/ads) page for any restrictions.

This guide explains how to best use the three ad formats we support - Banners (../banner-ads-best-practices/), Midgame ads (../midgame-ads-pacing/), and Rewarded ads (../rewarded-ads-deep-dive/) - to meaningfully improve your revenue per 1000 plays.

## The ad formats and your strategy
- Revenue per 1000 plays: Your primary monetization metric. Optimizing when and where ads appear directly impacts this number.
- Player experience: The best monetization strategies feel natural. Forcing too many ads will hurt your retention and play time, which in turn reduces your revenue. It is a fine line to walk!
- Genre matters: The best monetization is specific to the game genre. Puzzle games need different placements to casual games, etc. Check out our dedicated genre guides:
- Hypercasual & IO Games (../monetizing-hypercasual-io/)
- Midcore, RPG & Idle Games (../monetizing-midcore-idle/)
- Puzzle Games (../monetizing-puzzle/)
- Action Games (../monetizing-action/)
- Clicker Games (../monetizing-clicker/)
- Word Games (../monetizing-word/)
- Driving Games (../monetizing-driving/)

Games with smart, balanced ad placements generate much higher revenue while keeping their players happy.

## Crucial Monetization Principles

Before choosing your ad mix, keep these key insights in mind:

- The best monetizing games focus on player experience, not ad volume. Worry less about how many ads to show, and more about making placements feel natural. Poor placement hurts retention and play time, which in turn reduces your revenue.
- Optimizing conversion is critical. Conversion (the percentage of players playing for at least one minute after starting the game) relates directly to the percentage of players that contribute to your impressions-per-play. Better conversion means you earn more without needing to chase more ad impressions.
- Average play time and impressions per play are linked. That means you need to design your game loop to retain players longer, and the monetization will naturally follow.
## 1. Rewarded ads

Info

For a deeper dive into economy balancing and placement psychology, read our guide on Mastering Rewarded Ads (../rewarded-ads-deep-dive/).

What they are: Ads that players voluntarily choose to watch to get an in-game reward (e.g., extra lives, premium currency, or exclusive skins).

Why they matter: Rewarded ads have the highest eCPM (revenue per ad) and go down better with players because they are opt-in and are tied to meaningful in-game benefits.

Pros:

- Highest revenue potential per impression.
- Positive impact on player retention and satisfaction.
- Completely opt-in, so they never interrupt gameplay unexpectedly.

Cons:

- Requires careful game design to balance the economy (rewards can't be too generous or too weak).
- Lower impression volume compared to midgame ads, as players must choose to watch them.

Restrictions

Placement, UI, and reward rules are in our Advertisement requirements (/requirements/ads#rewarded-ads).

### How to use them best
- Make rewards meaningful: Offer things players actually want, like a revive in a runner game or a rare weapon in a shooter.
- Placement is key: Put the offer where the player needs it most (e.g., a "Revive" button on the game over screen, limited to once per session to comply with platform frequency caps, or a "Double Coins" button at the end of a level).
- Genre tips:
- Action/Arcade: revives or temporary power-ups (see Action Games (../monetizing-action/)).
- Idle/Merge: time skips or offline earnings multipliers (see Clicker Games (../monetizing-clicker/)).
- RPG/Strategy: premium currency or gacha pulls (see Midcore, RPG & Idle Games (../monetizing-midcore-idle/)).
- Puzzle: hints or extra moves (see Puzzle Games (../monetizing-puzzle/)).
## 2. Midgame ads

Info

To learn how to protect your Day 1 Retention while maximizing impressions, read our guide on Optimizing Midgame Ads (../midgame-ads-pacing/).

What they are: Video ads that play automatically at natural breaks in your game, e.g. between levels or after a player dies.

Why they matter: They guarantee impressions and form the baseline of your ad revenue, especially for players who don't engage with rewarded ads.

Pros:

- High volume of impressions, leading to consistent revenue.
- Easy to integrate into most game loops.

Cons:

- Can frustrate players and hurt retention if shown at the wrong times or in the middle of active gameplay.
- Lower revenue per impression than rewarded ads.

Restrictions

When and how to show midgame ads are in our Advertisement requirements (/requirements/ads#video-ads).

### How to use them best
- Find the natural breaks: Show them when the player is already expecting a pause, like loading the next level, or after a "Level Complete" screen.
- Focus on placement, not volume: Request midgame ads at every natural break in your game loop: between levels, after a death, on a summary screen. The SDK handles ad pacing automatically (max 1 every 3 minutes) so you don't need to manage frequency yourself. The best monetizing games get this right by making ads feel like a natural part of the experience.
- Genre tips:
- Hypercasual/Puzzle: Show ads between levels, but make sure levels are long enough to justify the break (see Puzzle Games (../monetizing-puzzle/)).
- Shooter/IO/Action: Show ads on the death/respawn screen, but give the player a moment to breathe first (see Action Games (../monetizing-action/)).
## 3. Banners

Info

For tips on UI/UX design and avoiding accidental clicks, read our guide on Banner Ad Best Practices (../banner-ads-best-practices/).

What they are: Static or animated display ads that cover part of the screen.

Why they matter: They provide a slow but steady stream of revenue without interrupting the core gameplay loop.

Pros:

- Non-intrusive; players can continue interacting with the game while the ad is visible.
- Consistent, passive income. Banners serve as a reliable revenue stream, though few games currently use them.

Cons:

- Lowest revenue per impression of the three formats.
- Takes up valuable screen real estate, which can be tricky on smaller screens.
- Require changes to your UI, and extra development time to implement.

Restrictions

Placement and usage rules are in our Advertisement requirements (/requirements/ads#in-game-banner-ads).

### How to use them best
- Use menu screens: Place banners on main menus, shops, lobbies, and level-select screens - not during active gameplay.
- Keep UI clean: Ensure your game's buttons and joysticks are far away from the banner to prevent accidental clicks.
- Genre tips:
- Puzzle, Clicker & Word Games: Use banners on level-select screens, main menus, and shop screens.
- Simulation/Management: Great for persistent UI screens where players spend a lot of time reading or planning.
- Board/Card Games: Place banners on menu and lobby screens, not over the active board.
## Desktop vs. Mobile Web Strategy

CrazyGames players enjoy playing on both desktop and mobile. Your monetization strategy should adapt to this!

### Screen Real Estate and UI
- Desktop: You have a lot of screen space. Large banners can easily fit at the bottom or top of the screen without cluttering the UI or interfering with gameplay.
- Mobile: Screen space is at a premium. A standard banner might take up 10–15% of the screen on a mobile device in landscape mode, so you need to be careful with placement.
### Session Lengths and Pacing
- Desktop: Players typically have longer, more focused sessions. You can rely more heavily on deep economy rewarded ads and midgame ads at natural breaks.
- Mobile: Sessions are often shorter and more fragmented. You may need to introduce your first midgame ad slightly earlier or rely more heavily on quick "Watch to Revive" rewarded ads to capture value before the short session ends.
## Dealing with Ad Blockers

A significant amount of web game players use ad blockers. While we work to limit ad blocker usage across the platform, you need to make sure your game still works.

Info

For more information, refer to the Adblock detection SDK documentation (/sdk/video-ads/#adblock-detection).

## Key takeaways

If you make your monetization strategy a core part of your game's design instead of an afterthought, your game will earn more! The best games integrate ads so smoothly that they feel like a natural part of the experience.

To meaningfully improve your revenue per 1000 plays, focus on high-value Rewarded ads, use Midgame ads respectfully during natural breaks, and add Banners where space allows. Protect your player experience, and the revenue will follow.

=================== END PAGE: https://docs.crazygames.com/resources/ad-monetization-guide/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/rewarded-ads-deep-dive/ ===================
SHA-256: 634f94b46992bb08ed7c6575bcf7c1eb6bf6e3d277e74b5c0868d66f2a6afd20

# Mastering Rewarded Ads: A Deep Dive

Advertisement requirements

Check our Advertisement requirements (/requirements/ads) page for any restrictions.

Rewarded ads are a fantastic ad format, offering high revenue per ad and a great user experience because they are entirely opt-in. Since players choose to watch them, they feel they are making a fair trade of their time for in-game value.

However, integrating rewarded ads takes some planning. Poor implementation can hurt your game's economy or lead to fewer clicks.

## Value Exchange

Players are usually happy to watch a short ad if the reward feels worth their time. Think about what motivates your players:

### Urgency & Loss Aversion

This is a very strong motivator. If a player is about to lose something valuable (a high score, a rare item drop, or progress in a long level), they will often watch an ad to save it.

- Example: "Watch to Revive" immediately after falling (limited to once per session to stay within frequency guidelines).
- Example: "Keep your items" if they fail a level.
### Convenience & Time Saving

Players love to make progress quickly. If your game features timers or grinding, you can offer a helpful shortcut.

- Example: "Skip 1 hour of waiting time."
- Example: "Instantly complete this upgrade."
### Exclusivity & Status

You can offer rewards that can't be easily obtained through normal gameplay.

- Example: Exclusive skins that are only unlockable by watching a rewarded ads.
- Example: A "Premium Chest" that drops rare items, available once per day.
## What Makes a Great Placement?

Looking at the top-performing games on CrazyGames, successful rewarded ad placements are usually:

- Designed as a core gameplay feature: The best-earning games are designed with rewarded ads in mind from the start.
- Easy to find: Placement buttons are shown in lots of different places throughout the game loop, like main menus, level select screens, shops, and natural breaks.
- Impactful: The reward should feel worth it, like doubling end-of-level rewards or unlocking a helpful temporary booster.
- Visible in natural breaks: Showing the option during natural pauses (e.g. between levels or after a wave is cleared) means players are more open to watching.
- A lifeline during failure: Offering an ad as a lifeline when the player fails a challenge (e.g., "Respawn now" or "Keep your score") works incredibly well (remember to cap revives at once per session).
## Economy Balancing & Reward Scaling

If your rewards are too generous, players might lose interest in playing the game and just watch ads. If they are too weak, no one will click the button.

### Dynamic Reward Scaling

A static reward (like 100 coins) becomes less useful as the player progresses and item costs rise.

Tip

Tie the reward to the player's current progress. Try rewarding them with a percentage of the cost of their next upgrade, or an amount equal to a few minutes of play.

### Caps and Limits

It's a good idea to protect your economy so players don't burn through it by watching too many ads:

- Daily Caps: Limit how many times a player can watch an ad for premium currency (e.g., maximum 5 times per day).
- Diminishing Returns: The first ad gives 100 gems, the second gives 50, and the third gives 25. This encourages players to return daily.

Restrictions

Placement, UI, and reward rules are in our Advertisement requirements (/requirements/ads#rewarded-ads).

## Best Placements & UI Design

Make sure players know rewarded ads are available so they actually click them.

### High-Converting Placements:
- Game Over Screen: "Watch to Revive" or "Double your coins".
- The Store/Shop Menu: Place a "Free Daily Chest" at the top of the shop.
- Main Menu / Lobby: A "Daily Ad Reward" button that lights up when available.
- Out of Resources: When a player tries to buy an item but doesn't have enough coins, show a prompt: "You need 50 more coins. Watch a quick ad to get them?"
### UI Best Practices:
- Be clear about the reward: It should be clear what players get. Instead of "Watch Ad", try "Watch Ad for +50 Gems".
- Use video icons: Include a small video camera or play icon next to the reward icon so players know they'll see a video ad.
### Handling Players with Ad Blockers

A significant amount of web game players use ad blockers. While we work to limit ad blocker usage across the platform, you need to make sure your game still works.

Info

For more information, refer to the Adblock detection SDK documentation (/sdk/video-ads/#adblock-detection).

## Genre-Specific Trends

Ad strategies can vary quite a bit depending on your game's genre:

- Action Games (../monetizing-action/) & Clicker Games (../monetizing-clicker/): These genres often use rewarded ads frequently. Top action games show more rewarded ads than the platform average, even with shorter sessions.
- Word Games (../monetizing-word/): These games usually show fewer ads overall but monetize very well because players tend to stay and return. High retention means more players engage with rewarded opportunities.
- Puzzle Games (../monetizing-puzzle/): Puzzle games generally perform best overall. Slower gameplay is perfect for offering hints or undo moves that players are happy to watch an ad for.
## Optimizing Your Rewards

It's always a good idea to experiment and find what works best:

- Experiment with reward amounts: Try adjusting the rewards (e.g. offering 50 coins instead of 100). If players watch just as many ads for the smaller reward, keeping it smaller helps protect your game's economy.
- Try different placements: See where buttons perform best. Try placing a "Double Loot" button in different areas of the screen to see what players prefer.

=================== END PAGE: https://docs.crazygames.com/resources/rewarded-ads-deep-dive/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/midgame-ads-pacing/ ===================
SHA-256: 5cf3a91e0e892d9ec005fddb1da5a04cd9f24bf89f95599e02590f5d0731e082

# Optimizing Midgame Ads: Pacing and Placement

Advertisement requirements

Check our Advertisement requirements (/requirements/ads) page for any restrictions.

Midgame ads (interstitials) are a major source of ad revenue, often accounting for 40–60% of total earnings in casual games. However, placing them poorly is the fastest way to frustrate players and drive them away from your game.

## Finding Natural Breaks in Gameplay

Keep ads out of active gameplay. Midgame ads should only appear when the player naturally expects a pause or transition.

### Ideal Placement Opportunities:
- Between levels or rounds: This is the most common and accepted placement.
- After a boss fight or milestone: Players are already pausing to take a breath.
- Before claiming a large reward: Builds anticipation (though rewarded ads are often a better fit here).

Restrictions

More details about restrictions around when and how to show midgame ads can be found in our Advertisement requirements (/requirements/ads#video-ads).

## Pacing and Placement

The best monetizing games focus on player experience, not ad volume. Worry less about how many ads to show, and more about where and when they appear.

We enforce midgame ad frequency automatically (see our Advertisement requirements (/requirements/ads#video-ads)): at most one midgame ad every 3 minutes, with additional safeguards around game start and rewarded ads. This pacing is tuned for what works on CrazyGames. Request ads at every natural break in your game loop and let the SDK handle the rest. You do not need to implement your own cooldown timers to show fewer ads than the SDK allows.

### 1. Focus on Logical Breaks

Most players think in terms of game progression (like finishing a level or returning to a menu). Make sure your ad requests:

- Stick to natural transitions: Request ads when the player is resting (e.g., on a "Stage Clear" summary screen, not right as the next level is loading).
- Keep the flow: Avoid triggering ads while a user is actively navigating menus or starting a task.
### 2. Desktop vs. Mobile Placement
- Desktop: Players typically have longer, more focused sessions. Death screens, level transitions, and summary screens all work well.
- Mobile: Mobile sessions are often shorter and more fragmented. Death screens and level transitions are usually the most natural placement points.
## Protecting Day 1 Retention

The first few minutes of your game are critical. If players are shown ads before they understand the core loop, they may leave. It is usually better to wait until the player completes the tutorial or has played for at least 3-5 minutes before showing a midgame ad. You could also only show midgame ads after Level 3 or 4 - let players get hooked on the gameplay first!

## Analytics and Optimization

It is important to track the impact of your ad pacing. Keep an eye on these metrics:

- Ads per active user: Are players actually seeing the ads?
- Retention Drop-off: Does retention drop at the level where you show the first midgame ad?
- Session Length: Are players quitting immediately after an ad plays?

Tips for optimizing:

- Avoid showing the first ad too early. Try introducing midgame ads after Level 3 or 4 instead of Level 1.
- Delay midgame ads for the first few minutes of a player's first session to help them get into the game.
- If retention drops after introducing ads, revisit where you place them rather than reducing how often you request them.

=================== END PAGE: https://docs.crazygames.com/resources/midgame-ads-pacing/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/banner-ads-best-practices/ ===================
SHA-256: 1f56ab6d60dd8820146c421b8fd2a1bed570ea905f0f822860224f2f1543623f

# Banner Ad Best Practices: A Practical Developer Guide

Advertisement requirements

Check our Advertisement requirements (/requirements/ads) page for any restrictions.

Banner ads provide steady, passive income and are a great addition to your monetization strategy. While they don't offer the high revenue per ad of rewarded video, their consistent visibility makes them a reliable revenue stream. The best banner ad placements keep them visible without getting in the way of your game's UI or player experience.

## UI/UX Design & Layout Strategy

Placing banners carefully helps keep players engaged and prevents accidental clicks.

### 1. Reserve Dedicated Space Early

Design your UI with banners in mind, so they don't overlap with buttons or core game information.

- Responsive Design: You can make your UI canvas dynamically resize to accommodate the banner's dimensions.
- Background Contrast: Give the banner a solid, neutral background container so it doesn't clash with your game art.
### 2. Safe Zones & Placement

Keep banners flush against a screen edge (top, bottom, left, or right), not floating over gameplay or core UI.

- Top Placement: Often better for portrait games where thumbs rest at the bottom.
- Bottom Placement: Ideal for landscape games where critical UI elements (like health bars or scores) are usually at the top.
- Left / Right Placement: Works well on wide desktop menu screens with unused side margins. Reserve a fixed-width column (for example `160x600` or `300x250`) and keep the main UI centered so the ad does not overlap buttons or text. Avoid tall side banners on narrow mobile layouts where they would shrink the playable area too much.
### 3. Avoid Clutter

Keep a clear visual separation between the banner and your game's interactive elements. A margin of 10-15 pixels between the ad container and any clickable game UI works well.

### Actionable Tips:
- Keep Controls Away: Keep buttons, joysticks, and menus far away from the banner area.
- Hide During Gameplay: Hide banners when active gameplay starts, and show them again on menus or transition screens.
- Transition Buffers: Avoid showing banners immediately after a screen transition in the exact spot the player was just clicking.
## Maximizing Viewability & Revenue

Banners only generate revenue if they're on screen and active for at least 5 seconds.

### Persistent UI Screens

Use banners on screens where players spend a lot of time:

- Inventory management and crafting screens
- City building or base management views
- Matchmaking lobbies and leaderboards
- End-of-match summary screens
## Optimizing and Iterating on Your Banners

It's always a good idea to experiment with your placements. You can try:

- Top vs. bottom vs. left/right placement on menu screens
- Banner on main menu vs. level-complete screens only
- Banner sizes (e.g., standard banner vs. medium rectangle in menus)

Keep an eye on your Day 1 Retention and Session Length. If adding a banner hurts your retention, you may want to adjust its placement.

Restrictions

Refresh cooldowns, session limits, and clearing can be found in our Advertisement requirements (/requirements/ads#in-game-banner-ads).

=================== END PAGE: https://docs.crazygames.com/resources/banner-ads-best-practices/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/monetizing-hypercasual-io/ ===================
SHA-256: 903c80b5e364ef95e4d9ddc802e73aec2731c0a14ecb14153b091a4dfa8699f8

# Ad Tips For Hypercasual & IO Games

Advertisement requirements

Check our Advertisement requirements (/requirements/ads) page for any restrictions.

Hypercasual, arcade, and .io games are all about quick gameplay, simple mechanics, and keeping players coming back for one more round. According to our top games data:

- Hypercasual games average 8.6 minutes of play time and a Day 1 retention of 6%.
- .io games average 9 minutes of play time and a Day 1 retention of 5.7%.

Since these games don't usually have deep economies or in-app purchases, revenue is driven by keeping player sessions active. The key is to find the right balance of ads without breaking the fun flow of your game.

## Pacing Midgame Ads

Restrictions

Check the Advertisement requirements (/requirements/ads#video-ads) for an up-to-date list of CrazyGames requirements.

If a round of your game only lasts 30-45 seconds, request midgame ads at natural transitions: level-complete screens, death screens, or when the player taps "Next Level." The SDK handles ad pacing automatically (max 1 every 3 minutes), so focus on making those breaks feel natural rather than counting rounds between ads.

### The "Next Level" Flow

When a player completes a level, a summary screen is a natural transition point to request a midgame ad:

- Let them breathe first: Show the summary screen, update their score, and let them enjoy their win.
- Request on click: Request the ad when they click the "Next Level" button rather than loading it instantly. This keeps the player in control of their experience.
## Revives

Restrictions

Check the Advertisement requirements (/requirements/ads#rewarded-ads) for an up-to-date list of CrazyGames requirements.

A "Watch to Revive" rewarded ad is one of the best ways to monetize a hypercasual game. It offers players a lifeline exactly when they need it. However, to comply with platform frequency caps, you must limit this to once per session instead of offering it every time the player dies.

- Use a countdown: Put a 5-second countdown timer on the revive button. It adds a bit of excitement and helps players make a quick decision.
- Spawn them safely: Always give players 2–3 seconds of invincibility (with a blinking effect) when they spawn back in. If they die again immediately, they will get frustrated.
## Cosmetics & Upgrades

Even simple games can benefit from fun customization options:

- Ad-Gated Skins: Let players watch a rewarded ad to unlock special skins, trails, or hats.
- Mystery Boxes: Offer an ad to spin a reward wheel or open a chest for a random cosmetic item.
- Try before you buy: Let players try out a locked premium character for just one run by watching a rewarded ad.
## Menu Banners

Restrictions

Check the Advertisement requirements (/requirements/ads#in-game-banner-ads) for an up-to-date list of CrazyGames requirements.

Since hypercasual play sessions are quick, adding banners to menus is a great way to earn passive revenue. Here are some placement ideas:

- Main Menu / Lobby
- Shop Pages
- Level Select
## Learnings from other genres

Why not try something a bit different? Here are some "left-field" ideas inspired by other game genres. While these aren't proven practices for this genre yet, they might be just what your game needs to stand out:

- Idle & Clicker - Offline Progress: What if players could build a small passive resource (like gold generated by unlocked skins/characters) while they aren't playing? Even in a quick hypercasual game, this can give players a strong reason to log back in every day.
- Puzzle - Level Skips & Shields: If you have a particularly tricky obstacle course or boss level, try offering a rewarded ad that lets players skip it or grants a temporary shield/extra life. It keeps stuck players from getting frustrated and quitting.
- RPG - Quick Gacha Chests: You could let players watch a rewarded ad or spend in-game coins to open a mystery chest for a random cosmetic item (common, rare, legendary). This brings a bit of that classic RPG collection excitement to simple games!

=================== END PAGE: https://docs.crazygames.com/resources/monetizing-hypercasual-io/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/monetizing-midcore-idle/ ===================
SHA-256: 6910adf95d10a296ff46b240abfe5aa35c5785b2400949c9e5837d828356bd9f

# Ad Tips For Midcore, RPG & Idle Games

Advertisement requirements

Check our Advertisement requirements (/requirements/ads) page for any restrictions.

Midcore, RPG, strategy, and simulation games are quite different from quick hypercasual titles. They usually have deep economies, complex upgrade paths, and much longer play sessions. According to our top games data:

- Strategy games average 17 minutes of play time and a Day 1 retention of 7.5% (12% above the platform average of 6.7%).
- Adventure games average 17 minutes of play time and a Day 1 retention of 7.4%.
- Simulation games average 14 minutes of play time and a Day 1 retention of 7.4%.

These genres perform incredibly well with optional, rewarded ads. In fact, top strategy games average 21 ad impressions per play, with a massive 14 coming from rewarded ads. Adventure games average 9.8 impressions (with 4.5 rewarded), and simulation games average 7.9 impressions (with 3.3 rewarded). Monetization in these genres is all about helping players progress rather than interrupting their play.

This guide explores how to integrate monetization into deep economy games without breaking balance or frustrating your player base.

## Economy & Premium Currency

In deep games, players highly value their time and premium currency (like gems, crystals, or gold).

### Free Daily Gems
- Set daily caps: Offer small amounts of premium currency via rewarded ads, but set a limit (e.g., up to 5 times per day).
- Show the value of premium items: Letting free players earn small amounts of gems helps them see the value of premium shop items, which can encourage them to make a purchase later.
### Scaling Rewards

A reward of 100 gold is great at level 1 but useless at level 50. Make sure to scale your ad rewards based on the player's current level, upgrade costs, or average grinding speed so the rewards always feel worth their time.

## Loot Boxes & Energy Systems

Rewarded ads fit naturally into stamina and randomized reward loops.

### Daily Loot Boxes
- Let players watch an ad for a free pull in your gacha system or to open a chest.
- Limit views: Restrict this to once every few hours to keep the items rare and exciting.
### Energy Refills
- If your game uses an energy system, let players watch an ad to refill a portion of their energy bar.
- This helps keep your most active players in the game longer.
## Minimizing Midgame Ads

Restrictions

Check the Advertisement requirements (/requirements/ads#video-ads) for an up-to-date list of CrazyGames requirements.

For deep economy games, forced midgame ads should be used very sparingly, if at all.

Players in RPGs are deeply invested in their gameplay. Interrupting an inventory check or a boss run with a forced ad can be very frustrating.

- If you do use midgame ads, only show them during major transitions (like after completing a quest).
- It's usually best to rely on rewarded ads and menu banners instead.
## Keeping the Economy Balanced

With deep economies, you'll want to make sure ads don't throw off the game balance:

- Currency Inflation: Ensure players aren't getting so much currency from ads that the game becomes too easy.
- Store Balance: Make sure rewarded ads aren't so generous that players have no reason to purchase items from your store.
## Learnings from other genres

Why not try something a bit different? Here are some "left-field" ideas inspired by other game genres. While these aren't proven practices for this genre yet, they might be just what your game needs to stand out:

- Clicker - Offline Boosters: Clicker games are masters of the "welcome back" flow. Try offering players a rewarded ad to double or triple their accumulated offline earnings when they return. It's a huge motivator for players who have been away.
- Action & Driving - Pre-Level Trials: Let players watch an ad to temporarily test out a high-level hero, rare weapon, or powerful vehicle for a single dungeon run or raid. It's a great way to show them how awesome your late-game content is!
- Puzzle - Battle Undo: In a tough strategy or turn-based RPG, try offering a rewarded ad that lets players "undo" their last move or restart a battle if they make a critical mistake. It acts like a revive but fits strategy mechanics perfectly.

=================== END PAGE: https://docs.crazygames.com/resources/monetizing-midcore-idle/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/monetizing-puzzle/ ===================
SHA-256: 7401996def0a51091054d1fb9359190533729acf6a5e7052484710f892eef1d3

# Ad Tips For Puzzle Games

Advertisement requirements

Check our Advertisement requirements (/requirements/ads) page for any restrictions.

Puzzle games generally perform best on CrazyGames, representing the largest category in the top 100 games by total earnings. According to our top games data, puzzle games have a high average play time of 21 minutes (32% above the platform average) and a Day 1 retention of 6.2%.

This success is driven by a strong conversion rate of 68% and a balanced ad setup. Puzzle games average 8.9 total impressions per play, with about half coming from rewarded ads (4.2) and the other half from midgame ads (4).

This guide covers how to maximize your earnings while keeping players engaged with your puzzles.

## 1. Banner Ads

Restrictions

Check the Advertisement requirements (/requirements/ads#in-game-banner-ads) for an up-to-date list of CrazyGames requirements.

Use banners on menus and natural pauses where the player isn't actively solving a puzzle.

Tip

Banners are currently underutilized by developers, but they serve as a reliable, passive revenue stream. Level select screens, main menus, and level-complete summaries are ideal spots.

### Pacing Tips:
- Between Levels: Show a banner on the level-complete or level-select screen while players choose their next puzzle.
- Main Menu: Place a persistent banner on the home screen or level map.
- Size guidelines: Use a standard `320x50` banner on mobile or a `728x90` leaderboard on desktop.
- Leave a margin: Leave a 15–20 pixel gap between interactive buttons and the ad container to prevent accidental clicks.
## 2. Rewarded Ads

Rewarded ads should feel like a helpful mechanic rather than a paywall. Here are some of the highest-converting placements for puzzle games:

### Level Hints

If a player gets stuck on a puzzle, offer them a hint in exchange for watching an ad.

Tip

Make sure the hint button is easy to see on the gameplay HUD, and add a video camera icon to it.

- Add a cooldown: Implement a 1-minute cooldown after showing a hint to prevent players from watching ads back-to-back to solve the whole puzzle.
### Extra Moves & Undo

If your levels have move limits, offer players 5 extra moves or an undo option when they are one step away from losing. Since they are close to winning and want to protect their progress, players are very likely to watch an ad to keep going.

### Level Skips

Let players skip a particularly frustrating level by watching an ad.

- Protect progression: To make sure players don't skip the entire game, we recommend not granting coins or stars for skipped levels. This keeps skips reserved for when players are truly stuck.
### Daily Challenge Unlocks

Offer an exclusive Daily Puzzle that can be unlocked by watching a rewarded ad.

## 3. Midgame Ads

Puzzle games require deep focus. Interrupting players while they are actively solving a puzzle will frustrate them and cause them to leave.

Important

The best monetizing games focus on player experience, not ad volume. Request midgame ads at natural breaks. The SDK handles ad pacing automatically.

### Placement Tips:

Restrictions

Check the Advertisement requirements (/requirements/ads#video-ads) for an up-to-date list of CrazyGames requirements.

- Between Levels: Only trigger midgame ads between levels, never during active play.
- Short levels: If your levels are very short (e.g., 30 seconds), still request ads at level transitions. The SDK handles ad pacing automatically. Focus on making the transition feel natural rather than skipping ad requests.
## 4. Key Metrics to Track
- Hints per Session: Are players using your hint button? If not, make it more prominent or try offering the first hint of each level for free to help them build the habit.
- Level Churn Rate: Look at which levels have the highest drop-off rate. These levels are the perfect places to show a "Watch to Skip" or "Free Hint" option.
## Learnings from other genres

Why not try something a bit different? Here are some "left-field" ideas inspired by other game genres. While these aren't proven practices for this genre yet, they might be just what your game needs to stand out:

- RPG - Decorative Gacha Collections: Instead of just buying backgrounds, why not let players watch ads to spin a gacha wheel for rare puzzle themes, custom block skins, or unique background music?
- Clicker - Passive Coin Generation: Try letting players generate minor currency passively over time, even when they're not playing. You can offer a rewarded ad to speed up or multiply this passive income.
- Hypercasual - Try Before You Buy: If your puzzle game has complex power-ups or helper tools, let players watch a rewarded ad to test a premium power-up for just one level before they commit to buying it.

=================== END PAGE: https://docs.crazygames.com/resources/monetizing-puzzle/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/monetizing-action/ ===================
SHA-256: 71dd3c83466f25ee17d7a80c89bc7400b7f750c9336a51b125298c893e7966ed

# Ad Tips For Action Games

Advertisement requirements

Check our Advertisement requirements (/requirements/ads) page for any restrictions.

Action games are all about speed, focus, and keeping players hooked. According to our top games data, Action games have an average play time of around 13 minutes and a Day 1 retention of 8.1% (which is 21% above the platform average of 6.7%). Shooting games average 12 minutes and 6.5% retention.

## 1. High-Volume Rewarded Ads

Because action games can get intense, players are usually happy to watch a rewarded ad to save their progress, get a temporary power-up, or keep playing after they die.

### Revives

When a player dies, you can offer them a quick revive to continue from where they left off. Make sure to limit this to once per session instead of offering it every time they die to comply with platform frequency cap requirements.

- Add a countdown: A 5-second countdown timer on the revive button adds excitement and encourages players to jump back in.
- Give temporary invincibility: Always spawn the player with 2–3 seconds of invincibility (with a flashing effect). If they spawn right back into danger and die immediately, they will get frustrated.

Restrictions

Check the Advertisement requirements (/requirements/ads#rewarded-ads) for an up-to-date list of CrazyGames requirements.

### Pre-Round Trials

Before a level starts, let players try out a premium locked weapon or character for just one run in exchange for watching an ad. This lets players experience your cool endgame content early, keeping them playing longer and encouraging them to unlock those items for real.

### Loot Multipliers

At the end of a match or level, offer an ad to double or triple the currency or items they just earned. Since players have already put in the work to get the loot, they'll want to get the most out of it.

## 2. Midgame Ads

Action games are fast. Interrupting a player in the middle of combat will frustrate them and make them uninstall your game. Keep ads out of active gameplay.

Restrictions

Check the Advertisement requirements (/requirements/ads#video-ads) for an up-to-date list of CrazyGames requirements.

## 3. Banner Ads

Put banners in lobby screens, character setup menus, and shop pages where players spend time customizing or resting between matches.

Restrictions

Check the Advertisement requirements (/requirements/ads#in-game-banner-ads) for an up-to-date list of CrazyGames requirements.

## Learnings from other genres

Why not try something a bit different? Here are some "left-field" ideas inspired by other game genres. While these aren't proven practices for this genre yet, they might be just what your game needs to stand out:

- Idle & Clicker - Offline Material Gathering: Let players passively generate upgrading materials (like weapon parts or scrap) while offline, with a rewarded ad option to double their offline haul when they log back in.
- Puzzle - Boss Skips: If a boss fight or platforming level is too punishing, try offering a rewarded ad to skip it or grant a temporary health/shield buff.
- Driving & RPG - Garage Banners: Let players spend time customizing their weapons, gear, or outfits in a detailed menu. This is a perfect placement for menu banner ads that earn passive revenue while players aren't actively in combat.

=================== END PAGE: https://docs.crazygames.com/resources/monetizing-action/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/monetizing-clicker/ ===================
SHA-256: bde3f1f723bbd91b49d7be423ef8caacb2fdea024f674dba093f537342dfa9ab

# Ad Tips For Clicker & Incremental Games

Advertisement requirements

Check our Advertisement requirements (/requirements/ads) page for any restrictions.

Clicker, idle, and incremental games are all about numbers going up, automation, and long playing sessions. According to our top games data, clicker games have an average play time of 15 minutes and a Day 1 retention of 6.6%. They perform really well on CrazyGames, bringing in steady revenue through a mix of menu banners and rewarded ads.

On average, top clicker games get 5.5 ad impressions per play, with about half coming from rewarded ads and the other half from midgame ads.

## 1. Banner Ads

Restrictions

Check the Advertisement requirements (/requirements/ads#in-game-banner-ads) for an up-to-date list of CrazyGames requirements.

Clicker games usually have a lot of menus, like upgrade trees, shop pages, and stat panels. Since players spend a lot of time on these screens planning their next moves, they are the perfect place to put banner ads.

## 2. Rewarded Ads

Restrictions

Check the Advertisement requirements (/requirements/ads#rewarded-ads) for an up-to-date list of CrazyGames requirements.

Idle and clicker games are all about progression. Rewarded ads that boost currency or speed up time convert really well. Focus on these two placements:

### Welcome Back Multipliers

When players return after being away, show their offline earnings and offer to double or triple them for watching an ad. Players hate leaving progress on the table, so this is one of the highest-converting placements in idle games.

### Auto-Clicker Boost

Offer a temporary auto-clicker or tap multiplier (e.g., 2x click damage for 10 minutes) for watching an ad.

## 3. Midgame Ads

Restrictions

Check the Advertisement requirements (/requirements/ads#video-ads) for an up-to-date list of CrazyGames requirements.

Since clicker games don't usually have natural level breaks or death screens, you need to find natural pauses in the game loop, like opening a shop, reaching a milestone, or returning from an upgrade screen. Request midgame ads at these moments. The SDK handles ad pacing automatically. Never trigger an ad out of nowhere while a player is actively tapping the screen. Show a clear 3-to-5 second warning in the UI (e.g., "Ad starting in 3...") so they can stop clicking. This prevents accidental clicks and keeps players happy.

## Learnings from other genres

Why not try something a bit different? Here are some "left-field" ideas inspired by other game genres. While these aren't proven practices for this genre yet, they might be just what your game needs to stand out:

- RPG - Mystery Progression Chests: Give players the chance to watch a rewarded ad to open randomized chests containing powerful, temporary speed boosts or rare upgrade resources.
- Puzzle - Milestone Jumps: If your game has a prestige system or a section where progress slows down, try offering a rewarded ad to instantly finish the last leg of a milestone or jump ahead a few stages.
- Hypercasual - Rental Boosters: Let players watch an ad to rent a super-powerful automation upgrade or damage multiplier for a short duration (like 5 minutes). It gives them a taste of high-level progression and keeps them hooked.

=================== END PAGE: https://docs.crazygames.com/resources/monetizing-clicker/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/monetizing-word/ ===================
SHA-256: d296e55f89ae6cd23ded719af3d27dc930e3ff76a877c2c045e163a6cbe541e2

# Ad Tips For Word Games

Advertisement requirements

Check our Advertisement requirements (/requirements/ads) page for any restrictions.

Word games (like crosswords, anagrams, or word searches) have a unique monetization style. While average word games perform moderately, word games in the top 100 are among the top earners on the platform.

This is because the best-performing word games have excellent retention. According to our top games data, word games average 14 minutes of play time and a Day 1 retention of 7.6% (13% above the platform average).

Top-performing word games average 7.9 total impressions per play, with about 2.8 rewarded impressions and 4.8 midgame ads.

## 1. Banner Ads

Restrictions

Check the Advertisement requirements (/requirements/ads#in-game-banner-ads) for an up-to-date list of CrazyGames requirements.

Use banners on menus and between puzzles rather than during active gameplay.

Tip

Banners are a great way to earn steady revenue. Level-complete screens, main menus, and daily-challenge hubs are perfect placements.

## 2. Rewarded Ads

Word puzzle players often get stuck or experience mental fatigue. Rewarded ads that offer a helping hand have high conversion rates.

### Letter & Word Highlights

If a player is stuck on a crossword or word-connect puzzle, let them watch a rewarded ad to reveal a letter or highlight a word.

- Button design: Use a lightbulb or search icon next to a small video camera icon so it's easy to spot and understand.
### Daily Challenge Keys

If a player misses a past daily challenge or wants to play an extra one, offer an ad to unlock it. Players love keeping their daily streaks alive and are usually happy to watch a short ad to save progress.

### Multipliers on Bonus Words

If players find extra bonus words that aren't part of the main puzzle, offer an ad to double the bonus currency they receive.

## 3. Optimizing for Retention

Monetizing word games depends heavily on keeping players in your game. Word games have some of the highest conversion rates (players staying for at least 1 minute) at 71%.

If your conversion rate is lower, it's usually better to focus on optimizing the game experience before adding more ads. Try:

- Fast Loading: Make sure your dictionary files and assets load quickly.
- Friendly Onboarding: Keep the first few levels simple so players feel a sense of success right away.
## 4. Midgame Ads

Restrictions

Check the Advertisement requirements (/requirements/ads#video-ads) for an up-to-date list of CrazyGames requirements.

- Natural Breaks: Only request ads between puzzles. Never interrupt a player while they are typing or dragging letters.
## Learnings from other genres

Why not try something a bit different? Here are some "left-field" ideas inspired by other game genres. While these aren't proven practices for this genre yet, they might be just what your game needs to stand out:

- Idle & Clicker - Daily Return Multipliers: Word game players are highly loyal. Try offering a passive daily bonus when they return, with a rewarded ad option to double or triple it.
- RPG - Word Gardens & Pet Upgrades: You could add a simple meta-game (like building a word-garden or upgrading a cute pet) using points earned from word puzzles, where ads can be used to speed up growth.
- Action & Driving - Time Attack Extensions: For timed word modes, let players watch a rewarded ad to extend the timer by 15 seconds or freeze it temporarily to survive a close round.

=================== END PAGE: https://docs.crazygames.com/resources/monetizing-word/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/resources/monetizing-driving/ ===================
SHA-256: 8046d27d902304098e8a4f95481be615b37b3bd2f5690127b6f5e71b38f9632b

# Ad Tips For Driving Games

Advertisement requirements

Check our Advertisement requirements (/requirements/ads) page for any restrictions.

Driving games (like racing, drifting, or stunt simulators) can sometimes be tricky to monetize. According to our top games data, driving games average 8.7 minutes of play time and a Day 1 retention of 5.7%.

This is usually because players want continuous, high-speed action, and traditional midgame ads can break that flow and cause players to leave. Top games average 7 ad impressions per play, but they often over-rely on forced midgame ads and miss out on engaging players with rewarded ads.

To earn more while keeping players in the game, it's best to shift focus toward optional rewarded ads and smart menu placements.

## 1. Midgame Ads

Restrictions

Check the Advertisement requirements (/requirements/ads#video-ads) for an up-to-date list of CrazyGames requirements.

Forced midgame ads can be disruptive in a driving game if they interrupt the action. The best monetizing games focus on player experience, not ad volume. Request ads at natural breaks; the SDK handles ad pacing automatically. For some driving games, skipping forced midgame ads entirely and relying on rewarded ads may be the better fit.

### Placement Tips:
- No in-race ads: Never show an ad while a race is active.
- Between races: Request ads on post-race summary screens, after the player has had a moment to see their results.
## 2. Rewarded Ads

Since you'll want to keep forced ads to a minimum, rewarded ads are a great way to monetize. Try linking them to car upgrades and progression.

### Post-Race Multipliers

Offer players the option to watch an ad to double or triple the coins or XP they earned from a race. Upgrading engines, tires, or nitro is expensive, so players are usually happy to watch a short ad to speed up the grind.

### Fuel or Energy Refills

If your game uses a fuel or energy mechanic (e.g., each race costs 1 fuel unit), let players watch an ad to instantly refill their tank and keep racing without interruptions.

### Visual Customization

Let players unlock special spoiler wings, decals, or tire smoke colors by watching an ad.

### Test drives

Let players test drive a locked, premium hypercar for a single race in exchange for watching an ad. It's a great way to tease your late-game content!

## 3. Garage & Customization Banners

Restrictions

Check the Advertisement requirements (/requirements/ads#in-game-banner-ads) for an up-to-date list of CrazyGames requirements.

Players can spend a lot of time in the Garage customizing and tuning their cars, making it the perfect spot for banner ads. Since players are reading stats and customizing colors, this screen gets a lot of view time, bringing in steady passive revenue without interrupting the action.

## Learnings from other genres

Why not try something a bit different? Here are some "left-field" ideas inspired by other game genres. While these aren't proven practices for this genre yet, they might be just what your game needs to stand out:

- Idle & Clicker - Passive Garage Income: Let players' inactive cars generate passive offline income (like a racing team). They can watch a rewarded ad to double this idle income upon returning.
- Puzzle - Skip Difficult Challenges: If a particular drift challenge, time trial, or stunt level is blocking progress, try offering a rewarded ad to skip it to prevent players from closing the game.
- Hypercasual - Crash Revives: In long stunt runs or high-score modes, offer a quick revive or respawn option (capped at once per session to comply with frequency requirements) with a temporary shield and speed boost in exchange for watching an ad.

=================== END PAGE: https://docs.crazygames.com/resources/monetizing-driving/ ===================


# Group 3 — Features not used in our first games (reference only)


=================== BEGIN PAGE: https://docs.crazygames.com/requirements/multiplayer/ ===================
SHA-256: 5bc46b991b005090bac50d2ea734b403b142678d0ba932325116c3205f5ed163

# Multiplayer requirements

Games that offer an online multiplayer experience have 2x higher long term retention than single player games. We are strongly supporting multiplayer games on CrazyGames. Our Play with Friends functionality is designed to enhance the social experience of players, offering many benefits that foster community, engagement, and enjoyment.

## How it works
- Users must have a CG account and be logged in to use the Friends feature
- Users can send and receive friend requests
-

When a user is in a joinable location within a game, following functionalities are available:

-

Friends can join the user

[IMAGE: Friend list join /img/requirements/multiplayer/friend-list-join.png]

-

The user can invite their friends, who will get a notification if they’re online

[IMAGE: Friend list invite /img/requirements/multiplayer/friend-list-invite.png]

-

The Game module (/sdk/game/) in our SDK offers the functionality to support this this

- Games that support Friends functionality are featured on the dedicated Multiplayer landing page (https://www.crazygames.com/multiplayer)
## Requirements for Online with Friends

Full Implementation (/requirements/intro)

If your game includes an online multiplayer mode, the following requirements must be met to be eligible for our Multiplayer landing page (https://www.crazygames.com/multiplayer).

### Implement multiplayer flows

A smooth experience to bring and keep friends playing together is crucial for a succesful multiplayer game. Your game should implement these features:

- Sharing the user's room & status: Pass information on the user's room in your game through the CrazyGames SDK so we can activate our Join/Invite functionality. This will allow users to join easily via the CrazyGames UI. Avoid onboarding scenes for players joining like this, or make them skippable.
- (New) Use the Update Room (/sdk/game/#room-data) functionality to indicate in which `room` (unique within your game at any time) a user is playing, and whether or not the room is open for other players to join (`isJoinable`). Use the `inviteParams` to pass information from the inviting players to their friends. Note: for existing games, the Invite Button (/sdk/game/#invite-button) remains supported.
- If you also want to allow copying direct invite links within your game, integrate the Invite Link (/sdk/game/#invite-link) functionality.
-

Instant Multiplayer: The first player in a party should be placed directly into a new private room with default settings.

- When the IsInstantMultiplayer (/sdk/game/#instant-multiplayer) flag is set to `true` in the SDK, the game should launch directly into multiplayer mode when triggered from the CrazyGames UI. This happens for example on the Multiplayer landing page (https://www.crazygames.com/multiplayer).
- An intermediate configuration screen (e.g., game mode, player count) is acceptable.
- For games that support 20+ players, you may instead place the player directly into public gameplay.
- In all cases, the user should be joinable immediately after launching the game so their friends can join.
-

Round-based games: At the end of a match, players should be able to continue playing with the same group without having to navigate back through the CrazyGames UI. Either by starting the next match immediately in the same room, or by directing all users to the same new room.

Refer to the visual below which covers each of these cases:

[IMAGE: Multiplayer flows /img/requirements/multiplayer/multiplayer-flows.png]

### Additional multiplayer requirements
- Lobby Size: Submit lobby sizes when uploading your game build (For changes to existing games please contact our team).
- CrazyGames usernames: must be displayed in-game so players can recognize their friends. Read more on our User module (/sdk/user) page.
- If you want to implement chat functionality, check the specific requirement below.
## Guidelines for Online with Friends

Guideline

The following guidelines are strongly recommended for a good experience in playing with friends:

- Preferably players can join an existing room at all times, and while a round is on-going go in spectator mode. Alternatively your game should show a popup that the room is not available.
- Often users are already loading the game they want to play before joining/inviting each other. Implement our Room join listener (/sdk/game/#room-join-listener) to ensure a smoother UX without a page reload.
- Our User module (/sdk/user/#get-friends) offers a method to get the list of CrazyGames friends for the user. You can use this info within your game for various UX improvements (joining, notifying, matchmaking, ... )
## Multiplayer games in Basic Launch

Basic Implementation (/requirements/intro)

Multiplayer games that require a large audience to ensure a good gaming experience may skip Basic Launch and proceed to Full Launch immediately. In that scenario your game is required to comply to the Full Launch integration requirements.

For multiplayer games that have a single player component and that do not require a large testing audience, a Basic Launch step is required.

Our QA team will decide which flow applies for your multiplayer games, and optionally provide feedback to you.

## Chat and User Generated Content (UGC)

Basic Implementation (/requirements/intro)Full Implementation (/requirements/intro)

Chat is a powerful tool for engagement, but carries risks. If you decide to implement chat functionality:

- Your game should disable your chat based on the game settings (/sdk/game/#game-settings). In case of complaints, we will require you to disable chat alltogether.
- We require you to add chat moderation. The simplest solution is a profanity filter. Refer to this sheet (https://docs.google.com/spreadsheets/d/1w8HNWjNdPO_Bd_ob8XmIuABG08qdwJwn/edit?usp=sharing&ouid=106332710089515181497&rtpof=true&sd=true) for a non-comprehensive list of words to block.
- A more advanced solution is AI based moderation. We partner with Lasso Moderation and you are eligible for a referral bonus when integrating their solution. Read more on our Partners pages (/resources/partners#lasso-moderation). This is not recommended for Basic Launch games.

Moderation is also required if your game involves User Generated Content like uploading custom images or drawings. The Lasso solution can cover those content types as well.

=================== END PAGE: https://docs.crazygames.com/requirements/multiplayer/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/sdk/in-game-purchases/ ===================
SHA-256: 05e09235359863f3e104aac03bd68024e13a0603de9e875eb3172c92dc704024

# In-game purchases

Full Implementation (/requirements/intro)

We have partnered with Xsolla (/resources/partners/#xsolla-payments) to offer you the possibility to integrate in-game purchases more conveniently.

Warning

In-game purchases are an invite only feature. If you are interested in using them, please get in touch (/cdn-cgi/l/email-protection#b5d1d0c3d0d9dac5d0c798c7d0d9d4c1dcdadbc6f5d6c7d4cfccd2d4d8d0c69bd6dad8) with us.

In-game purchases should be available only for the users that are signed in. Guest users should not be able to purchase items.

You'll need to integrate the User module (../user) if your game has a back-end or the Data module (../data) to save user progress securely.

If your game uses Xsolla or another external payment flow, disable it in the CrazyGames App (/resources/crazygames-app/#detecting-the-app) when `applicationType` is `google_play_store` or `apple_store`.

## Getting started

When using the Xsolla SDK, and once you are invited to the CrazyGames Xsolla project dashboard, you will need one of the following ways of authentication:

- Standard linked to CrazyGames user accounts:
- Create your game on the developer portal (https://developer.crazygames.com/) and contact us so we can generate credentials for the token.
- The token received from the `GetXsollaUserToken()` method from the SDK. This method generates a custom Xsolla token that you use with the Xsolla SDK. The purchases are linked to the CrazyGames user account automatically (see Account integration requirements (/requirements/account-integration)).
- Custom linked to your in-game accounts:
- You can generate the necessary Xsolla credentials yourself within our Xsolla project dashboard, and use the Xsolla SDK with the generated credentials.
- We require orders to reference the CrazyGames `userId` (see User module (/sdk/user/#get-user-token) to get this). You can either use the CrazyGames userId as user identifier when registering an order, or pass `crazyGamesUserId` with the value of the CrazyGames user ID in the `custom_parameters`.
## Get Xsolla token

Set up required

This method requires some set up from our side, otherwise it will not work. If you are interested in using it, please get in touch (/cdn-cgi/l/email-protection#8de9e8fbe8e1e2fde8ffa0ffe8e1ecf9e4e2e3fecdeeffecf7f4eaece0e8fea3eee2e0) with us.

To use Xsolla via our own custom-generated token, you can retrieve the Xsolla token like this:

```
try {
    const token = await window.CrazyGames.SDK.user.getXsollaUserToken();
    console.log("Get Xsolla token result", token);
} catch (e) {
    console.log("Error:", e);
}
```

We recommend that you retrieve the token every time before using it, since the tokens are usually short-lived, for example only 1 hour. Our SDK handles the token refresh.

After retrieving the token, you can use it like this:

```
// obtain player's inventory example
// xsollaProjectId will be provided by us
const resp = await fetch(
    `https://store.xsolla.com/api/v2/project/${xsollaProjectId}/user/inventory/items`,
    {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
);
```

You don't need to handle any Xsolla login functionality, since Xsolla will automatically handle the user account creation with the user ID included in the token, which is the ID of the CrazyGames user. Thus, all the purchases made using the token will be also linked to the CrazyGames user account.

## Registering orders

For the typical use case, you will use the Shop Builder API Xsolla offers. Have a look at these links, and check our Requirements below.

- Get started selling virtual goods (https://developers.xsolla.com/virtual-goods/)
- Shop-builder API documentation (https://developers.xsolla.com/api/shop-builder/overview/#section/Overview)

Warning

If you are integrating Xsolla without using `GetXsollaUserToken()`, make sure to pass the CrazyGames `userId` in your orders, either as main user identifier or in the `custom_parameters`. Read more in Getting started.

## Testing

The `GetXsollaUserToken()` method will work only on CrazyGames.com. You can preview your game through the Developer Portal (https://developer.crazygames.com/games).

For the initial testing, we recommend testing with sandbox orders, which allow purchasing items with fake money. When you submit the game, please ensure the sandbox orders are disabled.

## Order tracking

Order tracking through our SDK is optional.

When using Xsolla, you will mostly deal with 3 order statuses:

- `new`
- `done`
- `canceled`

Every time an order has been successfully completed (`done`), call our analytics module:

```
// order must be a JSON object
window.CrazyGames.SDK.analytics.trackOrder("xsolla", order);
```

You can obtain the order for example from the Xsolla Order endpoint (https://developers.xsolla.com/api/igs-bb/operation/get-order/)

We also encourage you to track the new and canceled orders, as these may be useful in the future.

## Requirements & Guidelines
### Requirements
- Make sure to use the CrazyGames account ID to register purchases
- Ensure that there is a working 'close' button to be able to close the PayStation widget and players can resume their session properly
- If your PayStation opens in a new tab (desktop and/or mobile), ensure to notify players (via text only) on the in-game shop page that they should allow browser popups
- Ensure that any 'Back to the game' hyperlink after successful payment is hidden to avoid creating confusion for the players. You can do this by setting the 'Manual redirect condition' to None in the Settings under the PayStation menu in your Xsolla project dashboard
- Make sure your game correctly handles payment statuses to avoid charging players without crediting them. For example, when they close the window during payment processing. You should rely on one of these options:
- Use Webhooks (https://developers.xsolla.com/webhooks/overview/) to be notified on your API about the order status. Xsolla will call the webhook when various events occur, for example order_paid. If you don't have an API, you can use Webhooks API (https://developers.xsolla.com/solutions/payments/server-side-token-generation/set-up-order-tracking/?tabs=100-api#general_overview).
- The Inventory (https://xsolla.com/products/inventory) contains all the items purchased by the user. It’s the safest way to retrieve player purchases.
- You can also set up Client-side order tracking (https://developers.xsolla.com/solutions/payments/client-side-token-generation/set-up-order-tracking/). This is useful for continuously monitoring the order and instantly adding the item to the player when the purchase completes but needs to be validated through Webhooks or Inventory. Please avoid navigating away from the shop screen while the purchase wasn't attributed yet.
- If your game supports purchases on the web version and is mobile friendly, hide or disable those UI elements when the game is opened in the CrazyGames App (/resources/crazygames-app/#detecting-the-app) , so that players are not sent into an unsupported flow.
### Common mistakes

When integrating in-game purchases, take into account these common mistakes we've noticed:

- The integration is complex. You can check the embeddable widget (https://github.com/xsolla/paystation-embed) Xsolla provides for simpler integration.
- On mobile, the Back button is sometimes hidden. You can check this resource (https://developers.xsolla.com/api/igs/operation/create-order/#!path=settings/ui/mobile/header/close_button&t=request).
- Players can accidentally close the Xsolla window by clicking outside the overlay or pressing Esc. You can disable `closeByClick` and `closeByKeyboard`
- Additional HTML5 resource (https://developers.xsolla.com/doc/pay-station/how-to/how-to-open-payment-ui/#api_param_payment_ui_open_paystation_lightbox_closebyclick)
- For Unity: in Unity, under the path `Assets/Xsolla/Core/Plugins/`, there is a file called `paystation.jslib`. In this file, the following lines need to be added as options: `closeByClick: false` and `closeByKeyboard: false` [IMAGE: Unity Paystation settings /img/unity/xsolla-closebyclick.png]
### Lootbox and similar mechanics

Please note that we do not adhere to any specialized definitions for loot boxes or similar mechanics. Loot box - a mechanic where a player receives a random item/set of random items, usually in a sealed 'box' or 'container' that can be opened either for free or for in-game/real currency. From a restriction standpoint, our main concerns are cases of purchasing items with hidden random content when they:

- are bought for money
- are bought for virtual currency that can be purchased for money

Other cases that may lead to restrictions are considered on a case-by-case basis, but the ones mentioned above are the most common.

Among the 'other loot boxes' (loot box mechanics) are included "wheel of fortune", card pack, etc., i.e. mechanics that have similar elements - hidden content, randomness of item drops, and monetization (for example, purchasing attempts to spin the wheel).

If the game includes loot boxes/ loot box mechanics, the following territories are subject to sales restrictions:

- Belgium, China, Netherlands, Serbia, Slovakia
- Additionally Taiwan, South Korea, if for items obtained from loot boxes/ in similar mechanics, the probabilities of their acquisition in percentages are NOT disclosed; it is important to note that this refers specifically to individual items with the same value (`weight`), not to the category of items where the `weight` of items may differ
- Additionally Japan, if
- the user receives an item from the loot box with a value lower than the price paid for the loot box (i.e. the item must have a value equal to or greater than the price of the loot box)
- the project's Terms of Service (ToS) do not include prohibition on real money trading (RMT) and trading between players on secondary markets

=================== END PAGE: https://docs.crazygames.com/sdk/in-game-purchases/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/sdk/store/ ===================
SHA-256: b6c311efe99e552c18957a7d50c78b36fc77603655cb331342baecb9d7b30d90

# Store

Beta

The `store` module is currently in beta. This is an invite only feature. If you are interested in using it, please get in touch (/cdn-cgi/l/email-protection#cfabaab9aaa3a0bfaabde2bdaaa3aebba6a0a1bc8facbdaeb5b6a8aea2aabce1aca0a2) with us.

The `store` module offers a simplified way to sell in-game items. It can work alongside your existing Xsolla integration. Using the `buyItem` method is required in order to enable in-app purchases on the CrazyGames mobile app. The method is also supported on the web.

## Getting started

The module can be accessed like this:

```
window.CrazyGames.SDK.store;
```

## Listing the catalog

Call `listCatalogItems` to read the virtual items configured in your Xsolla project.

```
try {
    const page = await window.CrazyGames.SDK.store.listCatalogItems();
    console.log("Catalog items", page);
} catch (e) {
    console.log("Catalog error", e);
}
```

Prices are per user

Xsolla personalizes prices and promotions per user, so the prices you get for a signed in player can differ from the ones a signed out player sees. Always display the prices returned by `listCatalogItems` rather than cached or hard-coded ones, so that what you show matches what `buyItem` charges.

Pagination

The method accepts an optional `limit` and `offset`, and returns at most 50 items per call, which is Xsolla's own maximum.

- `limit` - how many items to return, a whole number between 1 and 50. Defaults to 50
- `offset` - how many items to skip, a whole number of 0 or more. Defaults to 0

```
const page = await window.CrazyGames.SDK.store.listCatalogItems({ limit: 10, offset: 10 });
```

Errors

The `listCatalogItems` method rejects with a `StoreError`, for example:

```
{
    "code": "catalogFetchFailed",
    "message": "Could not reach the Xsolla store API."
}
```

Possible error codes:

- `invalidArgument` - the `limit` or `offset` you passed is not a whole number in the allowed range
- `catalogFetchFailed` - the catalog could not be retrieved from Xsolla (for example a network issue, or an invalid response)
- `unexpectedError` - an unexpected error occurred
- `other`
## Buying an item

Call `buyItem` with the item ID configured in your Xsolla project. The method opens the Xsolla Pay Station widget and resolves once the purchase is completed. Only one purchase can be in progress at a time.

```
try {
    const result = await window.CrazyGames.SDK.store.buyItem("your_item_id");
    console.log("Purchase completed", result); // { itemId: "your_item_id" }
    // the item can now be found in the Xsolla inventory
} catch (e) {
    console.log("Purchase error", e);
}
```

Warning

A successful `buyItem` call means the payment flow completed, but you should always confirm ownership on your back-end (or via the Xsolla inventory API (../in-game-purchases/#example)) before granting valuable items. Never rely solely on the client-side result to unlock content.

Errors

The `buyItem` method rejects with a `StoreError`, for example:

```
{
    "code": "purchaseCancelled",
    "message": "The purchase was cancelled."
}
```

Possible error codes:

- `userNotAuthenticated` - the user must be signed in to make a purchase
- `purchaseInitFailed` - something went wrong while initiating the purchase with Xsolla
- `purchaseInProgress` - a purchase is already in progress, wait for it to finish before starting a new one
- `purchaseCancelled` - the user closed the payment widget without completing the purchase
- `unexpectedError` - an unexpected error occurred (for example a network issue, or the payment widget failed to load)
- `other`
## Sandbox mode

While developing, enable sandbox mode so purchases run against Xsolla's test environment, allowing you to buy items with fake money.

```
window.CrazyGames.SDK.store.setSandbox(true);
```

## Local Testing

When the SDK is in the `local` environment (on `127.0.0.1` or `localhost`), `buyItem` always simulates a successful purchase, `listCatalogItems` returns a fake catalog of three items (a regular one, a discounted one and a free one, honoring `limit` and `offset`), and `setSandbox` only logs the new value.

=================== END PAGE: https://docs.crazygames.com/sdk/store/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/sdk/leaderboards/ ===================
SHA-256: 1c525164e86c68787e0f5cab9060aee9ed4f2ac9640341954f73f17e9102eb78

# Leaderboards

Leaderboards allow players to compete globally, track their progress, and earn seasonal awards. Games with leaderboards enabled get additional visibility through a dedicated page in the sidebar, homepage carousels and widgets.

Warning

The leaderboard feature is only available for invited games.

Warning

Only one leaderboard per game is supported.

Key Features:

- Weekly Seasons: Seasons run Monday to Monday, ending at 9:00 AM UTC with automatic score reset
- Multi-Tiered Rankings: Players can view their rank globally, by country, and among friends
- Seasonal Awards: Trophies awarded for top positions (1st, 2nd, 3rd) and top percentiles (1%, 5%, 10%)
- Flexible Configuration: Choose score type (points, time, XP, KDA), sorting direction, and whether scores are incremental
- Platform Integration: Leaderboard widgets appear on game pages and user profiles
## Platform Visibility

The leaderboard system integrates seamlessly into the CrazyGames platform.

[TAB: Leaderboard Drawer]

[IMAGE: Leaderboard Drawer /img/leaderboards/lb_drawer.png]

[TAB: Game Page Widget]

[IMAGE: Leaderboard Widget /img/leaderboards/lb_widget.png]

[TAB: User Profile Awards]

[IMAGE: Leaderboard on Profile /img/leaderboards/lb_profile.png]

## Score Submission Approaches

There are two ways to submit scores to a CrazyGames leaderboard:

- Client-side via the SDK — scores are submitted directly from the game client. No backend required, but scores can be manipulated since the client is not a trusted environment.
- Server-side via the API — scores are submitted from your backend server. Recommended if you have a server, as validation happens server-side and cannot be bypassed by the client.

The configuration below reflects both approaches: the Encryption Key is used for client-side submissions, while the API Key is used for server-side submissions.

Choose the integration guide that matches your setup:

- Client-only games (../leaderboards-client/) — no backend server, submit scores directly from the game client using the SDK
- Games with a server (../leaderboard-api/) — submit scores from your backend using the Leaderboard API
## Leaderboard Configuration

These are the settings for the leaderboard in your game.

Warning

At least one between Encryption Key and API Key is required in your configuration. Encryption Key is used for submitting score via the SDK, while API Key is used for submitting scores via the API.

Required parameters:

- Leaderboard Guide: A short text shown to players explaining how to get ranked in the CrazyGames leaderboards. Max length: 50 characters
- Indicates which mode, level, or game type the leaderboard refers to
- Explains what players need to do to compete or achieve a higher score
- Examples:
- `"Endless Mode - Survive as long as possible"`
- `"Finish the race as fast as possible"`
- Encryption Key (optional): 32-byte base64-encoded string (chosen by game developers)
- Used for client-side score encryption
- Same key across all environments
- Can be generated automatically on the Developer portal via a button next to the input field for it
- Example: `"dGhpcyBpcyBhIDMyLWJ5dGUga2V5IGZvciB0ZXN0aW4="`
- API Key (optional): 32-byte base64-encoded string (chosen by game developers)
- Required only for server-side score submission via the Leaderboard API (../leaderboard-api/)
- Can be generated automatically on the Developer portal via a button next to the input field for it
- Example: `"dGhpcyBpcyBhIDMyLWJ5dGUga2V5IGZvciB0ZXN0aW4="`
- Metric Type: Defines what the score represents in the UI
- Options: `'XP' | 'KDA' | 'POINTS' | 'MINUTES'`
- Determines leaderboard labeling
- Incremental Scoring: Boolean indicating if scores accumulate over time
- `true` - For incremental games where scores continuously grow
- `false` - For games with distinct play sessions
- Score Sorting: How scores are ranked
- `"ASC"` - Lower scores are better (i.e. best time)
- `"DESC"` - Higher scores are better (i.e. points)
- Min Allowed Score: Minimum valid score value (float)
- Scores below this threshold are rejected
- Example: `0.0` for games where negative scores aren't possible
- Max Allowed Score: Maximum valid score value (float)
- Scores above this threshold are rejected
- Example: `999999.0` for reasonable score caps
- Cooldown interval: Minimum amount of seconds between submitting scores for a user (int)
- Scores submitted within threshold are rejected
- Only applies to client-side submissions via the SDK — not enforced for backend submissions via the Leaderboard API (../leaderboard-api/)
- Example: `10` for reasonable score pacing

Example:

```
{
    "encryptionKey": "dGhpcyBpcyBhIDMyLWJ5dGUga2V5IGZvciB0ZXN0aW4=",
    "apiKey": "sGrZXWMMtYZBoGHjD+YKJLg/9tlAso7R5iT3A2MOA24=",
    "scoreLabel": "POINTS",
    "scoreSorting": "DESC",
    "minValue": 0.0,
    "maxValue": 500000.0,
    "cooldownSeconds": 10,
    "isIncremental": false,
}
```

Note: The Leaderboard Guide is configured separately from the JSON above.

=================== END PAGE: https://docs.crazygames.com/sdk/leaderboards/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/sdk/leaderboards-client/ ===================
SHA-256: 25c92689ff9cd9611c1b932b26e8cca4475274704382accea1404efc0e252605

# Leaderboards SDK
## Score Reporting

Start by encrypting the score. This is crucial to make it harder for hackers to tamper with your leaderboard.

```
export async function encryptScore(score, encryptionKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const algorithm = { name: 'AES-GCM', iv: iv };

    const keyBytes = new Uint8Array(
    atob(encryptionKey)
    .split('')
    .map((c) => c.charCodeAt(0)),
    );

    const cryptoKey = await window.crypto.subtle.importKey('raw', keyBytes, algorithm, false, ['encrypt']);

    const dataBuffer = new TextEncoder().encode(score.toString());
    const encryptedBuffer = await window.crypto.subtle.encrypt(algorithm, cryptoKey, dataBuffer);

    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return btoa(String.fromCharCode(...combined));
}
```

Afterwards, submit the score. You need to pass both the encrypted and the plain score:

```
const encryptionKey = 'your-32-byte-base64-key-here';

// Encrypt the score
const finalScore = 152.1;
const encryptedScore = await encryptScore(finalScore, encryptionKey);

// Submit the score
CrazyGames.SDK.user.submitScore({
    encryptedScore: encryptedScore,
    score: finalScore,
});
```

## Testing

You can test your leaderboard integration in our preview tool on the Developer Portal (https://developer.crazygames.com/).

- When your game submits a score, you'll see a `submitScore` message in the logs and in browser console.
- To avoid hacking, the server response is always successful and validation is applied in our back-end.

[IMAGE: Leaderboard QA Tool /img/leaderboards/lb_qa_tool.png]

=================== END PAGE: https://docs.crazygames.com/sdk/leaderboards-client/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/sdk/leaderboard-api/ ===================
SHA-256: 7bf91a3a59f54c41280df40242765b14d3beca9e87528c1f388aae81a7d46342

# Leaderboards API
## Overview

The Leaderboard API allows game developers to submit player scores directly from their backend servers to CrazyGames leaderboards. This is designed for games that need to validate scores server-side before submitting them.

Key features:

- Authentication using API keys
- Batch score submissions (up to 100 scores per request)
- Higher rate limits compared to client-side submissions
- Partial success support (individual score failures don't block the entire batch)
- Detailed error responses with only failed scores returned, including the original score data
## Endpoint

```
POST https://leaderboard.crazygames.com/leaderboard/scores
```

## Authentication

Authentication is performed via an API key sent in the request header.

### Header
| Header	| Required	| Value |
| `X-API-Key`	| Yes	| The game's API key |
| `Content-Type`	| Yes	| `application/json` |

API Key Security

The API key is unique to the game and can be found in the Developer Portal (https://developer.crazygames.com/) under the Leaderboard tab of your game (only visible for games with leaderboards enabled). Keep this key secret.

### Authentication Errors
| Status Code	| Response	| Description |
| `401 Unauthorized`	| `{"error": "Unauthorized"}`	| Missing, invalid format, or unrecognized API key |
## Rate Limiting

The endpoint implements rate limiting to prevent abuse:

- Limit: 1000 requests per 60 seconds per API key
- Response: `429 Too Many Requests` when limit is exceeded
## Request Format
### Body Structure

The request body must be a JSON object containing a `scores` array. Maximum batch size is 100 scores per request.

```
{
  "scores": [
    {
      "userId": "string",
      "score": number,
      "timestamp": "ISO 8601 string (e.g., 2026-04-07T12:39:32.989Z)"
    }
  ]
}
```

### Score Object Fields
| Field	| Type	| Required	| Description |
| `userId`	| string	| Yes	| Unique identifier for the user (obtained by verifying and decoding the user token (../user/#get-user-token) on your backend) |
| `score`	| number	| Yes	| The score value (must be a finite number) |
| `timestamp`	| string	| Yes	| ISO 8601 timestamp of when the score was achieved. Must include date, time, and timezone (e.g., `2026-04-07T12:39:32.989Z`). Cannot be in the future. |
## Response Format
### Response Status Codes
| Status	| Condition |
| `200 OK`	| Scores were processed (check `errors` for individual failures) |
| `400 Bad Request`	| Request payload is invalid, or score format/timestamp validation failed |

```
{
  "success": boolean,
  "total": number,
  "successCount": number,
  "failureCount": number,
  "errors": [
    {
      "score": object,
      "type": "string"
    }
  ]
}
```

### Response Fields
| Field	| Type	| Description |
| `success`	| boolean	| `true` if all scores succeeded, `false` if any failures occurred |
| `total`	| number	| Total number of scores processed |
| `successCount`	| number	| Number of successfully submitted scores |
| `failureCount`	| number	| Number of failed score submissions |
| `errors`	| array	| Array containing only the failed scores with their error details |
### Error Object
| Field	| Type	| Description |
| `score`	| object	| The original score object that was submitted, exactly as received |
| `type`	| string	| The error type (see Error Types below) |
### Error Types
| Type	| Description |
| `no-active-season`	| No active leaderboard season for this game |
| `user-not-found`	| User ID does not exist in the system |
| `privacy-disabled`	| User has disabled leaderboards in their privacy settings |
| `validation`	| Score validation failed (score out of range, invalid timestamp, or invalid format) |
| `internal-server-error`	| Database or unknown internal error occurred |
### Error Responses
| Status Code	| Response Body	| Description |
| `400 Bad Request`	| `{"error": "Request body must contain a scores array"}`	| Missing scores field |
| `400 Bad Request`	| `{"error": "Scores must be an array"}`	| Scores field is not an array |
| `400 Bad Request`	| `{"error": "Scores must be a non-empty array"}`	| Empty scores array |
| `400 Bad Request`	| `{"error": "Batch size must not exceed 100 scores"}`	| Batch size exceeds maximum limit of 100 |
| `400 Bad Request`	| Standard response with `errors` array	| Some scores failed format/timestamp validation (entire batch rejected) |
| `401 Unauthorized`	| `{"error": "Unauthorized"}`	| Missing or invalid API key |
| `429 Too Many Requests`	| `{"error": "Too Many Requests"}`	| Rate limit exceeded. The `Retry-After` response header contains the number of seconds to wait before retrying |
| `500 Internal Server Error`	| `{"error": "Internal Server Error"}`	| Unexpected server error |
## Example Requests
### Batch Score Submission

[TAB: cURL]

```
curl -X POST https://leaderboard.crazygames.com/leaderboard/scores \
  -H "X-API-Key: api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "scores": [
      {
        "userId": "user123",
        "score": 1500,
        "timestamp": "2026-03-25T10:30:00.000Z"
      },
      {
        "userId": "user456",
        "score": 2000,
        "timestamp": "2026-03-25T10:31:00.000Z"
      },
      {
        "userId": "user789",
        "score": 1750,
        "timestamp": "2026-03-25T10:32:00.000Z"
      }
    ]
  }'
```

[TAB: JavaScript]

```
const axios = require('axios');

const response = await axios.post(
  'https://leaderboard.crazygames.com/leaderboard/scores',
  {
    scores: [
      { userId: 'user123', score: 1500, timestamp: '2026-03-25T10:30:00.000Z' },
      { userId: 'user456', score: 2000, timestamp: '2026-03-25T10:31:00.000Z' },
      { userId: 'user789', score: 1750, timestamp: '2026-03-25T10:32:00.000Z' },
    ]
  },
  {
    headers: {
      'X-API-Key': 'api-key-here',
      'Content-Type': 'application/json'
    }
  }
);
```

### Success Response Example (200 OK)

When all scores succeed:

```
{
  "success": true,
  "total": 3,
  "successCount": 3,
  "failureCount": 0,
  "errors": []
}
```

### Partial Success Response Example (200 OK)

When some scores fail to be processed (e.g. `user-not-found`) but others succeed:

```
{
  "success": false,
  "total": 3,
  "successCount": 2,
  "failureCount": 1,
  "errors": [
    {
      "score": {
        "userId": "user456",
        "score": 2000,
        "timestamp": "2026-03-25T10:31:00.000Z"
      },
      "type": "user-not-found"
    }
  ]
}
```

Validation errors abort the entire batch

If any score in the batch fails format or timestamp validation (invalid field types, missing fields, future timestamp), the entire batch is rejected, no scores are processed and `successCount` will be `0`.

In this case `failureCount` reflects the total number of scores submitted (the entire batch), while `errors` contains only the scores that failed validation (not the valid scores that were collaterally rejected). Fix the validation errors in `errors`, then re-submit the entire original batch.

Non-validation errors (`user-not-found`, `privacy-disabled`, `no-active-season`) are per-score and allow partial success.

### All Failures Response Example (200 OK)

When all scores fail due to per-score errors:

```
{
  "success": false,
  "total": 3,
  "successCount": 0,
  "failureCount": 3,
  "errors": [
    {
      "score": {
        "userId": "user123",
        "score": 1500,
        "timestamp": "2026-03-25T10:30:00.000Z"
      },
      "type": "no-active-season"
    },
    {
      "score": {
        "userId": "user456",
        "score": 2000,
        "timestamp": "2026-03-25T10:31:00.000Z"
      },
      "type": "user-not-found"
    },
    {
      "score": {
        "userId": "user789",
        "score": 1750,
        "timestamp": "2026-03-25T10:32:00.000Z"
      },
      "type": "privacy-disabled"
    }
  ]
}
```

## Best Practices
### 1. Batch Multiple Scores

For better performance, submit multiple scores in a single request when possible. Note that the maximum batch size is 100 scores per request.

```
const scores = [
  { userId: 'user123', score: 1500, timestamp: '2026-03-25T10:30:00.000Z' },
  { userId: 'user456', score: 2000, timestamp: '2026-03-25T10:31:00.000Z' },
  // ...
];

// If you have more than 100 scores, split them into chunks
const BATCH_SIZE = 100;
for (let i = 0; i < scores.length; i += BATCH_SIZE) {
  const batch = scores.slice(i, i + BATCH_SIZE);
  await submitScores({ scores: batch });
}
```

### 2. Handle Partial Failures

Always check the `errors` array in the response:

```
const response = await submitScores({ scores });

if (!response.success || response.errors.length > 0) {
  // some scores failed
  response.errors.forEach(error => {
    console.error(`Score submission failed:`, {
      userId: error.score.userId,
      score: error.score.score,
      errorType: error.type
    });
  });
}
```

### 3. Respect Rate Limits

Implement exponential backoff when receiving 429 responses:

```
async function submitWithRetry(scores, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await submitScores({ scores });
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const retryAfter = parseInt(error.response.headers['retry-after']) || 60;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else {
        throw error;
      }
    }
  }
}
```

### 4. Validate Scores Before Submission

Ensure scores meet the game's leaderboard configuration (min/max values) before submitting:

```
function isValidScore(score, minScore, maxScore) {
  return Number.isFinite(score) && score >= minScore && score <= maxScore;
}

const validScores = allScores.filter(s =>
  isValidScore(s.score, 0, 999999)
);
```

### 5. Use Accurate Timestamps

Always use the actual timestamp when the score was achieved and not when you're submitting it, as we use it to sort rankings:

```
// when score is achieved
const scoreData = {
  userId: user.id,
  score: finalScore,
  timestamp: new Date().toISOString()
};

// later, when submitting (timestamp remains unchanged)
await submitScores({ scores: [scoreData] });
```

## Complete Implementation Example

Here's a complete implementation example with error handling and best practices:

```
const axios = require('axios');

class CrazyGamesScoreAPI {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = options.baseURL || 'https://userportal.crazygames.com';
    this.maxRetries = options.maxRetries || 3;
    this.maxBatchSize = 100; // Maximum batch size enforced by the API
  }

  async submitScores(scores) {
    try {
      const response = await axios.post(
        `${this.baseURL}/leaderboard/scores`,
        { scores },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400 && error.response.data?.errors) {
          return error.response.data;
        }
        switch (error.response.status) {
          case 401:
            throw new Error('Invalid API key');
          case 429: {
            const retryAfter = parseInt(error.response.headers['retry-after']) || 60;
            const rateLimitError = new Error('Rate limit exceeded');
            rateLimitError.retryAfter = retryAfter;
            throw rateLimitError;
          }
          case 400:
            throw new Error(`Bad request: ${error.response.data.error}`);
          default:
            throw new Error(`API error: ${error.response.status}`);
        }
      }
      throw error;
    }
  }

  async submitScoresWithRetry(scores) {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await this.submitScores(scores);
      } catch (error) {
        if (error.message === 'Rate limit exceeded' && attempt < this.maxRetries - 1) {
          const delay = (error.retryAfter || 60) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

  async submitSingleScore(userId, score, timestamp = new Date().toISOString()) {
    return this.submitScores([{
      userId,
      score,
      timestamp
    }]);
  }

  async submitLargeBatch(scores) {
    const results = [];

    // Split into chunks of maxBatchSize
    for (let i = 0; i < scores.length; i += this.maxBatchSize) {
      const batch = scores.slice(i, i + this.maxBatchSize);
      const batchResult = await this.submitScoresWithRetry(batch);
      results.push(batchResult);
    }

    // Combine results
    return {
      success: results.every(r => r.success),
      total: results.reduce((sum, r) => sum + r.total, 0),
      successCount: results.reduce((sum, r) => sum + r.successCount, 0),
      failureCount: results.reduce((sum, r) => sum + r.failureCount, 0),
      errors: results.flatMap(r => r.errors)
    };
  }

  validateScore(score, minScore, maxScore) {
    return Number.isFinite(score) && score >= minScore && score <= maxScore;
  }
}

// usage
const api = new CrazyGamesScoreAPI('api-key');

// submit single score
try {
  const result = await api.submitSingleScore('user123', 1500);
  console.log('Score submitted:', result);
} catch (error) {
  console.error('Failed to submit score:', error.message);
}

// submit batch with retry
try {
  const batchResult = await api.submitScoresWithRetry([
    { userId: 'user1', score: 100, timestamp: new Date().toISOString() },
    { userId: 'user2', score: 200, timestamp: new Date().toISOString() },
    { userId: 'user3', score: 300, timestamp: new Date().toISOString() }
  ]);

  if (!batchResult.success) {
    console.warn(`${batchResult.failureCount} scores failed`);
    batchResult.errors.forEach(error => {
      console.error(`Failed: ${error.score.userId} - ${error.type}`);
    });
  }
} catch (error) {
  console.error('Failed to submit batch:', error.message);
}

// submit large batch (automatically splits into chunks of 100)
try {
  const largeScoreArray = [
    { userId: 'user1', score: 1500, timestamp: '2026-03-25T10:30:00.000Z' },
    { userId: 'user2', score: 2000, timestamp: '2026-03-25T10:31:00.000Z' },
    // ... 250 scores total
  ];

  const result = await api.submitLargeBatch(largeScoreArray);
  console.log(`Submitted ${result.total} scores: ${result.successCount} succeeded, ${result.failureCount} failed`);
} catch (error) {
  console.error('Failed to submit large batch:', error.message);
}
```

## Troubleshooting
### Getting 401 Unauthorized

Possible causes:

- Missing `X-API-Key` header
- Invalid API key format
- API key not associated with any game

Solution: Verify the API key is correct and properly set in the request header.

### Scores failing with validation errors

Possible causes:

- Scores have invalid field types or values
- Missing required fields (userId, score, timestamp)
- Invalid timestamp format

Solution: Check the `errors` array in the response to see exactly which scores failed and why. Each error object contains the original score data and the error type to help you identify and fix the issues.

### Scores failing with "user-not-found" error

Possible cause: The `userId` provided does not exist in the CrazyGames system

Solution: Ensure you're using the correct user ID obtained from the user token (../user/#get-user-token).

### Scores showing as failed with "validation" error

Possible causes:

- Score values exceed the minimum or maximum values configured for the leaderboard
- Invalid timestamp format

Solution: Check the leaderboard configuration in the developer portal and ensure scores fall within the allowed range. Verify that timestamps are valid.

### Getting 429 Too Many Requests

Possible cause: Exceeding rate limit of 1000 requests per 60 seconds

Solution: Implement batching to reduce request frequency and add retry logic with exponential backoff.

### Scores not appearing on leaderboard

Possible causes:

- No active season configured for the game (`no-active-season` error)
- User ID does not exist (`user-not-found` error)
- User has disabled leaderboards in their settings (`privacy-disabled` error)
- Score failed validation (`validation` error)
- Internal server error occurred (`internal-server-error`)

Solution: Check the response `errors` array for specific error details for each failed score submission.

### Getting 400 Bad Request - "Batch size must not exceed 100 scores"

Possible cause: Attempting to submit more than 100 scores in a single request

Solution: Split the scores into batches of 100 or fewer. Use the `submitLargeBatch` method from the implementation example above to automatically handle large batches by splitting them into chunks.

=================== END PAGE: https://docs.crazygames.com/sdk/leaderboard-api/ ===================


=================== BEGIN PAGE: https://docs.crazygames.com/sdk/user-linking/user-linking-html5-v3/ ===================
SHA-256: 0b1b500fd9926e6a6fa8a4b5254625def42a91a63fe9fecb83d2296d311a5f10

# User account linking

If you decide to keep alternative sign in providers (Google or Facebook for example) for users playing on CrazyGames, you will need to implement account linking between them and the CrazyGames user account.

Warning

This is an advanced integration scenario. Improper integration may delay the release of your game or can lead to it being rejected. We support the user flows described below. If you want to support additional functionality e.g. merging or migrating user accounts, we can not provide technical support.

These are the user flows we expect you to support in order to ensure a consistent experience for CrazyGames users.

### Preparation

Rather than using a CrazyGames account as an identifier, you will need to create and maintain a mapping in your back-end between CrazyGames accounts and in-game account identifiers. If you are using Firebase, please refer to this section.

### At game launch

Start by retrieving the current user. The game should request the current user account every time the game starts.

User is not logged in (getUser() returns `null`)

You should always allow the user to start playing as Guest.

Optionally, you can give the user the choice:

- 'Login with CrazyGames' button (triggering our Auth prompt method), or other login methods (Google, Facebook, etc.)
- Continue as Guest

Please note:

- Don't trigger the Auth prompt automatically as this might confuse the user
User is logged in on CrazyGames (getUser() returns a user)

Check if the CrazyGames account (via `getUserToken()`) is already linked to an in-game account in your back-end.

- Case: There is a game account linked to this CrazyGames account
- Fetch the data for this user from your back-end, and start playing!
- A Logged-in CrazyGames account should always take the highest priority over in-game accounts.
- Case: There is not yet a game account linked to this CrazyGames account
- Automatically create a game account that is linked to the player's CrazyGames account, based on the user token. This user will have fresh data in your back-end.
- Case: The user is logged in in-game but not yet linked with CrazyGames account
- Display a button "Link CrazyGames account" that will prompt the user to link the account or create a new account. See account link prompt
- We advise to link with "fresh" accounts only and avoid merging, or as an alternative, making users choose which data to keep.
- The result of this flow should always be that the CrazyGames account is linked to a (new or existing) in-game account.

The above cases are also illustrated in the diagram below. Please be sure you consult both the diagram and the cases, to have a complete implementation.

```
graph TB
GAME[Game starts] --> CHECKUSER{Get CG\nUser};
CHECKUSER -->|Logged out| SHOWAUTHPROMPT{Show CG auth\nprompt};
CHECKUSER -->|Logged in| USERLOGGEDIN{User is logged\nin CrazyGames};
USERLOGGEDIN --> |User logged in game,\n game acc linked to CG| STARTPLAYING[Start playing]
USERLOGGEDIN --> |User logged in game,\n not linked to CG| PROMPTLINK[Ask user to\nlink account]
PROMPTLINK --> STARTPLAYING
USERLOGGEDIN --> |User not logged in game,\n but has game acc linked to CG| LOADGAMEACC[Log into game account]
LOADGAMEACC --> STARTPLAYING
USERLOGGEDIN --> |User not registered in game| CREATEGAMEACC[Create game acc\n or redirect to log in page]
CREATEGAMEACC --> STARTPLAYING
SHOWAUTHPROMPT --> |User canceled| PLAYASGUEST[Play as guest\nif game allows];
SHOWAUTHPROMPT --> |User logs in| USERLOGGEDIN;
```

### Game login page

If you allow the user to log out during the game, or start the game as guest

- You should add a CrazyGames Login button in your login screen, which triggers the same flow as described above in "At game launch".
- If a user logs in with a different login type (e.g. Google or username/password), you should trigger an Account link prompt after login.

The user module can be accessed like this:

```
window.CrazyGames.SDK.user;
```

## Check availability

Basic Implementation (/requirements/intro) Full Implementation (/requirements/intro)

The user account functionality is not available on other domains that embed your CrazyGames game. Before using any user account features, you should always ensure that the user account system is available.

```
const available = window.CrazyGames.SDK.user.isUserAccountAvailable;
console.log("User account system available", available);
```

## Get current user

Basic Implementation (/requirements/intro) Full Implementation (/requirements/intro)

You can retrieve the user currently logged in CrazyGames with the following method:

```
const user = await window.CrazyGames.SDK.user.getUser();
console.log("Get user result", user);
```

If the user is not logged in CrazyGames, the returned user will be `null`

The returned user object will look like this:

```
{
    "username": "SingingCheese.TLNU",
    "profilePictureUrl": "https://images.crazygames.com/userportal/avatars/4.png"
}
```

## System info

Basic Implementation (/requirements/intro) Full Implementation (/requirements/intro)

System info can be retrieved like this:

```
const systemInfo = window.CrazyGames.SDK.user.systemInfo;
console.log("System info", systemInfo);
```

The response will look like this:

```
{
    "countryCode": "US",
    "device": {
        "type": "desktop" // possible values: "desktop", "tablet", "mobile"
    },
    "os": {
        "name": "Windows",
        "version": "10"
    },
    "browser": {
        "name": "Chrome",
        "version": "107.0.0.0"
    },
    "applicationType": "web" // possible values: "google_play_store", "apple_store", "pwa", "web"
}
```

For `browser` and `os`, the format is the same as ua-parser-js (https://github.com/faisalman/ua-parser-js).

## Auth prompt

Basic Implementation (/requirements/intro) Full Implementation (/requirements/intro)

By calling this method, the log in or register popup will be displayed on CrazyGames. The user can log in their existing account, or create a new account. The method returns the user object.

```
try {
    const user = await window.CrazyGames.SDK.user.showAuthPrompt();
    console.log("Auth prompt result", user);
} catch (e) {
    console.log("Error:", e);
}
```

The following errors can be returned:

- `showAuthPromptInProgress` - an auth prompt is already opened on the website
- `userAlreadySignedIn` - the user is already logged in
- `userCancelled` - the user closed the auth prompt without logging in or registering
## Get user token

Basic Implementation (/requirements/intro) Full Implementation (/requirements/intro)

The user token contains the `userId` of the player that is currently logged in CrazyGames, as well as other useful information (`username`, `profilePictureUrl`, etc). You should send it to your server when required, and verify/decode it there to extract the `userId`. This is useful for linking the user accounts for example, where you can have a column "crazyGamesId" in your user table that will be populated with the user id from the token.

You can retrieve the user token with the following method:

```
try {
    const token = await window.CrazyGames.SDK.user.getUserToken();
    console.log("Get token result", token);
} catch (e) {
    console.log("Error:", e);
}
```

The token has a lifetime of 1 hour. The method will handle the token refresh. We recommend that you don't store the token, and always call this method when the token is required.

The following error codes can be returned:

- `userNotAuthenticated` - the user is not logged in CrazyGames
- `unexpectedError`

The returned token can be decoded for testing purposes on jwt.io (https://jwt.io).

The token payload will contain the following data:

```
{
    "userId": "UOuZBKgjwpY9k4TSBB2NPugbsHD3",
    "gameId": "20267",
    "username": "RustyCake.ZU9H",
    "profilePictureUrl": "https://images.crazygames.com/userportal/avatars/16.png",
    "iat": 1670328680,
    "exp": 1670332280
}
```

Do not decrypt tokens on the client

Make sure not to decrypt the user token on client-side as this is insecure. The typical info you need on the front-end (username, avatar) can easily be obtained by using the `getUser` method.

When you need to authenticate the requests with your server, you should send the token together with the requests.

The token can be verified with the public key hosted at this URL https://sdk.crazygames.com/publicKey.json (https://sdk.crazygames.com/publicKey.json). We recommend that you fetch the key every time you verify the token, since it may change. Alternatively, you can implement a caching mechanism, and re-fetch it when the token fails to decode due to a possible key change.

Here is a TypeScript example that will help you decode and verify the token:

```
import * as jwt from "jsonwebtoken";
import axios from "axios";

export interface CrazyTokenPayload {
    userId: string;
    gameId: string;
    username: string;
    profilePictureUrl: string;
}

export const DecodeCGToken = async (
    token: string
): Promise<CrazyTokenPayload> => {
    let key = "";

    try {
        const resp = await axios.get(
            "https://sdk.crazygames.com/publicKey.json"
        );
        key = resp.data["publicKey"];
    } catch (e) {
        console.error("Failed to fetch CrazyGames public key", e);
    }

    if (!key) {
        throw new Error("Key is empty when decoding CrazyGames token");
    }

    const payload = jwt.verify(token, key, { algorithms: ["RS256"] });
    return payload as CrazyTokenPayload;
};
```

## Auth listener

Guideline

You can register user auth listeners that are triggered when the player logs in CrazyGames. A log out doesn't trigger the auth listeners, since the entire page is refreshed when the player logs out.

```
const listener = (user) => console.log("User changed", user);

// add listener
window.CrazyGames.SDK.user.addAuthListener(listener);

// remove listener
window.CrazyGames.SDK.user.removeAuthListener(listener);
```

After detecting a login using the Auth Listener, if you use the CrazyGames account as an identifier you should fetch the user's progress from your back-end.

If you rely on the data module (/sdk/data#html5) or automatic progress save (/other/aps/), our system automatically reloads the game in case of a login.

## Account link prompt

Guideline

If you'd like to keep other sign in providers (Google or Facebook for example), you'll need to handle account linking between the CrazyGames account and the other providers. Check User linking (/sdk/user-linking) page to find out more about user account linking.

For requesting the user's permission to link their CrazyGames account to the in-game account, please use the provided account link modal and avoid implementing it yourself. This provides the players with a standard modal, and also allows them to select the "Always link accounts" option (coming soon).

[IMAGE: Account link modal /img/html5/link-account-modal.png]

You can display the modal by calling the following method:

```
try {
    const response = await window.CrazyGames.SDK.user.showAccountLinkPrompt();
    console.log("Link account response", response);
} catch (e) {
    console.log("Error:", e);
}
```

The response object will be either `{ "response": "yes" }` or `{ "response": "no" }`

The following error codes can be returned:

- `showAccountLinkPromptInProgress` - the link account modal is already displayed
- `userNotAuthenticated` - the user is not logged in CrazyGames
## Testing

Basic Implementation (/requirements/intro) Full Implementation (/requirements/intro)

### Local

When the SDK is in the `local` environment (on `127.0.0.1` or `localhost`) it will return some hardcoded default values for the method calls in the user module.

You can customize the returned local values by appending these query parameters:

- `?user_account_available=false` will change the response from the `isUserAccountAvailable` method to `false` (it returns `true` by default).
- `?show_auth_prompt_response=` will change the response from the `showAuthPrompt` method. It accepts the following values: `user1`, `user2`, `user_cancelled`
- `?link_account_response=` will change the response from the `showAccountLinkPrompt` method. It accepts the following values: `yes`, `no`, `logged_out`
- `?user_response=` will change the response from the `getUser` method. It accepts the following values: `user1`, `user2`, `logged_out`
- `?token_response=` will change the response from the `getUserToken` method. It accepts the following values: `user1`, `user2`, `expired_token` (to return an expired token), `logged_out`

By default, `getUser` returns `user1`, `getUserToken` returns token for `user1`, `showAccountLinkPrompt` returns `yes`, `showAuthPrompt` returns `user1`, and `isUserAccountAvailable` returns `true`.

## Implementation suggestion

Full Implementation (/requirements/intro)

### Custom database

This suggestion applies if you store the user data on your backend, either in an SQL or document database.

In your database, you will most likely have a table or a document storing this user data:

- userId
- username
- ...

You will want to store one more user column:

- crazyGamesId

Implementation logic

When the user starts playing your game, if they are signed in CrazyGames, obtain the user token from the SDK and send it to your server. There you extract the user ID from the token and create a new user entry in your database, where `crazyGamesId` will be populated with the ID from the token.

If the user already has an account in your game, you can consider populating the `crazyGamesId` field of the existing user to automatically link the accounts.

Every time you need to authenticate the user on your backend, for example at the beginning of the game, you should send the CrazyGames user token to your backend, so you retrieve the correct user from your database by the `crazyGamesId`.

Additional suggestions:

- Sign out the user from your game if you notice that the user signed out of CrazyGames (getUser returns null).
- When a new user arrives to your game, send the CrazyGames user token to your backend to check if they already have an account, and if so, sign them in automatically.
### Firebase

If you are using Firebase, account linking shouldn't be done client side. This is a security risk since anyone can inject any user id in the SDK. To implement account linking correctly with Firebase, you should use Cloud Functions with Firestore or Real Time Database. Integration suggestion:

- send the token obtained from the CrazyGames SDK to a cloud function
- the cloud function should parse and verify the token, and then create a new document in the database linking the CrazyGames user id obtained from the token to your user id
- the cloud function creates a custom Firebase token (https://firebase.google.com/docs/auth/admin/create-custom-tokens) and returns it back, and you use it to authenticate in Firebase
- for future requests, the cloud function will check if there is any document linking the CrazyGames user id to your user id, and return the custom firebase token

=================== END PAGE: https://docs.crazygames.com/sdk/user-linking/user-linking-html5-v3/ ===================

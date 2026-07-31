# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Raining Jewels ships on both Android and iOS as one product that adapts its design
language per OS: Material expectations on Android, HIG expectations on iOS.
Android is the platform in production today (Google Play listing
`com.covaga.jewelrain`); iOS is configured in `app.json` (bundle identifier
`com.covaga.jewelrain`, `UIBackgroundModes: [audio]`) but its release status is
not recorded here.

`supportsTablet` was set to **false** on 2026-07-30. The app is portrait-locked
and has no tablet layout; claiming iPad support would have shipped a stretched
phone layout. Revisit only alongside a real tablet composition.

**Adaptive is currently a claim, not a property of the build.** There is not a
single `Platform.select` or `Platform.OS` in `src/`. Material and HIG receive
byte-identical treatment today.

## Users

A person who has deliberately set aside a short block of time to relax or
meditate while **awake and attentive** — not someone already falling asleep.
They open the app on purpose, choose a sound, and stay present with it.

This is the confirmed primary job. Sleeping and focus/study are accepted
derived uses, but design decisions are not optimized for them.

## Product Purpose

Play one looping ambient sound, well, with nothing in the way.

The user picks a sound, it loops seamlessly, and the interface gets out of the
way for the length of the session. Success is a session that starts in one tap
and is never interrupted — no buffering, no account wall, no advertisement, no
upsell, no notification.

## Positioning

Four claims a neighboring product could not truthfully copy:

- **Free, libre, and account-free.** GPL-3.0, source publicly available, no
  registration, no subscription, no paywall.
- **Fully offline.** All 31 sounds are bundled in the app binary. Works on a
  plane, with no signal, with no buffering — never a network request to play.
- **No advertising and no dark patterns.** Nothing is sold, tracked, upsold,
  or nagged, least of all at the moment the user is trying to settle.
- **Radical simplicity.** One sound at a time. No mixer, no layering, no
  playlists, no streaks, no gamification — deliberately the opposite of the
  category trend.

These four are the product. Design work that erodes any of them is a
regression, not a tradeoff.

## Operating Context

- A deliberate, self-contained session: open app → pick sound → play → let it
  run. Sessions are short and intentional rather than all-night.
- The screen dims automatically after 2 minutes of playback, so the interface
  must remain legible and operable at reduced brightness, and any control the
  user reaches for mid-session must survive that dimming.
- Playback continues in the background with media-notification / lock-screen
  controls, so the OS-level surface is a real part of the product, not an
  afterthought.
- Under Expo Go the background audio service and lock-screen controls do not
  bind, and background playback stops after roughly 3 minutes. This is a
  development-environment limitation only; a development build
  (`npx expo run:android`) or an EAS build is required to exercise or evaluate
  those surfaces.

## Capabilities and Constraints

Confirmed functionality:

- 31 looping ambient sounds in **one continuous authored sequence** — the Dial.
  There is no featured row and no "More sounds" section; those dissolved on
  2026-07-31. The order is a design decision, not a data order: the run goes
  precipitation → water bodies → air → living outdoors → close body → rhythmic
  interior → social interior → transit → machine → pure noise, dark to bright,
  so that neighbouring positions sound like neighbours and dragging reads as
  tuning rather than shuffling. It lives in `SEQUENCE` in `src/sounds.ts` and
  every sound must be placed in it; the module throws if one is missing.
- One sound plays at a time. Switching crossfades between two audio voices.
- Settling the dial on a new sound starts playback, even from paused. Cold
  start still restores silently.
- Sleep timer with fade-out at 15 / 30 / 60 minutes.
- Volume control.
- Automatic screen dimming after 2 minutes of playback (`expo-brightness`).
- Background playback with media notification and lock-screen controls
  (`expo-audio`, `enableBackgroundPlayback: true`).
- In-app sound credits screen.
- Local-only persistence via AsyncStorage: last sound played, volume, and
  whether the welcome screen has been seen. No other state is stored.

Technical constraints:

- Expo SDK 57, React Native 0.86, React 19, TypeScript. Managed workflow —
  no committed `android/` or `ios/` directory.
- Targets Android 16 (API 36), meeting the Google Play target-API requirement
  effective 2026-08-31.
- Releases update the existing Play listing `com.covaga.jewelrain`, carried
  over from a previous Flutter implementation of the same app. Production on
  Play was **1.0.5 (versionCode 6)** as of 2026-07-31; this Expo implementation
  ships as **1.1.0 (versionCode 7)**, the first release off the EAS path.
  `eas.json` sets `appVersionSource: "local"`, so the versionCode is whatever
  `app.json` says and moves as a reviewable diff — it is never bumped by the
  build server, and Play rejects any AAB reusing a code.

Explicitly undecided / unrecorded:

- iOS release status and timeline.
- **Signing — resolved 2026-07-31.** The upload-key reset begun on 2026-07-22
  (the original Flutter-era upload keystore was not available) has been
  **approved by Google**. The active upload key is `rain.jks`, alias `upload`,
  SHA-1 `AC:A2:CA:50:79:A4:B2:EB:1A:17:D1:AE:16:A8:B6:0C:71:6E:5A:11`. That
  fingerprint is the check to run against any release artifact before
  submitting; anything else means the build was signed by something other than
  the registered upload key.
  There are now **two** release paths, and they must not both act on one build:
  a local one (Gradle properties, below) and EAS Build, which holds the same
  keystore in its own credential store for `@covagashi/jewel-rain`. Because
  `withReleaseSigning` rewrites the release buildType's `signingConfig` line
  and EAS applies its credentials to the generated `build.gradle`, the plugin
  is a **no-op when `EAS_BUILD` is set** — without that guard the cloud build
  can silently ship a debug-signed AAB.
  The local **mechanism** is unchanged: `plugins/withReleaseSigning.js`
  (added 2026-07-28) re-injects the release signing config on every prebuild,
  because `android/` is generated and gitignored. Credentials come from Gradle
  properties — `JEWELRAIN_STORE_FILE`, `JEWELRAIN_STORE_PASSWORD`,
  `JEWELRAIN_KEY_ALIAS`, `JEWELRAIN_KEY_PASSWORD` — set in
  `~/.gradle/gradle.properties` or passed with `-P`, and never committed. With
  those absent the build falls back to Expo's debug signing, so a local
  `assembleRelease` still works without the keystore. That fallback is why the
  test APKs on the preview releases are debug-signed.
- **Copy conflict — resolved 2026-07-30.** All in-app copy now names the
  confirmed primary job. The welcome tagline reads "Ambient sounds for
  relaxing and meditating", its CTA reads "Choose a sound", and the player
  subtitle reads "Pick a sound and settle in". The sleep-timer control was
  renamed **"Stop after"** with a timer icon, because it names the action the
  control performs rather than a derived use case. `README.md` was brought in
  line on 2026-07-31; no surface carries the old promise any more.

- **Product name — "Raining Jewels" (2026-07-31).** The displayed name was
  "Jewel Rain"; it is now **Raining Jewels**, matching the repository. The
  welcome lockup reads light "Raining " + bold "Jewels." with the terminal
  period. What did **not** change, and cannot: the Play package id
  `com.covaga.jewelrain`, the iOS bundle identifier, and the Expo slug
  `jewel-rain`. Those are identity keys on an existing listing — renaming one
  creates a second app rather than renaming the first.

## Decisions Taken

Recorded so later work does not reopen them.

- **Interaction model — "the Dial" (decided 2026-07-30, BUILT 2026-07-31).**
  The featured row and the 28-tile horizontal strip are gone. The library is
  one continuous vertical run passing a fixed play head; audio crossfades once
  the drag settles. Chosen over a library sheet (cheaper, but left the app
  category-interchangeable) and over two-sound layering (which would have cost
  the radical-simplicity claim). Cost zero positioning claims and keeps one
  sound at a time.
  Both conditions shipped as part of the feature: it does **not** audition
  while dragging (a 350ms settle debounce, cancelled by any new drag, with
  `commitSound` as the single door to audio), and the run exposes
  `accessibilityRole="adjustable"` with increment/decrement so a screen-reader
  user steps it without a drag.
  Implementation notes worth keeping: the drag rides `Animated.ScrollView`
  with `snapToInterval` rather than `Gesture.Pan`, deliberately —
  `react-native-gesture-handler` is not a dependency, and native snapping
  gives platform-correct fling physics, which an `adaptive` product wants.
  Two `useAudioPlayer()` voices cross-ramp on an equal-power curve;
  `playing` reads from both voices, because reading only the active one made
  the app announce "Paused" mid-crossfade.

- **Session display — "recede, don't disappear" (2026-07-30).** The full-screen
  black scrim is to be removed and the interface is to recede into a low-
  luminance session state (sound name plus one slow ambient element) rather
  than being replaced by a black rectangle. System brightness still drops, but
  to a legible floor rather than 10% under a 65% wash. A touch must restore the
  interface **without being consumed**, so reaching for a control costs one
  gesture. Dimming must arm on playback, not on screen mount.

- **Not decided:** whether the sleep-timer options should be recalibrated from
  15/30/60 to a session-length set (e.g. 10/20/45). Raised, not answered.

## Brand Commitments

- Name: **Raining Jewels** — one word plus a space, everywhere. The welcome screen
  styles it as light "Jewel" + bold "Rain." with a terminal period, but the
  readable string always carries the space. (An earlier unspaced "JewelRain."
  lockup was removed on 2026-07-30; the app had been shipping two spellings.)
- Typeface: Manrope (via `@expo-google-fonts/manrope`) for display and
  headings; system font for body copy.
- A hand-drawn line illustration of a figure under an umbrella in the rain is
  the app's first-run image (`assets/`), alongside `icon.png`,
  `splash-icon.png`, `picto.png`, and `picto-light.png`.
- The credits screen naming Noice and every CC-BY author is a permanent
  fixture, not a candidate for removal or burial.

## Evidence on Hand

- 31 bundled sound files under `assets/sounds/`, catalogued in `src/sounds.ts`
  with per-sound attribution metadata.
- Full attribution table in `README.md` and rendered in-app by
  `src/CreditsModal.tsx`.
- `LICENSE` — GPL-3.0.
- An existing Google Play listing for `com.covaga.jewelrain` predating this
  Expo implementation.

No testimonials, user research, analytics, download figures, reviews, or
competitive benchmarks exist for this product. Future work must not fabricate
them or imply they exist.

## Product Principles

1. **One tap to sound.** The distance between opening the app and hearing
   something must never grow. Any new feature that adds a step before playback
   is rejected.
2. **The four positioning claims are load-bearing.** Free and account-free,
   fully offline, ad-free and pattern-free, radically simple. These are not
   preferences to be traded against convenience.
3. **Design for the dimmed, unattended screen.** The interface spends most of
   its life at reduced brightness with the user not looking at it directly.
   Legibility and reach at 2-minutes-in matter more than first-impression
   density.
4. **The OS surface is part of the product.** The media notification and
   lock-screen controls are where a running session is actually operated;
   they get the same care as the in-app screen.
5. **Attribution is a feature, not an obligation to minimize.** The app is
   built on other people's freely-shared recordings, and the credits screen
   says so plainly.

## Accessibility & Inclusion

No product-specific accessibility requirement or target standard has been
established with the user. The operating context does impose one factual
constraint that future work must respect: the screen dims automatically after
2 minutes, so contrast and touch-target decisions cannot assume full
brightness.

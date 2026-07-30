# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Jewel Rain ships on both Android and iOS as one product that adapts its design
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

- 31 looping ambient sounds. Rain, Thunder, and Wind are featured; the
  remaining 28 sit under a "More sounds" section.
- One sound plays at a time.
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
  over from a previous Flutter implementation of the same app.

Explicitly undecided / unrecorded:

- iOS release status and timeline.
- Signing: as of 2026-07-22 an upload-key reset was in progress because the
  original Flutter-era upload keystore is not available. Whether Google has
  since approved the replacement is not recorded here and must be confirmed
  before a release is planned.
- **Copy conflict — resolved 2026-07-30.** All in-app copy now names the
  confirmed primary job. The welcome tagline reads "Ambient sounds for
  relaxing and meditating", its CTA reads "Choose a sound", and the player
  subtitle reads "Pick a sound and settle in". The sleep-timer control was
  renamed **"Stop after"** with a timer icon, because it names the action the
  control performs rather than a derived use case. `README.md` still opens
  with "meditation and sleep" and still calls the feature a sleep timer — it
  is the last surface carrying the old promise.

## Decisions Taken

Recorded so later work does not reopen them.

- **Interaction model — "the Dial" (2026-07-30).** The featured row and the
  28-tile horizontal strip are to be replaced by a single continuous vertical
  surface: the library passes a fixed play head as the user drags, and audio
  crossfades once the drag settles. Chosen over a library sheet (cheaper, but
  leaves the app category-interchangeable) and over two-sound layering (which
  would have cost the radical-simplicity claim). Costs zero positioning
  claims and keeps one sound at a time.
  Two conditions are part of the feature, not follow-ups: it must **not**
  audition sounds while dragging — crossfade on settle only — and it must
  expose a parallel `accessibilityRole="adjustable"` with increment and
  decrement actions, or 31 sounds become unreachable to screen readers.
  Requires a second audio player instance; the current engine is single-voice.

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

- Name: **Jewel Rain** — one word plus a space, everywhere. The welcome screen
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

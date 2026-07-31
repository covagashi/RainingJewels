# Raining Jewels

Ambient sounds for relaxing and meditating. Built with Expo /
React Native (TypeScript).

Raining Jewels is free software, licensed under the
[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html) (see `LICENSE`).

## Features

- **The Dial**: 31 looping ambient sounds as one continuous run moving past a
  fixed play head. Drag to tune, release and it crossfades in. The order is
  authored by ear — precipitation, water, air, living outdoors, close body,
  interior, transit, machine, noise — so neighbouring positions sound like
  neighbours. It lives in `SEQUENCE` in `src/sounds.ts`, and the module throws
  if a sound is not placed in it.
- All sounds bundled — works fully offline
- Background playback with media notification / lock screen controls
  (`expo-audio` `setActiveForLockScreen`)
- "Stop after" timer (15/30/60 min) that rides the volume down over the
  final 30 seconds rather than cutting
- Automatic screen dimming after 2 minutes
- In-app sound credits screen

## Development

```bash
npm install
npx expo start          # develop with Expo Go / dev client
npx expo run:android    # full dev build (needed for background audio)
```

Notes:

- Background playback and the media notification rely on a native foreground
  service added by the expo-audio config plugin, so they need a
  **development build** (`npx expo run:android`) or an EAS build — in
  Expo Go, background playback stops after ~3 minutes.
- Expo SDK 57 targets **Android 16 (API 36)** by default, meeting the
  Google Play target-API requirement effective Aug 31, 2026.

## Releasing to Google Play

The app id is `com.covaga.jewelrain` (set in `app.json`) — the same as the
existing Play listing, so releases from this project update the same app.
Build with EAS:

```bash
npx eas build -p android
```

Important: to keep updating the existing listing you must sign with the same
upload key as before (`upload-keystore.jks` from the old Flutter project).
Configure it in EAS with `npx eas credentials` instead of letting EAS
generate a new keystore.

Because the app is GPL-3.0, keep this repository public (or otherwise offer
the source) and keep the license notice in the app's credits screen.

## Sound credits

The sounds are sourced from the open-source
[Noice sound library](https://github.com/trynoice) ([trynoice.com](https://trynoice.com)).
Some are Creative Commons recordings shared by their original authors and
edited into seamless loops by the Noice project; others are Noice's own
recordings, licensed under GPL-3.0. Attributions (also shown in-app):

| Sound | Source | Author | License |
|---|---|---|---|
| Birds | [the morning comes 20-5-11.wav](https://freesound.org/s/120905/) | [Kyster](https://freesound.org/people/Kyster/) | CC BY 3.0 |
| Seashore | [oceanwavescrushing.wav](https://freesound.org/s/48412/) | [Luftrum](https://freesound.org/people/Luftrum/) | CC BY 3.0 |
| Seashore | [calm waves sandy coast](https://freesound.org/s/236009/), [CalmWaves SandBeach](https://freesound.org/s/188475/), [harbour waves calm](https://freesound.org/s/169181/) | [klankbeeld](https://freesound.org/people/klankbeeld/) | CC BY 3.0 |
| Night | [NC Night Forest.wav](https://freesound.org/s/405515/) | [Lasdimot](https://freesound.org/people/Lasdimot/) | CC BY 3.0 |
| Coffee Shop | [Coffee shop.aif](https://freesound.org/s/255712/) | [grupo3sonidodiegetico](https://freesound.org/people/grupo3sonidodiegetico/) | CC BY 3.0 |
| Purring Cat | [Cat Purring / Cleaning Fur](https://freesound.org/s/332274/) | [nebulousflynn](https://freesound.org/people/nebulousflynn/) | CC BY 3.0 |
| Fan | [fan.wav](https://freesound.org/s/57019/) | [NoiseCollector](https://freesound.org/people/NoiseCollector/) | CC BY 3.0 |
| Train | [Train Wheels Ride outside Thailand](https://freesound.org/s/170866/) | [YOH](https://freesound.org/people/YOH/) | CC BY 4.0 |
| Train | [Train Horn](https://freesound.org/s/248229/) | [CouleurCasquette](https://freesound.org/people/CouleurCasquette/) | CC BY 3.0 |
| Palm Wind | [Palm Trees in the Wind.wav](https://freesound.org/s/346106/) | [StrangeAcoustics](https://freesound.org/people/StrangeAcoustics/) | CC BY 3.0 |
| Village Morning | [early morning village alem](https://freesound.org/s/170930/) | [klankbeeld](https://freesound.org/people/klankbeeld/) | CC BY 3.0 |
| Creaking Boat | [Lake Waves 2.wav](https://freesound.org/s/67884/) | [Benboncan](https://freesound.org/people/Benboncan/) | CC BY 3.0 |
| Heartbeat | [Heartbeat_02.wav](https://freesound.org/s/216219/) | [RSilveira_88](https://freesound.org/people/RSilveira_88/) | CC BY 3.0 |
| Wall Clock | [Wall Clock Ticking.wav](https://freesound.org/s/405423/) | [straget](https://freesound.org/people/straget/) | CC BY 3.0 |
| Office | [The Office](https://freesound.org/s/211945/) | [qubodup](https://freesound.org/people/qubodup/) | CC BY 3.0 |
| Chatter | [Crowd Talking During Interval](https://freesound.org/s/163390/) | [blouhond](https://freesound.org/people/blouhond/) | CC BY 3.0 |
| Air Travel | [In-flight Ambience - Boeing 737-838](https://freesound.org/s/47254/) | [digifishmusic](https://freesound.org/people/digifishmusic/) | CC BY 3.0 |
| Car Ride | [hybrid Toyota Yaris drive](https://freesound.org/s/476833/) | [klankbeeld](https://freesound.org/people/klankbeeld/) | CC BY 3.0 |
| Wolves | [Wolves howling, small pack](https://freesound.org/s/243495/) | [YleArkisto](https://freesound.org/people/YleArkisto/) | CC BY 3.0 |
| Campfire, Crickets, Stream, Soft Wind, Wind Chimes, Snow Walk, Library, Scuba, White/Pink/Brown Noise | [Noice sound library](https://github.com/trynoice) | Noice | GPL-3.0 |

Licenses: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) ·
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) ·
[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html)

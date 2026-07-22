# Jewel Rain (Raining Jewels)

Relaxing ambient sounds for meditation and sleep.

This repository contains two implementations:

| Directory | Stack | Status |
|---|---|---|
| repo root (`lib/`, `android/`, …) | Flutter | Production app published on Google Play (`com.covaga.jewelrain`) |
| `jewel-rain-expo/` | Expo / React Native | New port, intended to replace the Flutter app over time |

## Features

- 21 looping ambient sounds: Rain, Thunder, Wind, plus a **More sounds**
  section with Birds, Seashore, Night, Coffee Shop, Purring Cat, Fan, Train,
  Palm Wind, Village Morning, Creaking Boat, Heartbeat, Wall Clock, Office,
  Chatter, Air Travel, Car Ride and Wolves
- Background playback with media notification / lock screen controls
- Sleep timer with fade-out (15/30/60 min)
- Automatic screen dimming after 2 minutes
- In-app sound credits screen

## Flutter app (production)

Requires Flutter 3.24+ (Dart 3.5+). Targets Android 16 (API 36), as required
by Google Play from Aug 31, 2026.

```bash
flutter pub get
flutter analyze
flutter test
flutter build appbundle --release
```

Release signing expects `android/app/upload-keystore.jks` (not committed).

## Expo app (port)

Lives in `jewel-rain-expo/`. Built with the Expo SDK (TypeScript), using
`expo-audio` for playback, `expo-keep-awake` and `expo-brightness`.

```bash
cd jewel-rain-expo
npm install
npx expo start        # develop with Expo Go / dev client
```

Notes:

- Background playback and the media notification / lock screen controls use
  `expo-audio` (`shouldPlayInBackground` + `setActiveForLockScreen`). On
  Android this relies on a native foreground service added by the expo-audio
  config plugin, so it needs a **development build** (`npx expo run:android`)
  or EAS build — in Expo Go, background playback stops after ~3 minutes.
- Android builds via `npx expo run:android` or EAS (`eas build -p android`).

## Sound credits

The additional sounds are sourced from the open-source
[Noice sound library](https://github.com/trynoice) ([trynoice.com](https://trynoice.com)),
which curates recordings shared under Creative Commons licenses and edits
them into seamless loops. Attributions (also shown in-app):

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

The remaining Noice sounds (campfire, crickets, white/pink/brownian noise,
water stream, soft wind, wind chimes, walking in snow, public library,
scuba diving) are not bundled because their audio has no clearly licensed
public source in the library manifest.

Licenses: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) ·
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

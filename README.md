# Jewel Rain (Raining Jewels)

Relaxing ambient sounds for meditation and sleep.

This repository contains two implementations:

| Directory | Stack | Status |
|---|---|---|
| repo root (`lib/`, `android/`, …) | Flutter | Production app published on Google Play (`com.covaga.jewelrain`) |
| `jewel-rain-expo/` | Expo / React Native | New port, intended to replace the Flutter app over time |

## Features

- 11 looping ambient sounds: Rain, Thunder, Wind, plus a **More sounds** section with Birds, Seashore, Night, Coffee Shop, Purring Cat, Fan, Train and Palm Wind
- Background playback with media notification (Flutter app)
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

- Background playback is enabled (`shouldPlayInBackground`, iOS `UIBackgroundModes: audio`),
  but the Expo port does not show a media notification yet. For full parity
  with the Flutter app, a dev build with a media-session library would be the
  next step.
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

Licenses: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) ·
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

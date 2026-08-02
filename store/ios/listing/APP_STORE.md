# Raining Jewels — ficha App Store

Guía lista para copiar en [App Store Connect](https://appstoreconnect.apple.com).
La app ya está en Google Play como `com.covaga.jewelrain`; en iOS usamos el mismo
bundle id y el mismo producto.

## Identificadores

| Campo | Valor |
|---|---|
| Nombre en pantalla | Raining Jewels |
| Bundle ID | `com.covaga.jewelrain` |
| App Store Connect ID | `6797286819` |
| SKU | `raining_jewel` |
| Versión | `1.1.0` (como en `app.json`) |
| Build number | `1` (primer envío iOS) |
| URL en ASC | https://appstoreconnect.apple.com/apps/6797286819 |
| Categoría primaria | Health & Fitness |
| Categoría secundaria | Lifestyle |
| Precio | Free |
| Disponibilidad | All territories (o los que elijas) |

## Textos de la ficha (EN — App Store)

Apple exige al menos un idioma; el primario de la ficha Play es inglés, se
recomienda lo mismo aquí. Debajo hay una versión en español para localizar.

### Name (30 caracteres máx.)

```
Raining Jewels
```

### Subtitle (30 caracteres máx.)

```
Ambient sounds, offline
```

### Promotional Text (170 caracteres, editable sin review)

```
31 ambient sounds. One continuous dial. Fully offline, free, no account and no ads — just settle in.
```

### Description (4000 caracteres máx.)

```
Ambient sounds for relaxing and meditating — free, offline, and deliberately simple.

Raining Jewels is a weather station for sound. Thirty-one looping recordings live on one continuous dial: drag to tune, release, and the sound crossfades in. Neighbouring positions sound like neighbours, so the run feels like tuning rather than browsing a catalogue.

Why people keep it:

• Fully offline — every sound is bundled. Works on a plane, with no signal, with no buffering.
• No account, no subscription, no ads, no tracking.
• Background playback with lock-screen and Control Center controls.
• “Stop after” timer (15 / 30 / 60 min) that fades out gently instead of cutting.
• Screen dims after two minutes so the session stays quiet.
• Free software under GPL-3.0 — source available, nothing locked away.

The Dial (not a picker)
Precipitation, water, air, living outdoors, quiet interiors, transit, machines, pure noise — authored as one sequence so dragging past the play head feels continuous.

One sound at a time. No mixer, no playlists, no streaks, no upsell at the moment you are trying to settle.

Sounds are sourced from the open-source Noice library and original Creative Commons recordings; full credits are in the app.

Privacy: Raining Jewels does not collect personal data, does not require an account, and does not phone home to play.
```

### Keywords (100 caracteres, separados por comas, sin espacios de más)

```
ambient,relax,meditate,white noise,rain,sleep,focus,offline,free,calm,nature
```

(Cuenta: ~88 caracteres. No repitas el nombre de la app.)

### Support URL (obligatoria)

Usa la URL pública del repositorio o un sitio de soporte, por ejemplo:

```
https://github.com/covagashi/RainingJewels
```

### Marketing URL (opcional)

```
https://github.com/covagashi/RainingJewels
```

### Privacy Policy URL (obligatoria en la práctica)

Sube `store/ios/listing/privacy-policy.html` a una URL pública. Opciones rápidas:

1. **GitHub Pages** (recomendado): activa Pages en el repo y sirve el HTML.
2. **Raw temporal** (solo para pruebas; Apple prefiere una página real):
   no uses `raw.githubusercontent.com` como política definitiva.

Ejemplo una vez en Pages:

```
https://covagashi.github.io/RainingJewels/privacy-policy.html
```

Publicación mínima con GitHub Pages:

```bash
# desde la raíz del repo
mkdir -p docs && cp store/ios/listing/privacy-policy.html docs/privacy-policy.html
# Luego: Settings → Pages → Deploy from branch → /docs on main
```

**Privacy Policy URL (activa en ASC):** `https://covaga.xyz/privacy/`

### What’s New (1.1.0)

```
First release on the App Store.

• The Dial — 31 ambient sounds in one continuous run
• Offline playback, background audio, lock-screen controls
• Stop-after timer with a gentle fade-out
• Automatic screen dimming during a session
```

## Textos (ES — localización opcional)

### Nombre

```
Raining Jewels
```

### Subtítulo

```
Sonidos ambientales offline
```

### Texto promocional

```
31 sonidos ambientales. Un dial continuo. Totalmente offline, gratis, sin cuenta y sin anuncios.
```

### Descripción

```
Sonidos ambientales para relajarte y meditar — gratis, offline y deliberadamente simple.

Raining Jewels es una estación meteorológica del sonido. Treinta y un bucles viven en un solo dial continuo: arrastra para sintonizar, suelta, y el sonido entra con un crossfade. Las posiciones vecinas suenan como vecinas.

• Totalmente offline — todos los sonidos van en la app.
• Sin cuenta, sin suscripción, sin anuncios, sin tracking.
• Reproducción en segundo plano con controles en la pantalla de bloqueo.
• Temporizador “Stop after” (15 / 30 / 60 min) con fundido suave.
• La pantalla se atenúa a los dos minutos.
• Software libre GPL-3.0.

Un sonido a la vez. Sin mezclador, sin listas, sin rachas, sin ventas en el momento en que intentas asentarte.

Privacidad: no recopilamos datos personales, no hace falta cuenta y no se necesita red para reproducir.
```

### Palabras clave

```
ambiente,relajación,meditar,ruido blanco,lluvia,dormir,concentración,offline,gratis
```

## Capturas de pantalla

Generadas en `store/ios/screenshots/out/`:

| Orden | Archivo | Contenido |
|---|---|---|
| 1 | `01-welcome.png` | Pantalla de bienvenida |
| 2 | `02-dial.png` | El Dial (pausa) |
| 3 | `03-playing.png` | Reproduciendo (acento rain-blue) |
| 4 | `04-session.png` | Panel “Stop after” + volumen |
| 5 | `05-offline.png` | Mensaje Free / Offline / No account |

Tamaños:

- `out/6.7/` → **1290 × 2796** (iPhone 6.7")
- `out/6.9/` → **1320 × 2868** (iPhone 6.9" — talla principal actual)

Sube **al menos 3** (máx. 10) por talla de iPhone. Empieza por la serie **6.9"**;
App Store Connect puede reutilizar/escalar para otras tallas.

Regenerar:

```bash
node store/ios/screenshots/render.mjs
```

Estas capturas son mockups fieles al diseño del producto. Si Apple o tú preferís
capturas de dispositivo real, construid un build de preview y sacadlas del
simulador:

```bash
npx eas build -p ios --profile preview
# o local:
npx expo run:ios
```

## Age rating

Cuestionario típico para esta app (todo “No” salvo lo indicado):

- Cartoon / Fantasy Violence → No
- Realistic Violence → No
- Sexual Content → No
- Profanity → No
- Drugs / Alcohol / Tobacco → No
- Horror / Fear Themes → No
- Mature / Suggestive Themes → No
- Gambling → No
- Contests → No
- Unrestricted Web Access → No
- **Medical / Treatment Information → No** (no es una app médica)

Resultado esperado: **4+**.

## App Privacy (nutrition labels)

En App Store Connect → App Privacy:

**Data Not Collected** — la app no recoge datos para tracking ni analytics.
AsyncStorage solo guarda preferencias locales (último sonido, volumen, welcome
visto) en el dispositivo; no se envían a ningún servidor.

No hay:

- Account
- Location
- Contact Info
- Identifiers / Device ID
- Usage Data / Analytics
- Advertising Data

## Export compliance

`ITSAppUsesNonExemptEncryption` / `usesNonExemptEncryption` = **false** en
`app.json`. En el cuestionario de export: la app solo usa cifrado exento de
HTTPS del sistema (si lo usara); no implementa cifrado propio. Responder que
**no** usa cifrado no exento.

## Review notes (para el revisor de Apple)

```
Raining Jewels is a free, offline ambient-sound player. No account, no IAP, no ads.

How to test:
1. Launch → tap “Choose a sound”.
2. Drag the vertical dial to change the sound under the play head; release to crossfade.
3. Tap play; audio continues in background and on the lock screen.
4. Open the Session panel at the bottom for “Stop after” timer and volume.

All 31 sounds are bundled; no network is required after install.
Source and GPL-3.0 license: see in-app Sound credits and the public repository.
```

## Checklist de envío

### Antes del build

- [ ] Cuenta **Apple Developer Program** activa ($99/año) en el mismo equipo que firmará
- [ ] App creada en App Store Connect con bundle id `com.covaga.jewelrain`
- [ ] Privacy Policy URL pública y accesible
- [ ] `ascAppId` numérico pegado en `eas.json` → `submit.production.ios.ascAppId`
- [ ] Credenciales iOS en EAS: `npx eas credentials -p ios` (cert + provisioning distribution)

### Build y submit

```bash
# 1. Build de producción iOS (firma gestionada por EAS)
npx eas build -p ios --profile production

# 2. Cuando el build termine, enviar a App Store Connect
npx eas submit -p ios --latest

# O en un solo paso:
npx eas build -p ios --profile production --auto-submit
```

### En App Store Connect

- [ ] Completar ficha (textos, keywords, categoría, copyright)
- [ ] Subir capturas 6.9" (y 6.7" si quieres)
- [ ] App Privacy → Data Not Collected
- [ ] Age rating
- [ ] Precio = Free
- [ ] Seleccionar el build procesado
- [ ] Submit for Review

### Copyright

```
2026 Covaga
```

(Ajusta al nombre legal del desarrollador en la cuenta Apple.)

## Notas técnicas del proyecto

- Expo SDK 57, managed workflow, EAS project `@covagashi/jewel-rain`
- `UIBackgroundModes: audio` ya configurado
- `supportsTablet: false` (sin layout iPad)
- Icono: `assets/app-icon.png` (1024×1024, sin alpha — correcto para iOS)
- Splash: `assets/splash-icon.png` sobre `#0D0F14`
- El plugin `withReleaseSigning` es solo Android; en iOS EAS maneja la firma

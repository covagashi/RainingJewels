---
name: Raining Jewels
description: A weather station for sound — one continuous run of ambient recordings tuned past a fixed head.
colors:
  bg-top: "#0D0F14"
  bg-bottom: "#060709"
  bg-sheet: "#14171E"
  rain-blue: "#9CC2D4"
  rain-blue-fill: "rgba(156,194,212,0.32)"
  text-primary: "#ffffff"
  text-secondary: "rgba(255,255,255,0.7)"
  text-tertiary: "rgba(255,255,255,0.55)"
  dial-neighbour: "rgba(255,255,255,0.34)"
  glass-border: "rgba(255,255,255,0.35)"
  glass-fill: "rgba(255,255,255,0.10)"
  selected-border: "rgba(255,255,255,0.7)"
  selected-fill: "rgba(255,255,255,0.26)"
  divider: "rgba(255,255,255,0.18)"
  scrim: "rgba(0,0,0,0.65)"
typography:
  display:
    fontFamily: "Manrope_300Light"
    fontSize: "34px"
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: "-0.3px"
  headline:
    fontFamily: "Manrope_600SemiBold"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Manrope_500Medium"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.2
  body:
    fontFamily: "system"
    fontSize: "16px"
    lineHeight: 1.5
  label:
    fontFamily: "system"
    fontSize: "14px"
    lineHeight: 1.5
  caption:
    fontFamily: "system"
    fontSize: "12px"
    lineHeight: 1.5
rounded:
  sm: "12px"
  md: "20px"
  lg: "24px"
  sheet: "28px"
  pill: "999px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "40px"
components:
  transport-paused:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.bg-top}"
    rounded: "{rounded.pill}"
    size: "76px"
  transport-playing:
    backgroundColor: "{colors.rain-blue-fill}"
    textColor: "{colors.rain-blue}"
    rounded: "{rounded.pill}"
    size: "76px"
  dial-row-head:
    textColor: "{colors.text-primary}"
    typography: "{typography.display}"
  dial-row-neighbour:
    textColor: "{colors.dial-neighbour}"
    typography: "{typography.display}"
  timer-chip:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 16px"
  timer-chip-selected:
    backgroundColor: "{colors.selected-fill}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 16px"
  control-panel:
    backgroundColor: "{colors.bg-sheet}"
    rounded: "{rounded.sheet}"
    padding: "24px"
  credits-sheet:
    backgroundColor: "{colors.bg-sheet}"
    rounded: "{rounded.sheet}"
    padding: "16px"
---

# Design System: Raining Jewels

## Overview

**Creative North Star: "The Weather Station"**

Instrument marks over weather seen through glass. The player is not a menu of
sounds; it is a reading. A fixed head sits at the centre of the screen with two
drawn ticks either side of it, and the library — one continuous run of 31
recordings in an authored order — moves past that head under the thumb. The name
at the head is the reading. Behind all of it, ambient rain falls the full height
of the screen, continuously, whether or not anything is playing.

The system is monochrome by commitment, not by timidity. A near-black vertical
gradient, a ramp of white opacities, and exactly one colour — a muted rain blue
that is *earned* rather than applied: it appears only when audio is genuinely
audible, never when playback has merely been requested. On a surface that dims
itself mid-session and asks for nothing, colour is the loudest thing available,
so it is spent on the one fact the user cannot otherwise verify.

Density is deliberately low and gets lower. Two minutes into playback the
interface recedes to a twelve-percent ghost while the head, the transport and
the weather stay — and every faded control remains visible and pressable, so
receding costs the user nothing but attention. What survives that reduction is
the definition of what matters here.

**Key Characteristics:**
- One accent, earned by audible sound, never decorative
- The library's *order* is design; adjacency is by ear
- Depth from scale and opacity, not from shadow
- Nothing interactive below 48dp, including under a transform
- Text is never clipped to protect a box; the box moves instead
- The interface recedes rather than disappears

## Colors

A near-black field, a disciplined ramp of white opacities for everything
structural, and a single cold blue reserved for one fact.

### Primary
- **Muted Rain Blue** (`{colors.rain-blue}`): the only colour in the system.
  Applied to the head ticks, the head's name, the transport ring and glyph, the
  status word, the volume track and the selection dot — and only when audio is
  genuinely audible (`playing && volume > 0 && !isStarting`). During the onset
  ramp, when playback has begun but nothing can be heard yet, the interface
  stays monochrome and says "Starting…".
- **Rain Blue Fill** (`{colors.rain-blue-fill}`): the playing transport's face.

### Neutral
- **Near-Black Field** (`{colors.bg-top}` → `{colors.bg-bottom}`): a vertical
  gradient, top to bottom. This is the surface, not a background — anything
  painted opaque over it at an arbitrary height will read as a band.
- **Sheet** (`{colors.bg-sheet}`): raised surfaces only — the control panel and
  the credits sheet.
- **White ramp**: primary (`{colors.text-primary}`, 19.17:1), secondary
  (`{colors.text-secondary}`, 9.55:1), tertiary (`{colors.text-tertiary}`,
  6.24:1) for text; glass border (`{colors.glass-border}`, 3.19:1) for
  interactive boundaries; glass fill (`{colors.glass-fill}`) for control faces;
  divider (`{colors.divider}`) for hairlines inside sheets.

### Named Rules

**The Earned Accent Rule.** The accent is never applied to indicate intent, only
to report fact. Playback requested is not playback heard. If you cannot point at
the measurable condition your accent reports, it is decoration and does not
belong.

**The Gradient Is The Surface Rule.** The field is a vertical gradient, so
`bg-top` is only correct at the top of the screen. Never paint an opaque
near-black over content to mask, fade or clip — it will band, and it will
occlude the weather layer behind it. Solve edges in the content's own opacity.

**The Three Blacks Rule.** There are exactly three near-blacks:
`{colors.bg-top}`, `{colors.bg-bottom}`, `{colors.bg-sheet}`. The system once
carried five; two were removed at cost. A fourth is a regression, whatever it
is for.

## Typography

**Display Font:** Manrope (300 Light, 500 Medium, 600 SemiBold, 700 Bold)
**Body Font:** the platform system face

**Character:** A geometric sans carries the readings; the platform's own face
carries everything the user operates. The split is functional, not decorative —
system faces render small text better under the user's own size settings, and
this interface spends its life at reduced brightness.

### Hierarchy
- **Display** (300, 34px, 1.2, -0.3px tracking): the name at the head. The only
  display-scale type in the app, and the only reason it is unambiguous.
- **Headline** (600, 26px, 1.2): sheet titles.
- **Title** (500, 20px, 1.2): section headings inside sheets.
- **Body** (system, 16px, 1.5): the status line, sheet paragraphs.
- **Label** (system, 14px, 1.5): controls, chips, the dock label, attributions.
- **Caption** (system, 12px, 1.5): licence and contact lines.

### Named Rules

**The Loaded Weights Rule.** A font token may name only a weight `App.tsx`
actually loads. A token naming an unloaded face falls back to the system font at
every call site while reading as verified — 400Regular was exactly that trap.
Add the weight to `useFonts` before adding the token.

**The Box Moves Rule.** Text is never capped, truncated or ellipsised to protect
a layout. `numberOfLines` appears nowhere in this codebase, deliberately. Boxes
grow with `fontScale` (clamped at 1.6× so a 200% tile cannot push the run off
screen); type does not shrink to fit them.

## Layout

A single portrait column on a 4pt grid. There is no navigation, no tab bar and
no header — the app is one screen, and the run occupies its centre.

The dial is a bounded window of six rows at a derived pitch
(`display size × 1.2 + 24`), with the head anchored at the fourth. Everything
above and below the window is either weather or the transport. Surplus vertical
space is split evenly into spacers above and below the centre stack; it is never
allowed to pool into a single void, which is a defect this layout was rebuilt to
remove.

Timer, volume and the credits entry point live in a pull-up panel anchored above
a dock bar. Closed, the panel is `pointerEvents: none` and hidden from assistive
tech, so there is no invisible-but-live control.

### Named Rules

**The 48 Floor Rule.** Nothing interactive is smaller than 48dp in either axis,
including its padding — and including under a transform. Both platforms hit-test
in transformed space, so a `scale` on a row container shrinks its hit box
invisibly. Put the transform on an inner content view and leave the target at
full pitch.

**The 8 Gap Rule.** Adjacent touch targets never touch. Eight points minimum
between them, or a mis-tap is the design's fault.

## Elevation & Depth

**The system currently uses no shadows at all.** Depth comes from three sources:
the vertical field gradient, the white-opacity ramp (a raised surface is a
lighter step, not a lifted one), and — in the dial specifically — *scale*. Rows
recede by shrinking from 1.0 at the head to 0.71 at the neighbours to 0.46 at
the window edge, while opacity holds a floor. Scale carries the depth; opacity
carries legibility.

This is the state of the system as built, recorded rather than mandated. If a
future surface genuinely needs separation — the pull-up panel overlapping
content is the plausible candidate — that is a decision to take deliberately,
not a prohibition to work around. What is settled is the shape of the mistake to
avoid: a zero-offset coloured halo is decoration, not depth, and one was removed
from the transport for exactly that reason.

## Shapes

Two forms, and they mean different things. **Pills** (`{rounded.pill}`) are for
anything that acts: the transport, timer chips, the head ticks' caps. **Soft
rectangles** (`{rounded.sheet}`, `{rounded.lg}`) are for anything that contains:
sheets, panels, cards.

Icons are line-drawn at a single 1.75 stroke across the whole app, at three
sizes (16 / 24 / 32). Every one of the 31 sounds has its own glyph; none is
shared with another sound or with the fallback.

The head marks are the system's one piece of chrome: two 2dp pill-capped rules,
inset from the bezels, flanking the head at display height. They are the only
element that exists purely to say where something is.

## Components

### Transport
- **Character:** the heaviest object on the screen in both states, without
  exception.
- **Paused:** a solid white disc, 76dp, with a dark glyph — 19.17:1. This is
  what the app opens into every session, so it gets the strongest treatment in
  the system.
- **Playing:** rain-blue fill, 3dp rain-blue ring, rain-blue glyph, and the
  status word turns with it. Four channels move together; none of them is
  colour alone. Border width is compensated across states so the disc never
  resizes.
- **Never:** `elevation` on Android (it renders an octagonal plate behind the
  glyph at pill radius) or a coloured halo on iOS.

### Dial Row
- **Head:** display type at full opacity, its icon beside it, flanked by the
  ticks. Accent when audible.
- **Neighbours:** the same text, scaled and dimmed on the UI thread from the
  scroll offset — no re-render under a finger, no layout cost.
- **Hit target:** the full row pitch, untransformed. The scale lives on an inner
  view.
- **Edge:** rows fade only in the last half-row of travel, where they are
  already half off-screen. At rest, no visible row is faded at all.

### Timer Chips
- **Style:** pill, glass fill, glass border, 48dp tall, 64dp minimum wide.
- **Selected:** heavier fill and border *plus* a 6dp filled dot. The fill step
  alone measures ~2.1:1 and cannot be a state indicator on a dimmed screen.
- **Never:** signal selection with a font-weight change; it reflows the label
  inside its own chip on every tap.

### Sheets and Panels
- **Corner:** `{rounded.sheet}` on the top edge only, sitting on the field.
- **Background:** `{colors.bg-sheet}`, no shadow, no border.
- **Dismissal:** tap-outside dismisses, via a `Pressable` that is a **sibling**
  of the sheet, never its ancestor — an accessible ancestor collapses its whole
  subtree on iOS.

### Signature: the ambient rain
A full-screen layer behind every other element. Drops are 2dp rules with a
vertical opacity envelope, x-jittered inside equal columns, with a feathered
corridor kept clear around the head and status text. It runs at ~60% level and
~55% speed at rest, and comes up on playback — a speed change, not a restart, so
drop phase survives a play tap. Gated on Reduce Motion; hidden from assistive
tech.

## Do's and Don'ts

### Do:
- **Do** spend the accent only on measured fact. `isAudible` is the gate.
- **Do** give every selected state a second, non-colour channel.
- **Do** put transforms on inner content, never on a hit target.
- **Do** let boxes grow with `fontScale` and let text wrap.
- **Do** gate every animation on `useReducedMotion()` — and remember that
  reduced motion means *reduce motion*, not *snap*: a cross-fade with no
  translation is the correct fallback, and a transition that jumps in one frame
  is worse for the user it was meant to protect.
- **Do** state a deliberate accessibility deviation plainly in the code, with
  the reason and the equivalent path named. The dial's rows at distance 2 and
  beyond are such a deviation.

### Don't:
- **Don't** add a fourth near-black, for any reason, including masking.
- **Don't** paint opaque colour over content to fade or clip an edge.
- **Don't** claim conformance in a comment without measuring. A comment that
  misstates a contrast floor is worse than the deviation it covers, because the
  next person trusts it instead of measuring.
- **Don't** let an element be invisible and interactive at the same time.
  Opacity 0 does not disable hit testing.
- **Don't** use `numberOfLines` to make text fit.
- **Don't** introduce a second colour. If something needs to stand out and the
  accent is taken, the answer is weight, scale or space.

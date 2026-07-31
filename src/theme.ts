/**
 * Visual language for Raining Jewels.
 *
 * Deliberately restrained: near-black neutral background, monochrome
 * white-opacity hierarchy (the app's original identity), and one single
 * muted rain-blue accent used only for the playback state and slider.
 *
 * This file is the single source of truth. Components must not hardcode
 * colors, spacing, radii, font sizes, icon sizes, or durations — every
 * value a component needs is exported here. Two near-blacks previously
 * lived outside this file (`#0a0a0a` in App.tsx/app.json, `#090B0F` in the
 * scroll fade); both are folded into BG_TOP.
 */

/* -------------------------------------------------------------------------
 * Surfaces
 * ---------------------------------------------------------------------- */

export const BG_TOP = '#0D0F14';
export const BG_BOTTOM = '#060709';
export const BG_SHEET = '#14171E';

/**
 * Scrim behind the credits sheet. It used to have a second consumer, the
 * full-screen dim overlay, which is gone: the session state recedes the
 * interface rather than covering it, so this can be tuned for the sheet alone.
 */
export const SCRIM = 'rgba(0,0,0,0.65)';

export const BACKGROUND_GRADIENT = [BG_TOP, BG_BOTTOM] as const;

/* -------------------------------------------------------------------------
 * Accent
 * ---------------------------------------------------------------------- */

export const ACCENT = '#9CC2D4'; // muted rain blue — 10.1:1 on BG_TOP
/**
 * Accent fill for the playing transport. Was 0.15, which composited to
 * #222A31 — 1.32:1, so the state the app holds for fifteen minutes had less
 * visual weight than the state it holds for thirty seconds, and on a dimmed
 * screen the control was a 2px hairline. Product principle 3 says design for
 * the dimmed screen, and playing is the only state that exists there.
 */
export const ACCENT_SOFT = 'rgba(156,194,212,0.32)';

/* -------------------------------------------------------------------------
 * White-alpha ramp
 *
 * Eight ad-hoc steps were in use across the components; this is the whole
 * ramp, and nothing outside it is allowed. Ratios measured against BG_TOP.
 * ---------------------------------------------------------------------- */

export const TEXT_PRIMARY = '#ffffff'; //                  19.17:1
export const TEXT_SECONDARY = 'rgba(255,255,255,0.7)'; //   9.55:1
export const TEXT_TERTIARY = 'rgba(255,255,255,0.55)'; //   6.24:1

/**
 * Non-text UI boundaries. WCAG 1.4.11 requires 3:1 for any boundary needed
 * to identify a control. The previous 0.14 border measured 1.46:1 — every
 * affordance edge in the app, including the paused play button, sat below
 * the visible threshold. 0.35 measures 3.19:1.
 */
export const GLASS_BORDER = 'rgba(255,255,255,0.35)'; //    3.19:1
export const GLASS_FILL = 'rgba(255,255,255,0.10)';

/**
 * Selected state.
 *
 * Measured: SELECTED_FILL against GLASS_FILL is only ~2.1:1, and pushing the
 * fill to a true 3:1 step would need white at roughly 45%, which wrecks the
 * restrained monochrome the product is built on. So selection must NOT rest on
 * the fill step alone — components are required to carry a second, non-colour
 * channel (an indicator mark, not just a heavier border). See SELECTION_DOT.
 */
export const SELECTED_BORDER = 'rgba(255,255,255,0.7)'; //  9.55:1
export const SELECTED_FILL = 'rgba(255,255,255,0.26)';
/** Size of the non-colour selection indicator required alongside the fill. */
export const SELECTION_DOT = 6;

/**
 * Hairline separators inside sheets. Deliberately lighter than GLASS_BORDER:
 * a divider is not an interactive boundary and does not owe 3:1, and giving it
 * the same value made every credits hairline read as heavy as a control edge.
 */
export const DIVIDER = 'rgba(255,255,255,0.18)';

/* -------------------------------------------------------------------------
 * Spacing — 4pt grid, no exceptions
 *
 * Sixteen distinct spacing values were in use, seven of them off-grid
 * (2, 6, 7, 10, 14, 18, 26). Map to the nearest step.
 * ---------------------------------------------------------------------- */

export const SPACE_XXS = 4;
export const SPACE_XS = 8;
export const SPACE_SM = 12;
export const SPACE_MD = 16;
export const SPACE_LG = 24;
export const SPACE_XL = 32;
export const SPACE_XXL = 40;

/* -------------------------------------------------------------------------
 * Radii
 * ---------------------------------------------------------------------- */

export const RADIUS_SM = 12;
export const RADIUS_MD = 20;
export const RADIUS_LG = 24;
export const RADIUS_SHEET = 28;
export const RADIUS_PILL = 999;

/* -------------------------------------------------------------------------
 * Touch targets
 *
 * Platform is `adaptive`: both iOS (44pt) and Android (48dp) minimums apply,
 * so the floor is the stricter of the two. Nothing interactive may be
 * smaller than TOUCH_MIN, including its padding.
 * ---------------------------------------------------------------------- */

export const TOUCH_MIN = 48;
/** Minimum gap between adjacent touch targets (Material). */
export const TOUCH_GAP = 8;

/* -------------------------------------------------------------------------
 * Type scale
 *
 * Nine ad-hoc sizes with no consistent ratio were in use. This is a ~1.25
 * scale. Body copy stays on the system font; the display face is reserved
 * for TITLE and above.
 * ---------------------------------------------------------------------- */

export const FONT_CAPTION = 12;
export const FONT_LABEL = 14;
export const FONT_BODY = 16;
export const FONT_TITLE = 20;
export const FONT_HEADLINE = 26;
export const FONT_DISPLAY_SIZE = 34;

/**
 * Line heights. Without these, multi-line body copy falls back to RN's default
 * leading, which is too tight for the six-line paragraph in the credits sheet.
 * Multiply by the size, do not hardcode: `lineHeight: FONT_LABEL * LEADING_BODY`.
 */
export const LEADING_TIGHT = 1.2; // headings and display
export const LEADING_BODY = 1.5; // paragraphs and multi-line copy

/**
 * Display typeface (Manrope, loaded in App.tsx via @expo-google-fonts/manrope).
 * Used for titles and headings only; body copy stays on the system font.
 */
/**
 * Only weights that `App.tsx` actually loads may appear here. A token naming an
 * unloaded face silently falls back to the system font at every call site while
 * reading as verified — 400Regular was exactly that trap and is deliberately
 * absent. Add the weight to `useFonts` before adding a token for it.
 */
export const FONT_DISPLAY_LIGHT = 'Manrope_300Light';
export const FONT_DISPLAY_MEDIUM = 'Manrope_500Medium';
export const FONT_DISPLAY_SEMIBOLD = 'Manrope_600SemiBold';
export const FONT_DISPLAY_BOLD = 'Manrope_700Bold';

/* -------------------------------------------------------------------------
 * Icons
 * ---------------------------------------------------------------------- */

export const ICON_SM = 16;
export const ICON_MD = 24;
export const ICON_LG = 32;
export const ICON_STROKE = 1.75;

/* -------------------------------------------------------------------------
 * Motion
 *
 * Durations in ms. Every one of these must be gated on reduced motion at
 * the call site; a value here is not permission to animate.
 * ---------------------------------------------------------------------- */

export const DURATION_FAST = 150;
export const DURATION_BASE = 250;
export const DURATION_SLOW = 400;

/** Ramp applied when audio starts, so playback never begins at full level. */
export const AUDIO_FADE_IN_MS = 2500;

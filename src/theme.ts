/**
 * Visual language shared with the Flutter app (lib/theme.dart).
 *
 * Deliberately restrained: near-black neutral background, monochrome
 * white-opacity hierarchy (the app's original identity), and one single
 * muted rain-blue accent used only for the playback state and slider.
 */
export const BG_TOP = '#0D0F14';
export const BG_BOTTOM = '#060709';
export const BG_SHEET = '#14171E';

export const ACCENT = '#9CC2D4'; // muted rain blue
export const ACCENT_SOFT = 'rgba(156,194,212,0.15)';

export const GLASS_FILL = 'rgba(255,255,255,0.06)';
export const GLASS_BORDER = 'rgba(255,255,255,0.14)';
export const SELECTED_FILL = 'rgba(255,255,255,0.16)';
export const SELECTED_BORDER = 'rgba(255,255,255,0.7)';

export const TEXT_PRIMARY = '#ffffff';
export const TEXT_SECONDARY = 'rgba(255,255,255,0.7)';
export const TEXT_TERTIARY = 'rgba(255,255,255,0.55)';

export const BACKGROUND_GRADIENT = [BG_TOP, BG_BOTTOM] as const;

/**
 * Display typeface (Manrope, loaded in App.tsx via @expo-google-fonts/manrope).
 * Used for titles and headings only; body copy stays on the system font.
 */
export const FONT_DISPLAY_LIGHT = 'Manrope_300Light';
export const FONT_DISPLAY_REGULAR = 'Manrope_400Regular';
export const FONT_DISPLAY_MEDIUM = 'Manrope_500Medium';
export const FONT_DISPLAY_SEMIBOLD = 'Manrope_600SemiBold';
export const FONT_DISPLAY_BOLD = 'Manrope_700Bold';

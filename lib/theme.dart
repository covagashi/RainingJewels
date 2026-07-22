import 'package:flutter/material.dart';

/// Visual language shared with the Expo port (src/theme.ts).
///
/// Deliberately restrained: near-black neutral background, monochrome
/// white-opacity hierarchy (the app's original identity), and one single
/// muted rain-blue accent used only for the playback state and slider.
const Color kBgTop = Color(0xFF0D0F14);
const Color kBgBottom = Color(0xFF060709);

const Color kAccent = Color(0xFF9CC2D4); // muted rain blue
const Color kAccentSoft = Color(0x269CC2D4);

const Color kGlassFill = Color(0x0FFFFFFF); // white 6%
const Color kGlassBorder = Color(0x24FFFFFF); // white 14%
const Color kSelectedFill = Color(0x29FFFFFF); // white 16%

const Color kTextPrimary = Colors.white;
const Color kTextSecondary = Colors.white70;
const Color kTextTertiary = Colors.white38;

const LinearGradient kBackgroundGradient = LinearGradient(
  begin: Alignment.topCenter,
  end: Alignment.bottomCenter,
  colors: [kBgTop, kBgBottom],
);

// Kept for the modal sheets.
const Color kBgMid = Color(0xFF14171E);

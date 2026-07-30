import Slider from '@react-native-community/slider';
import * as Brightness from 'expo-brightness';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { Info, Pause, Play, RotateCcw, Timer, Volume1, Volume2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AccessibilityState,
  AppState,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  findNodeHandle,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import CreditsModal from './CreditsModal';
import { getSoundIcon } from './icons';
import { ALL_SOUNDS, FEATURED_SOUNDS, MORE_SOUNDS, Sound } from './sounds';
import {
  getLastSoundId,
  getVolume as getStoredVolume,
  setLastSoundId,
  setVolume as setStoredVolume,
} from './storage';
import {
  ACCENT,
  ACCENT_SOFT,
  AUDIO_FADE_IN_MS,
  BACKGROUND_GRADIENT,
  BG_TOP,
  DURATION_BASE,
  DURATION_SLOW,
  FONT_BODY,
  FONT_CAPTION,
  FONT_DISPLAY_LIGHT,
  FONT_DISPLAY_SEMIBOLD,
  FONT_HEADLINE,
  FONT_LABEL,
  FONT_TITLE,
  GLASS_BORDER,
  GLASS_FILL,
  ICON_MD,
  ICON_SM,
  ICON_STROKE,
  RADIUS_LG,
  RADIUS_PILL,
  SCROLL_FADE_GRADIENT,
  SELECTED_BORDER,
  SELECTED_FILL,
  SELECTION_DOT,
  SPACE_LG,
  SPACE_MD,
  SPACE_SM,
  SPACE_XL,
  SPACE_XS,
  SPACE_XXS,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  TOUCH_MIN,
} from './theme';

const DIM_AFTER_MS = 2 * 60 * 1000;
/**
 * Session-state brightness floor. Was 0.1 — under a 65% black scrim, which put
 * the whole interface below the legibility floor and made the first touch a
 * tax. The scrim is gone (see "recede, don't disappear" in PRODUCT.md), so this
 * is a *legible* dim, not a blackout: the sound name and the transport have to
 * survive it without being reached for blind.
 */
const DIMMED_BRIGHTNESS = 0.28;
/**
 * How long the interface takes to recede. Deliberately not DURATION_SLOW —
 * this is a room dimming, not a UI transition, and at 400ms it reads as the
 * screen breaking. Coming back is fast (DURATION_BASE): the user has just
 * reached for a control and is waiting on it.
 */
const SESSION_RECEDE_MS = 3200;
const TIMER_OPTIONS = [0, 15, 30, 60];

/**
 * Ambient rain. A full-screen layer behind every other element, not a box in
 * mid-air: it was clipped to the 240dp centre zone, where drops stopped dead at
 * two horizontal lines and one of them parked on the word "Playing" and read as
 * a text cursor. Full-screen means it can be much fainter and still register,
 * and each drop carries a vertical opacity envelope so it fades into and out of
 * its travel rather than popping on at a clip edge.
 */
const RAIN_DROP_COUNT = 46;
const RAIN_DROP_WIDTH = 2;
const RAIN_OPACITY_MIN = 0.09;
const RAIN_OPACITY_RANGE = 0.13;
/** Fraction of a drop's travel spent fading in, and again fading out. */
const RAIN_ENVELOPE = 0.14;
/** Softness of the edge of the cleared corridor around the title/status text. */
const RAIN_CORRIDOR_FEATHER = 56;
/**
 * Drops outside this horizontal band ignore the text corridor. Rain that
 * continues past the edges of the type reads as depth; rain that stops in a
 * clean stripe across the whole screen reads as a bug.
 */
const RAIN_CORRIDOR_X_MIN = 0.12;
const RAIN_CORRIDOR_X_MAX = 0.88;

/** Press-feedback spring. Physics, not a design token — theme.ts exports none. */
const PRESS_SPRING = { damping: 18, stiffness: 320 };
/** Steps used to ramp volume in when playback starts. */
const FADE_STEPS = 25;
/** Seconds before the timer expires over which audio rides down to zero. */
const FADE_OUT_WINDOW_S = 30;
/**
 * Switching sounds. `replace()` cuts the outgoing sound dead, which is a hard
 * edit in the middle of a session — and browsing is the common case in a
 * 31-sound library. Ride the outgoing sound down first, then bring the incoming
 * one up over a shorter ramp than the from-silence onset, which is the only
 * moment that warrants the full AUDIO_FADE_IN_MS swell.
 */
const AUDIO_CROSSFADE_OUT_MS = 320;
const AUDIO_CROSSFADE_IN_MS = 900;
/**
 * From-silence onset. AUDIO_FADE_IN_MS (2500) is the theme's ceiling and stays
 * the contract, but two and a half seconds is longer than the app's whole
 * promise: one tap, then sound. For most of that ramp nothing was audible while
 * the interface claimed "Playing", and the natural response — tap again —
 * paused. The crossfade-in already sits at 900ms and reads fine; the onset gets
 * a little more swell than that and no more. Clamped to the token so it can
 * never exceed it.
 */
const AUDIO_ONSET_IN_MS = Math.min(1100, AUDIO_FADE_IN_MS);
/**
 * Level at which a ramp is treated as actually audible. Below it the status
 * line says "Starting…", never "Playing" — this is the one place the interface
 * could tell a screen-reader user something false.
 */
const AUDIBLE_LEVEL = 0.05;

/** Diameter of the hero transport control. */
const PLAY_BUTTON_SIZE = 76;
/**
 * Centre zone. Left to `flex: 1` it absorbed every surplus pixel on the screen
 * — roughly 700 of them on a large phone — and, because it centred its
 * children, mounting the error row shoved the play button up at the exact
 * moment playback failed. The zone is bounded instead: its children are
 * top-anchored, the failure row's slot is always mounted, and the surplus is
 * split into the two flexible spacers around the zone.
 */
const CENTER_STACK_HEIGHT = 208;
/**
 * Breathing room under the transport. Not an error reservation — the failure
 * row is out of flow — just enough that the title and control are not crowded
 * against the picker above them.
 */
const CENTER_STACK_PADDING = 32;
/** The zone never takes more than this share of a short screen. */
const CENTER_ZONE_MAX_FRACTION = 0.42;

/* Tile and chip geometry. Every one of these boxes carries text, so each is a
 * base size that grows with the OS text size rather than a fixed dimension. */
const FEATURED_TILE_SIZE = 88;
const STRIP_TILE_SIZE = 68;
const TIMER_CHIP_MIN_WIDTH = 64;
/**
 * Ceiling on how far a text-bearing box may grow. The text itself is never
 * capped and never clipped — only the box, and only so that a 200% tile does
 * not push the whole picker off screen. Labels wrap; nothing is truncated.
 */
const MAX_BOX_SCALE = 1.6;

/**
 * Playback failure copy: names the sound that would not load and the single
 * action that recovers it. The audio is bundled, so this is never a network
 * problem and must not be described as one.
 */
const playbackErrorFor = (soundName: string) =>
  `Couldn't load ${soundName}. Tap Retry to play it again.`;

// --- Press feedback wrapper ---------------------------------------------

interface PressableScaleProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'radio';
  accessibilityState?: AccessibilityState;
}

function PressableScale({
  onPress,
  style,
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={accessibilityState}
        onPressIn={() => {
          if (reducedMotion) return;
          scale.value = withSpring(0.96, PRESS_SPRING);
        }}
        onPressOut={() => {
          if (reducedMotion) return;
          scale.value = withSpring(1, PRESS_SPRING);
        }}
        onPress={onPress}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// --- Ambient rain layer -------------------------------------------------

interface DropConfig {
  xFrac: number;
  height: number;
  opacity: number;
  duration: number;
  delay: number;
  /** False for drops in the outer margins, which fall past the type freely. */
  avoidsText: boolean;
}

function RainDrop({
  config,
  playing,
  left,
  travel,
  corridorTop,
  corridorBottom,
}: {
  config: DropConfig;
  playing: boolean;
  left: number;
  travel: number;
  corridorTop: number;
  corridorBottom: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (playing) {
      progress.value = 0;
      progress.value = withDelay(
        config.delay,
        withRepeat(
          withTiming(1, { duration: config.duration, easing: Easing.linear }),
          -1,
          false,
        ),
      );
    } else {
      cancelAnimation(progress);
    }
  }, [playing, config, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const y = -config.height + p * (travel + config.height * 2);
    // Fades into and out of its own travel, so no drop ever appears or
    // vanishes at a hard line.
    const envelope = interpolate(
      p,
      [0, RAIN_ENVELOPE, 1 - RAIN_ENVELOPE, 1],
      [0, 1, 1, 0],
      Extrapolation.CLAMP,
    );
    // Corridor: the sound name, the transport and the status line keep clear
    // air around them. A drop crossing that band thins out and comes back.
    let corridor = 1;
    if (config.avoidsText && corridorBottom > corridorTop) {
      const mid = y + config.height / 2;
      corridor = interpolate(
        mid,
        [
          corridorTop - RAIN_CORRIDOR_FEATHER,
          corridorTop,
          corridorBottom,
          corridorBottom + RAIN_CORRIDOR_FEATHER,
        ],
        [1, 0, 0, 1],
        Extrapolation.CLAMP,
      );
    }
    return {
      opacity: config.opacity * envelope * corridor,
      transform: [{ translateY: y }],
    };
  });

  return (
    <Animated.View
      style={[styles.rainDrop, { left, height: config.height }, animatedStyle]}
    />
  );
}

/**
 * Memoised: its props are a stable drop list plus three primitives, and without
 * this all 46 drops re-rendered on every parent render — once a second for the
 * whole length of a stop timer.
 */
const RainLayer = React.memo(function RainLayer({
  playing,
  drops,
  corridorTop,
  corridorBottom,
}: {
  playing: boolean;
  drops: DropConfig[];
  corridorTop: number;
  corridorBottom: number;
}) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const layerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(playing ? 1 : 0, { duration: DURATION_SLOW }),
  }));
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.rainLayer, layerStyle]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setLayout({ width, height });
      }}
    >
      {layout.height > 0 &&
        drops.map((config, i) => (
          <RainDrop
            key={i}
            config={config}
            playing={playing}
            left={config.xFrac * layout.width}
            travel={layout.height}
            corridorTop={corridorTop}
            corridorBottom={corridorBottom}
          />
        ))}
    </Animated.View>
  );
});

// --- Sound tile ---------------------------------------------------------

/**
 * Hoisted and memoised. Defined in the component body it rebuilt all 31 tiles
 * on every render — sixty times a minute while a stop timer counts down, for a
 * strip whose contents never change. `onSelect` is a stable callback, so the
 * memo actually holds.
 */
interface SoundTileProps {
  sound: Sound;
  index: number;
  size: number;
  isSelected: boolean;
  playing: boolean;
  onSelect: (index: number) => void;
}

const SoundTile = React.memo(function SoundTile({
  sound,
  index,
  size,
  isSelected,
  playing,
  onSelect,
}: SoundTileProps) {
  const Icon = getSoundIcon(sound.id);
  const iconColor = isSelected
    ? playing
      ? ACCENT
      : TEXT_PRIMARY
    : TEXT_SECONDARY;
  return (
    <View style={styles.tileWrap}>
      <PressableScale
        onPress={() => onSelect(index)}
        accessibilityLabel={sound.name}
        accessibilityHint={
          isSelected ? 'Pauses or resumes this sound' : 'Plays this sound'
        }
        accessibilityState={{ selected: isSelected }}
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            borderRadius: size * 0.3,
            backgroundColor: isSelected ? SELECTED_FILL : GLASS_FILL,
            borderColor: isSelected ? SELECTED_BORDER : GLASS_BORDER,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
        <Icon
          size={Math.round(size * 0.36)}
          color={iconColor}
          strokeWidth={ICON_STROKE}
        />
        {/* Second, non-colour selection channel. The fill step alone is
            ~2.1:1 against an unselected tile and the border step 2.98:1 —
            both below the 3:1 floor, and the app dims itself mid-session.
            A filled mark survives that; a colour step does not. */}
        {isSelected && (
          <View
            style={[
              styles.selectionDot,
              { backgroundColor: playing ? ACCENT : TEXT_PRIMARY },
            ]}
          />
        )}
      </PressableScale>
      <Text
        style={[
          styles.tileLabel,
          {
            color: isSelected ? TEXT_PRIMARY : TEXT_TERTIARY,
            // Bound to the tile it names, and grows with it. No
            // numberOfLines: a long name at 200% wraps onto a second line
            // rather than being cut in half.
            maxWidth: Math.round(size * 1.5),
          },
        ]}
      >
        {sound.name}
      </Text>
    </View>
  );
});

export default function PlayerScreen() {
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const reducedMotion = useReducedMotion();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [creditsVisible, setCreditsVisible] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  /**
   * True from the moment a from-silence ramp starts until it is actually
   * audible. `status.playing` is true from step 0 of that ramp, so keying the
   * status line off it claimed sound before there was any.
   */
  const [isStarting, setIsStarting] = useState(false);

  // Set while a volume ramp is in flight. Any user interaction bumps this so
  // the running loop sees a stale token and abandons its remaining steps.
  const fadeTokenRef = useRef(0);

  // Id of the sound currently loaded into the player (so play after pause
  // resumes instead of restarting via replace).
  const loadedSoundIdRef = useRef<string | null>(null);

  // Bumped by every sound switch, so a switch that is still fading its outgoing
  // sound out can tell whether a newer switch has superseded it.
  const startTokenRef = useRef(0);

  // Sleep timer
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session state. Not a blackout: the interface recedes to the sound name,
  // the transport and the rain, and the system brightness drops to a legible
  // floor. Any touch brings it back — and is not consumed doing so.
  const [inSession, setInSession] = useState(false);
  const dimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalBrightnessRef = useRef<number | null>(null);
  // Bumped by every interaction. The arming effect watches it, so a scroll, a
  // slider drag or a tap re-arms the countdown without any handler having to
  // know about timers.
  const [awakeToken, setAwakeToken] = useState(0);

  // The "More sounds" strip, so the marked tile can be brought into view.
  const stripScrollRef = useRef<ScrollView>(null);
  // Focus target when the interface recedes, so a screen reader is not left on
  // an element that has just been hidden.
  const transportRef = useRef<View>(null);

  const selectedSound = ALL_SOUNDS[selectedIndex];

  // Every box below that contains text has to grow with the OS text size.
  // Clipping a label to protect its box is never the right trade, so the boxes
  // move instead. Growth is clamped (the text is not) so that a 200% tile does
  // not consume the screen and strand the picker.
  const {
    width: screenWidth,
    height: screenHeight,
    fontScale,
  } = useWindowDimensions();
  const boxScale = Math.min(Math.max(fontScale, 1), MAX_BOX_SCALE);
  const featuredTileSize = Math.max(
    FEATURED_TILE_SIZE,
    Math.min(
      Math.round(FEATURED_TILE_SIZE * boxScale),
      Math.floor(
        (screenWidth - SPACE_LG * 2 - SPACE_MD * 2) / FEATURED_SOUNDS.length,
      ),
    ),
  );
  const stripTileSize = Math.round(STRIP_TILE_SIZE * boxScale);

  // Bounded centre zone: the title, the transport and the status line, plus a
  // little breathing room — and no more. Everything left over goes to the
  // spacers above and below it, so the surplus never pools into one void.
  const centerZoneHeight = Math.round(
    Math.min(
      (CENTER_STACK_HEIGHT + CENTER_STACK_PADDING) * boxScale,
      screenHeight * CENTER_ZONE_MAX_FRACTION,
    ),
  );

  // Vertical band the rain keeps clear, in the gradient's own coordinates.
  // Measured rather than assumed, because the centre zone's height moves with
  // fontScale and with the screen.
  const [corridor, setCorridor] = useState({ top: 0, bottom: 0 });

  // Ambient rain drop configs, generated once per mount. x is jittered inside
  // N equal columns rather than drawn from raw Math.random(), which clumped the
  // drops into the right half and left a bare band down the left.
  const drops = useMemo<DropConfig[]>(
    () =>
      Array.from({ length: RAIN_DROP_COUNT }, (_, i) => {
        const column = (i + 0.5) / RAIN_DROP_COUNT;
        const jitter = (Math.random() - 0.5) * (0.9 / RAIN_DROP_COUNT);
        const xFrac = Math.min(0.98, Math.max(0.02, column + jitter));
        return {
          xFrac,
          height: 14 + Math.random() * 12,
          opacity: RAIN_OPACITY_MIN + Math.random() * RAIN_OPACITY_RANGE,
          // Full-screen travel, so a drop needs longer to cross than it did in
          // a 240dp box if it is to keep the same apparent speed.
          duration: 2800 + Math.random() * 2400,
          delay: Math.random() * 3200,
          avoidsText:
            xFrac > RAIN_CORRIDOR_X_MIN && xFrac < RAIN_CORRIDOR_X_MAX,
        };
      }),
    [],
  );

  useEffect(() => {
    // doNotMix is required for lock screen controls / sustained background
    // playback on Android (see expo-audio docs).
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
    return () => {
      try {
        player.setActiveForLockScreen(false);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the screen awake only while audio is actually playing. Holding the
  // lock for the whole screen lifetime lit the display all night, which works
  // against the product and burns battery for nothing.
  useEffect(() => {
    if (!status.playing) return;
    activateKeepAwakeAsync().catch(() => {});
    return () => {
      try {
        deactivateKeepAwake();
      } catch {}
    };
  }, [status.playing]);

  // Surface decoder / load failures instead of leaving the UI stuck on
  // "Paused" with no explanation.
  useEffect(() => {
    if (status.error) {
      setPlaybackError(playbackErrorFor(selectedSound.name));
    } else if (status.playing) {
      setPlaybackError(null);
    }
  }, [status.error, status.playing, selectedSound.name]);

  // accessibilityLiveRegion is Android-only, so on iOS every playback state
  // change and every failure was silent. Announce the transitions that matter —
  // and only the transitions, never a render or a countdown tick.
  /**
   * Announces the *settled* state only. "Starting…" is never spoken: it is a
   * sub-second transient, and announcing it would mean a screen-reader user
   * hears three states for one tap. Going straight from starting to paused
   * (tapped again during the ramp) still announces the pause.
   */
  const announcedStateRef = useRef<'playing' | 'paused' | 'starting' | null>(
    null,
  );
  /** Set when the stop timer pauses playback, so the stop is announced once. */
  const timerStoppedRef = useRef(false);
  useEffect(() => {
    const state = !status.playing ? 'paused' : isStarting ? 'starting' : 'playing';
    if (announcedStateRef.current === null) {
      announcedStateRef.current = state;
      return;
    }
    if (announcedStateRef.current === state) return;
    announcedStateRef.current = state;
    if (state === 'starting') return;
    if (state === 'paused' && timerStoppedRef.current) {
      timerStoppedRef.current = false;
      return;
    }
    AccessibilityInfo.announceForAccessibility(
      state === 'playing'
        ? `Playing ${selectedSound.name}`
        : `Paused ${selectedSound.name}`,
    );
  }, [status.playing, isStarting, selectedSound.name]);

  const announcedErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (playbackError != null && playbackError !== announcedErrorRef.current) {
      AccessibilityInfo.announceForAccessibility(playbackError);
    }
    announcedErrorRef.current = playbackError;
  }, [playbackError]);

  // Bring the marked tile into view — on restore and on tap. Without this the
  // app could restore a sound, name it in the centre title, and leave its tile
  // eight tiles off the right edge of the strip.
  useEffect(() => {
    const stripIndex = selectedIndex - FEATURED_SOUNDS.length;
    if (stripIndex < 0) {
      stripScrollRef.current?.scrollTo({ x: 0, animated: !reducedMotion });
      return;
    }
    const pitch = stripTileSize + SPACE_SM;
    const x = Math.max(
      0,
      SPACE_LG + stripIndex * pitch - (screenWidth - stripTileSize) / 2,
    );
    stripScrollRef.current?.scrollTo({ x, animated: !reducedMotion });
  }, [selectedIndex, stripTileSize, screenWidth, reducedMotion]);

  // Restore persisted volume + last selected sound (no auto-play).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedVolume, lastId] = await Promise.all([
        getStoredVolume(),
        getLastSoundId(),
      ]);
      if (cancelled) return;
      if (storedVolume != null) {
        setVolume(storedVolume);
        player.volume = storedVolume;
      }
      if (lastId != null) {
        const index = ALL_SOUNDS.findIndex((s) => s.id === lastId);
        if (index >= 0) setSelectedIndex(index);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Session state / screen dimming ----------------------------------

  const clearDimTimer = useCallback(() => {
    if (dimTimerRef.current) {
      clearTimeout(dimTimerRef.current);
      dimTimerRef.current = null;
    }
  }, []);

  const armDimTimer = useCallback(() => {
    if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
    dimTimerRef.current = setTimeout(async () => {
      try {
        // No permission request here, ever. setBrightnessAsync is scoped to
        // this activity on Android and needs no grant; the permission that was
        // being requested gates *system* brightness (WRITE_SETTINGS), which
        // Android grants only through a system Settings activity — so asking
        // for it threw the user out of the app two minutes into every session,
        // at the exact moment they were trying to settle.
        originalBrightnessRef.current = await Brightness.getBrightnessAsync();
        await Brightness.setBrightnessAsync(DIMMED_BRIGHTNESS);
        // Only claim the screen is dimmed once it actually is.
        setInSession(true);
      } catch {}
    }, DIM_AFTER_MS);
  }, []);

  const restoreBrightness = useCallback(() => {
    if (originalBrightnessRef.current == null) return;
    Brightness.setBrightnessAsync(originalBrightnessRef.current).catch(() => {});
    originalBrightnessRef.current = null;
  }, []);

  /** Leaves the session state: brightness back, interface back. */
  const restoreInterface = useCallback(() => {
    setInSession(false);
    restoreBrightness();
  }, [restoreBrightness]);

  /**
   * Every interaction lands here. It no longer arms anything itself — arming is
   * derived from playback plus this token — so it is safe to call from a scroll
   * begin or a slider tick as well as from a press.
   */
  const wake = useCallback(() => {
    restoreInterface();
    setAwakeToken((t) => t + 1);
  }, [restoreInterface]);

  /**
   * The dim counts sound, not screen time. Armed from a mount effect it blacked
   * the screen out on someone two minutes into browsing 31 sounds with nothing
   * playing — while they were physically touching the device. It now arms on
   * playback, re-arms on every interaction, and is cleared when playback stops.
   */
  useEffect(() => {
    if (!status.playing) {
      clearDimTimer();
      return;
    }
    armDimTimer();
    return clearDimTimer;
  }, [status.playing, awakeToken, armDimTimer, clearDimTimer]);

  // Sound stopping ends the session, whether the user paused it or the stop
  // timer did. Nothing is playing, so nothing is being receded for.
  useEffect(() => {
    if (!status.playing && inSession) restoreInterface();
  }, [status.playing, inSession, restoreInterface]);

  useEffect(() => {
    return () => {
      if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      restoreBrightness();
    };
  }, [restoreBrightness]);

  // On iOS brightness is a system-wide setting, so a force-quit while dimmed
  // would strand the user's phone at the session floor with no way to connect
  // it back to this app. Hand it back as soon as we lose the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        restoreBrightness();
        setInSession(false);
      } else if (next === 'active') {
        // Re-arm from now. A countdown that ran to zero while the app was in
        // the background counted two minutes the user never saw.
        setAwakeToken((t) => t + 1);
      }
    });
    return () => sub.remove();
  }, [restoreBrightness]);

  // --- Receding interface ----------------------------------------------

  /** 0 = full interface, 1 = session state. */
  const recede = useSharedValue(0);
  useEffect(() => {
    const target = inSession ? 1 : 0;
    cancelAnimation(recede);
    recede.value = reducedMotion
      ? target
      : withTiming(target, {
          // Slow going away, quick coming back: receding is ambient, restoring
          // is a response to a finger already on the glass.
          duration: inSession ? SESSION_RECEDE_MS : DURATION_BASE,
          easing: Easing.inOut(Easing.quad),
        });
  }, [inSession, reducedMotion, recede]);

  const recedeStyle = useAnimatedStyle(() => ({ opacity: 1 - recede.value }));

  // Announce the change and move focus onto the transport, which is one of the
  // three things that survives it. Without this a screen reader is left on a
  // control that has just been hidden, with no idea the screen changed.
  const announcedSessionRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (announcedSessionRef.current === inSession) return;
    if (announcedSessionRef.current === null) {
      announcedSessionRef.current = inSession;
      return;
    }
    announcedSessionRef.current = inSession;
    if (inSession) {
      AccessibilityInfo.announceForAccessibility(
        'Session view. The sound controls are hidden. Touch the screen to bring them back.',
      );
      const tag = transportRef.current
        ? findNodeHandle(transportRef.current)
        : null;
      if (tag != null) AccessibilityInfo.setAccessibilityFocus(tag);
    } else {
      AccessibilityInfo.announceForAccessibility('Sound controls shown.');
    }
  }, [inSession]);

  // --- Playback -------------------------------------------------------

  /**
   * Ramps player volume from `from` to `to` across `durationMs`. Abandoned as
   * soon as another interaction bumps the fade token, so a tap during a ramp
   * never fights it. Resolves true only if it ran to completion unopposed.
   */
  const rampVolume = useCallback(
    async (from: number, to: number, durationMs: number, isOnset = false) => {
      const token = ++fadeTokenRef.current;
      // Below this the ramp is inaudible, so the interface must not claim to
      // be playing. `to` is the user's own level, which can itself be tiny.
      const audibleAt = Math.min(AUDIBLE_LEVEL, to);
      for (let i = 1; i <= FADE_STEPS; i += 1) {
        if (fadeTokenRef.current !== token) return false;
        const level = from + (to - from) * (i / FADE_STEPS);
        player.volume = level;
        // Identical value, so React bails out — this is not a re-render per
        // step, it is one transition at the moment sound arrives.
        if (isOnset && level >= audibleAt) setIsStarting(false);
        await new Promise((r) => setTimeout(r, durationMs / FADE_STEPS));
      }
      if (fadeTokenRef.current !== token) return false;
      player.volume = to;
      if (isOnset) setIsStarting(false);
      return true;
    },
    [player],
  );

  const startSound = async (index: number) => {
    const sound = ALL_SOUNDS[index];
    const wasPlaying = status.playing;
    const startToken = ++startTokenRef.current;
    try {
      if (wasPlaying) {
        // Ride the outgoing sound down before replace() cuts it dead. A volume
        // drag mid-fade abandons the ramp but not the switch; only a newer
        // start supersedes this one, and then this call bows out.
        const level = typeof player.volume === 'number' ? player.volume : volume;
        await rampVolume(level, 0, AUDIO_CROSSFADE_OUT_MS);
        if (startTokenRef.current !== startToken) return;
      }
      player.replace(sound.source);
      player.loop = true;
      // Start silent and ramp up: the user is awake and deliberately opening a
      // session, so entry is the moment that matters. Full-volume onset jolts.
      // Onset from silence gets the longer swell; a swap while already playing
      // gets a shorter one, because the ear has nothing to adjust to.
      player.volume = 0;
      player.play();
      loadedSoundIdRef.current = sound.id;
      setPlaybackError(null);
      if (!wasPlaying) setIsStarting(true);
      rampVolume(
        0,
        volume,
        wasPlaying ? AUDIO_CROSSFADE_IN_MS : AUDIO_ONSET_IN_MS,
        !wasPlaying,
      );
    } catch {
      setIsStarting(false);
      setPlaybackError(playbackErrorFor(sound.name));
      return;
    }

    // Media notification / lock screen controls; also required for
    // sustained background playback on Android.
    try {
      player.setActiveForLockScreen(
        true,
        { title: sound.name, artist: 'Jewel Rain', albumTitle: 'Ambient sounds' },
        { showSeekForward: false, showSeekBackward: false, isLiveStream: true },
      );
    } catch {
      // Lock screen controls are unavailable in Expo Go. Playback still works,
      // so this must not surface as a playback error.
    }
  };

  const onSoundTap = (index: number) => {
    wake();
    Haptics.selectionAsync();

    // Tapping the selected sound toggles play/pause (resume, not restart).
    if (index === selectedIndex) {
      if (status.playing) {
        player.pause();
        return;
      }
      if (loadedSoundIdRef.current === ALL_SOUNDS[index].id) {
        player.play();
        return;
      }
      startSound(index);
      return;
    }

    setSelectedIndex(index);
    setLastSoundId(ALL_SOUNDS[index].id);
    startSound(index);
  };

  // `onSoundTap` closes over selection and playback state, so it is a new
  // function on every render — which would defeat the memoised tile. The ref
  // keeps the handler current while the prop the tiles see never changes.
  const onSoundTapRef = useRef(onSoundTap);
  onSoundTapRef.current = onSoundTap;
  const handleTilePress = useCallback((index: number) => {
    onSoundTapRef.current(index);
  }, []);

  const togglePlayPause = () => {
    wake();
    Haptics.selectionAsync();
    if (status.playing) {
      player.pause();
      return;
    }
    if (loadedSoundIdRef.current === selectedSound.id) {
      player.play();
      return;
    }
    startSound(selectedIndex);
  };

  const onVolumeChange = (value: number) => {
    // A slider drag is the user telling us they are here. It never reached
    // wake(), so two minutes of adjusting volume dimmed the screen mid-drag.
    wake();
    // Cancel any ramp in flight so it cannot overwrite the user's own choice.
    // The onset ramp is one of those, so the transient status goes with it.
    fadeTokenRef.current += 1;
    setIsStarting(false);
    setVolume(value);
    player.volume = value;
  };

  const retryPlayback = () => {
    setPlaybackError(null);
    startSound(selectedIndex);
  };

  // --- Stop timer -------------------------------------------------------

  const setStopTimer = (minutes: number) => {
    wake();
    Haptics.selectionAsync();

    // Leaving a partially-faded volume behind would silently lower every later
    // session. Cancel any ramp and restore the user's level.
    fadeTokenRef.current += 1;
    setIsStarting(false);
    player.volume = volume;

    setTimerMinutes(minutes);
    setRemainingSeconds(minutes * 60);
  };

  // The countdown runs only while audio is actually playing. "Stop after 15
  // minutes" has to mean fifteen minutes of sound: pausing for a phone call and
  // coming back must not eat the session. The interval only counts — the stop
  // is handled in the effect below, because calling it from inside a state
  // updater made React 19 StrictMode fire the fade twice in development.
  useEffect(() => {
    if (timerMinutes === 0 || !status.playing) return;
    countdownRef.current = setInterval(() => {
      setRemainingSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [timerMinutes, status.playing]);

  // Stop-timer fade. Rather than dropping the volume in the last second, ride
  // it down across the final FADE_OUT_WINDOW_S so the sound thins out before it
  // is gone. Re-derived from `volume` each tick, so changing the slider mid-fade
  // scales the ramp instead of fighting it.
  useEffect(() => {
    if (timerMinutes === 0) return;
    if (remainingSeconds > FADE_OUT_WINDOW_S) return;

    if (remainingSeconds > 0) {
      // Paused inside the fade window: hand the level back, since the countdown
      // is paused too and the fade resumes from here when playback does.
      player.volume = status.playing
        ? volume * (remainingSeconds / FADE_OUT_WINDOW_S)
        : volume;
      return;
    }

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    timerStoppedRef.current = true;
    try {
      player.pause();
    } catch {}
    player.volume = volume;
    setTimerMinutes(0);
    AccessibilityInfo.announceForAccessibility(
      'Stop timer finished. Playback stopped.',
    );
  }, [remainingSeconds, timerMinutes, player, volume, status.playing]);

  const formatTimer = () => {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // --- UI ---------------------------------------------------------------

  /**
   * Three states, not two. `status.playing` is true from the first step of the
   * onset ramp, so "Playing" was on screen up to two and a half seconds before
   * anything was audible — and the natural response to a silent "Playing" is to
   * tap again, which pauses. "Starting…" holds that gap; only a ramp that has
   * actually crossed an audible level gets to say Playing.
   *
   * A slider dragged to zero produces silence too, and "Playing" over silence
   * is indistinguishable from the failure the error row exists to catch.
   */
  const isAudible = status.playing && volume > 0 && !isStarting;
  const statusLabel = !status.playing
    ? 'Paused'
    : volume === 0
      ? 'Playing, volume off'
      : isStarting
        ? 'Starting…'
        : 'Playing';

  /** Props shared by every block that recedes when the session state engages. */
  const recedingProps = {
    accessibilityElementsHidden: inSession,
    importantForAccessibility: (inSession
      ? 'no-hide-descendants'
      : 'auto') as 'no-hide-descendants' | 'auto',
  };

  return (
    /* accessible={false} is load-bearing: RN defaults it to true, and an
       accessible wrapper collapses every descendant into a single element on
       iOS — which hid all 31 tiles, the transport and the slider from VoiceOver. */
    <Pressable style={styles.flex} onPress={wake} accessible={false}>
      <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.flex}>
        {/* Ambient rain: a full-screen layer behind every other element, and
            the one thing besides the sound name and the transport that stays
            when the interface recedes. */}
        {!reducedMotion && (
          <RainLayer
            playing={status.playing}
            drops={drops}
            corridorTop={corridor.top}
            corridorBottom={corridor.bottom}
          />
        )}

        {/* Header */}
        <Animated.View
          style={[styles.header, recedeStyle]}
          {...recedingProps}
        >
          <View style={styles.flex}>
            <Text style={styles.appTitle} accessibilityRole="header">
              Jewel Rain
            </Text>
            <Text style={styles.appSubtitle}>Pick a sound and settle in</Text>
          </View>
          <PressableScale
            style={styles.infoButton}
            accessibilityLabel="Sound credits"
            accessibilityHint="Shows who recorded each sound and its licence"
            onPress={() => {
              wake();
              setCreditsVisible(true);
            }}
          >
            <Info size={ICON_SM} color={TEXT_SECONDARY} strokeWidth={ICON_STROKE} />
          </PressableScale>
        </Animated.View>

        {/* Featured sounds. Labelled like every other tile: Rain, Thunder and
            Wind were readable only by decoding their glyphs. The row carries a
            list role, or three sounds announce as three unrelated buttons. */}
        <Animated.View
          style={[styles.featuredRow, recedeStyle]}
          accessibilityRole="list"
          accessibilityLabel={`Featured sounds, ${FEATURED_SOUNDS.length} items`}
          {...recedingProps}
        >
          {FEATURED_SOUNDS.map((sound, i) => (
            <SoundTile
              key={sound.id}
              sound={sound}
              index={i}
              size={featuredTileSize}
              isSelected={selectedIndex === i}
              playing={status.playing}
              onSelect={handleTilePress}
            />
          ))}
        </Animated.View>

        {/* More sounds */}
        <Animated.View style={recedeStyle} {...recedingProps}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            MORE SOUNDS
          </Text>
          <View style={styles.moreSoundsWrap}>
            <ScrollView
              ref={stripScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.moreSoundsScroll}
              contentContainerStyle={styles.moreSoundsContent}
              accessibilityRole="list"
              accessibilityLabel={`More sounds, ${MORE_SOUNDS.length} items`}
              // A scroll gesture takes the responder, so the root Pressable's
              // onPress never fires while the user browses — which is exactly
              // the two minutes the dim timer was counting.
              onScrollBeginDrag={wake}
            >
              {MORE_SOUNDS.map((sound, i) => (
                <SoundTile
                  key={sound.id}
                  sound={sound}
                  index={FEATURED_SOUNDS.length + i}
                  size={stripTileSize}
                  isSelected={selectedIndex === FEATURED_SOUNDS.length + i}
                  playing={status.playing}
                  onSelect={handleTilePress}
                />
              ))}
            </ScrollView>
            <LinearGradient
              colors={SCROLL_FADE_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scrollFade}
              pointerEvents="none"
            />
          </View>
        </Animated.View>

        {/* Surplus vertical space is split above and below the centre zone
            rather than pooling into one 700px void between the strip and the
            controls card. */}
        <View style={styles.spacer} />

        {/* Now playing. This block does not recede — the sound name, the
            transport and the status line are the session state. */}
        <View
          style={[styles.centerZone, { height: centerZoneHeight }]}
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            setCorridor((prev) =>
              prev.top === y && prev.bottom === y + height
                ? prev
                : { top: y, bottom: y + height },
            );
          }}
        >
          <Text style={styles.soundTitle}>{selectedSound.name}</Text>
          <View ref={transportRef} collapsable={false}>
            <PressableScale
              onPress={togglePlayPause}
              accessibilityLabel={
                status.playing
                  ? `Pause ${selectedSound.name}`
                  : `Play ${selectedSound.name}`
              }
              accessibilityState={{ selected: status.playing }}
              style={[
                styles.playButton,
                status.playing && styles.playButtonActive,
              ]}
            >
              {status.playing ? (
                <Pause size={ICON_MD} color={ACCENT} strokeWidth={ICON_STROKE} />
              ) : (
                <Play
                  size={ICON_MD}
                  color={BG_TOP}
                  strokeWidth={ICON_STROKE}
                  style={styles.playIconNudge}
                />
              )}
            </PressableScale>
          </View>
          <Text
            // Muted while starting: the live region would otherwise read the
            // transient out loud, so one tap would announce three states.
            accessibilityLiveRegion={isStarting ? 'none' : 'polite'}
            style={[
              styles.statusText,
              { color: isAudible ? ACCENT : TEXT_TERTIARY },
            ]}
          >
            {statusLabel}
          </Text>
          {/* Absolutely positioned, so a playback failure never moves the play
              button under the user's thumb — and, unlike a reserved slot, the
              healthy case does not pay for it with a permanent hole in the
              composition. */}
          {playbackError != null && (
            <View style={styles.errorSlot} pointerEvents="box-none">
              <Text style={styles.errorText} accessibilityLiveRegion="assertive">
                {playbackError}
              </Text>
              <PressableScale
                onPress={retryPlayback}
                accessibilityLabel={`Retry playing ${selectedSound.name}`}
                style={styles.retryButton}
              >
                <RotateCcw size={ICON_SM} color={ACCENT} strokeWidth={ICON_STROKE} />
                <Text style={styles.retryText}>Retry</Text>
              </PressableScale>
            </View>
          )}
        </View>

        <View style={styles.spacer} />

        {/* Controls */}
        <Animated.View style={[styles.controls, recedeStyle]} {...recedingProps}>
          <View style={styles.timerHeader}>
            <View style={styles.timerLabelRow}>
              <Timer size={ICON_SM} color={TEXT_SECONDARY} strokeWidth={ICON_STROKE} />
              <Text style={styles.controlLabel}>Stop after</Text>
            </View>
            {/* Always mounted so setting a timer doesn't jolt the row — but
                when it is empty it is a blank text node, so it is hidden from
                assistive tech rather than left as a stop with nothing in it.
                One verb throughout: the control is "Stop after", so the readout
                says "Stops in", not "Fades out in". */}
            <Text
              style={styles.timerValue}
              accessibilityElementsHidden={timerMinutes === 0}
              importantForAccessibility={
                timerMinutes === 0 ? 'no-hide-descendants' : 'auto'
              }
              // The digits read as "zero five colon zero zero" otherwise. Not a
              // live region: this ticks every second and would talk over the user.
              accessibilityLabel={
                timerMinutes > 0
                  ? `Stops in ${Math.floor(remainingSeconds / 60)} minutes ${
                      remainingSeconds % 60
                    } seconds`
                  : undefined
              }
            >
              {timerMinutes > 0 ? `Stops in ${formatTimer()}` : ' '}
            </Text>
          </View>
          <View
            style={styles.timerRow}
            accessibilityRole="radiogroup"
            accessibilityLabel="Stop after"
          >
            {TIMER_OPTIONS.map((minutes) => {
              const isSelected = timerMinutes === minutes;
              return (
                <PressableScale
                  key={minutes}
                  onPress={() => setStopTimer(minutes)}
                  accessibilityRole="radio"
                  accessibilityLabel={
                    minutes === 0
                      ? 'Keep playing, no timer'
                      : `Stop after ${minutes} minutes`
                  }
                  accessibilityState={{ checked: isSelected }}
                  style={[
                    styles.timerChip,
                    {
                      backgroundColor: isSelected ? SELECTED_FILL : GLASS_FILL,
                      borderColor: isSelected ? SELECTED_BORDER : GLASS_BORDER,
                      // Grows with the OS text size so "60m" is never squeezed
                      // out of its own chip.
                      minHeight: Math.round(TOUCH_MIN * boxScale),
                      minWidth: Math.round(TIMER_CHIP_MIN_WIDTH * boxScale),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timerChipText,
                      { color: isSelected ? TEXT_PRIMARY : TEXT_SECONDARY },
                    ]}
                  >
                    {minutes === 0 ? 'Off' : `${minutes}m`}
                  </Text>
                  {/* The same second, non-colour channel the tiles carry, and
                      for the same reason theme.ts gives: SELECTED_FILL against
                      GLASS_FILL is ~2.1:1, so fill plus border is not a state.
                      This is the one control whose setting cannot be checked by
                      ear and which silently ends the session. Absolutely
                      positioned — a weight change or an inline mark would
                      reflow the label inside its own chip on every tap. */}
                  {isSelected && (
                    <View
                      style={[
                        styles.selectionDot,
                        { backgroundColor: TEXT_PRIMARY },
                      ]}
                    />
                  )}
                </PressableScale>
              );
            })}
          </View>
          <View style={styles.volumeRow}>
            <Volume1 size={ICON_SM} color={TEXT_TERTIARY} strokeWidth={ICON_STROKE} />
            <Slider
              style={styles.slider}
              value={volume}
              onValueChange={onVolumeChange}
              onSlidingComplete={(value) => setStoredVolume(value)}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              minimumTrackTintColor={ACCENT}
              maximumTrackTintColor={GLASS_BORDER}
              thumbTintColor={TEXT_PRIMARY}
              accessibilityRole="adjustable"
              accessibilityLabel="Volume"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.round(volume * 100),
                text: `${Math.round(volume * 100)} percent`,
              }}
            />
            <Volume2 size={ICON_SM} color={TEXT_TERTIARY} strokeWidth={ICON_STROKE} />
          </View>
        </Animated.View>

        {/* No dim overlay. A full-screen scrim over a 10%-brightness screen was
            a black rectangle that ate the first touch: reaching for a control
            cost two gestures, the first of which did nothing but dismiss. The
            interface recedes instead (see the recede shared value), the
            brightness floor is legible, and the root Pressable below restores
            everything without consuming the touch that did it — a tap that
            lands on a control fires the control *and* wakes. */}

        <CreditsModal
          visible={creditsVisible}
          onClose={() => setCreditsVisible(false)}
        />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE_LG,
    paddingTop: SPACE_MD,
  },
  appTitle: {
    color: TEXT_PRIMARY,
    fontFamily: FONT_DISPLAY_SEMIBOLD,
    fontSize: FONT_TITLE,
    letterSpacing: 0.3,
  },
  // Second half of the masthead lockup, so it carries the display face with
  // the name above it. Everything below the header is system-font.
  // FONT_DISPLAY_LIGHT, not FONT_DISPLAY_REGULAR: App.tsx loads 300/500/600/700
  // only, so the 400 face silently fell back to the system font and read as a
  // different family from the name directly above it.
  appSubtitle: {
    color: TEXT_TERTIARY,
    fontFamily: FONT_DISPLAY_LIGHT,
    fontSize: FONT_LABEL,
  },
  infoButton: {
    width: TOUCH_MIN,
    height: TOUCH_MIN,
    borderRadius: RADIUS_PILL,
    backgroundColor: GLASS_FILL,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginTop: SPACE_LG,
  },
  tileWrap: {
    alignItems: 'center',
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionDot: {
    position: 'absolute',
    bottom: SPACE_XXS,
    width: SELECTION_DOT,
    height: SELECTION_DOT,
    borderRadius: SELECTION_DOT / 2,
  },
  tileLabel: {
    fontSize: FONT_CAPTION,
    marginTop: SPACE_XXS,
    textAlign: 'center',
  },
  // A heading (accessibilityRole="header"), so it takes the display face.
  // fontWeight is deliberately absent: with a named family the weight comes
  // from the file, and setting both makes Android synthesise a wrong face.
  sectionTitle: {
    color: TEXT_TERTIARY,
    fontFamily: FONT_DISPLAY_SEMIBOLD,
    fontSize: FONT_CAPTION,
    letterSpacing: 2,
    marginTop: SPACE_XL,
    marginBottom: SPACE_SM,
    paddingHorizontal: SPACE_LG,
  },
  moreSoundsWrap: {
    flexGrow: 0,
  },
  moreSoundsScroll: {
    flexGrow: 0,
  },
  moreSoundsContent: {
    paddingHorizontal: SPACE_LG,
    gap: SPACE_SM,
  },
  // Narrow. At SPACE_XXL it washed over the whole of the fifth tile's label —
  // "Purring Cat" went grey mid-word — and read as clipping rather than as
  // "there is more to the right". One character's width is the hint; anything
  // more is damage to a label.
  scrollFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: SPACE_MD,
  },
  // Takes the surplus the centre zone no longer absorbs, split evenly above
  // and below it.
  spacer: {
    flex: 1,
  },
  centerZone: {
    // Height is set at the call site (bounded, and it scales with fontScale).
    // Children are top-anchored so nothing below the play button can move it.
    // flexShrink lets the zone give way rather than overflow on a short screen.
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
    // Not clipped: the failure overlay hangs below the zone, and the rain is
    // no longer inside it — it is a full-screen layer that keeps a corridor
    // clear around this block instead of being trapped in it.
  },
  rainLayer: {
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  rainDrop: {
    position: 'absolute',
    top: 0,
    width: RAIN_DROP_WIDTH,
    borderRadius: RAIN_DROP_WIDTH / 2,
    backgroundColor: TEXT_PRIMARY,
  },
  soundTitle: {
    color: TEXT_PRIMARY,
    fontFamily: FONT_DISPLAY_LIGHT,
    fontSize: FONT_HEADLINE,
    letterSpacing: 0.5,
    // The longest name has to wrap inside the padding rather than run to the
    // screen edge; nothing here is ever truncated.
    textAlign: 'center',
    paddingHorizontal: SPACE_LG,
  },
  /**
   * The hero control, and the state the app opens in every session is paused —
   * so paused is the state that has to read first. It used to be GLASS_FILL
   * plus a 1px GLASS_BORDER: byte-for-byte the treatment of the info button and
   * of an unselected timer chip, which left the primary action ranking about
   * fourth on the screen. A filled disc at the TEXT_PRIMARY end of the ramp
   * with a dark glyph makes it unambiguously the heaviest thing in the centre
   * zone, at full brightness and at the session floor alike.
   *
   * The border stays 2px in both states so the disc does not resize on the
   * play→pause transition — that transition still runs on four channels (fill,
   * border, glyph shape, glyph colour) plus the status line.
   */
  playButton: {
    marginTop: SPACE_LG,
    width: PLAY_BUTTON_SIZE,
    height: PLAY_BUTTON_SIZE,
    borderRadius: RADIUS_PILL,
    backgroundColor: TEXT_PRIMARY,
    borderWidth: 2,
    borderColor: TEXT_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // No `elevation`: Android draws an elevation shadow as a polygon outline, so
  // a 999-radius button got a dark octagonal plate behind it — at the app's one
  // hero moment. The playing state is carried by the accent border, the accent
  // fill, the glyph and the status line instead; shadow* is iOS-only and stays.
  playButtonActive: {
    borderColor: ACCENT,
    backgroundColor: ACCENT_SOFT,
    shadowColor: ACCENT,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  // Optical centring for the play triangle, which has no visual left edge.
  // Deliberately off-grid and deliberately untokenised.
  playIconNudge: {
    marginLeft: 2,
  },
  // The single most important piece of state on the screen, read at the
  // session brightness floor — it does not get the smallest type in the app.
  statusText: {
    marginTop: SPACE_SM,
    fontSize: FONT_BODY,
    letterSpacing: 0.5,
  },
  // Always mounted, so a failure never reflows the stack above it.
  errorSlot: {
    // Out of flow: the failure row is overlaid beneath the status line rather
    // than reserving a slot, so nothing above it can shift and the healthy
    // case costs no vertical space at all.
    position: 'absolute',
    // Immediately below the zone, extending into the spacer beneath it.
    top: '100%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: SPACE_SM,
    paddingHorizontal: SPACE_LG,
  },
  errorText: {
    color: TEXT_SECONDARY,
    fontSize: FONT_LABEL,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE_XS,
    marginTop: SPACE_XS,
    minHeight: TOUCH_MIN,
    paddingHorizontal: SPACE_MD,
  },
  retryText: {
    color: ACCENT,
    fontSize: FONT_LABEL,
  },
  controls: {
    marginHorizontal: SPACE_LG,
    marginBottom: SPACE_LG,
    padding: SPACE_MD,
    borderRadius: RADIUS_LG,
    backgroundColor: GLASS_FILL,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // At large text sizes the label and the readout stop fitting side by side;
    // they stack rather than squeeze each other.
    flexWrap: 'wrap',
    gap: SPACE_XS,
  },
  timerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_XS,
  },
  controlLabel: {
    color: TEXT_SECONDARY,
    fontSize: FONT_LABEL,
  },
  timerValue: {
    color: TEXT_PRIMARY,
    fontSize: FONT_LABEL,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: SPACE_SM,
    gap: SPACE_XS,
    // Four chips stop fitting on one line on a narrow screen or at a large
    // text size. They flow onto a second line instead of clipping their labels.
    flexWrap: 'wrap',
  },
  timerChip: {
    // Floors only — the live values are scaled by fontScale at the call site.
    minHeight: TOUCH_MIN,
    minWidth: TIMER_CHIP_MIN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE_MD,
    borderRadius: RADIUS_PILL,
    borderWidth: 1,
  },
  timerChipText: {
    fontSize: FONT_LABEL,
    // Weight stays fixed: switching to bold on selection reflowed the label
    // inside its own chip on every tap. Selection reads from border, fill and
    // the selection dot.
    fontWeight: '600',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACE_MD,
  },
  slider: {
    flex: 1,
    height: TOUCH_MIN,
    marginHorizontal: SPACE_XS,
  },
});

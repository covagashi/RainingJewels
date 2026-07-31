/**
 * DIRECTION CONTRACT — the Dial
 *
 * THESIS: The library is the interface. One continuous run of 31 sounds moves
 * past a fixed play head. Refuses the category arrangement this app shipped for
 * three passes — picker on top, transport below, controls card pinned under it.
 *
 * OWN-WORLD: Inherited, unchanged. Near-black vertical gradient, white-alpha
 * ramp, one muted rain-blue accent earned only by playback, Manrope for display
 * and the system face for everything operated, 4pt grid, 48pt touch floor.
 *
 * STORY: The visitor arrives awake and deliberate. They drag the run until the
 * name at the head is the one they want, release, and it fades in. Everything
 * they are not using retires.
 *
 * FIRST VIEWPORT: Sound name at the head at display scale, transport a filled
 * disc directly beneath it, the run legible above and below the head, ambient
 * rain behind everything, timer and volume behind a pull-up. No featured row,
 * no horizontal strip.
 *
 * FORM: The Dial — option 1 of 3 from shape, user-pinned. No concept roll: a
 * precisely specified request routes directly per new-work.md §3.
 *
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 * finish review, the verdict, and DESIGN.md
 */

import Slider from '@react-native-community/slider';
import * as Brightness from 'expo-brightness';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioPlayer,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronDown,
  ChevronUp,
  Info,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Volume1,
  Volume2,
} from 'lucide-react-native';
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
  interpolateColor,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import CreditsModal from './CreditsModal';
import { getSoundIcon } from './icons';
import { ALL_SOUNDS, Sound } from './sounds';
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
  DIVIDER,
  DURATION_BASE,
  DURATION_SLOW,
  FONT_BODY,
  FONT_DISPLAY_LIGHT,
  FONT_DISPLAY_SIZE,
  FONT_LABEL,
  GLASS_BORDER,
  GLASS_FILL,
  ICON_MD,
  ICON_SM,
  ICON_STROKE,
  LEADING_TIGHT,
  RADIUS_LG,
  RADIUS_PILL,
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
/**
 * Floor the receded controls fade to. Low enough to stop competing for
 * attention, high enough that a control you can still press is a control you
 * can still see.
 */
const SESSION_GHOST_OPACITY = 0.12;
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
/** Softness of the edge of the cleared corridor around the run and transport. */
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
/** Steps used to ramp volume. */
const FADE_STEPS = 25;
/** Seconds before the timer expires over which audio rides down to zero. */
const FADE_OUT_WINDOW_S = 30;
/**
 * Switching sounds. The engine is now a two-voice A/B pair, so a switch is a
 * genuine cross-ramp inside one window rather than a ride-down followed by a
 * ride-up: the incoming voice comes up while the outgoing one goes down, on an
 * equal-power curve so the pair does not dip in the middle. `replace()` on a
 * single voice used to cut the outgoing sound dead, which is a hard edit in the
 * middle of a session — and switching is now the app's *primary* gesture.
 */
const AUDIO_CROSSFADE_MS = 900;
/**
 * From-silence onset. AUDIO_FADE_IN_MS (2500) is the theme's ceiling and stays
 * the contract, but two and a half seconds is longer than the app's whole
 * promise: one tap, then sound. For most of that ramp nothing was audible while
 * the interface claimed "Playing", and the natural response — tap again —
 * paused. The crossfade already sits at 900ms and reads fine; the onset gets a
 * little more swell than that and no more. Clamped to the token so it can never
 * exceed it.
 */
const AUDIO_ONSET_IN_MS = Math.min(1100, AUDIO_FADE_IN_MS);
/**
 * Level at which a ramp is treated as actually audible. Below it the status
 * line says "Starting…", never "Playing" — this is the one place the interface
 * could tell a screen-reader user something false.
 */
const AUDIBLE_LEVEL = 0.05;

/* -------------------------------------------------------------------------
 * The dial
 * ---------------------------------------------------------------------- */

/**
 * How long the run has to sit still on a position before the audio engine is
 * allowed to act on it.
 *
 * This constant is the whole of the "must not audition while dragging"
 * condition recorded in PRODUCT.md. Nothing on the drag path touches audio; the
 * only thing that does is the timer this value arms, and every fresh touch on
 * the run cancels it before it can fire. Dragging past twelve sounds arms and
 * cancels the timer twelve times and plays nothing.
 *
 * Long enough that a re-grab reads as "still choosing", short enough that a
 * deliberate release feels answered.
 */
const DIAL_SETTLE_MS = 350;
/**
 * Rows visible in the dial's window, and where the head sits inside it. More
 * room above than below: the run reads as descending toward the transport, and
 * the head lands high enough that the disc directly beneath it is not pushed
 * off a short screen.
 */
const DIAL_ROWS_ABOVE = 3;
const DIAL_ROWS_BELOW = 2;
const DIAL_VISIBLE_ROWS = DIAL_ROWS_ABOVE + 1 + DIAL_ROWS_BELOW;
const DIAL_HEAD_ANCHOR = (DIAL_ROWS_ABOVE + 0.5) / DIAL_VISIBLE_ROWS;
/**
 * Distance, in rows, over which a name recedes to the back of the run.
 *
 * Depth is carried by scale alone. Nothing inside the window fades below
 * DIAL_NEIGHBOUR_OPACITY, because opacity 0 does not disable hit testing in
 * React Native — and neither does 0.07. `onRowPress` commits audio on the spot,
 * so a row you cannot read is a row that can switch the sound out from under
 * you when your thumb lands an inch wide. The ramp used to run to zero at the
 * edge of the window, which put the two outermost rows at 1.85:1 and 1.17:1 on
 * BG_TOP while leaving them fully pressable.
 */
const DIAL_DEPTH_SPAN = DIAL_ROWS_ABOVE + 0.5;
/**
 * Opacity of the immediate neighbours — one step down the white-alpha ramp —
 * and the floor for every row in the window. 0.34 measures 3.09:1 on BG_TOP,
 * which is the WCAG 1.4.3 large-text floor; the run is set at
 * FONT_DISPLAY_SIZE, and the row that has to be read rather than aimed at is
 * the one at the head, at full opacity.
 */
const DIAL_NEIGHBOUR_OPACITY = 0.34;
/** Scale of the immediate neighbours, and the floor for everything past them. */
const DIAL_NEIGHBOUR_SCALE = 0.62;
const DIAL_MIN_SCALE = 0.46;
/**
 * Row pitch. Derived from the display size the head is set at, plus a line of
 * air, so the run's rhythm is a property of the type rather than a number
 * someone liked.
 *
 * Deliberately NOT clamped by MAX_BOX_SCALE. A row is a box that contains text
 * and nothing else, so at 200% text it simply has to be twice as tall; the cost
 * is that fewer neighbours are visible, which is the correct trade. Capping it
 * would put a 68pt name in a 65pt row.
 */
const DIAL_ROW_PITCH = FONT_DISPLAY_SIZE * LEADING_TIGHT + SPACE_LG;

/** Diameter of the hero transport control. */
const PLAY_BUTTON_SIZE = 76;

/**
 * The play head's mark. Off-grid on purpose, like the 2px transport ring: this
 * is a drawn rule, not a box, and the 4pt grid governs space rather than stroke.
 * It was `StyleSheet.hairlineWidth` — a sub-pixel line at 3.5x density, run to
 * both bezels with no gutter, which read as a rendering artefact rather than
 * the fixed position the whole run is read against.
 */
const HEAD_TICK_THICKNESS = 2;

/* Chip geometry. Every one of these boxes carries text, so each is a base size
 * that grows with the OS text size rather than a fixed dimension. */
const TIMER_CHIP_MIN_WIDTH = 64;
/**
 * Ceiling on how far a text-bearing box in the pull-up may grow. The text
 * itself is never capped and never clipped — only the box, and only so that a
 * 200% chip does not push the volume slider off the panel. Labels wrap; nothing
 * is truncated.
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
    // Corridor: the run, the transport and the status line keep clear air
    // around them. A drop crossing that band thins out and comes back.
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

// --- One name in the run ------------------------------------------------

/**
 * A single position on the dial.
 *
 * Everything that changes as the run moves — emphasis, scale, the retreat into
 * the session state — is derived on the UI thread from the scroll offset. This
 * component does not re-render while the user drags; nothing does. That is what
 * makes a 31-row run affordable and, more importantly, it is why a drag cannot
 * reach the audio engine by accident: there is no render on the drag path to
 * hang a side effect off.
 *
 * `accent` rather than `playing` + `isSelected`: a boolean that is false for 29
 * of the 31 rows both before and after a playback change, so the memo actually
 * holds and only the two rows that changed re-render.
 */
interface DialRowProps {
  sound: Sound;
  index: number;
  pitch: number;
  accent: boolean;
  scrollY: SharedValue<number>;
  recede: SharedValue<number>;
  reducedMotion: boolean;
  onPress: (index: number) => void;
}

const DialRow = React.memo(function DialRow({
  sound,
  index,
  pitch,
  accent,
  scrollY,
  recede,
  reducedMotion,
  onPress,
}: DialRowProps) {
  const Icon = getSoundIcon(sound.id);

  /**
   * Applied to the row's *content*, never to the row.
   *
   * Both platforms hit-test in transformed space, so scaling the box that
   * carries `minHeight: TOUCH_MIN` scales the touch target with it — the row at
   * distance 1 was a 40dp target and the row at distance 3 about 32dp, against
   * a floor theme.ts calls absolute. The pressable keeps the full `pitch`; only
   * the icon and the name shrink.
   */
  const contentStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollY.value / pitch - index);
    // The session state retires the run down to the one name at the head. The
    // head itself is never dimmed — it is one of the three things the session
    // view is made of — so the ghost is mixed in by distance, not applied flat.
    const ghost = 1 - recede.value * (1 - SESSION_GHOST_OPACITY);
    const sessionMix = interpolate(
      distance,
      [0, 1],
      [1, ghost],
      Extrapolation.CLAMP,
    );

    if (reducedMotion) {
      // Instant in position: no continuous scale ramp riding the finger, and
      // emphasis is a step rather than a slide. The run still moves — direct
      // manipulation is not animation — it just stops interpolating.
      const base = distance < 0.5 ? 1 : DIAL_NEIGHBOUR_OPACITY;
      return { opacity: base * sessionMix, transform: [{ scale: 1 }] };
    }

    // Floored at the neighbour step: see DIAL_DEPTH_SPAN. Everything past the
    // first neighbour is separated by size, not by disappearing.
    const base = interpolate(
      distance,
      [0, 1],
      [1, DIAL_NEIGHBOUR_OPACITY],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      distance,
      [0, 1, DIAL_DEPTH_SPAN],
      [1, DIAL_NEIGHBOUR_SCALE, DIAL_MIN_SCALE],
      Extrapolation.CLAMP,
    );
    return { opacity: base * sessionMix, transform: [{ scale }] };
  });

  return (
    <View style={[styles.dialRow, { height: pitch }]}>
      <Pressable
        onPress={() => onPress(index)}
        style={styles.dialRowPress}
        // The run announces itself once, as a single adjustable control (see
        // the wrapper below). Leaving 31 pressables exposed would give a
        // screen-reader user 31 stops to swipe through to reach the transport.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Animated.View style={[styles.dialRowContent, contentStyle]}>
          <Icon
            size={ICON_MD}
            color={accent ? ACCENT : TEXT_PRIMARY}
            strokeWidth={ICON_STROKE}
          />
          {/* No numberOfLines. A long name at 200% text wraps out of its row
              rather than being cut in half; the row is a rhythm, not a cage. */}
          <Text style={[styles.dialName, accent && styles.dialNameAccent]}>
            {sound.name}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
});

export default function PlayerScreen() {
  /**
   * Two voices, A and B.
   *
   * The engine was single-voice, and `replace()` on a single voice stops the
   * outgoing sound the instant the incoming one is loaded — there is no window
   * in which both exist, so there is nothing to cross-fade. The dial makes
   * switching the app's main gesture, so the pair is not a refinement: it is
   * what the interaction model needs to sound like anything at all.
   *
   * Exactly one voice is "active" at a time. Active means: it is the one the
   * transport operates, the one the status line describes, and the one that
   * owns the lock-screen session. The other is silent and idle, waiting to be
   * loaded with whatever comes next.
   */
  const playerA = useAudioPlayer();
  const playerB = useAudioPlayer();
  const statusA = useAudioPlayerStatus(playerA);
  const statusB = useAudioPlayerStatus(playerB);
  const [activeIsA, setActiveIsA] = useState(true);
  const activeIsARef = useRef(true);
  /** Errors and load state belong to the voice the transport speaks for. */
  const status = activeIsA ? statusA : statusB;
  /**
   * "Is there sound" is a property of the pair, not of one voice.
   *
   * Reading it off the active voice alone put a hole in every switch: the
   * active flag flips the instant the incoming voice is told to play, but its
   * status event arrives a frame or two later — so for those frames the
   * interface announced "Paused", dropped the keep-awake lock and left the
   * session state, in the middle of an audible crossfade.
   */
  const playing = statusA.playing || statusB.playing;

  const getActive = useCallback(
    () => (activeIsARef.current ? playerA : playerB),
    [playerA, playerB],
  );
  const getIdle = useCallback(
    () => (activeIsARef.current ? playerB : playerA),
    [playerA, playerB],
  );
  const swapActive = useCallback(() => {
    activeIsARef.current = !activeIsARef.current;
    setActiveIsA(activeIsARef.current);
  }, []);

  const reducedMotion = useReducedMotion();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [creditsVisible, setCreditsVisible] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  /**
   * True from the moment a from-silence ramp starts until it is actually
   * audible. `status.playing` is true from step 0 of that ramp, so keying the
   * status line off it claimed sound before there was any.
   */
  const [isStarting, setIsStarting] = useState(false);

  // Set while a volume ramp is in flight. Any user interaction bumps this so
  // the running loop sees a stale token and abandons its remaining steps.
  const fadeTokenRef = useRef(0);

  // Id of the sound currently loaded into the *active* voice (so play after
  // pause resumes instead of reloading).
  const loadedSoundIdRef = useRef<string | null>(null);

  // Latest values, for the handlers that run from timers and scroll callbacks
  // and therefore cannot close over a render.
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;
  const playingRef = useRef(false);
  playingRef.current = playing;

  // Sleep timer
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session state. Not a blackout: the interface recedes to the name at the
  // head, the transport and the rain, and the system brightness drops to a
  // legible floor. Any touch brings it back — and is not consumed doing so.
  const [inSession, setInSession] = useState(false);
  const dimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalBrightnessRef = useRef<number | null>(null);
  // Bumped by every interaction. The arming effect watches it, so a drag, a
  // slider tick or a tap re-arms the countdown without any handler having to
  // know about timers.
  const [awakeToken, setAwakeToken] = useState(0);

  // Focus target when the interface recedes, so a screen reader is not left on
  // an element that has just been hidden.
  const transportRef = useRef<View>(null);
  const dialRef = useRef<ScrollView>(null);

  const selectedSound = ALL_SOUNDS[selectedIndex];

  const { fontScale } = useWindowDimensions();
  // Boxes in the pull-up grow with the OS text size. Clipping a label to
  // protect its box is never the right trade, so the boxes move instead.
  const boxScale = Math.min(Math.max(fontScale, 1), MAX_BOX_SCALE);
  // The run's pitch grows without a ceiling — see DIAL_ROW_PITCH.
  const pitch = Math.max(
    TOUCH_MIN,
    Math.round(DIAL_ROW_PITCH * Math.max(fontScale, 1)),
  );
  const pitchRef = useRef(pitch);
  pitchRef.current = pitch;

  // The dial's window, measured. Bounded to DIAL_VISIBLE_ROWS so the run never
  // absorbs the whole screen and strands the transport below the fold; it
  // shrinks below that on a short screen or at a large text size.
  const [dialHeight, setDialHeight] = useState(0);
  /** The dial's top edge inside the stage, for the rain corridor. */
  const [dialTop, setDialTop] = useState(0);
  /** Height of the pull-up's affordance row, which the panel is anchored to. */
  const [dockHeight, setDockHeight] = useState(0);
  const headOffset = Math.max(
    0,
    Math.round(dialHeight * DIAL_HEAD_ANCHOR - pitch / 2),
  );

  // Vertical band the rain keeps clear, in the gradient's own coordinates.
  // Measured rather than assumed, because the stage's height moves with
  // fontScale and with the screen.
  const [corridor, setCorridor] = useState({ top: 0, bottom: 0 });

  /** Live scroll offset of the run. Written on the UI thread, read there only. */
  const scrollY = useSharedValue(0);

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
      // Both voices, or the pair can leave a media session behind.
      try {
        playerA.setActiveForLockScreen(false);
      } catch {}
      try {
        playerB.setActiveForLockScreen(false);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the screen awake only while audio is actually playing. Holding the
  // lock for the whole screen lifetime lit the display all night, which works
  // against the product and burns battery for nothing.
  useEffect(() => {
    if (!playing) return;
    activateKeepAwakeAsync().catch(() => {});
    return () => {
      try {
        deactivateKeepAwake();
      } catch {}
    };
  }, [playing]);

  // Surface decoder / load failures instead of leaving the UI stuck on
  // "Paused" with no explanation.
  useEffect(() => {
    if (status.error) {
      setPlaybackError(playbackErrorFor(selectedSound.name));
    } else if (playing) {
      setPlaybackError(null);
    }
  }, [status.error, playing, selectedSound.name]);

  // accessibilityLiveRegion is Android-only, so on iOS every playback state
  // change and every failure was silent. Announce the transitions that matter —
  // and only the transitions, never a render or a countdown tick.
  /**
   * Announces the *settled* state only. "Starting…" is never spoken: it is a
   * sub-second transient, and announcing it would mean a screen-reader user
   * hears three states for one tap. Going straight from starting to paused
   * (tapped again during the ramp) still announces the pause.
   *
   * This is also the only announcement the dial makes. Intermediate positions
   * are never spoken: while dragging nothing reaches React at all, and a
   * screen-reader increment is announced by the adjustable's own
   * accessibilityValue, which is the platform's job and not ours to duplicate.
   */
  const announcedStateRef = useRef<'playing' | 'paused' | 'starting' | null>(
    null,
  );
  /** Set when the stop timer pauses playback, so the stop is announced once. */
  const timerStoppedRef = useRef(false);
  useEffect(() => {
    const state = !playing ? 'paused' : isStarting ? 'starting' : 'playing';
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
  }, [playing, isStarting, selectedSound.name]);

  const announcedErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (playbackError != null && playbackError !== announcedErrorRef.current) {
      AccessibilityInfo.announceForAccessibility(playbackError);
    }
    announcedErrorRef.current = playbackError;
  }, [playbackError]);

  /**
   * Moves the run so `index` sits at the head.
   *
   * `getNode` is the older animated-component escape hatch and is still
   * declared on this ref's type; the direct instance is what current versions
   * hand back. Checking for both costs a property read and avoids the run being
   * silently unpositionable if that ever changes under us.
   */
  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      const node = dialRef.current as
        | (ScrollView & { getNode?: () => ScrollView })
        | null;
      const target =
        node && typeof node.getNode === 'function' ? node.getNode() : node;
      target?.scrollTo({ y: index * pitchRef.current, animated });
    },
    [],
  );

  // Restore persisted volume + last selected sound (no auto-play). The run is
  // moved to the restored sound directly rather than through the settle path,
  // so restoring never arms the audio engine — see `userDrivenRef`.
  const [restoreSettled, setRestoreSettled] = useState(false);
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
        volumeRef.current = storedVolume;
        getActive().volume = storedVolume;
      }
      if (lastId != null) {
        const index = ALL_SOUNDS.findIndex((s) => s.id === lastId);
        if (index >= 0) {
          setSelectedIndex(index);
          selectedIndexRef.current = index;
        }
      }
      // Marked settled whether or not anything was stored, so a fresh install
      // still positions the run (at Rain, index 0) rather than waiting forever.
      setRestoreSettled(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The run cannot be positioned until two things are true: it has a height
  // (the head offset is derived from it) and storage has answered. Either can
  // land first, so this waits for both rather than assuming an order — reading
  // the index too early opened the app on Rain with the title naming something
  // else. Never animated: this is where the app opens, not a move.
  //
  // Keyed on `pitch`, not on a one-shot flag. The offset the head is derived
  // from is `scrollY / pitch`, and pitch is a function of fontScale: change the
  // OS text size with the app alive and every row's distance is computed
  // against a stale rhythm, so the head drifts off the name the transport is
  // naming until the next drag re-snaps it. Re-positioning on the same index is
  // a no-op whenever the pitch has not moved.
  const positionedPitchRef = useRef(0);
  useEffect(() => {
    if (dialHeight === 0 || !restoreSettled) return;
    if (positionedPitchRef.current === pitch) return;
    positionedPitchRef.current = pitch;
    scrollToIndex(selectedIndexRef.current, false);
  }, [dialHeight, restoreSettled, pitch, scrollToIndex]);

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
   * Every interaction lands here — including the first frame of a drag on the
   * run, which is why it is safe to call from a scroll callback as well as from
   * a press. It arms nothing itself; arming is derived from playback plus this
   * token.
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
    if (!playing) {
      clearDimTimer();
      return;
    }
    armDimTimer();
    return clearDimTimer;
  }, [playing, awakeToken, armDimTimer, clearDimTimer]);

  // Sound stopping ends the session, whether the user paused it or the stop
  // timer did. Nothing is playing, so nothing is being receded for.
  useEffect(() => {
    if (!playing && inSession) restoreInterface();
  }, [playing, inSession, restoreInterface]);

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
    recede.value = withTiming(target, {
      // Slow going away, quick coming back: receding is ambient, restoring
      // is a response to a finger already on the glass.
      //
      // Reduce Motion does NOT mean snap. This transition carries no
      // translation and no parallax — it is a cross-fade, which is the correct
      // vestibular-safe fallback. Snapping two thirds of the interface out in
      // one frame would make the gentlest moment in the app the most abrupt,
      // for exactly the users who need it least abrupt.
      duration: inSession ? SESSION_RECEDE_MS : DURATION_BASE,
      easing: Easing.inOut(Easing.quad),
    });
  }, [inSession, recede]);

  /**
   * Receded, not erased.
   *
   * This must never reach opacity 0. Opacity 0 does not disable hit testing in
   * React Native, so a fully transparent control stays live: a palm, a pocket
   * or a sleeve could arm a stop timer or drag volume to zero with no visible
   * target and no undo — strictly worse than the black scrim this replaced,
   * which at least consumed the touch.
   *
   * Killing the touch instead (`pointerEvents: 'none'`) would reintroduce the
   * two-gesture cost the decision exists to remove. So the controls stay
   * interactive and stay *visible*, just quiet.
   */
  const recedeStyle = useAnimatedStyle(() => ({
    opacity: 1 - recede.value * (1 - SESSION_GHOST_OPACITY),
  }));

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
        'Session view. The screen has dimmed. Everything is still here — touch anywhere to bring it back.',
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
   * One volume ramp, one or two voices, one cancellation token.
   *
   * The single-voice version of this only ever moved one player. It now drives
   * the A/B pair together, because a crossfade is one gesture and must not be
   * two ramps racing each other with separate tokens: interrupting it has to
   * interrupt *both* sides or the outgoing voice is left playing at whatever
   * level it had reached.
   *
   * `equalPower` is the curve a real crossfade wants — two uncorrelated ambient
   * loops summed with linear gains dip about 3dB at the midpoint, which is
   * audible as a hole in the middle of every switch.
   *
   * Abandoned as soon as another interaction bumps the fade token, so a tap
   * during a ramp never fights it. Resolves true only if it ran to completion
   * unopposed.
   */
  interface RampSpec {
    up?: { player: AudioPlayer; to: number };
    down?: { player: AudioPlayer; from: number };
    durationMs: number;
    equalPower?: boolean;
    /** Marks a from-silence onset, which owns the "Starting…" transient. */
    isOnset?: boolean;
  }

  const runRamp = useCallback(async (spec: RampSpec) => {
    const token = ++fadeTokenRef.current;
    // Below this the ramp is inaudible, so the interface must not claim to be
    // playing. The target is the user's own level, which can itself be tiny.
    const audibleAt = spec.up
      ? Math.min(AUDIBLE_LEVEL, spec.up.to)
      : AUDIBLE_LEVEL;
    for (let i = 1; i <= FADE_STEPS; i += 1) {
      if (fadeTokenRef.current !== token) return false;
      const p = i / FADE_STEPS;
      const rise = spec.equalPower ? Math.sin((p * Math.PI) / 2) : p;
      const fall = spec.equalPower ? Math.cos((p * Math.PI) / 2) : 1 - p;
      if (spec.up) {
        const level = spec.up.to * rise;
        spec.up.player.volume = level;
        // Identical value, so React bails out — this is not a re-render per
        // step, it is one transition at the moment sound arrives.
        if (spec.isOnset && level >= audibleAt) setIsStarting(false);
      }
      if (spec.down) spec.down.player.volume = spec.down.from * fall;
      await new Promise((r) => setTimeout(r, spec.durationMs / FADE_STEPS));
    }
    if (fadeTokenRef.current !== token) return false;
    if (spec.up) spec.up.player.volume = spec.up.to;
    if (spec.down) spec.down.player.volume = 0;
    if (spec.isOnset) setIsStarting(false);
    return true;
  }, []);

  /**
   * Ends any ramp in flight and puts the pair back into a defined state: the
   * active voice at `level`, the idle voice silent and stopped. Called whenever
   * the user overrides a fade — a volume drag, a stop-timer change — because
   * abandoning a crossfade halfway would otherwise leave two voices audible.
   */
  const settleVoices = useCallback(
    (level: number) => {
      fadeTokenRef.current += 1;
      setIsStarting(false);
      const idle = getIdle();
      try {
        idle.pause();
      } catch {}
      idle.volume = 0;
      getActive().volume = level;
    },
    [getActive, getIdle],
  );

  const activateLockScreen = useCallback((player: AudioPlayer, sound: Sound) => {
    // Media notification / lock screen controls; also required for sustained
    // background playback on Android.
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
  }, []);

  /** From silence, on the voice that is already active. */
  const startOnActive = useCallback(
    (index: number) => {
      const sound = ALL_SOUNDS[index];
      const active = getActive();
      try {
        active.replace(sound.source);
        active.loop = true;
        // Start silent and ramp up: the user is awake and deliberately opening
        // a session, so entry is the moment that matters. A full-volume onset
        // jolts.
        active.volume = 0;
        active.play();
      } catch {
        setIsStarting(false);
        setPlaybackError(playbackErrorFor(sound.name));
        return;
      }
      loadedSoundIdRef.current = sound.id;
      setPlaybackError(null);
      setIsStarting(true);
      runRamp({
        up: { player: active, to: volumeRef.current },
        durationMs: AUDIO_ONSET_IN_MS,
        isOnset: true,
      });
      activateLockScreen(active, sound);
    },
    [activateLockScreen, getActive, runRamp],
  );

  /** Resumes the already-loaded active voice, with the same from-silence swell. */
  const resumeActive = useCallback(() => {
    const active = getActive();
    try {
      active.volume = 0;
      active.play();
    } catch {
      setIsStarting(false);
      setPlaybackError(playbackErrorFor(ALL_SOUNDS[selectedIndexRef.current].name));
      return;
    }
    setPlaybackError(null);
    setIsStarting(true);
    runRamp({
      up: { player: active, to: volumeRef.current },
      durationMs: AUDIO_ONSET_IN_MS,
      isOnset: true,
    });
  }, [getActive, runRamp]);

  /**
   * The A/B swap.
   *
   * The incoming sound is loaded into the idle voice and started silent, the
   * pair is cross-ramped in one window, and only then is the outgoing voice
   * stopped. The active flag flips at the *start*, not the end: from the moment
   * the incoming voice is playing it is the one the transport operates and the
   * one the status line describes, so "Playing" never blinks off mid-switch.
   *
   * An interrupted crossfade needs no cleanup. The voice it left half-faded is
   * by definition the idle one, and the next crossfade reloads and re-zeroes
   * exactly that voice before it plays anything.
   */
  const crossfadeTo = useCallback(
    async (index: number) => {
      const sound = ALL_SOUNDS[index];
      const outgoing = getActive();
      const incoming = getIdle();
      const outLevel =
        typeof outgoing.volume === 'number' ? outgoing.volume : volumeRef.current;
      try {
        incoming.replace(sound.source);
        incoming.loop = true;
        incoming.volume = 0;
        incoming.play();
      } catch {
        setPlaybackError(playbackErrorFor(sound.name));
        return;
      }
      loadedSoundIdRef.current = sound.id;
      setPlaybackError(null);
      // Hand the media session over before the ramp, so the notification never
      // names the sound that is on its way out — and never has two owners.
      try {
        outgoing.setActiveForLockScreen(false);
      } catch {}
      activateLockScreen(incoming, sound);
      swapActive();

      const completed = await runRamp({
        up: { player: incoming, to: volumeRef.current },
        down: { player: outgoing, from: outLevel },
        durationMs: AUDIO_CROSSFADE_MS,
        equalPower: true,
      });
      // Superseded, paused, or overridden by a volume drag — whoever bumped the
      // token owns the outgoing voice now.
      if (!completed) return;
      try {
        outgoing.pause();
      } catch {}
      outgoing.volume = 0;
    },
    [activateLockScreen, getActive, getIdle, runRamp, swapActive],
  );

  /**
   * The one place a dial position becomes sound.
   *
   * Reached only from the settle timer or from a deliberate press — never from
   * a drag frame, a scroll event, or a render.
   *
   * A settle starts playback even from paused. That is the direction's story:
   * the visitor drags the run to the name they want, releases, and it fades in.
   * The transport exists to *stop*; the run exists to choose, and choosing is
   * not a two-step. Restoring the last sound on launch deliberately does not go
   * through here, so opening the app is still silent until asked.
   */
  const commitSound = useCallback(
    (index: number) => {
      const sound = ALL_SOUNDS[index];
      setLastSoundId(sound.id);
      if (loadedSoundIdRef.current === sound.id) {
        if (playingRef.current) return;
        resumeActive();
        return;
      }
      if (!playingRef.current) {
        startOnActive(index);
        return;
      }
      crossfadeTo(index);
    },
    [crossfadeTo, resumeActive, startOnActive],
  );

  // `commitSound` is stable, but the settle timer is armed from a worklet
  // callback that must not be re-created per render; the ref keeps the handler
  // current while the identity the scroll handler captures never changes.
  const commitSoundRef = useRef(commitSound);
  commitSoundRef.current = commitSound;

  // --- The settle -------------------------------------------------------

  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * True only between a real finger-down on the run and the settle it produces.
   * Programmatic moves — restoring the last sound, a screen-reader increment,
   * a tap on a neighbouring name — also emit scroll and momentum events, and
   * without this gate the restore path would autoplay on launch.
   */
  const userDrivenRef = useRef(false);

  const cancelSettle = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const indexAtOffset = useCallback((offsetY: number) => {
    const raw = Math.round(offsetY / pitchRef.current);
    return Math.min(ALL_SOUNDS.length - 1, Math.max(0, raw));
  }, []);

  /**
   * Arms the audio engine, `DIAL_SETTLE_MS` from now, for the position the run
   * has come to rest on. Every fresh touch cancels it before it fires, so
   * dragging past twelve sounds plays none of them.
   *
   * The head moves immediately; only the sound waits. `recomputeOnFire` is for
   * the drag path, where the offset at release is not yet the offset the snap
   * settles on.
   */
  const scheduleSettle = useCallback(
    (index: number, recomputeOnFire: boolean) => {
      cancelSettle();
      // The head moves at once, always. It is the visible commitment — the
      // transport's label, the adjustable's value, the accent — and letting it
      // lag the debounce meant a play tap in that window started the sound the
      // user had just dragged away from.
      setSelectedIndex(index);
      selectedIndexRef.current = index;
      settleTimerRef.current = setTimeout(() => {
        settleTimerRef.current = null;
        userDrivenRef.current = false;
        // A release is reported at the offset the finger left, not at the
        // position the snap lands on. By the time this fires the run has come
        // to rest, so the resting offset is the one that decides.
        const final = recomputeOnFire ? indexAtOffset(scrollY.value) : index;
        setSelectedIndex(final);
        selectedIndexRef.current = final;
        Haptics.selectionAsync();
        commitSoundRef.current(final);
      }, DIAL_SETTLE_MS);
    },
    [cancelSettle, indexAtOffset, scrollY],
  );

  useEffect(() => cancelSettle, [cancelSettle]);

  /** Finger down on the run: wake, and disarm anything the last move armed. */
  const onDialGrab = useCallback(() => {
    userDrivenRef.current = true;
    cancelSettle();
    wake();
  }, [cancelSettle, wake]);

  const onDialRest = useCallback(
    (offsetY: number) => {
      if (!userDrivenRef.current) return;
      scheduleSettle(indexAtOffset(offsetY), true);
    },
    [indexAtOffset, scheduleSettle],
  );

  /**
   * The drag, entirely on the UI thread.
   *
   * `onScroll` writes a shared value and nothing else — no React state, no
   * audio, no render. The only crossings into JS are the three that bound the
   * gesture: the grab, the release, and the end of any fling. Momentum
   * beginning cancels the settle the release armed, so a flick that travels
   * twenty rows arms the engine once, at the end, on the row it stops at.
   */
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
    onBeginDrag: () => {
      runOnJS(onDialGrab)();
    },
    onEndDrag: (e) => {
      runOnJS(onDialRest)(e.contentOffset.y);
    },
    onMomentumBegin: () => {
      runOnJS(cancelSettle)();
    },
    onMomentumEnd: (e) => {
      runOnJS(onDialRest)(e.contentOffset.y);
    },
  });

  /** Tapping a name that is already visible: deliberate, so it does not wait. */
  const onRowPress = useCallback(
    (index: number) => {
      wake();
      cancelSettle();
      userDrivenRef.current = false;
      if (index === selectedIndexRef.current) return;
      Haptics.selectionAsync();
      setSelectedIndex(index);
      selectedIndexRef.current = index;
      scrollToIndex(index, !reducedMotion);
      commitSoundRef.current(index);
    },
    [cancelSettle, reducedMotion, scrollToIndex, wake],
  );
  const onRowPressRef = useRef(onRowPress);
  onRowPressRef.current = onRowPress;
  const handleRowPress = useCallback((index: number) => {
    onRowPressRef.current(index);
  }, []);

  /**
   * The screen-reader path onto the dial. 31 sounds behind a drag gesture are
   * 31 sounds a screen-reader user cannot reach, so the run is also a single
   * `adjustable` whose increment and decrement step it one name at a time. The
   * step moves the head at once — the value has to answer the gesture — and
   * routes the audio through the same settle as a drag, so holding down the
   * increment gesture does not play everything it passes.
   */
  const stepHead = useCallback(
    (delta: number) => {
      const next = Math.min(
        ALL_SOUNDS.length - 1,
        Math.max(0, selectedIndexRef.current + delta),
      );
      if (next === selectedIndexRef.current) return;
      wake();
      scrollToIndex(next, !reducedMotion);
      scheduleSettle(next, false);
    },
    [reducedMotion, scheduleSettle, scrollToIndex, wake],
  );

  // --- Transport --------------------------------------------------------

  const togglePlayPause = () => {
    wake();
    Haptics.selectionAsync();
    if (playing) {
      // Pausing during a crossfade has to stop both voices, not just the one
      // the transport nominally speaks for.
      settleVoices(volume);
      try {
        getActive().pause();
      } catch {}
      return;
    }
    // A settle still pending would fire a moment after the tap and fight it.
    cancelSettle();
    userDrivenRef.current = false;
    if (loadedSoundIdRef.current === selectedSound.id) {
      resumeActive();
      return;
    }
    startOnActive(selectedIndex);
  };

  const onVolumeChange = (value: number) => {
    // A slider drag is the user telling us they are here. It never reached
    // wake(), so two minutes of adjusting volume dimmed the screen mid-drag.
    wake();
    // Cancel any ramp in flight so it cannot overwrite the user's own choice.
    // The onset ramp is one of those, so the transient status goes with it.
    settleVoices(value);
    setVolume(value);
  };

  const retryPlayback = () => {
    setPlaybackError(null);
    startOnActive(selectedIndex);
  };

  // --- Stop timer -------------------------------------------------------

  const setStopTimer = (minutes: number) => {
    wake();
    Haptics.selectionAsync();

    // Leaving a partially-faded volume behind would silently lower every later
    // session. Cancel any ramp and restore the user's level.
    settleVoices(volume);

    setTimerMinutes(minutes);
    setRemainingSeconds(minutes * 60);
  };

  // The countdown runs only while audio is actually playing. "Stop after 15
  // minutes" has to mean fifteen minutes of sound: pausing for a phone call and
  // coming back must not eat the session. The interval only counts — the stop
  // is handled in the effect below, because calling it from inside a state
  // updater made React 19 StrictMode fire the fade twice in development.
  useEffect(() => {
    if (timerMinutes === 0 || !playing) return;
    countdownRef.current = setInterval(() => {
      setRemainingSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [timerMinutes, playing]);

  // Stop-timer fade. Rather than dropping the volume in the last second, ride
  // it down across the final FADE_OUT_WINDOW_S so the sound thins out before it
  // is gone. Re-derived from `volume` each tick, so changing the slider mid-fade
  // scales the ramp instead of fighting it.
  useEffect(() => {
    if (timerMinutes === 0) return;
    if (remainingSeconds > FADE_OUT_WINDOW_S) return;

    const active = getActive();
    if (remainingSeconds > 0) {
      // Paused inside the fade window: hand the level back, since the countdown
      // is paused too and the fade resumes from here when playback does.
      active.volume = playing
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
      active.pause();
    } catch {}
    try {
      getIdle().pause();
    } catch {}
    active.volume = volume;
    setTimerMinutes(0);
    AccessibilityInfo.announceForAccessibility(
      'Stop timer finished. Playback stopped.',
    );
  }, [remainingSeconds, timerMinutes, getActive, getIdle, volume, playing]);

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
  const isAudible = playing && volume > 0 && !isStarting;
  const statusLabel = !playing
    ? 'Paused'
    : volume === 0
      ? 'Playing, volume off'
      : isStarting
        ? 'Starting…'
        : 'Playing';

  /**
   * The head mark: two ticks on the frame at the fixed play head, so the
   * position the run is read against is a property of the screen rather than
   * something the user has to infer from which name happens to be biggest.
   *
   * This is the one static cue that says instrument rather than list —
   * everything else that distinguishes the dial is behavioural (the settle, the
   * crossfade, the no-audition guarantee) and none of it survives a still
   * frame. So it is a drawn mark at rest, in GLASS_BORDER, not an artefact that
   * only becomes visible once something is playing.
   *
   * It takes the accent on `playing` rather than `isAudible` — one step earlier
   * than the status line and the name. That is not the interface claiming sound
   * before there is any: the ticks say *where the head is*, and by the time the
   * onset ramp is running the head has already been committed to.
   */
  const headAccent = useSharedValue(0);
  useEffect(() => {
    headAccent.value = withTiming(playing ? 1 : 0, { duration: DURATION_SLOW });
  }, [playing, headAccent]);
  const headTickStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      headAccent.value,
      [0, 1],
      [GLASS_BORDER, ACCENT],
    ),
  }));

  // The pull-up. Closed, the screen is the rain, the run, the name at the head
  // and the transport; the panel is a cross-fade above a summary row, so
  // opening it never reflows the composition it sits over.
  const panelProgress = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(panelProgress);
    panelProgress.value = withTiming(panelOpen ? 1 : 0, {
      duration: DURATION_BASE,
      easing: Easing.out(Easing.quad),
    });
  }, [panelOpen, panelProgress]);
  const panelStyle = useAnimatedStyle(() => {
    // The panel is not a child of the bar it belongs to — it is anchored above
    // it, as a sibling — so it cannot inherit the recede and has to fold it in
    // here. Two animated styles both writing `opacity` would silently drop one.
    const ghost = 1 - recede.value * (1 - SESSION_GHOST_OPACITY);
    return {
      opacity: panelProgress.value * ghost,
      // The rise is the only part of this that is motion rather than a fade, so
      // it is the only part Reduce Motion removes.
      transform: reducedMotion
        ? [{ translateY: 0 }]
        : [{ translateY: (1 - panelProgress.value) * SPACE_MD }],
    };
  });

  const togglePanel = () => {
    wake();
    Haptics.selectionAsync();
    setPanelOpen((open) => !open);
  };

  /*
   * No accessibility props ride the recede.
   *
   * The receding blocks used to be hidden from assistive tech while receded, to
   * match their being invisible. They are no longer invisible — they fade to a
   * ghost and stay pressable — so hiding them would take the controls away from
   * screen-reader users and from nobody else.
   */

  const dialWindowHeight = pitch * DIAL_VISIBLE_ROWS;
  const bottomPad = Math.max(0, dialHeight - headOffset - pitch);

  /**
   * The rain corridor starts at the head, not at the top of the run.
   *
   * Clearing the whole stage would clear two thirds of the screen and leave the
   * rain as two thin bands nobody would read as weather. The names above the
   * head are already down at a third of the ramp, and rain at 0.09–0.22 crossing
   * them is texture rather than interference. What has to stay clear is the
   * head's name at display scale, the disc, and the status line.
   */
  const corridorTop = corridor.top + dialTop + headOffset;

  return (
    /* accessible={false} is load-bearing: RN defaults it to true, and an
       accessible wrapper collapses every descendant into a single element on
       iOS — which hid the run, the transport and the slider from VoiceOver. */
    <Pressable style={styles.flex} onPress={wake} accessible={false}>
      <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.flex}>
        {/* Ambient rain: a full-screen layer behind every other element, and
            the one thing besides the name at the head and the transport that
            stays when the interface recedes. */}
        {!reducedMotion && (
          <RainLayer
            playing={playing}
            drops={drops}
            corridorTop={corridorTop}
            corridorBottom={corridor.bottom}
          />
        )}

        {/* No masthead.
            It never retired — it sat at full opacity from launch through two
            minutes of playback, which is the opposite of the direction, and it
            was the most category-default block on the screen. Its subtitle
            ("Pick a sound and settle in") described a picker; you do not pick
            from this surface, you tune it. The name is on the launcher and on
            the welcome screen at display scale, so it is not lost — and with it
            gone the name at the head is unambiguously the loudest thing here.
            The credits button moved into the pull-up, where session furniture
            already lives. */}

        {/* The stage: the run, the transport, the status line. None of it
            recedes as a block — the run dims by distance from the head, and the
            head, the disc and the status line are the session view. */}
        <View
          style={styles.stage}
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            setCorridor((prev) =>
              prev.top === y && prev.bottom === y + height
                ? prev
                : { top: y, bottom: y + height },
            );
          }}
        >
          {/* The dial */}
          <View
            style={[styles.dialZone, { height: dialWindowHeight }]}
            onLayout={(e) => {
              const h = Math.round(e.nativeEvent.layout.height);
              const y = Math.round(e.nativeEvent.layout.y);
              setDialHeight((prev) => (prev === h ? prev : h));
              setDialTop((prev) => (prev === y ? prev : y));
            }}
          >
            <View
              style={styles.flex}
              // The run is one control, not thirty-one. `accessible` here is
              // the deliberate opposite of the root Pressable's
              // accessible={false}: collapsing this subtree is the point.
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel="Sound"
              accessibilityHint="Changes the sound at the play head"
              accessibilityValue={{
                min: 1,
                max: ALL_SOUNDS.length,
                now: selectedIndex + 1,
                text: selectedSound.name,
              }}
              accessibilityActions={[
                { name: 'increment' },
                { name: 'decrement' },
              ]}
              onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === 'increment') stepHead(1);
                else if (event.nativeEvent.actionName === 'decrement')
                  stepHead(-1);
              }}
            >
              <Animated.ScrollView
                ref={dialRef}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                // Native snapping, so the run comes to rest on a position
                // rather than between two.
                snapToInterval={pitch}
                snapToAlignment="start"
                decelerationRate="fast"
                contentContainerStyle={{
                  paddingTop: headOffset,
                  paddingBottom: bottomPad,
                }}
              >
                {dialHeight > 0 &&
                  ALL_SOUNDS.map((sound, i) => (
                    <DialRow
                      key={sound.id}
                      sound={sound}
                      index={i}
                      pitch={pitch}
                      accent={i === selectedIndex && isAudible}
                      scrollY={scrollY}
                      recede={recede}
                      reducedMotion={reducedMotion}
                      onPress={handleRowPress}
                    />
                  ))}
              </Animated.ScrollView>
            </View>

            <View
              style={[styles.headMark, { top: headOffset, height: pitch }]}
              pointerEvents="none"
            >
              <Animated.View style={[styles.headTick, headTickStyle]} />
              <Animated.View style={[styles.headTick, headTickStyle]} />
            </View>
          </View>

          {/* Transport, directly beneath the head's name. */}
          <View ref={transportRef} collapsable={false}>
            <PressableScale
              onPress={togglePlayPause}
              accessibilityLabel={
                playing
                  ? `Pause ${selectedSound.name}`
                  : `Play ${selectedSound.name}`
              }
              accessibilityState={{ selected: playing }}
              style={[styles.playButton, playing && styles.playButtonActive]}
            >
              {playing ? (
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

        {/* The pull-up. "Stop after" and volume are session furniture, not part
            of choosing a sound, so they leave the composition and live behind
            one affordance at the bottom edge.
            The panel is a sibling of that affordance, not a child of it, and is
            anchored to the measured height of the bar. Hung off the bar as an
            absolutely-positioned child it would sit entirely outside its
            parent's bounds, which Android is entitled to clip. */}
        <Animated.View
          style={[styles.panel, { bottom: dockHeight }, panelStyle]}
          pointerEvents={panelOpen ? 'auto' : 'none'}
          // Closed, it is not available — and an opacity-0 control that is
          // still in the accessibility tree is a control a screen-reader user
          // can operate but nobody can see.
          accessibilityElementsHidden={!panelOpen}
          importantForAccessibility={panelOpen ? 'auto' : 'no-hide-descendants'}
        >
            <View style={styles.timerHeader}>
              <View style={styles.timerLabelRow}>
                <Timer size={ICON_SM} color={TEXT_SECONDARY} strokeWidth={ICON_STROKE} />
                <Text style={styles.controlLabel}>Stop after</Text>
              </View>
              {/* Always mounted so setting a timer doesn't jolt the row — but
                  when it is empty it is a blank text node, so it is hidden from
                  assistive tech rather than left as a stop with nothing in it.
                  One verb throughout: the control is "Stop after", so the
                  readout says "Stops in", not "Fades out in". */}
              <Text
                style={styles.timerValue}
                accessibilityElementsHidden={timerMinutes === 0}
                importantForAccessibility={
                  timerMinutes === 0 ? 'no-hide-descendants' : 'auto'
                }
                // The digits read as "zero five colon zero zero" otherwise. Not
                // a live region: this ticks every second and would talk over
                // the user.
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
                        // Grows with the OS text size so "60m" is never
                        // squeezed out of its own chip.
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
                    {/* The second, non-colour channel theme.ts requires:
                        SELECTED_FILL against GLASS_FILL is ~2.1:1, so fill plus
                        border is not a state. This is the one control whose
                        setting cannot be checked by ear and which silently ends
                        the session. Absolutely positioned — a weight change or
                        an inline mark would reflow the label inside its own
                        chip on every tap. */}
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

            {/* Credits. It used to be a circular glyph button in the masthead,
                which gave the least-used control on the screen a permanent seat
                at the top of the composition. It is about the app, not about
                the sound at the head — session furniture, same as the timer and
                the volume — so it lives behind the same affordance. Full-width
                row rather than a 48pt circle: in a panel there is no reason to
                make the target the minimum. */}
            <PressableScale
              onPress={() => {
                wake();
                setCreditsVisible(true);
              }}
              accessibilityLabel="Sound credits"
              accessibilityHint="Shows who recorded each sound and its licence"
              style={[
                styles.creditsRow,
                { minHeight: Math.round(TOUCH_MIN * boxScale) },
              ]}
            >
              <Info size={ICON_SM} color={TEXT_SECONDARY} strokeWidth={ICON_STROKE} />
              <Text style={styles.controlLabel}>Sound credits</Text>
            </PressableScale>
        </Animated.View>

        {/* The affordance. One row: a handle, and the single piece of state
            in the panel that cannot be checked by ear. */}
        <Animated.View
          style={recedeStyle}
          onLayout={(e) => {
            const h = Math.round(e.nativeEvent.layout.height);
            setDockHeight((prev) => (prev === h ? prev : h));
          }}
        >
          <PressableScale
            onPress={togglePanel}
            accessibilityLabel={
              timerMinutes > 0
                ? `Timer and volume. Stops in ${Math.floor(
                    remainingSeconds / 60,
                  )} minutes ${remainingSeconds % 60} seconds`
                : 'Timer and volume'
            }
            accessibilityHint={panelOpen ? 'Hides the controls' : 'Shows the controls'}
            accessibilityState={{ expanded: panelOpen }}
            style={[styles.dockBar, { minHeight: Math.round(TOUCH_MIN * boxScale) }]}
          >
            <View style={styles.dockHandle} />
            <View style={styles.dockRow}>
              {panelOpen ? (
                <ChevronDown
                  size={ICON_SM}
                  color={TEXT_TERTIARY}
                  strokeWidth={ICON_STROKE}
                />
              ) : (
                <ChevronUp
                  size={ICON_SM}
                  color={TEXT_TERTIARY}
                  strokeWidth={ICON_STROKE}
                />
              )}
              <Text style={styles.dockLabel}>
                {timerMinutes > 0
                  ? `Stops in ${formatTimer()}`
                  : 'Timer and volume'}
              </Text>
            </View>
          </PressableScale>
        </Animated.View>

        {/* No dim overlay. A full-screen scrim over a 10%-brightness screen was
            a black rectangle that ate the first touch: reaching for a control
            cost two gestures, the first of which did nothing but dismiss. The
            interface recedes instead (see the recede shared value), the
            brightness floor is legible, and the root Pressable restores
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
  /**
   * The stage takes the surplus that used to pool into one void between the
   * strip and the controls card, and centres the run, the disc and the status
   * line inside it. flexShrink lets it give way on a short screen rather than
   * pushing the pull-up off the bottom.
   */
  stage: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    // Not clipped: the failure overlay hangs below the stage, and the rain is a
    // full-screen layer that keeps a corridor clear around this block rather
    // than being trapped in it.
  },
  /**
   * The dial's window. Bounded to DIAL_VISIBLE_ROWS — left to flex it would
   * absorb every surplus pixel and push the transport under the pull-up on a
   * small screen — and allowed to shrink below that when there is less room.
   */
  dialZone: {
    alignSelf: 'stretch',
    flexShrink: 1,
  },
  dialRow: {
    justifyContent: 'center',
  },
  /**
   * The hit box, and it is never transformed. `flex: 1` makes it the whole
   * `pitch`-tall row rather than just the type inside it, so the smallest
   * target on the run is the row pitch — comfortably above TOUCH_MIN — at every
   * distance from the head and at every text size.
   */
  dialRowPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE_LG,
    minHeight: TOUCH_MIN,
  },
  /** The only thing that scales. See `contentStyle` in DialRow. */
  dialRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE_SM,
    flexShrink: 1,
  },
  /**
   * The name at the head, at display scale. Neighbours are the same Text
   * scaled down on the UI thread rather than a smaller font size, so moving the
   * run costs no layout and nothing re-renders while a finger is down.
   *
   * Colour is TEXT_PRIMARY and the white-alpha ramp is applied as opacity: the
   * steps the run needs are continuous, and interpolating opacity over the
   * primary is exactly the ramp the theme defines, resolved per frame.
   */
  dialName: {
    color: TEXT_PRIMARY,
    fontFamily: FONT_DISPLAY_LIGHT,
    fontSize: FONT_DISPLAY_SIZE,
    lineHeight: FONT_DISPLAY_SIZE * LEADING_TIGHT,
    // Slightly negative, not +0.015em. Tracking is a correction for small type;
    // at 34pt on a 300-weight face, positive tracking reads as the word coming
    // apart.
    letterSpacing: -0.3,
    textAlign: 'center',
    flexShrink: 1,
  },
  dialNameAccent: {
    color: ACCENT,
  },
  /**
   * Inset to SPACE_LG like everything else on the screen. Run to `left: 0,
   * right: 0` the ticks touched the bezel, which is the one place on a phone
   * where a deliberate mark and a rendering artefact look identical.
   */
  headMark: {
    position: 'absolute',
    left: SPACE_LG,
    right: SPACE_LG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headTick: {
    width: SPACE_XL,
    height: HEAD_TICK_THICKNESS,
    borderRadius: RADIUS_PILL,
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
  /**
   * The hero control, and the state the app opens in every session is paused —
   * so paused is the state that has to read first. A filled disc at the
   * TEXT_PRIMARY end of the ramp with a dark glyph makes it unambiguously the
   * heaviest thing on the stage, at full brightness and at the session floor
   * alike.
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
  // No shadow of any kind.
  //
  // `elevation` is out because Android draws it as a polygon outline, so a
  // 999-radius button got a dark octagonal plate behind it at the app's one
  // hero moment. The iOS-only `shadow*` set that survived that cut is out too:
  // a coloured shadow at zero offset is not depth, it is a glow — decoration
  // with a light source nowhere. The playing state is already carried on four
  // channels (accent ring, accent fill, glyph shape, glyph colour) plus the
  // status line, so the halo was buying a fifth reading of something nobody
  // was struggling to read.
  playButtonActive: {
    // 3px, not 2: playing is the state that has to survive the session dim,
    // where a 2px ring is a hairline. The border width is compensated in
    // playButton so the disc does not resize between states.
    borderWidth: 3,
    borderColor: ACCENT,
    backgroundColor: ACCENT_SOFT,
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
  errorSlot: {
    // Out of flow: the failure row is overlaid beneath the status line rather
    // than reserving a slot, so nothing above it can shift and the healthy
    // case costs no vertical space at all.
    position: 'absolute',
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
  /**
   * Out of flow, anchored above the affordance row, so opening the panel
   * cannot move the stage above it by a pixel — and closing it cannot either.
   * `bottom` is set at the call site from the measured bar height.
   */
  panel: {
    position: 'absolute',
    left: SPACE_LG,
    right: SPACE_LG,
    marginBottom: SPACE_XS,
    padding: SPACE_MD,
    borderRadius: RADIUS_LG,
    backgroundColor: GLASS_FILL,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  dockBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACE_SM,
    paddingHorizontal: SPACE_LG,
    gap: SPACE_XS,
  },
  dockHandle: {
    width: SPACE_XL,
    height: SPACE_XXS,
    borderRadius: RADIUS_PILL,
    backgroundColor: GLASS_BORDER,
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // At large text sizes the glyph and the label stop fitting side by side;
    // they stack rather than squeeze each other.
    flexWrap: 'wrap',
    gap: SPACE_XS,
  },
  dockLabel: {
    color: TEXT_TERTIARY,
    fontSize: FONT_LABEL,
  },
  selectionDot: {
    position: 'absolute',
    bottom: SPACE_XXS,
    width: SELECTION_DOT,
    height: SELECTION_DOT,
    borderRadius: SELECTION_DOT / 2,
  },
  retryText: {
    color: ACCENT,
    fontSize: FONT_LABEL,
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
  /**
   * Separated by a divider rather than by another gap: the timer and the volume
   * operate the sound that is playing, and this one opens a sheet about the
   * app. DIVIDER, not GLASS_BORDER — a rule inside a panel is not an
   * interactive boundary and does not owe 3:1.
   */
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // At large text sizes the glyph and the label stop fitting side by side;
    // they stack rather than squeeze each other.
    flexWrap: 'wrap',
    gap: SPACE_XS,
    marginTop: SPACE_MD,
    paddingTop: SPACE_SM,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER,
  },
  slider: {
    flex: 1,
    height: TOUCH_MIN,
    marginHorizontal: SPACE_XS,
  },
});

import Slider from '@react-native-community/slider';
import * as Brightness from 'expo-brightness';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Pause, Play, Volume1, Volume2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityState,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
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
  BACKGROUND_GRADIENT,
  FONT_DISPLAY_LIGHT,
  FONT_DISPLAY_SEMIBOLD,
  GLASS_BORDER,
  GLASS_FILL,
  SELECTED_BORDER,
  SELECTED_FILL,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from './theme';

const DIM_AFTER_MS = 2 * 60 * 1000;
const DIMMED_BRIGHTNESS = 0.1;
const TIMER_OPTIONS = [0, 15, 30, 60];
const RAIN_DROP_COUNT = 14;
const PRESS_SPRING = { damping: 18, stiffness: 320 };

// --- Press feedback wrapper ---------------------------------------------

interface PressableScaleProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
}

function PressableScale({
  onPress,
  style,
  children,
  accessibilityLabel,
  accessibilityState,
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
        onPressIn={() => {
          scale.value = withSpring(0.96, PRESS_SPRING);
        }}
        onPressOut={() => {
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
}

function RainDrop({
  config,
  playing,
  left,
  travel,
}: {
  config: DropConfig;
  playing: boolean;
  left: number;
  travel: number;
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          -config.height + progress.value * (travel + config.height * 2),
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.rainDrop,
        { left, height: config.height, opacity: config.opacity },
        animatedStyle,
      ]}
    />
  );
}

function RainLayer({
  playing,
  drops,
}: {
  playing: boolean;
  drops: DropConfig[];
}) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const layerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(playing ? 1 : 0, { duration: 400 }),
  }));
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.rainLayer, layerStyle]}
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
          />
        ))}
    </Animated.View>
  );
}

export default function PlayerScreen() {
  useKeepAwake();

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const reducedMotion = useReducedMotion();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [creditsVisible, setCreditsVisible] = useState(false);

  // Id of the sound currently loaded into the player (so play after pause
  // resumes instead of restarting via replace).
  const loadedSoundIdRef = useRef<string | null>(null);

  // Sleep timer
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Screen dimming
  const [isDimmed, setIsDimmed] = useState(false);
  const dimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalBrightnessRef = useRef<number | null>(null);

  const selectedSound = ALL_SOUNDS[selectedIndex];

  // Ambient rain drop configs, generated once per mount.
  const drops = useMemo<DropConfig[]>(
    () =>
      Array.from({ length: RAIN_DROP_COUNT }, () => ({
        xFrac: 0.04 + Math.random() * 0.92,
        height: 12 + Math.random() * 6,
        opacity: 0.05 + Math.random() * 0.07,
        duration: 2200 + Math.random() * 2000,
        delay: Math.random() * 2600,
      })),
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

  // --- Screen dimming -------------------------------------------------

  const armDimTimer = useCallback(() => {
    if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
    dimTimerRef.current = setTimeout(async () => {
      try {
        originalBrightnessRef.current = await Brightness.getBrightnessAsync();
        await Brightness.setBrightnessAsync(DIMMED_BRIGHTNESS);
      } catch {}
      setIsDimmed(true);
    }, DIM_AFTER_MS);
  }, []);

  const wake = useCallback(async () => {
    if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
    if (isDimmed) {
      setIsDimmed(false);
      try {
        if (originalBrightnessRef.current != null) {
          await Brightness.setBrightnessAsync(originalBrightnessRef.current);
        }
      } catch {}
    }
    armDimTimer();
  }, [armDimTimer, isDimmed]);

  useEffect(() => {
    armDimTimer();
    return () => {
      if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (originalBrightnessRef.current != null) {
        Brightness.setBrightnessAsync(originalBrightnessRef.current).catch(() => {});
      }
    };
  }, [armDimTimer]);

  // --- Playback -------------------------------------------------------

  const startSound = (index: number) => {
    const sound = ALL_SOUNDS[index];
    player.replace(sound.source);
    player.loop = true;
    player.volume = volume;
    player.play();
    loadedSoundIdRef.current = sound.id;

    // Media notification / lock screen controls; also required for
    // sustained background playback on Android.
    player.setActiveForLockScreen(
      true,
      { title: sound.name, artist: 'Jewel Rain', albumTitle: 'Nature Sounds' },
      { showSeekForward: false, showSeekBackward: false, isLiveStream: true },
    );
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
    setVolume(value);
    player.volume = value;
  };

  // --- Sleep timer ------------------------------------------------------

  const fadeOutAndStop = useCallback(async () => {
    for (let v = player.volume; v >= 0; v -= 0.05) {
      player.volume = Math.max(v, 0);
      await new Promise((r) => setTimeout(r, 100));
    }
    player.pause();
    player.volume = volume;
    setTimerMinutes(0);
    setRemainingSeconds(0);
  }, [player, volume]);

  const setSleepTimer = (minutes: number) => {
    wake();
    Haptics.selectionAsync();
    if (countdownRef.current) clearInterval(countdownRef.current);

    setTimerMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    if (minutes === 0) return;

    countdownRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          fadeOutAndStop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTimer = () => {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // --- UI ---------------------------------------------------------------

  const renderTile = (
    sound: Sound,
    index: number,
    size: number,
    showLabel: boolean,
  ) => {
    const isSelected = index === selectedIndex;
    const Icon = getSoundIcon(sound.id);
    const iconColor = isSelected
      ? status.playing
        ? ACCENT
        : TEXT_PRIMARY
      : TEXT_SECONDARY;
    return (
      <View key={sound.id} style={styles.tileWrap}>
        <PressableScale
          onPress={() => onSoundTap(index)}
          accessibilityLabel={sound.name}
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
            strokeWidth={1.75}
          />
        </PressableScale>
        {showLabel && (
          <Text
            style={[
              styles.tileLabel,
              { color: isSelected ? TEXT_PRIMARY : TEXT_TERTIARY },
            ]}
          >
            {sound.name}
          </Text>
        )}
      </View>
    );
  };

  return (
    <Pressable style={styles.flex} onPress={wake}>
      <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.appTitle}>Jewel Rain</Text>
            <Text style={styles.appSubtitle}>Pick a sound and drift away</Text>
          </View>
          <TouchableOpacity
            style={styles.infoButton}
            accessibilityRole="button"
            accessibilityLabel="Sound credits"
            onPress={() => {
              wake();
              setCreditsVisible(true);
            }}
          >
            <Text style={styles.infoButtonText}>i</Text>
          </TouchableOpacity>
        </View>

        {/* Featured sounds */}
        <View style={styles.featuredRow}>
          {FEATURED_SOUNDS.map((sound, i) => renderTile(sound, i, 88, false))}
        </View>

        {/* More sounds */}
        <Text style={styles.sectionTitle}>MORE SOUNDS</Text>
        <View style={styles.moreSoundsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.moreSoundsScroll}
            contentContainerStyle={styles.moreSoundsContent}
          >
            {MORE_SOUNDS.map((sound, i) =>
              renderTile(sound, FEATURED_SOUNDS.length + i, 68, true),
            )}
          </ScrollView>
          <LinearGradient
            colors={['rgba(9,11,15,0)', 'rgba(9,11,15,0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scrollFade}
            pointerEvents="none"
          />
        </View>

        {/* Now playing */}
        <View style={styles.centerZone}>
          {!reducedMotion && (
            <RainLayer playing={status.playing} drops={drops} />
          )}
          <Text style={styles.soundTitle}>{selectedSound.name}</Text>
          <PressableScale
            onPress={togglePlayPause}
            accessibilityLabel={status.playing ? 'Pause' : 'Play'}
            style={[
              styles.playButton,
              status.playing && styles.playButtonActive,
            ]}
          >
            {status.playing ? (
              <Pause size={30} color={ACCENT} strokeWidth={1.75} />
            ) : (
              <Play
                size={30}
                color={TEXT_PRIMARY}
                strokeWidth={1.75}
                style={styles.playIconNudge}
              />
            )}
          </PressableScale>
          <Text
            style={[
              styles.statusText,
              { color: status.playing ? ACCENT : TEXT_TERTIARY },
            ]}
          >
            {status.playing ? 'Playing' : 'Paused'}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.timerHeader}>
            <View style={styles.timerLabelRow}>
              <Moon size={14} color={TEXT_SECONDARY} strokeWidth={1.75} />
              <Text style={styles.controlLabel}>Sleep Timer</Text>
            </View>
            {timerMinutes > 0 && (
              <Text style={styles.timerValue}>{formatTimer()}</Text>
            )}
          </View>
          <View style={styles.timerRow}>
            {TIMER_OPTIONS.map((minutes) => {
              const isSelected = timerMinutes === minutes;
              return (
                <TouchableOpacity
                  key={minutes}
                  onPress={() => setSleepTimer(minutes)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    minutes === 0
                      ? 'Sleep timer off'
                      : `Sleep timer ${minutes} minutes`
                  }
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.timerChip,
                    {
                      backgroundColor: isSelected ? SELECTED_FILL : GLASS_FILL,
                      borderColor: isSelected ? SELECTED_BORDER : GLASS_BORDER,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timerChipText,
                      {
                        color: isSelected ? TEXT_PRIMARY : TEXT_SECONDARY,
                        fontWeight: isSelected ? 'bold' : 'normal',
                      },
                    ]}
                  >
                    {minutes === 0 ? 'Off' : `${minutes}m`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.volumeRow}>
            <Volume1 size={16} color={TEXT_TERTIARY} strokeWidth={1.75} />
            <Slider
              style={styles.slider}
              value={volume}
              onValueChange={onVolumeChange}
              onSlidingComplete={(value) => setStoredVolume(value)}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor={ACCENT}
              maximumTrackTintColor={GLASS_BORDER}
              thumbTintColor="#ffffff"
              accessibilityLabel="Volume"
            />
            <Volume2 size={16} color={TEXT_TERTIARY} strokeWidth={1.75} />
          </View>
        </View>

        {/* Dim overlay */}
        {isDimmed && (
          <Pressable style={styles.dimOverlay} onPress={wake}>
            <Moon size={36} color={TEXT_TERTIARY} strokeWidth={1.5} />
            <Text style={styles.dimText}>Tap to wake</Text>
          </Pressable>
        )}

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
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  appTitle: {
    color: TEXT_PRIMARY,
    fontFamily: FONT_DISPLAY_SEMIBOLD,
    fontSize: 22,
    letterSpacing: 0.3,
  },
  appSubtitle: {
    color: TEXT_TERTIARY,
    fontSize: 13,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GLASS_FILL,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    color: TEXT_SECONDARY,
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginTop: 24,
  },
  tileWrap: {
    alignItems: 'center',
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 11,
    marginTop: 6,
  },
  sectionTitle: {
    color: TEXT_TERTIARY,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 28,
    marginBottom: 12,
    paddingHorizontal: 28,
  },
  moreSoundsWrap: {
    flexGrow: 0,
  },
  moreSoundsScroll: {
    flexGrow: 0,
  },
  moreSoundsContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  scrollFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 40,
  },
  centerZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rainLayer: {
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  rainDrop: {
    position: 'absolute',
    top: 0,
    width: 2,
    borderRadius: 1,
    backgroundColor: '#ffffff',
  },
  soundTitle: {
    color: TEXT_PRIMARY,
    fontFamily: FONT_DISPLAY_LIGHT,
    fontSize: 30,
    letterSpacing: 0.5,
  },
  playButton: {
    marginTop: 26,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: GLASS_FILL,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonActive: {
    borderColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  playIconNudge: {
    marginLeft: 2,
  },
  statusText: {
    marginTop: 12,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  controls: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 24,
    backgroundColor: GLASS_FILL,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlLabel: {
    color: TEXT_SECONDARY,
  },
  timerValue: {
    color: TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 14,
  },
  timerChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  timerChipText: {
    fontSize: 14,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  dimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimText: {
    color: TEXT_TERTIARY,
    fontSize: 16,
    marginTop: 10,
  },
});

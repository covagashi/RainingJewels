import Slider from '@react-native-community/slider';
import * as Brightness from 'expo-brightness';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import CreditsModal from './CreditsModal';
import { ALL_SOUNDS, FEATURED_SOUNDS, MORE_SOUNDS, Sound } from './sounds';
import {
  ACCENT,
  ACCENT_SOFT,
  BACKGROUND_GRADIENT,
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

export default function PlayerScreen() {
  useKeepAwake();

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [creditsVisible, setCreditsVisible] = useState(false);

  // Sleep timer
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Screen dimming
  const [isDimmed, setIsDimmed] = useState(false);
  const dimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalBrightnessRef = useRef<number | null>(null);

  const selectedSound = ALL_SOUNDS[selectedIndex];

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

  const onSoundTap = (index: number) => {
    wake();

    // Tapping the selected sound while playing toggles it off.
    if (index === selectedIndex && status.playing) {
      player.pause();
      return;
    }

    setSelectedIndex(index);
    const sound = ALL_SOUNDS[index];
    player.replace(sound.source);
    player.loop = true;
    player.volume = volume;
    player.play();

    // Media notification / lock screen controls; also required for
    // sustained background playback on Android.
    player.setActiveForLockScreen(
      true,
      { title: sound.name, artist: 'Jewel Rain', albumTitle: 'Nature Sounds' },
      { showSeekForward: false, showSeekBackward: false, isLiveStream: true },
    );
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
    return (
      <View key={sound.id} style={styles.tileWrap}>
        <TouchableOpacity
          onPress={() => onSoundTap(index)}
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
          <Text style={{ fontSize: size * 0.38 }}>{sound.icon}</Text>
        </TouchableOpacity>
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

        {/* Selected sound title + play state */}
        <View style={styles.titleContainer}>
          <Text style={styles.soundTitle}>{selectedSound.name}</Text>
          <View
            style={[
              styles.playChip,
              {
                backgroundColor: status.playing ? ACCENT_SOFT : GLASS_FILL,
                borderColor: status.playing ? ACCENT : GLASS_BORDER,
                opacity: status.playing ? 1 : 0.5,
              },
            ]}
          >
            <Text
              style={[
                styles.playChipText,
                { color: status.playing ? ACCENT : TEXT_TERTIARY },
              ]}
            >
              {status.playing ? '♫ Playing' : '❚❚ Paused'}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.timerHeader}>
            <Text style={styles.controlLabel}>🌙 Sleep Timer</Text>
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
            <Text style={styles.volumeIcon}>🔉</Text>
            <Slider
              style={styles.slider}
              value={volume}
              onValueChange={onVolumeChange}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor={ACCENT}
              maximumTrackTintColor={GLASS_BORDER}
              thumbTintColor="#ffffff"
            />
            <Text style={styles.volumeIcon}>🔊</Text>
          </View>
        </View>

        {/* Dim overlay */}
        {isDimmed && (
          <Pressable style={styles.dimOverlay} onPress={wake}>
            <Text style={styles.dimIcon}>🌙</Text>
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
    fontSize: 22,
    fontWeight: '600',
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
  moreSoundsScroll: {
    flexGrow: 0,
  },
  moreSoundsContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundTitle: {
    color: TEXT_PRIMARY,
    fontSize: 30,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  playChip: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  playChipText: {
    fontSize: 12,
    fontWeight: '500',
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
  volumeIcon: {
    fontSize: 14,
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
  dimIcon: {
    fontSize: 36,
    opacity: 0.6,
  },
  dimText: {
    color: TEXT_TERTIARY,
    fontSize: 16,
    marginTop: 10,
  },
});

import Slider from '@react-native-community/slider';
import * as Brightness from 'expo-brightness';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
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
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    }).catch(() => {});
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
    player.replace(ALL_SOUNDS[index].source);
    player.loop = true;
    player.volume = volume;
    player.play();
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

  const renderCircle = (sound: Sound, index: number, size: number) => {
    const isSelected = index === selectedIndex;
    return (
      <TouchableOpacity
        key={sound.id}
        onPress={() => onSoundTap(index)}
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: `rgba(255,255,255,${isSelected ? 0.3 : 0.1})`,
            borderColor: `rgba(255,255,255,${isSelected ? 0.8 : 0.3})`,
            borderWidth: isSelected ? 3 : 1,
          },
        ]}
      >
        <Text style={{ fontSize: size * 0.4 }}>{sound.icon}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Pressable style={styles.root} onPress={wake}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => {
            wake();
            setCreditsVisible(true);
          }}
        >
          <Text style={styles.infoButtonText}>?</Text>
        </TouchableOpacity>
      </View>

      {/* Featured sounds */}
      <View style={styles.featuredRow}>
        {FEATURED_SOUNDS.map((sound, i) =>
          renderCircle(sound, i, i === selectedIndex ? 80 : 60),
        )}
      </View>

      {/* More sounds */}
      <Text style={styles.sectionTitle}>MORE SOUNDS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.moreSoundsScroll}
        contentContainerStyle={styles.moreSoundsContent}
      >
        {MORE_SOUNDS.map((sound, i) => {
          const index = FEATURED_SOUNDS.length + i;
          const isSelected = index === selectedIndex;
          return (
            <View key={sound.id} style={styles.moreSoundItem}>
              {renderCircle(sound, index, 56)}
              <Text
                style={[
                  styles.moreSoundLabel,
                  { color: `rgba(255,255,255,${isSelected ? 0.9 : 0.5})` },
                ]}
              >
                {sound.name}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Selected sound title */}
      <View style={styles.titleContainer}>
        <Text style={styles.soundTitle}>{selectedSound.name}</Text>
        <Text style={styles.playState}>
          {status.playing ? 'playing' : 'paused'}
        </Text>
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
                    backgroundColor: `rgba(255,255,255,${isSelected ? 0.3 : 0.1})`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timerChipText,
                    isSelected && { fontWeight: 'bold' },
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
            minimumTrackTintColor="#ffffff"
            maximumTrackTintColor="rgba(255,255,255,0.3)"
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
  },
  featuredRow: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginTop: 10,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 30,
  },
  moreSoundsScroll: {
    flexGrow: 0,
  },
  moreSoundsContent: {
    paddingHorizontal: 24,
    gap: 14,
  },
  moreSoundItem: {
    alignItems: 'center',
  },
  moreSoundLabel: {
    fontSize: 11,
    marginTop: 6,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
  playState: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 6,
  },
  controls: {
    margin: 30,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlLabel: {
    color: 'rgba(255,255,255,0.8)',
  },
  timerValue: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 15,
  },
  timerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  timerChipText: {
    color: '#fff',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
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
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 10,
  },
});

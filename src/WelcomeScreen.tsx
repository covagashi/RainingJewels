import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { setHasSeenWelcome } from './storage';
import {
  BACKGROUND_GRADIENT,
  FONT_DISPLAY_BOLD,
  FONT_DISPLAY_LIGHT,
  FONT_DISPLAY_MEDIUM,
  TEXT_PRIMARY,
  TEXT_TERTIARY,
} from './theme';

interface Props {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: Props) {
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const scale = useSharedValue(1);
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      floatY.value = 0;
      return;
    }
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [reducedMotion, floatY]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pictoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    setHasSeenWelcome();
    onStart();
  };

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.root}>
      <Animated.View style={pictoAnimatedStyle}>
        <Image
          source={require('../assets/picto-light.png')}
          style={{ width: width * 0.55, height: width * 0.55 }}
          resizeMode="contain"
          accessible={false}
          accessibilityLabel="Girl with umbrella in the rain"
        />
      </Animated.View>
      <Text style={styles.title}>
        <Text style={styles.titleLight}>Jewel</Text>
        <Text style={styles.titleBold}>Rain.</Text>
      </Text>
      <Text style={styles.subtitle}>Ambient sounds for sleep and focus</Text>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="button"
      >
        <Animated.View style={[styles.button, buttonAnimatedStyle]}>
          <Text style={styles.buttonText}>I want to relax</Text>
        </Animated.View>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 38,
    marginTop: 28,
  },
  titleLight: {
    color: TEXT_PRIMARY,
    fontFamily: FONT_DISPLAY_LIGHT,
  },
  titleBold: {
    color: TEXT_PRIMARY,
    fontFamily: FONT_DISPLAY_BOLD,
  },
  subtitle: {
    color: TEXT_TERTIARY,
    fontSize: 14,
    marginTop: 8,
  },
  button: {
    marginTop: 32,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONT_DISPLAY_MEDIUM,
  },
});

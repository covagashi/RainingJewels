import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
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
  FONT_DISPLAY_SIZE,
  FONT_LABEL,
  FONT_TITLE,
  RADIUS_PILL,
  SPACE_LG,
  SPACE_MD,
  SPACE_XL,
  SPACE_XS,
  SPACE_XXL,
  TEXT_PRIMARY,
  TEXT_TERTIARY,
  TOUCH_MIN,
} from './theme';

interface Props {
  onStart: () => void;
}

/**
 * As the system text size grows the type takes the room and the decorative
 * picto gives it up. Nothing here is ever clipped to protect a box: past these
 * steps the screen scrolls.
 */
function pictoFraction(fontScale: number) {
  if (fontScale >= 1.5) return 0.28;
  if (fontScale >= 1.25) return 0.4;
  return 0.55;
}

export default function WelcomeScreen({ onStart }: Props) {
  const { width, fontScale } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const pictoSize = width * pictoFraction(fontScale);
  const roomy = fontScale < 1.25;

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
    if (reducedMotion) return;
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (reducedMotion) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    setHasSeenWelcome();
    onStart();
  };

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.root}>
      {/* Centred at normal text sizes; scrolls instead of clipping once the
          system text size pushes the stack past the viewport. */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={pictoAnimatedStyle}>
          {/* Decorative: the name and tagline below carry the meaning. */}
          <Image
            source={require('../assets/picto-light.png')}
            style={{ width: pictoSize, height: pictoSize }}
            resizeMode="contain"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          />
        </Animated.View>
        <Text style={styles.title} accessibilityRole="header">
          <Text style={styles.titleLight}>Raining </Text>
          <Text style={styles.titleBold}>Jewels.</Text>
        </Text>
        <Text style={styles.subtitle}>Ambient sounds for relaxing and meditating</Text>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="Choose a sound"
          accessibilityHint="Opens the player and lets you pick a sound"
          style={styles.buttonPressable}
        >
          <Animated.View
            style={[
              styles.button,
              roomy ? styles.buttonRoomy : styles.buttonTight,
              buttonAnimatedStyle,
            ]}
          >
            <Text style={styles.buttonText}>Choose a sound</Text>
          </Animated.View>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE_LG,
  },
  title: {
    fontSize: FONT_DISPLAY_SIZE,
    marginTop: SPACE_XL,
    textAlign: 'center',
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
    fontSize: FONT_LABEL,
    marginTop: SPACE_XS,
    textAlign: 'center',
  },
  buttonPressable: {
    // The pill may never be wider than the screen, whatever the text size.
    maxWidth: '100%',
  },
  button: {
    marginTop: SPACE_XL,
    minHeight: TOUCH_MIN,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: TEXT_PRIMARY,
    borderRadius: RADIUS_PILL,
    paddingVertical: SPACE_MD,
  },
  buttonRoomy: {
    paddingHorizontal: SPACE_XXL,
  },
  // Large system text needs the width for the label, not for the pill's ends.
  buttonTight: {
    paddingHorizontal: SPACE_LG,
  },
  buttonText: {
    color: TEXT_PRIMARY,
    fontSize: FONT_TITLE,
    fontFamily: FONT_DISPLAY_MEDIUM,
    textAlign: 'center',
  },
});

import {
  Manrope_300Light,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import PlayerScreen from './src/PlayerScreen';
import WelcomeScreen from './src/WelcomeScreen';
import { getHasSeenWelcome } from './src/storage';
import { BG_TOP } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Hard ceiling on the pre-render wait. Nothing on the startup path is allowed
 * to keep the splash screen up longer than this: if fonts or storage are still
 * pending we render anyway, with system fonts and default state.
 */
const STARTUP_TIMEOUT_MS = 3000;

const hideSplash = () => {
  SplashScreen.hideAsync().catch(() => {});
};

export default function App() {
  const [started, setStarted] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const [startupTimedOut, setStartupTimedOut] = useState(false);

  // The error is the second tuple element. Dropping it is what used to strand
  // the app on the splash screen forever when a font failed to load.
  //
  // Four weights, deliberately. `theme.ts` also exports
  // FONT_DISPLAY_REGULAR = 'Manrope_400Regular', which is NOT loaded here and
  // has no remaining consumer — anything using it would silently fall back to
  // the system face. The fix is to delete the token, not to load a fifth file:
  // every byte here is on the critical path between opening the app and
  // hearing something, and 400 sits between two weights already loaded, so it
  // buys no typographic range. Deleting it is a change to `theme.ts`, which
  // this pass does not own; see the report.
  const [fontsLoaded, fontError] = useFonts({
    Manrope_300Light,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    let cancelled = false;
    getHasSeenWelcome()
      .catch(() => false)
      .then((hasSeen) => {
        if (cancelled) return;
        if (hasSeen) setStarted(true);
        setWelcomeChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStartupTimedOut(true);
      // Belt and braces: drop the splash even if the tree somehow never lays out.
      hideSplash();
    }, STARTUP_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  // A font failure is non-fatal. React Native falls back to the system face,
  // which is a worse-looking app but still a usable one — unlike a dead splash.
  const fontsSettled = fontsLoaded || fontError != null;
  const ready = (fontsSettled && welcomeChecked) || startupTimedOut;

  const onLayoutRootView = useCallback(() => {
    hideSplash();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} onLayout={onLayoutRootView}>
        <StatusBar style="light" />
        {started ? <PlayerScreen /> : <WelcomeScreen onStart={() => setStarted(true)} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_TOP,
  },
});

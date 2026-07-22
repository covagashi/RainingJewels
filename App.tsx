import {
  Manrope_300Light,
  Manrope_400Regular,
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

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [started, setStarted] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);

  const [fontsLoaded] = useFonts({
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    let cancelled = false;
    getHasSeenWelcome().then((hasSeen) => {
      if (cancelled) return;
      if (hasSeen) setStarted(true);
      setWelcomeChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = fontsLoaded && welcomeChecked;

  const onLayoutRootView = useCallback(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

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
    backgroundColor: '#0a0a0a',
  },
});

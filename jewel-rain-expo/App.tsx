import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import PlayerScreen from './src/PlayerScreen';
import WelcomeScreen from './src/WelcomeScreen';

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {started ? <PlayerScreen /> : <WelcomeScreen onStart={() => setStarted(true)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});

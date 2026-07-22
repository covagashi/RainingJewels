import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { BACKGROUND_GRADIENT, TEXT_PRIMARY, TEXT_TERTIARY } from './theme';

interface Props {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: Props) {
  const { width } = useWindowDimensions();

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.root}>
      <Image
        source={require('../assets/picto.png')}
        style={{ width: width * 0.55, height: width * 0.55 }}
        resizeMode="contain"
      />
      <Text style={styles.title}>
        Relaxing
        <Text style={styles.titleBold}>Rain.</Text>
      </Text>
      <Text style={styles.subtitle}>Ambient sounds for sleep and focus</Text>
      <TouchableOpacity style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>I want to relax</Text>
      </TouchableOpacity>
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
    color: TEXT_PRIMARY,
    fontSize: 38,
    fontWeight: '300',
    marginTop: 28,
  },
  titleBold: {
    fontWeight: 'bold',
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
    fontWeight: '500',
  },
});

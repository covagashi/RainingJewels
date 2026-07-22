import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

interface Props {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: Props) {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.root}>
      <Image
        source={require('../assets/picto.png')}
        style={{ width: width * 0.6, height: width * 0.6 }}
        resizeMode="contain"
      />
      <Text style={styles.title}>
        Relaxing
        <Text style={styles.titleBold}>Rain.</Text>
      </Text>
      <TouchableOpacity style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>I want to relax</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 40,
    marginTop: 10,
  },
  titleBold: {
    fontWeight: 'bold',
  },
  button: {
    marginTop: 20,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 30,
    padding: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
  },
});

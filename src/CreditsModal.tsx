import React from 'react';
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getSoundIcon } from './icons';
import { ALL_SOUNDS } from './sounds';
import { ACCENT, BG_SHEET, FONT_DISPLAY_SEMIBOLD } from './theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function Link({ text, url }: { text: string; url: string }) {
  return (
    <Text style={styles.link} onPress={() => Linking.openURL(url)} accessibilityRole="link">
      {text}
    </Text>
  );
}

export default function CreditsModal({ visible, onClose }: Props) {
  const creditedSounds = ALL_SOUNDS.filter((s) => s.attributions.length > 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Sound credits</Text>
            <Text style={styles.intro}>
              These sounds come from the open-source Noice sound library
              (trynoice.com). Some are Creative Commons recordings shared by
              their original authors and edited into seamless loops by the
              Noice project; others are Noice's own recordings, licensed
              under GPL-3.0. Jewel Rain is free software licensed under
              GPL-3.0 — its source code is available at
              github.com/covagashi/RainingJewels.
            </Text>
            <Link text="github.com/trynoice" url="https://github.com/trynoice" />

            {creditedSounds.map((sound) => {
              const Icon = getSoundIcon(sound.id);
              return (
                <View key={sound.id} style={styles.soundBlock}>
                  <View style={styles.soundNameRow}>
                    <Icon size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.75} />
                    <Text style={styles.soundName}>{sound.name}</Text>
                  </View>
                  {sound.attributions.map((a, i) => (
                    <Text key={i} style={styles.attribution}>
                      <Link text={a.sourceName} url={a.sourceUrl} />
                      <Text style={styles.dim}> by </Text>
                      <Link text={a.author} url={a.authorUrl} />
                      <Text style={styles.dim}> · </Text>
                      <Link text={a.license} url={a.licenseUrl} />
                    </Text>
                  ))}
                </View>
              );
            })}

            <Text style={styles.contact}>
              Contact: hello@covaga.xyz — Subject: Raining Jewels - FAQ
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close credits"
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '80%',
    backgroundColor: BG_SHEET,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontFamily: FONT_DISPLAY_SEMIBOLD,
    marginBottom: 8,
  },
  intro: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    marginBottom: 4,
  },
  soundBlock: {
    marginTop: 16,
  },
  soundNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soundName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  attribution: {
    marginLeft: 12,
    marginBottom: 6,
    fontSize: 12,
  },
  dim: {
    color: 'rgba(255,255,255,0.72)',
  },
  link: {
    color: ACCENT,
    textDecorationLine: 'underline',
    fontSize: 13,
  },
  contact: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginTop: 24,
  },
  closeButton: {
    minHeight: 48,
    padding: 16,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
  },
});

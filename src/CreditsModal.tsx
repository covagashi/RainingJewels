import React from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { getSoundIcon } from './icons';
import { ALL_SOUNDS, SoundAttribution } from './sounds';
import {
  ACCENT,
  BG_SHEET,
  DIVIDER,
  FONT_BODY,
  FONT_CAPTION,
  FONT_DISPLAY_MEDIUM,
  FONT_DISPLAY_SEMIBOLD,
  FONT_HEADLINE,
  FONT_LABEL,
  FONT_TITLE,
  LEADING_BODY,
  ICON_SM,
  ICON_STROKE,
  RADIUS_SHEET,
  SCRIM,
  SPACE_LG,
  SPACE_MD,
  SPACE_SM,
  SPACE_XS,
  SPACE_XXS,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TOUCH_GAP,
  TOUCH_MIN,
} from './theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const GPL_3_URL = 'https://www.gnu.org/licenses/gpl-3.0.html';
const NOICE_SITE_URL = 'https://trynoice.com';
const NOICE_REPO_URL = 'https://github.com/trynoice';
const SOURCE_URL = 'https://github.com/covagashi/RainingJewels';

const open = (url: string) => {
  Linking.openURL(url).catch(() => {});
};

/** Standalone link with a real hit area. */
function Link({ text, url }: { text: string; url: string }) {
  return (
    <Pressable
      onPress={() => open(url)}
      accessibilityRole="link"
      accessibilityLabel={text}
      style={styles.standaloneLink}
      hitSlop={SPACE_XS}
    >
      <Text style={styles.link}>{text}</Text>
    </Pressable>
  );
}

/**
 * Above this system text scale an attribution stops being a row and becomes a
 * stack. Two 48pt targets side by side stop fitting long before 200%, and the
 * licence must never be the thing that gives way.
 */
const STACK_FONT_SCALE = 1.25;

/**
 * One attribution as a single row-level target.
 *
 * This used to be three inline pressable <Text> runs nested inside a parent
 * <Text> — roughly 85 tap targets about 16pt tall across the sheet, which both
 * failed the touch minimum and got exposed inconsistently by screen readers.
 * The row is now one control with one accessible name; the licence link stays
 * separate because it points somewhere genuinely different.
 *
 * Layout note — why the licence used to be pushed off the right edge:
 * the filename is a measured text leaf, and a flex item's automatic minimum
 * main size is its min-content width. `flex: 1` alone therefore could not take
 * the left target below the intrinsic width of the longest unbroken run, so
 * the row grew past the sheet and the licence, which comes after it, was
 * clipped. `minWidth: 0` removes that floor, and `flexBasis: 0` makes the left
 * target size from available space rather than from its text. `flexShrink` on
 * the inner <Text> never had any effect: nested <Text> runs are not layout
 * nodes at all, and the outer <Text> shrinks on its parent's main axis, which
 * is vertical.
 */
function AttributionRow({
  attribution,
  stacked,
}: {
  attribution: SoundAttribution;
  stacked: boolean;
}) {
  const { sourceName, sourceUrl, author, license, licenseUrl } = attribution;
  return (
    <View style={stacked ? styles.attributionRowStacked : styles.attributionRow}>
      <Pressable
        onPress={() => open(sourceUrl)}
        accessibilityRole="link"
        accessibilityLabel={`${sourceName} by ${author}`}
        accessibilityHint="Opens the original recording"
        style={stacked ? styles.attributionTargetStacked : styles.attributionTarget}
      >
        <Text style={styles.attributionText}>
          <Text style={styles.link}>{sourceName}</Text>
          <Text style={styles.dim}> by </Text>
          <Text style={styles.link}>{author}</Text>
        </Text>
      </Pressable>
      <Pressable
        onPress={() => open(licenseUrl)}
        accessibilityRole="link"
        accessibilityLabel={`${license} licence`}
        style={stacked ? styles.licenseTargetStacked : styles.licenseTarget}
        hitSlop={SPACE_XS}
      >
        <Text style={styles.link}>{license}</Text>
      </Pressable>
    </View>
  );
}

export default function CreditsModal({ visible, onClose }: Props) {
  const reducedMotion = useReducedMotion();
  // Subscribed once for the whole sheet rather than once per attribution row.
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale >= STACK_FONT_SCALE;

  return (
    <Modal
      visible={visible}
      // RN's Modal does not consult the system Reduce Motion setting.
      animationType={reducedMotion ? 'fade' : 'slide'}
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/*
          Tap-outside-to-dismiss, as a SIBLING of the sheet rather than its
          ancestor.

          It used to wrap the sheet, and `Pressable` passes
          `accessible={accessible !== false}` — so with no `accessible` prop it
          WAS an accessibility element. On iOS an accessible ancestor swallows
          its whole subtree, so every heading, all ~60 attribution and licence
          links and the Close button collapsed into one "Close credits" button:
          under VoiceOver the legally load-bearing sheet did not exist. The
          inner `accessible={false}` could not undo that — an element cannot
          opt its ancestor out.

          Two things keep it fixed: the dismiss target is no longer an ancestor
          of anything, and it is explicitly `accessible={false}` /
          `importantForAccessibility="no"` so it is not a stray focus stop.
          Taps inside the sheet cannot reach it either — the responder chain
          bubbles through ancestors only, and a sibling is not one, so the
          sheet needs no swallow-the-tap Pressable of its own.
        */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessible={false}
          importantForAccessibility="no"
        />
        {/*
          Plain View. `accessibilityViewIsModal` maps to the native modal flag
          and does not make the view an accessibility element, so nothing
          between the Modal host and the content below is one.
        */}
        <View style={styles.sheet} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title} accessibilityRole="header">
              Sound credits
            </Text>
            <Text style={styles.intro}>
              These sounds come from the open-source Noice sound library. Some
              are Creative Commons recordings shared by their original authors
              and edited into seamless loops by the Noice project; others are
              Noice&apos;s own recordings, licensed under GPL-3.0. Jewel Rain is
              free software licensed under GPL-3.0, and its source code is
              public.
            </Text>
            {/*
              Every URL in this sheet is a real link. The intro used to print
              `trynoice.com` and `github.com/covagashi/RainingJewels` as inert
              text two lines above a visually identical live link, so the only
              way to tell a working link from a dead one was to tap it.
            */}
            <View style={styles.links}>
              <Link text="trynoice.com" url={NOICE_SITE_URL} />
              <Link text="github.com/trynoice" url={NOICE_REPO_URL} />
              <Link text="github.com/covagashi/RainingJewels" url={SOURCE_URL} />
              <Link text="GPL-3.0 licence" url={GPL_3_URL} />
            </View>

            {ALL_SOUNDS.map((sound) => {
              const Icon = getSoundIcon(sound.id);
              return (
                <View key={sound.id} style={styles.soundBlock}>
                  <View style={styles.soundNameRow}>
                    <Icon
                      size={ICON_SM}
                      color={TEXT_SECONDARY}
                      strokeWidth={ICON_STROKE}
                    />
                    <Text style={styles.soundName} accessibilityRole="header">
                      {sound.name}
                    </Text>
                  </View>
                  {sound.attributions.map((a, i) => (
                    <AttributionRow key={i} attribution={a} stacked={stacked} />
                  ))}
                </View>
              );
            })}

            <Text style={styles.contact}>Questions about the app?</Text>
            <Link
              text="hello@covaga.xyz"
              url="mailto:hello@covaga.xyz?subject=Raining%20Jewels%20-%20FAQ"
            />
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
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: SCRIM,
  },
  sheet: {
    maxHeight: '80%',
    backgroundColor: BG_SHEET,
    borderTopLeftRadius: RADIUS_SHEET,
    borderTopRightRadius: RADIUS_SHEET,
  },
  content: {
    padding: SPACE_MD,
  },
  title: {
    color: TEXT_PRIMARY,
    fontSize: FONT_HEADLINE,
    fontFamily: FONT_DISPLAY_SEMIBOLD,
    marginBottom: SPACE_XS,
  },
  intro: {
    color: TEXT_SECONDARY,
    fontSize: FONT_LABEL,
    lineHeight: FONT_LABEL * LEADING_BODY,
    marginBottom: SPACE_XXS,
  },
  links: {
    // Wrapped row, not a stack. Four 48pt targets stacked vertically spent
    // ~350px and read as four unrelated paragraphs; flowing them lets short
    // links share a line while every target keeps its full hit area.
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    // Adjacent 48pt targets must not touch.
    gap: TOUCH_GAP,
    marginTop: SPACE_XS,
  },
  soundBlock: {
    marginTop: SPACE_MD,
  },
  soundNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_XS,
  },
  soundName: {
    color: TEXT_PRIMARY,
    fontSize: FONT_TITLE,
    fontFamily: FONT_DISPLAY_MEDIUM,
    // Same min-content floor as the attribution rows: without this the heading
    // beside its icon refuses to wrap once the system text size grows.
    flexShrink: 1,
    minWidth: 0,
  },

  /* Attribution rows.
     Two geometries, chosen by system text scale. No `numberOfLines` anywhere:
     the sheet is legally load-bearing and nothing in it may be truncated.

     `marginTop: TOUCH_GAP` is not decoration. Seashore alone stacks four
     attributions, i.e. eight 48pt targets; without it they sat flush at 0pt
     separation, which is how a licence link gets tapped instead of a source. */

  attributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACE_SM,
    marginTop: TOUCH_GAP,
    gap: TOUCH_GAP,
  },
  attributionRowStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginLeft: SPACE_SM,
    marginTop: TOUCH_GAP,
    gap: TOUCH_GAP,
  },
  attributionTarget: {
    flexGrow: 1,
    flexShrink: 1,
    // Size from the space left over, not from the text.
    flexBasis: 0,
    // Removes the automatic min-content floor that kept the row wider than the
    // sheet and pushed the licence off-screen. This is the actual fix.
    minWidth: 0,
    minHeight: TOUCH_MIN,
    justifyContent: 'center',
  },
  attributionTargetStacked: {
    alignSelf: 'stretch',
    minWidth: 0,
    minHeight: TOUCH_MIN,
    justifyContent: 'center',
  },
  licenseTarget: {
    // Never give up width: the licence must stay readable whatever the
    // filename length.
    flexGrow: 0,
    flexShrink: 0,
    // "GPL-3.0" measures ~30pt; with hitSlop that is ~46pt, under the floor.
    // The target has to clear 48 in BOTH axes on its own.
    minWidth: TOUCH_MIN,
    minHeight: TOUCH_MIN,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  licenseTargetStacked: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: TOUCH_MIN,
    minHeight: TOUCH_MIN,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  attributionText: {
    fontSize: FONT_LABEL,
  },
  standaloneLink: {
    // Not full-bleed: a link target should end where the link does, or the
    // empty half of the row becomes a mis-tap.
    alignSelf: 'flex-start',
    minWidth: TOUCH_MIN,
    minHeight: TOUCH_MIN,
    justifyContent: 'center',
  },
  dim: {
    color: TEXT_SECONDARY,
  },
  link: {
    color: ACCENT,
    textDecorationLine: 'underline',
    fontSize: FONT_LABEL,
  },
  contact: {
    color: TEXT_SECONDARY,
    fontSize: FONT_CAPTION,
    marginTop: SPACE_LG,
  },
  closeButton: {
    minHeight: TOUCH_MIN,
    padding: SPACE_MD,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER,
  },
  closeText: {
    color: TEXT_PRIMARY,
    fontSize: FONT_BODY,
  },
});

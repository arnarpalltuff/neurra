import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInRight, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii, accentGlow } from '../../constants/design';
import { pickChallenge, type Challenge } from '../../constants/challenges';
import { AREA_ACCENT, AREA_LABELS } from '../../constants/gameConfigs';
import { useProgressStore } from '../../stores/progressStore';
import { tapMedium, selection } from '../../utils/haptics';
import PressableScale from '../ui/PressableScale';

interface RealLifeSlotCardProps {
  index: number;
  onAccept?: (challenge: Challenge) => void;
}

/**
 * Real-life cognitive challenge rendered as a bonus slot inside the daily
 * challenge list. Rotates daily (stable seed). Compact vs the old standalone
 * home card; slots next to game challenges without competing for attention.
 */
export default React.memo(function RealLifeSlotCard({
  index,
  onAccept,
}: RealLifeSlotCardProps) {
  const totalSessions = useProgressStore(s => s.totalSessions);
  const [dismissed, setDismissed] = useState(false);

  const challenge = useMemo<Challenge>(() => {
    const daySeed = Math.floor(Date.now() / 86400000);
    return pickChallenge(totalSessions + daySeed);
  }, [totalSessions]);

  if (dismissed) return null;

  const accent = AREA_ACCENT[challenge.type];
  const areaLabel = AREA_LABELS[challenge.type];
  const difficultyLabel =
    challenge.difficulty === 1 ? 'Easy'
      : challenge.difficulty === 2 ? 'Medium'
      : 'Hard';

  const handleAccept = () => {
    tapMedium();
    onAccept?.(challenge);
  };

  const handleSkip = () => {
    selection();
    setDismissed(true);
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400).springify().damping(16)}
      exiting={FadeOut.duration(220)}
      style={[styles.card, accentGlow(accent, 14, 0.18), { borderColor: `${accent}33` }]}
    >
      <LinearGradient
        colors={['rgba(19,24,41,0.95)', 'rgba(12,15,26,0.98)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.accentBar} />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.icon}>{challenge.icon}</Text>
          <Text style={[styles.eyebrow, { color: accent }]}>REAL LIFE · {areaLabel.toUpperCase()}</Text>
        </View>

        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={styles.framing} numberOfLines={2}>{challenge.realWorldFraming}</Text>

        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: accent }]}>{difficultyLabel}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.meta}>~{challenge.estimatedTime}s</Text>
        </View>

        <View style={styles.btnRow}>
          <PressableScale
            style={[styles.acceptBtn, { backgroundColor: `${accent}22`, borderColor: `${accent}66` }]}
            onPress={handleAccept}
          >
            <Text style={[styles.acceptText, { color: accent }]}>Accept</Text>
          </PressableScale>
          <Pressable onPress={handleSkip} hitSlop={8}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: 'rgba(19,24,41,0.9)',
  },
  accentBar: {
    width: 3,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: space.md,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    marginBottom: 2,
  },
  icon: {
    fontSize: 16,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: C.t1,
    letterSpacing: -0.2,
  },
  framing: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t2,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  meta: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: C.t3,
    letterSpacing: 0.2,
  },
  metaDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: C.t4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
    marginTop: space.sm,
  },
  acceptBtn: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  skipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: C.t3,
  },
});

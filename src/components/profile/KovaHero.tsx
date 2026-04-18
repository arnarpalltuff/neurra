import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii, accentGlow } from '../../constants/design';
import Kova from '../kova/Kova';
import { useUserStore } from '../../stores/userStore';
import { useProgressStore } from '../../stores/progressStore';
import { useKovaStore, stageConfigFor } from '../../stores/kovaStore';
import { STORE_EMOTION_TO_VISUAL, clampStage } from '../../utils/kovaMapping';
import { useProStore } from '../../stores/proStore';
import { useEnergyStore, maxHeartsFor } from '../../stores/energyStore';
import { getXPProgress } from '../ui/XPProgressBar';
import {
  AREA_LABELS,
  AREA_ACCENT,
  type BrainArea,
} from '../../constants/gameConfigs';

const BRAIN_TYPE_LABEL: Record<BrainArea, string> = {
  memory: 'Memory Master',
  focus: 'Laser Focus',
  speed: 'Quick Thinker',
  flexibility: 'Adaptive Mind',
  creativity: 'Creative Soul',
};

function dominantArea(scores: Record<BrainArea, number>): BrainArea | null {
  const entries = Object.entries(scores) as Array<[BrainArea, number]>;
  const nonZero = entries.filter(([, v]) => v > 0);
  if (nonZero.length === 0) return null;
  return nonZero.reduce((a, b) => (a[1] >= b[1] ? a : b))[0];
}

function speechLine(streak: number, topArea: BrainArea | null, name: string): string {
  if (streak >= 7) return `${streak} days strong. Keep it up!`;
  if (streak >= 3) return `${streak}-day streak — nice rhythm.`;
  if (topArea) return `Your ${AREA_LABELS[topArea].toLowerCase()} is shining today.`;
  if (name) return `Ready when you are, ${name}.`;
  return 'Ready for a fresh session?';
}

export default React.memo(function KovaHero() {
  const name = useUserStore(s => s.name);
  const improvementGoals = useUserStore(s => s.improvementGoals);

  const xp = useProgressStore(s => s.xp);
  const level = useProgressStore(s => s.level);
  const streak = useProgressStore(s => s.streak);
  const coins = useProgressStore(s => s.coins);
  const brainScores = useProgressStore(s => s.brainScores);

  const currentStage = useKovaStore(s => s.currentStage);
  const currentEmotion = useKovaStore(s => s.currentEmotion);

  const isPro = useProStore(s => s.isPro);
  const hearts = useEnergyStore(s => s.hearts);

  const stageName = stageConfigFor(currentStage).name;

  const topArea = useMemo(() => dominantArea(brainScores), [brainScores]);
  const brainType = topArea ? BRAIN_TYPE_LABEL[topArea] : 'Brain Explorer';
  const accent = topArea ? AREA_ACCENT[topArea] : C.green;

  const dialogue = useMemo(
    () => speechLine(streak, topArea, name),
    [streak, topArea, name],
  );

  const { xpIntoLevel, xpNeeded } = getXPProgress(xp, level);
  const pct = Math.min(100, Math.max(0, (xpIntoLevel / Math.max(xpNeeded, 1)) * 100));

  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withDelay(
      300,
      withTiming(pct, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
  }, [pct, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value}%` }));

  const maxHearts = maxHeartsFor(isPro);

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(450).springify().damping(16)}
      style={styles.wrap}
    >
      <View style={[styles.card, accentGlow(accent, 18, 0.22)]}>
        <View style={styles.kovaRow}>
          <Kova
            stage={clampStage(currentStage)}
            emotion={STORE_EMOTION_TO_VISUAL[currentEmotion] ?? 'idle'}
            size={130}
            showSpeechBubble={false}
          />

          <View style={styles.bubbleWrap} pointerEvents="none">
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>{dialogue}</Text>
            </View>
            <View style={styles.bubblePointer} />
          </View>
        </View>

        <View style={styles.stageRow}>
          <Text style={[styles.stageLabel, { color: accent }]}>
            STAGE {currentStage} · {stageName.toUpperCase()}
          </Text>
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name || 'Trainer'}
          </Text>
          {isPro && (
            <View style={[styles.proPill, { backgroundColor: `${C.amber}22`, borderColor: `${C.amber}66` }]}>
              <Ionicons name="sparkles" size={10} color={C.amber} />
              <Text style={[styles.proPillText, { color: C.amber }]}>PRO</Text>
            </View>
          )}
        </View>

        <Text style={[styles.brainType, { color: accent }]}>{brainType}</Text>

        {improvementGoals.length > 0 && (
          <View style={styles.goalsRow}>
            <Text style={styles.goalsLabel}>Focusing on</Text>
            {improvementGoals.map(g => (
              <View
                key={g}
                style={[styles.goalPill, { borderColor: `${AREA_ACCENT[g]}55`, backgroundColor: `${AREA_ACCENT[g]}14` }]}
              >
                <Text style={[styles.goalPillText, { color: AREA_ACCENT[g] }]}>
                  {AREA_LABELS[g]}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.xpBlock}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLevel}>Level {level}</Text>
            <Text style={styles.xpValues}>
              {xpIntoLevel} / {xpNeeded} XP
            </Text>
          </View>
          <View style={styles.xpTrack}>
            <Animated.View
              style={[styles.xpFill, { backgroundColor: accent }, fillStyle]}
            />
          </View>
        </View>

        <View style={styles.currencyRow}>
          <View style={styles.currency}>
            <MaterialCommunityIcons name="circle-multiple" size={16} color={C.amber} />
            <Text style={styles.currencyValue}>{coins}</Text>
            <Text style={styles.currencyLabel}>coins</Text>
          </View>
          <View style={styles.currencyDivider} />
          <View style={styles.currency}>
            <Ionicons name="heart" size={14} color={C.coral} />
            <Text style={styles.currencyValue}>
              {hearts}
              <Text style={styles.currencyMax}>/{maxHearts}</Text>
            </Text>
            <Text style={styles.currencyLabel}>hearts</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.lg,
    marginTop: space.md,
  },
  card: {
    borderRadius: radii.lg,
    backgroundColor: 'rgba(19,24,41,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: space.lg,
    alignItems: 'center',
  },
  kovaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  bubbleWrap: {
    position: 'absolute',
    top: 8,
    right: -4,
    maxWidth: 170,
    alignItems: 'flex-start',
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: space.sm + 2,
    paddingVertical: 8,
    borderRadius: 14,
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontFamily: fonts.kova,
    fontSize: 16,
    color: C.t1,
    lineHeight: 20,
  },
  bubblePointer: {
    position: 'absolute',
    left: -6,
    bottom: 8,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderRightWidth: 7,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'rgba(255,255,255,0.08)',
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.sm,
  },
  stageLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.t4,
  },
  cosmeticLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: C.t3,
    textTransform: 'uppercase',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: 4,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: C.t1,
    letterSpacing: -0.5,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  proPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  brainType: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  goalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: space.sm,
  },
  goalsLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.t4,
    letterSpacing: 0.3,
  },
  goalPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  goalPillText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  xpBlock: {
    width: '100%',
    marginTop: space.md,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  xpLevel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: C.t1,
    letterSpacing: 0.2,
  },
  xpValues: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.t3,
  },
  xpTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    marginTop: space.md,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    width: '100%',
  },
  currency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  currencyValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: C.t1,
  },
  currencyMax: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t4,
  },
  currencyLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.t3,
    marginLeft: 2,
  },
  currencyDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});

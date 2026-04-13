import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { gameConfigs } from '../../constants/gameConfigs';
import { DailyChallenge, DIFFICULTY_ICONS } from '../../stores/dailyChallengeStore';
import PressableScale from '../ui/PressableScale';

interface DailyChallengeCardProps {
  challenge: DailyChallenge;
  index: number;
  isBonus?: boolean;
  onPlay: (challengeId: string) => void;
}

const DIFFICULTY_COLORS = {
  easy: C.green,
  medium: C.amber,
  hard: C.coral,
};

export default React.memo(function DailyChallengeCard({
  challenge, index, isBonus = false, onPlay,
}: DailyChallengeCardProps) {
  const config = gameConfigs[challenge.gameType];
  const diffColor = DIFFICULTY_COLORS[challenge.difficulty];
  const isCompleted = challenge.status === 'completed';
  const isExpired = challenge.status === 'expired';
  const isAvailable = challenge.status === 'available';

  return (
    <Animated.View entering={FadeInRight.delay(index * 100).duration(400).springify().damping(16)}>
      <PressableScale
        style={[
          styles.card,
          isBonus && styles.cardBonus,
          isCompleted && styles.cardCompleted,
          isExpired && styles.cardExpired,
        ]}
        disabled={!isAvailable}
        onPress={() => onPlay(challenge.id)}
      >
        <LinearGradient
          colors={['rgba(19,24,41,0.95)', 'rgba(12,15,26,0.98)']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Bonus badge */}
        {isBonus && (
          <View style={styles.bonusBadge}>
            <Text style={styles.bonusBadgeText}>BONUS</Text>
          </View>
        )}

        {/* Icon */}
        <View style={[styles.iconWrap, { shadowColor: diffColor }]}>
          <View style={[styles.iconBg, { backgroundColor: `${config?.color ?? C.blue}22` }]}>
            <Text style={styles.icon}>{config?.icon ?? '🧠'}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[
            styles.name,
            isExpired && styles.nameExpired,
          ]}>
            {config?.name ?? 'Challenge'}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.diffPill, { backgroundColor: `${diffColor}18`, borderColor: `${diffColor}40` }]}>
              <Text style={[styles.diffText, { color: diffColor }]}>
                {DIFFICULTY_ICONS[challenge.difficulty]} {challenge.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Right side — XP + action */}
        <View style={styles.right}>
          {isAvailable && (
            <>
              <Text style={[styles.xpText, { color: diffColor }]}>+{challenge.xpReward} XP</Text>
              <View style={[styles.playBtn, { backgroundColor: `${diffColor}20`, borderColor: `${diffColor}50` }]}>
                <Text style={[styles.playBtnText, { color: diffColor }]}>▶</Text>
              </View>
            </>
          )}
          {isCompleted && (
            <>
              <Text style={styles.doneText}>✓ Done</Text>
              {challenge.score != null && (
                <Text style={styles.scoreText}>{challenge.score}</Text>
              )}
            </>
          )}
          {isExpired && (
            <Text style={styles.expiredText}>Expired</Text>
          )}
        </View>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  cardBonus: {
    borderColor: 'rgba(240,181,66,0.3)',
    shadowColor: '#F0B542',
    shadowOpacity: 0.15,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  cardExpired: {
    opacity: 0.3,
  },
  bonusBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    backgroundColor: 'rgba(240,181,66,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.5)',
  },
  bonusBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    color: C.amber,
    letterSpacing: 1,
  },
  iconWrap: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  icon: { fontSize: 26 },
  info: { flex: 1, gap: 6 },
  name: {
    fontFamily: fonts.headingMed,
    fontSize: 16,
    color: C.t1,
  },
  nameExpired: {
    textDecorationLine: 'line-through',
    color: C.t3,
  },
  metaRow: { flexDirection: 'row', gap: 6 },
  diffPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  diffText: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  xpText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  playBtnText: {
    fontSize: 14,
    marginLeft: 2,
  },
  doneText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: C.green,
  },
  scoreText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.t3,
  },
  expiredText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: C.coral,
  },
});

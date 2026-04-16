import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { navigate } from '../../utils/navigate';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { accentGlow } from '../../constants/design';
import { useEnergyStore, MAX_QUICK_HITS_PER_DAY } from '../../stores/energyStore';
import { todayStr } from '../../utils/timeUtils';
import { tapLight } from '../../utils/haptics';
import { playTap } from '../../utils/sound';
import { useStaggeredEntrance } from './homeStagger';

interface HomeQuickHitProps {
  index: number;
}

export default React.memo(function HomeQuickHit({ index }: HomeQuickHitProps) {
  const style = useStaggeredEntrance(index);
  const qhLeft = useEnergyStore((s) =>
    s.quickHitsDate === todayStr()
      ? Math.max(0, MAX_QUICK_HITS_PER_DAY - s.quickHitsUsed)
      : MAX_QUICK_HITS_PER_DAY,
  );

  const handleStart = useCallback(() => {
    if (qhLeft <= 0) return;
    tapLight();
    playTap();
    navigate('/quick-hit');
  }, [qhLeft]);

  const disabled = qhLeft <= 0;

  return (
    <Animated.View style={[styles.wrap, style]}>
      <Pressable
        onPress={handleStart}
        disabled={disabled}
        style={[styles.card, !disabled && accentGlow(C.amber, 12, 0.18), disabled && styles.cardDisabled]}
      >
        <Text style={styles.bolt}>⚡</Text>
        <View style={styles.body}>
          <Text style={styles.title}>Quick Hit · 30 seconds</Text>
          <Text style={styles.sub}>
            {qhLeft > 0
              ? `${qhLeft} Quick Hit${qhLeft === 1 ? '' : 's'} left today · bonus XP, no streak cost`
              : 'No Quick Hits left. Resets at midnight.'}
          </Text>
        </View>
        {qhLeft > 0 && <Text style={styles.arrow}>›</Text>}
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    marginTop: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    borderColor: `${C.amber}2A`,
  },
  cardDisabled: {
    opacity: 0.45,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  bolt: {
    fontSize: 24,
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: C.t1,
    letterSpacing: 0.1,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t3,
    marginTop: 2,
  },
  arrow: {
    fontFamily: fonts.body,
    fontSize: 22,
    color: C.amber,
  },
});

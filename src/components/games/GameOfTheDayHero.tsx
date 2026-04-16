import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { gameConfigs, AREA_ACCENT, AREA_LABELS, type GameId } from '../../constants/gameConfigs';
import PressableScale from '../ui/PressableScale';
import { tapLight } from '../../utils/haptics';
import { iconForGame } from './icons';
import { useStaggeredEntrance } from '../../hooks/useStaggeredEntrance';

interface GameOfTheDayHeroProps {
  index: number;
  gameId: GameId;
  onPress: () => void;
}

const BreathingHalo = React.memo(function BreathingHalo({ color }: { color: string }) {
  const glow = useSharedValue(0.35);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(glow);
  }, [glow]);
  const style = useAnimatedStyle(() => ({ shadowOpacity: glow.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.iconHalo, { shadowColor: color, backgroundColor: `${color}18` }, style]}
    />
  );
});

export default React.memo(function GameOfTheDayHero({
  index,
  gameId,
  onPress,
}: GameOfTheDayHeroProps) {
  const entranceStyle = useStaggeredEntrance(index);
  const game = gameConfigs[gameId];
  const accent = AREA_ACCENT[game.brainArea];
  const Icon = iconForGame(gameId);

  return (
    <Animated.View style={entranceStyle}>
      <PressableScale
        onPress={() => { tapLight(); onPress(); }}
        style={[styles.card, { shadowColor: accent, borderColor: `${accent}33` }]}
      >
        <LinearGradient
          colors={['rgba(19,24,41,0.92)', `${accent}14`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
        />
        <LinearGradient
          colors={[`${accent}18`, 'transparent']}
          style={styles.topGlow}
        />

        <View style={styles.eyebrowRow}>
          <View style={[styles.badge, { backgroundColor: `${C.amber}18`, borderColor: `${C.amber}44` }]}>
            <Text style={styles.badgeText}>GAME OF THE DAY</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.infoCol}>
            <Text style={[styles.area, { color: accent }]}>{AREA_LABELS[game.brainArea]}</Text>
            <Text style={styles.name}>{game.name}</Text>
            <Text style={styles.desc} numberOfLines={2}>{game.description}</Text>
            <View style={[styles.ctaPill, { backgroundColor: `${accent}28`, borderColor: `${accent}55` }]}>
              <Text style={[styles.ctaText, { color: accent }]}>Play Now →</Text>
            </View>
          </View>

          <View style={styles.iconWrap}>
            <BreathingHalo color={accent} />
            <View style={[styles.iconBg, { backgroundColor: `${accent}18`, borderColor: `${accent}33` }]}>
              <Icon size={80} color={accent} opacity={0.8} />
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    gap: 12,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  eyebrowRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: C.amber,
    letterSpacing: 1.4,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  area: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: C.t1,
    letterSpacing: -0.4,
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: C.t3,
    lineHeight: 18,
    marginBottom: 4,
  },
  ctaPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  iconHalo: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    elevation: 10,
  },
  iconBg: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

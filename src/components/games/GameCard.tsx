import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import {
  gameConfigs,
  AREA_ACCENT,
  AREA_LABELS,
  type GameId,
} from '../../constants/gameConfigs';
import { useProgressStore } from '../../stores/progressStore';
import PressableScale from '../ui/PressableScale';
import { tapLight } from '../../utils/haptics';
import { iconForGame } from './icons';

interface GameCardProps {
  gameId: GameId;
  locked?: boolean;
  onPress: () => void;
  variant?: 'grid' | 'featured';
}

export default React.memo(function GameCard({
  gameId,
  locked = false,
  onPress,
  variant = 'grid',
}: GameCardProps) {
  const game = gameConfigs[gameId];
  const accent = AREA_ACCENT[game.brainArea];
  const gameLevels = useProgressStore(s => s.gameLevels);
  const personalBests = useProgressStore(s => s.personalBests);
  const level = gameLevels[gameId] ?? 1;
  const best = personalBests[gameId] ?? 0;

  const Icon = iconForGame(gameId);

  const handlePress = () => {
    if (locked) return;
    tapLight();
    onPress();
  };

  return (
    <PressableScale
      disabled={locked}
      onPress={handlePress}
      style={[
        styles.card,
        {
          shadowColor: accent,
          shadowOpacity: locked ? 0.08 : 0.18,
          shadowRadius: locked ? 10 : 14,
          borderColor: `${accent}${locked ? '15' : '33'}`,
        },
        locked && styles.locked,
        variant === 'featured' && styles.featured,
      ]}
    >
      {/* Accent-tinted gradient background */}
      <LinearGradient
        colors={['rgba(19,24,41,0.95)', `${accent}${locked ? '06' : '0C'}`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
      />

      {/* Accent left edge line */}
      <View style={[styles.accentEdge, { backgroundColor: accent, opacity: locked ? 0.3 : 0.7 }]} />

      {/* Brain area eyebrow */}
      <Text style={[styles.eyebrow, { color: accent }]}>
        {AREA_LABELS[game.brainArea]}
      </Text>

      {/* SVG icon */}
      <View style={[styles.iconWrap, { shadowColor: accent }]}>
        <View style={[styles.iconBg, { backgroundColor: `${accent}15`, borderColor: `${accent}30` }]}>
          <Icon size={48} color={accent} opacity={locked ? 0.3 : 0.7} />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.name} numberOfLines={1}>{game.name}</Text>

      {/* Hook line */}
      <Text style={styles.desc} numberOfLines={1}>{game.description}</Text>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: `${accent}18` }]} />

      {/* Bottom row — stats or lock */}
      {locked ? (
        <View style={styles.lockRow}>
          <Ionicons name="lock-closed" size={12} color={C.t4} />
          <Text style={styles.lockText}>Coming soon</Text>
        </View>
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.dots}>
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = i < Math.min(Math.ceil(level / 2), 5);
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    filled && {
                      backgroundColor: accent,
                      shadowColor: accent,
                      shadowOpacity: 0.8,
                      shadowRadius: 3,
                      shadowOffset: { width: 0, height: 0 },
                    },
                  ]}
                />
              );
            })}
          </View>
          {best > 0 && (
            <Text style={[styles.stat, { color: accent }]}>
              Best: {best > 1000 ? `${(best / 1000).toFixed(1)}k` : best}
            </Text>
          )}
        </View>
      )}
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 6,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  locked: {
    opacity: 0.55,
  },
  featured: {
    minHeight: 200,
  },
  accentEdge: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 3,
    borderRadius: 1.5,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  iconWrap: {
    alignSelf: 'center',
    marginVertical: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: C.t1,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: C.t3,
    textAlign: 'center',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  stat: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: C.t3,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  lockText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: C.t4,
    letterSpacing: 0.3,
  },
});

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '../../src/constants/colors';
import Kova from '../../src/components/kova/Kova';
import { useProgressStore } from '../../src/stores/progressStore';
import { stageFromXP, stageNames } from '../../src/components/kova/KovaStates';

export default function GroveScreen() {
  const { xp, brainScores } = useProgressStore();
  const stage = stageFromXP(xp);

  const zones = [
    { label: 'Memory Tree', area: 'memory', icon: '🌳', score: brainScores.memory },
    { label: 'Focus Crystal', area: 'focus', icon: '💎', score: brainScores.focus },
    { label: 'Speed Stream', area: 'speed', icon: '💧', score: brainScores.speed },
    { label: 'Flexibility Vine', area: 'flexibility', icon: '🌿', score: brainScores.flexibility },
    { label: 'Creativity Grove', area: 'creativity', icon: '🍄', score: brainScores.creativity },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View entering={FadeIn} style={styles.container}>
        <Text style={styles.title}>Kova's Grove</Text>
        <Text style={styles.subtitle}>Train more to grow your grove.</Text>

        {/* Kova in grove */}
        <View style={styles.kovaArea}>
          <Kova stage={stage} emotion="zen" size={130} />
          <Text style={styles.stageName}>Kova — {stageNames[stage]} Stage</Text>
        </View>

        {/* Growth zones */}
        <View style={styles.zones}>
          {zones.map((zone) => (
            <View key={zone.area} style={styles.zoneCard}>
              <Text style={styles.zoneIcon}>{zone.icon}</Text>
              <View style={styles.zoneInfo}>
                <Text style={styles.zoneName}>{zone.label}</Text>
                <View style={styles.zoneBar}>
                  <View style={[styles.zoneFill, { width: `${Math.min(100, zone.score)}%` }]} />
                </View>
              </View>
              <Text style={styles.zoneScore}>{Math.round(zone.score)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.comingSoon}>
          Full grove customization coming soon — themes, decorations, visitors, and more.
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  container: { flex: 1, padding: 20, gap: 16 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.textTertiary, fontSize: 14 },
  kovaArea: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  stageName: { color: colors.growth, fontSize: 14, fontWeight: '700' },
  zones: { gap: 10 },
  zoneCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  zoneIcon: { fontSize: 24 },
  zoneInfo: { flex: 1, gap: 6 },
  zoneName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  zoneBar: {
    width: '100%',
    height: 5,
    backgroundColor: colors.bgTertiary,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  zoneFill: { height: '100%', backgroundColor: colors.growth, borderRadius: 2.5 },
  zoneScore: { color: colors.textTertiary, fontSize: 14, fontWeight: '700', minWidth: 28, textAlign: 'right' },
  comingSoon: {
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

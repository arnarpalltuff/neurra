import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { C } from '../../src/constants/colors';
import FloatingParticles from '../../src/components/ui/FloatingParticles';
import PaywallFull from '../../src/components/paywall/PaywallFull';
import ErrorBoundary from '../../src/components/ui/ErrorBoundary';
import KovaHero from '../../src/components/profile/KovaHero';
import BrainFingerprint from '../../src/components/profile/BrainFingerprint';
import AchievementShowcase from '../../src/components/profile/AchievementShowcase';
import JourneyStats from '../../src/components/profile/JourneyStats';
import MoodSnapshot from '../../src/components/profile/MoodSnapshot';
import GrovePreview from '../../src/components/profile/GrovePreview';
import WeeklyReportSummary from '../../src/components/profile/WeeklyReportSummary';
import ProCTA from '../../src/components/profile/ProCTA';
import SettingsSection from '../../src/components/profile/SettingsSection';

export default function ProfileScreen() {
  const [showPaywall, setShowPaywall] = useState(false);
  const openPaywall = useCallback(() => setShowPaywall(true), []);
  const closePaywall = useCallback(() => setShowPaywall(false), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <FloatingParticles count={14} />
      </View>

      <ErrorBoundary>
        <Animated.ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <KovaHero />
          <BrainFingerprint />
          <AchievementShowcase />
          <JourneyStats />
          <MoodSnapshot />
          <GrovePreview />
          <WeeklyReportSummary />
          <ProCTA onOpenPaywall={openPaywall} />
          <SettingsSection onOpenPaywall={openPaywall} />
        </Animated.ScrollView>
      </ErrorBoundary>

      <PaywallFull visible={showPaywall} onClose={closePaywall} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg1,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 120,
  },
});

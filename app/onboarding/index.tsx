import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeOut } from 'react-native-reanimated';
import { colors } from '../../src/constants/colors';
import Awakening from '../../src/screens/onboarding/Awakening';
import Intro from '../../src/screens/onboarding/Intro';
import VibeCheck from '../../src/screens/onboarding/VibeCheck';
import BrainProfile from '../../src/screens/onboarding/BrainProfile';
import NameInput from '../../src/screens/onboarding/NameInput';
import NotificationSetup from '../../src/screens/onboarding/NotificationSetup';
import { useUserStore } from '../../src/stores/userStore';
import { useProgressStore } from '../../src/stores/progressStore';

type OnboardingStep = 'awakening' | 'intro' | 'vibecheck' | 'profile' | 'name' | 'notifications';

export default function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>('awakening');
  const [vibeScores, setVibeScores] = useState({ memory: 50, focus: 50, creativity: 50 });
  const setName = useUserStore(s => s.setName);
  const setOnboardingComplete = useUserStore(s => s.setOnboardingComplete);
  const setNotificationsEnabled = useUserStore(s => s.setNotificationsEnabled);
  const updateBrainScores = useProgressStore(s => s.updateBrainScores);

  const handleVibeComplete = (scores: { memory: number; focus: number; creativity: number }) => {
    setVibeScores(scores);
    updateBrainScores('memory', scores.memory);
    updateBrainScores('focus', scores.focus);
    updateBrainScores('creativity', scores.creativity);
    setStep('profile');
  };

  const handleNameSubmit = (name: string) => {
    setName(name);
    setStep('notifications');
  };

  const handleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    setOnboardingComplete();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {step === 'awakening' && <Awakening onNext={() => setStep('intro')} />}
      {step === 'intro' && <Intro onNext={() => setStep('vibecheck')} />}
      {step === 'vibecheck' && <VibeCheck onComplete={handleVibeComplete} />}
      {step === 'profile' && <BrainProfile scores={vibeScores} onNext={() => setStep('name')} />}
      {step === 'name' && <NameInput onNext={handleNameSubmit} />}
      {step === 'notifications' && (
        <NotificationSetup
          onEnable={() => handleNotifications(true)}
          onSkip={() => handleNotifications(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
});

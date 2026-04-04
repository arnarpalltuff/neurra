import React, { useState, useMemo } from 'react';
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
import AgeGroupPicker from '../../src/screens/onboarding/AgeGroupPicker';
import OnboardingProgress from '../../src/components/ui/OnboardingProgress';
import { useUserStore } from '../../src/stores/userStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { AgeGroup } from '../../src/stores/userStore';

type OnboardingStep = 'awakening' | 'intro' | 'vibecheck' | 'profile' | 'age' | 'name' | 'notifications';

const STEP_ORDER: OnboardingStep[] = ['awakening', 'intro', 'vibecheck', 'profile', 'age', 'name', 'notifications'];
const STEP_LABELS: Record<OnboardingStep, string> = {
  awakening: '',
  intro: 'Meet Kova',
  vibecheck: 'Quick Assessment',
  profile: 'Your Brain Profile',
  age: 'Age Group',
  name: 'Your Name',
  notifications: 'Stay on Track',
};

export default function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>('awakening');
  const [vibeScores, setVibeScores] = useState({ memory: 50, focus: 50, creativity: 50 });
  const setName = useUserStore(s => s.setName);
  const setAgeGroup = useUserStore(s => s.setAgeGroup);
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

  const handleAgeGroup = (ag: AgeGroup) => {
    setAgeGroup(ag);
    setStep('name');
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

  const stepIndex = STEP_ORDER.indexOf(step);
  const showProgress = step !== 'awakening';

  return (
    <View style={styles.container}>
      {showProgress && (
        <View style={styles.progressArea}>
          <OnboardingProgress
            currentStep={stepIndex}
            totalSteps={STEP_ORDER.length}
            stepLabel={STEP_LABELS[step]}
          />
        </View>
      )}
      {step === 'awakening' && <Awakening onNext={() => setStep('intro')} />}
      {step === 'intro' && <Intro onNext={() => setStep('vibecheck')} />}
      {step === 'vibecheck' && <VibeCheck onComplete={handleVibeComplete} />}
      {step === 'profile' && <BrainProfile scores={vibeScores} onNext={() => setStep('age')} />}
      {step === 'age' && <AgeGroupPicker onSelect={handleAgeGroup} onSkip={() => setStep('name')} />}
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
  progressArea: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

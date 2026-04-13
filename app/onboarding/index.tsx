import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { C } from '../../src/constants/colors';
import Awakening from '../../src/screens/onboarding/Awakening';
import Intro from '../../src/screens/onboarding/Intro';
import MiniPulse from '../../src/screens/onboarding/MiniPulse';
import WarmResult from '../../src/screens/onboarding/WarmResult';
import NameInput from '../../src/screens/onboarding/NameInput';
import NotificationAsk from '../../src/screens/onboarding/NotificationAsk';
import OnboardingProgress from '../../src/components/ui/OnboardingProgress';
import { useUserStore } from '../../src/stores/userStore';

type OnboardingStep = 'awakening' | 'intro' | 'pulse' | 'result' | 'name' | 'notify';

const STEP_ORDER: OnboardingStep[] = ['awakening', 'intro', 'pulse', 'result', 'name', 'notify'];
const STEP_LABELS: Record<OnboardingStep, string> = {
  awakening: '',
  intro: 'Meet Kova',
  pulse: 'Try It',
  result: 'Nice!',
  name: 'Your Name',
  notify: 'Reminders',
};

export default function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>('awakening');
  const [pulseAccuracy, setPulseAccuracy] = useState(0);
  const setName = useUserStore(s => s.setName);
  const setOnboardingComplete = useUserStore(s => s.setOnboardingComplete);

  const handlePulseComplete = (accuracy: number) => {
    setPulseAccuracy(accuracy);
    setStep('result');
  };

  const handleNameSubmit = (name: string) => {
    setName(name);
    setStep('notify');
  };

  const handleNotifyDone = () => {
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
      {step === 'intro' && <Intro onNext={() => setStep('pulse')} />}
      {step === 'pulse' && <MiniPulse onComplete={handlePulseComplete} />}
      {step === 'result' && <WarmResult accuracy={pulseAccuracy} onNext={() => setStep('name')} />}
      {step === 'name' && <NameInput onNext={handleNameSubmit} />}
      {step === 'notify' && <NotificationAsk onDone={handleNotifyDone} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg1,
  },
  progressArea: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

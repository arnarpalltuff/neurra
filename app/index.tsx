import { Redirect } from 'expo-router';
import { useUserStore } from '../src/stores/userStore';

export default function Index() {
  const onboardingComplete = useUserStore(s => s.onboardingComplete);
  return <Redirect href={onboardingComplete ? '/(tabs)' : '/onboarding'} />;
}

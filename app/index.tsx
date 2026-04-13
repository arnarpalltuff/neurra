import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useUserStore } from '../src/stores/userStore';
import { C } from '../src/constants/colors';

export default function Index() {
  const [hydrated, setHydrated] = useState(false);
  const onboardingComplete = useUserStore(s => s.onboardingComplete);

  useEffect(() => {
    // Wait for Zustand persist to hydrate from AsyncStorage
    const unsub = useUserStore.persist.onFinishHydration(() => setHydrated(true));
    // If already hydrated (sync storage or second render)
    if (useUserStore.persist.hasHydrated()) setHydrated(true);
    return () => unsub();
  }, []);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={C.green} size="large" />
      </View>
    );
  }

  return <Redirect href={onboardingComplete ? '/(tabs)' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: C.bg1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { configureReanimatedLogger } from 'react-native-reanimated';

// Strict mode off: the Expo Go-bundled Reanimated emits false-positive
// "Writing to value during component render" warnings that don't correspond
// to real render-phase writes (verified via classification sweep + runtime
// diagnosis — see commit d3cd701). Strict off silences the noise without
// losing actionable signal.
configureReanimatedLogger({ strict: false });

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import {
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import {
  Caveat_400Regular,
  Caveat_700Bold,
} from '@expo-google-fonts/caveat';
import * as SplashScreen from 'expo-splash-screen';
import ErrorBoundary from '../src/components/ui/ErrorBoundary';
import NoiseOverlay from '../src/components/ui/NoiseOverlay';
import BrainSnapshotOverlay from '../src/components/ui/BrainSnapshotOverlay';
import { preloadAllSounds } from '../src/utils/sound';
import { useKovaStore } from '../src/stores/kovaStore';
import { useDailyChallengeStore } from '../src/stores/dailyChallengeStore';
import { C } from '../src/constants/colors';
import { initializePurchases, addCustomerInfoListener } from '../src/utils/purchaseSdk';
import { useProStore } from '../src/stores/proStore';
import { useWeeklyReportStore } from '../src/stores/weeklyReportStore';
import { usePersonalityStore } from '../src/stores/personalityStore';
import { useGameUnlockStore } from '../src/stores/gameUnlockStore';
import { useWeeklyChallengeStore } from '../src/stores/weeklyChallengeStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Caveat_400Regular,
    Caveat_700Bold,
  });

  useEffect(() => {
    // One-shot cleanup of removed persist keys. Safe to remove after a few
    // releases — the removeItem call is a no-op if the key is already gone.
    AsyncStorage.removeItem('neurra-cosmetics').catch(() => {});

    preloadAllSounds();
    initializePurchases();
    useWeeklyReportStore.getState().generateIfNeeded();
    // Recompute Kova's personality from training pattern (only runs if 7+
    // days since last recalc; cheap when cached).
    usePersonalityStore.getState().recalcIfNeeded();
    // Refresh the progressive unlock state from joinDate every cold start.
    useGameUnlockStore.getState().refresh();
    // Roll the weekly challenge over if a new week began since last open.
    useWeeklyChallengeStore.getState().refreshWeek();
    // Evaluate Kova streak state on cold start.
    useKovaStore.getState().evaluateOnOpen();
    // Refresh daily challenges if new day.
    useDailyChallengeStore.getState().refreshIfNeeded(useKovaStore.getState().currentStage);

    const unsubscribe = addCustomerInfoListener((info) => {
      useProStore.getState().syncFromRevenueCat(info);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={styles.splash} />;
  }

  return (
    <ErrorBoundary>
    <SafeAreaProvider>
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/index" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="session"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="shop"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="science"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="focus-practice"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="focus-timer"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="stats"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="weekly-report"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="privacy"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="terms"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="quick-hit"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <NoiseOverlay />
      </View>
      {/* Daily Brain Snapshot — gates itself to once per day, only renders
          after at least one session has been completed. */}
      <BrainSnapshotOverlay />
    </GestureHandlerRootView>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, backgroundColor: C.bg1 },
});

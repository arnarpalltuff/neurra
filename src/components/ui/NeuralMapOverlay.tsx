import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { BrainArea } from '../../constants/gameConfigs';
import { useSettingsStore } from '../../stores/settingsStore';
import NeuralMap from './NeuralMap';

interface NeuralMapOverlayProps {
  activeAreas: BrainArea[];
  pulseArea: BrainArea | null;
  intensity: number;
  size?: number;
}

/**
 * Floating NeuralMap overlay for in-game use.
 * Positions in top-left, never blocks touches, respects the settings toggle.
 */
export default function NeuralMapOverlay({
  activeAreas, pulseArea, intensity, size = 72,
}: NeuralMapOverlayProps) {
  const enabled = useSettingsStore(s => s.neuralMapEnabled);
  if (!enabled) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <NeuralMap
        activeAreas={activeAreas}
        pulseArea={pulseArea}
        intensity={intensity}
        size={size}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 100,
  },
});

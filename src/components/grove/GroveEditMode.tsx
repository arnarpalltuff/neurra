import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions, Alert,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/colors';
import {
  useGroveStore,
  DECORATION_DEFS,
  PlacedDecoration,
} from '../../stores/groveStore';
import { useProgressStore } from '../../stores/progressStore';

const { width: W } = Dimensions.get('window');
const ISLAND_W = W * 2.2;
const ISLAND_H = Dimensions.get('window').height * 1.4;

interface GroveEditModeProps {
  visible: boolean;
  onDone: () => void;
  onOpenShop: () => void;
  /** defId to place from inventory (set by shop) */
  pendingPlacement: string | null;
  onPlacementComplete: () => void;
}

export default function GroveEditMode({
  visible,
  onDone,
  onOpenShop,
  pendingPlacement,
  onPlacementComplete,
}: GroveEditModeProps) {
  const {
    placedDecorations,
    ownedDecorations,
    placeDecoration,
    moveDecoration,
    storeDecoration,
    sellDecoration,
  } = useGroveStore();
  const { addCoins } = useProgressStore();

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleTapIsland = useCallback(
    (x: number, y: number) => {
      // If we have a pending placement from inventory, place it here
      if (pendingPlacement) {
        placeDecoration(pendingPlacement, x, y);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onPlacementComplete();
        return;
      }

      // Check if tapped near an existing decoration
      const hitIdx = placedDecorations.findIndex(
        (d) => Math.abs(d.x - x) < 30 && Math.abs(d.y - y) < 30,
      );

      if (hitIdx >= 0) {
        setSelectedIdx(hitIdx);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (selectedIdx !== null) {
        // Move selected decoration to new position
        moveDecoration(selectedIdx, x, y);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedIdx(null);
      }
    },
    [pendingPlacement, placedDecorations, selectedIdx, placeDecoration, moveDecoration, onPlacementComplete],
  );

  const handleStore = useCallback(() => {
    if (selectedIdx === null) return;
    storeDecoration(selectedIdx);
    setSelectedIdx(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [selectedIdx, storeDecoration]);

  const handleSell = useCallback(() => {
    if (selectedIdx === null) return;
    const item = placedDecorations[selectedIdx];
    if (!item) return;
    const def = DECORATION_DEFS.find((d) => d.id === item.defId);
    const refund = def ? Math.floor(def.cost * 0.5) : 0;

    Alert.alert(
      'Sell decoration?',
      `Return ${def?.name || 'item'} for ${refund} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Sell (+${refund})`,
          style: 'destructive',
          onPress: () => {
            sellDecoration(selectedIdx);
            if (refund > 0) addCoins(refund);
            setSelectedIdx(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  }, [selectedIdx, placedDecorations, sellDecoration, addCoins]);

  if (!visible) return null;

  const selected = selectedIdx !== null ? placedDecorations[selectedIdx] : null;
  const selectedDef = selected
    ? DECORATION_DEFS.find((d) => d.id === selected.defId)
    : null;

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.overlay}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.shopBtn} onPress={onOpenShop}>
          <Text style={styles.shopBtnText}>🏪 Shop</Text>
        </Pressable>
        <Text style={styles.editTitle}>
          {pendingPlacement ? 'Tap to place' : 'Edit Mode'}
        </Text>
        <Pressable style={styles.doneBtn} onPress={onDone}>
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </View>

      {/* Placement hint */}
      {pendingPlacement && (
        <View style={styles.placementHint}>
          <Text style={styles.hintText}>
            Tap anywhere on the island to place your decoration
          </Text>
          <Pressable onPress={onPlacementComplete}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* Selected decoration actions */}
      {selected && selectedDef && !pendingPlacement && (
        <View style={styles.actionBar}>
          <Text style={styles.actionName}>{selectedDef.emoji} {selectedDef.name}</Text>
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionBtn} onPress={() => setSelectedIdx(null)}>
              <Text style={styles.actionBtnText}>Move</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={handleStore}>
              <Text style={styles.actionBtnText}>Store</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.sellBtn]} onPress={handleSell}>
              <Text style={styles.sellBtnText}>Sell</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {placedDecorations.length}/20 placed · {ownedDecorations.length} in inventory
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
    backgroundColor: colors.bgPrimary + 'DD',
  },
  shopBtn: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  shopBtnText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  editTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  doneBtn: {
    backgroundColor: colors.growth,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
  },
  doneBtnText: { color: colors.bgPrimary, fontSize: 14, fontWeight: '700' },

  placementHint: {
    alignSelf: 'center',
    backgroundColor: colors.bgSecondary + 'EE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  hintText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', flex: 1 },
  cancelText: { color: colors.warm, fontSize: 13, fontWeight: '700' },

  actionBar: {
    alignSelf: 'center',
    backgroundColor: colors.bgSecondary + 'EE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  actionName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  sellBtn: { backgroundColor: '#FF4444' + '33' },
  sellBtnText: { color: '#FF4444', fontSize: 13, fontWeight: '700' },

  infoBar: {
    alignSelf: 'center',
    backgroundColor: colors.bgPrimary + 'CC',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 40,
  },
  infoText: { color: colors.textTertiary, fontSize: 12, fontWeight: '600' },
});

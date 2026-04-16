import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions, Alert,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { tapLight, tapMedium, warning as hapticWarning, success as hapticSuccess } from '../../utils/haptics';
import { C } from '../../constants/colors';
import {
  useGroveStore,
  decorationById,
  PlacedDecoration,
} from '../../stores/groveStore';
import { useCoinStore } from '../../stores/coinStore';

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
  const placedDecorations = useGroveStore(s => s.placedDecorations);
  const ownedDecorations = useGroveStore(s => s.ownedDecorations);
  const placeDecoration = useGroveStore(s => s.placeDecoration);
  const moveDecoration = useGroveStore(s => s.moveDecoration);
  const storeDecoration = useGroveStore(s => s.storeDecoration);
  const sellDecoration = useGroveStore(s => s.sellDecoration);
  const earnCoins = useCoinStore(s => s.earnCoins);

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleTapIsland = useCallback(
    (x: number, y: number) => {
      // If we have a pending placement from inventory, place it here
      if (pendingPlacement) {
        placeDecoration(pendingPlacement, x, y);
        hapticSuccess();
        onPlacementComplete();
        return;
      }

      // Check if tapped near an existing decoration
      const hitIdx = placedDecorations.findIndex(
        (d) => Math.abs(d.x - x) < 30 && Math.abs(d.y - y) < 30,
      );

      if (hitIdx >= 0) {
        setSelectedIdx(hitIdx);
        tapLight();
      } else if (selectedIdx !== null) {
        // Move selected decoration to new position
        moveDecoration(selectedIdx, x, y);
        tapMedium();
        setSelectedIdx(null);
      }
    },
    [pendingPlacement, placedDecorations, selectedIdx, placeDecoration, moveDecoration, onPlacementComplete],
  );

  const handleStore = useCallback(() => {
    if (selectedIdx === null) return;
    tapMedium();
    storeDecoration(selectedIdx);
    setSelectedIdx(null);
  }, [selectedIdx, storeDecoration]);

  const handleSell = useCallback(() => {
    if (selectedIdx === null) return;
    const item = placedDecorations[selectedIdx];
    if (!item) return;
    const def = decorationById(item.defId);
    const refund = def ? Math.floor(def.cost * 0.5) : 0;
    hapticWarning();

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
            if (refund > 0) earnCoins(refund, 'Sold decoration');
            setSelectedIdx(null);
            hapticSuccess();
          },
        },
      ],
    );
  }, [selectedIdx, placedDecorations, sellDecoration, earnCoins]);

  if (!visible) return null;

  const selected = selectedIdx !== null ? placedDecorations[selectedIdx] : null;
  const selectedDef = selected ? decorationById(selected.defId) ?? null : null;

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.overlay}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.shopBtn}
          onPress={() => { tapLight(); onOpenShop(); }}
        >
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
    backgroundColor: C.bg1 + 'DD',
  },
  shopBtn: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  shopBtnText: { color: C.t1, fontSize: 14, fontWeight: '700' },
  editTitle: { color: C.t1, fontSize: 16, fontWeight: '800' },
  doneBtn: {
    backgroundColor: C.green,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
  },
  doneBtnText: { color: C.bg2, fontSize: 14, fontWeight: '700' },

  placementHint: {
    alignSelf: 'center',
    backgroundColor: 'rgba(19,24,41,0.93)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  hintText: { color: C.t2, fontSize: 13, fontWeight: '600', flex: 1 },
  cancelText: { color: C.peach, fontSize: 13, fontWeight: '700' },

  actionBar: {
    alignSelf: 'center',
    backgroundColor: 'rgba(19,24,41,0.93)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  actionName: { color: C.t1, fontSize: 14, fontWeight: '700' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    backgroundColor: C.bg4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: { color: C.t2, fontSize: 13, fontWeight: '600' },
  sellBtn: { backgroundColor: '#FF4444' + '33' },
  sellBtnText: { color: '#FF4444', fontSize: 13, fontWeight: '700' },

  infoBar: {
    alignSelf: 'center',
    backgroundColor: C.bg1 + 'CC',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 40,
  },
  infoText: { color: C.t3, fontSize: 12, fontWeight: '600' },
});

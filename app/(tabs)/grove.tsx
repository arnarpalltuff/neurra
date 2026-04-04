import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Modal, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { colors } from '../../src/constants/colors';
import { gameConfigs, BrainArea } from '../../src/constants/gameConfigs';
import { useProgressStore } from '../../src/stores/progressStore';
import { useGroveStore, ZoneConfig, ZONE_CONFIGS } from '../../src/stores/groveStore';
import GroveIsland from '../../src/components/grove/GroveIsland';
import GroveShop from '../../src/components/grove/GroveShop';
import GroveEditMode from '../../src/components/grove/GroveEditMode';
import FloatingParticles from '../../src/components/ui/FloatingParticles';
import { startGroveAmbient, stopAmbient } from '../../src/utils/sound';

function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString();
}

function growthLabel(growth: number): string {
  if (growth < 1) return 'Barren';
  if (growth < 3) return 'Seedling';
  if (growth < 5) return 'Sprouting';
  if (growth < 7) return 'Growing';
  if (growth < 9) return 'Thriving';
  if (growth < 11) return 'Flourishing';
  return 'Legendary';
}

function gamesForArea(area: BrainArea): { name: string; icon: string }[] {
  return Object.values(gameConfigs)
    .filter((g) => g.brainArea === area && g.available)
    .map((g) => ({ name: g.name, icon: g.icon }));
}

interface ZoneSheetProps {
  zone: ZoneConfig | null;
  visible: boolean;
  onClose: () => void;
}

function ZoneInfoSheet({ zone, visible, onClose }: ZoneSheetProps) {
  const zoneGrowths = useGroveStore(s => s.zoneGrowths);
  const brainScores = useProgressStore(s => s.brainScores);

  if (!zone) return null;

  const zg = zoneGrowths[zone.area];
  const score = Math.round(brainScores[zone.area] ?? 0);
  const games = gamesForArea(zone.area);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheetContent} onPress={() => {}}>
          <Animated.View entering={FadeInDown.duration(200)}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetIcon}>{zone.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>{zone.name}</Text>
                <Text style={styles.sheetSubtitle}>{zone.area} zone</Text>
              </View>
              {zg.isWilting && (
                <View style={styles.wiltTag}>
                  <Text style={styles.wiltTagText}>Wilting</Text>
                </View>
              )}
            </View>

            {/* Growth bar */}
            <View style={styles.growthSection}>
              <View style={styles.growthBarRow}>
                <Text style={styles.growthLabel}>{growthLabel(zg.currentGrowth)}</Text>
                <Text style={styles.growthValue}>{zg.currentGrowth.toFixed(1)} / 12</Text>
              </View>
              <View style={styles.growthBar}>
                <View style={[styles.growthFill, { width: `${(zg.currentGrowth / 12) * 100}%` }]} />
                {zg.peakGrowth > zg.currentGrowth && (
                  <View style={[styles.peakMark, { left: `${(zg.peakGrowth / 12) * 100}%` }]} />
                )}
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Brain Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{zg.peakGrowth.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Peak Growth</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatDate(zg.lastTrainedDate)}</Text>
                <Text style={styles.statLabel}>Last Trained</Text>
              </View>
            </View>

            {/* Games */}
            <Text style={styles.gamesTitle}>Games that grow this zone</Text>
            <View style={styles.gamesList}>
              {games.map((g) => (
                <View key={g.name} style={styles.gameChip}>
                  <Text style={styles.gameChipIcon}>{g.icon}</Text>
                  <Text style={styles.gameChipName}>{g.name}</Text>
                </View>
              ))}
            </View>

            {zg.isWilting && (
              <Text style={styles.wiltHint}>
                This zone hasn't been trained recently. Play a {zone.area} game to restore it!
              </Text>
            )}

            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function GroveScreen() {
  const brainScores = useProgressStore(s => s.brainScores);
  const streak = useProgressStore(s => s.streak);
  const level = useProgressStore(s => s.level);
  const recalcAllZones = useGroveStore(s => s.recalcAllZones);
  const updateVisitors = useGroveStore(s => s.updateVisitors);

  const [selectedZone, setSelectedZone] = useState<ZoneConfig | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [shopVisible, setShopVisible] = useState(false);
  const [pendingPlacement, setPendingPlacement] = useState<string | null>(null);

  useEffect(() => {
    startGroveAmbient();
    return () => stopAmbient();
  }, []);

  useEffect(() => {
    recalcAllZones(brainScores);
    const speedGrowth = useGroveStore.getState().zoneGrowths.speed.currentGrowth;
    updateVisitors(streak, level, brainScores.focus, speedGrowth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brainScores, streak, level]);

  const handleZoneTap = useCallback((zone: ZoneConfig) => {
    if (editMode) return;
    setSelectedZone(zone);
    setSheetVisible(true);
  }, [editMode]);

  const handleKovaTap = useCallback(() => {}, []);

  const handleCloseSheet = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const handlePlaceDecoration = useCallback((defId: string) => {
    setPendingPlacement(defId);
    setEditMode(true);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <FloatingParticles count={8} color={colors.growthDim} />
      <GroveIsland onZoneTap={handleZoneTap} onKovaTap={handleKovaTap} />

      {!editMode && (
        <Pressable style={styles.editBtn} onPress={() => setEditMode(true)}>
          <Text style={styles.editBtnText}>✏️</Text>
        </Pressable>
      )}

      <GroveEditMode
        visible={editMode}
        onDone={() => { setEditMode(false); setPendingPlacement(null); }}
        onOpenShop={() => setShopVisible(true)}
        pendingPlacement={pendingPlacement}
        onPlacementComplete={() => setPendingPlacement(null)}
      />

      <GroveShop
        visible={shopVisible}
        onClose={() => setShopVisible(false)}
        onPlaceDecoration={handlePlaceDecoration}
      />

      <ZoneInfoSheet
        zone={selectedZone}
        visible={sheetVisible}
        onClose={handleCloseSheet}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgDeep },

  editBtn: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(11,14,23,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  editBtnText: { fontSize: 18 },

  // Bottom sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '70%',
    borderTopWidth: 0.5,
    borderColor: colors.borderLight,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  sheetIcon: { fontSize: 36 },
  sheetTitle: {
    fontFamily: 'Quicksand_700Bold',
    color: colors.textPrimary,
    fontSize: 20,
  },
  sheetSubtitle: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textTertiary,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  wiltTag: {
    backgroundColor: colors.streakTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  wiltTagText: {
    fontFamily: 'Nunito_700Bold',
    color: colors.streak,
    fontSize: 11,
    letterSpacing: 0.3,
  },

  // Growth
  growthSection: { marginBottom: 24 },
  growthBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  growthLabel: {
    fontFamily: 'Nunito_700Bold',
    color: colors.growth,
    fontSize: 14,
  },
  growthValue: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 13,
  },
  growthBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surfaceDim,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  growthFill: {
    height: '100%',
    backgroundColor: colors.growth,
    borderRadius: 4,
  },
  peakMark: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: colors.textTertiary,
    opacity: 0.5,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 14,
    backgroundColor: colors.bgDeep,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textPrimary,
    fontSize: 16,
  },
  statLabel: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textTertiary,
    fontSize: 11,
  },

  // Games
  gamesTitle: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  gamesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  gameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgDeep,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
  },
  gameChipIcon: { fontSize: 14 },
  gameChipName: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textSecondary,
    fontSize: 12,
  },

  wiltHint: {
    fontFamily: 'Caveat_400Regular',
    color: colors.streak,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },

  closeBtn: {
    backgroundColor: colors.bgHover,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
  },
  closeBtnText: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textSecondary,
    fontSize: 15,
  },
});

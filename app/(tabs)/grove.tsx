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

// Games that train a given brain area
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
  const { zoneGrowths } = useGroveStore();
  const { brainScores } = useProgressStore();

  if (!zone) return null;

  const zg = zoneGrowths[zone.area];
  const score = Math.round(brainScores[zone.area]);
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
                  <Text style={styles.wiltTagText}>💧 Wilting</Text>
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
  const { brainScores, streak, level } = useProgressStore();
  const { recalcAllZones, updateVisitors, zoneGrowths } = useGroveStore();

  const [selectedZone, setSelectedZone] = useState<ZoneConfig | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [shopVisible, setShopVisible] = useState(false);
  const [pendingPlacement, setPendingPlacement] = useState<string | null>(null);

  // Recalc zone growths and visitors when entering the screen
  // Read zoneGrowths.speed.currentGrowth via ref to avoid circular dependency
  const speedGrowthRef = React.useRef(zoneGrowths.speed.currentGrowth);
  speedGrowthRef.current = zoneGrowths.speed.currentGrowth;

  useEffect(() => {
    recalcAllZones(brainScores);
    updateVisitors(streak, level, brainScores.focus, speedGrowthRef.current);
  }, [brainScores, streak, level, recalcAllZones, updateVisitors]);

  const handleZoneTap = useCallback((zone: ZoneConfig) => {
    if (editMode) return; // Ignore zone taps in edit mode
    setSelectedZone(zone);
    setSheetVisible(true);
  }, [editMode]);

  const handleKovaTap = useCallback(() => {
    // Kova interaction — will be expanded in later sections
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const handlePlaceDecoration = useCallback((defId: string) => {
    setPendingPlacement(defId);
    setEditMode(true);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <GroveIsland onZoneTap={handleZoneTap} onKovaTap={handleKovaTap} />

      {/* Edit mode toggle button */}
      {!editMode && (
        <Pressable
          style={styles.editBtn}
          onPress={() => setEditMode(true)}
        >
          <Text style={styles.editBtnText}>✏️</Text>
        </Pressable>
      )}

      {/* Edit mode overlay */}
      <GroveEditMode
        visible={editMode}
        onDone={() => { setEditMode(false); setPendingPlacement(null); }}
        onOpenShop={() => setShopVisible(true)}
        pendingPlacement={pendingPlacement}
        onPlacementComplete={() => setPendingPlacement(null)}
      />

      {/* Shop modal */}
      <GroveShop
        visible={shopVisible}
        onClose={() => setShopVisible(false)}
        onPlaceDecoration={handlePlaceDecoration}
      />

      {/* Zone info sheet */}
      <ZoneInfoSheet
        zone={selectedZone}
        visible={sheetVisible}
        onClose={handleCloseSheet}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },

  // Edit button
  editBtn: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgSecondary + 'DD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnText: { fontSize: 18 },

  // Bottom sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sheetIcon: { fontSize: 36 },
  sheetTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  sheetSubtitle: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  wiltTag: {
    backgroundColor: '#F59E0B22',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  wiltTagText: { color: '#F59E0B', fontSize: 12, fontWeight: '700' },

  // Growth
  growthSection: { marginBottom: 20 },
  growthBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  growthLabel: { color: colors.growth, fontSize: 14, fontWeight: '700' },
  growthValue: { color: colors.textTertiary, fontSize: 13, fontWeight: '600' },
  growthBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.bgTertiary,
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
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: colors.bgPrimary,
    borderRadius: 12,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  statLabel: { color: colors.textTertiary, fontSize: 11, fontWeight: '600' },

  // Games
  gamesTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  gamesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  gameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameChipIcon: { fontSize: 14 },
  gameChipName: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },

  // Wilt hint
  wiltHint: {
    color: '#F59E0B',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },

  // Close button
  closeBtn: {
    backgroundColor: colors.bgTertiary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: { color: colors.textSecondary, fontSize: 15, fontWeight: '700' },
});

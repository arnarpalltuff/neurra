import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import FloatingParticles from '../../src/components/ui/FloatingParticles';
import { router } from 'expo-router';
import { C } from '../../src/constants/colors';
import { fonts } from '../../src/constants/typography';
import { gameConfigs, BrainArea } from '../../src/constants/gameConfigs';
import { getTimeOfDaySky } from '../../src/constants/groveThemes';

const W = Dimensions.get('window').width;
import { useProgressStore } from '../../src/stores/progressStore';
import { useGroveStore, ZoneConfig, ZONE_CONFIGS } from '../../src/stores/groveStore';
import GroveIsland from '../../src/components/grove/GroveIsland';
import { KovaGroveDialogueModal, pickGroveLine } from '../../src/components/grove/GroveScene';
import GroveShop from '../../src/components/grove/GroveShop';
import GroveEditMode from '../../src/components/grove/GroveEditMode';
import { startGroveAmbient, stopAmbient } from '../../src/utils/sound';
import { captureAndShare } from '../../src/utils/shareCapture';
import ErrorBoundary from '../../src/components/ui/ErrorBoundary';

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

const AREA_DESCRIPTIONS: Record<BrainArea, string> = {
  memory: 'How well you hold and recall information. The same skill you use when remembering names, lists, and where you parked.',
  focus: 'How well you sustain attention and filter distractions. The skill behind deep work, reading, and staying present in conversations.',
  speed: 'How fast your brain processes information. This is reaction time, quick decisions, and thinking on your feet.',
  flexibility: 'How well you switch between tasks and adapt to new rules. This is the skill behind multitasking and creative problem-solving.',
  creativity: 'How well you form new connections and think laterally. This is the skill behind writing, brainstorming, and seeing patterns others miss.',
};

const AREA_TIPS: Record<BrainArea, string[]> = {
  memory: [
    'Try recalling your meals at the end of each day — free memory training.',
    'Look at a photo for 30 seconds, close it, then list everything you saw.',
    'Before checking your calendar, try to remember tomorrow\'s first meeting.',
  ],
  focus: [
    'Try one meal today with no screens. Notice the flavors.',
    'Pick a 10-minute task and put your phone in another room.',
    'In your next conversation, count how many times someone says "um".',
  ],
  speed: [
    'Try mental math instead of the calculator for your next 3 purchases.',
    'When you see a license plate, memorize the numbers before it drives away.',
    'Challenge yourself to type a reply 20% faster than usual, then proofread.',
  ],
  flexibility: [
    'Take a different route to work or school tomorrow.',
    'Brush your teeth with your non-dominant hand for a week.',
    'When someone gives you a bad idea, find three ways to make it work.',
  ],
  creativity: [
    'Pick two random objects and invent a product that combines them.',
    'Write 3 different endings to a movie you just watched.',
    'Describe your day to someone using only metaphors.',
  ],
};

import { AREA_LABELS, AREA_ACCENT } from '../../src/constants/gameConfigs';

function ZoneInfoSheet({ zone, visible, onClose }: ZoneSheetProps) {
  const zoneGrowths = useGroveStore(s => s.zoneGrowths);
  const brainScores = useProgressStore(s => s.brainScores);

  if (!zone) return null;

  const zg = zoneGrowths[zone.area];
  const score = Math.round(brainScores[zone.area] ?? 0);
  const games = gamesForArea(zone.area);
  const areaColor = AREA_ACCENT[zone.area] ?? C.green;
  const growthPct = Math.round((zg.currentGrowth / 12) * 100);
  const tip = AREA_TIPS[zone.area]?.[Math.floor(Date.now() / 86400000) % (AREA_TIPS[zone.area]?.length ?? 1)] ?? '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheetContent} onPress={() => {}}>
          <Animated.View entering={FadeInDown.duration(200)}>
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetIcon}>{zone.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>{zone.name}</Text>
                <Text style={[styles.sheetSubtitle, { color: areaColor }]}>
                  {AREA_LABELS[zone.area]} · {growthLabel(zg.currentGrowth)}
                </Text>
              </View>
              {zg.isWilting && (
                <View style={styles.wiltTag}>
                  <Text style={styles.wiltTagText}>Needs water</Text>
                </View>
              )}
            </View>

            {/* What this zone measures */}
            <Text style={styles.descText}>{AREA_DESCRIPTIONS[zone.area]}</Text>

            {/* Growth bar */}
            <View style={styles.growthSection}>
              <View style={styles.growthBarRow}>
                <Text style={[styles.growthLabel, { color: areaColor }]}>{growthPct}% grown</Text>
                <Text style={styles.growthValue}>
                  Stage {Math.min(12, Math.max(0, Math.round(zg.currentGrowth)))} of 12
                </Text>
              </View>
              <View style={styles.growthBar}>
                <View style={[styles.growthFill, { width: `${growthPct}%`, backgroundColor: areaColor }]} />
                {zg.peakGrowth > zg.currentGrowth && (
                  <View style={[styles.peakMark, { left: `${(zg.peakGrowth / 12) * 100}%` }]} />
                )}
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: areaColor }]}>{score}</Text>
                <Text style={styles.statLabel}>Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{zg.peakGrowth.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Peak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatDate(zg.lastTrainedDate)}</Text>
                <Text style={styles.statLabel}>Trained</Text>
              </View>
            </View>

            {/* Wilting hint */}
            {zg.isWilting && (
              <View style={styles.wiltHintBox}>
                <Text style={styles.wiltHintEmoji}>🌱</Text>
                <Text style={styles.wiltHint}>
                  This zone hasn't been trained recently. Play a {zone.area} game to restore it — it'll bounce back fast.
                </Text>
              </View>
            )}

            {/* Real-world tip */}
            {tip ? (
              <View style={styles.tipBox}>
                <Text style={styles.tipLabel}>TRAIN OUTSIDE THE APP</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ) : null}

            {/* Games that feed this zone */}
            <Text style={styles.gamesTitle}>Games that grow this zone</Text>
            <View style={styles.gamesList}>
              {games.map((g) => (
                <Pressable
                  key={g.name}
                  style={[styles.gameChip, { borderColor: `${areaColor}40` }]}
                  onPress={() => {
                    onClose();
                    router.push('/session');
                  }}
                >
                  <Text style={styles.gameChipIcon}>{g.icon}</Text>
                  <Text style={[styles.gameChipName, { color: areaColor }]}>{g.name}</Text>
                </Pressable>
              ))}
            </View>

            {/* CTA or close */}
            <Pressable
              style={[styles.closeBtn, { backgroundColor: `${areaColor}20`, borderColor: `${areaColor}40` }]}
              onPress={() => {
                onClose();
                router.push('/session');
              }}
            >
              <Text style={[styles.closeBtnText, { color: areaColor }]}>Train {AREA_LABELS[zone.area]}</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function GroveScreenInner() {
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
  const [kovaLine, setKovaLine] = useState('');
  const [kovaModal, setKovaModal] = useState(false);
  const groveRef = useRef<View>(null);

  useEffect(() => {
    startGroveAmbient();
    return () => stopAmbient();
  }, []);

  useEffect(() => {
    recalcAllZones(brainScores);
    const speedGrowth = useGroveStore.getState().zoneGrowths.speed.currentGrowth;
    updateVisitors(streak, level, brainScores.focus, speedGrowth);
  }, [brainScores, streak, level]);

  const handleZoneTap = useCallback((zone: ZoneConfig) => {
    if (editMode) return;
    setSelectedZone(zone);
    setSheetVisible(true);
  }, [editMode]);

  const handleKovaTap = useCallback(() => {
    setKovaLine(pickGroveLine());
    setKovaModal(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const handlePlaceDecoration = useCallback((defId: string) => {
    // Auto-place near the center of the island with slight randomness so
    // multiple decorations don't stack. The user can move them in edit mode.
    const centerX = W * 2.2 * 0.45 + (Math.random() - 0.5) * 80;
    const centerY = Dimensions.get('window').height * 1.4 * 0.42 + (Math.random() - 0.5) * 80;
    useGroveStore.getState().placeDecoration(defId, centerX, centerY);
    setEditMode(true);
  }, []);

  const skyBg = getTimeOfDaySky().bottom;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: skyBg }]}>
      <FloatingParticles count={5} color="rgba(110,207,154,0.12)" />
      <View ref={groveRef} style={styles.sceneWrapper} collapsable={false}>
        {/*
          Always render the polished GroveIsland (organic island, time-of-day sky,
          detailed SVG zones via GrowthZone, animal visitors). The legacy
          GroveScene with placeholder dot/circle shapes was previously used as
          the default view — that was a half-finished migration. Decoration
          placement is handled by the separate GroveEditMode overlay below
          regardless of which scene component is mounted.
        */}
        <GroveIsland onZoneTap={handleZoneTap} onKovaTap={handleKovaTap} />
      </View>

      <KovaGroveDialogueModal
        visible={kovaModal}
        line={kovaLine}
        onClose={() => setKovaModal(false)}
      />

      {!editMode && (
        <View style={styles.topButtons}>
          <Pressable style={styles.iconBtn} onPress={() => captureAndShare(groveRef)}>
            <Text style={styles.iconBtnText}>📷</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => setEditMode(true)}>
            <Text style={styles.iconBtnText}>✏️</Text>
          </Pressable>
        </View>
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
  safe: { flex: 1, backgroundColor: C.bg1 },
  sceneWrapper: { flex: 1 },

  topButtons: {
    position: 'absolute',
    top: 60,
    right: 16,
    gap: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(11,14,23,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  iconBtnText: { fontSize: 18 },

  // Bottom sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '70%',
    borderTopWidth: 0.5,
    borderColor: C.border,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
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
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 20,
  },
  sheetSubtitle: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  wiltTag: {
    backgroundColor: C.amberTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  wiltTagText: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
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
    fontFamily: fonts.bodyBold,
    color: C.green,
    fontSize: 14,
  },
  growthValue: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 13,
  },
  growthBar: {
    width: '100%',
    height: 8,
    backgroundColor: C.surface,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  growthFill: {
    height: '100%',
    backgroundColor: C.green,
    borderRadius: 4,
  },
  peakMark: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: C.t3,
    opacity: 0.5,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 14,
    backgroundColor: C.bg1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: {
    fontFamily: fonts.bodyBold,
    color: C.t1,
    fontSize: 16,
  },
  statLabel: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 11,
  },

  // Games
  gamesTitle: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
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
    backgroundColor: C.bg1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
  },
  gameChipIcon: { fontSize: 14 },
  gameChipName: {
    fontFamily: fonts.bodySemi,
    color: C.t2,
    fontSize: 12,
  },

  descText: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },

  wiltHintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: C.amberTint,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.3)',
  },
  wiltHintEmoji: { fontSize: 18, marginTop: 1 },
  wiltHint: {
    fontFamily: fonts.body,
    color: C.amber,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },

  tipBox: {
    backgroundColor: C.bg1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 6,
  },
  tipLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tipText: {
    fontFamily: fonts.kova,
    color: C.t1,
    fontSize: 15,
    lineHeight: 22,
  },

  closeBtn: {
    backgroundColor: C.bg4,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  closeBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.t2,
    fontSize: 15,
  },
});

export default function GroveScreen() {
  return (
    <ErrorBoundary scope="Grove tab">
      <GroveScreenInner />
    </ErrorBoundary>
  );
}

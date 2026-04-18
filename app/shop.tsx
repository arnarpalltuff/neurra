import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Alert,
} from 'react-native';
import PressableScale from '../src/components/ui/PressableScale';
import { LinearGradient } from 'expo-linear-gradient';
import { tapLight, success as hapticSuccess } from '../src/utils/haptics';
import { router } from 'expo-router';
import { C } from '../src/constants/colors';
import { fonts } from '../src/constants/typography';
import { useProgressStore } from '../src/stores/progressStore';
import { useCoinStore } from '../src/stores/coinStore';
import {
  useGroveStore,
  GROVE_THEMES,
  GroveThemeId,
} from '../src/stores/groveStore';
import { GROVE_PALETTES } from '../src/constants/groveThemes';
import {
  STREAK_FREEZE_COST,
  STREAK_REPAIR_COST,
} from '../src/utils/coinRewards';
import { useProStore } from '../src/stores/proStore';
import PaywallFull from '../src/components/paywall/PaywallFull';

type ShopTab = 'themes' | 'decorations' | 'utilities';

interface UtilityItem {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  description: string;
}

const UTILITY_ITEMS: UtilityItem[] = [
  { id: 'streak-freeze', name: 'Streak Freeze', emoji: '🧊', cost: STREAK_FREEZE_COST, description: 'Protects your streak for 1 missed day. Max 3 stored.' },
  { id: 'streak-repair', name: 'Streak Repair', emoji: '🔧', cost: STREAK_REPAIR_COST, description: 'Repair a broken streak within 24 hours.' },
  { id: 'gift-flower', name: 'Gift Flower', emoji: '🌸', cost: 50, description: "Plant a flower in a friend's grove." },
];

export default function ShopScreen() {
  const [tab, setTab] = useState<ShopTab>('themes');
  const [showPaywall, setShowPaywall] = useState(false);
  const isPro = useProStore(s => s.isPro || s.debugSimulatePro);
  const coins = useProgressStore(s => s.coins);
  const spendCoins = useCoinStore(s => s.spendCoins);
  const addStreakFreeze = useProgressStore(s => s.addStreakFreeze);
  const streakFreezes = useProgressStore(s => s.streakFreezes);
  const activeTheme = useGroveStore(s => s.activeTheme);
  const unlockedThemes = useGroveStore(s => s.unlockedThemes);
  const setTheme = useGroveStore(s => s.setTheme);
  const unlockTheme = useGroveStore(s => s.unlockTheme);

  const handleBuyTheme = useCallback((themeId: GroveThemeId, cost: number) => {
    if (cost === -1) {
      if (!isPro) setShowPaywall(true);
      return;
    }
    if (unlockedThemes.includes(themeId)) {
      setTheme(themeId);
      tapLight();
      return;
    }
    if (!spendCoins(cost, `Theme: ${themeId}`)) {
      Alert.alert('Not enough coins', `You need ${cost} coins for this theme.`);
      return;
    }
    unlockTheme(themeId);
    setTheme(themeId);
    hapticSuccess();
  }, [unlockedThemes, spendCoins, unlockTheme, setTheme]);

  const handleBuyUtility = useCallback((item: UtilityItem) => {
    if (item.id === 'streak-freeze') {
      if (streakFreezes >= 3) {
        Alert.alert('Maximum reached', 'You already have 3 streak freezes stored.');
        return;
      }
      if (!spendCoins(item.cost, 'Streak freeze')) {
        Alert.alert('Not enough coins', `You need ${item.cost} coins.`);
        return;
      }
      addStreakFreeze();
      hapticSuccess();
    } else if (item.id === 'streak-repair') {
      if (!spendCoins(item.cost, 'Streak repair')) {
        Alert.alert('Not enough coins', `You need ${item.cost} coins.`);
        return;
      }
      hapticSuccess();
    }
  }, [streakFreezes, spendCoins, addStreakFreeze]);

  const tabs: { key: ShopTab; label: string }[] = [
    { key: 'themes', label: 'Themes' },
    { key: 'decorations', label: 'Decor' },
    { key: 'utilities', label: 'Items' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Shop</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinCount}>{coins}</Text>
        </View>
      </View>

      {/* Tabs — pill chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Themes */}
      {tab === 'themes' && (
        <ScrollView contentContainerStyle={styles.themesGrid}>
          {GROVE_THEMES.map((theme) => {
            const palette = GROVE_PALETTES[theme.id];
            const isActive = activeTheme === theme.id;
            const isOwned = unlockedThemes.includes(theme.id);
            const isPro = theme.cost === -1;
            return (
              <PressableScale
                key={theme.id}
                style={[styles.themeCard, isActive && styles.themeCardActive]}
                onPress={() => handleBuyTheme(theme.id, theme.cost)}
              >
                <View style={[styles.themePreview, { backgroundColor: palette.skyBottom }]}>
                  <View style={[styles.themeGround, { backgroundColor: palette.groundBase }]} />
                  <View style={[styles.themeLeaf, { backgroundColor: palette.treeLeaf }]} />
                  <View style={[styles.themeCrystal, { backgroundColor: palette.crystalColor }]} />
                </View>
                <Text style={styles.themeName}>{theme.name}</Text>
                <Text style={styles.themeDesc} numberOfLines={2}>{theme.description}</Text>
                {isActive ? (
                  <View style={styles.equippedBadge}><Text style={styles.equippedBadgeText}>Active</Text></View>
                ) : isOwned ? (
                  <Text style={styles.ownedTag}>Tap to apply</Text>
                ) : isPro ? (
                  <View style={styles.proBadge}><Text style={styles.proText}>PRO</Text></View>
                ) : (
                  <Text style={styles.costText}>{theme.cost} 🪙</Text>
                )}
              </PressableScale>
            );
          })}
        </ScrollView>
      )}

      {/* Decorations */}
      {tab === 'decorations' && (
        <View style={styles.centered}>
          <Text style={styles.centeredEmoji}>🌿</Text>
          <Text style={styles.centeredText}>Decorations are available in the Grove</Text>
          <Pressable style={styles.gotoBtn} onPress={() => { router.back(); router.push('/(tabs)/grove'); }}>
            <Text style={styles.gotoBtnText}>Go to Grove</Text>
          </Pressable>
        </View>
      )}

      {/* Utilities */}
      {tab === 'utilities' && (
        <ScrollView contentContainerStyle={styles.utilList}>
          {UTILITY_ITEMS.map((item) => (
            <PressableScale key={item.id} style={styles.utilCard} onPress={() => handleBuyUtility(item)}>
              <LinearGradient colors={[C.bg4, C.bg3]} style={StyleSheet.absoluteFill} />
              <Text style={styles.utilEmoji}>{item.emoji}</Text>
              <View style={styles.utilInfo}>
                <Text style={styles.utilName}>{item.name}</Text>
                <Text style={styles.utilDesc}>{item.description}</Text>
                {item.id === 'streak-freeze' && (
                  <Text style={styles.utilExtra}>{streakFreezes}/3 stored</Text>
                )}
              </View>
              <Text style={styles.utilCost}>{item.cost} 🪙</Text>
            </PressableScale>
          ))}
        </ScrollView>
      )}

      <PaywallFull visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  backText: {
    fontFamily: fonts.bodySemi,
    color: C.blue,
    fontSize: 15,
  },
  title: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 20,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.peachTint,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(232,168,124,0.2)',
  },
  coinIcon: { fontSize: 13 },
  coinCount: {
    fontFamily: fonts.bodyBold,
    color: C.peach,
    fontSize: 15,
  },

  // Tabs
  tabScroll: { maxHeight: 48 },
  tabRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tabActive: {
    backgroundColor: 'rgba(110,207,154,0.18)',
    borderColor: 'rgba(110,207,154,0.5)',
    shadowColor: '#6ECF9A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 13,
  },
  tabTextActive: { color: C.green },

  equippedBadge: {
    backgroundColor: C.greenTint,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
  },
  equippedBadgeText: {
    fontFamily: fonts.bodyBold,
    color: C.green,
    fontSize: 11,
  },
  ownedTag: {
    fontFamily: fonts.bodySemi,
    color: C.blue,
    fontSize: 11,
    marginTop: 4,
  },
  costText: {
    fontFamily: fonts.bodyBold,
    color: C.peach,
    fontSize: 13,
    marginTop: 4,
  },
  proBadge: {
    backgroundColor: C.purple,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
  },
  proText: {
    fontFamily: fonts.bodyBold,
    color: C.t1,
    fontSize: 10,
    letterSpacing: 0.5,
  },

  // Themes grid
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
    paddingTop: 10,
    paddingBottom: 40,
  },
  themeCard: {
    width: '47%',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: 'rgba(19,24,41,0.85)',
    overflow: 'hidden',
  },
  themeCardActive: { borderColor: C.green, borderWidth: 1.5 },
  themePreview: {
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
  },
  themeGround: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '40%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  themeLeaf: {
    position: 'absolute',
    bottom: '30%',
    left: '20%',
    width: 14,
    height: 14,
    borderRadius: 7,
    opacity: 0.8,
  },
  themeCrystal: {
    position: 'absolute',
    bottom: '35%',
    right: '25%',
    width: 10,
    height: 18,
    borderRadius: 3,
    opacity: 0.7,
  },
  themeName: {
    fontFamily: fonts.headingMed,
    color: C.t1,
    fontSize: 13,
  },
  themeDesc: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
  },

  // Centered placeholder
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  centeredEmoji: { fontSize: 48 },
  centeredText: {
    fontFamily: fonts.bodySemi,
    color: C.t2,
    fontSize: 15,
  },
  gotoBtn: {
    backgroundColor: C.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  gotoBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.bg2,
    fontSize: 14,
  },

  // Utilities
  utilList: { padding: 20, gap: 12, paddingBottom: 40 },
  utilCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  utilEmoji: { fontSize: 28 },
  utilInfo: { flex: 1, gap: 3 },
  utilName: {
    fontFamily: fonts.headingMed,
    color: C.t1,
    fontSize: 14,
  },
  utilDesc: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
    lineHeight: 17,
  },
  utilExtra: {
    fontFamily: fonts.bodySemi,
    color: C.blue,
    fontSize: 11,
    marginTop: 2,
  },
  utilCost: {
    fontFamily: fonts.bodyBold,
    color: C.peach,
    fontSize: 15,
  },
});

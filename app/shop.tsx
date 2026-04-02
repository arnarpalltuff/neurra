import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Pressable, FlatList, ScrollView, Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { colors } from '../src/constants/colors';
import { useProgressStore } from '../src/stores/progressStore';
import {
  useCosmeticsStore,
  OUTFIT_DEFS, OutfitDef,
  ACCESSORY_DEFS, AccessoryDef,
} from '../src/stores/cosmeticsStore';
import {
  useGroveStore,
  GROVE_THEMES, DECORATION_DEFS,
  GroveThemeId,
} from '../src/stores/groveStore';
import { GROVE_PALETTES } from '../src/constants/groveThemes';
import {
  STREAK_FREEZE_COST,
  STREAK_REPAIR_COST,
} from '../src/utils/coinRewards';

type ShopTab = 'outfits' | 'accessories' | 'themes' | 'decorations' | 'utilities';

// ── Utilities items ───────────────────────────────────

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

// ── Shop Screen ───────────────────────────────────────

export default function ShopScreen() {
  const [tab, setTab] = useState<ShopTab>('outfits');
  const { coins, spendCoins, addStreakFreeze, streakFreezes } = useProgressStore();
  const {
    ownedOutfits, ownedAccessories, equippedOutfit, equippedAccessory,
    buyOutfit, buyAccessory, equipOutfit, equipAccessory,
  } = useCosmeticsStore();
  const {
    activeTheme, unlockedThemes, setTheme, unlockTheme,
  } = useGroveStore();

  const handleBuyOutfit = useCallback((def: OutfitDef) => {
    if (def.cost === -1) return;
    if (ownedOutfits.includes(def.id)) {
      equipOutfit(equippedOutfit === def.id ? null : def.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    if (!spendCoins(def.cost)) {
      Alert.alert('Not enough coins', `You need ${def.cost} coins for this outfit.`);
      return;
    }
    buyOutfit(def.id);
    equipOutfit(def.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [ownedOutfits, equippedOutfit, spendCoins, buyOutfit, equipOutfit]);

  const handleBuyAccessory = useCallback((def: AccessoryDef) => {
    if (def.cost === -1) return;
    if (ownedAccessories.includes(def.id)) {
      equipAccessory(equippedAccessory === def.id ? null : def.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    if (!spendCoins(def.cost)) {
      Alert.alert('Not enough coins', `You need ${def.cost} coins for this accessory.`);
      return;
    }
    buyAccessory(def.id);
    equipAccessory(def.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [ownedAccessories, equippedAccessory, spendCoins, buyAccessory, equipAccessory]);

  const handleBuyTheme = useCallback((themeId: GroveThemeId, cost: number) => {
    if (cost === -1) return;
    if (unlockedThemes.includes(themeId)) {
      setTheme(themeId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    if (!spendCoins(cost)) {
      Alert.alert('Not enough coins', `You need ${cost} coins for this theme.`);
      return;
    }
    unlockTheme(themeId);
    setTheme(themeId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [unlockedThemes, spendCoins, unlockTheme, setTheme]);

  const handleBuyUtility = useCallback((item: UtilityItem) => {
    if (item.id === 'streak-freeze') {
      if (streakFreezes >= 3) {
        Alert.alert('Maximum reached', 'You already have 3 streak freezes stored.');
        return;
      }
      if (!spendCoins(item.cost)) {
        Alert.alert('Not enough coins', `You need ${item.cost} coins.`);
        return;
      }
      addStreakFreeze();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (item.id === 'streak-repair') {
      // Streak repair logic handled at session level
      if (!spendCoins(item.cost)) {
        Alert.alert('Not enough coins', `You need ${item.cost} coins.`);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [streakFreezes, spendCoins, addStreakFreeze]);

  const tabs: { key: ShopTab; label: string }[] = [
    { key: 'outfits', label: 'Outfits' },
    { key: 'accessories', label: 'Gear' },
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

      {/* Tabs */}
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

      {/* Outfits */}
      {tab === 'outfits' && (
        <FlatList
          data={OUTFIT_DEFS}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            const owned = ownedOutfits.includes(item.id);
            const equipped = equippedOutfit === item.id;
            const isPro = item.cost === -1;
            return (
              <Pressable style={[styles.card, equipped && styles.cardEquipped]} onPress={() => handleBuyOutfit(item)}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                {equipped ? (
                  <Text style={styles.equippedTag}>Equipped</Text>
                ) : owned ? (
                  <Text style={styles.ownedTag}>Tap to equip</Text>
                ) : isPro ? (
                  <View style={styles.proBadge}><Text style={styles.proText}>PRO</Text></View>
                ) : (
                  <Text style={styles.costText}>{item.cost} 🪙</Text>
                )}
              </Pressable>
            );
          }}
        />
      )}

      {/* Accessories */}
      {tab === 'accessories' && (
        <FlatList
          data={ACCESSORY_DEFS}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            const owned = ownedAccessories.includes(item.id);
            const equipped = equippedAccessory === item.id;
            const isPro = item.cost === -1;
            return (
              <Pressable style={[styles.cardSmall, equipped && styles.cardEquipped]} onPress={() => handleBuyAccessory(item)}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                <Text style={styles.cardNameSmall} numberOfLines={1}>{item.name}</Text>
                {equipped ? (
                  <Text style={styles.equippedTagSmall}>Equipped</Text>
                ) : owned ? (
                  <Text style={styles.ownedTagSmall}>Equip</Text>
                ) : isPro ? (
                  <View style={styles.proBadgeSmall}><Text style={styles.proTextSmall}>PRO</Text></View>
                ) : (
                  <Text style={styles.costTextSmall}>{item.cost} 🪙</Text>
                )}
              </Pressable>
            );
          }}
        />
      )}

      {/* Themes */}
      {tab === 'themes' && (
        <ScrollView contentContainerStyle={styles.themesGrid}>
          {GROVE_THEMES.map((theme) => {
            const palette = GROVE_PALETTES[theme.id];
            const isActive = activeTheme === theme.id;
            const isOwned = unlockedThemes.includes(theme.id);
            const isPro = theme.cost === -1;
            return (
              <Pressable
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
                  <Text style={styles.equippedTag}>Active</Text>
                ) : isOwned ? (
                  <Text style={styles.ownedTag}>Tap to apply</Text>
                ) : isPro ? (
                  <View style={styles.proBadge}><Text style={styles.proText}>PRO</Text></View>
                ) : (
                  <Text style={styles.costText}>{theme.cost} 🪙</Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Decorations — redirect to grove shop */}
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
            <Pressable key={item.id} style={styles.utilCard} onPress={() => handleBuyUtility(item)}>
              <Text style={styles.utilEmoji}>{item.emoji}</Text>
              <View style={styles.utilInfo}>
                <Text style={styles.utilName}>{item.name}</Text>
                <Text style={styles.utilDesc}>{item.description}</Text>
                {item.id === 'streak-freeze' && (
                  <Text style={styles.utilExtra}>{streakFreezes}/3 stored</Text>
                )}
              </View>
              <Text style={styles.utilCost}>{item.cost} 🪙</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: { color: colors.sky, fontSize: 16, fontWeight: '600' },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  coinIcon: { fontSize: 14 },
  coinCount: { color: colors.warm, fontSize: 15, fontWeight: '800' },

  // Tabs
  tabScroll: { maxHeight: 44 },
  tabRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.bgSecondary,
  },
  tabActive: { backgroundColor: colors.growth },
  tabText: { color: colors.textTertiary, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: colors.bgPrimary },

  // Grid
  grid: { paddingHorizontal: 12, paddingTop: 8, gap: 10, paddingBottom: 40 },

  // Outfit cards (2 col)
  card: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
  },
  cardEquipped: { borderColor: colors.growth, borderWidth: 2 },
  cardEmoji: { fontSize: 32 },
  cardName: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  cardDesc: { color: colors.textTertiary, fontSize: 11, textAlign: 'center', lineHeight: 15 },
  equippedTag: { color: colors.growth, fontSize: 12, fontWeight: '700', marginTop: 4 },
  ownedTag: { color: colors.sky, fontSize: 11, fontWeight: '600', marginTop: 4 },
  costText: { color: colors.warm, fontSize: 13, fontWeight: '700', marginTop: 4 },
  proBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  proText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  // Accessory cards (3 col)
  cardSmall: {
    flex: 1,
    maxWidth: '31%',
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 3,
  },
  cardNameSmall: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  equippedTagSmall: { color: colors.growth, fontSize: 10, fontWeight: '700' },
  ownedTagSmall: { color: colors.sky, fontSize: 10, fontWeight: '600' },
  costTextSmall: { color: colors.warm, fontSize: 11, fontWeight: '700' },
  proBadgeSmall: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proTextSmall: { color: '#FFF', fontSize: 9, fontWeight: '800' },

  // Themes grid
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
    paddingTop: 8,
    paddingBottom: 40,
  },
  themeCard: {
    width: '47%',
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeCardActive: { borderColor: colors.growth, borderWidth: 2 },
  themePreview: {
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
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
  themeName: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  themeDesc: { color: colors.textTertiary, fontSize: 11, marginTop: 2, marginBottom: 6 },

  // Centered placeholder
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centeredEmoji: { fontSize: 48 },
  centeredText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  gotoBtn: {
    backgroundColor: colors.growth,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  gotoBtnText: { color: colors.bgPrimary, fontSize: 14, fontWeight: '700' },

  // Utilities
  utilList: { padding: 16, gap: 12, paddingBottom: 40 },
  utilCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  utilEmoji: { fontSize: 28 },
  utilInfo: { flex: 1, gap: 2 },
  utilName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  utilDesc: { color: colors.textTertiary, fontSize: 12 },
  utilExtra: { color: colors.sky, fontSize: 11, fontWeight: '600', marginTop: 2 },
  utilCost: { color: colors.warm, fontSize: 15, fontWeight: '800' },
});

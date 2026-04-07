import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, ScrollView, FlatList,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { tapLight, success as hapticSuccess } from '../../utils/haptics';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { GROVE_PALETTES } from '../../constants/groveThemes';
import { useProgressStore } from '../../stores/progressStore';
import { useCoinStore } from '../../stores/coinStore';
import {
  useGroveStore,
  GROVE_THEMES,
  DECORATION_DEFS,
  DecorationDef,
  DecorationCategory,
  GroveThemeId,
} from '../../stores/groveStore';

type ShopTab = 'themes' | 'decorations' | 'inventory';
type DecoFilterCategory = 'all' | DecorationCategory;

const CATEGORY_LABELS: Record<DecoFilterCategory, string> = {
  all: 'All',
  lighting: 'Lighting',
  seating: 'Seating',
  water: 'Water',
  nature: 'Nature',
  whimsical: 'Whimsical',
  structures: 'Structures',
  seasonal: 'Seasonal',
  pro: 'Pro',
};

interface GroveShopProps {
  visible: boolean;
  onClose: () => void;
  onPlaceDecoration: (defId: string) => void;
}

function ThemeCard({
  themeId,
  name,
  cost,
  description,
  isActive,
  isOwned,
  onBuy,
  onSelect,
}: {
  themeId: GroveThemeId;
  name: string;
  cost: number;
  description: string;
  isActive: boolean;
  isOwned: boolean;
  onBuy: () => void;
  onSelect: () => void;
}) {
  const palette = GROVE_PALETTES[themeId];
  const isPro = cost === -1;

  return (
    <Pressable
      style={[styles.themeCard, isActive && styles.themeCardActive]}
      onPress={isOwned ? onSelect : onBuy}
    >
      <View style={[styles.themePreview, { backgroundColor: palette.skyBottom }]}>
        <View style={[styles.themeGround, { backgroundColor: palette.groundBase }]} />
        <View style={[styles.themeAccent, { backgroundColor: palette.treeLeaf }]} />
        <View style={[styles.themeAccent2, { backgroundColor: palette.crystalColor }]} />
      </View>
      <Text style={styles.themeName}>{name}</Text>
      <Text style={styles.themeDesc} numberOfLines={2}>{description}</Text>
      {isActive ? (
        <Text style={styles.themeActive}>Active</Text>
      ) : isOwned ? (
        <Text style={styles.themeOwned}>Tap to apply</Text>
      ) : isPro ? (
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      ) : (
        <Text style={styles.themeCost}>{cost} coins</Text>
      )}
    </Pressable>
  );
}

function DecorationCard({
  def,
  isOwned,
  onBuy,
  onPlace,
}: {
  def: DecorationDef;
  isOwned: boolean;
  onBuy: () => void;
  onPlace: () => void;
}) {
  const isPro = def.cost === -1;

  return (
    <Pressable
      style={styles.decoCard}
      onPress={isOwned ? onPlace : onBuy}
    >
      <Text style={styles.decoEmoji}>{def.emoji}</Text>
      <Text style={styles.decoName} numberOfLines={1}>{def.name}</Text>
      {isOwned ? (
        <Text style={styles.decoPlace}>Place</Text>
      ) : isPro ? (
        <View style={styles.proBadgeSmall}>
          <Text style={styles.proBadgeSmallText}>PRO</Text>
        </View>
      ) : (
        <Text style={styles.decoCost}>{def.cost}</Text>
      )}
    </Pressable>
  );
}

export default function GroveShop({ visible, onClose, onPlaceDecoration }: GroveShopProps) {
  const [tab, setTab] = useState<ShopTab>('themes');
  const [decoFilter, setDecoFilter] = useState<DecoFilterCategory>('all');
  const coins = useProgressStore(s => s.coins);
  const spendCoins = useCoinStore(s => s.spendCoins);
  const activeTheme = useGroveStore(s => s.activeTheme);
  const unlockedThemes = useGroveStore(s => s.unlockedThemes);
  const ownedDecorations = useGroveStore(s => s.ownedDecorations);
  const setTheme = useGroveStore(s => s.setTheme);
  const unlockTheme = useGroveStore(s => s.unlockTheme);
  const buyDecoration = useGroveStore(s => s.buyDecoration);

  const filteredDecos = useMemo(() => {
    if (decoFilter === 'all') return DECORATION_DEFS;
    return DECORATION_DEFS.filter((d) => d.category === decoFilter);
  }, [decoFilter]);

  // Count owned instances per defId
  const ownedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const id of ownedDecorations) {
      counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
  }, [ownedDecorations]);

  const handleBuyTheme = (themeId: GroveThemeId, cost: number) => {
    if (cost === -1) return; // Pro only — skip for now
    if (unlockedThemes.includes(themeId)) {
      setTheme(themeId);
      tapLight();
      return;
    }
    if (!spendCoins(cost, `Grove theme: ${themeId}`)) return;
    unlockTheme(themeId);
    setTheme(themeId);
    hapticSuccess();
  };

  const handleBuyDecoration = (def: DecorationDef) => {
    if (def.cost === -1) return; // Pro only
    if (!spendCoins(def.cost, `Decoration: ${def.name}`)) return;
    buyDecoration(def.id);
    hapticSuccess();
  };

  const handlePlaceFromInventory = (defId: string) => {
    onPlaceDecoration(defId);
    onClose();
  };

  const tabs: { key: ShopTab; label: string }[] = [
    { key: 'themes', label: 'Themes' },
    { key: 'decorations', label: 'Decor' },
    { key: 'inventory', label: `Inventory (${ownedDecorations.length})` },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
          <Text style={styles.title}>Grove Shop</Text>
          <View style={styles.coinBadge}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinCount}>{coins}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
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
        </View>

        {/* Themes tab */}
        {tab === 'themes' && (
          <ScrollView style={styles.content} contentContainerStyle={styles.themesGrid}>
            {GROVE_THEMES.map((theme) => (
              <ThemeCard
                key={theme.id}
                themeId={theme.id}
                name={theme.name}
                cost={theme.cost}
                description={theme.description}
                isActive={activeTheme === theme.id}
                isOwned={unlockedThemes.includes(theme.id)}
                onBuy={() => handleBuyTheme(theme.id, theme.cost)}
                onSelect={() => { setTheme(theme.id); tapLight(); }}
              />
            ))}
          </ScrollView>
        )}

        {/* Decorations tab */}
        {tab === 'decorations' && (
          <View style={styles.content}>
            {/* Category filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {(Object.keys(CATEGORY_LABELS) as DecoFilterCategory[]).map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.filterChip, decoFilter === cat && styles.filterChipActive]}
                  onPress={() => setDecoFilter(cat)}
                >
                  <Text style={[styles.filterText, decoFilter === cat && styles.filterTextActive]}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <FlatList
              data={filteredDecos}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.decoGrid}
              renderItem={({ item }) => (
                <DecorationCard
                  def={item}
                  isOwned={(ownedCounts[item.id] || 0) > 0}
                  onBuy={() => handleBuyDecoration(item)}
                  onPlace={() => handlePlaceFromInventory(item.id)}
                />
              )}
            />
          </View>
        )}

        {/* Inventory tab */}
        {tab === 'inventory' && (
          <View style={styles.content}>
            {ownedDecorations.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🏪</Text>
                <Text style={styles.emptyText}>Your inventory is empty</Text>
                <Text style={styles.emptySubtext}>Buy decorations to place in your grove</Text>
              </View>
            ) : (
              <FlatList
                data={Object.entries(ownedCounts)}
                keyExtractor={([id]) => id}
                numColumns={3}
                contentContainerStyle={styles.decoGrid}
                renderItem={({ item: [defId, count] }) => {
                  const def = DECORATION_DEFS.find((d) => d.id === defId);
                  if (!def) return null;
                  return (
                    <Pressable
                      style={styles.decoCard}
                      onPress={() => handlePlaceFromInventory(defId)}
                    >
                      <Text style={styles.decoEmoji}>{def.emoji}</Text>
                      <Text style={styles.decoName} numberOfLines={1}>{def.name}</Text>
                      <Text style={styles.decoPlace}>Place{count > 1 ? ` (${count})` : ''}</Text>
                    </Pressable>
                  );
                }}
              />
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  closeText: { fontFamily: fonts.bodySemi, color: C.blue, fontSize: 15 },
  title: { fontFamily: fonts.heading, color: C.t1, fontSize: 18 },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.peachTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  coinIcon: { fontSize: 14 },
  coinCount: { fontFamily: fonts.bodyBold, color: C.peach, fontSize: 14 },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: C.surface,
  },
  tabActive: { backgroundColor: C.green },
  tabText: { fontFamily: fonts.bodySemi, color: C.t3, fontSize: 13 },
  tabTextActive: { color: C.bg2 },

  content: { flex: 1, paddingTop: 12 },

  // Themes
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
    paddingBottom: 40,
  },
  themeCard: {
    width: '47%',
    backgroundColor: C.bg3,
    borderRadius: 16,
    padding: 10,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  themeCardActive: { borderColor: C.green, borderWidth: 1.5 },
  themePreview: {
    height: 60,
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
  themeAccent: {
    position: 'absolute',
    bottom: '30%',
    left: '20%',
    width: 14,
    height: 14,
    borderRadius: 7,
    opacity: 0.8,
  },
  themeAccent2: {
    position: 'absolute',
    bottom: '35%',
    right: '25%',
    width: 10,
    height: 18,
    borderRadius: 3,
    opacity: 0.7,
  },
  themeName: { fontFamily: fonts.bodyBold, color: C.t1, fontSize: 13 },
  themeDesc: { fontFamily: fonts.body, color: C.t3, fontSize: 11, marginTop: 2, marginBottom: 6 },
  themeActive: { fontFamily: fonts.bodyBold, color: C.green, fontSize: 12 },
  themeOwned: { fontFamily: fonts.bodySemi, color: C.blue, fontSize: 12 },
  themeCost: { fontFamily: fonts.bodyBold, color: C.peach, fontSize: 12 },
  proBadge: {
    backgroundColor: C.purple,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  proBadgeText: { fontFamily: fonts.bodyBold, color: '#FFF', fontSize: 10 },

  // Category filter
  filterRow: {
    paddingHorizontal: 12,
    marginBottom: 8,
    maxHeight: 36,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.surface,
    marginRight: 6,
  },
  filterChipActive: { backgroundColor: C.green },
  filterText: { fontFamily: fonts.bodySemi, color: C.t3, fontSize: 12 },
  filterTextActive: { color: C.bg2 },

  // Decorations grid
  decoGrid: { paddingHorizontal: 12, gap: 8, paddingBottom: 40 },
  decoCard: {
    flex: 1,
    maxWidth: '32%',
    backgroundColor: C.bg3,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    gap: 4,
    borderWidth: 0.5,
    borderColor: C.border,
    marginHorizontal: 2,
  },
  decoEmoji: { fontSize: 28 },
  decoName: { fontFamily: fonts.bodySemi, color: C.t2, fontSize: 11, textAlign: 'center' },
  decoPlace: { fontFamily: fonts.bodyBold, color: C.green, fontSize: 11 },
  decoCost: { fontFamily: fonts.bodyBold, color: C.peach, fontSize: 12 },
  proBadgeSmall: {
    backgroundColor: C.purple,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 999,
  },
  proBadgeSmallText: { fontFamily: fonts.bodyBold, color: '#FFF', fontSize: 9 },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontFamily: fonts.heading, color: C.t1, fontSize: 16 },
  emptySubtext: { fontFamily: fonts.body, color: C.t3, fontSize: 13 },
});

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingParticles from '../../src/components/ui/FloatingParticles';
import PressableScale from '../../src/components/ui/PressableScale';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { C } from '../../src/constants/colors';
import { fonts, type as t } from '../../src/constants/typography';
import { space, radii, shadows } from '../../src/constants/design';
import Kova from '../../src/components/kova/Kova';
import { useUserStore } from '../../src/stores/userStore';
import { useProgressStore, xpForLevel } from '../../src/stores/progressStore';
import { useGroveStore } from '../../src/stores/groveStore';
import { stageFromXP, stageNames, stageColors } from '../../src/components/kova/KovaStates';
import { BrainArea, AREA_LABELS, AREA_ACCENT, gameConfigs, GameId } from '../../src/constants/gameConfigs';
import { getXPProgress } from '../../src/components/ui/XPProgressBar';
import BadgeGrid from '../../src/components/badges/BadgeGrid';
import ErrorBoundary from '../../src/components/ui/ErrorBoundary';
import { getDailyQuote } from '../../src/constants/quotes';

const { width: W } = Dimensions.get('window');
const STAT_GAP = 8;
const STAT_MARGIN = 24;
const STAT_COLS = 4;
const STAT_W = (W - STAT_MARGIN * 2 - STAT_GAP * (STAT_COLS - 1)) / STAT_COLS;

// ── Brain type mapping ────────────────────────────────────────────

interface BrainTypeInfo {
  name: string;
  description: string;
  color: string;
  rarity: string;
}

const BRAIN_TYPES: Record<string, BrainTypeInfo> = {
  memory: { name: 'The Architect', description: 'You build structures in your mind that others can\'t see.', color: C.green, rarity: '14% of users' },
  focus: { name: 'The Observer', description: 'You see what everyone else misses.', color: C.blue, rarity: '12% of users' },
  speed: { name: 'The Lightning Rod', description: 'Your brain fires before others even start thinking.', color: C.amber, rarity: '11% of users' },
  flexibility: { name: 'The Shapeshifter', description: 'Rules change. You don\'t blink.', color: C.purple, rarity: '9% of users' },
  creativity: { name: 'The Dreamer', description: 'Your brain connects dots that don\'t exist yet.', color: C.peach, rarity: '10% of users' },
  balanced: { name: 'The Alchemist', description: 'Jack of all trades. Master of all.', color: C.green, rarity: '5% of users' },
};

const HEADER_GRADIENTS: Record<string, [string, string]> = {
  memory: ['#0A2918', '#0C1018'],
  focus: ['#0A1828', '#0C1018'],
  speed: ['#1A1808', '#0C1018'],
  flexibility: ['#18082A', '#0C1018'],
  creativity: ['#1A1210', '#0C1018'],
  balanced: ['#131828', '#0C1018'],
};

function getDominantArea(scores: Record<BrainArea, number>): { area: BrainArea | 'balanced'; isBalanced: boolean } {
  const entries = Object.entries(scores) as Array<[BrainArea, number]>;
  if (entries.every(([, v]) => v === 0)) return { area: 'balanced', isBalanced: true };
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const highest = sorted[0][1];
  const lowest = sorted[sorted.length - 1][1];
  if (highest > 0 && (highest - lowest) / Math.max(highest, 1) < 0.15) {
    return { area: 'balanced', isBalanced: true };
  }
  return { area: sorted[0][0], isBalanced: false };
}

function formatXP(xp: number): string {
  if (xp >= 100000) return `${(xp / 1000).toFixed(0)}K`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
}

function formatMinutes(sessions: Array<{ games: Array<{ accuracy: number }> }>): string {
  // Rough estimate: 1.5 min per game
  const totalMin = sessions.reduce((sum, s) => sum + s.games.length * 1.5, 0);
  if (totalMin >= 60) return `${(totalMin / 60).toFixed(1)}h`;
  return `${Math.round(totalMin)}m`;
}

// ── SECTION 1: Profile Header ─────────────────────────────────────

function ProfileHeader({ name, stage, level, xp, dominantArea, accentColor, joinDate }: {
  name: string; stage: number; level: number; xp: number;
  dominantArea: string; accentColor: string; joinDate: string;
}) {
  const xpProgress = getXPProgress(xp, level);
  const pct = Math.min(100, (xpProgress.xpIntoLevel / Math.max(xpProgress.xpNeeded, 1)) * 100);
  const gradient = HEADER_GRADIENTS[dominantArea] ?? HEADER_GRADIENTS.balanced;
  const memberSince = useMemo(() => {
    try {
      const d = new Date(joinDate);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
  }, [joinDate]);

  const daysSinceJoin = useMemo(() => {
    try {
      const d = new Date(joinDate);
      return Math.max(1, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
    } catch { return 1; }
  }, [joinDate]);

  return (
    <Animated.View entering={FadeIn.delay(50).duration(500)}>
      <View style={s.headerCard}>
        <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
        <View style={s.headerNoise} pointerEvents="none" />

        <Kova stage={stage as any} emotion="happy" size={96} showSpeechBubble={false} />
        <Text style={s.headerStageName}>{(stageNames[stage as keyof typeof stageNames] ?? 'Seed').toUpperCase()}</Text>

        <Text style={s.headerName}>{name || 'Trainer'}</Text>
        <View style={[s.levelPill, { backgroundColor: `${accentColor}30` }]}>
          <Text style={[s.levelPillText, { color: accentColor }]}>Level {level}</Text>
        </View>

        <View style={s.headerXPBarTrack}>
          <View style={[s.headerXPBarFill, { width: `${pct}%`, backgroundColor: accentColor }]} />
        </View>
        <Text style={s.headerXPText}>{xpProgress.xpIntoLevel} / {xpProgress.xpNeeded} XP</Text>

        {memberSince ? (
          <Text style={s.headerMemberSince}>
            Joined {memberSince} · Day {daysSinceJoin}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ── SECTION 2: Stats Wall ─────────────────────────────────────────

function StatsWall({ streak, totalSessions, xp, longestStreak, coins, sessions, brainScores }: {
  streak: number; totalSessions: number; xp: number; longestStreak: number;
  coins: number; sessions: any[]; brainScores: Record<BrainArea, number>;
}) {
  const totalGames = useMemo(() => sessions.reduce((sum: number, s: any) => sum + (s?.games?.length ?? 0), 0), [sessions]);
  const avgAccuracy = useMemo(() => {
    let total = 0; let count = 0;
    for (const s of sessions) {
      for (const g of (s?.games ?? [])) {
        total += g?.accuracy ?? 0;
        count++;
      }
    }
    return count > 0 ? Math.round((total / count) * 100) : 0;
  }, [sessions]);

  const stats = [
    { value: `${streak}${streak >= 7 ? ' 🔥' : ''}`, label: 'STREAK', color: C.amber },
    { value: totalSessions.toString(), label: 'SESSIONS', color: C.blue },
    { value: formatXP(xp), label: 'TOTAL XP', color: C.purple },
    { value: longestStreak.toString(), label: 'BEST STREAK', color: C.amber },
    { value: totalGames.toString(), label: 'GAMES', color: C.green },
    { value: formatMinutes(sessions), label: 'TRAINED', color: C.peach },
    { value: `${avgAccuracy}%`, label: 'ACCURACY', color: C.green },
    { value: coins.toString(), label: 'COINS', color: C.amber },
  ];

  return (
    <Animated.View entering={FadeInDown.delay(150).duration(400)}>
      <Text style={s.sectionHeader}>YOUR NUMBERS</Text>
      <View style={s.statsGrid}>
        {stats.map((stat, i) => (
          <PressableScale key={stat.label} style={s.statCard}>
            <Text style={[s.statValue, { color: stat.color }]} numberOfLines={1} adjustsFontSizeToFit>
              {stat.value}
            </Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </PressableScale>
        ))}
      </View>
    </Animated.View>
  );
}

// ── SECTION 3: Brain Identity ─────────────────────────────────────

function BrainIdentity({ brainScores, sessions, dominantArea, accentColor, totalSessions }: {
  brainScores: Record<BrainArea, number>; sessions: any[];
  dominantArea: string; accentColor: string; totalSessions: number;
}) {
  const brainType = BRAIN_TYPES[dominantArea] ?? BRAIN_TYPES.balanced;

  // Favorite game
  const favoriteGame = useMemo(() => {
    const counts: Partial<Record<GameId, number>> = {};
    for (const ses of sessions) {
      for (const g of (ses?.games ?? [])) {
        counts[g.gameId as GameId] = (counts[g.gameId as GameId] ?? 0) + 1;
      }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    const id = sorted[0][0] as GameId;
    return { name: gameConfigs[id]?.name ?? id, count: sorted[0][1] };
  }, [sessions]);

  // Best time of day
  const bestTime = useMemo(() => {
    const buckets = { morning: { total: 0, count: 0 }, afternoon: { total: 0, count: 0 }, evening: { total: 0, count: 0 } };
    for (const ses of sessions) {
      const hour = new Date(ses.date).getHours();
      const bucket = hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening';
      const acc = (ses?.games ?? []).reduce((a: number, g: any) => a + (g?.accuracy ?? 0), 0) / Math.max((ses?.games ?? []).length, 1);
      buckets[bucket].total += acc;
      buckets[bucket].count += 1;
    }
    const sorted = Object.entries(buckets).filter(([, v]) => v.count >= 2).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count));
    return sorted.length > 0 ? sorted[0][0] : null;
  }, [sessions]);

  // Strongest area
  const strongestArea = useMemo(() => {
    const entries = Object.entries(brainScores) as Array<[BrainArea, number]>;
    const sorted = [...entries].sort((a, b) => b[1] - a[1]);
    return sorted[0];
  }, [brainScores]);

  // 30-day heatmap
  const heatmap = useMemo(() => {
    const today = new Date();
    const days: Array<{ date: string; trained: boolean; isToday: boolean }> = [];
    const sessionDates = new Set(sessions.map((ses: any) => ses.date?.split('T')[0]));
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: dateStr, trained: sessionDates.has(dateStr), isToday: i === 0 });
    }
    return days;
  }, [sessions]);

  const trainedDays = heatmap.filter(d => d.trained).length;

  return (
    <Animated.View entering={FadeInDown.delay(250).duration(400)}>
      <Text style={s.sectionHeader}>YOUR BRAIN</Text>

      {/* Brain Type Card */}
      <View style={[s.brainTypeCard, { borderLeftColor: brainType.color }]}>
        {totalSessions >= 7 ? (
          <>
            <View style={s.brainTypeTopRow}>
              <Text style={[s.brainTypeName, { color: brainType.color }]}>{brainType.name}</Text>
              <View style={[s.rarityPill, { backgroundColor: `${brainType.color}18` }]}>
                <Text style={[s.rarityText, { color: brainType.color }]}>{brainType.rarity}</Text>
              </View>
            </View>
            <Text style={s.brainTypeDesc}>{brainType.description}</Text>
            <Text style={s.brainTypeUpdated}>Updated weekly</Text>
          </>
        ) : (
          <Text style={s.brainTypePlaceholder}>Train for 7 days to discover your Brain Type</Text>
        )}
      </View>

      {/* Brain Map Mini */}
      <PressableScale style={s.brainMapMini} onPress={() => router.push('/(tabs)/insights' as any)}>
        {(Object.entries(brainScores) as Array<[BrainArea, number]>).map(([area, score]) => {
          const color = AREA_ACCENT[area] ?? C.green;
          return (
            <View key={area} style={s.miniRow}>
              <View style={[s.miniDot, { backgroundColor: color }]} />
              <Text style={s.miniLabel}>{AREA_LABELS[area] ?? area}</Text>
              <View style={s.miniBarTrack}>
                <View style={[s.miniBarFill, { width: `${Math.min(score, 100)}%`, backgroundColor: color }]} />
              </View>
              <Text style={[s.miniScore, { color }]}>{Math.round(score)}</Text>
            </View>
          );
        })}
      </PressableScale>

      {/* Personal Insights */}
      <View style={s.insightsCard}>
        {/* Favorite game */}
        <View style={s.insightRow}>
          <Text style={s.insightIcon}>⭐</Text>
          {favoriteGame ? (
            <View style={{ flex: 1 }}>
              <Text style={s.insightValue}>{favoriteGame.name}</Text>
              <Text style={s.insightMeta}>{favoriteGame.count} times played</Text>
            </View>
          ) : (
            <Text style={s.insightPlaceholder}>Play some games to find your favorite</Text>
          )}
        </View>
        {/* Best time */}
        <View style={s.insightRow}>
          <Text style={s.insightIcon}>🕐</Text>
          {bestTime ? (
            <Text style={s.insightValue}>You perform best in the {bestTime}</Text>
          ) : (
            <Text style={s.insightPlaceholder}>Keep training to discover your peak time</Text>
          )}
        </View>
        {/* Strongest area */}
        <View style={s.insightRow}>
          <Text style={s.insightIcon}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.insightValue}>{AREA_LABELS[strongestArea[0]] ?? 'Memory'}</Text>
            <Text style={s.insightMeta}>Score: {Math.round(strongestArea[1])}/100</Text>
          </View>
        </View>
        {/* 30-day heatmap */}
        <View style={s.insightRow}>
          <Text style={s.insightIcon}>📅</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.insightValue}>{trainedDays} of last 30 days</Text>
            <View style={s.heatmapRow}>
              {heatmap.map((day) => (
                <View
                  key={day.date}
                  style={[
                    s.heatmapDot,
                    day.trained && s.heatmapDotTrained,
                    day.isToday && s.heatmapDotToday,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ── SECTION 6: Recent Sessions ────────────────────────────────────

const GAME_ABBR: Partial<Record<GameId, { abbr: string; color: string }>> = {
  'ghost-kitchen': { abbr: 'GK', color: C.peach },
  pulse: { abbr: 'PL', color: C.purple },
  'word-weave': { abbr: 'WW', color: C.blue },
  'face-place': { abbr: 'FP', color: C.green },
  'signal-noise': { abbr: 'SN', color: C.blue },
  'chain-reaction': { abbr: 'CR', color: C.amber },
  'mind-drift': { abbr: 'MD', color: C.green },
  rewind: { abbr: 'RW', color: C.peach },
  mirrors: { abbr: 'MR', color: C.purple },
  'zen-flow': { abbr: 'ZF', color: C.blue },
  'split-focus': { abbr: 'SF', color: C.purple },
};

function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function RecentSessions({ sessions }: { sessions: any[] }) {
  const recent = useMemo(() => [...sessions].reverse().slice(0, 10), [sessions]);

  return (
    <Animated.View entering={FadeInDown.delay(450).duration(400)}>
      <Text style={s.sectionHeader}>RECENT SESSIONS</Text>
      {recent.length === 0 ? (
        <View style={s.emptySessionCard}>
          <Text style={s.emptySessionText}>Your history starts with your first session.</Text>
        </View>
      ) : (
        recent.map((ses, i) => {
          const games = ses?.games ?? [];
          const avgAcc = games.length > 0
            ? Math.round(games.reduce((a: number, g: any) => a + (g?.accuracy ?? 0), 0) / games.length * 100)
            : 0;
          return (
            <View key={ses.id ?? i} style={s.sessionCard}>
              <View style={s.sessionTopRow}>
                <Text style={s.sessionDate}>{formatSessionDate(ses.date)}</Text>
                <Text style={s.sessionXP}>+{ses.totalXP ?? 0} XP</Text>
              </View>
              <View style={s.sessionGamesRow}>
                {games.map((g: any, j: number) => {
                  const info = GAME_ABBR[g.gameId as GameId];
                  return (
                    <View key={j} style={[s.gamePill, { backgroundColor: `${info?.color ?? C.t3}20` }]}>
                      <Text style={[s.gamePillText, { color: info?.color ?? C.t3 }]}>{info?.abbr ?? '??'}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={s.sessionAccuracy}>Avg accuracy: {avgAcc}%</Text>
            </View>
          );
        })
      )}
    </Animated.View>
  );
}

// ── SECTION 7: Footer Actions ─────────────────────────────────────

function FooterActions() {
  return (
    <Animated.View entering={FadeInDown.delay(550).duration(400)}>
      <View style={s.footerActions}>
        <PressableScale style={s.footerBtn} onPress={() => router.push('/settings')}>
          <Text style={s.footerBtnIcon}>⚙️</Text>
          <Text style={s.footerBtnLabel}>Settings</Text>
        </PressableScale>
        <PressableScale style={s.footerBtn} onPress={() => router.push('/science')}>
          <Text style={s.footerBtnIcon}>📖</Text>
          <Text style={s.footerBtnLabel}>Science</Text>
        </PressableScale>
        <PressableScale style={s.footerBtn} onPress={() => router.push('/shop')}>
          <Text style={s.footerBtnIcon}>🏪</Text>
          <Text style={s.footerBtnLabel}>Shop</Text>
        </PressableScale>
      </View>
      <View style={s.footer}>
        <Text style={s.footerText}>Neurra v1.0.0</Text>
        <Text style={s.footerText}>Made with 🧠 in Iceland</Text>
      </View>
    </Animated.View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────────

function ProfileScreenInner() {
  const name = useUserStore(s2 => s2.name);
  const joinDate = useUserStore(s2 => s2.joinDate);
  const xp = useProgressStore(s2 => s2.xp);
  const level = useProgressStore(s2 => s2.level);
  const streak = useProgressStore(s2 => s2.streak);
  const longestStreak = useProgressStore(s2 => s2.longestStreak);
  const totalSessions = useProgressStore(s2 => s2.totalSessions);
  const coins = useProgressStore(s2 => s2.coins);
  const brainScores = useProgressStore(s2 => s2.brainScores);
  const sessions = useProgressStore(s2 => s2.sessions);
  const stage = stageFromXP(xp);

  const { area: dominantArea } = useMemo(() => getDominantArea(brainScores), [brainScores]);
  const accentColor = dominantArea === 'balanced'
    ? C.green
    : (AREA_ACCENT[dominantArea as BrainArea] ?? C.green);

  return (
    <SafeAreaView style={s.safe}>
      <LinearGradient colors={[C.bg1, '#0C1018', C.bg1]} style={StyleSheet.absoluteFillObject} />
      <FloatingParticles count={4} color="rgba(155,114,224,0.1)" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <ProfileHeader
          name={name} stage={stage} level={level} xp={xp}
          dominantArea={dominantArea} accentColor={accentColor}
          joinDate={joinDate}
        />
        <StatsWall
          streak={streak} totalSessions={totalSessions} xp={xp}
          longestStreak={longestStreak} coins={coins} sessions={sessions}
          brainScores={brainScores}
        />
        {/* Personal journey line — a data-driven sentence about who you are */}
        {totalSessions > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.journeyCard}>
            <Text style={s.journeyText}>
              {totalSessions === 1
                ? "You took the first step. That's the hardest one."
                : totalSessions < 10
                ? `${totalSessions} sessions in and your brain is already changing. Keep going.`
                : totalSessions < 50
                ? `${totalSessions} sessions. ${longestStreak > 7 ? `A ${longestStreak}-day streak.` : ''} You're building something real here.`
                : `${totalSessions} sessions. Level ${level}. ${longestStreak}-day best streak. This isn't a hobby anymore — it's a habit.`}
            </Text>
          </Animated.View>
        )}
        <BrainIdentity
          brainScores={brainScores} sessions={sessions}
          dominantArea={dominantArea} accentColor={accentColor}
          totalSessions={totalSessions}
        />
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={s.sectionHeader}>ACHIEVEMENTS</Text>
          <BadgeGrid />
        </Animated.View>
        <RecentSessions sessions={sessions} />

        {/* Daily quote */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={s.profileQuoteWrap}>
          {(() => {
            const q = getDailyQuote();
            return (
              <View style={s.profileQuoteCard}>
                <Text style={s.profileQuoteText}>"{q.text}"</Text>
                <Text style={s.profileQuoteAuthor}>— {q.author}</Text>
              </View>
            );
          })()}
        </Animated.View>

        <FooterActions />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── STYLES ────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg1 },
  scroll: { paddingBottom: 120 },

  // ── Journey card ─────────────────────
  journeyCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'rgba(19,24,41,0.88)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(110,207,154,0.12)',
    shadowColor: '#6ECF9A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  journeyText: {
    fontFamily: fonts.kova,
    color: C.t2,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },

  // ── Section headers ─────────────────
  sectionHeader: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: C.t3,
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingLeft: STAT_MARGIN,
    marginTop: 36,
    marginBottom: 14,
  },

  // ── Section 1: Header ───────────────
  headerCard: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    gap: 6,
  },
  headerNoise: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  headerStageName: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: C.t3,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  headerName: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: C.t1,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  levelPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  levelPillText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
  },
  headerXPBarTrack: {
    width: 240,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 10,
    overflow: 'hidden',
  },
  headerXPBarFill: {
    height: '100%',
    borderRadius: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  headerXPText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: C.t4,
    marginTop: 4,
  },
  headerMemberSince: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.t4,
    marginTop: 6,
  },

  // ── Section 2: Stats ────────────────
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: STAT_MARGIN,
    gap: STAT_GAP + 2,
    marginTop: 8,
  },
  statCard: {
    width: STAT_W,
    height: 88,
    borderRadius: 14,
    backgroundColor: 'rgba(19,24,41,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  statValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 22,
    letterSpacing: -0.5,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: C.t4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // ── Section 3: Brain Identity ───────
  brainTypeCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(19,24,41,0.88)',
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    padding: 16,
    gap: 6,
  },
  brainTypeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brainTypeName: {
    fontFamily: fonts.heading,
    fontSize: 20,
  },
  rarityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rarityText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
  },
  brainTypeDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: C.t2,
    lineHeight: 20,
  },
  brainTypeUpdated: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: C.t4,
  },
  brainTypePlaceholder: {
    fontFamily: fonts.kova,
    fontSize: 16,
    color: C.t3,
    textAlign: 'center',
    paddingVertical: 16,
  },

  // Brain Map Mini
  brainMapMini: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(19,24,41,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(155,114,224,0.15)',
    padding: 16,
    gap: 10,
    shadowColor: '#9B72E0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniDot: { width: 6, height: 6, borderRadius: 3 },
  miniLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t2,
    width: 72,
  },
  miniBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.bg5,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  miniScore: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    width: 28,
    textAlign: 'right',
  },

  // Personal Insights
  insightsCard: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(19,24,41,0.88)',
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 14,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  insightIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  insightValue: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: C.t1,
  },
  insightMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t3,
    marginTop: 1,
  },
  insightPlaceholder: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: C.t3,
    flex: 1,
  },

  // Heatmap
  heatmapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 6,
  },
  heatmapDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: C.bg5,
  },
  heatmapDotTrained: {
    backgroundColor: C.green,
  },
  heatmapDotToday: {
    borderWidth: 1,
    borderColor: C.t3,
  },

  // ── Section 6: Sessions ─────────────
  sessionCard: {
    marginHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(19,24,41,0.88)',
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  sessionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDate: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t3,
  },
  sessionXP: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: C.amber,
  },
  sessionGamesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  gamePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gamePillText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  sessionAccuracy: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.t3,
  },
  emptySessionCard: {
    marginHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(19,24,41,0.88)',
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    alignItems: 'center',
  },
  emptySessionText: {
    fontFamily: fonts.kova,
    fontSize: 16,
    color: C.t3,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Profile quote ───────────────────
  profileQuoteWrap: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  profileQuoteCard: {
    backgroundColor: 'rgba(19,24,41,0.88)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    borderLeftColor: C.purple,
  },
  profileQuoteText: {
    fontFamily: fonts.kova,
    color: C.t1,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  profileQuoteAuthor: {
    fontFamily: fonts.bodySemi,
    color: C.purple,
    fontSize: 11,
    marginTop: 8,
    letterSpacing: 0.3,
  },

  // ── Section 7: Footer ───────────────
  footerActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 36,
  },
  footerBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(19,24,41,0.88)',
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  footerBtnIcon: {
    fontSize: 20,
  },
  footerBtnLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: C.t3,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
    gap: 4,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: C.t4,
  },
});

// ── Export with error boundary ─────────────────────────────────────

export default function ProfileScreen() {
  return (
    <ErrorBoundary scope="Profile tab">
      <ProfileScreenInner />
    </ErrorBoundary>
  );
}

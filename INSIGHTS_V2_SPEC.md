# Insights Tab Rebuild (v2) — 2-hour prompt

Transform the current 589-line flat `app/(tabs)/insights.tsx` into a **"personal brain science" screen** that reads less like a dashboard and more like a weekly read-out from a trainer who knows you. Current screen is a stack of cards with bars and a "this week vs last week" row. The new screen tells a story, surfaces patterns the user couldn't see on their own, and nudges action.

**Golden rule**: If any store field or helper doesn't exist, STOP and ask. Do not guess. Do not invent stats the data can't back.

---

## Constraints (non-negotiable)

- Expo Go compatible: **no** BlurView, **no** Skia, **no** SVG filters, **no** Lottie, **no** native modules beyond what's already in use
- React Native + TypeScript + Expo Router (file-based)
- Reanimated 3 for all motion (no RN Animated, no setInterval-driven animations)
- `react-native-svg` OK for sparklines and charts
- `expo-linear-gradient` for card backgrounds / hero
- `expo-haptics` routed through `src/utils/haptics.ts` (respects user's haptics toggle — never import `expo-haptics` directly)
- `@expo/vector-icons` (Ionicons / MaterialCommunityIcons). **No emoji in UI copy** (except Kova's own speech/sticker assets and the current weather emoji in `BrainPulseHero`, which is wired through the insights engine)
- Design tokens only — reuse `src/constants/{colors,typography,design,gameConfigs}`. No new constants files.
- `React.memo` on every section component; `useAnimatedScrollHandler` if you want scroll-linked parallax on the hero
- Tinted glow shadows via `accentGlow(color, radius, opacity)` — never flat gray/black shadows
- Asymmetric layouts (avoid the "four identical cards" look). Staggered entrance: 80-100ms offset per section via `FadeInDown.delay(...)`
- All routes passed to `router.push` must be verified to exist before using. Existing routes: `/(tabs)/games`, `/(tabs)/grove`, `/(tabs)/profile`, `/weekly-report`, `/science`, `/shop`, `/settings`
- Typecheck must be 0 errors at the end (`npx tsc --noEmit`)

---

## Phase 0 — Inventory (do this BEFORE writing any component)

Dispatch one Explore agent with "very thorough" thoroughness to return:

1. **Store shapes + exact field names** for every store Insights reads:
   - `progressStore`: sessions (what are `SessionRecord` fields?), brainScores, gameHistory, personalBests, streak, longestStreak, totalSessions, xp, level, gameLevels
   - `userStore`: mood, moodHistory (if exists), improvementGoals, joinDate, sessionLength
   - `brainHistoryStore`: snapshots, `getSnapshotFromDaysAgo`, `getRecent`
   - `weeklyReportStore`: reports map, `getLatestReportWeekId`, report fields
   - `journalStore`: entries (mood values — is it 3-state `up|neutral|down` or 5-state?), date format
   - `kovaStore`: currentStage, currentEmotion, currentStreak (vs progressStore.streak — clarify which)
   - `achievementStore`: unlocked list, `evaluate`
   - `dailyChallengeStore`: challenges (today only? lifetime?), `completeChallenge`
   - `personalityStore`: personality, `current()`, `recalcIfNeeded()`
2. **Existing insights engine**: read `src/utils/insightsEngine.ts` end-to-end. Document: `BrainPulseData` shape, what `generateInsights` returns, every field in an `Insight`, and what the weather states are. Do NOT duplicate logic — extend this engine if you need new derived data.
3. **Existing reusables** to find and reuse:
   - `src/components/insights/BrainPulseHero.tsx` (already exists — keep or rebuild?)
   - `src/components/insights/InsightCard.tsx` (signature?)
   - `src/components/journal/JournalTimeline.tsx`
   - `src/components/ui/NeuralMap.tsx`, `XPProgressBar.tsx`, `PressableScale.tsx`, `FloatingParticles.tsx`
   - `src/components/home/SectionHeader.tsx` (eyebrow + optional action)
   - `src/components/kova/Kova.tsx` — size, emotion, stage API (note: two `KovaEmotion` unions exist; map store emotions to visual emotions, don't cast `as any`)
   - `src/utils/{haptics,timeUtils}.ts` — `selection`, `tapMedium`, `localDateStr`, `isToday`, `isYesterday`
4. **Game configs**: `availableGames`, `gameConfigs`, `AREA_LABELS`, `AREA_ACCENT`. Confirm `AREA_ACCENT` colors per area.
5. **Current `app/(tabs)/insights.tsx`**: list every data derivation the current screen does so you don't drop a feature by accident (activity dots, summary line, weakest-area recommendation, past reports list, etc.)

Report this as a single digest before proceeding.

---

## Target architecture

New dir: `src/components/insights/v2/` (keep `BrainPulseHero` + `InsightCard` in the parent `insights/` dir as reusables; new sections live in `v2/`).

Rewrite `app/(tabs)/insights.tsx` from 589 lines → a thin composer (~70 lines) wrapping `Animated.ScrollView` with the sections below, an `ErrorBoundary`, and `FloatingParticles` backdrop. Paywall modal state lives in the composer (memoized openPaywall callback).

---

## The 10 sections (in scroll order)

### SECTION 1 — HeroPulse
**File**: `v2/HeroPulse.tsx`

Replaces the current plain `<Text>Insights</Text>` + `BrainPulseHero`. One tall card (≈260px) that functions as the emotional anchor of the tab.

- Full-bleed `LinearGradient` from a weather-color top to `C.bg1` bottom, colored by `pulse.weather` (sunny→amber, clear→green, partly-cloudy→blue, foggy→t3, stormy→coral)
- Large pulse score (3-digit, `fonts.heading`, 64pt, letter-spacing -2)
- Trend pill next to it: `↑ 12% this week` (green), `↓ 4%` (amber), `— steady` (t4)
- One-line Kova-authored summary under score (reuse the current `summaryLine` logic; move it into `insightsEngine`)
- **Sparkline** along the bottom edge of the card: last 14 days of daily brain-score proxy, drawn with `react-native-svg` `Polyline` + a filled `Path` underneath at 20% opacity. If `brainHistoryStore.snapshots` has <14 entries, render whatever exists padded with the oldest. Dot-mark today's point.
- Subtle floating particles anchored to the top-right corner at 0.3 opacity

**Data**: `pulse` from `generateInsights`, `brainHistoryStore.getRecent(14)`, `streak`

### SECTION 2 — WeekStrip
**File**: `v2/WeekStrip.tsx`

Replaces the 7 dots row. Each day is now a mini-card (40×56px) showing:
- Day initial at top (S M T W T F S)
- A vertical bar fill proportional to that day's XP (sessions[] filter by date, sum `totalXP`)
- Thin accent line at bottom if user trained; accent = top-area-trained that day (derive from `session.games[].brainArea` most-frequent). No line if untrained.
- Today: ringed border

Tap a day → scroll to a "day detail" sheet (or just set a local state and reveal a collapsible card below showing that day's games). **For v2, inline reveal is fine.** Keep it simple.

**Data**: `sessions` filtered by `localDateStr(d)` for last 7 days

### SECTION 3 — MomentumCard
**File**: `v2/MomentumCard.tsx`

New. Replaces "This Week vs Last Week". A single derived score called **Momentum** (0-100) with three input factors shown as small sub-bars:
- Consistency (streak / 30, clamp to 1)
- Volume (this-week sessions / 7)
- Growth (max(0, trend / 20))

Composite = weighted avg (0.4 · consistency + 0.3 · volume + 0.3 · growth) × 100

Render:
- Momentum number (big, accent-colored based on band: >75 green, 50-75 amber, <50 coral)
- One-sentence interpretation ("You're in a strong groove", "Building steady", "Starting to drift")
- The three factor bars at 60% width, labeled, with values

Add this derivation to `insightsEngine` as `computeMomentum(ctx): { score, consistency, volume, growth, band, label }`. Don't inline math in the component.

### SECTION 4 — BrainAreaRadar
**File**: `v2/BrainAreaRadar.tsx`

Replaces the 5-bar "Brain Areas" card. A real **radar/pentagon chart** drawn in `react-native-svg`:
- 5 axes (memory, focus, speed, flexibility, creativity) at 72° apart
- 3 background rings at 33/66/100
- Filled polygon from current `brainScores` at 0.25 fill + 1px stroke in `C.green`
- Ghost polygon from 7-day-ago snapshot at 0.15 fill + dashed stroke in `C.t4` (only if snapshot exists and differs)
- Axis labels around the perimeter (11pt, tintable per area)
- Below the chart: two-line summary "**Strongest:** Memory (72) · **Growing fastest:** Focus (+8)"

Animation: polygon points animate from center outward on mount using reanimated sharedValues driving `Polygon points` prop via `useAnimatedProps`.

**Data**: `brainScores`, `brainHistoryStore.getSnapshotFromDaysAgo(7)`

### SECTION 5 — TimeOfDayHeatmap
**File**: `v2/TimeOfDayHeatmap.tsx`

New. 7 rows (day of week) × 4 columns (morning / midday / evening / late). Each cell is a color-intensity square based on count of sessions that day×bucket over the last 30 days, normalized to max cell.

- Empty cell: 1px border, transparent fill
- Light: `${C.green}22`
- Medium: `${C.green}55`
- Heavy: `C.green`

Below: "**You train most on Tuesday mornings.**" — pick the hottest cell and phrase it. If no data → hide this section entirely.

**Data**: `sessions` with `new Date(s.date)` → dayOfWeek + hour buckets (morning 5-11, midday 11-17, evening 17-22, late 22-5)

Add helper `bucketHour(h)` in `timeUtils` or a new `src/utils/sessionAnalytics.ts`.

### SECTION 6 — TopGamesCard
**File**: `v2/TopGamesCard.tsx`

New. Two columns side by side:
- **Left**: "Your best" — top-3 games by `personalBests[gameId].highScore`. Game name + area-tinted bar + score.
- **Right**: "Room to grow" — bottom-3 games by average accuracy across `gameHistory[gameId]` (only include games with >= 3 plays; if fewer qualify, show "Play more to see this").

Tap a game → `router.push({ pathname: '/(tabs)/games', params: { gameId } } as any)`.

**Data**: `gameHistory`, `personalBests`, `gameConfigs` for names

### SECTION 7 — MoodPerformanceCorrelation
**File**: `v2/MoodPerformanceCorrelation.tsx`

New. A small scatterplot-ish visual OR (simpler) 3 columns: Up / Neutral / Down mood days, average session accuracy bar per column. Show only if user has ≥ 5 journal entries with sessions the same day.

- "On **Up** days, you score **+7%** higher than your average."
- Or: "Not enough journal entries yet — log your mood after a session to unlock this."

**Data**: `journalStore.entries` joined with `sessions` by `localDateStr`. Average session accuracy by mood band. Compare to overall avg.

### SECTION 8 — InsightFeed
**File**: `v2/InsightFeed.tsx`

Reuse existing `InsightCard` component. Wraps `generateInsights(...).insights` in a nicer header + "only show top 3 by priority" (add a priority score to engine if missing — otherwise first 3).

Add an "All insights →" action that expands to the full list in-place (local `showAll` state). No modal.

### SECTION 9 — JournalStrip
**File**: `v2/JournalStrip.tsx`

Thin wrapper around existing `JournalTimeline` with a proper section header eyebrow and an "Add entry" pressable that navigates wherever journal entry happens (verify path — likely post-session sheet only; if so, this is display-only: drop the action).

### SECTION 10 — WeeklyReportsList
**File**: `v2/WeeklyReportsList.tsx`

Refactor the existing past-reports loop into its own file. Shows up to 6. Row = week label + one-line highlight (`report.bestMoment` truncated) + chevron. Tap → `router.push({ pathname: '/weekly-report', params: { weekId } })`.

---

## Empty state

If `totalSessions < 3`: hide all sections above; render a single friendly empty card (keep the current empty-state copy but render it in the new aesthetic — tinted accentGlow, Kova icon at 80px, progress bar). **Do not** render `HeroPulse` with zero data — render the empty card instead.

---

## Composer — `app/(tabs)/insights.tsx`

~70 lines. Structure:

```tsx
<SafeAreaView edges={['top']}>
  <FloatingParticles count={12} /> {/* absoluteFill wrapper, pointerEvents="none" */}
  <ErrorBoundary scope="Insights tab">
    <Animated.ScrollView>
      <HeroPulse />
      {hasData ? (
        <>
          <WeekStrip />
          <MomentumCard />
          <BrainAreaRadar />
          <TimeOfDayHeatmap />
          <TopGamesCard />
          <MoodPerformanceCorrelation />
          <InsightFeed />
          <JournalStrip />
          <WeeklyReportsList />
        </>
      ) : (
        <EmptyState totalSessions={totalSessions} />
      )}
    </Animated.ScrollView>
  </ErrorBoundary>
</SafeAreaView>
```

`hasData = totalSessions >= 3`. `contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}`.

---

## Engine changes (do these, don't inline)

Add to `src/utils/insightsEngine.ts` (same module, keep it one file):

1. `computeMomentum(ctx): { score, consistency, volume, growth, band: 'strong'|'building'|'drifting', label: string }`
2. `computeTimeOfDayHeatmap(sessions, now): { cells: number[][], hottest: { dayIdx, bucketIdx, sessions: number } | null }`
3. `computeMoodCorrelation(journalEntries, sessions): { byMood: Record<'up'|'neutral'|'down', { avgAccuracy: number, count: number }>, overallAvg: number, notEnoughData: boolean }`
4. Move `summaryLine` logic (currently inline in `insights.tsx`) onto the returned `pulse` as `pulse.summary`.

Each function pure, unit-test-friendly. No store imports — take data as args.

---

## Phase plan (time-boxed ≈2 hours)

| Phase | Time | Deliverable |
|---|---|---|
| **0** Inventory | 10 min | Agent digest of all store fields + existing helpers. STOP here if anything doesn't match expectations. |
| **1** Engine extensions | 20 min | Add 4 pure functions to `insightsEngine.ts`. Sanity-check outputs with console.log on real data via the running dev server. |
| **2** Hero + Week + Momentum | 30 min | `HeroPulse` (with SVG sparkline), `WeekStrip`, `MomentumCard`. Wire into composer behind `hasData`. |
| **3** Radar + Heatmap + Top games | 35 min | `BrainAreaRadar` (SVG pentagon with animated polygon), `TimeOfDayHeatmap`, `TopGamesCard`. |
| **4** Mood + Feed + Journal + Reports | 20 min | `MoodPerformanceCorrelation`, `InsightFeed`, `JournalStrip`, `WeeklyReportsList`. |
| **5** Composer rewrite + empty state | 10 min | Rewrite `app/(tabs)/insights.tsx` → ~70 lines. Ensure empty state. |
| **6** /simplify pass | 10 min | Run the simplify skill (3 parallel review agents), fix findings. |
| **7** Typecheck + manual pass | 5 min | `npx tsc --noEmit` → 0 errors. Open the tab in the running dev server, scroll end-to-end, verify each section renders with your current data. Check empty state by temporarily setting `hasData = false`. |

If you run long on any phase, cut scope from Section 7 (MoodCorrelation) first, then Section 5 (Heatmap). Those have the weakest data coverage for most users and are the safest drops.

---

## What NOT to do

- **Don't** add a "charts library" dep — hand-draw with `react-native-svg` for sparkline/radar/heatmap. It's a few dozen lines each and keeps the bundle lean.
- **Don't** duplicate the existing `insightsEngine` — extend it.
- **Don't** cast `as any` on Kova props or route paths — verify routes exist first; for Kova, map store emotions to visual emotions.
- **Don't** put `Haptics.xxxAsync()` directly in components — always use `src/utils/haptics.ts`.
- **Don't** invent metrics the data can't back (no "IQ", no "cognitive age", no fake percentiles).
- **Don't** introduce modals or sheets — keep everything inline so the scroll is continuous.
- **Don't** add "premium-gated" insights. This tab is free for everyone.
- **Don't** re-implement existing reusables (`InsightCard`, `JournalTimeline`, `XPProgressBar`, `NeuralMap`, `Kova`, `PressableScale`, `SectionHeader`, `FloatingParticles`).
- **Don't** add comments explaining what well-named code already says. Only add `// Why: ...` for non-obvious constraints.

---

## Success criteria

- `app/(tabs)/insights.tsx` is ≤ 90 lines, pure composition
- 10 section files under `src/components/insights/v2/` (+ 1 shared `EmptyState.tsx` if you split it out)
- 4 new pure functions in `insightsEngine.ts`
- 0 TypeScript errors
- 0 direct `expo-haptics` imports in new components (all via `utils/haptics.ts`)
- 0 `as any` casts on routes or Kova props
- Every section renders gracefully when its data is empty — no crashes, no undefined text, just a sensible fallback or the section is hidden
- Tab opens and scrolls smoothly with no Reanimated warnings in the log
- Visual test: sparkline animates in, pentagon animates from center, momentum bars fill sequentially

---

## Prompt to paste into a fresh session

> Build Insights tab v2 per `INSIGHTS_V2_SPEC.md` at the repo root. Follow the phases in order. Start with Phase 0 (dispatch one Explore agent, "very thorough"). STOP and ask if anything in the inventory doesn't match the spec — do not guess.

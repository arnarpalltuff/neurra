# Home editorial cut — implementation plan
**Date:** 2026-04-16
**Scope:** `app/(tabs)/index.tsx` + `src/components/home/`
**Before:** 17 scroll sections / 1428 lines

## Final render order (approved)

Fixed ambient rails (always):
- CoinPill (top-left)
- HeartsPill (top-right)
- Background gradient + FloatingParticles + brain-weather tint
- Triggered overlays: `CelebrationOverlay` (now including new-game), `StreakBreakOverlay`, `KovaEvolutionAnimation`, `RewardChest`, `PaywallFull`, `Celebration` (particles_hearts)

Scroll sections (render order):
1. **Greeting + Streak row** — KEEP-PRIMARY
2. **Kova zone** — KEEP-PRIMARY (speech bubble now carries both greeting + insight text, merged)
3. **Urgency banner** — KEEP-SECONDARY (conditional: `isUrgent && streak > 0`)
4. **MoodCheckIn** — KEEP-SECONDARY (conditional: `!moodLoggedToday && !moodDismissed`)
5. **DailyChallengeList** — KEEP-PRIMARY (now renders a Real-Life slot as a 4th "bonus-real" card)
6. **Session card** — KEEP-HERO
7. **Quick Hit card** — KEEP-SECONDARY (conditional: `totalSessions > 0`)
8. **QuickPlayGrid** — KEEP-SECONDARY
9. **BrainFactCard** — KEEP-SECONDARY
10. **PaywallNudge** — KEEP-SECONDARY (conditional: `!isPro && !nudgeDismissed && canShowNudge(totalSessions)`)

## File structure

### New files (`src/components/home/`)
- `HomeGreeting.tsx` — greeting + streak row, reads weatherReport + name/streak
- `HomeKova.tsx` — Kova zone; owns AI dialogue effects (moved in from composer), merges insight-mode text into the speech bubble rather than a separate card
- `HomeSession.tsx` — session card with length pills, CTA, done state. Moved from composer, uses existing Kova/weather data via props where useful
- `HomeQuickHit.tsx` — Quick Hit card (extracted)
- `HomeUrgencyBanner.tsx` — urgency card (extracted)
- `HomeBrainFact.tsx` — tiny wrapper for BrainFactCard to apply uniform wrapping
- `HomeAmbientRails.tsx` — coin + hearts pills + brain-weather tint + background particles, encapsulated
- `HomePaywallNudge.tsx` — thin wrapper that holds `showPaywall` state + nudge render
- `homeStagger.ts` — shared hook/helper for entrance animation (index × 70ms bezier)

### Modified files
- `src/components/challenges/DailyChallengeList.tsx` — add a real-life slot:
  - Pull `pickChallenge(seed)` from `src/constants/challenges`
  - Render one `RealLifeSlotCard` after the 3 daily + bonus challenges, with a distinct visual treatment (peach accent, "REAL LIFE" eyebrow, "Accept" CTA)
  - On Accept → `onPlayChallenge(realLifeId, 'real-life')` — composer routes to the existing real-life flow (reuse `/focus-practice` route with an `?realLife=1` param, OR keep in-home as before — verify in Phase 2 when executing)
- `src/components/challenges/DailyChallengeCard.tsx` — no change (real-life gets its own card component, not a config variant; keeps concerns clean)
- `src/components/challenges/RealLifeSlotCard.tsx` — NEW: the compact slot that replaces the standalone `RealLifeChallengeCard` on home, styled to fit inside DailyChallengeList
- `app/(tabs)/index.tsx` — rewrite as a thin ≤120-line composer

### Deleted files
- `src/components/home/RealLifeChallengeCard.tsx` — behavior moves to `RealLifeSlotCard` under challenges/; the home-level component is deleted
- `src/components/home/StatsSnapshot.tsx` — fully replaced by Profile/Insights surfaces; deleted (no other consumers per grep in Phase 2)

### Kept as-is (used by composer)
- `src/components/home/QuickPlayGrid.tsx`
- `src/components/home/SectionHeader.tsx`
- `src/components/ui/MoodCheckIn.tsx`
- `src/components/ui/BrainFactCard.tsx`
- `src/components/paywall/PaywallNudge.tsx`

## Migration notes

### MERGE 8 — Kova's Insight → Kova speech bubble
Current home has TWO Kova voice surfaces: the `<KovaSpeechBubble>` bound to `kovaDialogue` (greeting), and a separate `insightCard` bound to `kovaInsight`. Both strings come from `generateKovaMessage` with different modes (`'greeting'` vs `'insight'`).

**Merge:** keep one state — `kovaDialogue` — and rotate what mode it was generated from. On mount, generate both greeting and insight; display greeting first for ~5s, then auto-swap to insight. No separate card renders. Insight effect dep array gains a completion guard so the swap only fires once the greeting bubble has had its time on screen.

Alternative (simpler): show greeting on mount as today; tap Kova to cycle to insight (the existing `idle_tap` handler already re-generates on tap — just add 'insight' to the rotation pool when `totalSessions >= 3`).

Picking the simpler alt: tap Kova → insight next, greeting again on re-tap. Zero new scroll surface.

### MERGE 10 — RealLifeChallengeCard → DailyChallengeList
- `RealLifeChallengeCard` current render: `<Animated.View>` with icon, title, realWorldFraming, difficulty dots, difficulty label, area label, Accept/Skip buttons
- `RealLifeSlotCard` target: compact version (~70% vertical height), peach-accented ("REAL LIFE" eyebrow), tap → `onPlayChallenge(challenge.id, 'real-life')` which the composer routes appropriately
- The `dismissed` local state moves from the card into `dailyChallengeStore` if we need per-day dismissal (or stays local for v1 and we evaluate)

### DEMOTE 13 — GameUnlockBanner → CelebrationOverlay
`CelebrationOverlay` currently supports `CelebrationKind = 'levelUp' | 'streakMilestone' | 'leaguePromotion'`. Add a 4th kind: `'gameUnlock'` with config pointing at the unlocked game's accent + icon. On home mount, after existing `evaluateKovaOnOpen()` effect, check `unlocksOnDay(daysSinceJoin()) && !celebratedDays.includes(day)` — if true, enqueue a celebration with `kind: 'gameUnlock', value: firstUnlockedGameId`. On dismiss, `markCelebrated(day)` as before. The old `<GameUnlockBanner>` component stays on disk for now (it's still the tap-in flow if user missed the celebration), but is no longer rendered by home. Alternative: delete entirely. Defer the deletion to Phase 2 based on whether `GameUnlockBanner` has other consumers (grep confirms no other consumers → delete).

### CUTS (delete, no migration)
- **14 XP progress bar** — delete render + `xpProgress` memo; level shown only on Profile
- **15 Compact stats row** — delete render + inline style block
- **16 StatsSnapshot** — delete render + delete `src/components/home/StatsSnapshot.tsx` file (no other consumers)
- **19 Daily Quote card** — delete render + inline style block; `getDailyQuote` util stays (might be used elsewhere)
- **2 AmbientNeuralMap** — delete local component + style block

### Preserved store writes (do not break)
- `useKovaStore.evaluateOnOpen()` — still called on mount
- `useEnergyStore.refillIfNewDay(isPro)` — still called on mount
- `useGroveStore.recalcAreaStreaks()` — still called on mount
- `useBrainHistoryStore.recordSnapshot(brainScores)` — still called on mount
- `useProStore.recordNudge()` — called from PaywallNudge's handlers (preserved)
- `setMood`, `setSessionLength` — preserved through relocated components

### Ambient rails (extracted but unchanged behaviorally)
- Coin float (`+N` animation on increase) moves into `HomeAmbientRails.tsx` but same useRef + setTimeout pattern
- `pendingFreezeMsg` Alert flow — moves into composer OR into `HomeAmbientRails.tsx` — putting in composer since it's a one-shot side effect tied to the screen

## Entrance stagger

Every direct child of the `<ScrollView>` in the composer accepts an `index: number` prop. Inside each section:

```tsx
const opacity = useSharedValue(0);
const ty = useSharedValue(24);

useEffect(() => {
  const delay = index * 70;
  opacity.value = withDelay(delay, withTiming(1, {
    duration: 500,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  }));
  ty.value = withDelay(delay, withTiming(0, {
    duration: 500,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  }));
}, []);
```

Centralized in `src/components/home/homeStagger.ts` as `useStaggeredEntrance(index)` returning an `Animated.AnimatedStyleProp`. Each section spreads it on its root `<Animated.View>`.

## Spacing rhythm

Gaps between sections (applied as `marginTop` on each section, NOT uniform `gap` in the parent):
- Greeting → Kova: 12 (tight — same identity cluster)
- Kova → Urgency (if shown): 20
- Kova/Urgency → Mood (if shown): 16
- Mood → DailyChallenges: 28 (distinct zone)
- DailyChallenges → Session: 20 (related — both actions)
- Session → Quick Hit (if shown): 14 (tight — both entry points)
- Quick Hit/Session → QuickPlayGrid: 28 (distinct)
- QuickPlayGrid → BrainFact: 24
- BrainFact → PaywallNudge (if shown): 40 (major break, below-fold filler)

## Line budget

- Composer `app/(tabs)/index.tsx`: ≤120 lines (target ~100)
- New sub-components: 40–120 lines each
- Total lines after: ~260 (1428 → 260 = 82% reduction)

## Phase 2 execution order (next)

1. Add `'gameUnlock'` to `CelebrationKind` + config
2. Create `RealLifeSlotCard` + wire into `DailyChallengeList`
3. Delete `components/home/RealLifeChallengeCard.tsx` + `components/home/StatsSnapshot.tsx`
4. Delete `components/games/GameUnlockBanner.tsx` if no other consumers (grep)
5. Remove cut sections from `app/(tabs)/index.tsx` (14, 15, 16, 19, 2)
6. Merge Kova Insight into speech bubble (remove insight card + related state)
7. Typecheck clean, render test, commit.

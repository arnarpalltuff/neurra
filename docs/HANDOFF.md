# Neurra — session handoff

## 2026-04-18 — Dead-code purge (shipped)

**Status:** Complete. All 5 steps executed end-to-end. Single commit on `main`.

### Net lines removed: ~1,048

| Step | Files touched | Lines |
|---|---|---|
| 1 — i18n skeleton | src/i18n/* deleted, settingsStore + MoodCheckIn edited | ~472 |
| 2 — Leagues route + tab | app/(tabs)/leagues.tsx deleted, _layout + settingsStore edited | ~246 |
| 3 — 5 always-false badges (25 → 20) | badges.ts + achievementStore migrate | ~33 |
| 4 — Grove themes (9 → 3) | groveStore + constants/groveThemes + GroveIsland fallback | ~47 |
| 5 — Cosmetics | cosmeticsStore.ts deleted, KovaHero + shop.tsx + root layout edited | ~250 |

### Shipped migrations

- `neurra-settings` v1 — force `language='en'`, drop `leaguesEnabled`
- `neurra-achievement-store` v1 — filter `unlocked[]` to valid BADGES ids
- `neurra-grove` v2 → v3 — reset stale `activeTheme` to `floating-isle`, filter `unlockedThemes`
- `neurra-cosmetics` — purged via one-shot `AsyncStorage.removeItem` in root layout

### Kept themes (3)

`floating-isle` (free) · `cloud-kingdom` (500) · `cosmic-void` (1000)

### Out-of-scope flag (not touched)

`src/constants/appStore.ts:21` still mentions "leagues" in App Store marketing bullet. Fix when finalizing store listing, not now.

### Verification at commit time

- `npx tsc --noEmit` → 0 errors
- `grep` for cosmeticsStore / i18n / leagues → 0 hits outside intended locations
- All 4 migrations defensive against malformed persisted state

### Device test pending

Not yet run on device. Next session should:
1. Launch app, confirm all 5 tabs render (no leagues in tab bar)
2. Open Shop, confirm 3 tabs (themes/decor/items) and default is themes
3. Open Profile, confirm Kova renders without cosmetic label
4. Open Grove, confirm theme loads (defaults to floating-isle if previously on a cut theme)
5. Complete a session, confirm badges still fire

---

## 2026-04-16 — Games tab premium upgrade (shipped)

**Status:** Complete. 6 phases committed.

### Result

- Composer lines: **649 → 106** (84% reduction)
- Custom SVG icons: **11 of 11** (zero emoji on the tab)
- `expo-haptics` direct imports: 0
- `as any` casts: 0
- TypeScript errors: 0

### What shipped

- **GameCard** — accent gradient bg, tinted shadow, SVG icon, brain-area eyebrow, level dots, locked state with Ionicons glyph
- **GameOfTheDayHero** — 200px hero with BreathingHalo (3.2s breathing glow), "Play Now" CTA, strongest shadow
- **BrainAreaFilterBar** — horizontal pills, PressableScale 0.94, selection() haptic, accent glow on selected
- **FeaturedGamesRow** — "Train your [weakest area]" horizontal snap, Kova-voiced empty state
- **GameBentoGrid** — asymmetric full/pair row rhythm, centered fallback for ≤2 games, gameUnlockStore wired
- **11 custom SVG icons** — each ≤3 stroked elements, crisp at 72px (Pulse, Ghost Kitchen, Word Weave, Signal & Noise, Mirrors, Mind Drift, Face Place, Chain Reaction, Rewind, Split Focus, Zen Flow)
- **weakestArea util** — pure fn matching insightsEngine calcBrainPulse logic
- **Bug fix:** gameUnlockStore.isUnlocked() now wired into game cards (Day 0 accounts correctly see locked cards)

### Commits
```
4142aa7 games: phase 0 inventory and upgrade plan
        games: phase 1 foundations
        games: phase 2 card pattern (word weave)
        games: phase 3 all 11 game cards
fb9f8c7 games: phase 4 hero, filters, featured row
39d7261 games: phase 5 bento grid and polish
```

---

## 2026-04-16 — Home tab editorial cut (shipped)

**Status:** Complete. 5 phases committed.

### Counts

- Scroll sections: **17 → 10** (7 always-shown + 3 conditional)
- Composer lines (`app/(tabs)/index.tsx`): **1428 → 130** (91% reduction)
- Total home surface (composer + 9 sub-components): ~1320 lines in 10 files vs 1428 in 1 file — structural clarity replaces the monolith

### What got cut

- **AmbientNeuralMap** (decorative; duplicated Profile BrainFingerprint)
- **XP progress bar** (duplicated Profile KovaHero)
- **Compact stats row** (duplicated Profile JourneyStats)
- **StatsSnapshot** horizontal stats (duplicated Profile + Insights WeekStrip) — file deleted
- **Daily Quote card** (second flavor card, redundant with BrainFact)

### What got demoted

- **GameUnlockBanner** → new `'gameUnlock'` kind of `CelebrationOverlay` on unlock day; old component file deleted. Feels like a win, not a persistent banner.

### What got merged

- **Kova's Insight card** → rolled into the Kova speech bubble; tap Kova to cycle between greeting and insight. Same feature, one less scroll surface.
- **RealLifeChallengeCard** → `RealLifeSlotCard` under `components/challenges/`, rendered inside `DailyChallengeList`. The real-life differentiator is preserved but stops competing for its own scroll slot.

### What got kept

- **KEEP-HERO:** Session card (`HomeSession`)
- **KEEP-PRIMARY:** Greeting + Streak row (`HomeGreeting`), Kova zone (`HomeKova`), DailyChallengeList (with real-life slot)
- **KEEP-SECONDARY:** Urgency banner (conditional), MoodCheckIn (conditional), Quick Hit card (conditional), QuickPlayGrid, BrainFactCard, PaywallNudge (conditional), Coin + Hearts ambient rails

### Files

**Created in `src/components/home/`:**
- `homeStagger.ts` — shared entrance hook (bezier 0.16, 1, 0.3, 1, 70ms stagger)
- `useHomeWeather.ts` — brain-weather memo
- `HomeGreeting.tsx` — greeting + streak row
- `HomeKova.tsx` — Kova + speech bubble + AI dialogue tap-cycle
- `HomeUrgencyBanner.tsx` — conditional streak urgency
- `HomeSession.tsx` — full session card (pitch, slogans, length pills, CTA)
- `HomeQuickHit.tsx` — conditional Quick Hit card
- `HomeAmbientRails.tsx` — coin pill + hearts pill + bg + particles + coin float
- `HomeOverlays.tsx` — celebrations + streak break + evolution + paywall + freeze-msg alert

**Created elsewhere:**
- `src/components/challenges/RealLifeSlotCard.tsx` — new compact slot, rendered by `DailyChallengeList`
- `src/utils/navigate.ts` — typed wrapper around `router.push` to kill `as any` casts on home

**Modified:**
- `app/(tabs)/index.tsx` — rewritten as thin composer (130 lines)
- `src/components/challenges/DailyChallengeList.tsx` — renders the new real-life slot
- `src/components/ui/CelebrationOverlay.tsx` — adds `'gameUnlock'` kind
- `src/components/home/QuickPlayGrid.tsx` — routes haptics through `utils/haptics`, replaces `as any` with `navigate()`

**Deleted:**
- `src/components/home/RealLifeChallengeCard.tsx` (replaced by RealLifeSlotCard)
- `src/components/home/StatsSnapshot.tsx` (duplicated Profile + Insights)
- `src/components/games/GameUnlockBanner.tsx` (replaced by CelebrationOverlay gameUnlock kind)

### Verification

- `npx tsc --noEmit` → 0 errors
- `grep "from 'expo-haptics'" src/components/home app/(tabs)/index.tsx` → 0 results
- `grep "as any" src/components/home app/(tabs)/index.tsx` → 0 results
- No entries added to `package.json`
- All store writes preserved (hearts refill, area streaks recalc, Kova evaluateOnOpen, brain snapshot, level-up celebration, game-unlock celebration, coin-float, freeze-msg Alert, paywall nudge record, mood set, session length set, play challenge nav)
- All overlays still fire (CelebrationOverlay, StreakBreakOverlay, KovaEvolutionAnimation, RewardChest, PaywallFull, Celebration particles-hearts)

### Commits

```
44f233d home: phase 0 inventory and cut tags
f1866c6 home: phase 1 architecture plan
9ab24b2 home: phase 2 cuts and demotions
b4a81ed home: phase 3 thin composer rebuild
4fd0b4a home: phase 4 visual polish pass
```

### Known issues / follow-ups

- `RewardChest` is rendered with `visible={false}` at the composer level (legacy scaffolding) — no harm, but could be removed if chest is never opened from home. Track for a future pass.
- `as any` casts still exist elsewhere in the codebase on `router.push`; home is clean but profile/insights/grove have remaining casts. Future targeted pass to adopt `navigate()` project-wide.
- Four empty sound dirs (`assets/sounds/{gameplay,kova,rewards,ui}`) — still pending 17 MP3s per earlier memory note.

### Next task

Manual device test:
1. Open app on iPhone via Expo Go
2. Scroll home top to bottom — 60fps?
3. Tap Kova → hearts burst + speech bubble cycles
4. Tap session CTA → routes to `/session?length=...`
5. Complete a daily challenge → progress persists
6. Accept real-life slot → dismisses; skip → dismisses
7. Cross-tab check: Profile still shows XP bar + compact stats, Insights still shows WeekStrip + BrainFingerprint

If any of the above fails, the phase 2/3 cut/demote/merge didn't preserve the relevant store wiring and needs a targeted fix.

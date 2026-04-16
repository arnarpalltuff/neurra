# Neurra — session handoff

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

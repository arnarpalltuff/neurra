# Neurra — session handoff

## 2026-04-16 — Home tab editorial cut (in progress)

**Status:** Phase 0 complete, approved. Phases 1–5 in flight.

### Approved cut table

| # | Section | Before lines | Tag | Notes |
|---|---|---|---|---|
| 1 | Coin pill (top-left ambient) | 403–417 | KEEP-SECONDARY | Persistent rail |
| 2 | AmbientNeuralMap | 106–124, 418 | **CUT** | Decoration, duplicates Profile BrainFingerprint |
| 3 | Hearts pill (top-right ambient) | 421–434 | KEEP-SECONDARY | Persistent rail |
| 4 | Greeting + Streak row | 456–474 | **KEEP-PRIMARY** | Emotional tone, one glance |
| 5 | Kova zone + speech bubble | 477–519 | **KEEP-PRIMARY** | App identity |
| 6 | Urgency banner (conditional) | 522–528 | KEEP-SECONDARY | High-signal when shown |
| 7 | MoodCheckIn (conditional) | 531–536 | KEEP-SECONDARY | Feeds Insights mood correlation |
| 8 | Kova's Insight card | 539–546 | **MERGE → Kova speech bubble** | Dialogue system already handles insight mode |
| 9 | DailyChallengeList | 549–551 | **KEEP-PRIMARY** | Now carries a real-life slot |
| 10 | RealLifeChallengeCard | 554 | **MERGE → DailyChallengeList** | Added as a slot type — feature preserved |
| 11 | Session card (hero) | 557–661 | **KEEP-HERO** | The single primary action |
| 12 | Quick Hit card (conditional) | 664–682 | KEEP-SECONDARY | Distinct mode |
| 13 | GameUnlockBanner (conditional) | 685–687 | **DEMOTE → CelebrationOverlay on unlock day** | Feels like a win, not a banner |
| 14 | XP progress bar | 691–704 | **CUT** | Duplicates Profile KovaHero's bar |
| 15 | Compact stats row | 708–728 | **CUT** | Duplicates Profile JourneyStats |
| 16 | StatsSnapshot (horizontal) | 731 | **CUT** | Duplicates Profile + Insights WeekStrip |
| 17 | QuickPlayGrid | 734 | KEEP-SECONDARY | Shortcut to Games tab — distinct from BrainFingerprint |
| 18 | BrainFactCard | 741 | KEEP-SECONDARY | Chosen flavor card |
| 19 | Daily Quote card | 745–755 | **CUT** | Second flavor card, redundant |
| 20 | PaywallNudge (conditional) | 758–769 | KEEP-SECONDARY | Kept per revenue concern; conditional + dismissable |

### Counts

- Scroll sections before: 17
- Scroll sections after: 10 (7 always-shown + 3 conditional)
- Lines before: 1428
- Lines after estimate: ~260

### What got cut

Three stat surfaces (XP bar, compact stats row, StatsSnapshot) are now owned by Profile v2 and Insights v2 — home drops them rather than duplicating. Two flavor cards (Brain Fact + Daily Quote) did the same job; Quote cut, Fact stays. AmbientNeuralMap was decoration without function. Kova's Insight card merges into the existing Kova speech bubble. Daily Quote + standalone Real-Life card went away but Real-Life feature is preserved inside DailyChallengeList as a slot. GameUnlockBanner becomes a celebration overlay instead of a persistent banner.

### Next

Phases 1–5 running autonomously. Commit per phase.

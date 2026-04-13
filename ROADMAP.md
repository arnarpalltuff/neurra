# Neurra Roadmap

**Last updated:** 2026-04-08
**Status:** Pre-alpha. Architecturally rich, visually unfinished, not ready for TestFlight.
**Author note:** This document is intentionally blunt. You asked for brutal honesty. Treat every harsh sentence as a friend telling you the truth, not as a verdict on your work.

---

## Part 1 — Where the app actually is, right now

This is an *honest* assessment of every screen and system. Not the marketing version.

### The good news first

You have built something more architecturally ambitious than 90% of brain training apps on the App Store. Specifically:

- **11 working games**, each with its own difficulty engine, brain area mapping, and real-world framing text
- **A character (Kova) with personality, dialogue, evolution stages, and emotional reactions** — most apps don't have a character at all
- **A grove system with growth zones, themes, decorations, visitors, and time-of-day skies** — a full second screen of content beyond the games
- **A real coin economy with ledgers, shop, decorations, themes, streak freezes**
- **A story mode with 30+ days of pre/post-session beats**
- **A daily brain fact rotation, AI coach briefings, weekly reports, achievement badges (25), pro plans (4 tiers), notification scheduling, mood tracking, journaling**
- **Phase 1 additions:** brain weather, energy hearts, area streaks, adaptive session length, quick hits

That is genuinely a lot. **The architecture is not the problem.** Don't throw it away.

### The bad news

The app is **half-finished in many places**, and the half-finished places are dragging down the polished places. A user opening it today doesn't see the architectural depth — they see the visual polish, and the visual polish is inconsistent.

### Screen-by-screen state

**Legend:** ✅ ships as-is | 🟡 needs polish | 🔴 needs rework | ❌ broken or missing

---

#### Onboarding
- **State:** 🟡 6 screens, all functional, fonts load correctly
- **What works:** Awakening intro, name input, notification permission ask, mini Pulse demo
- **What's weak:** First impression doesn't match the depth of the app behind it. The "wow" moment is missing — you have a Kova that grows over 100 days, but onboarding doesn't sell that
- **Verdict:** Acceptable for v1 but mediocre. Polish in Sprint 4.

---

#### Home tab (`app/(tabs)/index.tsx`)
- **State:** 🟡 1132 lines, the most-touched file in the app
- **What works:** Greeting, streak, Kova render, session card, mood check-in, weekly challenge card, brain fact, focus timer link, coach insight, brain pulse, paywall nudge, story badge, weekly report banner
- **Phase 1 additions that work:** Brain weather (replaces static greeting), energy hearts, length pills, Quick Hit card
- **What's weak:** This screen now has ~17 distinct sections. It's *crowded*. A new user opening it for the first time will be overwhelmed by everything competing for attention. Sections are also visually undifferentiated — they all look like cards on a dark background with no hierarchy
- **Bugs found and fixed today:** SafeAreaView was using deprecated RN built-in (notch issue), hearts/coins absolute positioning didn't account for notch insets
- **Verdict:** Functional but needs an editorial pass. **Cut things, don't add things.**

---

#### Games tab (`app/(tabs)/games.tsx`)
- **State:** 🟡 Functional list browser
- **What works:** Game-of-the-day card, filter chips by brain area, all 11 games as cards with icons and colors
- **What's weak:** Cards are visually generic. No preview of what the game looks like. No personality.
- **Verdict:** Polish in Sprint 2. Not blocking ship.

---

#### Grove tab (`app/(tabs)/grove.tsx`)
- **State:** 🔴 → 🟡 (was broken until today)
- **What I fixed today:** The grove was rendering the wrong scene component. The codebase has TWO grove renderers — `GroveScene` (plain dot/circle placeholders, ~200 lines) and `GroveIsland` (a full polished island with organic terrain, time-of-day sky, 5 detailed SVG zones via `GrowthZone.tsx`, animal visitors, particle effects, ~300 lines). The grove tab was set up to show **GroveIsland only when the user is in edit mode** — which means the default view showed the ugly placeholders and the polished art was hidden behind a screen most users never enter. This is exactly the kind of half-finished migration that explains why the app feels uneven. **I swapped it so GroveIsland is now the default.**
- **What still needs work:** The polished art shines at high growth stages but is sparse at growth=0 (a brand new user sees almost nothing). The empty state needs love.
- **Verdict:** With today's fix, the grove is now visually competitive. Empty state polish in Sprint 2.

---

#### Insights tab (`app/(tabs)/insights.tsx`)
- **State:** 🔴 You reported it crashes when you tap the lightbulb icon
- **What's there:** Brain Pulse score with animated SVG ring, brain area bars, weekly comparison, insight cards, journal timeline, past reports
- **What I did today:** I could not reproduce or identify the specific crash from code reading alone. Instead I (a) wrapped the screen in its own ErrorBoundary so it can't take down the whole app and (b) made the ErrorBoundary actually display the error message and stack trace when something crashes. **Next time you tap the lightbulb, the red screen will show you the actual error.** Send me the first line of that and I'll fix it.
- **Verdict:** Likely 1-line fix once we see the error. Blocking ship until fixed.

---

#### Profile tab (`app/(tabs)/profile.tsx`)
- **State:** 🟡 Functional but underwhelming
- **What works:** Kova render, level + stage name, stats grid (XP/sessions/best streak/coins), brain map with 5 colored bars, mood history, badge grid, links to settings/insights/shop/science
- **What's weak:** This is supposed to be the "personal" page but it reads like a stats dump. The user explicitly said this needs to be more personal. Right now it shows numbers, not identity.
- **Phase 1 added:** Per-area training streak flame indicator (only visible when streak ≥ 3 days)
- **Verdict:** Needs a content rethink, not a code rethink. See "What to keep" / "What to cut" sections below.

---

#### Leagues tab (`app/(tabs)/leagues.tsx`)
- **State:** 🔴 Hidden from tab bar (`href: null`)
- **What's there:** 6 tiers (Ember → Zenith), weekly XP tracking, leaderboard with **mocked players** (no backend)
- **What's weak:** It's all simulated. There's no real social system. The user has never shipped a backend.
- **Verdict:** **Ship without it for v1.** Add it post-launch when you have real users to populate it. Hiding it from the tab bar is the right call.

---

#### Settings (`app/settings.tsx`)
- **State:** 🟡 ~15KB file, lots of options
- **What works:** Sound, haptics, notifications, daily reminder time, language selector (4 languages — see i18n below), age group, dev mode toggle, sign-out
- **What's weak:** Sprawling. Not all settings actually do anything (some are wired, some aren't)
- **Bug found today:** `settingsStore` had a dead `sessionLength: 3 | 5` field with no readers anywhere — collided with my F6 field in `userStore`. Already removed.
- **Verdict:** Audit in Sprint 3. Cut anything that doesn't do something.

---

#### Session flow (`app/session.tsx`)
- **State:** 🟢 Mostly works
- **What works:** Game selection → 2/3/5 game session → results → XP/coins/streak update → optional challenge → return home. Story beats integrated. Energy heart consumption integrated. Adaptive length integrated.
- **What's weak:** No transition polish. Games feel back-to-back-to-back. The "3 games in 5 minutes" promise is met but the experience doesn't feel like a journey.
- **Verdict:** Mostly fine. Light polish in Sprint 2.

---

#### Quick Hit flow (`app/quick-hit.tsx`)
- **State:** 🟢 New in Phase 1, works
- **Verdict:** Untested on device. Sprint 1 acceptance test.

---

#### The 11 games

| Game | Brain Area | State | Notes |
|---|---|---|---|
| Pulse | Focus | 🟡 | Go/no-go, works, visually plain |
| Ghost Kitchen | Memory | 🟡 | Order recall, works, emoji-driven |
| Word Weave | Creativity | 🟡 | 12-letter word search, 5000-word dictionary |
| Face Place | Memory | 🟡 | Face/name matching |
| Signal & Noise | Focus | 🟡 | Spot-the-difference |
| Chain Reaction | Speed | 🟡 | Color sequence tapping |
| Mind Drift | Memory | 🟡 | Path tracing |
| Rewind | Memory | 🟡 | Scene detail recall |
| Mirrors | Flexibility | 🟡 | Rule switching |
| Zen Flow | Focus | 🟡 | Meditative breathing |
| Split Focus | Flexibility | 🟡 | Dual-task |

**State of all 11:** functionally complete. Visually they all look like "an indie React Native game from 2022." Backgrounds are dark gradients, UI is minimal, animations are basic. The user said "the games look plain with no colors or effects" and they are right.

**You cannot fix this with Claude Code alone.** Visual polish for games requires design work. See Sprint 6.

---

### Stores (state management)

15 Zustand stores, all persisted to AsyncStorage. Most are clean. A few have issues:

- **`progressStore`** ✅ — XP, level, streak, brain scores, sessions, coins. Solid.
- **`userStore`** ✅ — name, mood, ageGroup. Solid.
- **`groveStore`** 🟡 — Now needs a v2 persist migration (added today) for `streakCount` and `activeSpecialists`. Working.
- **`energyStore`** ✅ — New in Phase 1. Clean.
- **`brainHistoryStore`** ✅ — New in Phase 1. Clean.
- **`settingsStore`** 🟡 — Had dead `sessionLength` field, removed today. Otherwise OK.
- **`storyStore`** 🟡 — Works but story mode is half-tested in practice.
- **`achievementStore`** 🟡 — 25 badges defined, evaluation logic exists, celebration UI exists. Some predicates return false until tracking fields are added.
- **`weeklyChallengeStore`** 🟡 — Challenge rotation works. Visuals are placeholder.
- **`botChallengeStore`** 🟡 — Async bot opponent feature. Adds complexity, no clear value. Strong cut candidate.
- **`weeklyReportStore`** 🟡 — Generates weekly reports, has UI. Untested in practice.
- **`personalityStore`** 🟡 — Recalculates Kova's personality from training pattern weekly. Cool idea, never user-tested.
- **`gameUnlockStore`** ✅ — Progressive unlock by day. Solid.
- **`coinStore`** ✅ — Ledger of coin transactions. Solid.
- **`proStore`** 🟡 — RevenueCat integration scaffolded. Untested with real purchases.
- **`cosmeticsStore`** 🔴 — Exists. **Has no UI.** Dead code.
- **`journalStore`** 🟡 — Brain journal entries. Wired. Works.
- **`snapshotStore`** 🟡 — Daily brain snapshot overlay. Wired.
- **`factStore`** ✅ — Daily brain fact rotation. Simple, works.

---

### Things that are completely missing

- **Real backend** for leagues, friends, sharing
- **Real AI coach** — currently calls an external API but has fallback to static. Probably not actually connected.
- **Real RevenueCat sandbox testing** — code is in place, has never been tested with a real purchase flow
- **Real notifications** — code requests permission, schedules a daily reminder. Untested in practice.
- **Marketing assets** — App Store screenshots, app icon, preview video, listing copy
- **Privacy policy + terms** — there are placeholder screens, content quality unknown
- **Onboarding "wow" moment** — sells the daily session but not the long arc
- **Empty states** — most screens look bad with no data. New user sees a sparse app.
- **Transition between games** — feels mechanical
- **i18n** — 4 languages defined but most strings hardcoded in English

---

## Part 2 — What I'm capable of vs what needs a designer or external tool

This is the most important section in this document. Be honest about it.

### What Claude Code (me) can do

- **Bug fixing.** I can find and fix React Native crashes, store mutations, persist migrations, race conditions, type errors.
- **Refactoring.** I can clean up duplication, restructure stores, extract components.
- **State management.** Adding new Zustand stores, persist migrations, derived selectors.
- **Logic features.** Anything that's "compute X from Y and show Z." Brain weather, area streaks, energy hearts — these are all logic features and I can ship them in hours.
- **SVG art using primitives.** Circles, paths, gradients, simple shapes. The grove zones in `GrowthZone.tsx` are at the upper end of what I should attempt — they look good because someone hand-tuned the paths.
- **Layout.** Flexbox, spacing, typography, basic visual structure.
- **Wiring existing assets.** If you give me an icon set, I'll wire it correctly.
- **Writing copy.** Microcopy, error messages, button labels, dialogue. Limited but capable.

### What Claude Code CANNOT do (or shouldn't try)

- **Illustrate things.** I cannot draw a "beautiful Chinese city." I cannot draw a castle. I cannot draw a stylized character. SVG primitives top out around what `GrowthZone.tsx` already does. Anything beyond that needs a real illustrator or AI image generation.
- **Design a visual identity.** I can match an existing one, but I can't invent one that "feels premium" because that's a designer's judgment call.
- **Generate sound or music.** Need an external composer or library.
- **Design game mechanics from scratch.** I can copy known patterns. New original game ideas need a designer playtesting cycles.
- **Write App Store copy that converts.** I can write it. A copywriter does it 5x better.
- **Design app icons.** No.
- **Replace human playtesting.** Bugs that only appear with real fingers on a real screen — I can't catch those without you.

### What you need an external tool or human for

| Need | Tool / person | Cost / time |
|---|---|---|
| New character art (Kova variants, evolution stages) | Midjourney / DALL-E / illustrator | $20–100 / 1–2 weeks |
| Game backgrounds and effects | Designer + Lottie animator | $500–2000 / 2–3 weeks |
| App icon | Icon designer | $200–500 / 3 days |
| Marketing screenshots (5–10 for App Store) | Designer + screen capture | $300–800 / 1 week |
| App Store preview video | Video editor | $400–1500 / 1 week |
| Translations | Pro translator or DeepL | $100–500 per language |
| Sound effects + music | Sound designer or stock library | $50–500 |
| Privacy policy + terms | Lawyer template (Termly/Iubenda) | $30–200 / day |
| Beta testers | Friends, family, Reddit r/TestFlight | Free / 2 weeks |
| Real user testing | UserTesting.com or in-person | $200–500 / 1 week |

**Total realistic budget for things-Claude-cannot-do: $1,500–6,000 USD.**

**You can ship the app for less if you cut features and use AI image generation for everything.** That brings it closer to $200–500 in tooling costs, but quality drops.

---

## Part 3 — What to CUT

Brutally. These features are dragging the app down because they're half-built or unnecessary for v1. Cut means delete the code, hide the UI, or scope down to nothing for the v1 ship.

### Hard cuts (delete or hide)

1. **Leagues backend.** Mocked players, no real social system. Hide the tab (already done with `href: null`). Reintroduce post-launch when you have real users.
2. **Cosmetics store.** No UI. Pure dead code. Delete the store file or leave it stubbed.
3. **Bot challenges.** Async bot opponent every 2-3 days. Adds complexity, no clear value, complicates the home screen further.
4. **4-language i18n.** English only for v1. The translation files exist but most strings are hardcoded anyway. Adding the other languages properly would take a week. Not worth it for v1.
5. **Story mode (`storyStore`).** It's beautiful in concept (30+ day narrative beats) but it adds a whole secondary content system that you have to maintain. **Make it optional and disabled by default for v1.** Re-enable post-launch once core retention is proven.
6. **Multiple paywall variants** (`PaywallNudge`, `PaywallFull`, `PaywallWeekly`). Pick one. Probably `PaywallFull`. Delete the others.
7. **Brain ID Card / "viral feature" prompt.** Don't build it until v1 ships. Build viral features when you have users to share them.
8. **Phase 2 features I had planned** (Dream Sequences, Deep Dive, Cross-Training, Social Proof, Bedtime, 100-Day Promise). Defer all of them. They're nice-to-have additions. None of them fix the actual problems, which are stability and visual polish.

### Soft cuts (scope down but keep)

1. **Pro plans.** Ship 2 plans (Monthly + Yearly). Cut Family and Lifetime for v1. Add post-launch.
2. **Achievement badges.** Audit which 25 actually unlock for a real user playing normally. Cut the ones that don't fire.
3. **Settings menu.** Audit which toggles do something. Delete the dead ones.
4. **Decorations.** ~40 decoration definitions. Ship 10. Cut the rest. Add post-launch if users care.
5. **Grove themes.** 9 themes. Ship 3 (Floating Isle free, Cloud Kingdom + Cosmic Void as paid). Cut the rest.

---

## Part 4 — What to KEEP and polish

These are the things that make Neurra actually special. Lean into them.

### The core five

1. **Kova as a character.** This is your differentiator. Other brain training apps have data dashboards. You have a friend who watches you train. Polish: Kova evolution stages, dialogue variety, emotional reactions, the postcard idea.
2. **The 11 games.** They cover all 5 brain areas. Don't add more. Polish what's there.
3. **The grove.** With today's fix, it now uses the polished SVG art. Add empty-state love for new users. This is your second screen of content beyond the games.
4. **The daily session loop.** Open app → see Kova → tap Let's Go → 5 minutes → done. The whole app is built around this. Make every part of it feel like a small ritual.
5. **The brain map** (the 5 colored bars). Simple, honest, real. Don't overthink it.

### The Phase 1 wins

- **Energy hearts.** Limits overuse, creates anticipation, low-risk to ship.
- **Brain weather.** Turns abstract data into emotional metaphor. Cheap, effective.
- **Area streaks.** Rewards intentional training. Data nerds will love it.
- **Adaptive session length.** Quick/Standard/Deep is exactly the right knob. Ship it.
- **Quick Hit.** Bonus mode for spare moments. Increases daily opens.

### Polish, don't replace

- **The brain fact rotation.** Daily, simple, surprisingly engaging. Keep adding to the fact pool over time.
- **The streak system.** Streaks + freezes work. Don't redesign.
- **The mood check-in.** Once per day, dismissable, optional. Right balance.

---

## Part 5 — Sprint plan to App Store submission

**Time horizon: 8–10 weeks of focused work.** This is realistic. If you have 2–3 hours a day, that's the timeline. If you can do 8 hours a day, halve it.

### Sprint 1: Stability (this week)

**Goal:** Open every screen without a crash. Don't change visuals.

- [ ] Fix the Insights tab crash (waiting on you for the error message — see "Next Steps" below)
- [ ] Acceptance test Phase 1: hearts decrement, weather shows, area streaks count, adaptive length works, Quick Hit completes
- [ ] Switch all remaining `SafeAreaView` imports to `react-native-safe-area-context` (5 files)
- [ ] Run through every screen on a real iPhone with notch. Verify nothing is hidden.
- [ ] Run through every screen on an iPhone SE (no notch). Verify nothing is misaligned.
- [ ] Tap every button. Note what crashes or does nothing.
- [ ] Type-check passes with zero errors (already true)
- [ ] Bundle compiles with zero warnings (already true)

**Acceptance:** All 5 visible tabs open. All 11 games launch and complete. No red error screens.

**My role:** Bug fixes as you report them. ~5–10 hours of work.

### Sprint 2: Visual polish pass

**Goal:** Make every screen feel like it was designed by the same person.

- [ ] Audit home screen, cut sections that don't earn their space
- [ ] Polish grove empty state (new user with growth=0 sees something interesting)
- [ ] Polish profile tab — add personal touches (joined date, favorite game, top brain area)
- [ ] Polish session intro/outro screens
- [ ] Polish game cards on Games tab — add a tiny visual preview
- [ ] Audit settings, cut dead toggles
- [ ] Verify all fonts load on cold start (Quicksand, Nunito, Caveat)
- [ ] Verify all dark-mode colors look right on real device

**My role:** Layout and copy. **Designer role:** Game art (postpone to Sprint 6).

**Acceptance:** Take 5 screenshots. Send to a friend. They say "this looks nice." Not "this looks generic."

### Sprint 3: Cut and finish

**Goal:** Either finish or delete every half-built feature.

- [ ] Delete `cosmeticsStore` and dead UI
- [ ] Delete or hide bot challenges
- [ ] Disable story mode by default
- [ ] Cut to 1 paywall variant
- [ ] Strip i18n to English-only (keep the infrastructure for later)
- [ ] Cut to 10 decorations + 3 grove themes
- [ ] Cut to 2 pro plans
- [ ] Audit and cut achievement badges to ones that actually unlock
- [ ] Decide: ship leagues hidden, or delete entirely

**My role:** Mechanical deletion + cleanup. ~5 hours.

**Acceptance:** Codebase is smaller than it is now. Every remaining feature has a clear purpose.

### Sprint 4: First-run experience

**Goal:** A new user opening the app for the first time should be hooked in 60 seconds.

- [ ] Onboarding: tighten the 6 screens. Cut anything that doesn't sell the daily session.
- [ ] First session: make it feel special. New user gets a different intro.
- [ ] Day 1 home screen: not the same as Day 30 home screen. Less crowded.
- [ ] Empty states everywhere: no blank screens, no "play more sessions" placeholders that look apologetic.
- [ ] Tutorial moments: first time you see hearts, first time the weather shows, first area streak — all need a small explanation.

**My role:** UX flow and copy. ~10 hours.

**Acceptance:** Hand the app to a friend who's never seen it. Watch them open it. They don't ask "what is this" or "what do I do."

### Sprint 5: Real device testing + bug bash

**Goal:** Catch the bugs only real users find.

- [ ] Run TestFlight private build
- [ ] 5 testers minimum, 10 if you can
- [ ] One week of usage
- [ ] Bug list, ranked by severity
- [ ] Fix the top 10
- [ ] Re-test

**My role:** Bug fixing as reports come in. **Your role:** Recruiting testers, collecting feedback.

### Sprint 6: Visual / asset pass (designer-heavy)

**Goal:** Replace any "indie 2022" visuals with polished ones.

- [ ] Hire a designer or commit to a Midjourney workflow
- [ ] New Kova illustrations (or refine existing SVG)
- [ ] Game backgrounds that feel less "dark gradient default"
- [ ] App icon (final version, not placeholder)
- [ ] App Store screenshots (5–10)
- [ ] Optional: App Store preview video
- [ ] Optional: Lottie animations for celebration moments

**My role:** Wiring assets in. **Designer:** All the art. **Budget:** $500–3000.

### Sprint 7: App Store submission prep

**Goal:** Get into review.

- [ ] Privacy policy (Termly or similar — $30–100)
- [ ] Terms of service
- [ ] App Store listing copy (title, subtitle, description, keywords)
- [ ] In-App Purchase products configured in App Store Connect
- [ ] RevenueCat sandbox test with real purchase
- [ ] Push notification testing
- [ ] App Store Connect account setup if not done
- [ ] Screenshots uploaded
- [ ] Submit for review

**My role:** Writing copy, configuring code. **Your role:** All the App Store Connect clicking.

### Sprint 8: Review iteration

**Goal:** Get approved.

- [ ] Wait for review (3–7 days typically)
- [ ] Fix any issues Apple flags
- [ ] Re-submit
- [ ] Approval

**My role:** Reactive. Whatever Apple asks for.

---

## Part 6 — The realistic timeline

| Sprint | Length | What you need | What I provide |
|---|---|---|---|
| 1 — Stability | 1 week | Real device testing, bug reports | Bug fixes |
| 2 — Visual polish | 1–2 weeks | Patience, taste decisions | Layout + copy |
| 3 — Cut and finish | 1 week | Hard decisions about what to cut | Mechanical deletion |
| 4 — First-run UX | 1–2 weeks | One willing test user | UX flow + copy |
| 5 — TestFlight | 2 weeks | 5–10 testers | Bug fixing |
| 6 — Designer pass | 2–3 weeks | $500–3000 + designer | Wiring assets |
| 7 — Submission | 1 week | App Store Connect setup | Copy + config |
| 8 — Review | 3–7 days | Patience | Reactive fixes |

**Total: 9–12 weeks from today (2026-04-08) to App Store approval.**

That assumes you can put **5–10 hours per week** into this. If you can only do 2 hours/week, double the timeline. If you can do 20 hours/week, halve it.

**This is the honest answer.** If anyone tells you they can ship a brain training app in 2 weeks, they're either lying or they're shipping garbage. Real apps take real time.

---

## Part 7 — What I want you to do RIGHT NOW

In order. One thing at a time.

1. **Reload Expo Go on your phone.** All today's fixes need a fresh JS bundle.
2. **Check the home screen on your iPhone.** Is the notch issue fixed? (Hearts should sit below the notch, not in it.)
3. **Tap the Grove tab.** Is it more interesting than before? (You should see the polished island with terrain, sky, organic shapes, instead of dot/circle placeholders.)
4. **Tap the Insights tab (the lightbulb).** It will probably crash again. **THIS TIME** the red screen will show you the actual error message and stack trace. Take a screenshot or type the first line. Send it to me.
5. **Tap the Profile tab.** Make sure it loads. Check if the brain map shows.
6. **Start a session.** Play through. Watch hearts decrement. Verify XP awarded. Return home.
7. **Tap Quick Hit.** Verify it runs and returns home with the counter at 4.

If anything else is broken, tell me what and where. **Don't list everything in one message** — pick the worst one and we fix it before moving on.

---

## Part 8 — A few harder truths

I'm putting these here because you need to hear them, not because they're fun to say.

1. **You will not ship this app in one prompt session, or even five.** Stop expecting that. The app is too big. Every conversation we have, we make it slightly better, and we should celebrate that. Wanting it all done now is how features get half-built.

2. **The viral feature won't save you if the core is unstable.** Spotify Wrapped goes viral because Spotify works. Duolingo's owl works because the lessons are reliable. A Brain ID Card on a buggy app gets shared once, the user opens the app, the app crashes, they uninstall, they tell their friends "don't bother." Stability first, polish second, viral features third. **That order is non-negotiable.**

3. **You don't need a designer to ship v1.** You need a designer to ship v2 and beyond. v1 can ship with the existing dark-on-dark aesthetic, polished slightly, with stock-quality assets. People will use it if it works. You can hire the designer with your first $500 of revenue.

4. **Your users won't notice 80% of what you've built.** The story mode, the bot challenges, the personality system, the weekly reports — these are deep features that most users will never see. That's not a tragedy, that's normal. Focus on the 20% that every user touches every day: open the app, see Kova, play a session, see your streak grow. Make THAT loop perfect.

5. **The way to make the games "more dopamine and colorful and creative" is to either (a) hire a designer and animator, or (b) accept the current aesthetic and polish the small things that already work.** There is no shortcut where I write code and the games suddenly look like Subway Surfers. Don't ask me for that. I will fail.

6. **Adding more games and characters does not improve the app.** It dilutes it. 11 games is plenty. 1 character is plenty. Polish what exists.

7. **The worst thing you can do right now is start over.** You have ~70% of a real product. Throwing it away to start fresh would set you back 6 months. **Keep building on what's there.**

---

## Part 9 — How we use this document

- **Save it.** Don't lose it. Reference it every session.
- **When you feel like adding a new feature**, re-read Part 3 (Cuts) and Part 6 (Timeline). Ask yourself: does this fit into a sprint, or am I dodging the work I committed to?
- **When you feel like the app sucks**, re-read Part 1 ("The good news first"). It actually doesn't suck. It's unfinished. Big difference.
- **When I suggest something dumb**, point me back to this document. I should be constraining myself by it too.
- **Update it monthly.** Move things from "broken" to "shipped" as you go. Cross out cuts. Add new bugs.

---

## Sign-off

You started this project with real ambition. The architecture proves it. What's missing is the discipline of finishing things before moving on, and the patience to ship something smaller than you imagined.

I will help you do both.

Pick the sprint you want to start. Tell me if you need me to do something specific in it. I am not going to start any new feature work until you confirm Phase 1 actually works on your phone — that means following Part 7 above and telling me what you see.

Now go look at the grove tab.

# Neurra — Master build prompt (paste into Claude Code)

**CRITICAL — Before ANY code changes**

1. Run: `find app/ components/ src/ -name '*.tsx' -o -name '*.ts' | sort` (create `components/` if missing).
2. Read **every** file that list returns; build a mental map (routes, imports, stores, who renders what).
3. Fix **one bug at a time**; after each fix, verify the app launches (`npx expo start`). Do not batch unrelated changes. Read first, fix second.

---

## PHASE A — Emergency stabilization

### A1 — Touch-blocking overlays

```bash
grep -rn "position.*absolute\|position.*fixed" --include="*.tsx" --include="*.ts" app/ components/ src/ 2>/dev/null | grep -v node_modules
```

For each hit: if decorative (noise, particles, glow, gradient, ambient), set `pointerEvents="none"` (or delete the component). Specifically: `NoiseOverlay`, `NoiseTexture`, `ParticleField`, `Particles`, `BackgroundGlow`, `AmbientEffect` — delete or `pointerEvents="none"`. Full-screen wrappers that never need touch: `pointerEvents="none"`.

### A2 — Remove ALL ads

```bash
grep -rn "admob\|google-mobile-ads\|BannerAd\|RewardedAd\|InterstitialAd\|AdMob\|GAMBanner\|TestIds\|mobileAds\|react-native-google-mobile-ads" --include="*.tsx" --include="*.ts" --include="*.js" app/ components/ src/ hooks/ stores/ utils/ constants/ 2>/dev/null
```

Ad-only files → delete. Mixed files → strip imports and usage. Stores → remove ad fields. Then: `npm uninstall react-native-google-mobile-ads` and `npx expo install --fix`. Goal: **zero** ad references.

### A3 — Navigation routes

- **A.** `find app/ -name '*.tsx' -o -name '*.ts' | sort` — every file under `app/` is a route.
- **B.** `grep -rn "router\.\|navigation\.\|href=\|navigate(\|push(\|replace(\|Redirect\|Link " --include="*.tsx" --include="*.ts" app/ components/ src/ 2>/dev/null`
- **C.** Every navigation target must match a route file from (A); fix paths or add screens.
- **D.** `app/(tabs)/_layout.tsx` — each `Tabs.Screen` `name` must match a file in `app/(tabs)/`.
- **E.** `app/_layout.tsx` — providers, `GestureHandlerRootView` **once** (not nested), fonts before screens.
- **F.** Missing routes → placeholder:

```tsx
import { View, Text, StyleSheet } from 'react-native';
export default function PlaceholderScreen() {
  return (
    <View style={s.c}>
      <Text style={s.t}>Coming Soon</Text>
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0C1018' },
  t: { color: '#EDE9E0', fontSize: 18 },
});
```

### A4 — Infinite render loops

```bash
grep -rn "useEffect" --include="*.tsx" --include="*.ts" app/ components/ hooks/ src/ 2>/dev/null | grep -v node_modules
```

Each effect: correct dependency array; no `setState` on a value in deps without `useMemo`/`useRef`; timers/intervals cleaned up; mounted ref if `setState` after async/unmount.

### A5 — Simplify animations

Replace Skia shaders → `expo-linear-gradient`. Remove heavy particle systems. Prefer `Animated.timing` + `useNativeDriver: true` over long spring chains. Remove accelerometer/gyro/parallax. Cap decorative particles at **10**.

### A6 — Zustand selectors

Never `const store = useMyStore()`. Always `useMyStore(s => s.field)` or `useShallow` for a small object slice.

### A7 — TypeScript

`npx tsc --noEmit` until **zero** errors.

### A8 — Error boundary

`components/ErrorBoundary.tsx` (or `src/components/ui/ErrorBoundary.tsx`): class boundary, recovery UI (`#0C1018` bg, `#EDE9E0` text, `#6ECF9A` button). Wrap root layout children; wrap each game subtree.

### A9 — Verify

Launch: no freeze, no `RNGoogleMobileAds`, no unmatched routes, taps work, **5 tabs** OK, one full game + session summary, settings opens, no red screens, no “Maximum update depth”.

**Stop Phase A until all pass.**

---

## PHASE B — Design foundation

- **B1:** `npx expo install expo-font @expo-google-fonts/quicksand @expo-google-fonts/nunito @expo-google-fonts/caveat expo-splash-screen expo-linear-gradient` — load Quicksand (700Bold, 600SemiBold), Nunito (400, 600, 700), Caveat (400); `SplashScreen.preventAutoHideAsync()`; hide when loaded; `return null` until fonts ready.
- **B2:** `constants/colors.ts` — `C` object + `glow(color, radius, opacity)` (shadow + elevation 8).
- **B3:** `constants/fonts.ts` — `F.h`, `F.hm`, `F.b`, `F.bs`, `F.bb`, `F.k` mapping to loaded font names.
- **B4:** `PressableScale` (Reanimated spring 0.96 / 1, damping 15, stiffness 200). Replace `Pressable` / `TouchableOpacity` / `TouchableWithoutFeedback` app-wide where appropriate.
- **B5:** Grep `#` / `fontFamily` — map to `C.*` and `F.*`.

---

## PHASE C — Screen polish (use B tokens)

- **C1 Home:** greeting, name, streak + glow, Kova + bubble, session card, stats row (widths 95 / 115 / 95).
- **C2 Tab bar:** height 65 + safe area, `C.bg3`, border top, icons 22px, inactive `C.t3`, active `C.green`, active dot + glow.
- **C3 Games:** per-game `LinearGradient` backgrounds (Pulse, Ghost Kitchen, Word Weave, default); floating score/timer; round dots bottom.
- **C4 Session summary:** performance gradient, Kova, XP/streak, game cards, accuracy bar, framing text, outlined Done.
- **C5 Settings:** sections + cards + switches (`trackColor` false `C.bg5`, true `C.green`).
- **C6 Brain map:** 5 rows, area colors (Memory green, Focus blue, Speed amber, Flexibility purple, Creativity peach).

---

## PHASE D — Core games + session flow

- **D1 Pulse:** Go/No-Go — green TAP / red DON’T; spacing ~800ms tightening toward 400ms; 3 lives; 30 shapes or 60s; ~70% green; refs for index/lives/active; state for score/time/phase; cleanup intervals on unmount.
- **D2 Ghost Kitchen:** 3–6 ingredients 2–4s, then order from tray of 8; 5 orders, ramp difficulty; emoji ingredients.
- **D3 Word Weave:** 12 letters 3×4; words ≥3 letters; 60s; dictionary Set 5000+ words; scoring 3→50, 4→120, 5→250, 6→500, 7+→1000.
- **D4 Session:** phases `greeting` | `game` | `transition` | `summary`; `<GameComponent key={\`game-${gameIndex}\`} />`; **500ms** gap between games for unmount; greeting auto-advance ~2s if spec’d.

---

## PHASE E — Engagement

- **E1** Correct: `expo-haptics` `impactAsync(Light)` + brief green flash ~150ms.
- **E2** Wrong: `notificationAsync(Warning)` + shake −4,4,−4,0 / 200ms.
- **E3** Kova idle: `withRepeat(withTiming(1.03, 2000ms, inOut), -1, true)`.
- **E4** Lists: `FadeInDown.delay(i * 80).duration(400)`.
- **E5** Streak: Zustand `persist` + AsyncStorage; same calendar day vs yesterday vs break logic; longest streak, XP, level.

---

## PHASE F — Onboarding (5 screens)

Welcome → mini Pulse (~10 shapes) → “Nice reflexes!” + RT → name input → “All set, [name]!” → home; persist completion.

---

## PHASE G — Content

- **G1** `framingText.ts` — 5+ lines per game, `getFramingText(gameId, data)`.
- **G2** `kovaDialogue.ts` — 15+ greetings (time of day, streak, return-after-break); `getGreeting(name, streak, lastSessionDate)`.
- **G3** Science / honesty page (incl. Lumosity FTC reference); link from Settings; Kova + book motif optional.
- **G4** Empty states: never blank — Kova + copy + action.

---

## PHASE H — Launch

- **H1** `assets/icon.png` — 1024×1024, dark, Kova + green glow.
- **H2** `assets/splash.png` — `C.bg2`, Kova, “Neurra”.
- **H3** `app.json` — `name` Neurra, `slug` neurra, `version` 1.0.0, portrait, dark UI, icon/splash, `com.neurra.app` iOS + Android.
- **H4–H5** Performance + full E2E checklist (onboarding, 3 games, summary, streak, tabs, cold restart persistence).

---

When all phases pass: **ship.**

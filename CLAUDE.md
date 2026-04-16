# Neurra

Consumer brain training app. React Native + Expo (TypeScript), Expo Router, Reanimated, Zustand, AsyncStorage.

## Design system
- Dark navy bg, bioluminescent nature aesthetic
- Palette: #6ECF9A, #F0B542, #E8707E, #9B72E0, #6BA8E0, #E09B6B
- Fonts: Quicksand Bold (headings), Nunito (body), Caveat (Kova)
- Kova = mascot, 7 evolution stages, warm/playful voice

## Constraints
- Must work in Expo Go (no custom native modules, no dev client features)
- Test target: physical iPhone over LAN
- Avoid generic/AI-looking UI — organic shapes, noise overlays, glowing accents

## Architecture rules
- State: Zustand stores in /stores
- Persistence: AsyncStorage, wrapped behind a service
- Navigation: Expo Router file-based
- Animations: Reanimated, never Animated API
- No inline styles for anything reusable — extract to theme

## Session handoff
Update /docs/HANDOFF.md at end of every session:
- What shipped
- What's in progress (+ file paths)
- Known bugs
- Next task

# Palace Card Game

A mobile card game app for the classic Palace card game, built with Expo + React Native.

## Architecture

- **Frontend**: Expo Router (file-based routing), React Native, TypeScript
- **Backend**: Express server (port 5000) — minimal, used for serving landing page
- **Storage**: AsyncStorage for game stats persistence (wins/losses/streak)
- **Navigation**: Stack navigation, no tabs (full-screen game experience)

## Stack

- Expo SDK 54, Expo Router 6
- React Native + TypeScript
- @tanstack/react-query for server state
- expo-haptics for touch feedback
- AsyncStorage for local persistence

## Screens

- `app/index.tsx` — Home screen with play button, stats display, card preview
- `app/game.tsx` — Main game screen with full Palace gameplay
- `app/rules.tsx` — Rules screen with all game rules

## Key Files

- `lib/palace-engine.ts` — Complete Palace game engine (deck, cards, AI logic, game rules)
- `lib/stats.ts` — Stats tracking with AsyncStorage
- `components/PlayingCard.tsx` — Reusable playing card component (face-up, face-down, sizes)
- `constants/colors.ts` — Dark green felt theme (gold accents)

## Game Features

- Full Palace rules implementation
- Single player vs AI opponent
- AI with smart card selection logic
- Setup phase: choose 3 cards for face-up palace
- All special cards: 2 (reset), 3 (transparent), 7 (lower), 10 (burn), 4-of-a-kind (burn)
- Win/loss stats tracking with streaks
- Haptic feedback on actions
- Polished dark green felt table aesthetic

## Design

- Dark emerald green felt table (#145229)
- Deep forest background (#0d2b1a)
- Gold accents (#D4AF37)
- Inter font family
- iOS-style shadows, smooth animations

## Workflows

- `Start Backend`: `npm run server:dev` — Express on port 5000
- `Start Frontend`: `npm run expo:dev` — Expo Metro on port 8081

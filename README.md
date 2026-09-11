# AI Factory — Build • Break • Survive

> **5-player cooperative party game. Five engineers. One shared AI Factory. Deploy the AI before time runs out.**

Live at → **[ai-factory-game.vercel.app](https://ai-factory-game.vercel.app)**

---

## What is it?

AI Factory is a real-time multiplayer party game built on the [Air Jam](https://airjam.gg) platform. Up to 5 players join from their phones; one screen acts as the shared host display. Each player is assigned a unique engineering role and must complete their mini-game fast enough to keep the Factory alive. If the team's collective Factory Health reaches ≥ 70% by the time the 60-second countdown ends, everyone wins.

---

## Roles & Mini-Games

| Role | Mini-Game | Goal |
|---|---|---|
| ⚡ Power Engineer | **Tap-Tap Power** — rapid tap button | Fill the power bar with 50 taps |
| 🗄️ Data Engineer | **Data Cleaning** — drag tokens to correct buckets | Sort 20 data tokens correctly |
| 🔒 Security Engineer | **Zip-Zap Firewall** — press ZIP or ZAP in sequence | Hit the right buttons in a growing pattern |
| 🤖 AI Model Engineer | **AI Core Puzzle** — arrange pipeline tiles | Solve 5 pipeline puzzle rounds |
| ❄️ Cooling Engineer | **Gyro Temperature Control** — tilt phone to level bubble | Keep the temperature in the 70–75 °C safe zone |

---

## How to Play

1. Open the game URL on a TV or laptop (the **host screen**).
2. Up to 5 players scan the QR code with their phones (the **controller screen**).
3. Each player is auto-assigned one of the five engineer roles.
4. The host presses **Launch Mission** to start the 60-second countdown.
5. Every player works their mini-game simultaneously.
6. When the timer hits zero, Factory Health is calculated — **≥ 70% is a win**.

---

## Winning Conditions

- **Factory Health ≥ 70%** → Team wins 🎉
- **Any department below 40%** → Critical failure, team loses 💥
- Factory Health = average of all five department progress scores

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 19](https://react.dev) + [TypeScript](https://typescriptlang.org) |
| Build | [Vite 6](https://vitejs.dev) |
| Multiplayer | [Air Jam SDK](https://airjam.gg) |
| State | Zustand (via Air Jam replicated store) |
| Input | Air Jam controller input (buttons, touch, motion/gyroscope) |
| Deployment | [Vercel](https://vercel.com) |

---

## Project Structure

```
src/
├── airjam.config.ts          # Air Jam app metadata, runtime, and agent contract
├── app.tsx                   # Routes: "/" → host, "/controller" → controller
├── main.tsx                  # React entry point
├── index.css                 # Global styles
│
├── game/
│   ├── config/
│   │   └── gameConfig.ts     # ⚙️  All tuning constants (timer, scoring, thresholds)
│   ├── contracts/
│   │   └── agent.ts          # Semantic agent contract (MCP + AI agent surface)
│   ├── domain/
│   │   ├── types.ts          # Core game types and role definitions
│   │   └── factoryHealth.ts  # Factory Health calculation logic
│   ├── store/
│   │   └── factoryStore.ts   # Replicated game state + all store actions
│   └── input.ts              # Controller input schema (gyroscope for cooling)
│
├── host/
│   ├── index.tsx             # Host screen — lobby, gameplay view, end screen
│   └── components/           # Host UI components (DeptPanel, HexGrid, etc.)
│
└── controller/
    └── index.tsx             # Controller screen — role selector + all mini-games
```

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start local dev server (Air Jam backend + Vite frontend)
pnpm dev
```

Open the printed URL on a laptop as the host screen and scan the QR code on your phone as a controller.

### Other commands

```bash
pnpm run typecheck     # TypeScript type check (no emit)
pnpm run test          # Unit tests (Vitest)
pnpm run test:e2e      # End-to-end tests (Playwright)
pnpm run build         # Production build (tsc + vite build)
```

---

## Configuration

All game tuning lives in a single file: [`src/game/config/gameConfig.ts`](src/game/config/gameConfig.ts)

Key values:

| Constant | Value | Description |
|---|---|---|
| `gameDurationSeconds` | `60` | Total game timer (seconds) |
| `factorySuccessThreshold` | `70` | Factory Health % needed to win |
| `criticalDeptMinimum` | `40` | Min dept % — if any drops below this, team loses |
| `maxPlayers` | `5` | One player per engineering role |

---

## Deployment

The project is deployed on Vercel and linked via `.vercel/project.json`.

To deploy a new version:

```bash
npx vercel --prod
```

Or push to the connected Git repository and Vercel will auto-deploy.

---

## Built with Air Jam

This game uses the [Air Jam](https://airjam.gg) platform for:

- **QR-based controller joining** — no app download required
- **Replicated game state** — host-authoritative actions synced to all players
- **Gyroscope controller input** — real phone motion used for the Cooling mini-game
- **Semantic agent contract** — exposes game state and actions for AI/MCP tooling

# Vietnam Scooter Racing

A 30-player real-time multiplayer browser-based racing game where players race scooters through chaotic Vietnamese streets.

## Features (MVP Phase 1)

- ✅ Three.js scene with Vietnamese street environment
- ✅ Player scooter with WASD/touch controls
- ✅ Physics: acceleration, steering, balance mechanic
- ✅ Balance wobble animation when kicked
- ✅ 5 AI scooters with waypoint following
- ✅ Traffic system with collision detection
- ✅ Mobile touch controls (virtual joystick)
- ✅ Performance monitoring (FPS counter)

## Tech Stack

**Frontend:**
- React 18 + Vite + TypeScript
- Three.js r160 + React Three Fiber
- Cannon.js (physics)
- Tailwind CSS
- Zustand (state management)

**Backend:**
- Node.js 20 + TypeScript
- Colyseus 0.15 (game server)
- Redis (game state)
- Supabase (match history)

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Client

```bash
cd client
npm install
npm run dev
```

Open http://localhost:3000

### Server

```bash
cd server
npm install
npm run dev
```

Server runs on port 2567

## Controls

**Desktop:**
- W/↑ - Accelerate
- S/↓ - Brake/Reverse
- A/← - Turn left
- D/→ - Turn right
- SPACE - Kick

**Mobile:**
- Left side: Virtual joystick
- Right side: Kick button

## Development Phases

- **Phase 1:** Single-player prototype ✅
- **Phase 2:** 2-4 player multiplayer
- **Phase 3:** Scale to 30 players
- **Phase 4:** Polish, audio, leaderboards

## Performance Targets

- 30fps on iPhone 11 / Samsung Galaxy A52
- <3MB bundle size
- 100 draw calls max per frame

## License

MIT

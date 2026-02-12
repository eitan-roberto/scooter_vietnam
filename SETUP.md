# Project Setup Guide

## Quick Start (5 minutes)

### 1. Prerequisites
```bash
node --version  # Should be v20+
npm --version   # Should be v10+
```

### 2. Install & Run

#### Terminal 1: Client
```bash
cd client
npm install
npm run dev
# Open http://localhost:3000
```

#### Terminal 2: Server
```bash
cd server
npm install
npm run dev
# Runs on http://localhost:2567
```

#### Terminal 3: Redis (Optional, for multiplayer)
```bash
redis-server
# Default: localhost:6379
```

## Project Structure

```
scooter_vietnam/
├── client/                    # React + Three.js frontend
│   ├── src/
│   │   ├── components/        # React UI components
│   │   │   ├── Game.tsx       # Main game wrapper
│   │   │   ├── Lobby.tsx      # [Phase 2] Matchmaking UI
│   │   │   ├── Results.tsx    # [Phase 2] Results screen
│   │   │   └── HUD.tsx        # [Phase 4] In-game HUD
│   │   ├── game/              # Three.js game logic
│   │   │   ├── Scene.ts       # Main scene manager
│   │   │   ├── ScooterController.ts  # Physics & input
│   │   │   ├── TrafficManager.ts     # AI traffic
│   │   │   └── NetworkManager.ts     # [Phase 2] Colyseus client
│   │   ├── services/          # API & analytics
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript definitions
│   │   ├── App.tsx            # Root component
│   │   └── main.tsx           # Entry point
│   ├── public/                # Static assets (empty)
│   ├── index.html             # HTML template
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.js     # Tailwind CSS config
│   ├── postcss.config.js      # PostCSS config
│   └── package.json           # Dependencies
│
├── server/                    # Node.js + Colyseus backend
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── rooms/
│   │   │   └── RaceRoom.ts    # Main game room
│   │   ├── schema/
│   │   │   └── RaceState.ts   # State schema
│   │   └── utils/             # Helper functions
│   ├── vite.config.ts
│   └── package.json
│
├── shared/                    # Shared types & constants
│   └── types.ts
│
├── CONTEXT.md                 # Project context (read this!)
├── DEPLOYMENT.md              # Deployment instructions
├── README.md                  # Overview
└── .gitignore                 # Git ignore rules
```

## Development Phases

### Phase 1: Single-Player ✅ (NOW)
- [x] Three.js scene
- [x] Player scooter controls (WASD)
- [x] Physics engine
- [x] Balance mechanic
- [x] AI scooters
- [x] Traffic system
- [x] Mobile touch controls
- [x] Performance counter

**Status:** Playable single-player prototype ready

### Phase 2: Networking 🚧 (Next)
- [ ] Colyseus server setup
- [ ] 2-4 player multiplayer
- [ ] State synchronization
- [ ] Lobby UI
- [ ] Room codes

### Phase 3: Scale to 30 Players
- [ ] Instanced rendering
- [ ] Full 2km track
- [ ] 50 traffic vehicles
- [ ] Matchmaking system

### Phase 4: Polish & Launch
- [ ] Audio system
- [ ] Leaderboards
- [ ] Results screen
- [ ] Deploy to Vercel + Railway

## Key Technologies

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18 + Vite | Fast dev, optimal builds |
| **3D** | Three.js r160 | Industry standard |
| **Physics** | Cannon.js | Lightweight physics |
| **State** | Zustand | Minimal boilerplate |
| **Styling** | Tailwind CSS | Rapid UI development |
| **Backend** | Colyseus | Built for multiplayer games |
| **Database** | Supabase + Redis | Fast + scalable |

## Common Commands

```bash
# Client
npm run dev       # Start dev server (localhost:3000)
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Lint TypeScript

# Server
npm run dev       # Start dev server (localhost:2567)
npm run build     # Compile TypeScript
npm run start     # Run compiled server

# Both
npm install --include=dev  # Install dev dependencies (sandbox needs this)
```

## Performance Targets

- ✅ 30fps on iPhone 11 (Phase 1)
- ✅ <3MB initial bundle
- ⏳ 30 players with <100ms latency (Phase 3)
- ⏳ <1KB/tick network usage (Phase 2)

## Debugging

### Client
- Open browser DevTools (F12)
- Check Console for errors
- Monitor Network tab for WebSocket traffic
- Use React DevTools extension

### Server
- Check terminal output for errors
- Enable debug logging: `DEBUG=* npm run dev`
- Monitor memory usage
- Check Redis connection

### Game Performance
- FPS counter visible in top-right
- Press F12 to open Three.js inspector (if enabled)
- Check browser Performance tab

## Next Steps

1. **Play the game locally** - Run both client & server
2. **Try the controls** - WASD to move, SPACE to kick
3. **Test mobile** - Open on phone to test touch controls
4. **Review code** - Start in `client/src/game/Scene.ts`
5. **Phase 2** - When ready, start networking layer

## Need Help?

- Check errors in browser console (client)
- Check terminal output (server)
- Review CONTEXT.md for project overview
- Check DEPLOYMENT.md for deployment questions

---

**Last Updated:** Feb 2026
**Status:** Phase 1 Complete, Phase 2 Ready to Start

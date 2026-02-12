# Vietnam Scooter Racing

**Status:** MVP Phase 1 - Single Player Prototype ✅ Complete

## Stack
- **Frontend:** React 18 + Vite + TypeScript + Three.js r160 + Cannon.js
- **Backend:** Node.js 20 + Colyseus 0.15 + TypeScript
- **State:** Zustand (client), Colyseus Schema (server)
- **Styling:** Tailwind CSS
- **Database:** Redis (game state), Supabase (match history)
- **Hosting:** Vercel (frontend), Railway (backend)

## Completed ✅
- [x] Project structure following team conventions
- [x] Three.js scene with Vietnamese street environment (200m test track)
- [x] Player scooter with WASD/touch controls
- [x] Physics: acceleration, steering, balance mechanic
- [x] Balance wobble animation when balance < 50
- [x] 5 AI scooters following waypoints
- [x] Traffic system with collision detection
- [x] Performance monitoring (FPS counter)
- [x] Mobile touch controls (virtual joystick + kick button)
- [x] Basic UI (HUD, speed, balance, position)

## In Progress 🚧
- [ ] Colyseus server setup (Phase 2)
- [ ] Multiplayer synchronization
- [ ] 30-player instanced rendering
- [ ] Full 2km track (10 chunks)

## Next 📋
- Phase 2: 2-4 player networking
- Phase 3: Scale to 30 players
- Phase 4: Polish, audio, match history

## Key Decisions
- **InstancedMesh for scooters:** Single geometry, 30 instances = better performance
- **Client-side prediction:** Smooth feel with server reconciliation
- **Low-poly art style:** <500 triangles per scooter, 50k total visible
- **Cannon.js physics:** Lightweight, works well with Three.js
- **Colyseus for multiplayer:** Purpose-built for real-time games, 20 tick rate

## Performance Targets
- 30fps on iPhone 11 / Samsung Galaxy A52
- <3MB bundle size
- <1KB/tick network downstream
- 100 draw calls max per frame

## File Structure
```
scooter_vietnam/
├── client/          # React + Three.js frontend
│   ├── src/
│   │   ├── components/    # UI components (HUD, Lobby, etc.)
│   │   ├── game/          # Game logic (Scene, ScooterController, TrafficManager)
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API calls, analytics
│   │   └── assets/        # Models, textures, sounds
│   └── package.json
├── server/          # Colyseus game server
│   ├── src/
│   │   ├── rooms/         # RaceRoom.ts
│   │   ├── schema/        # RaceState.ts
│   │   └── utils/         # Physics, validation
│   └── package.json
└── shared/          # Shared types and constants
    └── types.ts
```

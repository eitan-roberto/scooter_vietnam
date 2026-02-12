# Deployment Guide

## Local Development

### Prerequisites
- Node.js 20+
- npm or yarn
- Redis (for game state)
- PostgreSQL (optional, for persistence)

### Running Locally

#### 1. Client (React + Three.js)
```bash
cd client
npm install
npm run dev
```
Open http://localhost:3000

#### 2. Server (Colyseus)
```bash
cd server
npm install
npm run dev
```
Server runs on http://localhost:2567

### Building for Production

#### Client (Vercel)
```bash
cd client
npm run build
vercel deploy
```

Set environment variables on Vercel:
- `VITE_SERVER_URL` - Your Railway server URL
- `VITE_SUPABASE_URL` - Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

#### Server (Railway)

1. Create Railway project:
```bash
npm install -g railway
railway login
railway init
```

2. Set environment variables in Railway dashboard:
- `PORT=2567`
- `NODE_ENV=production`
- `REDIS_URL` - Upstash Redis URL
- `DATABASE_URL` - PostgreSQL connection string

3. Deploy:
```bash
railway up
```

## Database Setup

### Supabase

Create tables:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  total_races INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  total_kicks INT DEFAULT 0
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  player_count INT,
  winning_time FLOAT
);

CREATE TABLE match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id),
  user_id UUID REFERENCES users(id),
  finish_position INT,
  finish_time FLOAT,
  kicks_landed INT DEFAULT 0,
  kicks_received INT DEFAULT 0,
  traffic_collisions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Redis

For development, use local Redis:
```bash
redis-server
```

For production, use Upstash Redis (free tier available):
1. Create account at https://upstash.com
2. Create Redis database
3. Copy connection URL to `REDIS_URL`

## Performance Optimization

### Frontend
- Build with `npm run build` to optimize bundle
- Use Vercel's analytics to monitor performance
- Target: <3MB bundle, 30fps on mobile

### Backend
- Use Railway's auto-scaling for multiple instances
- Monitor with built-in metrics
- Target: <100ms latency for 30 players

### Database
- Use Supabase's built-in backups
- Enable Row Level Security (RLS) for security
- Create indexes on frequently queried columns

## Monitoring

### Client Metrics
- FPS counter (visible in game)
- Network latency
- Bundle size

### Server Metrics
- Tick rate (20 ticks/sec = 50ms)
- Concurrent players
- Average room lifetime

### Health Checks

Client health: `/health` endpoint returns server status
Server health: Check `/health` on game server

## Troubleshooting

### Client won't connect
- Check `VITE_SERVER_URL` is correct
- Ensure server is running
- Check browser console for errors

### Server won't start
- Ensure Redis is running (`redis-server`)
- Check PORT is not in use
- Verify environment variables are set

### Performance issues
- Lower player count in testing
- Check FPS in game
- Monitor server CPU/memory
- Check network latency with DevTools

## Scaling

### Horizontal Scaling
- Add new Railway instances (Railway manages load balancing)
- Each instance handles 3-5 rooms (90-150 players)
- Rooms are pinned to an instance (no cross-instance communication needed)

### Vertical Scaling
- Upgrade Railway instance size
- Increase Redis memory
- Use faster PostgreSQL tier

## Security

- Enable Supabase RLS for data access control
- Use environment variables for secrets (never commit .env)
- Set up CORS properly for production domain
- Consider rate limiting on API endpoints

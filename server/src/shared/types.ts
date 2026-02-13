// Shared types between client and server

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerInput {
  throttle: number;  // 0-1
  steering: number;  // -1 to 1
  kick: boolean;
}

export interface PlayerState {
  id: string;
  position: Vector3;
  rotation: number;  // Y rotation in radians
  balance: number;   // 0-100
  speed: number;     // km/h
  kicksLanded: number;
  kicksReceived: number;
  finished: boolean;
  finishTime?: number;
}

export interface TrafficVehicle {
  id: string;
  position: Vector3;
  rotation: number;
  type: 'car' | 'motorbike' | 'slow';
  speed: number;
}

export interface GameState {
  players: Map<string, PlayerState>;
  traffic: TrafficVehicle[];
  raceTime: number;
  raceStarted: boolean;
  raceFinished: boolean;
}

export interface MatchResult {
  playerId: string;
  position: number;
  finishTime: number;
  kicksLanded: number;
  kicksReceived: number;
  trafficCollisions: number;
}

// Game Constants
export const GAME_CONSTANTS = {
  // Physics
  MAX_SPEED: 50,           // km/h
  ACCELERATION: 10,        // units/s²
  HANDLING: 0.8,           // turn responsiveness
  BALANCE_RECOVERY: 10,    // balance recovery per second
  KICK_BALANCE_DAMAGE: 20, // balance lost when kicked
  KICK_RANGE: 5,           // meters
  KICK_COOLDOWN: 2,        // seconds
  
  // Race
  TRACK_LENGTH: 2000,      // 2km in meters
  MIN_PLAYERS: 4,
  MAX_PLAYERS: 30,
  RACE_DURATION: 180,      // 3 minutes max
  
  // Traffic
  TRAFFIC_COUNT: 50,
  SLOW_SPEED: 15,          // km/h
  MEDIUM_SPEED: 25,        // km/h
  FAST_SPEED: 35,          // km/h
  
  // Network
  TICK_RATE: 20,           // 20 updates per second (50ms)
  
  // Visual
  RENDER_DISTANCE: 100,    // meters
  CHUNK_SIZE: 200,         // meters per chunk
  FOG_DENSITY: 0.02,
} as const;

// Scooter colors
export const SCOOTER_COLORS = [
  0xff0000, // Red
  0x0000ff, // Blue
  0xffff00, // Yellow
  0x00ff00, // Green
  0xff00ff, // Magenta
  0x00ffff, // Cyan
  0xffa500, // Orange
  0x800080, // Purple
] as const;

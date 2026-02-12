import { Room, Client } from 'colyseus';
import { Schema, type, MapSchema } from '@colyseus/schema';
import { GAME_CONSTANTS } from '../../shared/types';

// Player state schema
class Player extends Schema {
  @type('string') id: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;
  @type('number') rotation: number = 0;
  @type('number') balance: number = 50;
  @type('number') speed: number = 0;
  @type('number') kicksLanded: number = 0;
  @type('number') kicksReceived: number = 0;
  @type('boolean') finished: boolean = false;
  @type('number') finishTime: number = 0;
  @type('string') username: string = '';
}

// Traffic vehicle schema
class TrafficVehicle extends Schema {
  @type('string') id: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;
  @type('number') rotation: number = 0;
  @type('string') type: string = 'car';
}

// Game state schema
export class RaceState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: TrafficVehicle }) traffic = new MapSchema<TrafficVehicle>();
  @type('string') roomState: string = 'waiting'; // waiting, racing, finished
  @type('number') raceTime: number = 0;
  @type('number') countdown: number = 30;
  @type('string') roomCode: string = '';
}

export class RaceRoom extends Room<RaceState> {
  maxClients = GAME_CONSTANTS.MAX_PLAYERS;
  private updateInterval: NodeJS.Timeout | null = null;
  private raceStartTime: number = 0;

  onCreate(options: any) {
    this.setState(new RaceState());
    
    // Generate room code for private rooms
    if (options.private) {
      this.state.roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Handle player input
    this.onMessage('input', (client, data) => {
      this.handlePlayerInput(client, data);
    });

    // Start countdown when enough players
    this.checkStartConditions();
  }

  onJoin(client: Client, options: any) {
    console.log(`Player ${client.sessionId} joined`);
    
    const player = new Player();
    player.id = client.sessionId;
    player.username = options.username || `Player ${this.state.players.size + 1}`;
    
    // Spawn position
    const spawnIndex = this.state.players.size;
    const offset = (spawnIndex % 2 === 0 ? 1 : -1) * (2 + Math.floor(spawnIndex / 2) * 2);
    player.x = offset;
    player.y = 2;
    player.z = -spawnIndex * 3;
    
    this.state.players.set(client.sessionId, player);
    
    // Check if we can start
    this.checkStartConditions();
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Player ${client.sessionId} left`);
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log('Room disposed');
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  private checkStartConditions() {
    const playerCount = this.state.players.size;
    
    if (playerCount >= GAME_CONSTANTS.MIN_PLAYERS && this.state.roomState === 'waiting') {
      this.startCountdown();
    }
  }

  private startCountdown() {
    this.state.roomState = 'waiting';
    
    const countdownInterval = setInterval(() => {
      this.state.countdown--;
      
      if (this.state.countdown <= 0) {
        clearInterval(countdownInterval);
        this.startRace();
      }
    }, 1000);
  }

  private startRace() {
    this.state.roomState = 'racing';
    this.raceStartTime = Date.now();
    
    // Start game loop
    this.updateInterval = setInterval(() => {
      this.updateGame();
    }, 1000 / GAME_CONSTANTS.TICK_RATE);
    
    // End race after max duration
    setTimeout(() => {
      this.endRace();
    }, GAME_CONSTANTS.RACE_DURATION * 1000);
  }

  private updateGame() {
    if (this.state.roomState !== 'racing') return;
    
    this.state.raceTime = (Date.now() - this.raceStartTime) / 1000;
    
    // Update traffic positions
    this.updateTraffic();
    
    // Check for finished players
    let allFinished = true;
    this.state.players.forEach(player => {
      if (!player.finished) {
        allFinished = false;
        // Check if crossed finish line
        if (player.z <= -GAME_CONSTANTS.TRACK_LENGTH) {
          player.finished = true;
          player.finishTime = this.state.raceTime;
        }
      }
    });
    
    if (allFinished && this.state.players.size > 0) {
      this.endRace();
    }
  }

  private updateTraffic() {
    // Simple traffic movement
    this.state.traffic.forEach(vehicle => {
      const speed = vehicle.type === 'slow' ? 4 : vehicle.type === 'motorbike' ? 7 : 10;
      vehicle.z -= speed * (1 / GAME_CONSTANTS.TICK_RATE);
      
      // Loop traffic
      if (vehicle.z < -200) {
        vehicle.z = 0;
      }
    });
  }

  private handlePlayerInput(client: Client, data: { throttle: number; steering: number; kick: boolean }) {
    const player = this.state.players.get(client.sessionId);
    if (!player || player.finished) return;
    
    // Validate inputs
    const throttle = Math.max(-0.5, Math.min(1, data.throttle));
    const steering = Math.max(-1, Math.min(1, data.steering));
    
    // Calculate new position (simplified physics)
    const speed = player.speed;
    const maxSpeed = GAME_CONSTANTS.MAX_SPEED / 3.6; // m/s
    const balanceFactor = player.balance / 100;
    
    // Update speed
    const targetSpeed = throttle * maxSpeed * balanceFactor;
    player.speed += (targetSpeed - speed) * 0.1;
    
    // Update position
    const moveDistance = player.speed * (1 / GAME_CONSTANTS.TICK_RATE);
    player.x += Math.sin(player.rotation) * moveDistance * 0.1 * steering;
    player.z -= Math.cos(player.rotation) * moveDistance;
    
    // Update rotation
    player.rotation += steering * 0.05;
    
    // Boundary check
    player.x = Math.max(-12, Math.min(12, player.x));
    
    // Handle kick
    if (data.kick) {
      this.handleKick(player);
    }
  }

  private handleKick(kicker: Player) {
    // Find nearby players
    this.state.players.forEach(target => {
      if (target.id === kicker.id) return;
      
      const dx = kicker.x - target.x;
      const dz = kicker.z - target.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < GAME_CONSTANTS.KICK_RANGE) {
        // Apply kick
        target.balance = Math.max(0, target.balance - GAME_CONSTANTS.KICK_BALANCE_DAMAGE);
        kicker.kicksLanded++;
        target.kicksReceived++;
        
        // Push back
        target.z += 3;
      }
    });
  }

  private endRace() {
    this.state.roomState = 'finished';
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Send results to all clients
    this.broadcast('race_finished', {
      results: this.getResults(),
    });
  }

  private getResults() {
    const players = Array.from(this.state.players.values());
    players.sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      return b.z - a.z; // Furthest along wins if not finished
    });
    
    return players.map((p, index) => ({
      position: index + 1,
      username: p.username,
      finishTime: p.finishTime,
      kicksLanded: p.kicksLanded,
      kicksReceived: p.kicksReceived,
    }));
  }
}

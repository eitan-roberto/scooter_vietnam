import { Room, Client } from '@colyseus/core';
import { Schema, type, MapSchema } from '@colyseus/schema';
import { GAME_CONSTANTS } from '../shared/types';

// Player state schema
class Player extends Schema {
  @type('string')
  id: string = '';
  
  @type('number')
  x: number = 0;
  
  @type('number')
  y: number = 0;
  
  @type('number')
  z: number = 0;
  
  @type('number')
  rotation: number = 0;
  
  @type('number')
  balance: number = 50;
  
  @type('number')
  speed: number = 0;
  
  @type('number')
  kicksLanded: number = 0;
  
  @type('number')
  kicksReceived: number = 0;
  
  @type('boolean')
  finished: boolean = false;
  
  @type('number')
  finishTime: number = 0;
  
  @type('string')
  username: string = '';
}

// Traffic vehicle schema  
class TrafficVehicle extends Schema {
  @type('string')
  id: string = '';
  
  @type('number')
  x: number = 0;
  
  @type('number')
  y: number = 0;
  
  @type('number')
  z: number = 0;
  
  @type('number')
  rotation: number = 0;
  
  @type('string')
  type: string = 'car';
}

// Game state schema
export class RaceState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();
  
  @type({ map: TrafficVehicle })
  traffic = new MapSchema<TrafficVehicle>();
  
  @type('string')
  roomState: string = 'waiting';
  
  @type('number')
  raceTime: number = 0;
  
  @type('number')
  countdown: number = 30;
  
  @type('string')
  roomCode: string = '';
}

export class RaceRoom extends Room<RaceState> {
  maxClients = GAME_CONSTANTS.MAX_PLAYERS;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private raceStartTime: number = 0;

  onCreate(options: any) {
    this.setState(new RaceState());
    
    if (options.private) {
      this.state.roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    this.onMessage('input', (client, data) => {
      this.handlePlayerInput(client, data);
    });

    this.checkStartConditions();
  }

  onJoin(client: Client, options: any) {
    console.log(`Player ${client.sessionId} joined`);
    
    const player = new Player();
    player.id = client.sessionId;
    player.username = options.username || `Player ${this.state.players.size + 1}`;
    
    const spawnIndex = this.state.players.size;
    const offset = (spawnIndex % 2 === 0 ? 1 : -1) * (2 + Math.floor(spawnIndex / 2) * 2);
    player.x = offset;
    player.y = 2;
    player.z = -spawnIndex * 3;
    
    this.state.players.set(client.sessionId, player);
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
    if (this.state.players.size >= GAME_CONSTANTS.MIN_PLAYERS && this.state.roomState === 'waiting') {
      this.startCountdown();
    }
  }

  private startCountdown() {
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
    
    this.updateInterval = setInterval(() => {
      this.updateGame();
    }, 1000 / GAME_CONSTANTS.TICK_RATE);
    
    setTimeout(() => {
      this.endRace();
    }, GAME_CONSTANTS.RACE_DURATION * 1000);
  }

  private updateGame() {
    if (this.state.roomState !== 'racing') return;
    this.state.raceTime = (Date.now() - this.raceStartTime) / 1000;
  }

  private handlePlayerInput(client: Client, data: { throttle: number; steering: number; kick: boolean }) {
    const player = this.state.players.get(client.sessionId);
    if (!player || player.finished) return;
    
    // Simplified physics for server
    const speed = data.throttle * 10;
    player.x += data.steering * 0.5;
    player.z -= speed * 0.1;
  }

  private endRace() {
    this.state.roomState = 'finished';
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.broadcast('race_finished', { results: [] });
  }
}

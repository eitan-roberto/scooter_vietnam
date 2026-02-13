import * as THREE from 'three';
import { GAME_CONSTANTS, type TrafficVehicle, type Vector3 } from '../shared/types';

interface TrafficConfig {
  id: string;
  type: 'car' | 'motorbike' | 'slow';
  path: THREE.Vector3[];
  speed: number;
  startOffset: number;
}

export class TrafficManager {
  private scene: THREE.Scene;
  private vehicles: Map<string, { mesh: THREE.Group; config: TrafficConfig; progress: number }> = new Map();
  private waypoints: THREE.Vector3[] = [];
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupWaypoints();
    this.createTraffic();
  }
  
  private setupWaypoints(): void {
    // Create 3 lanes with waypoints
    const laneWidth = 6;
    const trackLength = 200;
    const segments = 10;
    
    for (let lane = -1; lane <= 1; lane++) {
      const x = lane * laneWidth;
      for (let i = 0; i <= segments; i++) {
        const z = -(i / segments) * trackLength;
        // Add some curves
        const xOffset = Math.sin(i * 0.5) * 2;
        this.waypoints.push(new THREE.Vector3(x + xOffset, 0, z));
      }
    }
  }
  
  private createTraffic(): void {
    const configs: TrafficConfig[] = [];
    
    // Create 5 AI vehicles for Phase 1
    for (let i = 0; i < 5; i++) {
      const type = Math.random() < 0.4 ? 'car' : Math.random() < 0.7 ? 'motorbike' : 'slow';
      const speed = type === 'slow' ? GAME_CONSTANTS.SLOW_SPEED : 
                    type === 'motorbike' ? GAME_CONSTANTS.MEDIUM_SPEED : 
                    GAME_CONSTANTS.FAST_SPEED;
      
      configs.push({
        id: `traffic_${i}`,
        type,
        path: this.generatePath(),
        speed: speed / 3.6, // Convert to m/s
        startOffset: Math.random() * 100, // Random start position
      });
    }
    
    configs.forEach(config => {
      const mesh = this.createVehicleMesh(config.type);
      this.scene.add(mesh);
      
      // Set initial position
      const initialPos = this.getPositionOnPath(config.path, config.startOffset);
      mesh.position.copy(initialPos);
      
      this.vehicles.set(config.id, {
        mesh,
        config,
        progress: config.startOffset,
      });
    });
  }
  
  private generatePath(): THREE.Vector3[] {
    // Pick a random lane and create a path
    const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    const laneWidth = 6;
    const x = lane * laneWidth;
    
    const path: THREE.Vector3[] = [];
    const trackLength = 200;
    const segments = 20;
    
    for (let i = 0; i <= segments; i++) {
      const z = -(i / segments) * trackLength;
      const xOffset = Math.sin(i * 0.3) * 1.5 + (Math.random() - 0.5);
      path.push(new THREE.Vector3(x + xOffset, 0, z));
    }
    
    return path;
  }
  
  private createVehicleMesh(type: string): THREE.Group {
    const group = new THREE.Group();
    
    if (type === 'car') {
      // Car body
      const bodyGeom = new THREE.BoxGeometry(1.8, 0.8, 3.5);
      const colors = [0x3366cc, 0xcc3333, 0x33cc33, 0xcccc33, 0x9933cc];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const bodyMat = new THREE.MeshStandardMaterial({ color });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.y = 0.6;
      body.castShadow = true;
      group.add(body);
      
      // Wheels
      const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      
      const positions = [
        [-0.9, 0.35, 1.2], [0.9, 0.35, 1.2],
        [-0.9, 0.35, -1.2], [0.9, 0.35, -1.2],
      ];
      
      positions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...pos);
        wheel.castShadow = true;
        group.add(wheel);
      });
      
    } else if (type === 'motorbike') {
      // Motorbike body
      const bodyGeom = new THREE.BoxGeometry(0.6, 0.5, 1.5);
      const colors = [0x666666, 0x444444, 0x222222];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const bodyMat = new THREE.MeshStandardMaterial({ color });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.y = 0.4;
      body.castShadow = true;
      group.add(body);
      
      // Wheels
      const wheelGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 10);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      
      const frontWheel = new THREE.Mesh(wheelGeom, wheelMat);
      frontWheel.rotation.z = Math.PI / 2;
      frontWheel.position.set(0, 0.3, 0.6);
      group.add(frontWheel);
      
      const backWheel = new THREE.Mesh(wheelGeom, wheelMat);
      backWheel.rotation.z = Math.PI / 2;
      backWheel.position.set(0, 0.3, -0.6);
      group.add(backWheel);
      
    } else {
      // Slow vehicle (truck/tuk-tuk)
      const bodyGeom = new THREE.BoxGeometry(1.5, 1.2, 2.5);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc9933 });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.y = 0.8;
      body.castShadow = true;
      group.add(body);
      
      // Wheels
      const wheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 10);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      
      const positions = [
        [-0.7, 0.4, 0.8], [0.7, 0.4, 0.8],
        [-0.7, 0.4, -0.8], [0.7, 0.4, -0.8],
      ];
      
      positions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...pos);
        wheel.castShadow = true;
        group.add(wheel);
      });
    }
    
    return group;
  }
  
  private getPositionOnPath(path: THREE.Vector3[], distance: number): THREE.Vector3 {
    const curve = new THREE.CatmullRomCurve3(path);
    const t = Math.min(1, Math.max(0, distance / 200)); // Normalize to 0-1
    return curve.getPoint(t);
  }
  
  update(deltaTime: number): void {
    this.vehicles.forEach(vehicle => {
      // Move along path
      vehicle.progress += vehicle.config.speed * deltaTime;
      
      // Loop when reaching end
      if (vehicle.progress > 200) {
        vehicle.progress = 0;
      }
      
      // Get new position
      const newPos = this.getPositionOnPath(vehicle.config.path, vehicle.progress);
      
      // Calculate rotation based on path direction
      const nextPos = this.getPositionOnPath(vehicle.config.path, vehicle.progress + 1);
      const direction = new THREE.Vector3().subVectors(nextPos, newPos).normalize();
      const angle = Math.atan2(direction.x, direction.z);
      
      // Update mesh
      vehicle.mesh.position.copy(newPos);
      vehicle.mesh.rotation.y = angle;
    });
  }
  
  getVehicles(): TrafficVehicle[] {
    const vehicles: TrafficVehicle[] = [];
    this.vehicles.forEach((vehicle, id) => {
      vehicles.push({
        id,
        position: {
          x: vehicle.mesh.position.x,
          y: vehicle.mesh.position.y,
          z: vehicle.mesh.position.z,
        },
        rotation: vehicle.mesh.rotation.y,
        type: vehicle.config.type,
        speed: vehicle.config.speed * 3.6, // Convert to km/h
      });
    });
    return vehicles;
  }
  
  checkCollisions(playerPosition: THREE.Vector3, radius: number = 1): boolean {
    for (const vehicle of this.vehicles.values()) {
      const dist = playerPosition.distanceTo(vehicle.mesh.position);
      if (dist < radius) {
        return true;
      }
    }
    return false;
  }
  
  destroy(): void {
    this.vehicles.forEach(vehicle => {
      this.scene.remove(vehicle.mesh);
    });
    this.vehicles.clear();
  }
}

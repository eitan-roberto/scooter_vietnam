import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GAME_CONSTANTS, type PlayerInput } from '../shared/types';

export interface ScooterPhysics {
  mesh: THREE.Group;
  body: CANNON.Body;
  balance: number;
  speed: number;
  kickedAt: number;
}

export class ScooterController {
  private physics: ScooterPhysics;
  private world: CANNON.World;
  private input: PlayerInput = { throttle: 0, steering: 0, kick: false };
  private lastKickTime: number = 0;
  
  // Scooter dimensions
  private readonly width = 0.6;
  private readonly height = 0.8;
  private readonly length = 1.5;
  
  constructor(scene: THREE.Scene, world: CANNON.World, position: THREE.Vector3, color: number) {
    this.world = world;
    
    // Create Three.js mesh (visual)
    this.physics = this.createScooter(scene, position, color);
    
    // Create Cannon.js body (physics)
    this.physics.body = this.createPhysicsBody(position);
    world.addBody(this.physics.body);
    
    // Sync mesh with body
    this.syncMeshWithBody();
  }
  
  private createScooter(scene: THREE.Scene, position: THREE.Vector3, color: number): ScooterPhysics {
    const group = new THREE.Group();
    
    // Main body (low poly scooter shape)
    const bodyGeom = new THREE.BoxGeometry(0.5, 0.4, 1.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.4;
    body.castShadow = true;
    group.add(body);
    
    // Seat
    const seatGeom = new THREE.BoxGeometry(0.4, 0.1, 0.4);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const seat = new THREE.Mesh(seatGeom, seatMat);
    seat.position.set(0, 0.7, -0.2);
    seat.castShadow = true;
    group.add(seat);
    
    // Handlebars
    const handleGeom = new THREE.BoxGeometry(0.8, 0.05, 0.05);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const handle = new THREE.Mesh(handleGeom, handleMat);
    handle.position.set(0, 0.8, 0.4);
    handle.castShadow = true;
    group.add(handle);
    
    // Stem
    const stemGeom = new THREE.BoxGeometry(0.05, 0.5, 0.05);
    const stem = new THREE.Mesh(stemGeom, handleMat);
    stem.position.set(0, 0.6, 0.4);
    stem.castShadow = true;
    group.add(stem);
    
    // Wheels
    const wheelGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    const frontWheel = new THREE.Mesh(wheelGeom, wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.25, 0.5);
    frontWheel.castShadow = true;
    group.add(frontWheel);
    
    const backWheel = new THREE.Mesh(wheelGeom, wheelMat);
    backWheel.rotation.z = Math.PI / 2;
    backWheel.position.set(0, 0.25, -0.5);
    backWheel.castShadow = true;
    group.add(backWheel);
    
    // Set initial position
    group.position.copy(position);
    scene.add(group);
    
    return {
      mesh: group,
      body: null as any, // Will be set after
      balance: 50,
      speed: 0,
      kickedAt: 0,
    };
  }
  
  private createPhysicsBody(position: THREE.Vector3): CANNON.Body {
    const shape = new CANNON.Box(new CANNON.Vec3(this.width / 2, this.height / 2, this.length / 2));
    const body = new CANNON.Body({
      mass: 150, // kg
      shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      linearDamping: 0.3,
      angularDamping: 0.5,
    });
    
    // Lock Y rotation (no flipping)
    body.fixedRotation = true;
    body.updateMassProperties();
    
    return body;
  }
  
  update(deltaTime: number): void {
    // Apply physics step
    this.world.step(deltaTime);
    
    // Update balance recovery
    if (this.physics.balance < 50 && Date.now() / 1000 - this.physics.kickedAt > 3) {
      this.physics.balance = Math.min(100, this.physics.balance + GAME_CONSTANTS.BALANCE_RECOVERY * deltaTime);
    }
    
    // Calculate speed based on balance
    const balanceFactor = this.physics.balance / 100;
    const maxSpeed = GAME_CONSTANTS.MAX_SPEED / 3.6; // Convert km/h to m/s
    
    // Apply throttle
    const forwardForce = new CANNON.Vec3(0, 0, -1);
    forwardForce.scale(this.input.throttle * GAME_CONSTANTS.ACCELERATION * balanceFactor, forwardForce);
    
    // Rotate force to match scooter rotation
    const rotation = this.physics.body.quaternion;
    const rotatedForce = rotation.vmult(forwardForce);
    
    // Apply force at center of mass
    this.physics.body.applyForce(rotatedForce, this.physics.body.position);
    
    // Apply steering (torque around Y axis)
    const steeringTorque = new CANNON.Vec3(0, this.input.steering * GAME_CONSTANTS.HANDLING * -1, 0);
    this.physics.body.applyTorque(steeringTorque);
    
    // Clamp speed
    const velocity = this.physics.body.velocity;
    const currentSpeed = velocity.length();
    if (currentSpeed > maxSpeed * balanceFactor) {
      velocity.scale((maxSpeed * balanceFactor) / currentSpeed, velocity);
      this.physics.body.velocity = velocity;
    }
    
    // Update speed value
    this.physics.speed = currentSpeed * 3.6; // Convert to km/h
    
    // Apply balance wobble (visual only)
    this.applyBalanceWobble();
    
    // Sync mesh with physics body
    this.syncMeshWithBody();
  }
  
  private applyBalanceWobble(): void {
    const balance = this.physics.balance;
    if (balance < 50) {
      // Wobble more as balance decreases
      const wobbleAmount = (50 - balance) / 50 * 0.3; // Max 0.3 radians
      const time = Date.now() / 1000;
      const wobble = Math.sin(time * 10) * wobbleAmount;
      this.physics.mesh.rotation.z = wobble;
    } else {
      this.physics.mesh.rotation.z = 0;
    }
  }
  
  private syncMeshWithBody(): void {
    this.physics.mesh.position.copy(this.physics.body.position as any);
    this.physics.mesh.quaternion.copy(this.physics.body.quaternion as any);
  }
  
  setInput(input: PlayerInput): void {
    this.input = input;
    
    // Handle kick
    if (input.kick && Date.now() / 1000 - this.lastKickTime > GAME_CONSTANTS.KICK_COOLDOWN) {
      this.lastKickTime = Date.now() / 1000;
      this.performKick();
    }
  }
  
  private performKick(): void {
    // Visual kick animation could go here
    console.log('Kick performed!');
  }
  
  receiveKick(): void {
    this.physics.balance = Math.max(0, this.physics.balance - GAME_CONSTANTS.KICK_BALANCE_DAMAGE);
    this.physics.kickedAt = Date.now() / 1000;
    
    // Add backward force
    const kickBack = new CANNON.Vec3(0, 0, 5);
    const rotation = this.physics.body.quaternion;
    const rotatedKickBack = rotation.vmult(kickBack);
    this.physics.body.applyImpulse(rotatedKickBack, this.physics.body.position);
  }
  
  getPosition(): THREE.Vector3 {
    return this.physics.mesh.position.clone();
  }
  
  getRotation(): number {
    // Extract Y rotation from quaternion
    const quaternion = this.physics.mesh.quaternion;
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    return euler.y;
  }
  
  getSpeed(): number {
    return this.physics.speed;
  }
  
  getBalance(): number {
    return this.physics.balance;
  }
  
  destroy(): void {
    this.world.removeBody(this.physics.body);
  }
}

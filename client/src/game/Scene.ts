import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { ScooterController } from './ScooterController';
import { TrafficManager } from './TrafficManager';
import { GAME_CONSTANTS, SCOOTER_COLORS } from '../shared/types';

export class GameScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world: CANNON.World;
  private playerScooter: ScooterController;
  private trafficManager: TrafficManager;
  private aiScooters: ScooterController[] = [];
  private clock: THREE.Clock;
  private lastTime: number = 0;
  
  // UI callbacks
  public onSpeedUpdate: (speed: number) => void = () => {};
  public onBalanceUpdate: (balance: number) => void = () => {};
  public onPositionUpdate: (position: number) => void = () => {};
  public onCollision: () => void = () => {};
  
  constructor(canvas: HTMLCanvasElement) {
    this.clock = new THREE.Clock();
    
    // Setup Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
    this.scene.fog = new THREE.Fog(0x87CEEB, 20, GAME_CONSTANTS.RENDER_DISTANCE);
    
    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Setup physics world
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    
    // Create environment
    this.createEnvironment();
    this.createLighting();
    
    // Create player scooter (red)
    this.playerScooter = new ScooterController(
      this.scene,
      this.world,
      new THREE.Vector3(0, 2, 0),
      SCOOTER_COLORS[0]
    );
    
    // Create AI scooters
    for (let i = 0; i < 5; i++) {
      const offset = (i % 2 === 0 ? 1 : -1) * (2 + Math.floor(i / 2) * 2);
      const aiScooter = new ScooterController(
        this.scene,
        this.world,
        new THREE.Vector3(offset, 2, -i * 3),
        SCOOTER_COLORS[(i + 1) % SCOOTER_COLORS.length]
      );
      this.aiScooters.push(aiScooter);
    }
    
    // Create traffic
    this.trafficManager = new TrafficManager(this.scene);
    
    // Handle resize
    window.addEventListener('resize', () => this.onWindowResize());
  }
  
  private createEnvironment(): void {
    // Ground/Street
    const groundGeom = new THREE.PlaneGeometry(30, 200);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0x444444,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // Sidewalks
    const sidewalkGeom = new THREE.PlaneGeometry(5, 200);
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
    
    const leftSidewalk = new THREE.Mesh(sidewalkGeom, sidewalkMat);
    leftSidewalk.rotation.x = -Math.PI / 2;
    leftSidewalk.position.set(-17.5, 0.1, 0);
    leftSidewalk.receiveShadow = true;
    this.scene.add(leftSidewalk);
    
    const rightSidewalk = new THREE.Mesh(sidewalkGeom, sidewalkMat);
    rightSidewalk.rotation.x = -Math.PI / 2;
    rightSidewalk.position.set(17.5, 0.1, 0);
    rightSidewalk.receiveShadow = true;
    this.scene.add(rightSidewalk);
    
    // Lane markings
    const lineGeom = new THREE.PlaneGeometry(0.2, 200);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    [-6, 0, 6].forEach(x => {
      const line = new THREE.Mesh(lineGeom, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.05, 0);
      this.scene.add(line);
    });
    
    // Buildings (simplified Vietnamese street)
    this.createBuildings();
    
    // Street props
    this.createProps();
    
    // Finish line
    this.createFinishLine();
    
    // Add physics ground
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(groundBody);
  }
  
  private createBuildings(): void {
    const buildingColors = [0xcc9966, 0x99cc99, 0x9999cc, 0xcc9999, 0xcccc99];
    
    // Left side buildings
    for (let i = 0; i < 10; i++) {
      const width = 4 + Math.random() * 3;
      const height = 8 + Math.random() * 8;
      const depth = 8 + Math.random() * 4;
      
      const geom = new THREE.BoxGeometry(width, height, depth);
      const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
      const mat = new THREE.MeshStandardMaterial({ color });
      const building = new THREE.Mesh(geom, mat);
      
      building.position.set(
        -20 - width / 2,
        height / 2,
        -i * 20 + 10
      );
      building.castShadow = true;
      building.receiveShadow = true;
      this.scene.add(building);
      
      // Add windows
      this.addWindows(building, width, height, depth);
    }
    
    // Right side buildings
    for (let i = 0; i < 10; i++) {
      const width = 4 + Math.random() * 3;
      const height = 8 + Math.random() * 8;
      const depth = 8 + Math.random() * 4;
      
      const geom = new THREE.BoxGeometry(width, height, depth);
      const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
      const mat = new THREE.MeshStandardMaterial({ color });
      const building = new THREE.Mesh(geom, mat);
      
      building.position.set(
        20 + width / 2,
        height / 2,
        -i * 20 + 10
      );
      building.castShadow = true;
      building.receiveShadow = true;
      this.scene.add(building);
      
      this.addWindows(building, width, height, depth);
    }
  }
  
  private addWindows(building: THREE.Mesh, width: number, height: number, depth: number): void {
    const windowGeom = new THREE.PlaneGeometry(0.8, 1);
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    
    // Front windows
    for (let y = 2; y < height - 1; y += 3) {
      for (let x = -width / 2 + 1; x < width / 2; x += 1.5) {
        const window = new THREE.Mesh(windowGeom, windowMat);
        window.position.set(x, y, depth / 2 + 0.01);
        building.add(window);
      }
    }
  }
  
  private createProps(): void {
    // Street signs
    for (let i = 0; i < 5; i++) {
      const poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 3);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
      const pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(-12, 1.5, -i * 40);
      pole.castShadow = true;
      this.scene.add(pole);
      
      const signGeom = new THREE.BoxGeometry(0.8, 0.5, 0.1);
      const signMat = new THREE.MeshBasicMaterial({ color: 0x3366cc });
      const sign = new THREE.Mesh(signGeom, signMat);
      sign.position.set(0, 0.5, 0);
      pole.add(sign);
    }
    
    // Vendor stalls
    for (let i = 0; i < 4; i++) {
      const stallGeom = new THREE.BoxGeometry(3, 2.5, 2);
      const stallMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
      const stall = new THREE.Mesh(stallGeom, stallMat);
      stall.position.set(14, 1.25, -i * 50 - 25);
      stall.castShadow = true;
      this.scene.add(stall);
      
      // Awning
      const awningGeom = new THREE.BoxGeometry(3.2, 0.1, 1.5);
      const awningMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const awning = new THREE.Mesh(awningGeom, awningMat);
      awning.position.set(0, 1.3, -0.5);
      stall.add(awning);
    }
    
    // Trees
    for (let i = 0; i < 8; i++) {
      const trunkGeom = new THREE.CylinderGeometry(0.3, 0.4, 2);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.set(i % 2 === 0 ? -15 : 15, 1, -i * 25);
      trunk.castShadow = true;
      this.scene.add(trunk);
      
      const leavesGeom = new THREE.ConeGeometry(2, 4, 8);
      const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
      const leaves = new THREE.Mesh(leavesGeom, leavesMat);
      leaves.position.set(0, 3, 0);
      leaves.castShadow = true;
      trunk.add(leaves);
    }
  }
  
  private createFinishLine(): void {
    const finishGeom = new THREE.BoxGeometry(20, 0.5, 1);
    const finishMat = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
    });
    const finish = new THREE.Mesh(finishGeom, finishMat);
    finish.position.set(0, 0.25, -200);
    this.scene.add(finish);
    
    // Checkered pattern
    for (let i = 0; i < 20; i++) {
      const checkGeom = new THREE.BoxGeometry(1, 0.55, 1);
      const checkMat = new THREE.MeshBasicMaterial({ 
        color: i % 2 === 0 ? 0x000000 : 0xffffff,
      });
      const check = new THREE.Mesh(checkGeom, checkMat);
      check.position.set(-9.5 + i, 0, 0);
      finish.add(check);
    }
    
    // Finish arch
    const archGeom = new THREE.BoxGeometry(20, 6, 1);
    const archMat = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.8,
    });
    const arch = new THREE.Mesh(archGeom, archMat);
    arch.position.set(0, 3, 0);
    finish.add(arch);
  }
  
  private createLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    this.scene.add(dirLight);
    
    // Street lights
    for (let i = 0; i < 6; i++) {
      const light = new THREE.PointLight(0xffaa00, 0.5, 20);
      light.position.set(-12, 5, -i * 40);
      this.scene.add(light);
    }
  }
  
  setPlayerInput(throttle: number, steering: number, kick: boolean): void {
    this.playerScooter.setInput({ throttle, steering, kick });
  }
  
  private updateCamera(): void {
    const playerPos = this.playerScooter.getPosition();
    const playerRot = this.playerScooter.getRotation();
    
    // Camera follows behind player
    const offset = new THREE.Vector3(0, 5, 10);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRot);
    
    const targetPos = playerPos.clone().add(offset);
    this.camera.position.lerp(targetPos, 0.1);
    this.camera.lookAt(playerPos);
  }
  
  private updateAI(deltaTime: number): void {
    // Simple AI: follow waypoints
    this.aiScooters.forEach((scooter, index) => {
      const pos = scooter.getPosition();
      const targetZ = -200 + index * 5; // Race forward
      
      // Simple throttle toward finish
      const throttle = 0.7 + Math.random() * 0.3;
      const steering = Math.sin(Date.now() / 1000 + index) * 0.3;
      
      scooter.setInput({ throttle, steering, kick: false });
      scooter.update(deltaTime);
    });
  }
  
  private checkCollisions(): void {
    const playerPos = this.playerScooter.getPosition();
    
    if (this.trafficManager.checkCollisions(playerPos, 1.5)) {
      this.onCollision();
    }
  }
  
  private updatePosition(): void {
    const playerPos = this.playerScooter.getPosition();
    const progress = Math.max(0, -playerPos.z);
    
    // Calculate position among all scooters
    let position = 1;
    this.aiScooters.forEach(scooter => {
      const aiPos = scooter.getPosition();
      if (-aiPos.z > progress) {
        position++;
      }
    });
    
    this.onPositionUpdate(position);
  }
  
  // Public update method called from game loop
  update(deltaTime: number): void {
    // Update physics
    this.playerScooter.update(deltaTime);
    this.updateAI(deltaTime);
    this.trafficManager.update(deltaTime);
    
    // Update camera
    this.updateCamera();
    
    // Check collisions
    this.checkCollisions();
    
    // Update UI
    this.onSpeedUpdate(this.playerScooter.getSpeed());
    this.onBalanceUpdate(this.playerScooter.getBalance());
    this.updatePosition();
    
    // Render
    this.renderer.render(this.scene, this.camera);
  }
  
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  getFPS(): number {
    const delta = this.clock.getDelta();
    return delta > 0 ? Math.round(1 / delta) : 60;
  }
  
  destroy(): void {
    this.playerScooter.destroy();
    this.aiScooters.forEach(s => s.destroy());
    this.trafficManager.destroy();
    this.renderer.dispose();
    window.removeEventListener('resize', () => this.onWindowResize());
  }
}

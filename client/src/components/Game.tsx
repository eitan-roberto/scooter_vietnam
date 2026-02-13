import { useEffect, useRef, useState, useCallback } from 'react';
import { GameScene } from '../game/Scene';

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameScene | null>(null);
  
  const [speed, setSpeed] = useState(0);
  const [balance, setBalance] = useState(50);
  const [position, setPosition] = useState(1);
  const [fps, setFps] = useState(60);
  
  // Touch controls state
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  const [isKicking, setIsKicking] = useState(false);
  const joystickRef = useRef<{ active: boolean; startX: number; startY: number }>({
    active: false,
    startX: 0,
    startY: 0,
  });

  // Use refs for input state to avoid closure issues
  const keysRef = useRef({ w: false, a: false, s: false, d: false, space: false });

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new GameScene(canvasRef.current);
    gameRef.current = game;

    // Set up callbacks
    game.onSpeedUpdate = setSpeed;
    game.onBalanceUpdate = setBalance;
    game.onPositionUpdate = setPosition;
    game.onCollision = () => {
      console.log('Collision!');
    };

    // FPS counter
    const fpsInterval = setInterval(() => {
      setFps(game.getFPS());
    }, 1000);

    // Keyboard controls - use ref to avoid closure issues
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': keysRef.current.w = true; break;
        case 'a': case 'arrowleft': keysRef.current.a = true; break;
        case 's': case 'arrowdown': keysRef.current.s = true; break;
        case 'd': case 'arrowright': keysRef.current.d = true; break;
        case ' ': keysRef.current.space = true; break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': keysRef.current.w = false; break;
        case 'a': case 'arrowleft': keysRef.current.a = false; break;
        case 's': case 'arrowdown': keysRef.current.s = false; break;
        case 'd': case 'arrowright': keysRef.current.d = false; break;
        case ' ': keysRef.current.space = false; break;
      }
    };

    // Game loop for input
    let animationId: number;
    const updateInput = () => {
      if (!gameRef.current) return;
      
      let throttle = 0;
      let steering = 0;
      
      // Keyboard
      if (keysRef.current.w) throttle = 1;
      if (keysRef.current.s) throttle = -0.5;
      if (keysRef.current.a) steering = -1;
      if (keysRef.current.d) steering = 1;
      
      // Touch joystick overrides
      if (joystickRef.current.active) {
        throttle = -joystick.y;
        steering = joystick.x;
      }
      
      gameRef.current.setPlayerInput(throttle, steering, isKicking || keysRef.current.space);
      animationId = requestAnimationFrame(updateInput);
    };
    
    updateInput();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Focus window for keyboard input
    window.focus();

    return () => {
      clearInterval(fpsInterval);
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      game.destroy();
    };
  }, [joystick, isKicking]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Left side = joystick
    if (x < rect.width / 2) {
      joystickRef.current = {
        active: true,
        startX: x,
        startY: y,
      };
    }
    // Right side = kick
    else {
      setIsKicking(true);
      setTimeout(() => setIsKicking(false), 200);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!joystickRef.current.active) return;
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const dx = (x - joystickRef.current.startX) / 40;
    const dy = (y - joystickRef.current.startY) / 40;
    
    setJoystick({
      x: Math.max(-1, Math.min(1, dx)),
      y: Math.max(-1, Math.min(1, dy)),
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    joystickRef.current.active = false;
    setJoystick({ x: 0, y: 0 });
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none">
        {/* Position */}
        <div className="bg-black/60 text-white px-4 py-2 rounded-lg">
          <span className="text-2xl font-bold">{position}</span>
          <span className="text-sm text-gray-300">/6</span>
        </div>
        
        {/* Timer */}
        <div className="bg-black/60 text-white px-4 py-2 rounded-lg">
          <span className="text-xl font-mono">Race Time</span>
        </div>
        
        {/* FPS */}
        <div className={`px-3 py-1 rounded text-sm ${fps >= 30 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {fps} FPS
        </div>
      </div>
      
      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end pointer-events-none">
        {/* Speed */}
        <div className="bg-black/60 text-white p-4 rounded-lg">
          <div className="text-4xl font-bold font-mono">{Math.round(speed)}</div>
          <div className="text-sm text-gray-300">km/h</div>
          
          {/* Balance bar */}
          <div className="mt-3 w-32">
            <div className="text-xs text-gray-300 mb-1">Balance</div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  balance > 50 ? 'bg-green-500' : balance > 25 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${balance}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Mobile Controls Hint */}
        <div className="text-white/50 text-sm text-right hidden md:block">
          <p>WASD or Arrows to drive</p>
          <p>SPACE to kick</p>
        </div>
      </div>
      
      {/* Touch Controls (Mobile) */}
      <div className="absolute inset-0 pointer-events-none md:hidden">
        {/* Joystick area indicator */}
        <div className="absolute bottom-20 left-8 w-20 h-20 border-2 border-white/30 rounded-full" />
        
        {/* Kick button area */}
        <div className="absolute bottom-20 right-8 w-16 h-16 bg-red-500/50 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">KICK</span>
        </div>
      </div>
      
      {/* Controls indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg text-sm">
        Use WASD or touch controls to drive
      </div>
    </div>
  );
}

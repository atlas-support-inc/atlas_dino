import { useRef, useEffect, useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { audioManager } from "./utils/audioManager";

// Game constants
const GRAVITY = 0.5;
const JUMP_STRENGTH = -12;
const DOUBLE_JUMP_STRENGTH = -10;
const PLAYER_SIZE = 40;
const PLAYER_X = 100;
const INITIAL_GAME_SPEED = 8;

// Particle system for visual effects
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

// Enhanced obstacle types
type ObstacleType = "angry_ticket" | "bug" | "escalation";

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  emoji: string;
}

// Collectible types
type CollectibleType =
  | "automation"
  | "ai_assist"
  | "knowledge_base";

interface Collectible {
  x: number;
  y: number;
  type: CollectibleType;
  emoji: string;
  collected: boolean;
}



const GameScreen = ({
  endGame,
  playerInfo,
}: {
  endGame: () => void;
  playerInfo: { name: string; email: string };
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"playing" | "gameOver">("playing");
  const [showInstructions, setShowInstructions] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(
    audioManager.isMusicEnabled(),
  );
  const [soundsEnabled, setSoundsEnabled] = useState(
    audioManager.areSoundsEnabled(),
  );

  // Enhanced game state
  const playerY = useRef(0);
  const playerVelocity = useRef(0);
  const score = useRef(0);
  const gameSpeed = useRef(INITIAL_GAME_SPEED);
  const obstacles = useRef<Obstacle[]>([]);
  const collectibles = useRef<Collectible[]>([]);
  const particles = useRef<Particle[]>([]);

  const obstacleTimer = useRef(0);
  const collectibleTimer = useRef(0);
  const submitted = useRef(false);

  // Dynamic spawn intervals
  const minObstacleGap = 80;
  const maxObstacleGap = 120;
  const nextObstacleSpawn = useRef(
    Math.random() * (maxObstacleGap - minObstacleGap) + minObstacleGap,
  );

  // Enhanced player state
  const canDoubleJump = useRef(true);
  const isGrounded = useRef(true);
  const lastObstacleX = useRef(0);
  const invincible = useRef(false);
  const speedBoost = useRef(1);


  // Visual effects
  const screenShake = useRef(0);
  const playerRotation = useRef(0);

  // Audio state
  const hasStartedAudio = useRef(false);
  const lastTime = useRef(0);

  const addScore = useMutation(api.myFunctions.addScore);

  // Create particle effect
  const createParticles = (
    x: number,
    y: number,
    count: number,
    color: string,
    spread: number = 5,
  ) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * spread,
        vy: (Math.random() - 0.5) * spread - 2,
        life: 30,
        color,
        size: Math.random() * 4 + 2,
      });
    }
  };

  // Add obstacle with type
  const addObstacle = () => {
    const types: { type: ObstacleType; emoji: string; height: number }[] = [
      { type: "angry_ticket", emoji: "😤", height: 40 },
      { type: "bug", emoji: "🐛", height: 60 },
      { type: "escalation", emoji: "🚨", height: 50 },
    ];

    const obstacleConfig = types[Math.floor(Math.random() * types.length)];

    obstacles.current.push({
      x: canvasRef.current!.width,
      y: canvasRef.current!.height - obstacleConfig.height,
      width: 35,
      height: obstacleConfig.height,
      type: obstacleConfig.type,
      emoji: obstacleConfig.emoji,
    });
  };

  // Add collectible
  const addCollectible = () => {
    const types: { type: CollectibleType; emoji: string }[] = [
      { type: "automation", emoji: "🤖" },
      { type: "ai_assist", emoji: "🧠" },
      { type: "knowledge_base", emoji: "📚" },
    ];

    const collectibleConfig = types[Math.floor(Math.random() * types.length)];
    const yPosition =
      canvasRef.current!.height - 100 - Math.random() * 150;

    collectibles.current.push({
      x: canvasRef.current!.width,
      y: yPosition,
      type: collectibleConfig.type,
      emoji: collectibleConfig.emoji,
      collected: false,
    });
  };

  // Handle power-up activation
  const activatePowerUp = (type: CollectibleType) => {
    switch (type) {
      case "automation":
        speedBoost.current = 1.5;
        setTimeout(() => {
          speedBoost.current = 1;
          audioManager.stopSpecificMusic("speedBoost");
          audioManager.playMusic("background");
        }, 5000);
        createParticles(
          PLAYER_X + PLAYER_SIZE / 2,
          playerY.current + PLAYER_SIZE / 2,
          15,
          "#3b82f6",
          6,
        );
        audioManager.playSound("powerupAutomation");
        audioManager.stopSpecificMusic("invincible"); // Stop any other powerup music
        audioManager.playMusic("speedBoost");
        break;
      case "ai_assist":
        invincible.current = true;
        setTimeout(() => {
          invincible.current = false;
          audioManager.stopSpecificMusic("invincible");
          audioManager.playMusic("background");
        }, 3000);
        createParticles(
          PLAYER_X + PLAYER_SIZE / 2,
          playerY.current + PLAYER_SIZE / 2,
          25,
          "#a855f7",
          10,
        );
        audioManager.playSound("powerupAI");
        audioManager.stopSpecificMusic("speedBoost"); // Stop any other powerup music
        audioManager.playMusic("invincible");
        break;
      case "knowledge_base":
        score.current += 250;
        obstacles.current.forEach((obstacle) => {
          createParticles(
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height / 2,
            15,
            "#f59e0b",
            7,
          );
        });
        obstacles.current = [];
        audioManager.playSound("powerupKnowledge");
        // Knowledge base doesn't change music - it's an instant effect
        break;
    }
  };

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    playerY.current = canvas.height - PLAYER_SIZE;
    playerVelocity.current = 0;
    score.current = 0;
    gameSpeed.current = INITIAL_GAME_SPEED;
    obstacles.current = [];
    collectibles.current = [];
    particles.current = [];
    obstacleTimer.current = 0;
    collectibleTimer.current = 0;
    submitted.current = false;
    nextObstacleSpawn.current =
      Math.random() * (maxObstacleGap - minObstacleGap) + minObstacleGap;
    canDoubleJump.current = true;
    isGrounded.current = true;
    invincible.current = false;
    speedBoost.current = 1;
    screenShake.current = 0;
    playerRotation.current = 0;
    lastTime.current = 0;
    hasStartedAudio.current = false;
    
    // Stop all powerup music when starting
    audioManager.stopSpecificMusic("speedBoost");
    audioManager.stopSpecificMusic("invincible");
    
    setGameState("playing");
    setShowInstructions(false);
  }, []);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  const toggleMusic = useCallback(() => {
    const newMusicEnabled = !musicEnabled;
    setMusicEnabled(newMusicEnabled);
    audioManager.setMusicEnabled(newMusicEnabled);
    if (!newMusicEnabled) {
      audioManager.stopMusic(true);
    } else if (gameState === "playing") {
      audioManager.playMusic("background");
    }
  }, [musicEnabled, gameState]);

  const toggleSounds = useCallback(() => {
    const newSoundsEnabled = !soundsEnabled;
    setSoundsEnabled(newSoundsEnabled);
    audioManager.setSoundsEnabled(newSoundsEnabled);
  }, [soundsEnabled]);

  const handleJump = useCallback(() => {
    if (gameState !== "playing") return;

    if (showInstructions) {
      setShowInstructions(false);
      return;
    }

    // Start background music on first user interaction
    if (!hasStartedAudio.current) {
      hasStartedAudio.current = true;
      audioManager.playMusic("background", true);
    }

    if (isGrounded.current) {
      playerVelocity.current = JUMP_STRENGTH;
      isGrounded.current = false;
      canDoubleJump.current = true;
      playerRotation.current = -15;
      createParticles(
        PLAYER_X + PLAYER_SIZE / 2,
        playerY.current + PLAYER_SIZE,
        5,
        "#60a5fa",
        3,
      );
      audioManager.playSound("jump");
    } else if (canDoubleJump.current) {
      playerVelocity.current = DOUBLE_JUMP_STRENGTH;
      canDoubleJump.current = false;
      playerRotation.current = -20;
      createParticles(
        PLAYER_X + PLAYER_SIZE / 2,
        playerY.current + PLAYER_SIZE / 2,
        8,
        "#818cf8",
        4,
      );
      audioManager.playSound("doubleJump");
    }
  }, [gameState, showInstructions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "gameOver") {
        if (e.code === "Space") {
          e.preventDefault();
          restartGame();
        } else if (e.code === "Escape") {
          e.preventDefault();
          endGame();
        }
      } else if (e.code === "Space") {
        e.preventDefault();
        handleJump();
      }
    };

    const handleMouseDown = () => {
      handleJump();
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleJump();
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("touchstart", handleTouchStart);

    let animationFrameId: number;

    const gameLoop = (currentTime: number) => {
      if (lastTime.current === 0) {
        lastTime.current = currentTime;
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      const deltaTime = (currentTime - lastTime.current) / 1000; // in seconds
      lastTime.current = currentTime;

      if (gameState !== "playing") {
        // Draw game over screen with enhanced stats
        const shakeX =
          Math.random() * screenShake.current - screenShake.current / 2;
        const shakeY =
          Math.random() * screenShake.current - screenShake.current / 2;

        context.save();
        context.translate(shakeX, shakeY);

        context.fillStyle = "#1e293b";
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = "white";
        context.font = "bold 48px system-ui";
        context.textAlign = "center";
        context.fillText(
          "Support Mission Complete!",
          canvas.width / 2,
          canvas.height / 2 - 80,
        );

        context.font = "24px system-ui";
        context.fillText(
          `Final Score: ${score.current}`,
          canvas.width / 2,
          canvas.height / 2 - 20,
        );

        context.restore();

        screenShake.current *= 0.9;
        if (screenShake.current > 0.1) {
          requestAnimationFrame(gameLoop);
        }
        return;
      }

      // Show instructions
      if (showInstructions) {
        context.fillStyle = "#1e293b";
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = "white";
        context.font = "bold 36px system-ui";
        context.textAlign = "center";
        context.fillText("Support Hero! 🦸‍♂️", canvas.width / 2, 150);

        context.font = "20px system-ui";
        context.fillText(
          "Navigate the challenges of customer support!",
          canvas.width / 2,
          200,
        );

        context.font = "18px system-ui";
        context.fillText("🎮 Controls:", canvas.width / 2, 280);
        context.fillText(
          "SPACE or CLICK - Jump (Press twice for double jump!)",
          canvas.width / 2,
          310,
        );

        context.fillText("🎯 Objectives:", canvas.width / 2, 370);
        context.fillText(
          "😤 Avoid angry tickets   🐛 Dodge bugs   🚨 Skip escalations",
          canvas.width / 2,
          400,
        );
        context.fillText(
          "😊 Collect happy customers for bonus points!",
          canvas.width / 2,
          430,
        );

        context.font = "bold 24px system-ui";
        context.fillText(
          "Press SPACE or CLICK to start!",
          canvas.width / 2,
          500,
        );

        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // Update game state
      score.current += Math.floor(300 * speedBoost.current * deltaTime);

      // Gradually increase difficulty
      gameSpeed.current =
        Math.min(40, INITIAL_GAME_SPEED + score.current / 3000) *
        speedBoost.current;

      // Update player physics
      playerVelocity.current += GRAVITY * 60 * deltaTime;
      playerY.current += playerVelocity.current * 60 * deltaTime;


      // Ground collision
      if (playerY.current > canvas.height - PLAYER_SIZE) {
        playerY.current = canvas.height - PLAYER_SIZE;
        playerVelocity.current = 0;
        isGrounded.current = true;
        playerRotation.current = 0;
      }

      // Update rotation
      if (!isGrounded.current) {
        playerRotation.current += 120 * deltaTime;
      }

      // Clear canvas with a solid color for better performance
      context.fillStyle = "#e0f2fe";
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw ground
      context.fillStyle = "#64748b";
      context.fillRect(0, canvas.height - 5, canvas.width, 5);

      // Draw player with rotation
      context.save();
      context.translate(
        PLAYER_X + PLAYER_SIZE / 2,
        playerY.current + PLAYER_SIZE / 2,
      );
      context.rotate((playerRotation.current * Math.PI) / 180);

      // Player emoji (support agent)
      context.font = `${PLAYER_SIZE}px system-ui`;
      context.textAlign = "center";
      context.textBaseline = "middle";

      if (invincible.current) {
        context.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.5;
      }

      context.fillText("🦸‍♂️", 0, 0);
      context.restore();

      // Spawn obstacles
      obstacleTimer.current += deltaTime;
      if (obstacleTimer.current >= nextObstacleSpawn.current / 60) {
        addObstacle();
        obstacleTimer.current = 0;

        // Calculate next spawn time with some randomness
        const difficultyFactor = Math.min(score.current / 10000, 0.5); // 0 to 0.5
        const currentMin = minObstacleGap * (1 - difficultyFactor);
        const currentMax = maxObstacleGap * (1 - difficultyFactor * 0.7);
        nextObstacleSpawn.current =
          Math.random() * (currentMax - currentMin) + currentMin;
      }

      // Spawn collectibles
      collectibleTimer.current += deltaTime;
      if (collectibleTimer.current >= 3) {
        addCollectible();
        collectibleTimer.current = 0;
      }

      // Update and draw obstacles
      obstacles.current = obstacles.current.filter((obstacle) => {
        obstacle.x -= gameSpeed.current * 60 * deltaTime;

        // Draw obstacle
        context.font = `${obstacle.height}px system-ui`;
        context.textAlign = "center";
        context.textBaseline = "bottom";
        context.fillText(
          obstacle.emoji,
          obstacle.x + obstacle.width / 2,
          obstacle.y + obstacle.height,
        );

        // Enhanced collision detection
        const playerCenterX = PLAYER_X + PLAYER_SIZE / 2;
        const playerCenterY = playerY.current + PLAYER_SIZE / 2;
        const obstacleCenterX = obstacle.x + obstacle.width / 2;
        const obstacleCenterY = obstacle.y + obstacle.height / 2;

        const dx = playerCenterX - obstacleCenterX;
        const dy = playerCenterY - obstacleCenterY;
        const distanceSq = dx * dx + dy * dy;
        const collisionDistance = PLAYER_SIZE / 2 + obstacle.width / 2;

        if (
          distanceSq < collisionDistance * collisionDistance &&
          !invincible.current
        ) {
          if (!submitted.current) {
            void addScore({
              name: playerInfo.name,
              email: playerInfo.email,
              score: score.current,
            });
            submitted.current = true;
          }

          // Apply penalty based on obstacle type
          screenShake.current = 20;
          createParticles(playerCenterX, playerCenterY, 30, "#ef4444", 10);
          audioManager.playSound("death");
          audioManager.playMusic("gameOver");
          setGameState("gameOver");
        }

        // Check if player successfully dodged
        if (
          obstacle.x + obstacle.width < PLAYER_X &&
          obstacle.x > lastObstacleX.current - 10
        ) {
          createParticles(
            PLAYER_X + PLAYER_SIZE / 2,
            playerY.current + PLAYER_SIZE / 2,
            10,
            "#10b981",
            5,
          );
          audioManager.playSound("dodge");
        }

        lastObstacleX.current = obstacle.x;

        return obstacle.x + obstacle.width > -50;
      });

      // Update and draw collectibles
      collectibles.current = collectibles.current.filter((collectible) => {
        if (collectible.collected) return false;

        collectible.x -= gameSpeed.current;

        // Floating animation
        const floatY = collectible.y + Math.sin(Date.now() * 0.003) * 5;

        // Draw collectible
        context.save();
        context.font = "30px system-ui";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(collectible.emoji, collectible.x, floatY);
        context.restore();

        // Collision detection (using squared distance for performance)
        const dx = PLAYER_X + PLAYER_SIZE / 2 - collectible.x;
        const dy = playerY.current + PLAYER_SIZE / 2 - floatY;
        const distanceSq = dx * dx + dy * dy;
        const collisionDistance = PLAYER_SIZE / 2 + 20;

        if (distanceSq < collisionDistance * collisionDistance) {
          collectible.collected = true;
          activatePowerUp(collectible.type);
        }

        return collectible.x > -50;
      });

      // Update and draw particles
      particles.current = particles.current.filter((particle) => {
        particle.x += particle.vx * 60 * deltaTime;
        particle.y += particle.vy * 60 * deltaTime;
        particle.vy += 0.2 * 60 * deltaTime;
        particle.life -= 60 * deltaTime;

        context.fillStyle = particle.color;
        context.globalAlpha = particle.life / 30;
        context.fillRect(particle.x, particle.y, particle.size, particle.size);
        context.globalAlpha = 1;

        return particle.life > 0;
      });

      // Draw UI
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, 80);

      context.fillStyle = "#1e293b";
      context.font = "bold 20px system-ui";
      context.textAlign = "left";
      context.fillText(`Score: ${score.current}`, 20, 30);

      // Draw power-up indicators
      const activePowerUps = [];
      if (invincible.current) {
        activePowerUps.push({ text: "🛡️ INVINCIBLE", color: "#a855f7" });
      }
      if (speedBoost.current > 1) {
        activePowerUps.push({ text: "⚡ SPEED BOOST", color: "#3b82f6" });
      }

      activePowerUps.forEach((powerUp, index) => {
        context.fillStyle = powerUp.color;
        context.font = "16px system-ui";
        context.textAlign = "center";
        context.fillText(powerUp.text, canvas.width / 2, 55 + index * 20);
      });

      // Decay combo
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    if (gameState === "playing") {
      lastTime.current = 0;
      animationFrameId = requestAnimationFrame(gameLoop);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("touchstart", handleTouchStart);
      audioManager.stopAllMusic();
    };
  }, [
    gameState,
    showInstructions,
    addScore,
    playerInfo,
    startGame,
    handleJump,
    activatePowerUp,
    restartGame,
    endGame,
  ]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={900}
          height={500}
          className="border-2 border-gray-300 rounded-lg shadow-lg"
        />
        {/* Audio Controls */}
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={toggleMusic}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              musicEnabled
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            }`}
            title={musicEnabled ? "Turn off music" : "Turn on music"}
          >
            🎵
          </button>
          <button
            onClick={toggleSounds}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              soundsEnabled
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            }`}
            title={soundsEnabled ? "Turn off sounds" : "Turn on sounds"}
          >
            🔊
          </button>
        </div>
      </div>
      {gameState === "gameOver" && (
        <div className="flex gap-4">
          <button
            onClick={restartGame}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            Play Again
          </button>
          <button
            onClick={endGame}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default GameScreen;

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

const GameScreen = ({ endGame, playerInfo }: { endGame: () => void; playerInfo: { name: string; email: string } }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');

  // Game state refs
  const playerY = useRef(0);
  const playerVelocity = useRef(0);
  const score = useRef(0);
  const gameSpeed = useRef(5);
  const obstacles = useRef<{ x: number; y: number; width: number; height: number; }[]>([]);
  const obstacleTimer = useRef(0);
  const obstacleSpawnInterval = useRef(120);
  const submitted = useRef(false);

  const addScore = useMutation(api.myFunctions.addScore);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    playerY.current = canvas.height - 50;
    playerVelocity.current = 0;
    score.current = 0;
    gameSpeed.current = 5;
    obstacles.current = [];
    obstacleTimer.current = 0;
    obstacleSpawnInterval.current = 120;
    submitted.current = false;
    setGameState('playing');
  }, []);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const gravity = 0.6;
    const jumpStrength = -20;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && playerY.current >= canvas.height - 51) {
        playerVelocity.current = jumpStrength;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const addObstacle = () => {
      const obstacleHeight = Math.floor(Math.random() * 60) + 20;
      const obstacle = {
        x: canvas.width,
        y: canvas.height - obstacleHeight,
        width: 25,
        height: obstacleHeight,
      };
      obstacles.current.push(obstacle);
    };

    let animationFrameId: number;

    const gameLoop = () => {
      if (gameState !== 'playing') {
        context.fillStyle = 'black';
        context.font = '48px serif';
        context.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
        context.font = '24px serif';
        context.fillText(`Score: ${score.current}`, canvas.width / 2 - 50, canvas.height / 2 + 50);
        return;
      }

      // Update score and speed
      score.current++;
      gameSpeed.current = 5 + score.current / 250;

      // Update player
      playerVelocity.current += gravity;
      playerY.current += playerVelocity.current;

      if (playerY.current > canvas.height - 50) {
        playerY.current = canvas.height - 50;
        playerVelocity.current = 0;
      }

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw player
      context.fillStyle = 'black';
      context.fillRect(50, playerY.current, 50, 50);

      // Spawn obstacles
      obstacleTimer.current++;
      if (obstacleTimer.current >= obstacleSpawnInterval.current) {
        addObstacle();
        obstacleTimer.current = 0;
        obstacleSpawnInterval.current = Math.max(30, 120 - Math.floor(score.current / 150));
      }

      // Draw and update obstacles
      context.fillStyle = 'red';
      obstacles.current = obstacles.current.filter((obstacle) => {
        obstacle.x -= gameSpeed.current;
        context.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        // Collision detection
        if (
          50 < obstacle.x + obstacle.width &&
          50 + 50 > obstacle.x &&
          playerY.current < obstacle.y + obstacle.height &&
          playerY.current + 50 > obstacle.y
        ) {
          if (!submitted.current) {
            addScore({
              name: playerInfo.name,
              email: playerInfo.email,
              score: score.current,
            });
            submitted.current = true;
          }
          setGameState('gameOver');
        }

        return obstacle.x + obstacle.width > 0;
      });


      // Draw score
      context.fillStyle = 'black';
      context.font = '24px serif';
      context.fillText(`Score: ${score.current}`, 10, 30);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    if (gameState === 'playing') {
      startGame();
      gameLoop();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, addScore, playerInfo, startGame]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={800} height={600} className="border" />
      {gameState === 'gameOver' && (
        <div className="flex gap-4">
          <button onClick={restartGame}>Restart</button>
          <button onClick={endGame}>End Game</button>
        </div>
      )}
    </div>
  );
};

export default GameScreen;
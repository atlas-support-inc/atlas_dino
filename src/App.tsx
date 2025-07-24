"use client";

import { useState } from 'react';
import HomeScreen from './HomeScreen';
import GameScreen from './GameScreen';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [playerInfo, setPlayerInfo] = useState({ name: '', email: '' });

  const startGame = (name: string, email: string) => {
    setPlayerInfo({ name, email });
    setScreen('game');
  };

  const endGame = () => {
    setScreen('home');
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-card p-4 border-b">
        <h1 className="text-xl font-bold">Atlas Dino</h1>
      </header>
      <main className="p-8 flex flex-col gap-16">
        {screen === 'home' && <HomeScreen startGame={startGame} />}
        {screen === 'game' && <GameScreen endGame={endGame} playerInfo={playerInfo} />}
      </main>
    </>
  );
}

"use client";

import React, { useState } from 'react';
import HomeScreen from './HomeScreen';
import GameScreen from './GameScreen';
import { api } from "../convex/_generated/api";

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
      <header className="sticky top-0 z-10 bg-light dark:bg-dark p-4 border-b-2 border-slate-200 dark:border-slate-800">
        Dino Runner
      </header>
      <main className="p-8 flex flex-col gap-16">
        {screen === 'home' && <HomeScreen startGame={startGame} />}
        {screen === 'game' && <GameScreen endGame={endGame} playerInfo={playerInfo} />}
      </main>
    </>
  );
}

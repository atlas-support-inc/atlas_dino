import React, { useState } from 'react';
import Leaderboard from './Leaderboard';

const HomeScreen = ({ startGame }: { startGame: (name: string, email: string) => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleStartGame = () => {
    if (name && email) {
      startGame(name, email);
    } else {
      alert('Please enter your name and email to start the game.');
    }
  };

  return (
    <div>
      <h1>Dino Runner</h1>
      <Leaderboard />
      <div>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={handleStartGame}>Start Game</button>
      </div>
    </div>
  );
};

export default HomeScreen;
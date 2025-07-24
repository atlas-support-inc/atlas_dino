import { useState } from 'react';
import Leaderboard from './Leaderboard';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/ui/Card';

const HomeScreen = ({
  startGame,
}: {
  startGame: (name: string, email: string) => void;
}) => {
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
    <div className="container mx-auto flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold tracking-tighter">
          Welcome to Atlas Dino!
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          A thrilling adventure through the world of customer support.
        </p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Start a New Game</CardTitle>
            <CardDescription>
              Enter your details to begin your support quest.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
            <Input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleStartGame}
              className="w-full"
              disabled={!name || !email}
            >
              Start Game
            </Button>
          </CardFooter>
        </Card>
        <Leaderboard />
      </div>
    </div>
  );
};

export default HomeScreen;
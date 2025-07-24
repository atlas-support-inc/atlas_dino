import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from './components/ui/Card';

const Leaderboard = () => {
  const leaderboard = useQuery(api.myFunctions.getLeaderboard);

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏆 Top Support Heroes</CardTitle>
      </CardHeader>
      <CardContent>
        {leaderboard && leaderboard.length > 0 ? (
          <ol className="space-y-2">
            {leaderboard.map((entry, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-md bg-slate-50 p-2"
              >
                <span className="font-semibold">
                  {index + 1}. {entry.player}
                </span>
                <span className="text-slate-600">{entry.score}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-center text-slate-500">
            No heroes have emerged yet. Be the first!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
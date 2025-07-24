import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

const Leaderboard = () => {
  const leaderboard = useQuery(api.myFunctions.getLeaderboard);

  return (
    <div>
      <h2>Leaderboard</h2>
      <ol>
        {leaderboard?.map((entry, index) => (
          <li key={index}>
            {entry.player}: {entry.score}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Leaderboard;
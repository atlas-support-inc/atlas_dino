import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

export const addScore = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    let player = await ctx.db
      .query("players")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    let playerId;
    if (player) {
      playerId = player._id;
    } else {
      playerId = await ctx.db.insert("players", {
        name: args.name,
        email: args.email,
      });
    }

    await ctx.db.insert("scores", {
      playerId,
      score: args.score,
    });
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_score")
      .order("desc")
      .take(10);

    const leaderboard = await Promise.all(
      scores.map(async (score) => {
        const player = await ctx.db.get(score.playerId);
        return {
          player: player?.name,
          score: score.score,
        };
      })
    );

    return leaderboard;
  },
});

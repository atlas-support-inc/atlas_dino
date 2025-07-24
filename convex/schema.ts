import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  players: defineTable({
    name: v.string(),
    email: v.string(),
  }).index("by_email", ["email"]),

  scores: defineTable({
    playerId: v.id("players"),
    score: v.number(),
  }).index("by_score", ["score"]),
});

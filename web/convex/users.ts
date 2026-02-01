import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    userId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, { userId, email, name, image }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: email ?? existing.email,
        name: name ?? existing.name,
        image: image ?? existing.image,
        updatedAt: now,
      });
      return { ok: true, userDocId: existing._id, created: false };
    }

    const userDocId = await ctx.db.insert("users", {
      userId,
      email,
      name,
      image,
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true, userDocId, created: true };
  },
});

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

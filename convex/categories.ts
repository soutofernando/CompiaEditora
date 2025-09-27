import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all active categories
export const list = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return Promise.all(
      categories.map(async (category) => ({
        ...category,
        imageUrl: category.imageId ? await ctx.storage.getUrl(category.imageId) : null,
      }))
    );
  },
});

// Get category by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!category || !category.isActive) {
      return null;
    }

    return {
      ...category,
      imageUrl: category.imageId ? await ctx.storage.getUrl(category.imageId) : null,
    };
  },
});

// Create category
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    slug: v.string(),
    parentId: v.optional(v.id("categories")),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create categories");
    }

    return await ctx.db.insert("categories", {
      ...args,
      isActive: true,
    });
  },
});

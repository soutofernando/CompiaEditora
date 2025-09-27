import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all active products with pagination
export const list = query({
  args: {
    category: v.optional(v.string()),
    type: v.optional(v.union(v.literal("physical"), v.literal("digital"), v.literal("kit"))),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let products;
    
    if (args.search) {
      // Use search index when search term is provided
      const searchQuery = ctx.db
        .query("products")
        .withSearchIndex("search_products", (q) => {
          let searchQ = q.search("title", args.search!).eq("isActive", true);
          if (args.category) {
            searchQ = searchQ.eq("category", args.category);
          }
          if (args.type) {
            searchQ = searchQ.eq("type", args.type);
          }
          return searchQ;
        });
      products = await searchQuery.take(args.limit || 20);
    } else {
      // Use regular queries with indexes
      let query = ctx.db.query("products").withIndex("by_active", (q) => q.eq("isActive", true));
      
      // Apply category filter if provided
      if (args.category) {
        query = ctx.db.query("products")
          .withIndex("by_category", (q) => q.eq("category", args.category!));
      }
      
      // Apply type filter if provided
      if (args.type) {
        query = ctx.db.query("products")
          .withIndex("by_type", (q) => q.eq("type", args.type!));
      }
      
      products = await query.order("desc").take(args.limit || 20);
    }

    return Promise.all(
      products.map(async (product) => ({
        ...product,
        imageUrl: product.imageId ? await ctx.storage.getUrl(product.imageId) : null,
      }))
    );
  },
});

// Get single product by ID
export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product || !product.isActive) {
      return null;
    }

    return {
      ...product,
      imageUrl: product.imageId ? await ctx.storage.getUrl(product.imageId) : null,
    };
  },
});

// Get featured products
export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(8);

    return Promise.all(
      products.map(async (product) => ({
        ...product,
        imageUrl: product.imageId ? await ctx.storage.getUrl(product.imageId) : null,
      }))
    );
  },
});

// Admin: Create product
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    price: v.number(),
    discountPrice: v.optional(v.number()),
    category: v.string(),
    tags: v.array(v.string()),
    type: v.union(v.literal("physical"), v.literal("digital"), v.literal("kit")),
    stock: v.number(),
    isbn: v.optional(v.string()),
    author: v.string(),
    publisher: v.string(),
    pages: v.optional(v.number()),
    language: v.string(),
    imageId: v.optional(v.id("_storage")),
    digitalFileId: v.optional(v.id("_storage")),
    weight: v.optional(v.number()),
    dimensions: v.optional(v.object({
      length: v.number(),
      width: v.number(),
      height: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create products");
    }

    // In a real app, you'd check if user is admin
    return await ctx.db.insert("products", {
      ...args,
      isActive: true,
    });
  },
});

// Admin: Update product
export const update = mutation({
  args: {
    id: v.id("products"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    discountPrice: v.optional(v.number()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    stock: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to update products");
    }

    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

// Admin: Delete product
export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to delete products");
    }

    return await ctx.db.patch(args.id, { isActive: false });
  },
});

// Generate upload URL for product images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to upload files");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

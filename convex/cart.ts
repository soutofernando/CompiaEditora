import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user's cart items
export const getCart = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const itemsWithProducts = await Promise.all(
      cartItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        if (!product || !product.isActive) {
          return null;
        }

        return {
          ...item,
          product: {
            ...product,
            imageUrl: product.imageId ? await ctx.storage.getUrl(product.imageId) : null,
          },
        };
      })
    );

    return itemsWithProducts.filter((item): item is NonNullable<typeof item> => item !== null);
  },
});

// Add item to cart
export const addItem = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to add items to cart");
    }

    const product = await ctx.db.get(args.productId);
    if (!product || !product.isActive) {
      throw new Error("Product not found or inactive");
    }

    if (args.quantity > product.stock) {
      throw new Error("Not enough stock available");
    }

    // Check if item already exists in cart
    const existingItem = await ctx.db
      .query("cartItems")
      .withIndex("by_user_product", (q) => 
        q.eq("userId", userId).eq("productId", args.productId)
      )
      .unique();

    if (existingItem) {
      const newQuantity = existingItem.quantity + args.quantity;
      if (newQuantity > product.stock) {
        throw new Error("Not enough stock available");
      }
      return await ctx.db.patch(existingItem._id, { quantity: newQuantity });
    } else {
      return await ctx.db.insert("cartItems", {
        userId,
        productId: args.productId,
        quantity: args.quantity,
      });
    }
  },
});

// Update cart item quantity
export const updateQuantity = mutation({
  args: {
    itemId: v.id("cartItems"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const cartItem = await ctx.db.get(args.itemId);
    if (!cartItem || cartItem.userId !== userId) {
      throw new Error("Cart item not found");
    }

    const product = await ctx.db.get(cartItem.productId);
    if (!product || args.quantity > product.stock) {
      throw new Error("Not enough stock available");
    }

    if (args.quantity <= 0) {
      return await ctx.db.delete(args.itemId);
    }

    return await ctx.db.patch(args.itemId, { quantity: args.quantity });
  },
});

// Remove item from cart
export const removeItem = mutation({
  args: { itemId: v.id("cartItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const cartItem = await ctx.db.get(args.itemId);
    if (!cartItem || cartItem.userId !== userId) {
      throw new Error("Cart item not found");
    }

    return await ctx.db.delete(args.itemId);
  },
});

// Clear entire cart
export const clearCart = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    await Promise.all(
      cartItems.map((item) => ctx.db.delete(item._id))
    );

    return { success: true };
  },
});

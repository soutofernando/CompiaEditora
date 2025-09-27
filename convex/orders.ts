import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user's orders
export const getUserOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Get order by ID
export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const order = await ctx.db.get(args.id);
    if (!order || order.userId !== userId) {
      return null;
    }

    return order;
  },
});

// Create order from cart
export const createFromCart = mutation({
  args: {
    paymentMethod: v.string(),
    shippingAddress: v.optional(v.object({
      street: v.string(),
      number: v.string(),
      complement: v.optional(v.string()),
      neighborhood: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Get cart items
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    // Build order items and calculate totals
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cartItems) {
      const product = await ctx.db.get(cartItem.productId);
      if (!product || !product.isActive) {
        throw new Error(`Product ${cartItem.productId} not found or inactive`);
      }

      if (cartItem.quantity > product.stock) {
        throw new Error(`Not enough stock for ${product.title}`);
      }

      const price = product.discountPrice || product.price;
      const itemTotal = price * cartItem.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: cartItem.productId,
        title: product.title,
        price,
        quantity: cartItem.quantity,
        type: product.type,
      });

      // Update product stock
      await ctx.db.patch(cartItem.productId, {
        stock: product.stock - cartItem.quantity,
      });
    }

    // Calculate shipping and tax (simplified)
    const hasPhysicalItems = orderItems.some(item => item.type === "physical");
    const shippingCost = hasPhysicalItems ? 15.00 : 0; // Fixed shipping for demo
    const tax = subtotal * 0.1; // 10% tax for demo
    const total = subtotal + shippingCost + tax;

    // Generate order number
    const orderNumber = `COMPIA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const orderId = await ctx.db.insert("orders", {
      userId,
      orderNumber,
      status: "pending",
      items: orderItems,
      subtotal,
      shippingCost,
      tax,
      total,
      paymentMethod: args.paymentMethod,
      paymentStatus: "pending",
      shippingAddress: args.shippingAddress,
      notes: args.notes,
    });

    // Clear cart
    await Promise.all(
      cartItems.map((item) => ctx.db.delete(item._id))
    );

    return { orderId, orderNumber };
  },
});

// Admin: Get all orders
export const getAllOrders = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // In a real app, check if user is admin

    if (args.status) {
      return await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }

    return await ctx.db.query("orders").order("desc").collect();
  },
});

// Admin: Update order status
export const updateStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    trackingCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // In a real app, check if user is admin

    const updates: any = { status: args.status };
    if (args.trackingCode) {
      updates.trackingCode = args.trackingCode;
    }

    return await ctx.db.patch(args.orderId, updates);
  },
});

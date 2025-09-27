import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all active coupons
export const getActiveCoupons = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("coupons")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => 
        q.and(
          q.gte(q.field("validFrom"), Date.now()),
          q.lte(q.field("validUntil"), Date.now())
        )
      )
      .collect();
  },
});

// Validate coupon code
export const validateCoupon = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!coupon) {
      return { valid: false, message: "Cupom não encontrado" };
    }

    if (!coupon.isActive) {
      return { valid: false, message: "Cupom inativo" };
    }

    const now = Date.now();
    if (now < coupon.validFrom) {
      return { valid: false, message: "Cupom ainda não é válido" };
    }

    if (now > coupon.validUntil) {
      return { valid: false, message: "Cupom expirado" };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, message: "Cupom esgotado" };
    }

    return {
      valid: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrderValue: coupon.minOrderValue,
        maxDiscount: coupon.maxDiscount,
      },
    };
  },
});

// Apply coupon to order
export const applyCoupon = mutation({
  args: {
    code: v.string(),
    orderValue: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Validate coupon directly in the mutation
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!coupon) {
      throw new Error("Cupom não encontrado");
    }

    if (!coupon.isActive) {
      throw new Error("Cupom inativo");
    }

    const now = Date.now();
    if (now < coupon.validFrom) {
      throw new Error("Cupom ainda não é válido");
    }

    if (now > coupon.validUntil) {
      throw new Error("Cupom expirado");
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new Error("Cupom esgotado");
    }

    // Check minimum order value
    if (coupon.minOrderValue && args.orderValue < coupon.minOrderValue) {
      throw new Error(`Valor mínimo do pedido: R$ ${coupon.minOrderValue.toFixed(2)}`);
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === "percentage") {
      discount = (args.orderValue * coupon.value) / 100;
    } else {
      discount = coupon.value;
    }

    // Apply maximum discount limit
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    // Don't allow negative discount
    if (discount > args.orderValue) {
      discount = args.orderValue;
    }

    return {
      success: true,
      discount,
      couponCode: coupon.code,
      message: `Desconto de R$ ${discount.toFixed(2)} aplicado!`,
    };
  },
});

// Use coupon (increment usage count)
export const useCoupon = mutation({
  args: { couponId: v.id("coupons") },
  handler: async (ctx, args) => {
    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new Error("Coupon not found");
    }

    return await ctx.db.patch(args.couponId, {
      usedCount: coupon.usedCount + 1,
    });
  },
});

// Admin: Create coupon
export const createCoupon = mutation({
  args: {
    code: v.string(),
    type: v.union(v.literal("percentage"), v.literal("fixed")),
    value: v.number(),
    minOrderValue: v.optional(v.number()),
    maxDiscount: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    validFrom: v.number(),
    validUntil: v.number(),
    applicableCategories: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Check if user is admin
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (userRole?.role !== "admin") {
      throw new Error("Only admins can create coupons");
    }

    // Check if coupon code already exists
    const existingCoupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (existingCoupon) {
      throw new Error("Cupom com este código já existe");
    }

    return await ctx.db.insert("coupons", {
      code: args.code.toUpperCase(),
      type: args.type,
      value: args.value,
      minOrderValue: args.minOrderValue,
      maxDiscount: args.maxDiscount,
      usageLimit: args.usageLimit,
      usedCount: 0,
      validFrom: args.validFrom,
      validUntil: args.validUntil,
      isActive: true,
      applicableCategories: args.applicableCategories,
    });
  },
});

// Admin: Get all coupons
export const getAllCoupons = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Check if user is admin
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (userRole?.role !== "admin") {
      throw new Error("Only admins can view all coupons");
    }

    return await ctx.db.query("coupons").order("desc").collect();
  },
});

// Admin: Update coupon
export const updateCoupon = mutation({
  args: {
    id: v.id("coupons"),
    isActive: v.optional(v.boolean()),
    usageLimit: v.optional(v.number()),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Check if user is admin
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (userRole?.role !== "admin") {
      throw new Error("Only admins can update coupons");
    }

    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

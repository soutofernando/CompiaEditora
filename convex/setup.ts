import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Make the first user an admin automatically
export const setupFirstUserAsAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Check if there are any existing users with roles
    const existingRoles = await ctx.db.query("userRoles").collect();
    
    // If this is the first user, make them admin
    if (existingRoles.length === 0) {
      await ctx.db.insert("userRoles", {
        userId,
        role: "admin",
        permissions: ["all"],
        isActive: true,
      });
      
      return {
        success: true,
        message: "Primeiro usuário configurado como administrador",
        isAdmin: true,
      };
    }

    // Check if current user already has a role
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (userRole) {
      return {
        success: true,
        message: "Usuário já possui função",
        isAdmin: userRole.role === "admin",
      };
    }

    // If not the first user and no role, assign as client
    await ctx.db.insert("userRoles", {
      userId,
      role: "cliente",
      permissions: ["read_own_data"],
      isActive: true,
    });

    return {
      success: true,
      message: "Usuário configurado como cliente",
      isAdmin: false,
    };
  },
});

// Get current user role
export const getCurrentUserRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return userRole?.role || "cliente";
  },
});

// Check if current user is admin (simplified version)
export const isCurrentUserAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return userRole?.role === "admin";
  },
});

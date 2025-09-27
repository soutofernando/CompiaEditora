import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Email notification system (simplified for demo)
export const sendOrderConfirmation = mutation({
  args: {
    orderId: v.id("orders"),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // In a real implementation, you would integrate with an email service
    // like SendGrid, AWS SES, or similar
    
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Simulate email sending
    console.log(`📧 Email enviado para ${args.userEmail}:`);
    console.log(`Pedido ${order.orderNumber} confirmado!`);
    console.log(`Total: R$ ${order.total.toFixed(2)}`);
    
    return {
      success: true,
      message: "Email de confirmação enviado",
    };
  },
});

export const sendShippingNotification = mutation({
  args: {
    orderId: v.id("orders"),
    userEmail: v.string(),
    trackingCode: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Simulate email sending
    console.log(`📧 Email enviado para ${args.userEmail}:`);
    console.log(`Pedido ${order.orderNumber} foi enviado!`);
    console.log(`Código de rastreamento: ${args.trackingCode}`);
    
    return {
      success: true,
      message: "Email de envio enviado",
    };
  },
});

// Get notification settings for user
export const getNotificationSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // In a real app, you'd store these in a user preferences table
    return {
      emailNotifications: true,
      orderUpdates: true,
      promotions: false,
      newsletter: true,
    };
  },
});

// Update notification settings
export const updateNotificationSettings = mutation({
  args: {
    emailNotifications: v.boolean(),
    orderUpdates: v.boolean(),
    promotions: v.boolean(),
    newsletter: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // In a real app, you'd save these to a user preferences table
    console.log("Notification settings updated:", args);
    
    return {
      success: true,
      message: "Configurações de notificação atualizadas",
    };
  },
});
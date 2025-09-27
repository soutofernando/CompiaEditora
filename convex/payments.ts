import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// PIX payment integration (simplified for demo)
export const generatePixPayment = action({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    // In a real implementation, you would integrate with a payment provider
    // like PagSeguro, Mercado Pago, or Stripe for Brazil
    
    // Generate a mock PIX code for demonstration
    const pixCode = `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString(36).substr(2, 32)}520400005303986540${args.amount.toFixed(2)}5802BR5925COMPIA EDITORA LTDA6009SAO PAULO62070503***6304`;
    
    // In production, you would:
    // 1. Call the payment provider API
    // 2. Generate the actual PIX QR code
    // 3. Store payment details in database
    
    return {
      pixCode,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`,
      expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
    };
  },
});

// Credit card payment processing (mock)
export const processCreditCardPayment = action({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
    cardData: v.object({
      number: v.string(),
      holderName: v.string(),
      expiryMonth: v.string(),
      expiryYear: v.string(),
      cvv: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // In a real implementation, you would integrate with a payment processor
    // This is a mock implementation for demonstration
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      return {
        success: true,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: "Pagamento processado com sucesso",
      };
    } else {
      return {
        success: false,
        error: "Cartão recusado. Verifique os dados ou tente outro cartão.",
      };
    }
  },
});

// Update payment status
export const updatePaymentStatus = mutation({
  args: {
    orderId: v.id("orders"),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const updates: any = { paymentStatus: args.paymentStatus };
    if (args.transactionId) {
      updates.transactionId = args.transactionId;
    }

    // If payment is successful, update order status
    if (args.paymentStatus === "paid") {
      updates.status = "confirmed";
    }

    return await ctx.db.patch(args.orderId, updates);
  },
});

// Get payment methods available
export const getPaymentMethods = query({
  args: {},
  handler: async (ctx) => {
    return [
      {
        id: "pix",
        name: "PIX",
        description: "Pagamento instantâneo",
        icon: "💳",
        processingTime: "Instantâneo",
      },
      {
        id: "credit_card",
        name: "Cartão de Crédito",
        description: "Visa, Mastercard, Elo",
        icon: "💳",
        processingTime: "1-2 dias úteis",
      },
      {
        id: "boleto",
        name: "Boleto Bancário",
        description: "Pagamento em até 3 dias úteis",
        icon: "🏦",
        processingTime: "1-3 dias úteis",
      },
    ];
  },
});

import { action, query } from "./_generated/server";
import { v } from "convex/values";

// Brazilian postal code (CEP) validation and shipping calculation
export const calculateShipping = action({
  args: {
    zipCode: v.string(),
    items: v.array(v.object({
      weight: v.number(),
      dimensions: v.optional(v.object({
        length: v.number(),
        width: v.number(),
        height: v.number(),
      })),
      type: v.union(v.literal("physical"), v.literal("digital"), v.literal("kit")),
    })),
  },
  handler: async (ctx, args) => {
    // Filter only physical items for shipping
    const physicalItems = args.items.filter(item => item.type === "physical");
    
    if (physicalItems.length === 0) {
      return {
        options: [],
        message: "Nenhum item físico no pedido - frete não necessário",
      };
    }

    // Calculate total weight and dimensions
    const totalWeight = physicalItems.reduce((sum, item) => sum + item.weight, 0);
    
    // Simplified shipping calculation (in a real app, integrate with Correios API)
    const shippingOptions = [
      {
        id: "pac",
        name: "PAC",
        description: "Entrega em 8-12 dias úteis",
        price: Math.max(15.00, totalWeight * 8.50),
        deliveryTime: "8-12 dias úteis",
      },
      {
        id: "sedex",
        name: "SEDEX",
        description: "Entrega em 2-4 dias úteis",
        price: Math.max(25.00, totalWeight * 15.00),
        deliveryTime: "2-4 dias úteis",
      },
    ];

    // Add express option for São Paulo metro area (simplified check)
    if (args.zipCode.startsWith("01") || args.zipCode.startsWith("04")) {
      shippingOptions.push({
        id: "express",
        name: "Entrega Expressa",
        description: "Entrega no mesmo dia (São Paulo)",
        price: Math.max(35.00, totalWeight * 20.00),
        deliveryTime: "Mesmo dia",
      });
    }

    return {
      options: shippingOptions,
      totalWeight,
      message: "Opções de frete calculadas com sucesso",
    };
  },
});

// Validate Brazilian postal code (CEP)
export const validateZipCode = action({
  args: { zipCode: v.string() },
  handler: async (ctx, args) => {
    const cleanZipCode = args.zipCode.replace(/\D/g, '');
    
    if (cleanZipCode.length !== 8) {
      return { valid: false, message: "CEP deve ter 8 dígitos" };
    }

    // In a real implementation, you would call ViaCEP API or similar
    // For demo purposes, we'll simulate address lookup
    const mockAddresses: Record<string, any> = {
      "01310100": {
        street: "Avenida Paulista",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
      },
      "20040020": {
        street: "Rua da Assembleia",
        neighborhood: "Centro",
        city: "Rio de Janeiro",
        state: "RJ",
      },
    };

    const addressInfo = mockAddresses[cleanZipCode];
    
    if (addressInfo) {
      return {
        valid: true,
        zipCode: cleanZipCode,
        ...addressInfo,
      };
    }

    return {
      valid: true,
      zipCode: cleanZipCode,
      message: "CEP válido (endereço não encontrado na base de dados)",
    };
  },
});

// Get shipping methods
export const getShippingMethods = query({
  args: {},
  handler: async (ctx) => {
    return [
      {
        id: "pac",
        name: "PAC",
        description: "Correios - Econômico",
        estimatedDays: "8-12 dias úteis",
      },
      {
        id: "sedex",
        name: "SEDEX",
        description: "Correios - Rápido",
        estimatedDays: "2-4 dias úteis",
      },
      {
        id: "express",
        name: "Entrega Expressa",
        description: "Mesmo dia (regiões selecionadas)",
        estimatedDays: "Mesmo dia",
      },
      {
        id: "pickup",
        name: "Retirada no Local",
        description: "Retire na nossa loja",
        estimatedDays: "Imediato",
      },
    ];
  },
});

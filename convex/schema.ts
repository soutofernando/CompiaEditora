import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Products table for books and digital content
  products: defineTable({
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
    isActive: v.boolean(),
    weight: v.optional(v.number()), // for shipping calculation
    dimensions: v.optional(v.object({
      length: v.number(),
      width: v.number(),
      height: v.number(),
    })),
  })
    .index("by_category", ["category"])
    .index("by_type", ["type"])
    .index("by_active", ["isActive"])
    .searchIndex("search_products", {
      searchField: "title",
      filterFields: ["category", "type", "isActive"],
    }),

  // Categories for organizing products
  categories: defineTable({
    name: v.string(),
    description: v.string(),
    slug: v.string(),
    parentId: v.optional(v.id("categories")),
    imageId: v.optional(v.id("_storage")),
    isActive: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_parent", ["parentId"])
    .index("by_active", ["isActive"]),

  // Shopping cart items
  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_product", ["userId", "productId"]),

  // Orders
  orders: defineTable({
    userId: v.id("users"),
    orderNumber: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    items: v.array(v.object({
      productId: v.id("products"),
      title: v.string(),
      price: v.number(),
      quantity: v.number(),
      type: v.union(v.literal("physical"), v.literal("digital"), v.literal("kit")),
    })),
    subtotal: v.number(),
    shippingCost: v.number(),
    tax: v.number(),
    total: v.number(),
    paymentMethod: v.string(),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded")
    ),
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
    trackingCode: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_order_number", ["orderNumber"]),

  // Customer addresses
  addresses: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("billing"), v.literal("shipping")),
    street: v.string(),
    number: v.string(),
    complement: v.optional(v.string()),
    neighborhood: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    isDefault: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"]),

  // Reviews and ratings
  reviews: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    rating: v.number(), // 1-5 stars
    title: v.string(),
    comment: v.string(),
    isVerifiedPurchase: v.boolean(),
    isApproved: v.boolean(),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"])
    .index("by_approved", ["isApproved"]),

  // Coupons and discounts
  coupons: defineTable({
    code: v.string(),
    type: v.union(v.literal("percentage"), v.literal("fixed")),
    value: v.number(),
    minOrderValue: v.optional(v.number()),
    maxDiscount: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    usedCount: v.number(),
    validFrom: v.number(),
    validUntil: v.number(),
    isActive: v.boolean(),
    applicableCategories: v.optional(v.array(v.string())),
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"]),

  // Newsletter subscriptions
  newsletters: defineTable({
    email: v.string(),
    isActive: v.boolean(),
    subscribedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_active", ["isActive"]),

  // User roles and permissions
  userRoles: defineTable({
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("vendedor"),
      v.literal("cliente")
    ),
    permissions: v.array(v.string()),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role"]),

  // Activity logs
  activityLogs: defineTable({
    userId: v.id("users"),
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    details: v.optional(v.string()),
    timestamp: v.number(),
    ipAddress: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const plans = sqliteTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  platform: text("platform").notNull().default("default"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("usd"),
  interval: text("interval", { enum: ["month", "year"] }).notNull(),
  paddlePriceId: text("paddle_price_id"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull().default("datetime('now')"),
});

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    planId: text("plan_id").notNull().references(() => plans.id),
    platform: text("platform").notNull().default("default"),
    status: text("status", {
      enum: ["active", "canceled", "past_due", "incomplete", "trialing"],
    }).notNull().default("incomplete"),
    currentPeriodStart: text("current_period_start").notNull(),
    currentPeriodEnd: text("current_period_end").notNull(),
    paddleSubscriptionId: text("paddle_subscription_id"),
    paddleCustomerId: text("paddle_customer_id"),
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull().default("datetime('now')"),
    updatedAt: text("updated_at").notNull().default("datetime('now')"),
  },
  (t) => ({
    userIdIdx: index("idx_subscriptions_user_id").on(t.userId),
    platformIdx: index("idx_subscriptions_platform").on(t.platform),
    paddleSubIdx: index("idx_subscriptions_paddle_sub").on(t.paddleSubscriptionId),
  }),
);

export const invoices = sqliteTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    platform: text("platform").notNull().default("default"),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("usd"),
    status: text("status", { enum: ["paid", "unpaid", "past_due"] }).notNull().default("unpaid"),
    paddleInvoiceId: text("paddle_invoice_id"),
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull().default("datetime('now')"),
  },
  (t) => ({
    userIdIdx: index("idx_invoices_user_id").on(t.userId),
    platformIdx: index("idx_invoices_platform").on(t.platform),
    subIdIdx: index("idx_invoices_subscription_id").on(t.subscriptionId),
  }),
);

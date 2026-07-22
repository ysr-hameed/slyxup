import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const plans = sqliteTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  platform: text("platform").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  interval: text("interval").notNull(),
  paddlePriceId: text("paddle_price_id"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull(),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: text("plan_id").notNull(),
  platform: text("platform").notNull(),
  status: text("status").notNull().default("incomplete"),
  currentPeriodStart: text("current_period_start"),
  currentPeriodEnd: text("current_period_end"),
  paddleSubscriptionId: text("paddle_subscription_id"),
  paddleCustomerId: text("paddle_customer_id"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id").notNull(),
  userId: text("user_id").notNull(),
  platform: text("platform").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull(),
  paddleInvoiceId: text("paddle_invoice_id"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull(),
});

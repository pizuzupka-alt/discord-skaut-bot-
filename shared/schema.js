const { pgTable, text, integer, timestamp, boolean, decimal } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// Tabulka uživatelů
const users = pgTable('users', {
  id: text('id').primaryKey(), // Discord user ID
  username: text('username').notNull(),
  money: decimal('money', { precision: 15, scale: 2 }).notNull().default('1000.00'), // Začíná s 1000 penězi
  bank: decimal('bank', { precision: 15, scale: 2 }).notNull().default('0.00'), // Bankovní účet
  experience: integer('experience').notNull().default(0),
  level: integer('level').notNull().default(1),
  job: text('job').default('nezaměstnaný'), // Povolání
  lastDaily: timestamp('last_daily'),
  lastWork: timestamp('last_work'),
  lastRob: timestamp('last_rob'),
  lastSlot: timestamp('last_slot'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabulka investic
const investments = pgTable('investments', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // akcie, crypto, nemovitosti
  name: text('name').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  buyPrice: decimal('buy_price', { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal('current_price', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabulka předmětů v inventáři
const inventory = pgTable('inventory', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: text('user_id').notNull().references(() => users.id),
  itemName: text('item_name').notNull(),
  itemType: text('item_type').notNull(), // tool, luxury, collectible
  quantity: integer('quantity').notNull().default(1),
  value: decimal('value', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabulka transakcí
const transactions = pgTable('transactions', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // daily, work, gamble, rob, invest, buy, sell
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabulka povolání
const jobs = pgTable('jobs', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull().unique(),
  minSalary: decimal('min_salary', { precision: 10, scale: 2 }).notNull(),
  maxSalary: decimal('max_salary', { precision: 10, scale: 2 }).notNull(),
  requiredLevel: integer('required_level').notNull().default(1),
  description: text('description'),
});

// Relace
const usersRelations = relations(users, ({ many }) => ({
  investments: many(investments),
  inventory: many(inventory),
  transactions: many(transactions),
}));

const investmentsRelations = relations(investments, ({ one }) => ({
  user: one(users, {
    fields: [investments.userId],
    references: [users.id],
  }),
}));

const inventoryRelations = relations(inventory, ({ one }) => ({
  user: one(users, {
    fields: [inventory.userId],
    references: [users.id],
  }),
}));

const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

module.exports = {
  users,
  investments,
  inventory,
  transactions,
  jobs,
  usersRelations,
  investmentsRelations,
  inventoryRelations,
  transactionsRelations,
};
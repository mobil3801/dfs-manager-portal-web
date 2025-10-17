import { boolean, pgEnum, pgTable, text, timestamp, varchar, integer, numeric } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Gas Station Management Tables

export const gasStations = pgTable("gas_stations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: varchar("zip_code", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type GasStation = typeof gasStations.$inferSelect;
export type InsertGasStation = typeof gasStations.$inferInsert;

export const employeeRoleEnum = pgEnum("employee_role", ["manager", "cashier", "attendant"]);

export const employees = pgTable("employees", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  gasStationId: varchar("gas_station_id", { length: 36 }).references(() => gasStations.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: varchar("email", { length: 320 }).unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  role: employeeRoleEnum("employee_role").notNull(),
  profilePictureUrl: text("profile_picture_url"),
  idDocumentUrl: text("id_document_url"),
  idDocumentType: varchar("id_document_type", { length: 50 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

export const shiftStatusEnum = pgEnum("shift_status", ["open", "closed"]);

export const shifts = pgTable("shifts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  gasStationId: varchar("gas_station_id", { length: 36 }).references(() => gasStations.id).notNull(),
  employeeId: varchar("employee_id", { length: 36 }).references(() => employees.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: shiftStatusEnum("status").default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = typeof shifts.$inferInsert;

export const shiftReports = pgTable("shift_reports", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  shiftId: varchar("shift_id", { length: 36 }).references(() => shifts.id).notNull(),
  gasStationId: varchar("gas_station_id", { length: 36 }).references(() => gasStations.id).notNull(),
  employeeId: varchar("employee_id", { length: 36 }).references(() => employees.id).notNull(),
  openingCash: numeric("opening_cash", { precision: 10, scale: 2 }).notNull(),
  closingCash: numeric("closing_cash", { precision: 10, scale: 2 }).notNull(),
  totalSales: numeric("total_sales", { precision: 10, scale: 2 }).notNull(),
  cashSales: numeric("cash_sales", { precision: 10, scale: 2 }).notNull(),
  creditCardSales: numeric("credit_card_sales", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ShiftReport = typeof shiftReports.$inferSelect;
export type InsertShiftReport = typeof shiftReports.$inferInsert;

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "credit_card", "debit_card"]);

export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  gasStationId: varchar("gas_station_id", { length: 36 }).references(() => gasStations.id).notNull(),
  shiftId: varchar("shift_id", { length: 36 }).references(() => shifts.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

export const expenseCategoryEnum = pgEnum("expense_category", [
  "utilities",
  "maintenance",
  "supplies",
  "payroll",
  "rent",
  "insurance",
  "other"
]);

export const expenses = pgTable("expenses", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  gasStationId: varchar("gas_station_id", { length: 36 }).references(() => gasStations.id).notNull(),
  category: expenseCategoryEnum("category").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  expenseDate: timestamp("expense_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

export const fuelDeliveries = pgTable("fuel_deliveries", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  gasStationId: varchar("gas_station_id", { length: 36 }).references(() => gasStations.id).notNull(),
  fuelType: varchar("fuel_type", { length: 50 }).notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  pricePerGallon: numeric("price_per_gallon", { precision: 10, scale: 2 }).notNull(),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }).notNull(),
  supplier: text("supplier").notNull(),
  billOfLading: varchar("bill_of_lading", { length: 100 }),
  deliveryDate: timestamp("delivery_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type FuelDelivery = typeof fuelDeliveries.$inferSelect;
export type InsertFuelDelivery = typeof fuelDeliveries.$inferInsert;


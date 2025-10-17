import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, date, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Gas Station Management Tables

export const gasStations = mysqlTable("gas_stations", {
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

export const employees = mysqlTable("employees", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  gasStationId: varchar("gas_station_id", { length: 36 }).references(() => gasStations.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: varchar("email", { length: 320 }).unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  role: mysqlEnum("employee_role", ["manager", "cashier", "attendant"]).notNull(),
  profilePictureUrl: text("profile_picture_url"),
  idDocumentUrl: text("id_document_url"),
  idDocumentType: varchar("id_document_type", { length: 50 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

export const shifts = mysqlTable("shifts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  gasStationId: varchar("gas_station_id", { length: 36 }).references(() => gasStations.id).notNull(),
  employeeId: varchar("employee_id", { length: 36 }).references(() => employees.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = typeof shifts.$inferInsert;

export const shiftClosingReports = mysqlTable("shift_closing_reports", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  shiftId: varchar("shift_id", { length: 36 }).references(() => shifts.id).notNull(),
  stationNumber: int("station_number"),
  totalSales: int("total_sales").notNull(), // in cents
  totalTax: int("total_tax").notNull(), // in cents
  cashAmount: int("cash_amount").notNull(), // in cents
  creditAmount: int("credit_amount").notNull(), // in cents
  debitAmount: int("debit_amount").notNull(), // in cents
  mobileAmount: int("mobile_amount").notNull(), // in cents
  overShortAmount: int("over_short_amount").notNull(), // in cents
  fuelSales: int("fuel_sales").notNull(), // in cents
  grocerySales: int("grocery_sales").notNull(), // in cents
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export type ShiftClosingReport = typeof shiftClosingReports.$inferSelect;
export type InsertShiftClosingReport = typeof shiftClosingReports.$inferInsert;

export const transactions = mysqlTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  gasStationId: varchar("gas_station_id", { length: 36 }).references(() => gasStations.id).notNull(),
  shiftClosingReportId: varchar("shift_closing_report_id", { length: 36 }).references(() => shiftClosingReports.id),
  type: mysqlEnum("transaction_type", ["fuel_sale", "store_sale", "expense", "fuel_delivery", "other"]).notNull(),
  amount: int("amount").notNull(), // in cents
  description: text("description"),
  transactionDate: timestamp("transaction_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

export const expenses = mysqlTable("expenses", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  gasStationId: varchar("gas_station_id", { length: 36 }).references(() => gasStations.id).notNull(),
  category: mysqlEnum("expense_category", ["payroll", "utilities", "maintenance", "supplies", "rent", "insurance", "taxes", "other"]).notNull(),
  amount: int("amount").notNull(), // in cents
  description: text("description"),
  expenseDate: date("expense_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

export const fuelDeliveries = mysqlTable("fuel_deliveries", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  gasStationId: varchar("gas_station_id", { length: 36 }).references(() => gasStations.id).notNull(),
  billOfLadingNumber: varchar("bill_of_lading_number", { length: 100 }).unique().notNull(),
  deliveryDate: date("delivery_date").notNull(),
  supplier: text("supplier"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type FuelDelivery = typeof fuelDeliveries.$inferSelect;
export type InsertFuelDelivery = typeof fuelDeliveries.$inferInsert;

export const fuelDeliveryItems = mysqlTable("fuel_delivery_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  fuelDeliveryId: varchar("fuel_delivery_id", { length: 36 }).references(() => fuelDeliveries.id).notNull(),
  fuelGrade: mysqlEnum("fuel_grade", ["regular", "plus", "premium", "diesel"]).notNull(),
  quantity: int("quantity").notNull(), // in gallons (whole number)
  pricePerGallon: int("price_per_gallon").notNull(), // in cents
  cost: int("cost").notNull(), // in cents (calculated based on fuel type)
  totalCost: int("total_cost").notNull(), // in cents
  yellowMark: varchar("yellow_mark", { length: 50 }), // Yellow Mark Value from Bill of Lading
  redMark: varchar("red_mark", { length: 50 }), // Red Mark Value from Bill of Lading
});

export type FuelDeliveryItem = typeof fuelDeliveryItems.$inferSelect;
export type InsertFuelDeliveryItem = typeof fuelDeliveryItems.$inferInsert;

export const fuelInventory = mysqlTable("fuel_inventory", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  gasStationId: varchar("gas_station_id", { length: 36 }).references(() => gasStations.id).notNull(),
  fuelGrade: mysqlEnum("fuel_grade_inventory", ["regular", "plus", "premium", "diesel"]).notNull(),
  quantity: int("quantity").notNull(), // in gallons (whole number)
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export type FuelInventory = typeof fuelInventory.$inferSelect;
export type InsertFuelInventory = typeof fuelInventory.$inferInsert;

